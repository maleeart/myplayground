/**
 * ByteTrack Multi-Object Tracker (Pure TypeScript)
 * 
 * Implements two-stage association matching:
 * 1. High-confidence detections matched with confirmed tracks
 * 2. Low-confidence detections matched with remaining tracks to persist across occlusion
 * 
 * Uses KalmanBoxTracker for motion estimation and smooth trajectory prediction.
 */

import type { BoundingBox } from './kalman';
import { KalmanBoxTracker } from './kalman';
import type { Point2D } from './homography';

export interface Detection {
  bbox: BoundingBox;
  score: number;
  class: string;
}

export type TrackState = 'New' | 'Tracked' | 'Lost' | 'Removed';

export interface TrajectoryPoint {
  pixel: Point2D;
  metric?: Point2D;
  timestamp: number;
}

export class STrack {
  public static nextId = 1;

  public id: number;
  public kalman: KalmanBoxTracker;
  public class: string;
  public score: number;
  public state: TrackState = 'New';
  public age = 0;
  public timeSinceUpdate = 0;
  public hits = 0;

  // Trajectory history for path rendering and velocity calculation
  public history: TrajectoryPoint[] = [];

  // Speeds (km/h)
  public currentSpeedKmh = 0;
  public averageSpeedKmh = 0;
  public maxSpeedKmh = 0;
  public speedSamples: number[] = [];

  constructor(detection: Detection, timestamp: number) {
    this.id = STrack.nextId++;
    this.kalman = new KalmanBoxTracker(detection.bbox);
    this.class = detection.class;
    this.score = detection.score;

    const basePoint = this.kalman.getBottomCenter();
    this.history.push({
      pixel: basePoint,
      timestamp,
    });
  }

  public predict(): BoundingBox {
    this.age++;
    this.timeSinceUpdate++;
    return this.kalman.predict();
  }

  public update(detection: Detection, timestamp: number): void {
    this.kalman.update(detection.bbox);
    this.score = detection.score;
    this.class = detection.class;
    this.hits++;
    this.timeSinceUpdate = 0;

    if (this.state === 'New' && this.hits >= 2) {
      this.state = 'Tracked';
    }

    const basePoint = this.kalman.getBottomCenter();
    this.history.push({
      pixel: basePoint,
      timestamp,
    });

    // Keep history length bounded to prevent memory growth
    if (this.history.length > 50) {
      this.history.shift();
    }
  }

  public markLost(): void {
    this.state = 'Lost';
  }

  public markRemoved(): void {
    this.state = 'Removed';
  }

  public getBbox(): BoundingBox {
    return this.kalman.toBbox();
  }

  public getBottomCenter(): Point2D {
    return this.kalman.getBottomCenter();
  }
}

export class ByteTracker {
  private tracks: STrack[] = [];
  private highScoreThresh: number;
  private lowScoreThresh: number;
  private matchThresh: number;
  private maxAge: number;

  constructor(options?: {
    highScoreThresh?: number;
    lowScoreThresh?: number;
    matchThresh?: number;
    maxAge?: number;
  }) {
    this.highScoreThresh = options?.highScoreThresh ?? 0.22;
    this.lowScoreThresh = options?.lowScoreThresh ?? 0.10;
    this.matchThresh = options?.matchThresh ?? 0.75; // IoU distance threshold
    this.maxAge = options?.maxAge ?? 35; // Frames tolerance for temporary occlusion
  }

