# Real-Time Mobile CV Vehicle Speed Estimator (PWA)

A production-ready, mobile-first Progressive Web App (PWA) that measures moving vehicle speeds in real-time (km/h) using a smartphone camera, Perspective Homography calibration, and an 8-state Linear Kalman Filter with ByteTrack multi-object tracking.

---

## 📸 Core Features

- **Client-Side Computer Vision:** Runs 100% on-device in the browser using TensorFlow.js with WebGL mobile GPU acceleration and MobileNet COCO-SSD (detects `car`, `motorcycle`, `bus`, `truck`).
- **4-Point Perspective Homography Calibration (DLT):** Projects 2D camera image coordinates (pixels) onto an Euclidean ground plane in meters using Gaussian elimination with partial pivoting.
- **ByteTrack Multi-Object Tracking:** 8-state Linear Kalman Filter tracking with two-stage association to handle occlusions and maintain track IDs across frames.
- **Precision Speed Estimation Engine:**
  - Tracks vehicle road contact point (bottom-center of bounding box).
  - High-resolution timestamping via `performance.now()`.
  - Velocity formula: $v = \frac{\Delta s}{\Delta t} \times 3.6$ (km/h).
  - Sliding-window displacement and Exponential Moving Average (EMA) smoothing.
  - Physical acceleration clamping ($< 12\text{ m/s}^2$) to reject bounding box jitter spikes.
- **Mobile-First Calibration UX:**
  - Interactive 4-corner touch draggable handles.
  - 2x Magnifying Loupe that hovers above the user's finger so the finger doesn't obscure road lane markers.
  - Real-time inverse homography metric grid projection $(1\text{m} \times 5\text{m})$ on the road surface to visually confirm perspective alignment.
- **Edge & Thermal Management:**
  - Dynamic resolution downsampling if inference latency exceeds 35ms.
  - Camera shake & vibration warning using `devicemotion` and visual difference sampling.
- **Built-in Highway Traffic Simulator:** Toggle anytime between **Live Camera** and **Simulation Mode** with ground-truth speed comparisons to test and calibrate without needing to stand at a roadside.

---

## 🧮 Mathematical Architecture

### 1. Direct Linear Transform (DLT) Homography
Given 4 quadrilateral road corner points in image pixel coordinates $P_i = (u_i, v_i)$ and 4 destination points in real-world metric coordinates $P'_i = (X_i, Y_i)$ on the Euclidean road plane:

$$s \begin{bmatrix} X \\ Y \\ 1 \end{bmatrix} = \begin{bmatrix} h_{00} & h_{01} & h_{02} \\ h_{10} & h_{11} & h_{12} \\ h_{20} & h_{21} & 1 \end{bmatrix} \begin{bmatrix} u \\ v \\ 1 \end{bmatrix}$$

$$X = \frac{h_{00} u + h_{01} v + h_{02}}{h_{20} u + h_{21} v + 1}, \quad Y = \frac{h_{10} u + h_{11} v + h_{12}}{h_{20} u + h_{21} v + 1}$$

Solved via an $8 \times 8$ linear system $A h = B$ using Gaussian elimination with partial pivoting.

### 2. 8-State Linear Kalman Filter
- **State vector:** $\mathbf{x} = [x_c, y_c, a, h, \dot{x}_c, \dot{y}_c, \dot{a}, \dot{h}]^T$ where $(x_c, y_c)$ is bounding box center, $a = w/h$ is aspect ratio, $h$ is height.
- **Prediction:** $\hat{\mathbf{x}}_{k|k-1} = F \hat{\mathbf{x}}_{k-1|k-1}$, $P_{k|k-1} = F P_{k-1|k-1} F^T + Q$
- **Measurement Update:** $K = P H^T (H P H^T + R)^{-1}$, $\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} + K(z - H\hat{\mathbf{x}}_{k|k-1})$

