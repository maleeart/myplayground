/**
 * High-Speed Optical Motion Detector & Blob Tracker
 * 
 * Implements pure Frame-to-Frame Differencing & Background Subtraction:
 * 1. Compares current frame with previous frame (|Frame_t - Frame_{t-1}|)
 * 2. Identifies any moving pixels above threshold
 * 3. Clusters motion pixels into bounding boxes (Blobs)
 * 4. Tracks moving blobs across frames to compute real-time velocity (km/h)
 * 5. Auto-triggers snapshot capture for speed records
 */

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
}

export interface MotionTrackerConfig {
  sensitivity: 'low' | 'medium' | 'high';
  distanceMeters: number; // Distance from camera to moving object (default 15m)
  angleDegrees: number; // Angle relative to camera line of sight (default 90 deg = crossing)
  minAreaPx: number; // Minimum blob area to reject tiny noise (leaves, bugs)
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

  // Sensitivity thresholds (difference in luminance 0-255)
  private thresholdMap = {
    high: 16,
    medium: 24,
    low: 36,
  };

  constructor(config?: Partial<MotionTrackerConfig>) {
    this.config = {
      sensitivity: 'medium',
      distanceMeters: 15.0,
      angleDegrees: 90,
      minAreaPx: 1200, // min ~35x35px in full resolution
      ...config,
    };

    this.sampleCanvas = document.createElement('canvas');
    this.sampleCanvas.width = this.width;
    this.sampleCanvas.height = this.height;
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true })!;

    this.cellW = this.width / this.gridCols;
    this.cellH = this.height / this.gridRows;
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
   * Process a video frame: calculates frame difference, finds moving blobs, updates speeds
   */
  public processFrame(
    videoOrCanvas: HTMLVideoElement | HTMLCanvasElement,
    timestamp: number
  ): {
    blobs: MotionBlob[];
    newlyDetectedForLogging: MotionBlob[];
  } {
    const srcW = videoOrCanvas instanceof HTMLVideoElement ? videoOrCanvas.videoWidth : videoOrCanvas.width;
    const srcH = videoOrCanvas instanceof HTMLVideoElement ? videoOrCanvas.videoHeight : videoOrCanvas.height;
    if (srcW === 0 || srcH === 0) {
      return { blobs: [], newlyDetectedForLogging: [] };
    }

    // 1. Downsample to sample canvas for ultra-fast (sub-millisecond) pixel processing
    this.sampleCtx.drawImage(videoOrCanvas, 0, 0, this.width, this.height);
    const imgData = this.sampleCtx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    const pixelCount = this.width * this.height;

    // Convert to grayscale
    const currentGray = new Uint8Array(pixelCount);
    for (let i = 0, j = 0; i < pixelCount; i++, j += 4) {
      // Fast integer luminance approximation
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

    // 2. Dual Motion Differencing:
    // Combines frame-to-frame diff (|t - (t-1)|) and running background diff (|t - bg|)
    const diffThreshold = this.thresholdMap[this.config.sensitivity];
    const gridMotionCount = new Uint16Array(this.gridCols * this.gridRows);

    // Adaptive background learning rate: 0.04 (adapts to clouds/lighting but moving cars stand out)
    const bgRate = 0.04;

    for (let y = 0; y < this.height; y++) {
      const rowOffset = y * this.width;
      const gridY = Math.floor(y / this.cellH);
      const gridRowOffset = gridY * this.gridCols;

      for (let x = 0; x < this.width; x++) {
        const idx = rowOffset + x;
        const cur = currentGray[idx];
        const prev = this.prevFrameData[idx];
        const bg = this.backgroundData[idx];

        // Motion difference
        const frameDiff = Math.abs(cur - prev);
        const bgDiff = Math.abs(cur - bg);

        // Update background model
        this.backgroundData[idx] = bg * (1 - bgRate) + cur * bgRate;

        // A pixel is moving if it shifted from previous frame or from stationary background
        if (frameDiff > diffThreshold || bgDiff > diffThreshold + 8) {
          const gridX = Math.floor(x / this.cellW);
          gridMotionCount[gridRowOffset + gridX]++;
        }
      }
    }

    // Store previous frame
    this.prevFrameData = currentGray;

    // 3. Grid-Based Clustering (Connected Components on 30x22 grid)
    // A grid cell is active if >= 5 pixels inside it moved
    const minCellActivePixels = 5;
    const activeGrid = new Uint8Array(this.gridCols * this.gridRows);
    for (let i = 0; i < activeGrid.length; i++) {
      if (gridMotionCount[i] >= minCellActivePixels) {
        activeGrid[i] = 1;
      }
    }

    // Connected Component Labeling via Breadth-First Search
    const visited = new Uint8Array(this.gridCols * this.gridRows);
    const rawBoxes: Array<{ minX: number; minY: number; maxX: number; maxY: number; cells: number }> = [];

    for (let gy = 0; gy < this.gridRows; gy++) {
      for (let gx = 0; gx < this.gridCols; gx++) {
        const gIdx = gy * this.gridCols + gx;
        if (activeGrid[gIdx] === 1 && visited[gIdx] === 0) {
          // New moving blob component found: BFS flood fill
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

            // 4-neighborhood
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

          // Filter out tiny noise (e.g. less than 2 connected cells)
          // and reject massive screen shifts (e.g. camera panning > 75% of grid)
          if (cellCount >= 2 && cellCount < this.gridCols * this.gridRows * 0.75) {
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

    // Merge overlapping or adjacent boxes
    const mergedBoxes = this.mergeBoxes(rawBoxes);

    // 4. Scale bounding boxes back to full video/canvas resolution
    const scaleX = srcW / this.width;
    const scaleY = srcH / this.height;

    const detectedCandidates = mergedBoxes
      .map((b) => {
        const x = Math.round(b.minX * scaleX);
        const y = Math.round(b.minY * scaleY);
        const w = Math.round((b.maxX - b.minX) * scaleX);
        const h = Math.round((b.maxY - b.minY) * scaleY);
        return {
          bbox: { x, y, w, h },
          centroid: { x: x + w / 2, y: y + h / 2 },
          area: w * h,
        };
      })
      .filter((b) => b.area >= this.config.minAreaPx);

    // 5. Track Association & Speed Estimation
    // Camera Optical FOV model for speed conversion:
    // Horizontal Field of view ≈ 65 degrees. Visible road width W ≈ 2 * D * tan(32.5 deg) ≈ 1.28 * D
    const visibleWidthMeters = 1.28 * Math.max(1, this.config.distanceMeters);
    const pixelsPerMeter = srcW / visibleWidthMeters;
    // Angular correction for oblique movement: (speed = rawSpeed / sin(angle))
    const angleRad = (Math.max(15, Math.min(90, this.config.angleDegrees)) * Math.PI) / 180;
    const angleCorrectionFactor = 1.0 / Math.sin(angleRad);

    const newlyDetectedForLogging: MotionBlob[] = [];
    const matchedTrackIds = new Set<number>();

    for (const det of detectedCandidates) {
      // Find closest active blob by centroid distance
      let bestBlob: MotionBlob | null = null;
      let minDistance = 140 * (srcW / 640); // match threshold

      for (const [id, blob] of this.activeBlobs.entries()) {
        if (matchedTrackIds.has(id)) continue;
        const d = Math.hypot(det.centroid.x - blob.centroid.x, det.centroid.y - blob.centroid.y);
        if (d < minDistance) {
          minDistance = d;
          bestBlob = blob;
        }
      }

      if (bestBlob) {
        // Update existing track
        matchedTrackIds.add(bestBlob.id);
        bestBlob.bbox = det.bbox;
        bestBlob.centroid = det.centroid;
        bestBlob.lastSeen = timestamp;
        bestBlob.hits++;

        // Add to trajectory
        bestBlob.history.push({ x: det.centroid.x, y: det.centroid.y, time: timestamp });
        if (bestBlob.history.length > 30) {
          bestBlob.history.shift();
        }

        // Calculate speed over last ~0.2 - 0.5s window
        if (bestBlob.history.length >= 3) {
          const k = Math.min(8, bestBlob.history.length - 1);
          const past = bestBlob.history[bestBlob.history.length - 1 - k];
          const curr = bestBlob.history[bestBlob.history.length - 1];

          const dt = (curr.time - past.time) / 1000;
          if (dt > 0.06) {
            const dx = curr.x - past.x;
            const dy = curr.y - past.y;
            const dPixels = Math.hypot(dx, dy);

            // Metric velocity: meters / seconds * 3.6 = km/h
            const dMeters = dPixels / pixelsPerMeter;
            const rawSpeedKmh = (dMeters / dt) * 3.6 * angleCorrectionFactor;

            // Physical vehicle acceleration clamp (< 15 m/s^2)
            const maxDelta = 15 * 3.6 * dt;
            let clampedSpeed = rawSpeedKmh;
            if (bestBlob.currentSpeedKmh > 0 && Math.abs(rawSpeedKmh - bestBlob.currentSpeedKmh) > maxDelta) {
              clampedSpeed = rawSpeedKmh > bestBlob.currentSpeedKmh
                ? bestBlob.currentSpeedKmh + maxDelta
                : Math.max(0, bestBlob.currentSpeedKmh - maxDelta);
            }

            // Exponential Moving Average filter
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

            // Trigger logging once object has sustained reliable movement (> 10 km/h & 5 hits)
            if (!bestBlob.hasBeenLogged && bestBlob.hits >= 5 && bestBlob.currentSpeedKmh > 8) {
              bestBlob.hasBeenLogged = true;
              newlyDetectedForLogging.push(bestBlob);
            }
          }
        }
      } else {
        // Create new motion blob track
        const newId = this.nextTrackId++;
        const newBlob: MotionBlob = {
          id: newId,
          bbox: det.bbox,
          centroid: det.centroid,
          history: [{ x: det.centroid.x, y: det.centroid.y, time: timestamp }],
          currentSpeedKmh: 0,
          peakSpeedKmh: 0,
          avgSpeedKmh: 0,
          distanceTraveledPx: 0,
          speedSamples: [],
          firstSeen: timestamp,
          lastSeen: timestamp,
          hits: 1,
          hasBeenLogged: false,
        };

        this.activeBlobs.set(newId, newBlob);
        matchedTrackIds.add(newId);
      }
    }

    // Remove expired tracks (not seen for > 450ms)
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
    const padding = 6; // merge tolerance in sample pixels

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

          // Check if boxes overlap or are within padding
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
