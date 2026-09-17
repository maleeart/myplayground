/**
 * App Settings & Tuning Drawer
 * 
 * Provides runtime tuning for:
 * - Speed Limit (km/h) for speed violation visual alerts
 * - Exponential Moving Average (EMA) smoothing factor
 * - Adaptive latency throttle (35ms limit)
 * - Switch between Live Camera and Simulation Mode
 * - Detection score threshold
 */

import React from 'react';
import { X, Sliders, ShieldAlert, Cpu, Video, Gauge } from 'lucide-react';

export interface AppSettings {
  speedLimitKmh: number;
  smoothingFactor: number;
  scoreThreshold: number;
  isSimulationMode: boolean;
  adaptiveThrottling: boolean;
  maxLatencyMs: number;
  sensitivity: 'ultra' | 'balanced' | 'strict';
  soundEnabled: boolean;
}

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenCalibration: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenCalibration,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm h-full bg-slate-900 border-l border-slate-800 text-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-semibold">Engine Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
          {/* Simulation vs Camera Mode */}
          <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-slate-300 font-medium">
              <Video className="w-4 h-4 text-sky-400" />
              <span>Video Input Source</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ isSimulationMode: false })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                  !settings.isSimulationMode
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                📹 Live Camera
              </button>
              <button
                onClick={() => onUpdateSettings({ isSimulationMode: true })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                  settings.isSimulationMode
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                🎮 Simulator Mode
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Simulator mode generates synthetic traffic with known ground-truth speeds for laboratory testing.
            </p>
          </div>

          {/* AI Detection Sensitivity */}
          <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium text-xs">🎯 ความไวการตรวจจับ (AI Sensitivity)</span>
              <span className="text-sky-400 font-bold font-mono text-xs">
                {settings.sensitivity === 'ultra' ? 'สูงพิเศษ (Ultra)' : settings.sensitivity === 'strict' ? 'เข้มงวด (Strict)' : 'สมดุล (Balanced)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onUpdateSettings({ sensitivity: 'ultra', scoreThreshold: 0.18 })}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                  settings.sensitivity === 'ultra'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                สูง (0.18)
              </button>
              <button
                onClick={() => onUpdateSettings({ sensitivity: 'balanced', scoreThreshold: 0.24 })}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                  settings.sensitivity === 'balanced'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                สมดุล (0.24)
              </button>
              <button
                onClick={() => onUpdateSettings({ sensitivity: 'strict', scoreThreshold: 0.35 })}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                  settings.sensitivity === 'strict'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                เข้มงวด (0.35)
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              หากตรวจจับรถไม่ค่อยติด ให้เลือก "สูง" เพื่อช่วยจับรถที่วิ่งเร็วหรืออยู่ไกลได้ง่ายขึ้น
            </p>
          </div>

          {/* Speed Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Speed Limit Alert
              </span>
              <span className="text-rose-400 font-bold font-mono">
                {settings.speedLimitKmh} km/h
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="140"
              step="5"
              value={settings.speedLimitKmh}
              onChange={(e) => onUpdateSettings({ speedLimitKmh: Number(e.target.value) })}
              className="w-full accent-rose-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>30 km/h (Urban)</span>
              <span>60 km/h (Main)</span>
              <span>120 km/h (Highway)</span>
            </div>
          </div>

          {/* Smoothing Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <Gauge className="w-4 h-4 text-emerald-400" />
                Speed Smoothing (EMA α)
              </span>
              <span className="text-emerald-400 font-bold font-mono">
                {settings.smoothingFactor.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={settings.smoothingFactor}
              onChange={(e) => onUpdateSettings({ smoothingFactor: Number(e.target.value) })}
              className="w-full accent-emerald-500"
            />
            <p className="text-[11px] text-slate-500">
              Lower values produce smoother velocity curves; higher values yield faster instantaneous response.
            </p>
          </div>

          {/* Latency & Thermal Management */}
          <div className="space-y-3 bg-slate-850 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <Cpu className="w-4 h-4 text-amber-400" />
                Adaptive Latency Throttling
              </span>
              <input
                type="checkbox"
                checked={settings.adaptiveThrottling}
                onChange={(e) => onUpdateSettings({ adaptiveThrottling: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Automatically downsamples internal inference resolution if inference exceeds 35ms per frame to prevent mobile thermal throttling.
            </p>
          </div>

          {/* Recalibrate Shortcut */}
          <button
            onClick={() => {
              onClose();
              onOpenCalibration();
            }}
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
          >
            📐 Open Road Calibration (4 Points)
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
          Mobile CV Speedometer • PWA Ready
        </div>
      </div>
    </div>
  );
};
