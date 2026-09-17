/**
 * Real-Time HUD Metrics & Vehicle Readout Overlay
 * 
 * Displays top status bar (FPS, Inference Latency, Camera Shake alert, History Log, Simulator toggle)
 * and vehicle speed readout cards (Instantaneous, Average, Max speed).
 */

import React from 'react';
import type { VehicleSpeedStats } from '../core/speedEstimator';
import type { MotionStatus } from '../utils/motionDetector';
import {
  Activity,
  AlertTriangle,
  Car,
  Truck,
  Zap,
  RotateCw,
  Clock,
  Compass,
  ClipboardList,
  Volume2,
  VolumeX,
  PlaySquare,
  Camera,
} from 'lucide-react';

interface MetricsOverlayProps {
  fps: number;
  inferenceLatencyMs: number;
  motionStatus: MotionStatus;
  isCalibrated: boolean;
  isSimulationMode: boolean;
  speedLimitKmh: number;
  statsMap: Map<number, VehicleSpeedStats>;
  onOpenCalibration: () => void;
  onToggleSettings: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  onToggleSim: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  internalScale: number;
}

export const MetricsOverlay: React.FC<MetricsOverlayProps> = ({
  fps,
  inferenceLatencyMs,
  motionStatus,
  isCalibrated,
  isSimulationMode,
  speedLimitKmh,
  statsMap,
  onOpenCalibration,
  onToggleSettings,
  onOpenHistory,
  historyCount,
  onToggleSim,
  audioEnabled,
  onToggleAudio,
  internalScale,
}) => {
  // Display all active tracks (even if just locked onto)
  const activeStats = Array.from(statsMap.values());

  const getVehicleIcon = (vClass: string) => {
    switch (vClass.toLowerCase()) {
      case 'truck':
      case 'bus':
        return <Truck className="w-4 h-4 text-amber-400" />;
      case 'motorcycle':
        return <Zap className="w-4 h-4 text-rose-400" />;
      default:
        return <Car className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2.5 sm:p-3 select-none">
      {/* Top HUD Bar */}
      <div className="pointer-events-auto flex items-center justify-between gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 sm:py-2 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto no-scrollbar w-full">
        {/* Left: Mode, Sim Switch, and FPS */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleSim}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
              isSimulationMode
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
            }`}
            title="สลับระหว่างกล้องจริงและโหมดจำลอง (Simulator)"
          >
            {isSimulationMode ? (
              <>
                <PlaySquare className="w-3.5 h-3.5 text-amber-400" />
                <span>จำลองรถ (SIM)</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>กล้องสด (LIVE)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 border-l border-slate-800 pl-2">
            <Activity className="w-3 h-3 text-sky-400" />
            <span className="font-bold text-white">{fps}</span>
            <span>FPS</span>
          </div>

          <div className="hidden xs:flex items-center gap-1 text-[11px] font-mono text-slate-400 border-l border-slate-800 pl-2">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="font-bold text-white">{inferenceLatencyMs}</span>
            <span>ms</span>
            {internalScale < 1.0 && (
              <span className="text-[10px] text-amber-300 font-sans ml-0.5">
                ({Math.round(internalScale * 100)}%)
              </span>
            )}
          </div>
        </div>

        {/* Right: History Log, Audio, Calibration, Settings */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* History Log Drawer button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
            title="เปิดดูประวัติการตรวจจับที่บันทึกไว้"
          >
            <ClipboardList className="w-3.5 h-3.5 text-sky-400" />
            <span>ประวัติ</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-sky-500 text-white font-mono rounded-full text-[10px]">
                {historyCount}
              </span>
            )}
          </button>

          {/* Sound toggle */}
          <button
            onClick={onToggleAudio}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            title={audioEnabled ? 'ปิดเสียงเตือน' : 'เปิดเสียงเตือน'}
          >
            {audioEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {!isCalibrated ? (
            <button
              onClick={onOpenCalibration}
              className="flex items-center gap-1 px-2 py-1 bg-amber-500/25 border border-amber-500 text-amber-300 text-xs font-semibold rounded-lg animate-pulse"
              title="กดเพื่อตั้งค่ามิติเลนถนน"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>เทียบถนน</span>
            </button>
          ) : (
            <button
              onClick={onOpenCalibration}
              className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-2 py-1 rounded-md"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>เทียบแล้ว</span>
            </button>
          )}

          <button
            onClick={onToggleSettings}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
            title="การตั้งค่า"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Camera Shake Warning Toast */}
      {motionStatus.isShaking && (
        <div className="self-center mt-2 flex items-center gap-2 bg-rose-950/90 border border-rose-600 text-rose-200 px-4 py-2 rounded-xl text-xs shadow-2xl backdrop-blur-md animate-bounce">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>กล้องสั่นไหว! โปรดถือให้นิ่งหรือวางบนขาตั้งเพื่อความแม่นยำ</span>
        </div>
      )}

      {/* Bottom Live Vehicle Speed Stats Feed */}
      <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
        {activeStats.length === 0 ? (
          <div className="bg-slate-950/75 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-300 flex items-center gap-2 shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
            <span className="font-medium">เรดาร์กำลังสแกนรถบนถนน... (หรือแตะปุ่ม "จำลองรถ" ด้านบนเพื่อทดสอบทันที)</span>
          </div>
        ) : (
          activeStats.map((stat) => {
            const isOver = stat.currentSpeedKmh > speedLimitKmh;
            const isNear = stat.currentSpeedKmh > speedLimitKmh - 10;
            const badgeColor = isOver
              ? 'border-rose-500 bg-rose-950/80 text-rose-200'
              : isNear
              ? 'border-amber-500 bg-amber-950/80 text-amber-200'
              : 'border-emerald-500 bg-emerald-950/80 text-emerald-200';

            return (
              <div
                key={stat.trackId}
                className={`shrink-0 flex items-center gap-3 px-3 py-2 rounded-xl border backdrop-blur-md transition shadow-lg ${badgeColor}`}
              >
                <div className="flex flex-col items-center">
                  {getVehicleIcon(stat.vehicleClass)}
                  <span className="text-[10px] font-mono text-slate-400">ID #{stat.trackId}</span>
                </div>

                <div className="flex flex-col">
                  {stat.currentSpeedKmh > 0 ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black font-mono tracking-tight leading-none text-white">
                          {stat.currentSpeedKmh}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300">km/h</span>
                      </div>
                      <div className="text-[9px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>เฉลี่ย: {stat.averageSpeedKmh}</span>
                        <span>สูงสุด: {stat.maxSpeedKmh}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                      <span className="text-xs font-bold text-sky-300 font-mono">กำลังจับความเร็ว...</span>
                    </div>
                  )}
                </div>

                {isOver && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white px-1.5 py-0.5 rounded animate-pulse">
                    เกินกำหนด
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
