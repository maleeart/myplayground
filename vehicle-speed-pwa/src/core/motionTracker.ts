/**
 * High-Speed Optical Motion Detector & Target Tracker
 * 
 * Specifically designed for Handheld Mobile Cameras:
 * - Anti-Tremor & Handheld Shake Rejection:
 *     1) Rejects hand shake oscillations via Net Translational Displacement tracking.
 *     2) Rejects global camera movements (frame-wide panning/tilting).
 *     3) Strict AI-only candidate mode (NEVER creates ghost targets from raw pixel motion when handheld).
 * - Filters and tracks ONLY:
 *     - People (คน): 'person' (🏃)
 *     - Vehicles (รถ): 'car', 'motorcycle', 'bus', 'truck', 'bicycle' (🚗, 🏍️, 🚌, 🚚, 🚲)
 * - Strict Auto-Snapshot: Only captures confirmed targets with sustained real motion (no jitter snaps).
 * - Optical Field-of-View metric speed estimation in km/h.
 */

import type { Detection } from './tracker';
import { getClassInfo, type TargetFilterMode } from './detector';

export interface MotionBlob {
  id: number;
  bbox: { x: number; y: number; w: number; h: number };
  centroid: { x: number; y: number };
  anchorCentroid: { x: number; y: number };
  netDisplacementPx: number;
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
  minAreaPx: number; // Minimum blob area
  filterMode: TargetFilterMode; // 'all' | 'vehicles' | 'people'
  isHandheld: boolean; // True: Handheld anti-shake mode (strict AI)
  autoCapture: boolean; // True: Automatic photo snapshot on confirmed movement
  lockedBlobId?: number | null; // Null: all, Number: lock-on to specific target only
  speedLimitKmh?: number; // Speed limit for overspeed auto-capture
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
  private thresholdMap = {
    high: 12,
    medium: 18,
    low: 28,
  };

