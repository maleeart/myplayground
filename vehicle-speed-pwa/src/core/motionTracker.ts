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
  stationaryCount?: number;
  lastSpeedUpdateTime?: number;
}

export interface Candidate {
  bbox: { x: number; y: number; w: number; h: number };
  centroid: { x: number; y: number };
  class: string;
  label: string;
  icon: string;
  category: 'person' | 'vehicle';
  score: number;
  isAi: boolean;
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
  private lastAiDetectionsRef: Detection[] | null = null;

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
    this.lastAiDetectionsRef = null;
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

    const isFreshAiFrame = aiDetections.length > 0 && aiDetections !== this.lastAiDetectionsRef;
    if (isFreshAiFrame) {
      this.lastAiDetectionsRef = aiDetections;
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
    // Camera is actively shaking/panning if > 48% of cells changed at once
    const isGlobalCameraShake = globalShakeRatio > 0.48;

    // 4. Candidate Target Selection
    const candidates: Candidate[] = [];

    // Priority 1: Confirmed AI Detections (True Semantic Recognition of Person / Vehicle)
    for (const ai of aiDetections) {
      const isPersonTarget = ai.class === 'person';
      const minScore = isPersonTarget ? 0.20 : 0.26;
      if (ai.score < minScore) continue;
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
    const angleRad = (Math.max(15, Math.min(90, this.config.angleDegrees)) * Math.PI) / 180;
    const angleCorrectionFactor = 1.0 / Math.sin(angleRad);

    const newlyDetectedForLogging: MotionBlob[] = [];
    const matchedTrackIds = new Set<number>();
    const matchedCandidateIndices = new Set<number>();

    // Priority 1: User-locked target gets first-choice matching to maintain uninterrupted tracking
    const lockedId = this.config.lockedBlobId;
    if (lockedId != null && this.activeBlobs.has(lockedId)) {
      const lockedBlob = this.activeBlobs.get(lockedId)!;
      let bestCandIdx = -1;
      let minLockedDist = 200 * (srcW / 640);

      for (let i = 0; i < candidates.length; i++) {
        const cand = candidates[i];
        if (cand.category !== lockedBlob.category) continue;
        const d = Math.hypot(cand.centroid.x - lockedBlob.centroid.x, cand.centroid.y - lockedBlob.centroid.y);
        if (d < minLockedDist) {
          minLockedDist = d;
          bestCandIdx = i;
        }
      }

      if (bestCandIdx >= 0) {
        matchedTrackIds.add(lockedBlob.id);
        matchedCandidateIndices.add(bestCandIdx);
        this.updateBlob(
          lockedBlob,
          candidates[bestCandIdx],
          timestamp,
          isFreshAiFrame,
          srcW,
          angleCorrectionFactor,
          globalShakeRatio,
          isGlobalCameraShake,
          newlyDetectedForLogging
        );
      }
    }

    // General matching for remaining candidates
    for (let i = 0; i < candidates.length; i++) {
      if (matchedCandidateIndices.has(i)) continue;
      const cand = candidates[i];
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
        this.updateBlob(
          bestBlob,
          cand,
          timestamp,
          isFreshAiFrame,
          srcW,
          angleCorrectionFactor,
          globalShakeRatio,
          isGlobalCameraShake,
          newlyDetectedForLogging
        );
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
          stationaryCount: 0,
          lastSpeedUpdateTime: timestamp,
        };

        this.activeBlobs.set(newId, newBlob);
        matchedTrackIds.add(newId);
      }
    }

