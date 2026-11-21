import React, { useState, useRef, useEffect, useMemo } from 'react';
import { RotateCcw, Eye, EyeOff, Play, Box, CheckCircle2, PenTool } from 'lucide-react';
import { LANDING_HANZI_STROKE_DATA } from './landingHanziStrokes.data';
import { fetchHanziStrokeData, MakeMeAHanziData, medianToSvgPath } from '../hanziStrokes.data';

interface InteractiveTianZiGeBoardProps {
  char: string;
  pinyin: string;
  strokes: number;
  onExitTo3D?: () => void;
  onSpeak?: () => void;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Interactive Walnut & Xuan-Paper TianZiGe Calligraphy Practice Board (Ảnh 3):
 * - Matches the exact visual framing of the 3D TianZiGe slab (#3B2C25 walnut, #C29940 brass inlay, #FCF9F4 Xuan paper)
 * - Strictly enforces stroke limit (`drawnStrokes.length < maxStrokes`): e.g. 5 strokes for 永, 4 for 中, 6 for 好, 8 for 学
 * - Once `drawnStrokes.length === maxStrokes`, locks canvas so no extra strokes can be scribbled
 * - "Hiện thứ tự viết" toggle: displays numbered stroke start badges (1..N) + directional median guide for current stroke
 * - "Xóa nét" button: clears all drawn strokes and unlocks canvas
 */
export const InteractiveTianZiGeBoard: React.FC<InteractiveTianZiGeBoardProps> = ({
  char,
  pinyin,
  strokes,
  onExitTo3D,
}) => {
  const [strokeData, setStrokeData] = useState<MakeMeAHanziData | null>(
    () => LANDING_HANZI_STROKE_DATA[char] || null
  );
  const [drawnStrokes, setDrawnStrokes] = useState<Point[][]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [showOrder, setShowOrder] = useState<boolean>(true);
  const [demoStrokeIdx, setDemoStrokeIdx] = useState<number>(-1);
  const [isPlayingDemo, setIsPlayingDemo] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);
  const pointsBufferRef = useRef<Point[]>([]);
  const travelDistanceRef = useRef<number>(0);

  // Load stroke data (instant 0ms for pre-bundled landing characters, async fallback for others)
  useEffect(() => {
    const pre = LANDING_HANZI_STROKE_DATA[char];
    if (pre) {
      setStrokeData(pre);
      return;
    }
    let cancelled = false;
    fetchHanziStrokeData(char).then((d) => {
      if (!cancelled && d) setStrokeData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [char]);

  // Reset drawn strokes & demo state when character changes
  useEffect(() => {
    setDrawnStrokes([]);
    setCurrentPoints([]);
    setIsPlayingDemo(false);
    setDemoStrokeIdx(-1);
    isDrawingRef.current = false;
    pointsBufferRef.current = [];
    travelDistanceRef.current = 0;
  }, [char]);

  const maxStrokes = strokeData?.strokes.length || strokes;
  const completedCount = drawnStrokes.length;
  const isLimitReached = completedCount >= maxStrokes;

  // Step-by-step stroke order playback demo
  useEffect(() => {
    if (!isPlayingDemo || !strokeData) return;
    const total = strokeData.strokes.length;
    let timer: ReturnType<typeof setTimeout>;
    if (demoStrokeIdx < total - 1) {
      timer = setTimeout(
        () => {
          setDemoStrokeIdx((p) => p + 1);
        },
        demoStrokeIdx === -1 ? 60 : 620
      );
    } else {
      timer = setTimeout(() => {
        setIsPlayingDemo(false);
        setDemoStrokeIdx(-1);
      }, 850);
    }
    return () => clearTimeout(timer);
  }, [isPlayingDemo, demoStrokeIdx, strokeData]);

  // Compute stroke start badge coordinates in SVG 0..1024 viewBox (after scale(1,-1) translate(0,-900): y_svg = 900 - y_raw)
  const strokeOrderMarkers = useMemo(() => {
    if (!strokeData) return [];
    return strokeData.medians.map((med, idx) => {
      const start = med[0] || [512, 450];
      const end = med[med.length - 1] || start;
      return {
        idx,
        startX: start[0],
        startY: 900 - start[1],
        endX: end[0],
        endY: 900 - end[1],
        medianPath: medianToSvgPath(med),
      };
    });
  }, [strokeData]);

  const getSvgCoords = (e: React.PointerEvent<SVGSVGElement>): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: ((e.clientX - rect.left) / rect.width) * 1024,
      y: ((e.clientY - rect.top) / rect.height) * 1024,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.stopPropagation();
    if (isLimitReached) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const pt = getSvgCoords(e);
    if (!pt || !svgRef.current) return;

    if (isPlayingDemo) {
      setIsPlayingDemo(false);
      setDemoStrokeIdx(-1);
    }

    try {
      svgRef.current.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic event errors
    }

    activePointerIdRef.current = e.pointerId;
    isDrawingRef.current = true;
    travelDistanceRef.current = 0;
    pointsBufferRef.current = [pt];
    setCurrentPoints([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current) return;
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

    const pt = getSvgCoords(e);
    if (!pt) return;

    const buf = pointsBufferRef.current;
    const last = buf[buf.length - 1];
    if (last) {
      const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
      if (dist < 4) return;
      travelDistanceRef.current += dist;
    }

    buf.push(pt);
    setCurrentPoints([...buf]);
  };

  const finishStroke = (e?: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current) return;
    if (e && activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) {
      return;
    }

    if (e && svgRef.current) {
      try {
        if (svgRef.current.hasPointerCapture(e.pointerId)) {
          svgRef.current.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }
    }

    isDrawingRef.current = false;
    activePointerIdRef.current = null;

    const buf = pointsBufferRef.current;
    // Accept stroke if user moved >= 14 units in 1024-space (prevents accidental 0px micro-clicks from consuming a stroke)
    if (buf.length >= 2 && travelDistanceRef.current >= 14) {
      setDrawnStrokes((prev) => {
        if (prev.length >= maxStrokes) return prev;
        return [...prev, buf];
      });
    }

    pointsBufferRef.current = [];
    travelDistanceRef.current = 0;
    setCurrentPoints([]);
  };

  const handleClearStrokes = () => {
    setDrawnStrokes([]);
    setCurrentPoints([]);
    setIsPlayingDemo(false);
    setDemoStrokeIdx(-1);
  };

  const handlePlayStrokeOrderDemo = () => {
    setIsPlayingDemo(true);
    setDemoStrokeIdx(-1);
  };

  const pointsToSmoothPath = (pts: Point[]): string => {
    if (pts.length === 0) return '';
    if (pts.length === 1) {
      return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 1} ${pts[0].y + 1}`;
    }
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = ((pts[i].x + pts[i + 1].x) / 2).toFixed(1);
      const midY = ((pts[i].y + pts[i + 1].y) / 2).toFixed(1);
      d += ` Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}, ${midX} ${midY}`;
    }
    const last = pts[pts.length - 1];
    d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
    return d;
  };

  return (
    <div className="no-chapter-swipe w-full max-w-[330px] sm:max-w-[365px] mx-auto flex flex-col items-center gap-2">
      {/* Walnut & Brushed-Brass Framed TianZiGe Slab (1:1 visual match with Ảnh 3) */}
      <div className="relative w-[225px] h-[225px] sm:w-[295px] sm:h-[295px] lg:w-[325px] lg:h-[325px] p-[7px] sm:p-[9px] bg-[#3B2C25] shadow-[0_22px_50px_-20px_rgba(28,25,23,0.42)] select-none">
        {/* Inlaid Champagne-Brass Inner Collar */}
        <div className="w-full h-full p-[2.5px] bg-[#C29940]">
          {/* Matte Xuan-Paper Face */}
          <div className="relative w-full h-full bg-[#FCF9F4] overflow-hidden">
            {/* Metadata Header inside TianZiGe Slab */}
            <div className="pointer-events-none absolute top-2.5 inset-x-3.5 z-20 flex items-center justify-between">
              <span className="font-mono text-[11px] sm:text-xs font-bold text-[#C41E3A]">
                {pinyin}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-mono text-[10px] sm:text-[11px] font-bold transition-colors ${
                  isLimitReached
                    ? 'bg-[#157A57] text-white'
                    : 'bg-[#1C1917]/8 text-[#1C1917]'
                }`}
              >
                {completedCount}/{maxStrokes} nét
              </span>
            </div>

            {/* Interactive SVG TianZiGe + Calligraphic Stroke Guides + Brush Canvas */}
            <svg
              ref={svgRef}
              viewBox="0 0 1024 1024"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishStroke}
              onPointerCancel={finishStroke}
              className={`w-full h-full touch-none ${
                isLimitReached ? 'cursor-not-allowed' : 'cursor-crosshair'
              }`}
            >
              {/* Outer Vermilion Square & Dashed TianZiGe Grid Lines */}
              <rect
                x="88"
                y="88"
                width="848"
                height="848"
                fill="none"
                stroke="rgba(196, 30, 58, 0.48)"
                strokeWidth="6"
              />
              <line
                x1="512"
                y1="88"
                x2="512"
                y2="936"
                stroke="rgba(196, 30, 58, 0.22)"
                strokeWidth="4"
                strokeDasharray="16 16"
              />
              <line
                x1="88"
                y1="512"
                x2="936"
                y2="512"
                stroke="rgba(196, 30, 58, 0.22)"
                strokeWidth="4"
                strokeDasharray="16 16"
              />
              <line
                x1="88"
                y1="88"
                x2="936"
                y2="936"
                stroke="rgba(28, 25, 23, 0.08)"
                strokeWidth="3"
                strokeDasharray="16 16"
              />
              <line
                x1="936"
                y1="88"
                x2="88"
                y2="936"
                stroke="rgba(28, 25, 23, 0.08)"
                strokeWidth="3"
                strokeDasharray="16 16"
              />

              {/* MakeMeAHanzi Calligraphic Character Outlines */}
              {strokeData && (
                <g transform="scale(1, -1) translate(0, -900)">
                  {strokeData.strokes.map((pathStr, idx) => {
                    const isDemoActive = isPlayingDemo && idx === demoStrokeIdx;
                    const isDemoDone = isPlayingDemo && idx < demoStrokeIdx;
                    const isNextTarget =
                      !isPlayingDemo && showOrder && idx === completedCount && !isLimitReached;
                    const isAlreadyDrawn = !isPlayingDemo && idx < completedCount;

                    const fill = isDemoActive
                      ? '#C41E3A'
                      : isDemoDone
                        ? '#1C1917'
                        : isNextTarget
                          ? 'rgba(196, 30, 58, 0.24)'
                          : isAlreadyDrawn
                            ? 'rgba(28, 25, 23, 0.14)'
                            : 'rgba(28, 25, 23, 0.12)';

                    return (
                      <path
                        key={`guide-${idx}`}
                        d={pathStr}
                        fill={fill}
                        stroke={isNextTarget ? 'rgba(196, 30, 58, 0.5)' : 'none'}
                        strokeWidth={isNextTarget ? 6 : 0}
                      />
                    );
                  })}

                  {/* Directional Dashed Median Guide for the NEXT stroke to write */}
                  {showOrder &&
                    !isPlayingDemo &&
                    !isLimitReached &&
                    strokeOrderMarkers[completedCount] && (
                      <path
                        d={strokeOrderMarkers[completedCount].medianPath}
                        fill="none"
                        stroke="#C41E3A"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray="22 18"
                        opacity="0.7"
                      />
                    )}
                </g>
              )}

              {/* User's Drawn Calligraphic Brush Strokes (Strictly Capped at maxStrokes!) */}
              {drawnStrokes.map((pts, idx) => (
                <path
                  key={`drawn-${idx}`}
                  d={pointsToSmoothPath(pts)}
                  fill="none"
                  stroke="#1C1917"
                  strokeWidth="54"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Active in-progress brush stroke */}
              {currentPoints.length > 0 && (
                <path
                  d={pointsToSmoothPath(currentPoints)}
                  fill="none"
                  stroke="#C41E3A"
                  strokeWidth="54"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Stroke Order Number Badges (1..N) when "Thứ tự viết" is ON */}
              {showOrder &&
                strokeOrderMarkers.map((m) => {
                  const isCurrentTarget = !isPlayingDemo && m.idx === completedCount;
                  const isDone = m.idx < completedCount;
                  return (
                    <g
                      key={`badge-${m.idx}`}
                      transform={`translate(${m.startX}, ${m.startY})`}
                      className="pointer-events-none"
                    >
                      <circle
                        r={isCurrentTarget ? 28 : 23}
                        fill={
                          isCurrentTarget
                            ? '#C41E3A'
                            : isDone
                              ? '#157A57'
                              : '#FFFFFF'
                        }
                        stroke={
                          isCurrentTarget
                            ? '#FFFFFF'
                            : isDone
                              ? '#FFFFFF'
                              : '#C41E3A'
                        }
                        strokeWidth="4"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isCurrentTarget || isDone ? '#FFFFFF' : '#C41E3A'}
                        fontSize="24"
                        fontWeight="800"
                        fontFamily='"JetBrains Mono", monospace'
                      >
                        {m.idx + 1}
                      </text>
                    </g>
                  );
                })}
            </svg>

            {/* Bottom-Right Red Scholar Seal Stamp (笔) */}
            <div className="pointer-events-none absolute bottom-3 right-3.5 w-5 h-5 sm:w-6 sm:h-6 bg-[#C41E3A] text-white font-hanzi-serif text-[10px] sm:text-xs font-bold flex items-center justify-center">
              笔
            </div>

            {/* Stroke Limit Reached Notice Banner inside bottom of board */}
            {isLimitReached && (
              <div className="pointer-events-none absolute bottom-2.5 left-3 right-11 z-20 px-2.5 py-1 rounded bg-[#157A57]/95 text-white text-[10px] sm:text-[11px] font-mono font-semibold flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Đủ {maxStrokes} nét · Bấm Xóa nét để viết lại</span>
              </div>
            )}

            {/* Next Stroke Prompt when not yet finished */}
            {!isLimitReached && (
              <div className="pointer-events-none absolute bottom-2.5 left-3.5 z-20 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/90 border border-[#1C1917]/12 text-[9.5px] sm:text-[10.5px] font-mono text-[#57534E]">
                <PenTool className="w-3 h-3 text-[#C41E3A]" />
                <span>Viết nét thứ {completedCount + 1}/{maxStrokes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tactile Calligraphy Action Toolbar: Xóa nét · Thứ tự viết · Xem mẫu · Xoay 3D */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={handleClearStrokes}
          disabled={completedCount === 0 && !isPlayingDemo}
          className="px-2.5 py-1.5 rounded-md bg-white hover:bg-[#C41E3A] text-[#1C1917] hover:text-white border border-[#1C1917]/20 text-[10.5px] sm:text-[11px] font-mono font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-45 disabled:pointer-events-none"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Xóa nét ({completedCount}/{maxStrokes})</span>
        </button>

        <button
          type="button"
          onClick={() => setShowOrder((v) => !v)}
          className={`px-2.5 py-1.5 rounded-md border text-[10.5px] sm:text-[11px] font-mono font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
            showOrder
              ? 'bg-[#1C1917] text-white border-[#1C1917]'
              : 'bg-white text-[#1C1917] border-[#1C1917]/20 hover:border-[#1C1917]'
          }`}
        >
          {showOrder ? <Eye className="w-3 h-3 text-[#FDE68A]" /> : <EyeOff className="w-3 h-3" />}
          <span>Thứ tự viết</span>
        </button>

        <button
          type="button"
          onClick={handlePlayStrokeOrderDemo}
          className="px-2.5 py-1.5 rounded-md bg-white hover:bg-[#FAF6F0] text-[#C41E3A] border border-[#C41E3A]/35 text-[10.5px] sm:text-[11px] font-mono font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Xem mẫu</span>
        </button>

        {onExitTo3D && (
          <button
            type="button"
            onClick={onExitTo3D}
            className="px-2.5 py-1.5 rounded-md bg-white/90 hover:bg-white text-[#57534E] hover:text-[#1C1917] border border-[#1C1917]/15 text-[10.5px] sm:text-[11px] font-mono font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Box className="w-3 h-3 text-[#C41E3A]" />
            <span>Xoay 3D</span>
          </button>
        )}
      </div>
    </div>
  );
};
