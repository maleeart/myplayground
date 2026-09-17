/**
 * 8-State Linear Kalman Filter for Bounding Box Tracking (ByteTrack / SORT)
 * 
 * State vector: [x, y, a, h, vx, vy, va, vh]^T
 * - (x, y): center coordinates of the bounding box
 * - a: aspect ratio (w / h)
 * - h: height of the bounding box
 * - vx, vy, va, vh: instantaneous velocities
 * 
 * Measurement vector: [x, y, a, h]^T
 */

export interface BoundingBox {
  x: number; // top-left x
  y: number; // top-left y
  w: number; // width
  h: number; // height
}

export class KalmanBoxTracker {
  // State: 8x1
  public mean: number[] = new Array(8).fill(0);
  // Covariance: 8x8 matrix (flattened 64)
  public covariance: number[] = new Array(64).fill(0);

  private stdWeightPosition = 1.0 / 20;
  private stdWeightVelocity = 1.0 / 160;

  constructor(bbox: BoundingBox) {
    this.init(bbox);
  }

  /**
   * Initialize state and covariance from initial detection bounding box
   */
  public init(bbox: BoundingBox): void {
    const cx = bbox.x + bbox.w / 2;
    const cy = bbox.y + bbox.h / 2;
    const a = bbox.w / (bbox.h > 0 ? bbox.h : 1);
    const h = bbox.h;

    this.mean = [cx, cy, a, h, 0, 0, 0, 0];

    const stdPos = [
      2 * this.stdWeightPosition * h,
      2 * this.stdWeightPosition * h,
      1e-2,
      2 * this.stdWeightPosition * h,
    ];
    const stdVel = [
      10 * this.stdWeightVelocity * h,
      10 * this.stdWeightVelocity * h,
      1e-5,
      10 * this.stdWeightVelocity * h,
    ];

    const std = [...stdPos, ...stdVel];
    this.covariance = new Array(64).fill(0);
    for (let i = 0; i < 8; i++) {
      this.covariance[i * 8 + i] = std[i] * std[i];
    }
  }

