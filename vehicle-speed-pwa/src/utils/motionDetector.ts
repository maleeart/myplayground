/**
 * Camera Motion & Shake Detector
 * 
 * Uses HTML5 DeviceMotionEvent / DeviceOrientationEvent when available on mobile devices,
 * combined with frame-difference visual sampling to detect camera vibration or shaking.
 * 
 * In roadside speed calculation, camera stability is critical because camera movement
 * translates directly to spurious vehicle velocity readings.
 */

export interface MotionStatus {
  isShaking: boolean;
  intensity: number; // 0.0 (still) to 1.0 (severe shake)
  message: string;
}

export class CameraMotionDetector {
  private isShaking = false;
  private shakeIntensity = 0;
  private lastAccel = { x: 0, y: 0, z: 0 };
  private accelDeltas: number[] = [];
  private hasSensor = false;

  // Frame-difference visual fallback
  private sampleCanvas: HTMLCanvasElement;
  private sampleCtx: CanvasRenderingContext2D | null;
  private prevSampleData: Uint8ClampedArray | null = null;
  private visualDeltas: number[] = [];

  constructor() {
    this.sampleCanvas = document.createElement('canvas');
    this.sampleCanvas.width = 64;
    this.sampleCanvas.height = 48;
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true });

    this.initDeviceMotion();
  }

  private initDeviceMotion(): void {
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      const handleMotion = (event: DeviceMotionEvent) => {
        const acc = event.acceleration;
        if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

        this.hasSensor = true;
        const dx = acc.x - this.lastAccel.x;
        const dy = acc.y - this.lastAccel.y;
        const dz = (acc.z ?? 0) - this.lastAccel.z;

        this.lastAccel = { x: acc.x, y: acc.y, z: acc.z ?? 0 };

        const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);
        this.accelDeltas.push(magnitude);

        if (this.accelDeltas.length > 15) {
          this.accelDeltas.shift();
        }

        const avgJerk = this.accelDeltas.reduce((a, b) => a + b, 0) / this.accelDeltas.length;
        this.isShaking = avgJerk > 1.8;
        this.shakeIntensity = Math.min(1.0, avgJerk / 4.0);
      };

      try {
        window.addEventListener('devicemotion', handleMotion, { passive: true });
      } catch (err) {
        console.warn('[MotionDetector] Device motion listener not supported:', err);
      }
    }
  }

  /**
   * Evaluates frame difference on a 64x48 low-res thumbnail
   * to catch rotational/translational camera shifts even if IMU sensor is unavailable.
   */
  public evaluateFrame(videoOrCanvas: HTMLVideoElement | HTMLCanvasElement): MotionStatus {
    if (!this.hasSensor && this.sampleCtx) {
      this.sampleCtx.drawImage(videoOrCanvas, 0, 0, 64, 48);
      const imgData = this.sampleCtx.getImageData(0, 0, 64, 48).data;

      if (this.prevSampleData) {
        let diffSum = 0;
        const pixelCount = 64 * 48;

        // Sample grayscale difference every 4 bytes (skip alpha)
        for (let i = 0; i < imgData.length; i += 8) {
          const lum1 = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
          const lum2 =
            0.299 * this.prevSampleData[i] +
            0.587 * this.prevSampleData[i + 1] +
            0.114 * this.prevSampleData[i + 2];
          diffSum += Math.abs(lum1 - lum2);
        }

        const avgDiff = diffSum / (pixelCount / 2);
        this.visualDeltas.push(avgDiff);
        if (this.visualDeltas.length > 10) {
          this.visualDeltas.shift();
        }

        const avgVisualDiff =
          this.visualDeltas.reduce((a, b) => a + b, 0) / this.visualDeltas.length;

        // High global scene shift indicates camera panning or shaking
        this.isShaking = avgVisualDiff > 18.0;
        this.shakeIntensity = Math.min(1.0, avgVisualDiff / 35.0);
      }

      this.prevSampleData = new Uint8ClampedArray(imgData);
    }

    return {
      isShaking: this.isShaking,
      intensity: this.shakeIntensity,
      message: this.isShaking
        ? '⚠️ Camera shake detected! Stabilize camera on a tripod for accurate speed measurements.'
        : 'Camera stable',
    };
  }
}