  /**
   * Main tracking step for each video frame
   */
  public update(detections: Detection[], timestamp: number): STrack[] {
    // 1. Predict all current tracks with Kalman filter
    for (const track of this.tracks) {
      track.predict();
    }

    // 2. Separate detections by confidence threshold
    const highDets: Detection[] = [];
    const lowDets: Detection[] = [];

    for (const det of detections) {
      if (det.score >= this.highScoreThresh) {
        highDets.push(det);
      } else if (det.score >= this.lowScoreThresh) {
        lowDets.push(det);
      }
    }

    // 3. First Association: High-confidence detections with active/lost tracks
    const activeTracks = this.tracks.filter((t) => t.state !== 'Removed');
    const [matches1, unmatchedTracks1, unmatchedHighDets] = this.associate(
      activeTracks,
      highDets,
      this.matchThresh
    );

    for (const [trackIdx, detIdx] of matches1) {
      activeTracks[trackIdx].update(highDets[detIdx], timestamp);
      activeTracks[trackIdx].state = 'Tracked';
    }

    // 4. Second Association: Low-confidence detections with remaining tracks (recovers temporary occlusion)
    const remainingTracks = unmatchedTracks1.map((idx) => activeTracks[idx]);
    const [matches2, unmatchedTracks2] = this.associate(
      remainingTracks,
      lowDets,
      0.8 // slightly more permissive for recovering occluded tracks
    );

    for (const [trackIdx, detIdx] of matches2) {
      remainingTracks[trackIdx].update(lowDets[detIdx], timestamp);
      remainingTracks[trackIdx].state = 'Tracked';
    }

    // 5. Unmatched tracks after both steps become Lost or Removed
    for (const trackIdx of unmatchedTracks2) {
      const track = remainingTracks[trackIdx];
      if (track.timeSinceUpdate > this.maxAge) {
        track.markRemoved();
      } else {
        track.markLost();
      }
    }

    // 6. Initialize new tracks from unmatched high-confidence detections
    for (const detIdx of unmatchedHighDets) {
      const newTrack = new STrack(highDets[detIdx], timestamp);
      this.tracks.push(newTrack);
    }

    // 7. Cleanup removed tracks
    this.tracks = this.tracks.filter((t) => t.state !== 'Removed');

    // Return tracks that are confirmed or newly active
    return this.tracks.filter((t) => t.state === 'Tracked' || t.hits >= 1);
  }

  public getTrackById(id: number): STrack | undefined {
    return this.tracks.find((t) => t.id === id);
  }

  public getAllTracks(): STrack[] {
    return this.tracks;
  }

  /**
   * Associate tracks and detections using IoU distance matrix and greedy matching
   */
  private associate(
    tracks: STrack[],
    dets: Detection[],
    distThresh: number
  ): [Array<[number, number]>, number[], number[]] {
    if (tracks.length === 0) {
      return [[], [], dets.map((_, i) => i)];
    }
    if (dets.length === 0) {
      return [[], tracks.map((_, i) => i), []];
    }

    // Cost matrix: IoU distance (1 - IoU)
    const costMatrix: number[][] = [];
    for (let i = 0; i < tracks.length; i++) {
      costMatrix[i] = [];
      const trackBbox = tracks[i].getBbox();
      for (let j = 0; j < dets.length; j++) {
        const iou = this.computeIoU(trackBbox, dets[j].bbox);
        costMatrix[i][j] = 1 - iou;
      }
    }

    // Greedy min-cost matching (fast, accurate for real-time mobile frame rates)
    const matches: Array<[number, number]> = [];
    const matchedTracks = new Set<number>();
    const matchedDets = new Set<number>();

    // Flatten candidates and sort by distance
    const candidates: Array<{ track: number; det: number; cost: number }> = [];
    for (let i = 0; i < tracks.length; i++) {
      for (let j = 0; j < dets.length; j++) {
        candidates.push({ track: i, det: j, cost: costMatrix[i][j] });
      }
    }
    candidates.sort((a, b) => a.cost - b.cost);

    for (const c of candidates) {
      if (c.cost > distThresh) break;
      if (matchedTracks.has(c.track) || matchedDets.has(c.det)) continue;

      matches.push([c.track, c.det]);
      matchedTracks.add(c.track);
      matchedDets.add(c.det);
    }

    const unmatchedTracks: number[] = [];
    for (let i = 0; i < tracks.length; i++) {
      if (!matchedTracks.has(i)) unmatchedTracks.push(i);
    }

    const unmatchedDets: number[] = [];
    for (let j = 0; j < dets.length; j++) {
      if (!matchedDets.has(j)) unmatchedDets.push(j);
    }

    return [matches, unmatchedTracks, unmatchedDets];
  }

  /**
   * Intersection over Union (IoU) of two bounding boxes
   */
  private computeIoU(b1: BoundingBox, b2: BoundingBox): number {
    const x1 = Math.max(b1.x, b2.x);
    const y1 = Math.max(b1.y, b2.y);
    const x2 = Math.min(b1.x + b1.w, b2.x + b2.w);
    const y2 = Math.min(b1.y + b1.h, b2.y + b2.h);

    const w = Math.max(0, x2 - x1);
    const h = Math.max(0, y2 - y1);
    const intersection = w * h;

    const area1 = b1.w * b1.h;
    const area2 = b2.w * b2.h;
    const union = area1 + area2 - intersection;

    if (union <= 0) return 0;
    return intersection / union;
  }
}
