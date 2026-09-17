/**
 * Real-Time Vehicle Speed Estimator Engine
 * 
 * Projects bottom-center bounding box pixel coordinates to metric coordinates (X, Y in meters)
 * using the calibrated Homography matrix, then computes instantaneous and smoothed velocity in km/h.
 * 
 * Features:
 * - Δs / Δt * 3.6 metric velocity computation
 * - Sliding window displacement filter (avoids single-frame bounding box jitter)
 * - Exponential Moving Average (EMA) smoothing
 * - Physical acceleration clamp (< 12 m/s²) to reject false jitter spikes
 * - Low-speed deadband (< 2.5 km/h) for stationary vehicles
 */

import type { Point2D } from './homography';
import { Homography } from './homography';
import type { STrack } from './tracker';

export interface VehicleSpeedStats {
  trackId: number;
  vehicleClass: string;
  currentSpeedKmh: number;
  averageSpeedKmh: number;
  maxSpeedKmh: number;
  isStationary: boolean;
  isOverLimit: boolean;
  metricPosition: Point2D | null;
  distanceTraveledMeters: number;
  durationSeconds: number;
}

export class SpeedEstimator {
  private homography: Homography;
  private speedLimitKmh: number;
  private windowFrames: number;
  private smoothingFactor: number; // Alpha for EMA (0 < alpha <= 1)
  private maxRealisticAccelMps2 = 12.0; // Max ~1.2G acceleration clamp

  constructor(options?: {
    homography?: Homography;
    speedLimitKmh?: number;
    windowFrames?: number;
    smoothingFactor?: number;
  }) {
    this.homography = options?.homography ?? new Homography();
    this.speedLimitKmh = options?.speedLimitKmh ?? 60.0;
    this.windowFrames = options?.windowFrames ?? 6;
    this.smoothingFactor = options?.smoothingFactor ?? 0.3;
  }

  public setHomography(homography: Homography): void {
    this.homography = homography;
  }

  public setSpeedLimit(limit: number): void {
    this.speedLimitKmh = limit;
  }

  public setSmoothingFactor(alpha: number): void {
    this.smoothingFactor = Math.max(0.05, Math.min(1.0, alpha));
  }

  /**
   * Process all confirmed tracks for the current frame and calculate speed stats
   */
  public update(tracks: STrack[], timestamp: number): Map<number, VehicleSpeedStats> {
    const statsMap = new Map<number, VehicleSpeedStats>();

    if (!this.homography.isCalibrated()) {
      // Homography not yet calibrated: return empty/zero stats
      for (const track of tracks) {
        statsMap.set(track.id, {
          trackId: track.id,
          vehicleClass: track.class,
          currentSpeedKmh: 0,
          averageSpeedKmh: 0,
          maxSpeedKmh: 0,
          isStationary: true,
          isOverLimit: false,
          metricPosition: null,
          distanceTraveledMeters: 0,
          durationSeconds: 0,
        });
      }
      return statsMap;
    }

    for (const track of tracks) {
      const basePoint = track.getBottomCenter();
      const metricPt = this.homography.toMetric(basePoint);

      if (!metricPt) continue;

      // Update the latest trajectory point with metric coordinates
      const latestHistory = track.history[track.history.length - 1];
      if (latestHistory) {
        latestHistory.metric = metricPt;
      }

      // Compute speed across the sliding window
      const stats = this.computeTrackSpeed(track, timestamp, metricPt);
      statsMap.set(track.id, stats);
    }

    return statsMap;
  }