### 3. Velocity Calculation
The bottom-center of the bounding box $(u, v) = (x + w/2, y + h)$ is projected to metric ground plane $(X_t, Y_t)$. Velocity over time delta $\Delta t = (t_k - t_{k-n}) / 1000$:

$$v = \frac{\sqrt{(X_k - X_{k-n})^2 + (Y_k - Y_{k-n})^2}}{\Delta t} \times 3.6 \quad (\text{km/h})$$

---

## 📂 Directory Structure

```
vehicle-speed-pwa/
├── public/
│   ├── icon.svg                     # PWA vector app icon
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── CameraView.tsx           # 60 FPS Canvas overlay loop & getUserMedia rear camera
│   │   ├── CalibrationModal.tsx     # 4-point touch calibration with 2x magnifier loupe & grid
│   │   ├── MetricsOverlay.tsx       # Real-time HUD (FPS, latency, vehicle speed cards)
│   │   └── SettingsDrawer.tsx       # Speed limit, EMA smoothing, and simulator switch
│   ├── core/
│   │   ├── homography.ts            # DLT 3x3 solver, Gaussian elimination, toMetric/toPixel
│   │   ├── kalman.ts                # 8-state Linear Kalman Filter for bounding boxes
│   │   ├── tracker.ts               # ByteTrack two-stage data association engine
│   │   ├── speedEstimator.ts        # Metric velocity math, EMA filter, acceleration clamp
│   │   └── detector.ts              # TensorFlow.js COCO-SSD with dynamic downsampling
│   ├── utils/
│   │   ├── motionDetector.ts        # IMU devicemotion and frame-difference camera shake detector
│   │   └── simulator.ts             # Perspective highway simulator with ground-truth velocities
│   ├── App.tsx                      # Root component
│   ├── main.tsx                     # React entry point
│   └── index.css                    # Tailwind CSS & mobile viewport resets
├── tests/
│   └── test-math.ts                 # Mathematical verification test suite
├── vite.config.ts                   # Vite + HTTPS BasicSSL + PWA configuration
├── tsconfig.json
└── package.json
```

---

## 🚀 How to Run & Test

### 1. Install Dependencies
```bash
cd vehicle-speed-pwa
npm install
```

### 2. Run Mathematical Verification Tests
```bash
npm test
```
Verifies Homography matrix inversion, sub-millimeter projection accuracy, velocity calculations, and Kalman Filter state updates.

### 3. Run Dev Server with HTTPS (Required for Mobile Camera)
```bash
npm run dev
```
Vite will start with local HTTPS enabled via `@vitejs/plugin-basic-ssl`:
```
  ➜  Local:   https://localhost:5173/
  ➜  Network: https://192.168.1.X:5173/
```

### 4. Connect from Mobile Smartphone
1. Connect your smartphone to the **same Wi-Fi network** as your PC.
2. Open Chrome (Android) or Safari (iOS) and navigate to `https://192.168.1.X:5173/` (replace with your PC's IP address displayed in the terminal).
3. **Accept Self-Signed Certificate:**
   - Chrome: Tap **Advanced** $\rightarrow$ **Proceed to 192.168.1.X (unsafe)**.
   - Safari: Tap **Show Details** $\rightarrow$ **visit this website**.
4. When prompted, tap **Allow** to grant rear camera access (`facingMode: environment`).
5. **Install as PWA:**
   - iOS: Tap **Share** $\rightarrow$ **Add to Home Screen**.
   - Android: Tap menu $\rightarrow$ **Install App** / **Add to Home screen**.

### 5. Testing Without Live Roadside Traffic (Simulator Mode)
If testing indoors or on desktop:
- Tap the **Gear Icon** at the top right of the screen.
- Select **🎮 Simulator Mode**.
- The app will generate synthetic perspective traffic with real vehicle dimensions and ground-truth speeds (`GT: 55 km/h`, `GT: 42 km/h`), allowing full verification of calibration, tracking, and speed readouts.
