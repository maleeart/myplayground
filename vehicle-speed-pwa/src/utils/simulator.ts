/**
 * Traffic Simulation Engine for Desktop & Laboratory Testing
 * 
 * Generates an interactive synthetic highway perspective view with moving vehicles
 * traveling at predefined realistic velocities. Provides ground-truth speed comparison
 * to verify Homography calibration, Kalman filter tracking, and velocity math.
 */

import type { Point2D, CalibrationData } from '../core/homography';
import type { Detection } from '../core/tracker';

export interface SimVehicle {
  id: number;
  class: 'car' | 'truck' | 'motorcycle' | 'bus';
  lane: number; // 0 (left lane), 1 (right lane)
  distanceMeters: number; // position along road (0 to 30 meters)
  targetSpeedKmh: number;
  color: string;
  widthMeters: number;
  lengthMeters: number;
}

export class TrafficSimulator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private vehicles: SimVehicle[] = [];
  private lastTime = 0;
  private roadWidthMeters = 7.0; // 2 lanes (3.5m each)
  private roadLengthMeters = 30.0;
  public isPaused = false;
  public autoSpawn = true;
  private nextVehicleId = 1;
  private spawnCooldownTimer = 0;

  constructor(width = 640, height = 480) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
    this.initVehicles();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  private initVehicles(): void {
    // Only 1 vehicle to start calmly
    this.vehicles = [
      {
        id: this.nextVehicleId++,
        class: 'car',
        lane: 0,
        distanceMeters: -1,
        targetSpeedKmh: 55,
        color: '#2563eb', // royal blue
        widthMeters: 1.8,
        lengthMeters: 4.2,
      },
    ];
  }

  /**
   * Spawns a single test vehicle
   */
  public spawnVehicle(vehicleClass: 'car' | 'truck' | 'motorcycle' = 'car', targetSpeed = 60): void {
    const lane = Math.random() > 0.5 ? 1 : 0;
    const colors = {
      car: '#2563eb',
      truck: '#d97706',
      motorcycle: '#db2777',
      bus: '#059669',
    };

    this.vehicles.push({
      id: this.nextVehicleId++,
      class: vehicleClass,
      lane,
      distanceMeters: -2,
      targetSpeedKmh: targetSpeed,
      color: colors[vehicleClass] || '#2563eb',
      widthMeters: vehicleClass === 'truck' ? 2.4 : vehicleClass === 'motorcycle' ? 0.9 : 1.8,
      lengthMeters: vehicleClass === 'truck' ? 8.0 : vehicleClass === 'motorcycle' ? 2.1 : 4.2,
    });
  }

  /**
   * Spawns an aggressive high-speed vehicle (e.g. 90-110 km/h) to test overspeed alerts
   */
  public spawnSpeedingVehicle(): void {
    const lane = Math.random() > 0.5 ? 1 : 0;
    this.vehicles.push({
      id: this.nextVehicleId++,
      class: 'car',
      lane,
      distanceMeters: -2,
      targetSpeedKmh: 92 + Math.round(Math.random() * 15), // 92 - 107 km/h
      color: '#dc2626', // Speeding Red Sports Car
      widthMeters: 1.8,
      lengthMeters: 4.2,
    });
  }

  /**
   * Returns synthetic detections matching the moving vehicles for laboratory verification
   */
  public getDetections(): Detection[] {
    const detections: Detection[] = [];
    for (const v of this.vehicles) {
      if (v.distanceMeters < 0.5 || v.distanceMeters > this.roadLengthMeters + 3.0) {
        continue;
      }
      const laneCenterX = v.lane === 0 ? 1.75 : 5.25;
      const pos = this.projectToPixel(laneCenterX, v.distanceMeters);

      const scale = 0.35 + (v.distanceMeters / this.roadLengthMeters) * 0.9;
      const pixelW = (v.class === 'motorcycle' ? 26 : v.class === 'truck' ? 62 : 44) * scale;
      const pixelH = (v.class === 'motorcycle' ? 32 : v.class === 'truck' ? 70 : 50) * scale;

      const left = pos.x - pixelW / 2;
      const top = pos.y - pixelH;

      // Realistic microscopic jitter for Kalman filtering
      const jitterX = (Math.random() - 0.5) * 0.8;
      const jitterY = (Math.random() - 0.5) * 0.8;

      detections.push({
        bbox: {
          x: Math.round(left + jitterX),
          y: Math.round(top + jitterY),
          w: Math.round(pixelW),
          h: Math.round(pixelH),
        },
        class: v.class,
        score: Math.min(0.98, 0.90 + Math.random() * 0.08),
      });
    }
    return detections;
  }

  /**
   * Returns exact CalibrationData corresponding to this simulated road
   */
  public getSimCalibration(): CalibrationData {
    return {
      imagePoints: this.getDefaultCalibrationPoints(),
      roadWidthMeters: this.roadWidthMeters,
      roadLengthMeters: this.roadLengthMeters,
    };
  }

  /**
   * Clears all active vehicles
   */
  public clearVehicles(): void {
    this.vehicles = [];
  }

  /**
   * Returns current active vehicle count
   */
  public getVehicleCount(): number {
    return this.vehicles.length;
  }

  /**
   * Updates vehicle positions based on elapsed delta time and renders synthetic frame
   */
  public render(timestamp: number): HTMLCanvasElement {
    if (this.lastTime === 0) this.lastTime = timestamp;
    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    if (!this.isPaused) {
      // Advance vehicles and remove exited ones
      for (let i = this.vehicles.length - 1; i >= 0; i--) {
        const v = this.vehicles[i];
        const speedMps = v.targetSpeedKmh / 3.6;
        v.distanceMeters += speedMps * dt;

        // Vehicle exits bottom of screen
        if (v.distanceMeters > this.roadLengthMeters + 4) {
          this.vehicles.splice(i, 1);
          // 3.5s of calm empty road before auto-spawning next car
          this.spawnCooldownTimer = 3.5;
        }
      }

      // Calm Auto-Spawn: Only when road is completely clear and cooldown expires
      if (this.autoSpawn && this.vehicles.length === 0) {
        this.spawnCooldownTimer -= dt;
        if (this.spawnCooldownTimer <= 0) {
          const speeds = [50, 58, 65, 72];
          const chosenSpeed = speeds[Math.floor(Math.random() * speeds.length)];
          this.spawnVehicle('car', chosenSpeed);
          this.spawnCooldownTimer = 4.0;
        }
      }
    }

    this.drawScene();
    return this.canvas;
  }

  /**
   * Perspective projection from ground coordinates (X_m, Y_m) to Canvas pixels
   */
  public projectToPixel(xM: number, yM: number): Point2D {
    // Road horizon at Y = 130px, near base at Y = 460px
    const horizonY = 130;
    const baseY = 460;
    const t = Math.min(1.0, Math.max(0, yM / this.roadLengthMeters)); // 0 (near horizon) to 1 (near bottom)

    // Interpolate vertical pixel
    const pixelY = horizonY + t * (baseY - horizonY);

    // Trapezoid road width: narrow at horizon (140px), wide at bottom (520px)
    const roadWidthAtY = 140 + t * (520 - 140);
    const centerX = this.canvas.width / 2;

    // Center X offset based on lane position (-1.0 to 1.0)
    const normalizedX = (xM / this.roadWidthMeters) - 0.5; // -0.5 to 0.5
    const pixelX = centerX + normalizedX * roadWidthAtY;

    return { x: pixelX, y: pixelY };
  }

  /**
   * Returns default calibration quadrilateral corresponding to this simulated road
   */
  public getDefaultCalibrationPoints(): [Point2D, Point2D, Point2D, Point2D] {
    const p0 = this.projectToPixel(0, 0);
    const p1 = this.projectToPixel(this.roadWidthMeters, 0);
    const p2 = this.projectToPixel(this.roadWidthMeters, this.roadLengthMeters);
    const p3 = this.projectToPixel(0, this.roadLengthMeters);
    return [p0, p1, p2, p3];
  }

  private drawScene(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background sky and scenery
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 160);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, 160);

    // Ground grass
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 160, w, h - 160);

    // Road surface polygon (asphalt)
    const p0 = this.projectToPixel(-0.5, 0);
    const p1 = this.projectToPixel(this.roadWidthMeters + 0.5, 0);
    const p2 = this.projectToPixel(this.roadWidthMeters + 0.5, this.roadLengthMeters);
    const p3 = this.projectToPixel(-0.5, this.roadLengthMeters);

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fillStyle = '#1e2024';
    ctx.fill();

    // Road shoulder border lines
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Center dashed lane divider
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 16]);
    const c0 = this.projectToPixel(this.roadWidthMeters / 2, 0);
    const c1 = this.projectToPixel(this.roadWidthMeters / 2, this.roadLengthMeters);
    ctx.beginPath();
    ctx.moveTo(c0.x, c0.y);
    ctx.lineTo(c1.x, c1.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Simulator Mode Top Watermark Banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(12, 12, 340, 28, [8]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('🎮 VIRTUAL TRAFFIC SIMULATOR (SIM)', 24, 30);

    // Draw vehicles sorted by distance (back to front)
    const sorted = [...this.vehicles].sort((a, b) => a.distanceMeters - b.distanceMeters);

    for (const v of sorted) {
      this.drawVehicle(v);
    }
  }

  private drawVehicle(v: SimVehicle): void {
    const ctx = this.ctx;
    const laneCenterX = v.lane === 0 ? 1.75 : 5.25;
    const pos = this.projectToPixel(laneCenterX, v.distanceMeters);

    // Perspective scale factor (smaller near horizon, larger in foreground)
    const scale = 0.35 + (v.distanceMeters / this.roadLengthMeters) * 0.9;
    const pixelW = (v.class === 'motorcycle' ? 26 : v.class === 'truck' ? 62 : 44) * scale;
    const pixelH = (v.class === 'motorcycle' ? 32 : v.class === 'truck' ? 70 : 50) * scale;

    const left = pos.x - pixelW / 2;
    const top = pos.y - pixelH;

    // Headlight cones shining forward onto asphalt
    ctx.save();
    const lightGrad = ctx.createRadialGradient(
      pos.x, pos.y, 4 * scale,
      pos.x, pos.y + 35 * scale, 45 * scale
    );
    lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.3)');
    lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(left + 2, top + pixelH);
    ctx.lineTo(left - 12 * scale, top + pixelH + 40 * scale);
    ctx.lineTo(left + pixelW + 12 * scale, top + pixelH + 40 * scale);
    ctx.lineTo(left + pixelW - 2, top + pixelH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Vehicle ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, pixelW * 0.55, pixelH * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tires (left and right)
    const tireW = Math.max(3, 5 * scale);
    const tireH = Math.max(6, 12 * scale);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(left - tireW / 2, top + pixelH - tireH - 2 * scale, tireW, tireH);
    ctx.fillRect(left + pixelW - tireW / 2, top + pixelH - tireH - 2 * scale, tireW, tireH);
    ctx.fillRect(left - tireW / 2, top + 4 * scale, tireW, tireH);
    ctx.fillRect(left + pixelW - tireW / 2, top + 4 * scale, tireW, tireH);

    // Vehicle body with gradient
    const bodyGrad = ctx.createLinearGradient(left, top, left + pixelW, top + pixelH);
    bodyGrad.addColorStop(0, v.color);
    bodyGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(left, top, pixelW, pixelH, [8 * scale, 8 * scale, 4 * scale, 4 * scale]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Windshield (facing forward/downward)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(left + 4 * scale, top + pixelH * 0.45, pixelW - 8 * scale, pixelH * 0.28, [3 * scale]);
    ctx.fill();

    // Glass glare reflection
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left + 6 * scale, top + pixelH * 0.5);
    ctx.lineTo(left + pixelW - 10 * scale, top + pixelH * 0.65);
    ctx.stroke();

    // Headlights (bright yellow/white on front bumper)
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(left + 3 * scale, top + pixelH - 4 * scale, 6 * scale, 3 * scale);
    ctx.fillRect(left + pixelW - 9 * scale, top + pixelH - 4 * scale, 6 * scale, 3 * scale);

    // Front grille
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(left + pixelW * 0.28, top + pixelH - 3 * scale, pixelW * 0.44, 2 * scale);

    // Ground Truth Speed Tag (for validation and calibration check)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(left - 4, top - 18 * scale, pixelW + 8, 15 * scale);
    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold ${Math.max(9, Math.round(10 * scale))}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`GT: ${Math.round(v.targetSpeedKmh)} km/h`, left + pixelW / 2, top - 7 * scale);
    ctx.textAlign = 'left';
  }
}
