import React, { useState, useRef, useEffect, useMemo, useId } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Undo2,
  Eye,
  EyeOff,
  Volume2,
  CheckCircle2,
  PenTool,
  ArrowRight,
} from 'lucide-react';
import { appNotice } from '../lib/dialog';
import {
  extractHanziChars,
  fetchHanziStrokeData,
  FALLBACK_SIMPLE_STROKES,
  medianToSvgPath,
  MakeMeAHanziData,
} from './hanziStrokes.data';
import { LANDING_HANZI_STROKE_DATA } from './landing/landingHanziStrokes.data';

interface HanziCanvasProps {
  character: string;
  pinyin: string;
  meaning: string;
  sinoVietnamese?: string;
  strokesCount?: number;
  strokeOrderSvg?: string | null;
  audioUrl?: string | null;
  isAlreadyCompleted?: boolean;
  onPracticeComplete?: (drawnStrokes: number) => void;
  onNextCharacter?: () => void;
}

interface Point {
  x: number;
  y: number;
}

function pointsToSmoothPath(pts: Point[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) {
    return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${(pts[0].x + 1).toFixed(1)} ${(pts[0].y + 1).toFixed(1)}`;
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
}

export const HanziCanvas: React.FC<HanziCanvasProps> = ({
  character,
  pinyin,
  meaning,
  sinoVietnamese,
  strokesCount,
  strokeOrderSvg,
  audioUrl,
  isAlreadyCompleted = false,
  onPracticeComplete,
  onNextCharacter,
}) => {
  const uid = useId().replace(/:/g, '');
  const hanziList = useMemo(() => extractHanziChars(character), [character]);
  const [subCharIdx, setSubCharIdx] = useState<number>(0);
  const [doneSubChars, setDoneSubChars] = useState<Record<number, boolean>>({});
  const activeSingleChar = hanziList[subCharIdx] || hanziList[0] || character;

  // Unified board state: stroke guide + animated demo + direct SVG calligraphy brush
  const [richData, setRichData] = useState<MakeMeAHanziData | null>(
    () => LANDING_HANZI_STROKE_DATA[activeSingleChar] || null
  );
  const [isLoadingStrokes, setIsLoadingStrokes] = useState<boolean>(false);
  const [showOrder, setShowOrder] = useState<boolean>(true);

  // Demo / single-stroke preview animation state
  const [isPlayingDemo, setIsPlayingDemo] = useState<boolean>(false);
  const [demoStrokeIdx, setDemoStrokeIdx] = useState<number>(-1);
  const [previewStrokeIdx, setPreviewStrokeIdx] = useState<number | null>(null);

  // User drawn strokes (SVG 1024x1024 space, strictly capped at targetStrokes)
  const [drawnPaths, setDrawnPaths] = useState<Point[][]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [justCompleted, setJustCompleted] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);
  const pointsBufferRef = useRef<Point[]>([]);
  const travelDistanceRef = useRef<number>(0);

  // Offline simple SVG paths fallback (viewBox 0..100)
  const fallbackSimplePaths = useMemo<string[]>(() => {
    if (hanziList.length === 1 && strokeOrderSvg) {
      try {
        const parsed = JSON.parse(strokeOrderSvg);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Fall through
      }
    }
    return FALLBACK_SIMPLE_STROKES[activeSingleChar] || [];
  }, [hanziList.length, strokeOrderSvg, activeSingleChar]);

  const medianPaths = useMemo<string[]>(() => {
    if (!richData) return [];
    return richData.strokes.map((_, idx) => medianToSvgPath(richData.medians[idx] || []));
  }, [richData]);

  // Compute stroke start badge coordinates in SVG 0..1024 space (y_svg = 900 - y_raw)
  const strokeOrderMarkers = useMemo(() => {
    if (!richData) return [];
    return richData.medians.map((med, idx) => {
      const start = med[0] || [512, 450];
      return {
        idx,
        startX: start[0],
        startY: 900 - start[1],
        medianPath: medianToSvgPath(med),
      };
    });
  }, [richData]);

  const totalAnimatableStrokes = richData ? richData.strokes.length : fallbackSimplePaths.length;
  const targetStrokes = richData
    ? richData.strokes.length
    : fallbackSimplePaths.length > 0
      ? fallbackSimplePaths.length
      : strokesCount || 6;

  const completedCount = drawnPaths.length;
  const isLimitReached = completedCount >= targetStrokes;
  const isInspectingStroke = isPlayingDemo || previewStrokeIdx !== null;
  const activeAnimIdx = isPlayingDemo ? demoStrokeIdx : previewStrokeIdx ?? -1;

  // Reset sub-character selection when parent word changes
  useEffect(() => {
    setSubCharIdx(0);
    setDoneSubChars({});
    setJustCompleted(false);
  }, [character]);

  // Fetch full MakeMeAHanzi calligraphic stroke data
  useEffect(() => {
    const prebundled = LANDING_HANZI_STROKE_DATA[activeSingleChar];
    if (prebundled) {
      setRichData(prebundled);
      setIsLoadingStrokes(false);
      return;
    }

    let cancelled = false;
    setRichData(null);
    setIsLoadingStrokes(true);

    fetchHanziStrokeData(activeSingleChar).then((data) => {
      if (!cancelled) {
        setRichData(data);
        setIsLoadingStrokes(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeSingleChar]);

  // Reset board drawing & demo state when character / sub-character switches
  useEffect(() => {
    setDrawnPaths([]);
    setCurrentPoints([]);
    setIsPlayingDemo(false);
    setDemoStrokeIdx(-1);
    setPreviewStrokeIdx(null);
    isDrawingRef.current = false;
    activePointerIdRef.current = null;
    pointsBufferRef.current = [];
    travelDistanceRef.current = 0;
  }, [character, activeSingleChar]);

  // Mark sub-character done locally when user completes all strokes for it
  useEffect(() => {
    if (isLimitReached && targetStrokes > 0) {
      setDoneSubChars((prev) => (prev[subCharIdx] ? prev : { ...prev, [subCharIdx]: true }));
    }
  }, [isLimitReached, targetStrokes, subCharIdx]);

  // Sequential stroke-order demo driver
  useEffect(() => {
    if (!isPlayingDemo || totalAnimatableStrokes === 0) return;

    let timer: ReturnType<typeof setTimeout>;
    if (demoStrokeIdx < totalAnimatableStrokes - 1) {
      timer = setTimeout(
        () => {
          setDemoStrokeIdx((prev) => prev + 1);
        },
        demoStrokeIdx === -1 ? 80 : 680
      );
    } else {
      timer = setTimeout(() => {
        setIsPlayingDemo(false);
        setDemoStrokeIdx(-1);
      }, 900);
    }
    return () => clearTimeout(timer);
  }, [isPlayingDemo, demoStrokeIdx, totalAnimatableStrokes]);

  const handleTogglePlayDemo = () => {
    if (isPlayingDemo) {
      setIsPlayingDemo(false);
      setDemoStrokeIdx(-1);
      return;
    }
    if (totalAnimatableStrokes === 0) {
      appNotice('Đang tải dữ liệu nét vẽ của chữ này, vui lòng thử lại sau giây lát.', 'info');
      return;
    }
    setPreviewStrokeIdx(null);
    setDemoStrokeIdx(-1);
    setIsPlayingDemo(true);
  };

  const handlePreviewSingleStroke = (idx: number) => {
    setIsPlayingDemo(false);
    setDemoStrokeIdx(-1);
    setPreviewStrokeIdx((prev) => (prev === idx ? null : idx));
  };

  const handleClearStrokes = () => {
    setDrawnPaths([]);
    setCurrentPoints([]);
    setJustCompleted(false);
    setIsPlayingDemo(false);
    setDemoStrokeIdx(-1);
    setPreviewStrokeIdx(null);
  };

  const handleUndoStroke = () => {
    if (drawnPaths.length === 0) return;
    setDrawnPaths((prev) => prev.slice(0, -1));
    setJustCompleted(false);
  };

  const playPronunciation = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => speakWithTts());
    } else {
      speakWithTts();
    }
  };

  const speakWithTts = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(character);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Pointer coordinates mapped directly to SVG 0..1024 viewBox
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

    // Immediately exit demo/preview mode when user puts brush on paper
    if (isPlayingDemo || previewStrokeIdx !== null) {
      setIsPlayingDemo(false);
      setDemoStrokeIdx(-1);
      setPreviewStrokeIdx(null);
    }

    try {
      svgRef.current.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic event errors
    }

    activePointerIdRef.current = e.pointerId;
    isDrawingRef.current = true;
    setJustCompleted(false);
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
    // Require >= 14 units travel in 1024-space (allows crisp dot strokes while filtering accidental taps)
    if (buf.length >= 2 && travelDistanceRef.current >= 14) {
      setDrawnPaths((prev) => {
        if (prev.length >= targetStrokes) return prev;
        return [...prev, buf];
      });
    }

    pointsBufferRef.current = [];
    travelDistanceRef.current = 0;
    setCurrentPoints([]);
  };

  const handleConfirmComplete = () => {
    if (completedCount < 1) {
      appNotice('Hãy tập viết chữ lên ô trước khi bấm hoàn thành nhé.', 'info');
      return;
    }
    setJustCompleted(true);
    onPracticeComplete?.(completedCount);
  };

  const hasMoreSubChars = hanziList.length > 1 && subCharIdx < hanziList.length - 1;

  return (
    <div className="glass-light rounded-[28px] p-5 sm:p-6 flex flex-col items-center w-full">
      {/* Header Info: Pinyin + Audio + Hán-Việt + Meaning + Status */}
      <div className="w-full flex items-start sm:items-center justify-between border-b border-white/75 pb-4 mb-4 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-2xl font-pinyin font-bold text-[#C41E3A] dark:text-rose-400">
              {pinyin}
            </span>
            <button
              type="button"
              onClick={playPronunciation}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-[#C41E3A] text-[#C41E3A] hover:text-white border border-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
              title="Nghe phát âm"
              aria-label="Nghe phát âm"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            {(isAlreadyCompleted || justCompleted) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/85 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã luyện xong
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1 leading-snug">
            {sinoVietnamese && (
              <span className="font-semibold text-slate-800">[{sinoVietnamese}] </span>
            )}
            {meaning}
          </p>
        </div>

        <span className="text-xs bg-white/75 border border-white/90 text-slate-600 px-3 py-1 rounded-full font-semibold shrink-0 tabular-nums">
          {targetStrokes} nét viết
        </span>
      </div>

      {/* Multi-character splitter pills (e.g., 你好 -> [你] [好]) */}
      {hanziList.length > 1 && (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap justify-center">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Chọn từng chữ:</span>
          {hanziList.map((ch, idx) => {
            const active = idx === subCharIdx;
            const subDone = Boolean(doneSubChars[idx]);
            return (
              <button
                key={`${ch}-${idx}`}
                type="button"
                onClick={() => setSubCharIdx(idx)}
                className={`relative w-10 h-10 rounded-xl font-hanzi-serif text-lg font-bold transition-all cursor-pointer border ${
                  active
                    ? 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-sm shadow-[#C41E3A]/25'
                    : 'bg-white/75 hover:bg-white text-slate-700 border-white/90'
                }`}
              >
                {ch}
                {subDone && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#157A57] text-white flex items-center justify-center ring-2 ring-white">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Unified Walnut & Brushed-Brass Framed Xuan-Paper TianZiGe Calligraphy Board */}
      <div className="relative w-[272px] h-[272px] sm:w-[320px] sm:h-[320px] p-[8px] sm:p-[10px] bg-[#3B2C25] rounded-[12px] shadow-[0_22px_48px_-20px_rgba(28,25,23,0.48)] select-none">
        {/* Inlaid Champagne-Brass Inner Collar */}
        <div className="w-full h-full p-[2.5px] bg-[#C29940] rounded-[5px]">
          {/* Matte Xuan-Paper Face */}
          <div className="relative w-full h-full bg-[#FCF9F4] rounded-[3px] overflow-hidden">
            {/* Top-left Pinyin & Top-right Live Stroke Counter inside Slab */}
            <div className="pointer-events-none absolute top-2.5 inset-x-3.5 z-20 flex items-center justify-between">
              <span className="font-pinyin text-[12px] sm:text-[13px] font-bold text-[#C41E3A]">
                {hanziList.length > 1 ? activeSingleChar : pinyin}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-sans text-[10px] sm:text-[11px] font-bold tabular-nums transition-colors ${
                  isLimitReached
                    ? 'bg-[#157A57] text-white shadow-xs'
                    : 'bg-[#1C1917]/8 text-[#1C1917]'
                }`}
              >
                {completedCount}/{targetStrokes} nét
              </span>
            </div>

            {/* Interactive SVG TianZiGe + Calligraphic Guides + Animated Demo + Smooth Brush Drawing */}
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
              {/* Clip paths for authentic MakeMeAHanzi brush flow animation */}
              {richData && (
                <defs>
                  {richData.strokes.map((strokePath, idx) => (
                    <clipPath key={`cp-${idx}`} id={`hc-${uid}-${idx}`}>
                      <path d={strokePath} />
                    </clipPath>
                  ))}
                </defs>
              )}

              {/* Outer Vermilion Square & Dashed TianZiGe Grid Lines */}
              <rect
                x="84"
                y="84"
                width="856"
                height="856"
                fill="none"
                stroke="rgba(196, 30, 58, 0.45)"
                strokeWidth="6"
              />
              <line
                x1="512"
                y1="84"
                x2="512"
                y2="940"
                stroke="rgba(196, 30, 58, 0.22)"
                strokeWidth="4"
                strokeDasharray="16 16"
              />
              <line
                x1="84"
                y1="512"
                x2="940"
                y2="512"
                stroke="rgba(196, 30, 58, 0.22)"
                strokeWidth="4"
                strokeDasharray="16 16"
              />
              <line
                x1="84"
                y1="84"
                x2="940"
                y2="940"
                stroke="rgba(28, 25, 23, 0.08)"
                strokeWidth="3"
                strokeDasharray="16 16"
              />
              <line
                x1="940"
                y1="84"
                x2="84"
                y2="940"
                stroke="rgba(28, 25, 23, 0.08)"
                strokeWidth="3"
                strokeDasharray="16 16"
              />

              {/* Layer 1: Character Outlines, Next-Stroke Highlight & Calligraphic Demo Playback */}
              {richData ? (
                <g transform="scale(1, -1) translate(0, -900)">
                  {/* Faint base outlines + contextual highlight */}
                  {richData.strokes.map((pathStr, idx) => {
                    const isDemoPast = isInspectingStroke && activeAnimIdx >= 0 && idx < activeAnimIdx;
                    const isNextTarget =
                      !isInspectingStroke && showOrder && idx === completedCount && !isLimitReached;
                    const isAlreadyDrawn = !isInspectingStroke && idx < completedCount;

                    const fill = isDemoPast
                      ? '#1C1917'
                      : isNextTarget
                        ? 'rgba(196, 30, 58, 0.23)'
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
                    !isInspectingStroke &&
                    !isLimitReached &&
                    strokeOrderMarkers[completedCount] && (
                      <path
                        d={strokeOrderMarkers[completedCount].medianPath}
                        fill="none"
                        stroke="#C41E3A"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray="22 18"
                        opacity="0.72"
                      />
                    )}

                  {/* Active Calligraphic Animated Stroke (crimson brush flowing inside exact contour) */}
                  {isInspectingStroke &&
                    activeAnimIdx >= 0 &&
                    activeAnimIdx < richData.strokes.length &&
                    (medianPaths[activeAnimIdx] ? (
                      <path
                        key={`anim-${activeSingleChar}-${activeAnimIdx}-${isPlayingDemo ? 'play' : 'step'}`}
                        d={medianPaths[activeAnimIdx]}
                        clipPath={`url(#hc-${uid}-${activeAnimIdx})`}
                        fill="none"
                        stroke="#C41E3A"
                        strokeWidth="150"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        pathLength={1}
                        strokeDasharray={1}
                        strokeDashoffset={1}
                        className="animate-hanzi-stroke"
                      />
                    ) : (
                      <path
                        key={`anim-fill-${activeAnimIdx}`}
                        d={richData.strokes[activeAnimIdx]}
                        fill="#C41E3A"
                      />
                    ))}
                </g>
              ) : fallbackSimplePaths.length > 0 ? (
                /* Offline simple fallback vector strokes scaled into 1024x1024 */
                <g transform="translate(112, 112) scale(8)">
                  {fallbackSimplePaths.map((path, idx) => {
                    const isDemoPast = isInspectingStroke && activeAnimIdx >= 0 && idx < activeAnimIdx;
                    const isCurrent = isInspectingStroke && idx === activeAnimIdx;
                    const isNextTarget =
                      !isInspectingStroke && showOrder && idx === completedCount && !isLimitReached;
                    return (
                      <path
                        key={`${activeSingleChar}-fb-${idx}-${isCurrent ? 'cur' : 'std'}`}
                        d={path}
                        fill="none"
                        stroke={
                          isCurrent
                            ? '#C41E3A'
                            : isDemoPast
                              ? '#1C1917'
                              : isNextTarget
                                ? 'rgba(196, 30, 58, 0.35)'
                                : 'rgba(28, 25, 23, 0.16)'
                        }
                        strokeWidth={isCurrent ? '7' : '5.5'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        pathLength={isCurrent ? 1 : undefined}
                        strokeDasharray={isCurrent ? 1 : undefined}
                        strokeDashoffset={isCurrent ? 1 : undefined}
                        className={isCurrent ? 'animate-hanzi-stroke' : 'transition-colors'}
                      />
                    );
                  })}
                </g>
              ) : (
                /* Fallback Khải thư ghost character while loading or when offline */
                <text
                  x="512"
                  y="565"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="rgba(28, 25, 23, 0.14)"
                  fontSize="640"
                  fontWeight="700"
                  className="font-hanzi-serif select-none pointer-events-none"
                >
                  {activeSingleChar}
                </text>
              )}

              {/* Layer 2: User's Drawn Calligraphic Brush Strokes (faded cleanly during demo playback) */}
              <g style={{ opacity: isInspectingStroke ? 0.15 : 1, transition: 'opacity 180ms ease' }}>
                {drawnPaths.map((pts, idx) => (
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

                {/* Active in-progress crimson brush stroke */}
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
              </g>

              {/* Layer 3: Numbered Stroke Start Badges (1..N) when "Thứ tự viết" is ON */}
              {showOrder &&
                !isInspectingStroke &&
                strokeOrderMarkers.map((m) => {
                  const isCurrentTarget = m.idx === completedCount && !isLimitReached;
                  const isDone = m.idx < completedCount;
                  return (
                    <g
                      key={`badge-${m.idx}`}
                      transform={`translate(${m.startX}, ${m.startY})`}
                      className="pointer-events-none"
                    >
                      <circle
                        r={isCurrentTarget ? 28 : 22}
                        fill={
                          isCurrentTarget ? '#C41E3A' : isDone ? '#157A57' : '#FFFFFF'
                        }
                        stroke={
                          isCurrentTarget || isDone ? '#FFFFFF' : '#C41E3A'
                        }
                        strokeWidth="4"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isCurrentTarget || isDone ? '#FFFFFF' : '#C41E3A'}
                        fontSize="23"
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
            <div className="pointer-events-none absolute bottom-2.5 right-3 w-5 h-5 sm:w-6 sm:h-6 bg-[#C41E3A] text-white font-hanzi-serif text-[10px] sm:text-xs font-bold flex items-center justify-center rounded-[2px] shadow-xs">
              笔
            </div>

            {/* Bottom-Left Live Status Pill inside Board */}
            {isInspectingStroke && activeAnimIdx >= 0 ? (
              <div className="pointer-events-none absolute bottom-2.5 left-3 z-20 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#C41E3A]/95 text-white text-[10px] sm:text-[11px] font-semibold shadow-xs">
                <Play className="w-3 h-3 fill-current" />
                <span>
                  Nét mẫu {activeAnimIdx + 1}/{totalAnimatableStrokes}
                </span>
              </div>
            ) : isLimitReached ? (
              <div className="pointer-events-none absolute bottom-2.5 left-3 right-11 z-20 px-2.5 py-0.5 rounded bg-[#157A57]/95 text-white text-[10px] sm:text-[11px] font-semibold inline-flex items-center gap-1.5 shadow-xs w-fit">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Hoàn thành đủ {targetStrokes} nét</span>
              </div>
            ) : (
              <div className="pointer-events-none absolute bottom-2.5 left-3 z-20 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/90 border border-[#1C1917]/12 text-[10px] sm:text-[11px] font-semibold text-[#57534E]">
                <PenTool className="w-3 h-3 text-[#C41E3A]" />
                <span>
                  Tô nét {completedCount + 1}/{targetStrokes}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Numbered Stroke Chips (click any chip 1..N to inspect that exact stroke!) */}
      {totalAnimatableStrokes > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 max-w-sm">
          {Array.from({ length: totalAnimatableStrokes }).map((_, idx) => {
            const isPreviewing = isInspectingStroke && idx === activeAnimIdx;
            const isNextToWrite = !isInspectingStroke && idx === completedCount && !isLimitReached;
            const isWritten = idx < completedCount;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePreviewSingleStroke(idx)}
                title={`Xem nét mẫu số ${idx + 1}`}
                className={`w-7 h-7 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                  isPreviewing
                    ? 'bg-[#C41E3A] text-white border-[#C41E3A] scale-105 shadow-sm shadow-[#C41E3A]/30'
                    : isWritten
                      ? 'bg-[#157A57] text-white border-[#157A57]'
                      : isNextToWrite
                        ? 'bg-[#C41E3A]/12 text-[#C41E3A] border-[#C41E3A]/45 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-400/50'
                        : 'bg-white/80 text-slate-600 border-white hover:border-[#C41E3A]/40 hover:text-[#C41E3A]'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* Tactile Calligraphy Action Toolbar (Guest + User unified controls) */}
      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleUndoStroke}
          disabled={completedCount === 0}
          className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-white/95 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-45 disabled:pointer-events-none"
          title="Xóa nét vừa vẽ"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Hoàn tác</span>
        </button>

        <button
          type="button"
          onClick={handleClearStrokes}
          disabled={completedCount === 0 && !isInspectingStroke}
          className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-[#C41E3A] text-slate-700 hover:text-white border border-white/95 hover:border-[#C41E3A] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-45 disabled:pointer-events-none"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Xóa nét</span>
        </button>

        <button
          type="button"
          onClick={() => setShowOrder((v) => !v)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            showOrder
              ? 'bg-[#1C1917] text-white border-[#1C1917] dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200'
              : 'bg-white/80 text-slate-700 border-white/95 hover:bg-white'
          }`}
        >
          {showOrder ? (
            <Eye className="w-3.5 h-3.5 text-[#FDE68A] dark:text-[#C41E3A]" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
          <span>Thứ tự viết</span>
        </button>

        <button
          type="button"
          onClick={handleTogglePlayDemo}
          disabled={isLoadingStrokes && totalAnimatableStrokes === 0}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
            isPlayingDemo
              ? 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-sm'
              : 'bg-white/85 hover:bg-rose-50/90 text-[#C41E3A] dark:text-rose-300 border-[#C41E3A]/35'
          }`}
        >
          {isPlayingDemo ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              <span>Dừng mẫu</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Xem mẫu</span>
            </>
          )}
        </button>
      </div>

      {/* Practice Completion & Progression Controls */}
      {(onPracticeComplete || onNextCharacter || hasMoreSubChars) && (
        <div className="mt-4 pt-3.5 border-t border-white/75 w-full flex flex-wrap items-center justify-center gap-2.5">
          {justCompleted ? (
            <>
              <button
                type="button"
                onClick={clearCanvasAndRetry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/80 hover:bg-white border border-white/95 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Viết lại chữ này</span>
              </button>

              {onNextCharacter && (
                <button
                  type="button"
                  onClick={onNextCharacter}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#C41E3A] hover:bg-[#A51730] text-white font-bold text-xs shadow-md shadow-[#C41E3A]/20 transition-colors cursor-pointer"
                >
                  <span>Sang chữ tiếp theo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : (
            <>
              {hasMoreSubChars && isLimitReached && (
                <button
                  type="button"
                  onClick={() => setSubCharIdx((idx) => idx + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D4A017] hover:bg-[#B8860B] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <span>Viết chữ tiếp: {hanziList[subCharIdx + 1]}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {onPracticeComplete && (
                <button
                  type="button"
                  onClick={handleConfirmComplete}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isLimitReached
                      ? 'bg-[#157A57] hover:bg-[#116145] text-white shadow-md shadow-[#157A57]/25'
                      : completedCount > 0
                        ? 'bg-[#157A57]/12 hover:bg-[#157A57] text-[#157A57] hover:text-white border border-[#157A57]/35 dark:text-emerald-300'
                        : 'bg-white/65 border border-white/90 text-slate-500 hover:bg-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {isLimitReached ? 'Lưu hoàn thành chữ này' : 'Hoàn thành chữ này'}
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  function clearCanvasAndRetry() {
    handleClearStrokes();
  }
};
