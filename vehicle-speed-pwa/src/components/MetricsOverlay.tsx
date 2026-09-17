/**
 * Real-Time HUD Metrics & Vehicle Readout Overlay
 * 
 * Displays top status bar (FPS, Inference Latency, Camera Shake alert)
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
  internalScale,
}) => {
  const activeStats = Array.from(statsMap.values()).filter((s) => !s.isStationary || s.currentSpeedKmh > 0);

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
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 select-none">
      {/* Top HUD Bar */}
      <div className="pointer-events-auto flex items-center justify-between gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto no-scrollbar w-full">
        {/* Left: Mode and FPS */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full animate-pulse ${
                isSimulationMode ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-slate-200">
              {isSimulationMode ? 'SIMULATOR' : 'LIVE CAMERA'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-mono text-slate-400 border-l border-slate-800 pl-2 sm:pl-3">
            <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400" />
            <span className="font-bold text-white">{fps}</span>
            <span>FPS</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-mono text-slate-400 border-l border-slate-800 pl-2 sm:pl-3">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            <span className="font-bold text-white">{inferenceLatencyMs}</span>
            <span>ms</span>
            {internalScale < 1.0 && (
              <span className="text-[10px] text-amber-300 font-sans ml-1">
                ({Math.round(internalScale * 100)}%)
              </span>
            )}
          </div>
        </div>

        {/* Right: Calibration Status & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!isCalibrated ? (
            <button
              onClick={onOpenCalibration}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-medium rounded-lg animate-pulse"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Needs Calibration</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Calibrated</span>
            </div>
          )}

          <button
            onClick={onToggleSettings}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
            title="Settings"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Camera Shake Warning Toast */}
      {motionStatus.isShaking && (
        <div className="self-center mt-2 flex items-center gap-2 bg-rose-950/90 border border-rose-600 text-rose-200 px-4 py-2 rounded-xl text-xs shadow-2xl backdrop-blur-md animate-bounce">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Camera Shake Detected! Keep steady or use a tripod.</span>
        </div>
      )}

      {/* Bottom Live Vehicle Speed Stats Feed */}
      <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
        {activeStats.length === 0 ? (
          <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>Scanning for moving vehicles in zone...</span>
          </div>
        ) : (
          activeStats.map((stat) => {
            const isOver = stat.currentSpeedKmh > speedLimitKmh;
            const isNear = stat.currentSpeedKmh > speedLimitKmh - 10;
            const badgeColor = isOver
              ? 'border-rose-500 bg-rose-950/70 text-rose-300'
              : isNear
              ? 'border-amber-500 bg-amber-950/70 text-amber-300'
              : 'border-emerald-500 bg-emerald-950/70 text-emerald-300';

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
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black font-mono tracking-tight leading-none">
                      {stat.currentSpeedKmh}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">km/h</span>
                  </div>
                  <div className="text-[9px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Avg: {stat.averageSpeedKmh}</span>
                    <span>Max: {stat.maxSpeedKmh}</span>
                  </div>
                </div>

                {isOver && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white px-1.5 py-0.5 rounded animate-pulse">
                    OVERSPEED
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
