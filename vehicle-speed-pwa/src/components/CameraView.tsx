/**
 * Ultra-Fast Optical Motion & AI Target Speedometer (คน & รถ)
 * 
 * Specifically designed for Handheld Smartphone Cameras:
 * - Anti-Tremor & Handheld Shake Rejection:
 *     1) Rejects hand shake oscillations via Net Translational Displacement tracking.
 *     2) Rejects global camera movements (frame-wide panning/tilting).
 *     3) Strict AI-only candidate mode (NEVER creates ghost targets from raw pixel motion when handheld).
 * - Filters and tracks ONLY:
 *     - People (คน): 'person' (🏃)
 *     - Vehicles (รถ): 'car', 'motorcycle', 'bus', 'truck', 'bicycle' (🚗, 🏍️, 🚌, 🚚, 🚲)
 * - Strict Auto-Snapshot: Only captures confirmed targets with sustained real motion (no jitter snaps).
 * - Optical Field-of-View metric speed estimation in km/h.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MotionTracker, type MotionBlob } from '../core/motionTracker';
import { ObjectDetector, type TargetFilterMode } from '../core/detector';
import { TrafficSimulator } from '../utils/simulator';
import { DetectionHistoryDrawer, type DetectionRecord } from './DetectionHistoryDrawer';
import { audioAlert } from '../utils/audioAlert';
import type { Detection } from '../core/tracker';
import {
  Camera,
  RefreshCw,
  ClipboardList,
  Volume2,
  VolumeX,
  Activity,
  Zap,
  HelpCircle,
  X,
  Car,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const CameraView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeTrackRef = useRef<MediaStreamTrack | null>(null);

  // Target Filter Mode: 'all' | 'vehicles' | 'people'
  const [targetFilter, setTargetFilter] = useState<TargetFilterMode>('all');

  // AI Object Detector (COCO-SSD MobileNet v2)
  const detectorRef = useRef<ObjectDetector>(
    new ObjectDetector({
      scoreThreshold: 0.30,
      filterMode: 'all',
    })
  );
  const [isAiReady, setIsAiReady] = useState<boolean>(false);
  const isDetectingRef = useRef<boolean>(false);
  const latestAiDetectionsRef = useRef<Detection[]>([]);

  // Handheld Mode & Auto-Capture Controls
  const [isHandheld, setIsHandheld] = useState<boolean>(true);
  const [autoCapture, setAutoCapture] = useState<boolean>(true);
  const [isCameraShaking, setIsCameraShaking] = useState<boolean>(false);

  // Motion Tracker Engine (Frame Differencing + Handheld Anti-Tremor)
  const motionTrackerRef = useRef<MotionTracker>(
    new MotionTracker({
      distanceMeters: 15.0,
      sensitivity: 'medium',
      minAreaPx: 650,
      filterMode: 'all',
      isHandheld: true,
      autoCapture: true,
    })
  );

  // Traffic Simulator Engine (Calm 1-car test bench)
  const simulatorRef = useRef<TrafficSimulator>(new TrafficSimulator(640, 480));

  // Mode & Feature Toggles
  const [sourceMode, setSourceMode] = useState<'camera' | 'sim'>('camera');
  const [showMask, setShowMask] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [simAutoSpawn, setSimAutoSpawn] = useState<boolean>(true);

  // Settings & Controls
  const distanceMeters = 15; // Calibrated 15m street distance
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [speedLimitKmh, setSpeedLimitKmh] = useState<number>(60);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastNote, setToastNote] = useState<string | null>(null);

  // Interactive Target Selection & Single-Object Lock-On Focus
  const [lockedTargetId, setLockedTargetId] = useState<number | null>(null);
  const lockedTargetIdRef = useRef<number | null>(null);
  lockedTargetIdRef.current = lockedTargetId;
  const lastSeenLockedTimeRef = useRef<number>(Date.now());

  // UI Drawers & State
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [activeBlobs, setActiveBlobs] = useState<MotionBlob[]>([]);
  const lockedBlob = lockedTargetId !== null ? activeBlobs.find((b) => b.id === lockedTargetId) : null;

  // Detection History records
  const [records, setRecords] = useState<DetectionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('speed_pwa_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Loop refs
  const frameCountRef = useRef(0);
  const lastFpsCalcRef = useRef(performance.now());
  const animationFrameIdRef = useRef<number | null>(null);

  // Initialize AI Object Detector in background
  useEffect(() => {
    detectorRef.current
      .init()
      .then(() => {
        setIsAiReady(true);
        setToastNote('🧠 ระบบ AI ตรวจจับคนและรถพร้อมใช้งาน (กันมือสั่นเปิดอยู่)');
        setTimeout(() => setToastNote(null), 2500);
      })
      .catch((err) => {
        console.warn('[AI] Model init fallback to morphological shape detection:', err);
      });

    return () => {
      detectorRef.current.dispose();
    };
  }, []);

  // Sync settings with trackers
  useEffect(() => {
    motionTrackerRef.current.config.distanceMeters = distanceMeters;
    motionTrackerRef.current.config.sensitivity = sensitivity;
    motionTrackerRef.current.config.filterMode = targetFilter;
    motionTrackerRef.current.config.isHandheld = isHandheld;
    motionTrackerRef.current.config.autoCapture = autoCapture;
    motionTrackerRef.current.config.lockedBlobId = lockedTargetId;
    motionTrackerRef.current.config.speedLimitKmh = speedLimitKmh;
    detectorRef.current.setFilterMode(targetFilter);

    // Dynamic noise thresholds
    if (sensitivity === 'low') {
      motionTrackerRef.current.config.minAreaPx = 850;
      detectorRef.current.setScoreThreshold(0.35);
    } else if (sensitivity === 'medium') {
      motionTrackerRef.current.config.minAreaPx = 600;
      detectorRef.current.setScoreThreshold(0.28);
    } else {
      motionTrackerRef.current.config.minAreaPx = 380;
      detectorRef.current.setScoreThreshold(0.20);
    }

    audioAlert.enabled = soundEnabled;
  }, [distanceMeters, sensitivity, soundEnabled, targetFilter, isHandheld, autoCapture, lockedTargetId, speedLimitKmh]);

  /**
   * Capture cropped snapshot of confirmed human or vehicle
   */
  const captureSnapshot = (
    src: HTMLVideoElement | HTMLCanvasElement,
    bbox: { x: number; y: number; w: number; h: number }
  ): string | undefined => {
    try {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = 128;
      snapCanvas.height = 128;
      const sCtx = snapCanvas.getContext('2d');
      if (!sCtx) return undefined;

      const srcW = src instanceof HTMLVideoElement ? src.videoWidth : src.width;
      const srcH = src instanceof HTMLVideoElement ? src.videoHeight : src.height;

      const marginX = bbox.w * 0.25;
      const marginY = bbox.h * 0.25;
      const sx = Math.max(0, bbox.x - marginX);
      const sy = Math.max(0, bbox.y - marginY);
      const sw = Math.min(srcW - sx, bbox.w + marginX * 2);
      const sh = Math.min(srcH - sy, bbox.h + marginY * 2);

      sCtx.drawImage(src, sx, sy, sw, sh, 0, 0, 128, 128);
      return snapCanvas.toDataURL('image/jpeg', 0.65);
    } catch {
      return undefined;
    }
  };

  /**
   * Manual snapshot trigger
   */
  const handleManualCapture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeBlobs.length === 0) {
      setToastNote('⚠️ ไม่พบเป้าหมายคนหรือรถบนจอ');
      setTimeout(() => setToastNote(null), 2000);
      return;
    }
    const target =
      (lockedTargetId !== null ? activeBlobs.find((b) => b.id === lockedTargetId) : null) ||
      activeBlobs[0];
    const snapUrl = captureSnapshot(canvas, target.bbox);
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const isOver = target.currentSpeedKmh > speedLimitKmh;

    const newRecord: DetectionRecord = {
      id: `${target.id}-${Date.now()}`,
      trackId: target.id,
      vehicleClass: `${target.icon} ${target.label}`,
      timestamp: timeStr,
      peakSpeedKmh: target.peakSpeedKmh || target.currentSpeedKmh,
      avgSpeedKmh: target.avgSpeedKmh || target.currentSpeedKmh,
      distanceMeters: Math.round(target.distanceTraveledPx / (canvas.width / (1.28 * distanceMeters))),
      isOverLimit: isOver,
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

    if (isOver) {
      audioAlert.playOverspeedAlarm();
    } else {
      audioAlert.playDetectBlip();
    }

    setToastNote(`📸 บันทึกภาพ ${target.label} #${target.id} เรียบร้อย`);
    setTimeout(() => setToastNote(null), 2500);
  }, [activeBlobs, distanceMeters, speedLimitKmh, lockedTargetId]);

  /**
   * Start rear camera stream
   */
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API (getUserMedia) not supported or requires HTTPS.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
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

      motionTrackerRef.current.reset();
    } catch (err: any) {
      console.warn('[Camera] Access error:', err);
      setCameraError(err.message || 'Unable to access rear camera. Please ensure camera permissions are granted.');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        activeTrackRef.current = null;
      }
    };
  }, [startCamera]);



  /**
   * Tap on Canvas: Target Selection / Lock-On Focus
   */
  const handleCanvasClick = useCallback(async (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find if user tapped near any detected blob
    let foundBlob: MotionBlob | null = null;
    let minDistance = Infinity;

    for (const blob of activeBlobs) {
      const pad = 45; // generous finger touch buffer
      const inBox =
        clickX >= blob.bbox.x - pad &&
        clickX <= blob.bbox.x + blob.bbox.w + pad &&
        clickY >= blob.bbox.y - pad &&
        clickY <= blob.bbox.y + blob.bbox.h + pad;

      const dist = Math.hypot(clickX - blob.centroid.x, clickY - blob.centroid.y);

      if (inBox || dist < 100) {
        if (dist < minDistance) {
          minDistance = dist;
          foundBlob = blob;
        }
      }
    }

    if (foundBlob) {
      setLockedTargetId(foundBlob.id);
      audioAlert.playDetectBlip();
      setToastNote(`🎯 ล็อกเป้าหมาย: ${foundBlob.label} #${foundBlob.id} เรียบร้อย`);
      setTimeout(() => setToastNote(null), 2500);
    } else if (lockedTargetId !== null) {
      // Tapped empty space: unlock target
      setLockedTargetId(null);
      setToastNote('🔓 ปลดล็อกเป้าหมายแล้ว - แตะเลือกเป้าใหม่');
      setTimeout(() => setToastNote(null), 2000);
    }

    // Hardware camera point-of-interest focus (if supported by phone)
    const track = activeTrackRef.current;
    if (track) {
      const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      try {
        const caps = (track as any).getCapabilities?.() || {};
        if (caps.pointsOfInterest) {
          await track.applyConstraints({
            advanced: [{ pointsOfInterest: [{ x: normX, y: normY }] }],
          } as any);
        }
      } catch {
        // ignore
      }
    }
  }, [activeBlobs, lockedTargetId]);

  /**
   * Main Render and Motion Tracking Loop (Full 60 FPS)
   */
  useEffect(() => {
    const loop = (timestamp: number) => {
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

      let inputSource: HTMLVideoElement | HTMLCanvasElement | null = null;

      if (sourceMode === 'sim') {
        const simCanvas = simulatorRef.current.render(timestamp);
        if (canvas.width !== simCanvas.width || canvas.height !== simCanvas.height) {
          canvas.width = simCanvas.width;
          canvas.height = simCanvas.height;
        }
        ctx.drawImage(simCanvas, 0, 0, canvas.width, canvas.height);
        inputSource = simCanvas;

        latestAiDetectionsRef.current = simulatorRef.current.getDetections();
      } else {
        const video = videoRef.current;
        if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          inputSource = video;

          // Non-blocking asynchronous AI detection cycle
          if (isAiReady && !isDetectingRef.current) {
            isDetectingRef.current = true;
            detectorRef.current
              .detect(video)
              .then(({ detections }) => {
                latestAiDetectionsRef.current = detections;
                isDetectingRef.current = false;
              })
              .catch(() => {
                isDetectingRef.current = false;
              });
          }
        } else {
          if (canvas.width === 0 || canvas.height === 0) {
            canvas.width = 640;
            canvas.height = 480;
          }
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('📡 กำลังเชื่อมต่อกล้องมือถือ...', canvas.width / 2, canvas.height / 2);
          ctx.textAlign = 'left';
        }
      }

      if (inputSource) {
        motionTrackerRef.current.showMotionMask = showMask;

        // 1. Process Frame Differencing + Target Classification (คน & รถ)
        const { blobs, newlyDetectedForLogging, isGlobalCameraShake } = motionTrackerRef.current.processFrame(
          inputSource,
          timestamp,
          latestAiDetectionsRef.current
        );
        setActiveBlobs(blobs);
        setIsCameraShaking(isGlobalCameraShake);

        // Track locked target lifetime
        if (lockedTargetIdRef.current !== null) {
          const lockedBlob = blobs.find((b) => b.id === lockedTargetIdRef.current);
          if (lockedBlob) {
            lastSeenLockedTimeRef.current = timestamp;
          } else if (timestamp - lastSeenLockedTimeRef.current > 1500) {
            setLockedTargetId(null);
            setToastNote('🏁 วัตถุหลุดออกจากเฟรมแล้ว - แตะเลือกเป้าใหม่');
            setTimeout(() => setToastNote(null), 2500);
          }
        }

        // 2. Draw Motion Mask if enabled
        if (showMask) {
          const maskCanvas = motionTrackerRef.current.getMaskCanvas();
          ctx.save();
          ctx.globalAlpha = 0.55;
          ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        }

        // 3. Handle Auto-Snapshot & Logging for confirmed moving targets
        if (newlyDetectedForLogging.length > 0) {
          for (const blob of newlyDetectedForLogging) {
            const isOver = blob.peakSpeedKmh > speedLimitKmh || blob.currentSpeedKmh > speedLimitKmh;
            if (!isOver) continue; // STRICT: Auto-capture ONLY when exceeding speed limit!

            const snapUrl = captureSnapshot(inputSource, blob.bbox);
            const now = new Date();
            const timeStr = now.toTimeString().split(' ')[0];

            const newRecord: DetectionRecord = {
              id: `${blob.id}-${Date.now()}`,
              trackId: blob.id,
              vehicleClass: `${blob.icon} ${blob.label}`,
              timestamp: timeStr,
              peakSpeedKmh: blob.peakSpeedKmh,
              avgSpeedKmh: blob.avgSpeedKmh || blob.peakSpeedKmh,
              distanceMeters: Math.round(blob.distanceTraveledPx / (canvas.width / (1.28 * distanceMeters))),
              isOverLimit: isOver,
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

            if (isOver) {
              audioAlert.playOverspeedAlarm();
            } else {
              audioAlert.playDetectBlip();
            }
          }
        }

        // 4. Render Target Overlays
        drawMotionOverlays(ctx, blobs);
      }

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [distanceMeters, speedLimitKmh, sourceMode, showMask, isAiReady]);

  /**
   * Draw glowing corner brackets and target classification badge
   * Supports: Single-Target Lock-On Focus vs. Multi-Target Tap-to-Select
   */
  const drawMotionOverlays = (ctx: CanvasRenderingContext2D, blobs: MotionBlob[]) => {
    const currentLockedId = lockedTargetIdRef.current;

    // SCENARIO 1: A target is locked -> Exclusively focus on this single target
    if (currentLockedId !== null) {
      const lockedBlob = blobs.find((b) => b.id === currentLockedId);
      if (lockedBlob) {
        const { bbox, centroid, history, currentSpeedKmh, isStationary } = lockedBlob;
        const isOver = currentSpeedKmh > speedLimitKmh;
        const isMoving = currentSpeedKmh > 0.5 && !isStationary;

        const themeColor = isOver
          ? '#ef4444' // Red (Overspeed)
          : lockedBlob.category === 'person'
          ? '#10b981' // Green (Person)
          : '#38bdf8'; // Cyan (Moving Vehicle)

        // 1. Trajectory Trail
        if (history.length > 1 && isMoving) {
          ctx.beginPath();
          for (let i = 0; i < history.length; i++) {
            const pt = history[i];
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.strokeStyle = themeColor;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // 2. High-Tech Tactical Lock Corner Brackets (Thicker & bolder)
        const cornerLen = Math.min(bbox.w, bbox.h) * 0.35;
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 3.5;

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

        // 3. Central Tactical Target Reticle (Pulsing / dashed lock ring)
        ctx.save();
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(centroid.x, centroid.y, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = themeColor;
        ctx.beginPath();
        ctx.arc(centroid.x, centroid.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // 4. Prominent Focus Badge
        const badgeW = 165;
        const badgeH = 34;
        const badgeX = bbox.x + bbox.w / 2 - badgeW / 2;
        const badgeY = Math.max(10, bbox.y - badgeH - 10);

        ctx.fillStyle = isOver ? 'rgba(239, 68, 68, 0.94)' : 'rgba(15, 23, 42, 0.92)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, [8]);
        ctx.fill();
        ctx.strokeStyle = isOver ? '#fca5a5' : themeColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Target Label
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`🎯 ล็อก: ${lockedBlob.icon} ${lockedBlob.label} #${lockedBlob.id}`, badgeX + 8, badgeY + 14);

        // Speed / Status
        ctx.fillStyle = isOver ? '#ffffff' : (isMoving ? '#38bdf8' : '#fbbf24');
        ctx.font = 'bold 13px monospace';
        const speedStr = isStationary
          ? '[จอดนิ่ง/นิ่งอยู่]'
          : currentSpeedKmh > 0
          ? `${currentSpeedKmh} km/h`
          : 'กำลังคำนวณ...';
        ctx.fillText(speedStr, badgeX + 8, badgeY + 28);
      }
      return; // Do NOT render any other blobs! Keeps screen 100% clean and isolated
    }

    // SCENARIO 2: No target is locked -> Render dashed selection brackets
    for (const blob of blobs) {
      const { bbox, centroid } = blob;

      // Dashed Corner Brackets
      const cornerLen = Math.min(bbox.w, bbox.h) * 0.25;
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);

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
      ctx.restore();

      // Center touch indicator
      ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.beginPath();
      ctx.arc(centroid.x, centroid.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Selector pill badge: "👆 แตะเลือก: [icon] [label]"
      const badgeW = 145;
      const badgeH = 26;
      const badgeX = bbox.x + bbox.w / 2 - badgeW / 2;
      const badgeY = Math.max(8, bbox.y - badgeH - 6);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, [6]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`👆 แตะเลือก: ${blob.icon} ${blob.label} #${blob.id}`, badgeX + 6, badgeY + 17);
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center select-none">
      {/* Offscreen Video Element with active decoding */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Main 60 FPS Canvas Feed */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full object-contain cursor-crosshair"
      />

      {/* Global Camera Shake Alert */}
      {isCameraShaking && (
        <div className="absolute top-16 z-40 self-center bg-amber-950/95 border border-amber-500/80 text-amber-200 px-3.5 py-1.5 rounded-xl text-xs shadow-2xl backdrop-blur-md animate-in fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>📱 กล้องกำลังส่าย — ถือให้นิ่งเพื่อเริ่มวัดความเร็ว (ระบบกันสั่นตัดภาพขยะอัตโนมัติ)</span>
        </div>
      )}

      {/* Camera Error Notice */}
      {sourceMode === 'camera' && cameraError && (
        <div className="absolute top-16 left-4 right-4 bg-slate-900/95 border border-amber-600 text-amber-200 p-4 rounded-2xl shadow-2xl flex flex-col gap-2 z-30">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Camera className="w-5 h-5 text-amber-400" />
            <span>ต้องการสิทธิ์การเข้าถึงกล้อง</span>
          </div>
          <p className="text-xs text-slate-300">
            {cameraError} (ต้องเปิดผ่าน HTTPS หรือกดโหมดจำลองเพื่อทดสอบได้ทันที)
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={startCamera}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              ลองใหม่อีกครั้ง
            </button>
            <button
              onClick={() => setSourceMode('sim')}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Car className="w-3.5 h-3.5" />
              สลับไปโหมดจำลอง (SIM)
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastNote && (
        <div className="absolute top-16 z-40 self-center bg-slate-900/95 border border-sky-500/80 text-sky-200 px-4 py-2 rounded-xl text-xs shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-150 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>{toastNote}</span>
        </div>
      )}

      {/* ULTRA-CLEAN HUD CONTROLS OVERLAY */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2.5 sm:p-3">
        {/* Top Action Bar */}
        <div className="flex flex-col gap-2 w-full">
          <div className="pointer-events-auto flex items-center justify-between gap-2 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-800 shadow-2xl overflow-x-auto no-scrollbar w-full">
            {/* Left: Mode Switch & Status */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Camera vs Sim Mode Switch */}
              <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-[11px]">
                <button
                  onClick={() => {
                    setSourceMode('camera');
                    motionTrackerRef.current.reset();
                    setToastNote('📹 เปลี่ยนเป็นโหมดกล้องสด');
                    setTimeout(() => setToastNote(null), 2000);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                    sourceMode === 'camera'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  <span>กล้องสด</span>
                </button>
                <button
                  onClick={() => {
                    setSourceMode('sim');
                    motionTrackerRef.current.reset();
                    setToastNote('🎮 เปลี่ยนเป็นโหมดจำลองถนน');
                    setTimeout(() => setToastNote(null), 2000);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                    sourceMode === 'sim'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Car className="w-3 h-3" />
                  <span>โหมดจำลอง</span>
                </button>
              </div>

              {/* Handheld Anti-Shake Switch */}
              <button
                onClick={() => {
                  const next = !isHandheld;
                  setIsHandheld(next);
                  motionTrackerRef.current.config.isHandheld = next;
                  setToastNote(
                    next
                      ? '📱 เปิดโหมดถือด้วยมือ (เปิดระบบกันสั่น ตัดวัตถุรบกวน 100%)'
                      : '📐 เปิดโหมดขาตั้ง (ไวต่อความเคลื่อนไหว)'
                  );
                  setTimeout(() => setToastNote(null), 2500);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition ${
                  isHandheld
                    ? 'bg-indigo-600/35 border-indigo-500 text-indigo-200 shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title={isHandheld ? 'โหมดถือด้วยมือ: เปิดระบบกันสั่น' : 'โหมดขาตั้ง'}
              >
                <span>{isHandheld ? '📱 ถือมือ (กันสั่น)' : '📐 ขาตั้ง'}</span>
              </button>

              {/* Target Filter Selector: คน & รถ */}
              <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-[11px]">
                <button
                  onClick={() => {
                    setTargetFilter('all');
                    setToastNote('🎯 ตรวจจับ: ทั้งคน และ รถ ทุกชนิด');
                    setTimeout(() => setToastNote(null), 2000);
                  }}
                  className={`px-2 py-0.5 rounded-lg font-bold transition ${
                    targetFilter === 'all'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="ตรวจจับทั้งคนเดินและรถทุกประเภท"
                >
                  👥 คน & รถ
                </button>
                <button
                  onClick={() => {
                    setTargetFilter('vehicles');
                    setToastNote('🚗 ตรวจจับ: เฉพาะรถยนต์/มอเตอร์ไซค์/รถบรรทุก');
                    setTimeout(() => setToastNote(null), 2000);
                  }}
                  className={`px-2 py-0.5 rounded-lg font-bold transition ${
                    targetFilter === 'vehicles'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="ตรวจจับเฉพาะรถยนต์ มอเตอร์ไซค์ รถบัส รถบรรทุก"
                >
                  🚗 เฉพาะรถ
                </button>
                <button
                  onClick={() => {
                    setTargetFilter('people');
                    setToastNote('🏃 ตรวจจับ: เฉพาะคนเดินหรือคนวิ่ง');
                    setTimeout(() => setToastNote(null), 2000);
                  }}
                  className={`px-2 py-0.5 rounded-lg font-bold transition ${
                    targetFilter === 'people'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="ตรวจจับเฉพาะคนเดิน/วิ่ง"
                >
                  🏃 เฉพาะคน
                </button>
              </div>

              {/* AI Status Badge & FPS */}
              <div className="hidden xs:flex items-center gap-2 border-l border-slate-800 pl-2">
                <div className="hidden md:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-indigo-950/70 border border-indigo-500/40 text-indigo-300">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>{isAiReady ? 'AI กรองคน/รถ: พร้อม' : 'กำลังเตรียม AI...'}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-white">{fps}</span>
                  <span>FPS</span>
                </div>
              </div>
            </div>

            {/* Right: Controls & Presets */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Custom Speed Limit Slide Bar */}
              <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-2.5 py-1 border border-rose-500/50 shadow-md">
                <span className="text-[11px] font-bold text-rose-400 shrink-0 flex items-center gap-1">
                  <span>🚨 ลิมิต:</span>
                  <span className="font-mono text-white text-xs font-black min-w-[24px]">
                    {speedLimitKmh}
                  </span>
                  <span className="text-[10px] text-slate-400">km/h</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="140"
                  step="5"
                  value={speedLimitKmh}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSpeedLimitKmh(val);
                  }}
                  className="w-20 sm:w-28 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  title={`ลากแถบสไลด์เพื่อปรับลิมิตความเร็ว: ${speedLimitKmh} km/h`}
                />
              </div>

              {/* Auto-Capture Toggle (Strictly Over Speed Limit) */}
              <button
                onClick={() => {
                  const next = !autoCapture;
                  setAutoCapture(next);
                  motionTrackerRef.current.config.autoCapture = next;
                  setToastNote(
                    next
                      ? `📸 เปิดออโต้แคป: บันทึกเฉพาะตอนเกินลิมิต (${speedLimitKmh} km/h)`
                      : '⏸️ ปิดออโต้แคป (ดูความเร็วสดอย่างเดียว)'
                  );
                  setTimeout(() => setToastNote(null), 2500);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition ${
                  autoCapture
                    ? 'bg-rose-600/25 border-rose-500 text-rose-200 shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title={autoCapture ? `แคปอัตโนมัติ: เฉพาะเมื่อเกิน ${speedLimitKmh} km/h` : 'ปิดแคปอัตโนมัติ'}
              >
                <span>{autoCapture ? '📸 แคปเฉพาะเกินลิมิต' : '⏸️ ปิดแคป'}</span>
              </button>

              {/* Anti-Noise Sensitivity */}
              <div className="hidden sm:flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-[11px]">
                <span className="px-1.5 text-slate-400 text-[10px]">กรองรบกวน:</span>
                {(['low', 'medium', 'high'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSensitivity(s)}
                    className={`px-1.5 py-0.5 rounded-lg font-bold transition ${
                      sensitivity === s
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={
                      s === 'low'
                        ? 'กรองขยะสูงสุด: ตัดลม/ใบไม้/แสงสะท้อน 100%'
                        : s === 'medium'
                        ? 'ระดับปกติ: แม่นยำและสมดุล'
                        : 'ไวพิเศษ: จับการเคลื่อนไหวระยะไกล'
                    }
                  >
                    {s === 'low' ? 'ตัดขยะสูงสุด' : s === 'medium' ? 'ปกติ' : 'ไวสูง'}
                  </button>
                ))}
              </div>

              {/* Motion Mask Toggle */}
              <button
                onClick={() => {
                  const next = !showMask;
                  setShowMask(next);
                  setToastNote(next ? '👁️ เปิดดูพิกเซลเคลื่อนไหว' : '👁️ ปิดโหมดพิกเซล');
                  setTimeout(() => setToastNote(null), 2000);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition ${
                  showMask
                    ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="เปิด/ปิดการแสดงพิกเซลที่กำลังเคลื่อนไหว"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">ดูพิกเซลขยับ</span>
              </button>

              {/* Principle & Help Modal Button */}
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl border border-slate-700 transition"
                title="หลักการทำงานและวิธีใช้งาน"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              {/* History Drawer */}
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
                title="เปิดดูภาพถ่ายและประวัติความเร็วที่แคปไว้"
              >
                <ClipboardList className="w-3.5 h-3.5 text-sky-400" />
                <span>ประวัติ</span>
                {records.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-sky-500 text-white font-mono rounded-full text-[10px]">
                    {records.length}
                  </span>
                )}
              </button>

              {/* Audio Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                title={soundEnabled ? 'ปิดเสียงเตือน' : 'เปิดเสียงเตือน'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            </div>
          </div>

          {/* Simulator Control Bar */}
          {sourceMode === 'sim' && (
            <div className="pointer-events-auto flex items-center justify-between gap-2 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-sky-500/50 shadow-xl overflow-x-auto no-scrollbar w-full">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-sky-400">ควบคุมรถจำลอง:</span>
                <button
                  onClick={() => {
                    simulatorRef.current.spawnVehicle('car', 55);
                    setToastNote('🚗 ปล่อยรถ 1 คัน (55 km/h)');
                    setTimeout(() => setToastNote(null), 1800);
                  }}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow"
                >
                  <Play className="w-3 h-3" />
                  <span>ปล่อยรถ 1 คัน (55 km/h)</span>
                </button>
                <button
                  onClick={() => {
                    simulatorRef.current.spawnSpeedingVehicle();
                    setToastNote('🏎️ ปล่อยรถซิ่ง (95+ km/h)');
                    setTimeout(() => setToastNote(null), 1800);
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow"
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>ปล่อยรถซิ่ง (95 km/h)</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    const next = !simAutoSpawn;
                    setSimAutoSpawn(next);
                    simulatorRef.current.autoSpawn = next;
                    setToastNote(next ? '🔁 เปิดปล่อยอัตโนมัติ (ทีละคัน)' : '⏸️ ปิดปล่อยอัตโนมัติ');
                    setTimeout(() => setToastNote(null), 2000);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                    simAutoSpawn
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {simAutoSpawn ? '🔁 ปล่อยอัตโนมัติ: เปิด' : '⏸️ ปล่อยอัตโนมัติ: ปิด'}
                </button>
                <button
                  onClick={() => {
                    simulatorRef.current.clearVehicles();
                    motionTrackerRef.current.reset();
                    setToastNote('🧹 ล้างรถบนถนนแล้ว');
                    setTimeout(() => setToastNote(null), 1500);
                  }}
                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                  title="เคลียร์ถนน"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Target Focus Status or Tap Prompt */}
        {lockedTargetId !== null && lockedBlob ? (
          <div className="pointer-events-auto self-center flex items-center gap-2.5 bg-slate-950/95 border-2 border-amber-400/90 text-amber-200 px-3.5 py-1.5 rounded-2xl text-xs shadow-2xl backdrop-blur-md animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-amber-300">
              🎯 โฟกัส: {lockedBlob.icon} {lockedBlob.label} #{lockedBlob.id}
            </span>
            <span className="font-mono font-black text-white px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700">
              {lockedBlob.isStationary ? '[จอดนิ่ง]' : `${lockedBlob.currentSpeedKmh} km/h`}
            </span>
            <button
              onClick={() => {
                setLockedTargetId(null);
                setToastNote('🔓 ปลดล็อกเป้าหมายแล้ว - แตะเลือกเป้าใหม่');
                setTimeout(() => setToastNote(null), 2000);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold active:scale-95 shadow transition"
              title="ปลดล็อกเพื่อเลือกเป้าหมายอื่น"
            >
              <X className="w-3 h-3" />
              <span>ปลดล็อก</span>
            </button>
          </div>
        ) : activeBlobs.length > 0 ? (
          <div className="pointer-events-auto self-center flex items-center gap-2 bg-slate-900/90 border border-sky-500/60 text-sky-200 px-3.5 py-1.5 rounded-full text-xs shadow-xl backdrop-blur-md animate-in fade-in">
            <span className="text-sm">👆</span>
            <span className="font-semibold">แตะเลือกวัตถุบนจอ หรือกดปุ่มด้านล่างเพื่อเริ่มโฟกัส</span>
          </div>
        ) : null}

        {/* Bottom Live Feed Stats & Manual Snap Row */}
        <div className="pointer-events-auto flex items-center justify-between gap-2 max-w-full">
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar flex-1 items-center">
            {lockedTargetId !== null && lockedBlob ? (
              /* A: Single Locked Target Focused Card */
              <div
                className={`shrink-0 flex items-center gap-3 px-4 py-2 rounded-2xl border-2 backdrop-blur-md transition shadow-2xl ${
                  lockedBlob.currentSpeedKmh > speedLimitKmh
                    ? 'border-rose-500 bg-rose-950/90 text-rose-200'
                    : 'border-amber-400/90 bg-slate-950/95 text-amber-200'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-xl">{lockedBlob.icon}</span>
                  <span className="text-[10px] font-mono font-bold text-amber-300">#{lockedBlob.id}</span>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">🎯 โฟกัส: {lockedBlob.label}</span>
                    <button
                      onClick={() => {
                        setLockedTargetId(null);
                        setToastNote('🔓 ปลดล็อกเป้าหมายแล้ว');
                        setTimeout(() => setToastNote(null), 1800);
                      }}
                      className="text-[10px] bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 rounded font-bold transition active:scale-95"
                    >
                      ✕ ปลดล็อก
                    </button>
                  </div>

                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    {lockedBlob.isStationary ? (
                      <span className="text-xs text-amber-400 font-semibold">[จอดนิ่ง/นิ่งอยู่]</span>
                    ) : (
                      <>
                        <span className="text-xl font-black font-mono text-white">
                          {lockedBlob.currentSpeedKmh}
                        </span>
                        <span className="text-xs font-bold text-sky-400 font-sans">km/h</span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          สูงสุด: {lockedBlob.peakSpeedKmh} km/h
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : activeBlobs.length > 0 ? (
              /* B: Target Selection Quick Buttons (No Target Locked Yet) */
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-bold text-sky-300 shrink-0 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-sky-500/40">
                  👆 เลือกโฟกัส:
                </span>
                {activeBlobs.map((blob) => (
                  <button
                    key={blob.id}
                    onClick={() => {
                      setLockedTargetId(blob.id);
                      audioAlert.playDetectBlip();
                      setToastNote(`🎯 ล็อกเป้าหมาย: ${blob.label} #${blob.id}`);
                      setTimeout(() => setToastNote(null), 2000);
                    }}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/95 hover:bg-sky-950 border border-sky-400/80 text-sky-200 text-xs font-bold rounded-xl shadow-2xl active:scale-95 transition"
                  >
                    <span className="text-base">{blob.icon}</span>
                    <span>เลือก {blob.label} #{blob.id}</span>
                  </button>
                ))}
              </div>
            ) : (
              /* C: Waiting / Scanning Indicator */
              <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-300 flex items-center gap-2 shadow-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  {sourceMode === 'sim'
                    ? '🎮 กำลังรอรถแล่นผ่าน (กดปุ่ม "ปล่อยรถ 1 คัน" เพื่อเริ่มทดสอบ)'
                    : isHandheld
                    ? '📱 เล็งกล้องไปที่ถนน: เมื่อมีรถหรือคนปรากฏ แตะเลือกเพื่อเริ่มโฟกัส'
                    : '📡 กำลังสแกนหา "คน" หรือ "รถ"'}
                </span>
              </div>
            )}
          </div>

          {/* Floating Manual Capture Button */}
          {activeBlobs.length > 0 && (
            <button
              onClick={handleManualCapture}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-2xl border border-emerald-400/40 active:scale-95 transition"
              title="กดเพื่อถ่ายภาพเป้าหมายตอนนี้ทันที"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">แคปภาพ</span>
            </button>
          )}
        </div>
      </div>

      {/* Principle & Guide Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-5 text-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
                <HelpCircle className="w-5 h-5" />
                <span>ระบบกันมือสั่น & การตรวจจับคนและรถ</span>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="bg-slate-950 p-3 rounded-xl border border-sky-600/50">
                <h4 className="font-bold text-sky-400 mb-1 flex items-center gap-1.5">
                  <span>🎯 ระบบแตะเลือกวัตถุเพื่อโฟกัส (Tap-to-Focus)</span>
                </h4>
                <p>
                  • <strong>ไม่ตีกรอบหลายชิ้นพร้อมกัน:</strong> เมื่อส่องกล้อง หน้าจอจะแสดงกรอบปรุให้แตะเลือก
                  <br />• <strong>วิธีเลือกเป้าหมาย:</strong> แตะที่ตัวรถหรือคนที่ต้องการบนหน้าจอ หรือกดปุ่ม <strong>[เลือก รถยนต์ #1]</strong> ด้านล่าง
                  <br />• <strong>เมื่อโฟกัสแล้ว:</strong> ระบบจะซ่อนวัตถุอื่นทั้งหมด และโฟกัสวัดความเร็วเฉพาะเป้าหมายนี้ตัวเดียว
                  <br />• <strong>การปลดล็อก:</strong> กดปุ่ม <strong>"✕ ปลดล็อก"</strong> เพื่อเปลี่ยนไปโฟกัสคันอื่นได้ตลอดเวลา
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h4 className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <span>1. ระบบกันมือสั่น (Handheld Anti-Tremor)</span>
                </h4>
                <p>
                  เมื่อถือโทรศัพท์ด้วยมือ มือจะส่ายไปมาเล็กน้อย ระบบจะ:
                  <br />• <strong>ล็อกเป้าหมายผ่าน AI เท่านั้น:</strong> จะไม่สร้างกรอบขึ้นมาจากสิ่งของทั่วไป (เช่น ผนัง ประตู ต้นไม้ เงา)
                  <br />• <strong>ตัดการสั่นไหวไปมา:</strong> การสั่นของมือจะมีระยะขยับส่ายไปมาอยู่ที่เดิม (น้อยกว่า 30 พิกเซล) ระบบจะไม่นำมาคิดเป็นความเร็วและไม่แคปภาพ
                  <br />• <strong>จับเฉพาะการเคลื่อนที่จริง:</strong> รถหรือคนต้องเคลื่อนที่ไปในทิศทางหนึ่งอย่างต่อเนื่อง (ระยะกระจัดเกิน 35 พิกเซล) ถึงจะคำนวณความเร็ว
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h4 className="font-bold text-sky-400 mb-1 flex items-center gap-1.5">
                  <span>2. แคปภาพอัตโนมัติเฉพาะตอน "เกินลิมิตความเร็ว"</span>
                </h4>
                <p>
                  • <strong>ไม่แคปรถที่ขับความเร็วปกติ:</strong> ระบบจะแคปภาพออโต้เฉพาะเป้าหมายที่ความเร็วเกินลิมิตที่คุณตั้งไว้เท่านั้น (เช่น ตั้งไว้ 60 km/h หากรถวิ่ง 50 km/h จะไม่บันทึก)
                  <br />• <strong>ปรับลิมิตความเร็วได้เอง:</strong> สามารถกดปุ่ม <strong>[ - ]</strong> หรือ <strong>[ + ]</strong> หรือแตะพิมพ์ตัวเลขความเร็วลิมิตที่ต้องการได้โดยตรงบนแถบด้านบน
                  <br />• <strong>ปุ่มแคปภาพแมนนวล:</strong> หากต้องการบันทึกภาพรถที่ความเร็วปกติ สามารถกดปุ่ม <strong>"📸 แคปภาพ"</strong> มุมขวาล่างได้ตลอดเวลา
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <span>3. เงื่อนไขการถ่ายภาพออโต้ที่แม่นยำ</span>
                </h4>
                <p>
                  ระบบจะแคปภาพอัตโนมัติเฉพาะเมื่อ:
                  <br />1) ความเร็วเกินลิมิตที่กำหนดไว้ (Overspeed)
                  <br />2) วัตถุตรงกับเป้าหมายที่กำลังล็อกโฟกัสอยู่
                  <br />3) เคลื่อนไหวต่อเนื่องอย่างน้อย 10 เฟรม (~0.25 วินาที)
                  <br />4) กล้องต้องไม่ส่ายหรือสะบัด
                </p>
              </div>

              <div className="bg-sky-950/30 p-3 rounded-xl border border-sky-600/40">
                <h4 className="font-bold text-sky-300 mb-1">💡 เคล็ดลับการถือกล้อง</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>เปิดโหมด <strong>"📱 ถือมือ (กันสั่น)"</strong> เป็นค่าเริ่มต้นเสมอเมื่อถือด้วยมือ</li>
                  <li>หากส่องริมถนน แนะนำให้กดแท็บ <strong>"🚗 เฉพาะรถ"</strong> เพื่อความแม่นยำสูงสุด</li>
                  <li>หากมีลมพัดแรง สามารถกด <strong>"กรองรบกวน: ตัดขยะสูงสุด"</strong></li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-5 w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs transition"
            >
              เข้าใจแล้ว เริ่มใช้งาน
            </button>
          </div>
        </div>
      )}

      {/* Detection History Drawer */}
      <DetectionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        records={records}
        onClear={() => {
          setRecords([]);
          localStorage.removeItem('speed_pwa_records');
        }}
        speedLimitKmh={speedLimitKmh}
      />
    </div>
  );
};
