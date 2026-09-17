/**
 * Traffic Simulation Engine for Desktop & Laboratory Testing
 * 
 * Generates an interactive synthetic highway perspective view with moving vehicles
 * traveling at predefined realistic velocities. Provides ground-truth speed comparison
 * to verify Homography calibration, Kalman filter tracking, and velocity math.
 */

import type { Point2D } from '../core/homography';

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
  private nextVehicleId = 1;

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
    this.vehicles = [
      {
        id: this.nextVehicleId++,
        class: 'car',
        lane: 0,
        distanceMeters: 2.0,
        targetSpeedKmh: 55,
        color: '#3b82f6', // blue
        widthMeters: 1.8,
        lengthMeters: 4.2,
      },
      {
        id: this.nextVehicleId++,
        class: 'truck',
        lane: 1,
        distanceMeters: 12.0,
        targetSpeedKmh: 42,
        color: '#f59e0b', // amber
        widthMeters: 2.4,
        lengthMeters: 8.0,
      },
      {
        id: this.nextVehicleId++,
        class: 'motorcycle',
        lane: 0,
        distanceMeters: 22.0,
        targetSpeedKmh: 68,
        color: '#ec4899', // pink
        widthMeters: 0.9,
        lengthMeters: 2.1,
      },
    ];
  }

  /**
   * Updates vehicle positions based on elapsed delta time and renders synthetic frame
   */
  public render(timestamp: number): HTMLCanvasElement {
    if (this.lastTime === 0) this.lastTime = timestamp;
    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    // Advance vehicles
    for (const v of this.vehicles) {
      const speedMps = (v.targetSpeedKmh / 3.6);
      v.distanceMeters += speedMps * dt;

      // Loop back if vehicle exits perspective segment
      if (v.distanceMeters > this.roadLengthMeters + 8) {
        v.distanceMeters = -4;
        v.targetSpeedKmh = 40 + Math.random() * 45; // Vary speed 40-85 km/h
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

    // Vehicle shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, pixelW * 0.55, pixelH * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vehicle body
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.roundRect(left, top, pixelW, pixelH, [6 * scale, 6 * scale, 2, 2]);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Windshield
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(left + 4 * scale, top + 6 * scale, pixelW - 8 * scale, pixelH * 0.28);

    // Taillights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(left + 2, top + pixelH - 4 * scale, 6 * scale, 3 * scale);
    ctx.fillRect(left + pixelW - 8 * scale, top + pixelH - 4 * scale, 6 * scale, 3 * scale);

    // Ground Truth Speed Tag (for validation)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(left, top - 18, pixelW + 20, 16);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`GT: ${Math.round(v.targetSpeedKmh)} km/h`, left + 2, top - 6);
  }
}