  /**
   * Predict next state: x' = F * x, P' = F * P * F^T + Q
   */
  public predict(): BoundingBox {
    const h = this.mean[3];
    const stdPos = [
      this.stdWeightPosition * h,
      this.stdWeightPosition * h,
      1e-2,
      this.stdWeightPosition * h,
    ];
    const stdVel = [
      this.stdWeightVelocity * h,
      this.stdWeightVelocity * h,
      1e-5,
      this.stdWeightVelocity * h,
    ];
    const qStd = [...stdPos, ...stdVel];

    // F * mean: state transition with dt=1
    // x = x + vx, y = y + vy, a = a + va, h = h + vh
    for (let i = 0; i < 4; i++) {
      this.mean[i] += this.mean[i + 4];
    }

    // F * P * F^T + Q
    // For our upper-triangular block F = [[I, I], [0, I]]:
    const newCov = [...this.covariance];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const p_ij = this.covariance[i * 8 + j];
        const p_iv = this.covariance[i * 8 + (j + 4)];
        const p_vi = this.covariance[(i + 4) * 8 + j];
        const p_vv = this.covariance[(i + 4) * 8 + (j + 4)];
        newCov[i * 8 + j] = p_ij + p_iv + p_vi + p_vv;
        newCov[i * 8 + (j + 4)] = p_iv + p_vv;
        newCov[(i + 4) * 8 + j] = p_vi + p_vv;
      }
    }

    // Add process noise Q (diagonal)
    for (let i = 0; i < 8; i++) {
      newCov[i * 8 + i] += qStd[i] * qStd[i];
    }

    this.covariance = newCov;
    return this.toBbox();
  }

  /**
   * Correct state with incoming measurement bbox z: [cx, cy, a, h]
   */
  public update(bbox: BoundingBox): void {
    const cx = bbox.x + bbox.w / 2;
    const cy = bbox.y + bbox.h / 2;
    const a = bbox.w / (bbox.h > 0 ? bbox.h : 1);
    const h = bbox.h;
    const z = [cx, cy, a, h];

    // Measurement noise R (4x4 diagonal)
    const stdR = [
      this.stdWeightPosition * h,
      this.stdWeightPosition * h,
      1e-1,
      this.stdWeightPosition * h,
    ];
    const R: number[] = new Array(16).fill(0);
    for (let i = 0; i < 4; i++) {
      R[i * 4 + i] = stdR[i] * stdR[i];
    }

    // S = H * P * H^T + R (where H = [I_4, 0_4])
    // Since H selects top-left 4x4 of P:
    const S: number[] = new Array(16).fill(0);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        S[i * 4 + j] = this.covariance[i * 8 + j] + R[i * 4 + j];
      }
    }

    // Invert 4x4 matrix S
    const S_inv = this.invert4x4(S);
    if (!S_inv) return;

    // Kalman gain K = P * H^T * S_inv (8x4 matrix)
    // P * H^T is the 8x4 matrix of first 4 columns of P
    const K: number[] = new Array(32).fill(0);
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 4; j++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += this.covariance[i * 8 + k] * S_inv[k * 4 + j];
        }
        K[i * 4 + j] = sum;
      }
    }

    // Innovation y = z - H * mean = z - mean[0..3]
    const y = [
      z[0] - this.mean[0],
      z[1] - this.mean[1],
      z[2] - this.mean[2],
      z[3] - this.mean[3],
    ];

    // Update state mean = mean + K * y
    for (let i = 0; i < 8; i++) {
      let delta = 0;
      for (let j = 0; j < 4; j++) {
        delta += K[i * 4 + j] * y[j];
      }
      this.mean[i] += delta;
    }

    // Update covariance P = (I - K * H) * P
    // Note: K * H is an 8x8 matrix where column j (0<=j<4) is K[:, j] and column 4..7 is 0
    const newCov = new Array(64).fill(0);
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += K[i * 4 + k] * this.covariance[k * 8 + j];
        }
        newCov[i * 8 + j] = this.covariance[i * 8 + j] - sum;
      }
    }

    this.covariance = newCov;
  }

  /**
   * Convert current state mean [cx, cy, a, h] back to top-left bounding box [x, y, w, h]
   */
  public toBbox(): BoundingBox {
    const cx = this.mean[0];
    const cy = this.mean[1];
    const a = Math.max(1e-2, this.mean[2]);
    const h = Math.max(1, this.mean[3]);
    const w = a * h;

    return {
      x: cx - w / 2,
      y: cy - h / 2,
      w: w,
      h: h,
    };
  }

  /**
   * Computes bottom-center point of bounding box (vehicle road contact point)
   */
  public getBottomCenter(): { x: number; y: number } {
    const bbox = this.toBbox();
    return {
      x: bbox.x + bbox.w / 2,
      y: bbox.y + bbox.h,
    };
  }

  /**
   * 4x4 matrix inversion using Gauss-Jordan elimination
   */
  private invert4x4(m: number[]): number[] | null {
    // Augment with identity matrix: 4 rows, 8 cols
    const A: number[][] = [];
    for (let i = 0; i < 4; i++) {
      const row = new Array(8).fill(0);
      for (let j = 0; j < 4; j++) {
        row[j] = m[i * 4 + j];
      }
      row[4 + i] = 1.0;
      A.push(row);
    }

    // Gauss-Jordan elimination
    for (let i = 0; i < 4; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < 4; k++) {
        if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
          maxRow = k;
        }
      }

      if (Math.abs(A[maxRow][i]) < 1e-12) return null; // Singular matrix

      const temp = A[i];
      A[i] = A[maxRow];
      A[maxRow] = temp;

      const pivot = A[i][i];
      for (let j = 0; j < 8; j++) {
        A[i][j] /= pivot;
      }

      for (let k = 0; k < 4; k++) {
        if (k !== i) {
          const factor = A[k][i];
          for (let j = 0; j < 8; j++) {
            A[k][j] -= factor * A[i][j];
          }
        }
      }
    }

    // Extract right half
    const inv = new Array(16).fill(0);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        inv[i * 4 + j] = A[i][4 + j];
      }
    }

    return inv;
  }
}
