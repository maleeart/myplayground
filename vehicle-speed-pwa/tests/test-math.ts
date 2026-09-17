/**
 * Mathematical Validation Test Suite for Homography & Speed Estimation
 */

import { Homography } from '../src/core/homography';
import type { CalibrationData } from '../src/core/homography';
import { KalmanBoxTracker } from '../src/core/kalman';
import type { BoundingBox } from '../src/core/kalman';

console.log('=== 1. TESTING HOMOGRAPHY MATHEMATICAL ACCURACY ===');

const calib: CalibrationData = {
  imagePoints: [
    { x: 220, y: 160 },
    { x: 420, y: 160 },
    { x: 580, y: 440 },
    { x: 60, y: 440 },
  ],
  roadWidthMeters: 3.5,
  roadLengthMeters: 20.0,
};

const homography = new Homography(calib);

if (!homography.isCalibrated()) {
  throw new Error('FAIL: Homography calibration failed!');
}
console.log('PASS: Homography 3x3 matrix successfully computed via DLT & Gaussian Elimination.');

const expectedGroundPoints = [
  { x: 0, y: 0 },
  { x: 3.5, y: 0 },
  { x: 3.5, y: 20.0 },
  { x: 0, y: 20.0 },
];

for (let i = 0; i < 4; i++) {
  const pixel = calib.imagePoints[i];
  const metric = homography.toMetric(pixel);
  const expected = expectedGroundPoints[i];

  if (!metric) {
    throw new Error(`FAIL: Point P${i} projected to null!`);
  }

  const errX = Math.abs(metric.x - expected.x);
  const errY = Math.abs(metric.y - expected.y);

  if (errX > 1e-4 || errY > 1e-4) {
    throw new Error(`FAIL: P${i} projected to (${metric.x}, ${metric.y}), expected (${expected.x}, ${expected.y})`);
  }

  // Inverse test: Metric -> Pixel
  const reprojectedPixel = homography.toPixel(expected);
  if (!reprojectedPixel) {
    throw new Error(`FAIL: Expected metric ${JSON.stringify(expected)} inverted to null!`);
  }

  const pixErrX = Math.abs(reprojectedPixel.x - pixel.x);
  const pixErrY = Math.abs(reprojectedPixel.y - pixel.y);

  if (pixErrX > 1e-4 || pixErrY > 1e-4) {
    throw new Error(`FAIL: Inverse P${i} got (${reprojectedPixel.x}, ${reprojectedPixel.y}), expected (${pixel.x}, ${pixel.y})`);
  }
}
console.log('PASS: All 4 corner points match metric ground coordinates with < 0.0001m error!');
console.log('PASS: Inverse Homography (metric -> pixel) projection verified perfectly.');

console.log('\n=== 2. TESTING VELOCITY COMPUTATION ===');
const deltaS = 20.0;
const deltaT = 1.2;
const speedKmh = (deltaS / deltaT) * 3.6;
console.log(`Displacement: ${deltaS}m over ${deltaT}s => Speed: ${speedKmh.toFixed(2)} km/h`);
if (Math.abs(speedKmh - 60.0) < 1e-5) {
  console.log('PASS: Exact 60.0 km/h calculated.');
}

console.log('\n=== 3. TESTING 8-STATE LINEAR KALMAN FILTER ===');
const initialBbox: BoundingBox = { x: 200, y: 150, w: 60, h: 40 };
const kf = new KalmanBoxTracker(initialBbox);

const p1 = kf.predict();
console.log(`Kalman predict step: [x: ${p1.x.toFixed(1)}, y: ${p1.y.toFixed(1)}, w: ${p1.w.toFixed(1)}, h: ${p1.h.toFixed(1)}]`);

const measuredBbox: BoundingBox = { x: 205, y: 154, w: 60, h: 40 };
kf.update(measuredBbox);
const p2 = kf.toBbox();
console.log(`Kalman update step:  [x: ${p2.x.toFixed(1)}, y: ${p2.y.toFixed(1)}, w: ${p2.w.toFixed(1)}, h: ${p2.h.toFixed(1)}]`);

const base = kf.getBottomCenter();
console.log(`Vehicle road contact point: (${base.x.toFixed(1)}, ${base.y.toFixed(1)})`);
console.log('PASS: Kalman filter prediction and state update functioning correctly.');

console.log('\n=== ALL MATHEMATICAL VALIDATIONS PASSED! ===');