  constructor(config?: Partial<MotionTrackerConfig>) {
    this.config = {
      sensitivity: 'medium',
      distanceMeters: 15.0,
      angleDegrees: 90,
      minAreaPx: 650,
      filterMode: 'all',
      isHandheld: true, // Default to true for smartphone handheld use
      autoCapture: true,
      lockedBlobId: null,
      speedLimitKmh: 60,
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
   * Specifically filters for People and Vehicles with handheld anti-shake compensation.
   */
  public processFrame(
    videoOrCanvas: HTMLVideoElement | HTMLCanvasElement,
    timestamp: number,
    aiDetections: Detection[] = []
  ): {
    blobs: MotionBlob[];
    newlyDetectedForLogging: MotionBlob[];
    isGlobalCameraShake: boolean;
  } {
    const srcW = videoOrCanvas instanceof HTMLVideoElement ? videoOrCanvas.videoWidth : videoOrCanvas.width;
    const srcH = videoOrCanvas instanceof HTMLVideoElement ? videoOrCanvas.videoHeight : videoOrCanvas.height;
    if (srcW === 0 || srcH === 0) {
      return { blobs: [], newlyDetectedForLogging: [], isGlobalCameraShake: false };
    }

    // 1. Downsample for sub-millisecond motion difference computation
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
      return { blobs: [], newlyDetectedForLogging: [], isGlobalCameraShake: false };
    }

    // 2. Dual Motion Differencing
    const diffThreshold = this.thresholdMap[this.config.sensitivity];
    const gridMotionCount = new Uint16Array(this.gridCols * this.gridRows);
    const bgRate = 0.04;

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

        if (frameDiff > diffThreshold || bgDiff > diffThreshold + 12) {
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

    // 3. Global Camera Motion Detection (Handheld Shake / Jerk Detector)
    // If more than 35% of the screen cells move at the exact same instant, the camera is panning or shaking!
    const minCellActivePixels = 5;
    const activeGrid = new Uint8Array(this.gridCols * this.gridRows);
    let activeCellCount = 0;

    for (let i = 0; i < activeGrid.length; i++) {
      if (gridMotionCount[i] >= minCellActivePixels) {
        activeGrid[i] = 1;
        activeCellCount++;
      }
    }

    const globalShakeRatio = activeCellCount / activeGrid.length;
    // Camera is actively shaking/panning if > 32% of cells changed at once
    const isGlobalCameraShake = globalShakeRatio > 0.32;

    // 4. Candidate Target Selection
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

    // Priority 1: Confirmed AI Detections (True Semantic Recognition of Person / Vehicle)
    for (const ai of aiDetections) {
      if (ai.score < 0.28) continue;
      const info = getClassInfo(ai.class);

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

    // Priority 2: Fallback from raw motion ONLY when:
    // - Tripod mode is enabled (!this.config.isHandheld)
    // - AND no global camera shake
    // CRITICAL: When handheld (isHandheld = true), NEVER allow raw pixel differencing
    // to invent ghost candidates, because hand sway makes doors/trees/shadows look moving!
    if (!this.config.isHandheld && !isGlobalCameraShake && candidates.length === 0) {
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

            if (cellCount >= 2 && cellCount < this.gridCols * this.gridRows * 0.60) {
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

      for (const b of mergedBoxes) {
        const x = Math.round(b.minX * scaleX);
        const y = Math.round(b.minY * scaleY);
        const w = Math.round((b.maxX - b.minX) * scaleX);
        const h = Math.round((b.maxY - b.minY) * scaleY);
        const area = w * h;

        if (area < this.config.minAreaPx) continue;

        const aspectRatio = w / Math.max(1, h);
        const isPersonShape = aspectRatio <= 0.85 && h >= 40 && area >= 650;
        const isVehicleShape = aspectRatio >= 0.65 && w >= 45 && area >= 950;

        if (!isPersonShape && !isVehicleShape) continue;

        if (isPersonShape && this.config.filterMode !== 'vehicles') {
          candidates.push({
            bbox: { x, y, w, h },
            centroid: { x: x + w / 2, y: y + h / 2 },
            class: 'person',
            label: 'คน',
            icon: '🏃',
            category: 'person',
            score: 0.70,
            isAi: false,
          });
        } else if (isVehicleShape && this.config.filterMode !== 'people') {
          candidates.push({
            bbox: { x, y, w, h },
            centroid: { x: x + w / 2, y: y + h / 2 },
            class: 'car',
            label: 'รถยนต์',
            icon: '🚗',
            category: 'vehicle',
            score: 0.70,
            isAi: false,
          });
        }
      }
    }

    // 5. Association, Handheld Anti-Tremor & Speed Calculation
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

        // Update net translational displacement from initial anchor position
        const netDx = cand.centroid.x - bestBlob.anchorCentroid.x;
        const netDy = cand.centroid.y - bestBlob.anchorCentroid.y;
        bestBlob.netDisplacementPx = Math.hypot(netDx, netDy);

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

        // HANDHELD TREMOR REJECTION:
        // A hand tremor moves back and forth around an anchor (< 25-30 px).
        // A true driving vehicle or walking person travels 35 - 300+ pixels across the screen!
        const minDisplacementForSpeed = this.config.isHandheld
          ? (bestBlob.category === 'person' ? 20 : 32)
          : 12;

        if (bestBlob.netDisplacementPx < minDisplacementForSpeed || isGlobalCameraShake) {
          // Classified as stationary or hand tremor
          bestBlob.isStationary = true;
          bestBlob.currentSpeedKmh = 0;
        } else {
          bestBlob.isStationary = false;

          // Compute instantaneous metric speed over recent 0.15 - 0.4s window
          if (bestBlob.history.length >= 3) {
            const k = Math.min(8, bestBlob.history.length - 1);
            const past = bestBlob.history[bestBlob.history.length - 1 - k];
            const curr = bestBlob.history[bestBlob.history.length - 1];

            const dt = (curr.time - past.time) / 1000;
            if (dt > 0.05) {
              const dx = curr.x - past.x;
              const dy = curr.y - past.y;
              const dPixels = Math.hypot(dx, dy);

              const dMeters = dPixels / pixelsPerMeter;
              const rawSpeedKmh = (dMeters / dt) * 3.6 * angleCorrectionFactor;

              // Physical acceleration clamp (< 15 m/s^2)
              const maxDelta = 15 * 3.6 * dt;
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
                  : 0.30 * clampedSpeed + 0.70 * bestBlob.currentSpeedKmh
              );

              if (bestBlob.currentSpeedKmh > bestBlob.peakSpeedKmh) {
                bestBlob.peakSpeedKmh = bestBlob.currentSpeedKmh;
              }

              bestBlob.speedSamples.push(bestBlob.currentSpeedKmh);
              const sum = bestBlob.speedSamples.reduce((a, b) => a + b, 0);
              bestBlob.avgSpeedKmh = Math.round(sum / bestBlob.speedSamples.length);
              bestBlob.distanceTraveledPx += dPixels;

              // STRICT AUTO-SNAPSHOT LOGGING:
              // 1. autoCapture must be enabled
              // 2. Not previously logged
              // 3. Tracked continuously for >= 12 frames (~0.3s)
              // STRICT OVERSPEED AUTO-SNAPSHOT LOGGING:
              // 1. autoCapture must be enabled
              // 2. Target must match locked target (if one is locked)
              // 3. Must EXCEED speed limit (currentSpeedKmh > speedLimit or peakSpeedKmh > speedLimit)
              // 4. Not previously logged
              // 5. Tracked continuously for >= 10 frames (~0.25s)
              // 6. Must be AI confirmed
              // 7. Must NOT be shaking camera
              // 8. Must have moved >= 35 pixels net displacement
              const minNetDisplacementToLog = 35; // px
              const limit = this.config.speedLimitKmh ?? 60;
              const isOverSpeedLimit =
                bestBlob.currentSpeedKmh > limit || bestBlob.peakSpeedKmh > limit;

              const isTargetAllowedToLog =
                this.config.lockedBlobId == null || bestBlob.id === this.config.lockedBlobId;

              if (
                this.config.autoCapture &&
                isTargetAllowedToLog &&
                isOverSpeedLimit &&
                !bestBlob.hasBeenLogged &&
                bestBlob.hits >= 10 &&
                bestBlob.isAiConfirmed &&
                !isGlobalCameraShake &&
                bestBlob.netDisplacementPx >= minNetDisplacementToLog
              ) {
                bestBlob.hasBeenLogged = true;
                newlyDetectedForLogging.push(bestBlob);
              }
            }
          }
        }
      } else {
        // Initialize new confirmed person / vehicle track
        const newId = this.nextTrackId++;
        const newBlob: MotionBlob = {
          id: newId,
          bbox: cand.bbox,
          centroid: cand.centroid,
          anchorCentroid: { x: cand.centroid.x, y: cand.centroid.y },
          netDisplacementPx: 0,
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
      isGlobalCameraShake,
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
