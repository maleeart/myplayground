/**
 * Main Camera & Overlay Rendering View
 * 
 * Manages:
 * 1. Mobile rear camera stream (getUserMedia with 'environment' facingMode) or TrafficSimulator.
 * 2. High-performance requestAnimationFrame canvas rendering loop.
 * 3. Computer Vision detection loop (COCO-SSD with dynamic throttling & sensitivity tuning).
 * 4. ByteTrack Kalman prediction & tracking at full 60 FPS.
 * 5. Homography perspective mapping & real-time speed overlay.
 * 6. Automatic Detection Logging & Photo Snapshotting for review.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VehicleDetector } from '../core/detector';
import { ByteTracker } from '../core/tracker';
import type { CalibrationData } from '../core/homography';
import { Homography } from '../core/homography';
import type { VehicleSpeedStats } from '../core/speedEstimator';
import { SpeedEstimator } from '../core/speedEstimator';
import type { MotionStatus } from '../utils/motionDetector';
import { CameraMotionDetector } from '../utils/motionDetector';
import { TrafficSimulator } from '../utils/simulator';
import { MetricsOverlay } from './MetricsOverlay';
import { CalibrationModal } from './CalibrationModal';
import type { AppSettings } from './SettingsDrawer';
import { SettingsDrawer } from './SettingsDrawer';
import type { DetectionRecord } from './DetectionHistoryDrawer';
import { DetectionHistoryDrawer } from './DetectionHistoryDrawer';
import { audioAlert } from '../utils/audioAlert';
import { Camera, RefreshCw } from 'lucide-react';

export const CameraView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Engines
  const detectorRef = useRef<VehicleDetector>(new VehicleDetector());
  const trackerRef = useRef<ByteTracker>(new ByteTracker());
  const homographyRef = useRef<Homography>(new Homography());
  const speedEstimatorRef = useRef<SpeedEstimator>(new SpeedEstimator());
  const motionDetectorRef = useRef<CameraMotionDetector>(new CameraMotionDetector());
  const simulatorRef = useRef<TrafficSimulator>(new TrafficSimulator(640, 480));

  // Settings & State
  const [settings, setSettings] = useState<AppSettings>({
    speedLimitKmh: 60,
    smoothingFactor: 0.35,
    scoreThreshold: 0.22,
    isSimulationMode: false,
    adaptiveThrottling: true,
    maxLatencyMs: 35.0,
    sensitivity: 'balanced',
    soundEnabled: true,
    tripodMode: true,
  });

  // Focus lock and video track references
  const activeTrackRef = useRef<MediaStreamTrack | null>(null);
  const [isFocusLocked, setIsFocusLocked] = useState(false);
  const [focusSupportNote, setFocusSupportNote] = useState<string | null>(null);

  const [calibrationData, setCalibrationData] = useState<CalibrationData>(() => {
    // Default calibration values (640x480 perspective)
    return {
      imagePoints: [
        { x: 220, y: 190 },
        { x: 420, y: 190 },
        { x: 550, y: 440 },
        { x: 90, y: 440 },
      ],
      roadWidthMeters: 7.0,
      roadLengthMeters: 30.0,
    };
  });

  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isCalibModalOpen, setIsCalibModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Detection History records
  const [records, setRecords] = useState<DetectionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('speed_pwa_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const loggedTracksRef = useRef<Set<number>>(new Set());
  const realCalibrationRef = useRef<CalibrationData | null>(null);

  // Switch calibration and reset tracker when toggling Simulation Mode
  useEffect(() => {
    if (settings.isSimulationMode) {
      if (!realCalibrationRef.current) {
        realCalibrationRef.current = { ...calibrationData };
      }
      const simCalib = simulatorRef.current.getSimCalibration();
      setCalibrationData(simCalib);
      homographyRef.current.compute(simCalib);
      setIsCalibrated(true);
      trackerRef.current = new ByteTracker({ highScoreThresh: 0.22, lowScoreThresh: 0.10, maxAge: 30 });
      loggedTracksRef.current.clear();
      setStatsMap(new Map());
    } else {
      if (realCalibrationRef.current) {
        setCalibrationData(realCalibrationRef.current);
        homographyRef.current.compute(realCalibrationRef.current);
        realCalibrationRef.current = null;
      }
      trackerRef.current = new ByteTracker({ highScoreThresh: 0.22, lowScoreThresh: 0.10, maxAge: 30 });
      loggedTracksRef.current.clear();
      setStatsMap(new Map());
    }
  }, [settings.isSimulationMode]);

  // HUD stats
  const [fps, setFps] = useState(0);
  const [inferenceLatencyMs, setInferenceLatencyMs] = useState(0);
  const [internalScale, setInternalScale] = useState(1.0);
  const [motionStatus, setMotionStatus] = useState<MotionStatus>({
    isShaking: false,
    intensity: 0,
    message: 'Stable',
  });
  const [statsMap, setStatsMap] = useState<Map<number, VehicleSpeedStats>>(new Map());

  // FPS calculation
  const frameCountRef = useRef(0);
  const lastFpsCalcRef = useRef(performance.now());
  const isDetectingRef = useRef(false);
  const animationFrameIdRef = useRef<number | null>(null);

  // Initialize Homography with default calibration
  useEffect(() => {
    const success = homographyRef.current.compute(calibrationData);
    setIsCalibrated(success);
    speedEstimatorRef.current.setHomography(homographyRef.current);
  }, [calibrationData]);

  // Sync settings with engines
  useEffect(() => {
    speedEstimatorRef.current.setSpeedLimit(settings.speedLimitKmh);
    speedEstimatorRef.current.setSmoothingFactor(settings.smoothingFactor);
    detectorRef.current.setScoreThreshold(settings.scoreThreshold);
    audioAlert.enabled = settings.soundEnabled;
    motionDetectorRef.current.setTripodMode(settings.tripodMode);
  }, [settings]);

  // Initialize Detector Model (TFJS COCO-SSD)
  useEffect(() => {
    detectorRef.current.init().catch((err) => {
      console.error('Failed to load detector:', err);
    });
  }, []);

  /**
   * Helper to crop a snapshot thumbnail from video/simulator canvas
   */
  const captureSnapshot = (
    src: HTMLVideoElement | HTMLCanvasElement,
    bbox: { x: number; y: number; w: number; h: number }
  ): string | undefined => {
    try {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = 96;
      snapCanvas.height = 96;
      const sCtx = snapCanvas.getContext('2d');
      if (!sCtx) return undefined;
      const pad = 12;
      const sx = Math.max(0, bbox.x - pad);
      const sy = Math.max(0, bbox.y - pad);
      const sw = bbox.w + pad * 2;
      const sh = bbox.h + pad * 2;
      sCtx.drawImage(src, sx, sy, sw, sh, 0, 0, 96, 96);
      return snapCanvas.toDataURL('image/jpeg', 0.6);
    } catch {
      return undefined;
    }
  };

  /**
   * Setup Mobile Rear Camera stream
   */
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (settings.isSimulationMode) return;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API (getUserMedia) not supported or requires HTTPS.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Rear camera
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 60, min: 30 },
        },
        audio: false,
      });

      const track = stream.getVideoTracks()[0];
      if (track) {
        activeTrackRef.current = track;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('[Camera] Failed to access rear camera:', err);
      setCameraError(
        err.message || 'Unable to access rear camera. Switching to Simulator Mode is recommended.'
      );
    }
  }, [settings.isSimulationMode]);

  /**
   * Toggle Focus Lock on the active video track
   */
  const handleToggleFocusLock = useCallback(async () => {
    const track = activeTrackRef.current;
    if (!track) {
      setFocusSupportNote('⚠️ กรุณาเปิดกล้องจริงเพื่อใช้งานล็อกโฟกัส');
      setTimeout(() => setFocusSupportNote(null), 3000);
      return;
    }

    const nextState = !isFocusLocked;
    try {
      const caps = (track as any).getCapabilities?.() || {};
      const advanced: any = {};

      if (nextState) {
        // Attempt to lock focus to single-shot or manual
        if (caps.focusMode) {
          if (caps.focusMode.includes('single-shot')) {
            advanced.focusMode = 'single-shot';
          } else if (caps.focusMode.includes('manual')) {
            advanced.focusMode = 'manual';
          }
        }
        if (caps.exposureMode && caps.exposureMode.includes('manual')) {
          advanced.exposureMode = 'manual';
        }
        if (caps.whiteBalanceMode && caps.whiteBalanceMode.includes('manual')) {
          advanced.whiteBalanceMode = 'manual';
        }

        if (Object.keys(advanced).length > 0) {
          await track.applyConstraints({ advanced: [advanced] } as any);
        }
        setIsFocusLocked(true);
        setFocusSupportNote('🔒 ล็อกระยะโฟกัสและแสงคงที่แล้ว (กล้องจะไม่ปรับเองเมื่อมีรถวิ่งผ่าน)');
      } else {
        // Unlock to continuous auto-focus
        if (caps.focusMode && caps.focusMode.includes('continuous')) {
          advanced.focusMode = 'continuous';
        }
        if (caps.exposureMode && caps.exposureMode.includes('continuous')) {
          advanced.exposureMode = 'continuous';
        }
        if (Object.keys(advanced).length > 0) {
          await track.applyConstraints({ advanced: [advanced] } as any);
        }
        setIsFocusLocked(false);
        setFocusSupportNote('🎯 ปลดล็อกกลับสู่โหมดออโต้โฟกัส (AF-C)');
      }
      setTimeout(() => setFocusSupportNote(null), 3500);
    } catch (err) {
      console.warn('[CameraView] applyConstraints error:', err);
      setIsFocusLocked(nextState);
      setFocusSupportNote(
        nextState
          ? '🔒 ล็อกโฟกัสคงที่ (แตะบนถนนที่หน้าจอเพื่อเลือกจุดโฟกัส)'
          : '🎯 ปลดล็อกออโต้โฟกัส'
      );
      setTimeout(() => setFocusSupportNote(null), 3500);
    }
  }, [isFocusLocked]);

  /**
   * Tap-to-Focus on the live camera canvas
   */
  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent<HTMLCanvasElement>) => {
      const track = activeTrackRef.current;
      if (!track) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      try {
        const caps = (track as any).getCapabilities?.() || {};
        if (caps.pointsOfInterest) {
          await track.applyConstraints({
            advanced: [{ pointsOfInterest: [{ x: normX, y: normY }] }],
          } as any);
          setFocusSupportNote('🎯 ปรับจุดโฟกัสไปที่ตำแหน่งที่แตะแล้ว');
          setTimeout(() => setFocusSupportNote(null), 2500);
        }
      } catch {
        // ignore
      }
    },
    []
  );

  useEffect(() => {
    if (!settings.isSimulationMode) {
      startCamera();
    } else if (videoRef.current && videoRef.current.srcObject) {
      // Stop camera tracks when in simulator mode
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      activeTrackRef.current = null;
      setIsFocusLocked(false);
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        activeTrackRef.current = null;
      }
    };
  }, [startCamera, settings.isSimulationMode]);

  /**
   * Main Render and Processing Loop (60 FPS)
   */
  useEffect(() => {
    const loop = async (timestamp: number) => {
      // 1. Calculate FPS
      frameCountRef.current++;
      if (timestamp - lastFpsCalcRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsCalcRef.current = timestamp;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      // 2. Select Video Frame Source (Camera or Simulator)
      let source: HTMLVideoElement | HTMLCanvasElement | null = null;
      if (settings.isSimulationMode) {
        source = simulatorRef.current.render(timestamp);
      } else if (
        videoRef.current &&
        videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        source = videoRef.current;
      }

      if (!source) {
        // Render standby grid while camera is initializing so screen is never blank
        if (canvas.width === 0 || canvas.height === 0) {
          canvas.width = 640;
          canvas.height = 480;
        }
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, Math.PI * 2);
        ctx.arc(canvas.width / 2, canvas.height / 2, 160, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('📡 INITIALIZING CAMERA STREAM...', canvas.width / 2, canvas.height / 2 - 8);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Tap Allow for camera permission or switch to Simulator Mode', canvas.width / 2, canvas.height / 2 + 16);
        ctx.textAlign = 'left';

        animationFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      // Match canvas dimensions to source resolution
      const srcW = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
      const srcH = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

      if (srcW > 0 && srcH > 0) {
        if (canvas.width !== srcW || canvas.height !== srcH) {
          canvas.width = srcW;
          canvas.height = srcH;
        }

        // Draw source video/sim frame to canvas
        ctx.drawImage(source, 0, 0, srcW, srcH);
      }

      // 3. Motion & Shake detection
      const motion = motionDetectorRef.current.evaluateFrame(source);
      setMotionStatus(motion);

      // Helper function to update speed estimator, HUD stats, and auto-logging
      const processTracksAndLog = (
        activeTracks: ReturnType<typeof trackerRef.current.update>,
        currentTimestamp: number,
        frameSource: HTMLVideoElement | HTMLCanvasElement
      ) => {
        // Feed active tracks to Speed Estimator
        const calculatedStats = speedEstimatorRef.current.update(activeTracks, currentTimestamp);
        setStatsMap(calculatedStats);

        // Auto-Log Vehicles with Peak Speeds
        calculatedStats.forEach((stat, trackId) => {
          if (stat.currentSpeedKmh > 5 && !loggedTracksRef.current.has(trackId)) {
            loggedTracksRef.current.add(trackId);

            // Snapshot thumbnail
            const trk = trackerRef.current.getTrackById(trackId);
            let snapUrl: string | undefined = undefined;
            if (trk && frameSource) {
              snapUrl = captureSnapshot(frameSource, trk.getBbox());
            }

            const now = new Date();
            const timeStr = now.toTimeString().split(' ')[0];

            const newRecord: DetectionRecord = {
              id: `${trackId}-${Date.now()}`,
              trackId,
              vehicleClass: stat.vehicleClass,
              timestamp: timeStr,
              peakSpeedKmh: Math.round(stat.currentSpeedKmh),
              avgSpeedKmh: Math.round(stat.averageSpeedKmh || stat.currentSpeedKmh),
              distanceMeters: Math.round(stat.distanceTraveledMeters),
              isOverLimit: stat.isOverLimit,
              snapshotUrl: snapUrl,
            };

            setRecords((prev) => {
              const updated = [newRecord, ...prev.slice(0, 49)];
              try {
                localStorage.setItem('speed_pwa_records', JSON.stringify(updated));
              } catch {
                // storage full
              }
              return updated;
            });

            // Audio Chime
            if (stat.isOverLimit) {
              audioAlert.playOverspeedAlarm();
            } else {
              audioAlert.playDetectBlip();
            }
          }
        });
      };

      // 4. Vehicle Detection (Simulation Mode vs Real Camera AI)
      if (settings.isSimulationMode) {
        // Ground-truth detections from simulator with realistic micro-jitter
        const simDetections = simulatorRef.current.getDetections();
        setInferenceLatencyMs(12);
        setInternalScale(1.0);

        const activeTracks = trackerRef.current.update(simDetections, timestamp);
        processTracksAndLog(activeTracks, timestamp, source);
      } else if (!isDetectingRef.current && detectorRef.current.ready) {
        isDetectingRef.current = true;
        detectorRef.current
          .detect(source)
          .then(({ detections, latencyMs, scale }) => {
            setInferenceLatencyMs(latencyMs);
            setInternalScale(scale);

            // Feed detections to ByteTrack
            const activeTracks = trackerRef.current.update(detections, timestamp);
            processTracksAndLog(activeTracks, timestamp, source);
          })
          .catch((err) => {
            console.error('Detection error:', err);
          })
          .finally(() => {
            isDetectingRef.current = false;
          });
      }

      // 5. Draw Overlays (Calibration Zone, Bounding Boxes, Trajectory Trails, Speed HUD)
      drawOverlays(ctx);

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [settings.isSimulationMode, calibrationData]);

  /**
   * Draw Visual Overlays onto the Canvas
   */
  const drawOverlays = (ctx: CanvasRenderingContext2D) => {
    // 1. Draw Calibrated Road Zone (Perspective Trapezoid)
    if (calibrationData.imagePoints.length === 4) {
      const pts = calibrationData.imagePoints;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.lineTo(pts[2].x, pts[2].y);
      ctx.lineTo(pts[3].x, pts[3].y);
      ctx.closePath();

      // Subtle translucent fill
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fill();

      // Dashed boundary
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Draw Tracked Vehicles
    statsMap.forEach((stats, trackId) => {
      // Find matching track
      const track = trackerRef.current.getTrackById(trackId);
      if (!track) return;

      const bbox = track.getBbox();
      const basePoint = track.getBottomCenter();

      const isOver = stats.currentSpeedKmh > settings.speedLimitKmh;
      const isNear = stats.currentSpeedKmh > settings.speedLimitKmh - 10;
      const themeColor = isOver ? '#ef4444' : isNear ? '#f59e0b' : '#10b981';

      // Trajectory Trail (Smooth fading neon line)
      if (track.history.length > 1) {
        ctx.beginPath();
        for (let i = 0; i < track.history.length; i++) {
          const pt = track.history[i].pixel;
          if (i === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Ground contact point dot
      ctx.beginPath();
      ctx.arc(basePoint.x, basePoint.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // High-Tech Corner Bracket Bounding Box
      const cornerLen = Math.min(bbox.w, bbox.h) * 0.25;
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 2.5;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(bbox.x, bbox.y + cornerLen);
      ctx.lineTo(bbox.x, bbox.y);
      ctx.lineTo(bbox.x + cornerLen, bbox.y);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(bbox.x + bbox.w - cornerLen, bbox.y);
      ctx.lineTo(bbox.x + bbox.w, bbox.y);
      ctx.lineTo(bbox.x + bbox.w, bbox.y + cornerLen);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(bbox.x + bbox.w, bbox.y + bbox.h - cornerLen);
      ctx.lineTo(bbox.x + bbox.w, bbox.y + bbox.h);
      ctx.lineTo(bbox.x + bbox.w - cornerLen, bbox.y + bbox.h);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(bbox.x + cornerLen, bbox.y + bbox.h);
      ctx.lineTo(bbox.x, bbox.y + bbox.h);
      ctx.lineTo(bbox.x, bbox.y + bbox.h - cornerLen);
      ctx.stroke();

      // Vehicle Speed Badge Overlay above bounding box
      const badgeW = 100;
      const badgeH = 28;
      const badgeX = bbox.x + bbox.w / 2 - badgeW / 2;
      const badgeY = Math.max(10, bbox.y - badgeH - 6);

      // Badge background
      ctx.fillStyle = isOver ? 'rgba(239, 68, 68, 0.92)' : 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Vehicle ID and Class
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`#${track.id} ${track.class.toUpperCase()}`, badgeX + 6, badgeY + 11);

      // Speed Readout
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      let speedText = '';
      if (!isCalibrated) {
        speedText = 'UNCALIBRATED';
      } else if (stats.currentSpeedKmh > 0) {
        speedText = `${stats.currentSpeedKmh} km/h`;
      } else {
        speedText = 'LOCKING...';
      }
      ctx.fillText(speedText, badgeX + 6, badgeY + 24);
    });
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      {/* Hidden Mobile Video Element for getUserMedia */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="hidden"
      />

      {/* Main Fullscreen HUD Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full object-contain cursor-crosshair"
      />

      {/* Camera Error / Permission Fallback Banner */}
      {cameraError && !settings.isSimulationMode && (
        <div className="absolute top-16 left-4 right-4 bg-slate-900/90 border border-amber-600/60 text-amber-200 p-3.5 rounded-2xl backdrop-blur-md shadow-2xl flex flex-col gap-2 z-20">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Camera className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Rear Camera Notice</span>
          </div>
          <p className="text-xs text-slate-300">
            {cameraError}
            <br />
            (Note: Mobile browsers require HTTPS to grant camera permissions).
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setSettings((s) => ({ ...s, isSimulationMode: true }))}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow"
            >
              Switch to Simulator Mode
            </button>
            <button
              onClick={startCamera}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Camera
            </button>
          </div>
        </div>
      )}

      {/* HUD Metrics & Status Overlays */}
      <MetricsOverlay
        fps={fps}
        inferenceLatencyMs={inferenceLatencyMs}
        motionStatus={motionStatus}
        isCalibrated={isCalibrated}
        isSimulationMode={settings.isSimulationMode}
        speedLimitKmh={settings.speedLimitKmh}
        statsMap={statsMap}
        onOpenCalibration={() => setIsCalibModalOpen(true)}
        onToggleSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={records.length}
        onToggleSim={() => setSettings((s) => ({ ...s, isSimulationMode: !s.isSimulationMode }))}
        audioEnabled={settings.soundEnabled}
        onToggleAudio={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
        internalScale={internalScale}
        onSpawnSpeedingCar={() => simulatorRef.current.spawnSpeedingVehicle()}
        isFocusLocked={isFocusLocked}
        onToggleFocusLock={handleToggleFocusLock}
        isTripodMode={settings.tripodMode}
        onToggleTripodMode={() => setSettings((s) => ({ ...s, tripodMode: !s.tripodMode }))}
        focusSupportNote={focusSupportNote}
      />

      {/* 4-Point Homography Calibration Modal */}
      <CalibrationModal
        isOpen={isCalibModalOpen}
        onClose={() => setIsCalibModalOpen(false)}
        onSave={(newCalib) => setCalibrationData(newCalib)}
        initialCalibration={calibrationData}
        canvasWidth={canvasRef.current?.width || 640}
        canvasHeight={canvasRef.current?.height || 480}
        previewImageSource={
          settings.isSimulationMode ? simulatorRef.current.getCanvas() : videoRef.current
        }
      />

      {/* Settings & Tuning Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        onOpenCalibration={() => setIsCalibModalOpen(true)}
      />

      {/* Detection History Drawer */}
      <DetectionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        records={records}
        onClear={() => {
          setRecords([]);
          loggedTracksRef.current.clear();
          localStorage.removeItem('speed_pwa_records');
        }}
        speedLimitKmh={settings.speedLimitKmh}
      />
    </div>
  );
};
