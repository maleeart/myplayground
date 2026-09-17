/**
 * Detection History & Traffic Speed Log Drawer
 * 
 * Records and displays vehicles captured during the session with:
 * - Visual photo snapshot thumbnail of the vehicle
 * - Peak and average speeds
 * - Timestamps and violation badges
 * - Traffic analytics summary and CSV export
 */

import React from 'react';
import { X, Trash2, Download, Car, Truck, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';

export interface DetectionRecord {
  id: string;
  trackId: number;
  vehicleClass: string;
  timestamp: string;
  peakSpeedKmh: number;
  avgSpeedKmh: number;
  distanceMeters: number;
  isOverLimit: boolean;
  snapshotUrl?: string; // base64 image thumbnail
}

interface DetectionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  records: DetectionRecord[];
  onClear: () => void;
  speedLimitKmh: number;
}

export const DetectionHistoryDrawer: React.FC<DetectionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  records,
  onClear,
  speedLimitKmh,
}) => {
  if (!isOpen) return null;

  const totalCount = records.length;
  const overspeedCount = records.filter((r) => r.isOverLimit).length;
  const maxSpeed = totalCount > 0 ? Math.max(...records.map((r) => r.peakSpeedKmh)) : 0;
  const avgTrafficSpeed =
    totalCount > 0
      ? Math.round((records.reduce((acc, r) => acc + r.peakSpeedKmh, 0) / totalCount) * 10) / 10
      : 0;

  const exportCSV = () => {
    if (records.length === 0) return;
    const headers = ['ID', 'Vehicle Class', 'Time', 'Peak Speed (km/h)', 'Avg Speed (km/h)', 'Distance (m)', 'Overspeed'];
    const rows = records.map((r) => [
      r.trackId,
      r.vehicleClass,
      r.timestamp,
      r.peakSpeedKmh,
      r.avgSpeedKmh,
      r.distanceMeters,
      r.isOverLimit ? 'YES' : 'NO',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `traffic_speed_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getIcon = (vClass: string) => {
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm select-none">
      <div className="w-full max-h-[85vh] bg-slate-900 border-t border-slate-800 text-white flex flex-col rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-400 animate-pulse" />
            <h2 className="text-base font-bold">📋 บันทึกประวัติการตรวจจับ (Detection Log)</h2>
            <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full font-mono text-slate-300">
              {totalCount} คัน
            </span>
          </div>

          <div className="flex items-center gap-2">
            {totalCount > 0 && (
              <>
                <button
                  onClick={exportCSV}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg border border-slate-700 transition"
                  title="Export CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={onClear}
                  className="p-2 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-lg border border-slate-700 transition"
                  title="Clear Log"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Traffic Statistics Summary Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/60 border-b border-slate-800/80 text-center">
          <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">ความเร็วเฉลี่ย</span>
            <span className="text-base font-black font-mono text-sky-300">
              {avgTrafficSpeed} <span className="text-[10px] font-normal text-slate-400">km/h</span>
            </span>
          </div>
          <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">ความเร็วสูงสุด</span>
            <span className="text-base font-black font-mono text-amber-300">
              {maxSpeed} <span className="text-[10px] font-normal text-slate-400">km/h</span>
            </span>
          </div>
          <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">ขับเร็วเกินกำหนด</span>
            <span className="text-base font-black font-mono text-rose-400">
              {overspeedCount} <span className="text-[10px] font-normal text-slate-400">คัน</span>
            </span>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {records.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Car className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
              <p className="text-sm font-medium">ยังไม่มีข้อมูลยานพาหนะที่ตรวจจับได้</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                เมื่อมีรถวิ่งผ่านเลนกล้อง ระบบจะทำการตรวจจับ บันทึกภาพ Snapshot และวัดความเร็วลงในบันทึกนี้ให้อัตโนมัติ
              </p>
            </div>
          ) : (
            records.map((rec) => (
              <div
                key={rec.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border backdrop-blur-md transition shadow-md ${
                  rec.isOverLimit
                    ? 'bg-rose-950/30 border-rose-800/60'
                    : 'bg-slate-850/80 border-slate-800'
                }`}
              >
                {/* Vehicle Snapshot or Icon */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0">
                  {rec.snapshotUrl ? (
                    <img
                      src={rec.snapshotUrl}
                      alt={rec.vehicleClass}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getIcon(rec.vehicleClass)
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 capitalize">
                      {rec.vehicleClass}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">#{rec.trackId}</span>
                    <span className="text-[10px] text-slate-500 ml-auto">{rec.timestamp}</span>
                  </div>

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-black font-mono text-white">
                      {rec.peakSpeedKmh} <span className="text-xs font-normal text-slate-400">km/h</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (เฉลี่ย: {rec.avgSpeedKmh} km/h • {rec.distanceMeters}m)
                    </span>
                  </div>
                </div>

                {/* Over limit badge */}
                <div className="shrink-0 flex items-center">
                  {rec.isOverLimit ? (
                    <div className="flex items-center gap-1 bg-rose-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{Math.round(rec.peakSpeedKmh - speedLimitKmh)}+ km/h</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-medium px-2 py-1 rounded-lg">
                      <ShieldCheck className="w-3 h-3" />
                      <span>ปกติ</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
