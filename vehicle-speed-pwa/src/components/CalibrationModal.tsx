/**
 * 4-Point Homography Perspective Calibration Modal
 * 
 * Allows the user on mobile touchscreens or desktop mouse to set 4 quadrilateral
 * points on the road surface:
 * - P0: Top-Left (Far road edge)
 * - P1: Top-Right (Far road edge)
 * - P2: Bottom-Right (Near road edge)
 * - P3: Bottom-Left (Near road edge)
 * 
 * Features:
 * - Touch Magnifier / Loupe: Shows a 2x magnified circular view of the touch area
 *   so the user's finger does not obscure the road corner.
 * - Live Metric Grid Projection: Uses inverse Homography to draw a metric ground grid
 *   (1m x 5m) on the road surface so user can visually verify perspective correctness.
 * - Inputs for road width (e.g., 3.5m per lane) and segment length (e.g., 15m - 30m).
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Point2D, CalibrationData } from '../core/homography';
import { Homography } from '../core/homography';
import { Crosshair, Check, RotateCcw, HelpCircle, Move } from 'lucide-react';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CalibrationData) => void;
  initialCalibration: CalibrationData;
  canvasWidth: number;
  canvasHeight: number;
  previewImageSource?: HTMLVideoElement | HTMLCanvasElement | null;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCalibration,
  canvasWidth,
  canvasHeight,
  previewImageSource,
}) => {
  const [points, setPoints] = useState<[Point2D, Point2D, Point2D, Point2D]>(
    initialCalibration.imagePoints
  );
  const [roadWidth, setRoadWidth] = useState<number>(initialCalibration.roadWidthMeters);
  const [roadLength, setRoadLength] = useState<number>(initialCalibration.roadLengthMeters);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [magnifierPos, setMagnifierPos] = useState<Point2D | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync with initialCalibration when modal opens
  useEffect(() => {
    if (isOpen) {
      setPoints([...initialCalibration.imagePoints]);
      setRoadWidth(initialCalibration.roadWidthMeters);
      setRoadLength(initialCalibration.roadLengthMeters);
    }
  }, [isOpen, initialCalibration]);

  // Temporary Homography for live grid preview
  const liveHomography = useRef(new Homography());
  useEffect(() => {
    liveHomography.current.compute({
      imagePoints: points,
      roadWidthMeters: roadWidth,
      roadLengthMeters: roadLength,
    });
  }, [points, roadWidth, roadLength]);

  // Point colors for handles
  const pointColors = ['#38bdf8', '#818cf8', '#34d399', '#f43f5e'];

  /**
   * Render calibration canvas overlay with handles, trapezoid, and metric grid
   */
  const drawCalibration = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background snapshot if available
    if (previewImageSource) {
      ctx.drawImage(previewImageSource, 0, 0, canvas.width, canvas.height);
      // Slight dark overlay for contrast
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 1. Draw live metric road grid (inverse homography)
    if (liveHomography.current.isCalibrated()) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';

      // Longitudinal lines (along the road)
      const numLanes = 2;
      for (let l = 0; l <= numLanes; l++) {
        const xM = (l / numLanes) * roadWidth;
        const pStart = liveHomography.current.toPixel({ x: xM, y: 0 });
        const pEnd = liveHomography.current.toPixel({ x: xM, y: roadLength });
        if (pStart && pEnd) {
          ctx.beginPath();
          ctx.moveTo(pStart.x, pStart.y);
          ctx.lineTo(pEnd.x, pEnd.y);
          ctx.stroke();
        }
      }

      // Transverse lines (every 5 meters)
      for (let yM = 0; yM <= roadLength; yM += 5) {
        const pLeft = liveHomography.current.toPixel({ x: 0, y: yM });
        const pRight = liveHomography.current.toPixel({ x: roadWidth, y: yM });
        if (pLeft && pRight) {
          ctx.beginPath();
          ctx.moveTo(pLeft.x, pLeft.y);
          ctx.lineTo(pRight.x, pRight.y);
          ctx.stroke();

          // Draw meter label
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '10px monospace';
          ctx.fillText(`${yM}m`, pLeft.x + 4, pLeft.y - 2);
        }
      }
    }

    // 2. Draw calibration quadrilateral outline
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.lineTo(points[3].x, points[3].y);
    ctx.closePath();

    ctx.fillStyle = 'rgba(59, 130, 246, 0.18)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#38bdf8';
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw 4 corner handles
    points.forEach((pt, idx) => {
      const isSelected = activePointIndex === idx;
      const radius = isSelected ? 18 : 14;

      // Outer touch target ring
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = pointColors[idx];
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Inner center dot
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      const labelText = `P${idx}`;
      ctx.fillText(labelText, pt.x - 7, pt.y - radius - 4);
    });

    // 4. Draw Touch Magnifier / Loupe if dragging
    if (activePointIndex !== null && magnifierPos && previewImageSource) {
      const activePt = points[activePointIndex];
      const loupeRadius = 45;
      const loupeZoom = 2.2;

      // Position loupe above the finger so it's clearly visible
      const loupeX = Math.max(
        loupeRadius + 10,
        Math.min(canvas.width - loupeRadius - 10, activePt.x)
      );
      const loupeY = Math.max(loupeRadius + 10, activePt.y - 80);

      ctx.save();
      ctx.beginPath();
      ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
      ctx.clip();

      // Draw zoomed source
      ctx.drawImage(
        previewImageSource,
        activePt.x - loupeRadius / loupeZoom,
        activePt.y - loupeRadius / loupeZoom,
        (loupeRadius * 2) / loupeZoom,
        (loupeRadius * 2) / loupeZoom,
        loupeX - loupeRadius,
        loupeY - loupeRadius,
        loupeRadius * 2,
        loupeRadius * 2
      );

      // Loupe crosshair
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(loupeX - 10, loupeY);
      ctx.lineTo(loupeX + 10, loupeY);
      ctx.moveTo(loupeX, loupeY - 10);
      ctx.lineTo(loupeX, loupeY + 10);
      ctx.stroke();

      ctx.restore();

      // Loupe circular border
      ctx.beginPath();
      ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
  }, [
    points,
    activePointIndex,
    magnifierPos,
    previewImageSource,
    roadWidth,
    roadLength,
  ]);

  useEffect(() => {
    drawCalibration();
  }, [drawCalibration]);

  // Touch and Mouse handlers for dragging points
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find closest point within touch radius (35px)
    let closestIdx: number | null = null;
    let minDist = 40;

    points.forEach((pt, idx) => {
      const d = Math.hypot(pt.x - clickX, pt.y - clickY);
      if (d < minDist) {
        minDist = d;
        closestIdx = idx;
      }
    });

    if (closestIdx !== null) {
      setActivePointIndex(closestIdx);
      setMagnifierPos({ x: clickX, y: clickY });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointIndex === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const currentX = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
    const currentY = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY));

    setMagnifierPos({ x: currentX, y: currentY });

    setPoints((prev) => {
      const next = [...prev] as [Point2D, Point2D, Point2D, Point2D];
      next[activePointIndex] = { x: Math.round(currentX), y: Math.round(currentY) };
      return next;
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointIndex !== null) {
      setActivePointIndex(null);
      setMagnifierPos(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleReset = () => {
    // Default trapezoid covering center of view
    const w = canvasWidth;
    const h = canvasHeight;
    const defaultPoints: [Point2D, Point2D, Point2D, Point2D] = [
      { x: Math.round(w * 0.35), y: Math.round(h * 0.45) },
      { x: Math.round(w * 0.65), y: Math.round(h * 0.45) },
      { x: Math.round(w * 0.85), y: Math.round(h * 0.88) },
      { x: Math.round(w * 0.15), y: Math.round(h * 0.88) },
    ];
    setPoints(defaultPoints);
    setRoadWidth(3.5);
    setRoadLength(20.0);
  };

  const handleSave = () => {
    onSave({
      imagePoints: points,
      roadWidthMeters: roadWidth,
      roadLengthMeters: roadLength,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-semibold">Homography Calibration (4-Point DLT)</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            title="Reset Trapezoid"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm rounded-lg shadow-md transition"
          >
            <Check className="w-4 h-4" />
            Apply
          </button>
        </div>
      </header>

      {/* Help Banner */}
      {showHelp && (
        <div className="px-4 py-2 bg-sky-950/80 border-b border-sky-800 text-xs text-sky-200">
          <p className="font-semibold mb-1">How to calibrate:</p>
          <p>
            1. Drag the 4 corner handles onto the road surface to outline a known rectangle (e.g.,
            lane boundaries or road markers).
          </p>
          <p>2. Enter the actual real-world width and length of that road section in meters below.</p>
          <p>
            3. Verify that the projected blue grid lines appear rectangular and parallel on the road!
          </p>
        </div>
      )}

      {/* Interactive Calibration Canvas */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="max-w-full max-h-full object-contain cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* Drag Hint overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 text-xs flex items-center gap-2 text-slate-300">
          <Move className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          Drag handles to align with road edges
        </div>
      </div>

      {/* Ground Truth Metric Dimensions Input Bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Road Width (P0-P1, meters)
          </label>
          <div className="flex items-center bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-700 focus-within:border-sky-500">
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="20.0"
              value={roadWidth}
              onChange={(e) => setRoadWidth(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
              className="w-full bg-transparent text-sm font-semibold outline-none text-white"
            />
            <span className="text-xs text-slate-400 ml-1">m</span>
          </div>
          <span className="text-[10px] text-slate-500">Standard lane width is 3.5m</span>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Segment Length (P0-P3, meters)
          </label>
          <div className="flex items-center bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-700 focus-within:border-sky-500">
            <input
              type="number"
              step="0.5"
              min="3.0"
              max="100.0"
              value={roadLength}
              onChange={(e) => setRoadLength(Math.max(1.0, parseFloat(e.target.value) || 1.0))}
              className="w-full bg-transparent text-sm font-semibold outline-none text-white"
            />
            <span className="text-xs text-slate-400 ml-1">m</span>
          </div>
          <span className="text-[10px] text-slate-500">Distance between markers (~15-30m)</span>
        </div>
      </div>
    </div>
  );
};