  /**
   * Calculates metric speed for a single vehicle track
   */
  private computeTrackSpeed(
    track: STrack,
    currentTimestamp: number,
    currentMetricPt: Point2D
  ): VehicleSpeedStats {
    // Collect valid metric history points
    const metricHistory = track.history.filter((h) => h.metric !== undefined);

    if (metricHistory.length < 2) {
      return {
        trackId: track.id,
        vehicleClass: track.class,
        currentSpeedKmh: track.currentSpeedKmh,
        averageSpeedKmh: track.averageSpeedKmh,
        maxSpeedKmh: track.maxSpeedKmh,
        isStationary: true,
        isOverLimit: false,
        metricPosition: currentMetricPt,
        distanceTraveledMeters: 0,
        durationSeconds: 0,
      };
    }

    // Determine window endpoint: k frames back
    const k = Math.min(this.windowFrames, metricHistory.length - 1);
    const pastPoint = metricHistory[metricHistory.length - 1 - k];
    const latestPoint = metricHistory[metricHistory.length - 1];

    const dtSeconds = (latestPoint.timestamp - pastPoint.timestamp) / 1000.0;

    let instantaneousSpeedKmh = 0;

    if (dtSeconds > 0.05) {
      // Euclidean distance in meters on the ground plane
      const dx = latestPoint.metric!.x - pastPoint.metric!.x;
      const dy = latestPoint.metric!.y - pastPoint.metric!.y;
      const deltaMeters = Math.sqrt(dx * dx + dy * dy);

      // Raw speed: (meters / seconds) * 3.6 = km/h
      const rawSpeedKmh = (deltaMeters / dtSeconds) * 3.6;

      // Acceleration sanity check: clamp extreme spikes caused by detection bbox jumps
      const prevSpeedKmh = track.currentSpeedKmh;
      const maxSpeedDeltaKmh = this.maxRealisticAccelMps2 * 3.6 * dtSeconds;

      let filteredSpeed = rawSpeedKmh;
      if (prevSpeedKmh > 0 && Math.abs(rawSpeedKmh - prevSpeedKmh) > maxSpeedDeltaKmh) {
        filteredSpeed =
          rawSpeedKmh > prevSpeedKmh
            ? prevSpeedKmh + maxSpeedDeltaKmh
            : Math.max(0, prevSpeedKmh - maxSpeedDeltaKmh);
      }

      // Exponential Moving Average filter for smooth display
      if (track.currentSpeedKmh === 0) {
        instantaneousSpeedKmh = filteredSpeed;
      } else {
        instantaneousSpeedKmh =
          this.smoothingFactor * filteredSpeed + (1 - this.smoothingFactor) * track.currentSpeedKmh;
      }

      // Stationary vehicle deadband threshold (< 2.5 km/h)
      if (instantaneousSpeedKmh < 2.5) {
        instantaneousSpeedKmh = 0;
      }
    } else {
      instantaneousSpeedKmh = track.currentSpeedKmh;
    }

    // Update track state stats
    track.currentSpeedKmh = instantaneousSpeedKmh;
    if (instantaneousSpeedKmh > 3.0) {
      track.speedSamples.push(instantaneousSpeedKmh);
      track.maxSpeedKmh = Math.max(track.maxSpeedKmh, instantaneousSpeedKmh);
    }

    if (track.speedSamples.length > 0) {
      const sum = track.speedSamples.reduce((a, b) => a + b, 0);
      track.averageSpeedKmh = sum / track.speedSamples.length;
    }

    // Cumulative distance traveled
    const firstPoint = metricHistory[0];
    const totalDt = (currentTimestamp - firstPoint.timestamp) / 1000.0;
    let totalDist = 0;
    for (let i = 1; i < metricHistory.length; i++) {
      const dX = metricHistory[i].metric!.x - metricHistory[i - 1].metric!.x;
      const dY = metricHistory[i].metric!.y - metricHistory[i - 1].metric!.y;
      totalDist += Math.sqrt(dX * dX + dY * dY);
    }

    return {
      trackId: track.id,
      vehicleClass: track.class,
      currentSpeedKmh: Math.round(track.currentSpeedKmh * 10) / 10,
      averageSpeedKmh: Math.round(track.averageSpeedKmh * 10) / 10,
      maxSpeedKmh: Math.round(track.maxSpeedKmh * 10) / 10,
      isStationary: track.currentSpeedKmh < 2.5,
      isOverLimit: track.currentSpeedKmh > this.speedLimitKmh,
      metricPosition: currentMetricPt,
      distanceTraveledMeters: Math.round(totalDist * 10) / 10,
      durationSeconds: Math.round(totalDt * 10) / 10,
    };
  }
}