    // Expire tracks not seen:
    // Locked track has 900ms grace period to handle occasional mobile AI latency
    // Unlocked tracks expire after 450ms
    for (const [id, blob] of this.activeBlobs.entries()) {
      const maxAge = id === this.config.lockedBlobId ? 900 : 450;
      if (timestamp - blob.lastSeen > maxAge) {
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
   * Updates an active track with candidate observation,
   * calculating instantaneous metric speed with adaptive height perspective scaling
   * and robust walking/stationary detection.
   */
  private updateBlob(
    blob: MotionBlob,
    cand: Candidate,
    timestamp: number,
    isFreshAiFrame: boolean,
    srcW: number,
    angleCorrectionFactor: number,
    globalShakeRatio: number,
    isGlobalCameraShake: boolean,
    newlyDetectedForLogging: MotionBlob[]
  ): void {
    blob.bbox = cand.bbox;
    blob.centroid = cand.centroid;
    blob.lastSeen = timestamp;
    blob.hits++;

    // Update net translational displacement from initial anchor position
    const netDx = cand.centroid.x - blob.anchorCentroid.x;
    const netDy = cand.centroid.y - blob.anchorCentroid.y;
    blob.netDisplacementPx = Math.hypot(netDx, netDy);

    if (cand.isAi || !blob.isAiConfirmed) {
      blob.class = cand.class;
      blob.label = cand.label;
      blob.icon = cand.icon;
      blob.category = cand.category;
      blob.score = cand.score;
      if (cand.isAi) blob.isAiConfirmed = true;
    }

    const isLocked = this.config.lockedBlobId === blob.id;
    const isPerson = blob.category === 'person';

    // Check last recorded position in history
    const lastHist = blob.history[blob.history.length - 1];
    const distFromLastHist = lastHist
      ? Math.hypot(cand.centroid.x - lastHist.x, cand.centroid.y - lastHist.y)
      : 0;
    const timeSinceLastHist = lastHist ? timestamp - lastHist.time : 999;

    // Record to history ONLY when:
    // 1) Fresh AI detection arrived, OR
    // 2) Centroid moved noticeably (>= 0.6px), OR
    // 3) At least 140ms has elapsed (so stationary state can be accurately sampled)
    const shouldRecord = isFreshAiFrame || distFromLastHist >= 0.6 || timeSinceLastHist >= 140;

    if (shouldRecord) {
      blob.history.push({ x: cand.centroid.x, y: cand.centroid.y, time: timestamp });
      if (blob.history.length > 35) {
        blob.history.shift();
      }
    }

    // Adaptive perspective scale:
    // Standing/walking adult human is ~1.70m tall
    // Standard passenger car is ~1.50m tall
    const visibleWidthMeters = 1.28 * Math.max(1, this.config.distanceMeters);
    let ppm = srcW / visibleWidthMeters;
    if (isPerson && cand.bbox.h >= 30) {
      ppm = cand.bbox.h / 1.70;
    } else if (blob.category === 'vehicle' && cand.bbox.h >= 30) {
      ppm = cand.bbox.h / 1.50;
    }

    // Find best historical reference point (~130ms to ~300ms ago)
    let past: { x: number; y: number; time: number } | null = null;
    for (let h = blob.history.length - 2; h >= 0; h--) {
      const pt = blob.history[h];
      const dtMs = timestamp - pt.time;
      if (dtMs >= 130) {
        past = pt;
        if (dtMs >= 220) break;
      }
    }
    // Fallback for newly spawned tracks with short history
    if (!past && blob.history.length >= 2) {
      const firstPt = blob.history[0];
      if (timestamp - firstPt.time >= 60) {
        past = firstPt;
      }
    }

    if (past) {
      const dt = (timestamp - past.time) / 1000;
      if (dt >= 0.03) {
        const dx = cand.centroid.x - past.x;
        const dy = cand.centroid.y - past.y;
        const dPixels = Math.hypot(dx, dy);

        const dMeters = dPixels / ppm;
        const rawSpeedKmh = (dMeters / dt) * 3.6 * angleCorrectionFactor;

        // Camera shake suppression:
        // Locked target: only extreme shake (> 0.72) pauses speed
        // Unlocked target: suppressed by isGlobalCameraShake (> 0.48)
        const shakeSuppressed = isLocked ? globalShakeRatio > 0.72 : isGlobalCameraShake;

        // Movement thresholds:
        // For locked person: displacement >= 1.8px OR rawSpeed >= 1.0 km/h
        // For unlocked person: displacement >= 2.8px OR rawSpeed >= 1.4 km/h
        // For vehicle: displacement >= 3.5px OR rawSpeed >= 2.0 km/h
        const minDispThreshold = isLocked
          ? (isPerson ? 1.8 : 3.2)
          : (isPerson ? 2.8 : 4.2);
        const minSpeedThreshold = isPerson ? 1.0 : 2.0;

        const isActivelyMoving =
          !shakeSuppressed && (dPixels >= minDispThreshold || rawSpeedKmh >= minSpeedThreshold);

        if (isActivelyMoving) {
          blob.stationaryCount = 0;
          blob.isStationary = false;

          // Physical acceleration clamp (< 8 m/s^2 for person, < 15 m/s^2 for vehicle)
          const maxAccelMps2 = isPerson ? 8 : 15;
          const maxDelta = maxAccelMps2 * 3.6 * dt;
          let clampedSpeed = rawSpeedKmh;
          if (blob.currentSpeedKmh > 0 && Math.abs(rawSpeedKmh - blob.currentSpeedKmh) > maxDelta) {
            clampedSpeed = rawSpeedKmh > blob.currentSpeedKmh
              ? blob.currentSpeedKmh + maxDelta
              : Math.max(0, blob.currentSpeedKmh - maxDelta);
          }

          // Responsive EMA (0.65 for person, 0.40 for vehicle)
          const emaWeight = isPerson ? 0.65 : 0.40;
          const nextSpeed = blob.currentSpeedKmh === 0
            ? clampedSpeed
            : emaWeight * clampedSpeed + (1 - emaWeight) * blob.currentSpeedKmh;

          // Pedestrian walking speeds under 10 km/h show 1 decimal place (e.g. 3.4 km/h)
          // Vehicles or fast speeds round to whole integer
          blob.currentSpeedKmh = nextSpeed < 10
            ? Math.round(nextSpeed * 10) / 10
            : Math.round(nextSpeed);

          if (blob.currentSpeedKmh > blob.peakSpeedKmh) {
            blob.peakSpeedKmh = blob.currentSpeedKmh;
          }

          blob.speedSamples.push(blob.currentSpeedKmh);
          const sum = blob.speedSamples.reduce((a, b) => a + b, 0);
          blob.avgSpeedKmh = Math.round((sum / blob.speedSamples.length) * 10) / 10;
          blob.distanceTraveledPx += dPixels;
          blob.lastSpeedUpdateTime = timestamp;

          // STRICT OVERSPEED AUTO-SNAPSHOT LOGGING:
          const minHitsToLog = isPerson ? 4 : 7;
          const limit = this.config.speedLimitKmh ?? 60;
          const isOverSpeedLimit =
            blob.currentSpeedKmh > limit || blob.peakSpeedKmh > limit;
          const isTargetAllowedToLog =
            this.config.lockedBlobId == null || blob.id === this.config.lockedBlobId;

          if (
            this.config.autoCapture &&
            isTargetAllowedToLog &&
            isOverSpeedLimit &&
            !blob.hasBeenLogged &&
            blob.hits >= minHitsToLog &&
            blob.isAiConfirmed &&
            !isGlobalCameraShake &&
            blob.distanceTraveledPx >= (isPerson ? 12 : 25)
          ) {
            blob.hasBeenLogged = true;
            newlyDetectedForLogging.push(blob);
          }
        } else {
          // Centroid displacement is too small -> Target is stopping or stationary
          blob.stationaryCount = (blob.stationaryCount || 0) + 1;

          // Smoothly decay speed rather than abruptly zeroing
          if (blob.stationaryCount >= 2) {
            blob.currentSpeedKmh = Math.round(blob.currentSpeedKmh * 0.45 * 10) / 10;
          }
          if (blob.stationaryCount >= 4 || blob.currentSpeedKmh < 0.8) {
            blob.currentSpeedKmh = 0;
            blob.isStationary = true;
            blob.anchorCentroid = { x: cand.centroid.x, y: cand.centroid.y };
          }
        }
      }
    }
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
