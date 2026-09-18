/**
 * High-Speed Optical Motion Detector & Target Tracker
 * 
 * Specifically filters and detects:
 * - People (คน): 'person' (🏃)
 * - Vehicles (รถ): 'car', 'motorcycle', 'bus', 'truck', 'bicycle' (🚗, 🏍️, 🚌, 🚚, 🚲)
 * 
 * Features:
 * - Anti-Noise Filter: Rejects wind, leaves, shadows, camera micro-tremors, and background jitter.
 * - Semantic AI Matching: Fuses real-time COCO-SSD detections with 60 FPS motion trajectories.
 * - Shape & Aspect Ratio Profiling: Vertical proportions (H > W) for pedestrians; horizontal/box (W >= 0.7H) for vehicles.
 * - Optical Field-of-View metric speed estimation in km/h.
 * - Auto-snapshot logging with Thai classification labels.
 */

import type { Detection } from './tracker';
import { getClassInfo, type TargetFilterMode } from './detector';

export interface MotionBlob {
  id: number;
  bbox: { x: number; y: number; w: number; h: number };
  centroid: { x: number; y: number };
  history: Array<{ x: number; y: number; time: number }>;
  currentSpeedKmh: number;
  peakSpeedKmh: number;
  avgSpeedKmh: number;
  distanceTraveledPx: number;
  speedSamples: number[];
  firstSeen: number;
  lastSeen: number;
  hits: number;
  hasBeenLogged: boolean;
  class: string;
  label: string;
  icon: string;
  category: 'person' | 'vehicle';
  score: number;
  isStationary: boolean;
  isAiConfirmed: boolean;
}

export interface MotionTrackerConfig {
  sensitivity: 'low' | 'medium' | 'high';
  distanceMeters: number; // Distance from camera to road/target (default 15m)
  angleDegrees: number; // Angle relative to camera line of sight (default 90 deg)
  minAreaPx: number; // Minimum blob area (rejects tiny noise)
  filterMode: TargetFilterMode; // 'all' | 'vehicles' | 'people'
}

export class MotionTracker {
  private width = 240;
  private height = 180;
  private sampleCanvas: HTMLCanvasElement;
  private sampleCtx: CanvasRenderingContext2D;

  private prevFrameData: Uint8Array | null = null;
  private backgroundData: Float32Array | null = null;

  // Grid for spatial clustering (30 cols x 22 rows)
  private gridCols = 30;
  private gridRows = 22;
  private cellW: number;
  private cellH: number;

  private nextTrackId = 1;
  private activeBlobs: Map<number, MotionBlob> = new Map();

  public config: MotionTrackerConfig;
  public showMotionMask: boolean = false;
  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D;
  private maskImageData: ImageData;

  // Sensitivity thresholds (difference in luminance 0-255)
  // Cleaned up to reject camera noise and leaves
  private thresholdMap = {
    high: 10,
    medium: 16,
    low: 26,
  };

