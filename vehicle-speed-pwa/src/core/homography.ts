/**
 * Homography & Perspective Transformation Engine
 * 
 * Computes a 3x3 Homography Matrix (Perspective Transform) using
 * Direct Linear Transformation (DLT) with Gaussian Elimination & Partial Pivoting.
 * 
 * Maps 2D camera image coordinates (pixels) to real-world Euclidean coordinates (meters).
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface CalibrationData {
  /** 4 quadrilateral points on the camera image plane in pixels [P0: Top-Left, P1: Top-Right, P2: Bottom-Right, P3: Bottom-Left] */
  imagePoints: [Point2D, Point2D, Point2D, Point2D];
  /** Real-world width across the road in meters (distance between P0-P1 and P3-P2) */
  roadWidthMeters: number;
  /** Real-world length along the road in meters (distance between P0-P3 and P1-P2) */
  roadLengthMeters: number;
}

export class Homography {
  // 3x3 matrix stored as flat 9-element array in row-major order:
  // [h00, h01, h02,
  //  h10, h11, h12,
  //  h20, h21, h22]
  private H: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  private H_inv: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  private isValid = false;

  constructor(calibration?: CalibrationData) {
    if (calibration) {
      this.compute(calibration);
    }
  }

  /**
   * Computes the 3x3 Homography matrix mapping image pixels -> metric coordinates (meters).
   * 
   * Given 4 image points and 4 metric destination points:
   * P0 -> (0, 0)
   * P1 -> (roadWidth, 0)
   * P2 -> (roadWidth, roadLength)
   * P3 -> (0, roadLength)
   */
  public compute(calibration: CalibrationData): boolean {
    const src = calibration.imagePoints;
    const W = calibration.roadWidthMeters;
    const L = calibration.roadLengthMeters;

    // Destination points in real-world metric coordinates:
    const dst: [Point2D, Point2D, Point2D, Point2D] = [
      { x: 0, y: 0 },
      { x: W, y: 0 },
      { x: W, y: L },
      { x: 0, y: L },
    ];

    const h = this.solveDLT(src, dst);
    if (!h) {
      this.isValid = false;
      return false;
    }

    this.H = h;
    const inv = this.invert3x3(this.H);
    if (!inv) {
      this.isValid = false;
      return false;
    }

    this.H_inv = inv;
    this.isValid = true;
    return true;
  }

  public isCalibrated(): boolean {
    return this.isValid;
  }

  /**
   * Transform a 2D image pixel coordinate (u, v) to metric ground coordinate (X_meters, Y_meters)
   */
  public toMetric(pt: Point2D): Point2D | null {
    if (!this.isValid) return null;
    return this.project(this.H, pt);
  }

  /**
   * Transform a 2D metric ground coordinate (X_meters, Y_meters) to image pixel coordinate (u, v)
   * Useful for projecting metric grid overlays onto the road for visual calibration verification.
   */
  public toPixel(pt: Point2D): Point2D | null {
    if (!this.isValid) return null;
    return this.project(this.H_inv, pt);
  }

  /**
   * Evaluates if a given point in pixels lies inside the 4-point calibration quadrilateral on the road.
   */
  public isInsidePolygon(pt: Point2D, polygon: Point2D[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;

      const intersect =
        yi > pt.y !== yj > pt.y &&
        pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-10) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Project a 2D point using a 3x3 projective transformation matrix:
   * [x', y', w']^T = H * [x, y, 1]^T
   * X = x' / w'
   * Y = y' / w'
   */
  private project(matrix: number[], pt: Point2D): Point2D | null {
    const x = pt.x;
    const y = pt.y;

    const w = matrix[6] * x + matrix[7] * y + matrix[8];
    if (Math.abs(w) < 1e-7) {
      return null; // Point at infinity or behind camera
    }

    const projectedX = (matrix[0] * x + matrix[1] * y + matrix[2]) / w;
    const projectedY = (matrix[3] * x + matrix[4] * y + matrix[5]) / w;

    return { x: projectedX, y: projectedY };
  }

  /**
   * Solves 8x8 linear system for Homography with DLT using Gaussian elimination with partial pivoting.
   * For each point correspondence (x_i, y_i) -> (u_i, v_i):
   * [x, y, 1, 0, 0, 0, -u*x, -u*y] * [h00..h21]^T = u
   * [0, 0, 0, x, y, 1, -v*x, -v*y] * [h00..h21]^T = v
   * with h22 = 1.
   */
  private solveDLT(src: Point2D[], dst: Point2D[]): number[] | null {
    const A: number[][] = [];
    const B: number[] = [];

    for (let i = 0; i < 4; i++) {
      const x = src[i].x;
      const y = src[i].y;
      const u = dst[i].x;
      const v = dst[i].y;

      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
      B.push(u);

      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
      B.push(v);
    }

    // Solve A * h = B for h (8 elements)
    const h = this.gaussianElimination(A, B);
    if (!h) return null;

    // Return 3x3 matrix [h0, h1, h2, h3, h4, h5, h6, h7, 1.0]
    return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1.0];
  }

  /**
   * Gaussian elimination with partial pivoting for numerical stability.
   */
  private gaussianElimination(A: number[][], B: number[]): number[] | null {
    const n = B.length;

    // Forward elimination
    for (let p = 0; p < n; p++) {
      // Find pivot row
      let max = p;
      for (let i = p + 1; i < n; i++) {
        if (Math.abs(A[i][p]) > Math.abs(A[max][p])) {
          max = i;
        }
      }

      // Swap rows in A and B
      const tempA = A[p];
      A[p] = A[max];
      A[max] = tempA;

      const tempB = B[p];
      B[p] = B[max];
      B[max] = tempB;

      // Singular or nearly singular check
      if (Math.abs(A[p][p]) <= 1e-12) {
        return null;
      }

      // Pivot
      for (let i = p + 1; i < n; i++) {
        const alpha = A[i][p] / A[p][p];
        B[i] -= alpha * B[p];
        for (let j = p; j < n; j++) {
          A[i][j] -= alpha * A[p][j];
        }
      }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = 0.0;
      for (let j = i + 1; j < n; j++) {
        sum += A[i][j] * x[j];
      }
      x[i] = (B[i] - sum) / A[i][i];
    }

    return x;
  }

  /**
   * Analytic inversion of 3x3 matrix.
   */
  private invert3x3(m: number[]): number[] | null {
    const [
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    ] = m;

    const det =
      m00 * (m11 * m22 - m12 * m21) -
      m01 * (m10 * m22 - m12 * m20) +
      m02 * (m10 * m21 - m11 * m20);

    if (Math.abs(det) < 1e-12) {
      return null;
    }

    const invDet = 1.0 / det;

    return [
      (m11 * m22 - m12 * m21) * invDet,
      (m02 * m21 - m01 * m22) * invDet,
      (m01 * m12 - m02 * m11) * invDet,
      (m12 * m20 - m10 * m22) * invDet,
      (m00 * m22 - m02 * m20) * invDet,
      (m02 * m10 - m00 * m12) * invDet,
      (m10 * m21 - m11 * m20) * invDet,
      (m01 * m20 - m00 * m21) * invDet,
      (m00 * m11 - m01 * m10) * invDet,
    ];
  }
}
