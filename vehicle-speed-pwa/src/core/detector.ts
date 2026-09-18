/**
 * Mobile-Optimized Object Detector (คน & รถ)
 * 
 * Uses TensorFlow.js with WebGL acceleration + COCO-SSD (MobileNet v2).
 * Strictly filters candidate detections for:
 * - People (คน): 'person'
 * - Vehicles (รถ): 'car', 'motorcycle', 'bus', 'truck', 'bicycle'
 * 
 * Completely ignores non-target elements (leaves, trees, shadows, ground reflections, noise).
 */

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import type { Detection } from './tracker';

export type TargetFilterMode = 'all' | 'vehicles' | 'people';

export interface ClassInfo {
  thaiName: string;
  icon: string;
  category: 'person' | 'vehicle';
}

export function getClassInfo(cls: string): ClassInfo {
  switch (cls.toLowerCase()) {
    case 'person':
      return { thaiName: 'คน', icon: '🏃', category: 'person' };
    case 'car':
      return { thaiName: 'รถยนต์', icon: '🚗', category: 'vehicle' };
    case 'motorcycle':
      return { thaiName: 'มอเตอร์ไซค์', icon: '🏍️', category: 'vehicle' };
    case 'bus':
      return { thaiName: 'รถบัส', icon: '🚌', category: 'vehicle' };
    case 'truck':
      return { thaiName: 'รถบรรทุก', icon: '🚚', category: 'vehicle' };
    case 'bicycle':
      return { thaiName: 'จักรยาน', icon: '🚲', category: 'vehicle' };
    default:
      return { thaiName: 'รถ', icon: '🚗', category: 'vehicle' };
  }
}

export interface DetectorConfig {
  scoreThreshold?: number;
  maxLatencyMs?: number;
  enableAdaptiveResolution?: boolean;
  filterMode?: TargetFilterMode;
}

export class ObjectDetector {
  private model: cocoSsd.ObjectDetection | null = null;
  private isModelLoading = false;
  private isReady = false;

  public scoreThreshold: number;
  private maxLatencyMs: number;
  private enableAdaptiveResolution: boolean;
  public filterMode: TargetFilterMode = 'all';

  // Latency & adaptive downscaling stats
  private latencyHistory: number[] = [];
  public currentLatencyMs = 0;
  public internalScale = 0.75; // 0.75 provides great balance of speed (15-25ms) and accuracy

  // Target class sets
  private readonly vehicleClasses = new Set(['car', 'motorcycle', 'bus', 'truck', 'bicycle']);
  private readonly personClasses = new Set(['person']);

  // Offscreen canvas for downsampling inference inputs
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;