  constructor(config?: Partial<MotionTrackerConfig>) {
    this.config = {
      sensitivity: 'medium',
      distanceMeters: 15.0,
      angleDegrees: 90,
      minAreaPx: 650, // Rejects leaves, bugs, micro-shake; accepts humans & vehicles
      filterMode: 'all',
      ...config,
    };

    this.sampleCanvas = document.createElement('canvas');
    this.sampleCanvas.width = this.width;
    this.sampleCanvas.height = this.height;
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true })!;

    this.maskCanvas = document.createElement('canvas');
    this.maskCanvas.width = this.width;
    this.maskCanvas.height = this.height;
    this.maskCtx = this.maskCanvas.getContext('2d')!;
    this.maskImageData = this.maskCtx.createImageData(this.width, this.height);

    this.cellW = this.width / this.gridCols;
    this.cellH = this.height / this.gridRows;
  }

  public getMaskCanvas(): HTMLCanvasElement {
    return this.maskCanvas;
  }

  /**
   * Resets background and tracking state
   */
  public reset(): void {
    this.prevFrameData = null;
    this.backgroundData = null;
    this.activeBlobs.clear();
  }

  /**
   * Process a video frame: combines frame differencing with AI detections
   * Specifically filters for People and Vehicles.
   */
  public processFrame(
    videoOrCanvas: HTMLVideoElement | HTMLCanvasElement,
    timestamp: number,
    aiDetections: Detection[] = []
  ): {
    blobs: MotionBlob[];
    newlyDetectedForLogging: MotionBlob[];
  } {
    const srcW = videoOrCanvas instanceof HTMLVideoElement ? videoOrCanvas.videoWidth : videoOrCanvas.width;
    const srcH = videoOrCanvas instanceof HTMLVideoElement ? videoOrCanvas.videoHeight : videoOrCanvas.height;
    if (srcW === 0 || srcH === 0) {
      return { blobs: [], newlyDetectedForLogging: [] };
    }

    // 1. Downsample for ultra-fast (sub-millisecond) motion difference computation
    this.sampleCtx.drawImage(videoOrCanvas, 0, 0, this.width, this.height);
    const imgData = this.sampleCtx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    const pixelCount = this.width * this.height;

    // Convert to grayscale
    const currentGray = new Uint8Array(pixelCount);
    for (let i = 0, j = 0; i < pixelCount; i++, j += 4) {
      currentGray[i] = (data[j] * 77 + data[j + 1] * 150 + data[j + 2] * 29) >> 8;
    }

    // Initialize background if first frame
    if (!this.backgroundData || !this.prevFrameData) {
      this.prevFrameData = new Uint8Array(currentGray);
      this.backgroundData = new Float32Array(pixelCount);
      for (let i = 0; i < pixelCount; i++) {
        this.backgroundData[i] = currentGray[i];
      }
      return { blobs: [], newlyDetectedForLogging: [] };
    }

    // 2. Dual Motion Differencing (|Frame_t - Frame_{t-1}| & |Frame_t - Background|)
    const diffThreshold = this.thresholdMap[this.config.sensitivity];
    const gridMotionCount = new Uint16Array(this.gridCols * this.gridRows);
    const bgRate = 0.035;

    const maskData = this.showMotionMask ? this.maskImageData.data : null;
    if (maskData) {
      maskData.fill(0);
    }

    for (let y = 0; y < this.height; y++) {
      const rowOffset = y * this.width;
      const gridY = Math.floor(y / this.cellH);
      const gridRowOffset = gridY * this.gridCols;

      for (let x = 0; x < this.width; x++) {
        const idx = rowOffset + x;
        const cur = currentGray[idx];
        const prev = this.prevFrameData[idx];
        const bg = this.backgroundData[idx];

        const frameDiff = Math.abs(cur - prev);
        const bgDiff = Math.abs(cur - bg);

        this.backgroundData[idx] = bg * (1 - bgRate) + cur * bgRate;

        if (frameDiff > diffThreshold || bgDiff > diffThreshold + 10) {
          const gridX = Math.floor(x / this.cellW);
          gridMotionCount[gridRowOffset + gridX]++;

          if (maskData) {
            const pIdx = idx * 4;
            maskData[pIdx] = 16;
            maskData[pIdx + 1] = 240;
            maskData[pIdx + 2] = 180;
            maskData[pIdx + 3] = 210;
          }
        }
      }
    }

    if (this.showMotionMask) {
      this.maskCtx.putImageData(this.maskImageData, 0, 0);
    }

    this.prevFrameData = currentGray;

    // 3. Grid Clustering & Morphological Component Filtering
    // Requires >= 4 pixels moved inside a cell (filters out minor leaves/sensor grain)
    const minCellActivePixels = 4;
    const activeGrid = new Uint8Array(this.gridCols * this.gridRows);
    for (let i = 0; i < activeGrid.length; i++) {
      if (gridMotionCount[i] >= minCellActivePixels) {
        activeGrid[i] = 1;
      }
    }

    const visited = new Uint8Array(this.gridCols * this.gridRows);
    const rawBoxes: Array<{ minX: number; minY: number; maxX: number; maxY: number; cells: number }> = [];

    for (let gy = 0; gy < this.gridRows; gy++) {
      for (let gx = 0; gx < this.gridCols; gx++) {
        const gIdx = gy * this.gridCols + gx;
        if (activeGrid[gIdx] === 1 && visited[gIdx] === 0) {
          let minGX = gx;
          let maxGX = gx;
          let minGY = gy;
          let maxGY = gy;
          let cellCount = 0;

          const queue: number[] = [gIdx];
          visited[gIdx] = 1;

          while (queue.length > 0) {
            const curr = queue.pop()!;
            cellCount++;
            const cy = Math.floor(curr / this.gridCols);
            const cx = curr % this.gridCols;

            if (cx < minGX) minGX = cx;
            if (cx > maxGX) maxGX = cx;
            if (cy < minGY) minGY = cy;
            if (cy > maxGY) maxGY = cy;

            const neighbors = [
              cy > 0 ? (cy - 1) * this.gridCols + cx : -1,
              cy < this.gridRows - 1 ? (cy + 1) * this.gridCols + cx : -1,
              cx > 0 ? cy * this.gridCols + (cx - 1) : -1,
              cx < this.gridCols - 1 ? cy * this.gridCols + (cx + 1) : -1,
            ];

            for (const n of neighbors) {
              if (n >= 0 && activeGrid[n] === 1 && visited[n] === 0) {
                visited[n] = 1;
                queue.push(n);
              }
            }
          }

          // Anti-Noise: Require at least 2 connected grid cells and < 70% of screen
          if (cellCount >= 2 && cellCount < this.gridCols * this.gridRows * 0.70) {
            rawBoxes.push({
              minX: minGX * this.cellW,
              minY: minGY * this.cellH,
              maxX: (maxGX + 1) * this.cellW,
              maxY: (maxGY + 1) * this.cellH,
              cells: cellCount,
            });
          }
        }
      }
    }

    const mergedBoxes = this.mergeBoxes(rawBoxes);
    const scaleX = srcW / this.width;
    const scaleY = srcH / this.height;

    // 4. Candidates from Motion with Strict Shape & Aspect Ratio Classification
    interface Candidate {
      bbox: { x: number; y: number; w: number; h: number };
      centroid: { x: number; y: number };
      class: string;
      label: string;
      icon: string;
      category: 'person' | 'vehicle';
      score: number;
      isAi: boolean;
    }

    const candidates: Candidate[] = [];

    // First: Prioritize Confirmed AI Detections
    for (const ai of aiDetections) {
      const info = getClassInfo(ai.class);
      // Filter by active target mode
      if (this.config.filterMode === 'vehicles' && info.category !== 'vehicle') continue;
      if (this.config.filterMode === 'people' && info.category !== 'person') continue;

      candidates.push({
        bbox: ai.bbox,
        centroid: { x: ai.bbox.x + ai.bbox.w / 2, y: ai.bbox.y + ai.bbox.h / 2 },
        class: ai.class,
        label: info.thaiName,
        icon: info.icon,
        category: info.category,
        score: ai.score,
        isAi: true,
      });
    }

    // Second: Fallback to Morphological Shape Analysis if no AI boxes overlapping
    for (const b of mergedBoxes) {
      const x = Math.round(b.minX * scaleX);
      const y = Math.round(b.minY * scaleY);
      const w = Math.round((b.maxX - b.minX) * scaleX);
      const h = Math.round((b.maxY - b.minY) * scaleY);
      const area = w * h;

      if (area < this.config.minAreaPx) continue;

      // Check if already covered by an AI detection
      const cx = x + w / 2;
      const cy = y + h / 2;
      const alreadyCoveredByAi = candidates.some(
        (c) => c.isAi && Math.hypot(c.centroid.x - cx, c.centroid.y - cy) < Math.max(c.bbox.w, c.bbox.h) * 0.8
      );
      if (alreadyCoveredByAi) continue;

      const aspectRatio = w / Math.max(1, h);

      // Person: Vertical posture (Height > Width)
      const isPersonShape = aspectRatio <= 0.85 && h >= 36 && area >= 550;

      // Vehicle: Horizontal or balanced box (Width >= 0.65 Height)
      const isVehicleShape = aspectRatio >= 0.65 && w >= 38 && area >= 850;

      // REJECT any shape that is neither person nor vehicle (e.g. swaying leaves, random dust)
      if (!isPersonShape && !isVehicleShape) {
        continue;
      }

      if (isPersonShape) {
        if (this.config.filterMode === 'vehicles') continue; // filtered out
        candidates.push({
          bbox: { x, y, w, h },
          centroid: { x: cx, y: cy },
          class: 'person',
          label: 'คน',
          icon: '🏃',
          category: 'person',
          score: 0.75,
          isAi: false,
        });
      } else if (isVehicleShape) {
        if (this.config.filterMode === 'people') continue; // filtered out
        candidates.push({
          bbox: { x, y, w, h },
          centroid: { x: cx, y: cy },
          class: 'car',
          label: 'รถยนต์',
          icon: '🚗',
          category: 'vehicle',
          score: 0.75,
          isAi: false,
        });
      }
    }

    // 5. Association & Speed Computation
    const visibleWidthMeters = 1.28 * Math.max(1, this.config.distanceMeters);
    const pixelsPerMeter = srcW / visibleWidthMeters;
    const angleRad = (Math.max(15, Math.min(90, this.config.angleDegrees)) * Math.PI) / 180;
    const angleCorrectionFactor = 1.0 / Math.sin(angleRad);

    const newlyDetectedForLogging: MotionBlob[] = [];
    const matchedTrackIds = new Set<number>();

    for (const cand of candidates) {
      let bestBlob: MotionBlob | null = null;
      let minDistance = 150 * (srcW / 640);

      for (const [id, blob] of this.activeBlobs.entries()) {
        if (matchedTrackIds.has(id)) continue;
        const d = Math.hypot(cand.centroid.x - blob.centroid.x, cand.centroid.y - blob.centroid.y);
        if (d < minDistance) {
          minDistance = d;
          bestBlob = blob;
        }
      }

      if (bestBlob) {
        matchedTrackIds.add(bestBlob.id);
        bestBlob.bbox = cand.bbox;
        bestBlob.centroid = cand.centroid;
        bestBlob.lastSeen = timestamp;
        bestBlob.hits++;

        // Update class/category if AI confirms
        if (cand.isAi || !bestBlob.isAiConfirmed) {
          bestBlob.class = cand.class;
          bestBlob.label = cand.label;
          bestBlob.icon = cand.icon;
          bestBlob.category = cand.category;
          bestBlob.score = cand.score;
          if (cand.isAi) bestBlob.isAiConfirmed = true;
        }

        bestBlob.history.push({ x: cand.centroid.x, y: cand.centroid.y, time: timestamp });
        if (bestBlob.history.length > 30) {
          bestBlob.history.shift();
        }

        // Speed Calculation
        if (bestBlob.history.length >= 3) {
          const k = Math.min(7, bestBlob.history.length - 1);
          const past = bestBlob.history[bestBlob.history.length - 1 - k];
          const curr = bestBlob.history[bestBlob.history.length - 1];

          const dt = (curr.time - past.time) / 1000;
          if (dt > 0.05) {
            const dx = curr.x - past.x;
            const dy = curr.y - past.y;
            const dPixels = Math.hypot(dx, dy);

            // Check if stationary (e.g. jiggling in place < 3 pixels)
            if (dPixels < 3.5) {
              bestBlob.isStationary = true;
              bestBlob.currentSpeedKmh = 0;
            } else {
              bestBlob.isStationary = false;
              const dMeters = dPixels / pixelsPerMeter;
              const rawSpeedKmh = (dMeters / dt) * 3.6 * angleCorrectionFactor;

              // Physical acceleration clamp (< 16 m/s^2)
              const maxDelta = 16 * 3.6 * dt;
              let clampedSpeed = rawSpeedKmh;
              if (bestBlob.currentSpeedKmh > 0 && Math.abs(rawSpeedKmh - bestBlob.currentSpeedKmh) > maxDelta) {
                clampedSpeed = rawSpeedKmh > bestBlob.currentSpeedKmh
                  ? bestBlob.currentSpeedKmh + maxDelta
                  : Math.max(0, bestBlob.currentSpeedKmh - maxDelta);
              }

              // Smooth speed with EMA
              bestBlob.currentSpeedKmh = Math.round(
                bestBlob.currentSpeedKmh === 0
                  ? clampedSpeed
                  : 0.35 * clampedSpeed + 0.65 * bestBlob.currentSpeedKmh
              );

              if (bestBlob.currentSpeedKmh > bestBlob.peakSpeedKmh) {
                bestBlob.peakSpeedKmh = bestBlob.currentSpeedKmh;
              }

              bestBlob.speedSamples.push(bestBlob.currentSpeedKmh);
              const sum = bestBlob.speedSamples.reduce((a, b) => a + b, 0);
              bestBlob.avgSpeedKmh = Math.round(sum / bestBlob.speedSamples.length);
              bestBlob.distanceTraveledPx += dPixels;

              // Auto-log verified moving person or vehicle
              const minSpeedToLog = bestBlob.category === 'person' ? 2 : 5;
              if (!bestBlob.hasBeenLogged && bestBlob.hits >= 4 && bestBlob.currentSpeedKmh >= minSpeedToLog) {
                bestBlob.hasBeenLogged = true;
                newlyDetectedForLogging.push(bestBlob);
              }
            }
          }
        }
      } else {
        // Create new confirmed person / vehicle track
        const newId = this.nextTrackId++;
        const newBlob: MotionBlob = {
          id: newId,
          bbox: cand.bbox,
          centroid: cand.centroid,
          history: [{ x: cand.centroid.x, y: cand.centroid.y, time: timestamp }],
          currentSpeedKmh: 0,
          peakSpeedKmh: 0,
          avgSpeedKmh: 0,
          distanceTraveledPx: 0,
          speedSamples: [],
          firstSeen: timestamp,
          lastSeen: timestamp,
          hits: 1,
          hasBeenLogged: false,
          class: cand.class,
          label: cand.label,
          icon: cand.icon,
          category: cand.category,
          score: cand.score,
          isStationary: true,
          isAiConfirmed: cand.isAi,
        };

        this.activeBlobs.set(newId, newBlob);
        matchedTrackIds.add(newId);
      }
    }

    // Expire tracks not seen for > 450ms
    for (const [id, blob] of this.activeBlobs.entries()) {
      if (timestamp - blob.lastSeen > 450) {
        this.activeBlobs.delete(id);
      }
    }

    return {
      blobs: Array.from(this.activeBlobs.values()),
      newlyDetectedForLogging,
    };
  }

  /**
   * Merges boxes that overlap or are close together
   */
  private mergeBoxes(
    boxes: Array<{ minX: number; minY: number; maxX: number; maxY: number; cells: number }>
  ) {
    if (boxes.length <= 1) return boxes;

    const merged: typeof boxes = [];
    const used = new Uint8Array(boxes.length);
    const padding = 6;

    for (let i = 0; i < boxes.length; i++) {
      if (used[i]) continue;
      let b1 = { ...boxes[i] };
      used[i] = 1;

      let changed = true;
      while (changed) {
        changed = false;
        for (let j = 0; j < boxes.length; j++) {
          if (used[j]) continue;
          const b2 = boxes[j];

          const overlapX = !(b1.maxX + padding < b2.minX || b2.maxX + padding < b1.minX);
          const overlapY = !(b1.maxY + padding < b2.minY || b2.maxY + padding < b1.minY);

          if (overlapX && overlapY) {
            b1.minX = Math.min(b1.minX, b2.minX);
            b1.minY = Math.min(b1.minY, b2.minY);
            b1.maxX = Math.max(b1.maxX, b2.maxX);
            b1.maxY = Math.max(b1.maxY, b2.maxY);
            b1.cells += b2.cells;
            used[j] = 1;
            changed = true;
          }
        }
      }

      merged.push(b1);
    }

    return merged;
  }
}
