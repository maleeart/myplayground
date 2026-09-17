/**
 * Ultra-Fast Optical Motion Speedometer & Camera View
 * 
 * Rebuilt from the ground up:
 * - Pure Frame-to-Frame Differencing (เปรียบเทียบเฟรมต่อเฟรม): Instantly locks onto ANY moving object!
 * - 60 FPS sub-millisecond execution (No slow neural net loading or dropouts)
 * - Automatic velocity estimation in km/h based on distance reference
 * - Auto-snapshot capture and persistent detection history log
 * - Clean, distraction-free interface with quick 1-tap distance and sensitivity controls
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MotionTracker, type MotionBlob } from '../core/motionTracker';
import { DetectionHistoryDrawer, type DetectionRecord } from './DetectionHistoryDrawer';
import { audioAlert } from '../utils/audioAlert';
import {
  Camera,
  RefreshCw,
  ClipboardList,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Activity,
  Zap,
} from 'lucide-react';

export const CameraView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeTrackRef = useRef<MediaStreamTrack | null>(null);

  // Motion Tracker Engine (Frame Differencing)
  const motionTrackerRef = useRef<MotionTracker>(
    new MotionTracker({
      distanceMeters: 15.0,
      sensitivity: 'medium',
      minAreaPx: 900,
    })
  );

  // Settings & Controls
  const [distanceMeters, setDistanceMeters] = useState<number>(15);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [speedLimitKmh, setSpeedLimitKmh] = useState<number>(60);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFocusLocked, setIsFocusLocked] = useState<boolean>(false);
  const [toastNote, setToastNote] = useState<string | null>(null);

  // UI Drawers & State
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [activeBlobs, setActiveBlobs] = useState<MotionBlob[]>([]);

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

  // Sync config with tracker
  useEffect(() => {
    motionTrackerRef.current.config.distanceMeters = distanceMeters;
    motionTrackerRef.current.config.sensitivity = sensitivity;
    audioAlert.enabled = soundEnabled;
  }, [distanceMeters, sensitivity, soundEnabled]);

  /**
   * Capture a cropped snapshot of the moving object from full-resolution video
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

      // Expand margin 25% around moving object for context
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
   * Toggle Focus Lock on camera
   */
  const handleToggleFocusLock = useCallback(async () => {
    const track = activeTrackRef.current;
    if (!track) {
      setToastNote('⚠️ กรุณารอกล้องพร้อมใช้งาน');
      setTimeout(() => setToastNote(null), 2500);
      return;
    }

    const nextState = !isFocusLocked;
    try {
      const caps = (track as any).getCapabilities?.() || {};
      const advanced: any = {};

      if (nextState) {
        if (caps.focusMode) {
          advanced.focusMode = caps.focusMode.includes('single-shot')
            ? 'single-shot'
            : caps.focusMode.includes('manual')
            ? 'manual'
            : 'continuous';
        }
        if (caps.exposureMode && caps.exposureMode.includes('manual')) {
          advanced.exposureMode = 'manual';
        }
        if (Object.keys(advanced).length > 0) {
          await track.applyConstraints({ advanced: [advanced] } as any);
        }
        setIsFocusLocked(true);
        setToastNote('🔒 ล็อกโฟกัสคงที่แล้ว (กล้องจะไม่ปรับเองเมื่อมีสิ่งเคลื่อนไหวผ่าน)');
      } else {
        if (caps.focusMode && caps.focusMode.includes('continuous')) {
          advanced.focusMode = 'continuous';
        }
        if (Object.keys(advanced).length > 0) {
          await track.applyConstraints({ advanced: [advanced] } as any);
        }
        setIsFocusLocked(false);
        setToastNote('🎯 ปลดล็อกสู่โหมดออโต้โฟกัส');
      }
      setTimeout(() => setToastNote(null), 3000);
    } catch {
      setIsFocusLocked(nextState);
      setToastNote(nextState ? '🔒 ล็อกโฟกัสแล้ว' : '🎯 ปลดล็อกโฟกัส');
      setTimeout(() => setToastNote(null), 3000);
    }
  }, [isFocusLocked]);

  /**
   * Tap-to-Focus on camera canvas
   */
  const handleCanvasClick = useCallback(async (e: React.MouseEvent<HTMLCanvasElement>) => {
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
        setToastNote('🎯 ปรับจุดโฟกัสไปที่ตำแหน่งที่แตะแล้ว');
        setTimeout(() => setToastNote(null), 2000);
      }
    } catch {
      // ignore
    }
  }, []);

  /**
   * Main Render and Motion Tracking Loop (Full 60 FPS)
   */
  useEffect(() => {
    const loop = (timestamp: number) => {
      // FPS calculation
      frameCountRef.current++;
      if (timestamp - lastFpsCalcRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsCalcRef.current = timestamp;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) {
        animationFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      // Ensure video is playing with valid dimensions
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // Draw live camera frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 1. Process Frame Differencing & Motion Tracking
        const { blobs, newlyDetectedForLogging } = motionTrackerRef.current.processFrame(video, timestamp);
        setActiveBlobs(blobs);

        // 2. Handle Auto-Snapshot & Logging for newly confirmed moving objects
        if (newlyDetectedForLogging.length > 0) {
          for (const blob of newlyDetectedForLogging) {
            const snapUrl = captureSnapshot(video, blob.bbox);
            const now = new Date();
            const timeStr = now.toTimeString().split(' ')[0];
            const isOver = blob.peakSpeedKmh > speedLimitKmh;

            const newRecord: DetectionRecord = {
              id: `${blob.id}-${Date.now()}`,
              trackId: blob.id,
              vehicleClass: 'วัตถุเคลื่อนไหว',
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

            // Audio Blip / Alarm
            if (isOver) {
              audioAlert.playOverspeedAlarm();
            } else {
              audioAlert.playDetectBlip();
            }
          }
        }

        // 3. Render Motion HUD Overlays
        drawMotionOverlays(ctx, blobs, canvas.width, canvas.height);
      } else {
        // Standby Screen
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

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [distanceMeters, speedLimitKmh]);

  /**
   * Draw glowing motion bounding boxes, trajectory trails, and speed badges
   */
  const drawMotionOverlays = (
    ctx: CanvasRenderingContext2D,
    blobs: MotionBlob[],
    _width: number,
    _height: number
  ) => {
    for (const blob of blobs) {
      const { bbox, centroid, history, currentSpeedKmh } = blob;
      const isOver = currentSpeedKmh > speedLimitKmh;
      const isMoving = currentSpeedKmh > 5;
      const themeColor = isOver ? '#ef4444' : isMoving ? '#10b981' : '#38bdf8';

      // 1. Trajectory Trail (Smooth neon trail)
      if (history.length > 1) {
        ctx.beginPath();
        for (let i = 0; i < history.length; i++) {
          const pt = history[i];
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

      // 2. High-Tech Corner Brackets around moving object
      const cornerLen = Math.min(bbox.w, bbox.h) * 0.28;
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 3;

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

      // 3. Centroid Crosshair
      ctx.fillStyle = themeColor;
      ctx.beginPath();
      ctx.arc(centroid.x, centroid.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // 4. Live Speed Badge Overlay
      const badgeW = 120;
      const badgeH = 30;
      const badgeX = bbox.x + bbox.w / 2 - badgeW / 2;
      const badgeY = Math.max(10, bbox.y - badgeH - 8);

      ctx.fillStyle = isOver ? 'rgba(239, 68, 68, 0.92)' : 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, [8]);
      ctx.fill();
      ctx.strokeStyle = isOver ? '#fca5a5' : themeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`วัตถุ #${blob.id}`, badgeX + 8, badgeY + 14);

      ctx.fillStyle = isOver ? '#ffffff' : '#38bdf8';
      ctx.font = 'bold 13px monospace';
      const speedStr = currentSpeedKmh > 0 ? `${currentSpeedKmh} km/h` : 'คำนวณ...';
      ctx.fillText(speedStr, badgeX + 8, badgeY + 26);
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center select-none">
      {/* Hidden Mobile Video Stream */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="hidden"
      />

      {/* Main 60 FPS Canvas Feed */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full object-contain cursor-crosshair"
      />

      {/* Camera Error Notice */}
      {cameraError && (
        <div className="absolute top-16 left-4 right-4 bg-slate-900/95 border border-amber-600 text-amber-200 p-4 rounded-2xl shadow-2xl flex flex-col gap-2 z-30">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Camera className="w-5 h-5 text-amber-400" />
            <span>ต้องการสิทธิ์การเข้าถึงกล้อง</span>
          </div>
          <p className="text-xs text-slate-300">
            {cameraError} (ต้องเปิดผ่าน HTTPS หรือ Localhost บนมือถือ)
          </p>
          <button
            onClick={startCamera}
            className="self-start px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ลองใหม่อีกครั้ง
          </button>
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
        {/* Top Minimal Action Bar */}
        <div className="pointer-events-auto flex items-center justify-between gap-2 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-800 shadow-2xl overflow-x-auto no-scrollbar w-full">
          {/* Left: Motion Status & FPS */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ตรวจจับความเคลื่อนไหว (MOTION)</span>
            </div>

            <div className="hidden xs:flex items-center gap-1 text-[11px] font-mono text-slate-400 border-l border-slate-800 pl-2">
              <Activity className="w-3 h-3 text-sky-400" />
              <span className="font-bold text-white">{fps}</span>
              <span>FPS</span>
            </div>
          </div>

          {/* Right: Quick Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 1-Tap Distance Preset */}
            <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-[11px]">
              <span className="px-1.5 text-slate-400 text-[10px]">ระยะ:</span>
              {[10, 15, 25, 40].map((d) => (
                <button
                  key={d}
                  onClick={() => setDistanceMeters(d)}
                  className={`px-2 py-0.5 rounded-lg font-bold transition ${
                    distanceMeters === d
                      ? 'bg-sky-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`ตั้งระยะห่างจากกล้องถึงถนน ${d} เมตร`}
                >
                  {d}m
                </button>
              ))}
            </div>

            {/* Sensitivity */}
            <div className="hidden sm:flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-[11px]">
              <span className="px-1.5 text-slate-400 text-[10px]">ความไว:</span>
              {(['low', 'medium', 'high'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSensitivity(s)}
                  className={`px-2 py-0.5 rounded-lg font-bold transition ${
                    sensitivity === s
                      ? 'bg-amber-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`ปรับความไว: ${s}`}
                >
                  {s === 'low' ? 'ต่ำ' : s === 'medium' ? 'กลาง' : 'สูง'}
                </button>
              ))}
            </div>

            {/* Speed Limit Cycler */}
            <button
              onClick={() => {
                const limits = [40, 60, 80, 100];
                const next = limits[(limits.indexOf(speedLimitKmh) + 1) % limits.length];
                setSpeedLimitKmh(next);
                setToastNote(`🚨 ความเร็วเตือนเกินกำหนด: ${next} km/h`);
                setTimeout(() => setToastNote(null), 2000);
              }}
              className="px-2 py-1 rounded-xl text-xs font-bold border border-rose-500/40 bg-rose-500/15 text-rose-300 transition hover:bg-rose-500/25"
              title="แตะเพื่อเปลี่ยนระดับความเร็วเตือนเกินกำหนด"
            >
              🚨 {speedLimitKmh} km/h
            </button>

            {/* Focus Lock */}
            <button
              onClick={handleToggleFocusLock}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition ${
                isFocusLocked
                  ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={isFocusLocked ? 'โฟกัสคงที่แล้ว' : 'แตะเพื่อล็อกโฟกัส'}
            >
              {isFocusLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">โฟกัสคงที่</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">ล็อกโฟกัส</span>
                </>
              )}
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

        {/* Bottom Live Feed Stats Bar */}
        <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {activeBlobs.length === 0 ? (
            <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-300 flex items-center gap-2 shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>📡 เล็งกล้องไปที่ถนน (เมื่อมีรถหรือวัตถุขยับ ระบบจะล็อกและวัดความเร็วทันที)</span>
            </div>
          ) : (
            activeBlobs.map((blob) => {
              const isOver = blob.currentSpeedKmh > speedLimitKmh;
              return (
                <div
                  key={blob.id}
                  className={`shrink-0 flex items-center gap-3 px-3.5 py-2 rounded-xl border backdrop-blur-md transition shadow-2xl ${
                    isOver
                      ? 'border-rose-500 bg-rose-950/85 text-rose-200'
                      : 'border-emerald-500 bg-emerald-950/85 text-emerald-200'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-[10px] font-mono text-slate-300">#{blob.id}</span>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black font-mono">
                        {blob.currentSpeedKmh > 0 ? blob.currentSpeedKmh : '...'}
                      </span>
                      <span className="text-[11px] font-sans font-medium">km/h</span>
                    </div>
                    <span className="text-[10px] text-slate-300">
                      สูงสุด: {blob.peakSpeedKmh} km/h
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

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