  constructor(config?: DetectorConfig) {
    this.scoreThreshold = config?.scoreThreshold ?? 0.30;
    this.maxLatencyMs = config?.maxLatencyMs ?? 35.0;
    this.enableAdaptiveResolution = config?.enableAdaptiveResolution ?? true;
    this.filterMode = config?.filterMode ?? 'all';

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  public setScoreThreshold(threshold: number): void {
    this.scoreThreshold = Math.max(0.15, Math.min(0.85, threshold));
  }

  public setFilterMode(mode: TargetFilterMode): void {
    this.filterMode = mode;
  }

  /**
   * Initializes TensorFlow.js backend (WebGL prioritized for mobile GPU acceleration)
   * and loads lightweight MobileNet-based COCO-SSD.
   */
  public async init(): Promise<void> {
    if (this.isReady || this.isModelLoading) return;
    this.isModelLoading = true;

    try {
      await tf.setBackend('webgl');
      await tf.ready();
      console.log(`[Detector] TFJS initialized with backend: ${tf.getBackend()}`);

      this.model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      this.isReady = true;
      console.log('[Detector] COCO-SSD (lite_mobilenet_v2) loaded successfully.');
    } catch (err) {
      console.warn('[Detector] WebGL/lite model failed, attempting mobilenet_v2 fallback:', err);
      try {
        this.model = await cocoSsd.load({ base: 'mobilenet_v2' });
        this.isReady = true;
      } catch (fallbackErr) {
        console.warn('[Detector] Gpu failed, falling back to CPU:', fallbackErr);
        try {
          await tf.setBackend('cpu');
          await tf.ready();
          this.model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
          this.isReady = true;
        } catch (fatalErr) {
          console.error('[Detector] Fatal error loading detector model:', fatalErr);
          throw fatalErr;
        }
      }
    } finally {
      this.isModelLoading = false;
    }
  }

  public get ready(): boolean {
    return this.isReady;
  }

  public get loading(): boolean {
    return this.isModelLoading;
  }

  /**
   * Detects specifically People (คน) and Vehicles (รถ)
   */
  public async detect(
    source: HTMLVideoElement | HTMLCanvasElement
  ): Promise<{ detections: Detection[]; latencyMs: number; scale: number }> {
    if (!this.isReady || !this.model) {
      return { detections: [], latencyMs: 0, scale: 1.0 };
    }

    const t0 = performance.now();

    const srcWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const srcHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

    if (srcWidth === 0 || srcHeight === 0) {
      return { detections: [], latencyMs: 0, scale: 1.0 };
    }

    // Adaptive downsampling: prepare offscreen canvas
    const targetW = Math.round(srcWidth * this.internalScale);
    const targetH = Math.round(srcHeight * this.internalScale);

    let inferenceSource: HTMLVideoElement | HTMLCanvasElement = source;

    if (this.internalScale < 0.99 && this.offscreenCtx) {
      if (this.offscreenCanvas.width !== targetW || this.offscreenCanvas.height !== targetH) {
        this.offscreenCanvas.width = targetW;
        this.offscreenCanvas.height = targetH;
      }
      this.offscreenCtx.drawImage(source, 0, 0, targetW, targetH);
      inferenceSource = this.offscreenCanvas;
    }

    // Run inference
    const predictions = await this.model.detect(inferenceSource, 12, this.scoreThreshold);
    const t1 = performance.now();
    const latency = t1 - t0;

    this.currentLatencyMs = Math.round(latency);
    this.updateAdaptiveScaling(latency);

    // Filter specifically for People and Vehicles based on active filterMode
    const scaleFactor = 1.0 / this.internalScale;
    const detections: Detection[] = [];

    for (const pred of predictions) {
      const cls = pred.class.toLowerCase();
      const isVehicle = this.vehicleClasses.has(cls);
      const isPerson = this.personClasses.has(cls);

      // Strict filter
      if (this.filterMode === 'vehicles' && !isVehicle) continue;
      if (this.filterMode === 'people' && !isPerson) continue;
      if (this.filterMode === 'all' && !isVehicle && !isPerson) continue;

      const [x, y, w, h] = pred.bbox;

      // Filter out tiny false positives (e.g. less than 24x24 px in source)
      if (w * scaleFactor < 24 || h * scaleFactor < 24) continue;

      detections.push({
        bbox: {
          x: Math.round(x * scaleFactor),
          y: Math.round(y * scaleFactor),
          w: Math.round(w * scaleFactor),
          h: Math.round(h * scaleFactor),
        },
        score: pred.score,
        class: pred.class,
      });
    }

    return {
      detections,
      latencyMs: this.currentLatencyMs,
      scale: this.internalScale,
    };
  }

  /**
   * Adjusts internal resolution if inference takes too long (mitigates overheating / frame drops)
   */
  private updateAdaptiveScaling(latency: number): void {
    if (!this.enableAdaptiveResolution) return;

    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > 10) {
      this.latencyHistory.shift();
    }

    const avgLatency = this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length;

    // If average latency exceeds 35ms, downsample
    if (avgLatency > this.maxLatencyMs) {
      if (this.internalScale > 0.4) {
        this.internalScale = Math.max(0.4, this.internalScale - 0.1);
        this.latencyHistory = [];
      }
    } else if (avgLatency < 18 && this.internalScale < 0.9 && this.latencyHistory.length >= 10) {
      this.internalScale = Math.min(0.9, this.internalScale + 0.1);
      this.latencyHistory = [];
    }
  }

  public dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}
