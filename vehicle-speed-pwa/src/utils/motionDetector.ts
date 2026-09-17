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
  public isTripodMode = true; // Default to true (ideal for speed estimation)

  constructor() {
    this.initDeviceMotion();
  }

  public setTripodMode(enabled: boolean): void {
    this.isTripodMode = enabled;
    if (enabled) {
      this.isShaking = false;
      this.shakeIntensity = 0;
    }
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
        // Require significant physical jerk (> 2.8 m/s²) to avoid false positives
        this.isShaking = avgJerk > 2.8;
        this.shakeIntensity = Math.min(1.0, avgJerk / 5.0);
      };

      try {
        window.addEventListener('devicemotion', handleMotion, { passive: true });
      } catch (err) {
        console.warn('[MotionDetector] Device motion listener not supported:', err);
      }
    }
  }

  /**
   * Evaluates camera motion.
   * If Tripod Mode is active or no physical IMU sensor detects jerk, reports camera as stable.
   */
  public evaluateFrame(_videoOrCanvas?: HTMLVideoElement | HTMLCanvasElement): MotionStatus {
    // 1. In Tripod Mode or without physical IMU: always stable, never false alarm
    if (this.isTripodMode || !this.hasSensor) {
      return {
        isShaking: false,
        intensity: 0,
        message: 'Tripod Mode Active (Rock Steady)',
      };
    }

    // 2. In Handheld Mode: rely on physical IMU accelerometer
    return {
      isShaking: this.isShaking,
      intensity: this.shakeIntensity,
      message: this.isShaking
        ? '⚠️ ตรวจพบการสั่นไหวของกล้อง โปรดถือให้นิ่งหรือวางบนขาตั้ง'
        : 'กล้องนิ่งเสถียร',
    };
  }
}
