import React, { useState, useRef, useEffect, useMemo, useId } from 'react';
import { Play, RotateCcw, Volume2, CheckCircle2, PenTool, ArrowRight } from 'lucide-react';
import { appNotice } from '../lib/dialog';
import {
  extractHanziChars,
  fetchHanziStrokeData,
  FALLBACK_SIMPLE_STROKES,
  medianToSvgPath,
  MakeMeAHanziData,
} from './hanziStrokes.data';

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
  const activeSingleChar = hanziList[subCharIdx] || hanziList[0] || character;

  const [activeTab, setActiveTab] = useState<'svg' | 'canvas'>('svg');
  const [currentStrokeIdx, setCurrentStrokeIdx] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [drawnStrokes, setDrawnStrokes] = useState<number>(0);
  const [justCompleted, setJustCompleted] = useState<boolean>(false);

  // Full calligraphic MakeMeAHanzi stroke data for activeSingleChar
  const [richData, setRichData] = useState<MakeMeAHanziData | null>(null);
  const [isLoadingStrokes, setIsLoadingStrokes] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);
  const strokeDistanceRef = useRef<number>(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Parse DB-provided simple SVG paths (viewBox 0..100) or use built-in offline fallback
  const fallbackSimplePaths = useMemo<string[]>(() => {
    if (hanziList.length === 1 && strokeOrderSvg) {
      try {
        const parsed = JSON.parse(strokeOrderSvg);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fall through to built-in fallback
      }
    }
    return FALLBACK_SIMPLE_STROKES[activeSingleChar] || [];
  }, [hanziList.length, strokeOrderSvg, activeSingleChar]);

  const medianPaths = useMemo<string[]>(() => {
    if (!richData) return [];
    return richData.strokes.map((_, idx) => medianToSvgPath(richData.medians[idx] || []));
  }, [richData]);

  const totalAnimatableStrokes = richData ? richData.strokes.length : fallbackSimplePaths.length;
  const targetStrokes = richData
    ? richData.strokes.length
    : fallbackSimplePaths.length > 0
      ? fallbackSimplePaths.length
      : strokesCount || 6;

  // Reset sub-character selector when parent word changes
  useEffect(() => {
    setSubCharIdx(0);
  }, [character]);

  // Fetch full calligraphic stroke data for ANY Chinese character (works on local & VPS even when DB stroke_order_svg is null)
  useEffect(() => {
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

  const clearCanvasInternal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Automatically reset canvas drawing, stroke counter & animation whenever switching character or sub-character
  useEffect(() => {
    clearCanvasInternal();
    setDrawnStrokes(0);
    setJustCompleted(false);
    setIsPlaying(false);
    setCurrentStrokeIdx(-1);
    isDrawingRef.current = false;
    activePointerIdRef.current = null;
    lastPointRef.current = null;
    strokeDistanceRef.current = 0;
  }, [character, activeSingleChar]);

  // Stroke-by-stroke animation driver
  useEffect(() => {
    if (!isPlaying || totalAnimatableStrokes === 0) return;

    let timer: ReturnType<typeof setTimeout>;
    if (currentStrokeIdx < totalAnimatableStrokes - 1) {
      timer = setTimeout(
        () => {
          setCurrentStrokeIdx((prev) => prev + 1);
        },
        currentStrokeIdx === -1 ? 80 : 720
      );
    } else {
      timer = setTimeout(() => {
        setIsPlaying(false);
      }, 900);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStrokeIdx, totalAnimatableStrokes]);

  const handlePlayAnimation = () => {
    if (totalAnimatableStrokes === 0) {
      appNotice('Đang tải dữ liệu nét vẽ của chữ này, vui lòng thử lại sau giây lát.', 'info');
      return;
    }
    setCurrentStrokeIdx(-1);
    setIsPlaying(true);
  };

  const handleResetAnimation = () => {
    setIsPlaying(false);
    setCurrentStrokeIdx(-1);
  };

  const handleJumpToStroke = (idx: number) => {
    setIsPlaying(false);
    setCurrentStrokeIdx(idx);
  };

  const playPronunciation = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {
        speakWithTts();
      });
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

  // Unified Pointer Events (mouse + touch + stylus) with synchronous ref state & pointer capture
  const getPointerCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const pt = getPointerCoords(e);
    const canvas = canvasRef.current;
    if (!pt || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors on synthetic events
    }

    activePointerIdRef.current = e.pointerId;
    isDrawingRef.current = true;
    setJustCompleted(false);
    strokeDistanceRef.current = 0;
    lastPointRef.current = pt;

    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#e11d48';
    ctx.fillStyle = '#e11d48';

    // Paint initial ink dot so short dot-strokes (点) appear crisply immediately
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

    const pt = getPointerCoords(e);
    const canvas = canvasRef.current;
    if (!pt || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault();

    if (lastPointRef.current) {
      const dx = pt.x - lastPointRef.current.x;
      const dy = pt.y - lastPointRef.current.y;
      strokeDistanceRef.current += Math.hypot(dx, dy);

      ctx.lineWidth = 11;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#e11d48';
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
    lastPointRef.current = pt;
  };

  const finishStroke = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    if (e && activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

    if (e && canvasRef.current) {
      try {
        if (canvasRef.current.hasPointerCapture(e.pointerId)) {
          canvasRef.current.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }
    }

    isDrawingRef.current = false;
    activePointerIdRef.current = null;
    if (strokeDistanceRef.current >= 4) {
      setDrawnStrokes((prev) => prev + 1);
    }
    strokeDistanceRef.current = 0;
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    clearCanvasInternal();
    setDrawnStrokes(0);
    setJustCompleted(false);
  };

  const handleConfirmComplete = () => {
    if (drawnStrokes < 1) {
      appNotice('Hãy tập viết chữ lên ô trước khi bấm hoàn thành nhé.', 'info');
      return;
    }
    setJustCompleted(true);
    onPracticeComplete?.(drawnStrokes);
  };

  return (
    <div className="glass-light rounded-2xl p-6 flex flex-col items-center w-full">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between border-b border-zinc-100 pb-4 mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-2xl font-mono font-bold text-[#BE123C]">{pinyin}</span>
            <button
              type="button"
              onClick={playPronunciation}
              className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-900 text-zinc-700 hover:text-white border border-zinc-200 hover:border-zinc-900 transition-colors cursor-pointer"
              title="Nghe phát âm"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            {(isAlreadyCompleted || justCompleted) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã luyện xong
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-600 mt-0.5">
            {sinoVietnamese && <span className="font-semibold text-zinc-900">[{sinoVietnamese}] </span>}
            {meaning}
          </p>
        </div>

        <span className="text-xs bg-zinc-100 border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md font-mono font-medium shrink-0">
          {targetStrokes} nét
        </span>
      </div>

      {/* Multi-character splitter pills */}
      {hanziList.length > 1 && (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap justify-center">
          <span className="text-[11px] font-semibold text-zinc-500 mr-1">Chọn từng chữ:</span>
          {hanziList.map((ch, idx) => {
            const active = idx === subCharIdx;
            return (
              <button
                key={`${ch}-${idx}`}
                type="button"
                onClick={() => setSubCharIdx(idx)}
                className={`w-9 h-9 rounded-lg font-hanzi-serif text-lg font-bold transition-colors cursor-pointer border ${
                  active
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200'
                }`}
              >
                {ch}
              </button>
            );
          })}
        </div>
      )}

      {/* Mode Switcher */}
      <div className="flex items-center gap-1 mb-5 bg-zinc-100 border border-zinc-200/80 p-1 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('svg')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'svg'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600 hover:text-zinc-950'
          }`}
        >
          Xem thứ tự nét
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('canvas')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'canvas'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600 hover:text-zinc-950'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          Tự tập viết trên ô
        </button>
      </div>

      {/* Grid Box (田字格) */}
      <div
        className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-xl border-2 tianzige-grid flex items-center justify-center overflow-hidden transition-colors ${
          justCompleted
            ? 'border-emerald-500 bg-emerald-50/30'
            : 'border-zinc-300 bg-white'
        }`}
      >
        {activeTab === 'svg' ? (
          richData ? (
            /* Authentic MakeMeAHanzi Calligraphic Stroke Animation */
            <svg viewBox="0 0 1024 1024" className="w-full h-full p-3 pointer-events-none select-none">
              <defs>
                {richData.strokes.map((strokePath, idx) => (
                  <clipPath key={`cp-${idx}`} id={`hc-${uid}-${idx}`}>
                    <path d={strokePath} />
                  </clipPath>
                ))}
              </defs>
              <g transform="scale(1, -1) translate(0, -900)">
                {/* Base faint ghost strokes */}
                {richData.strokes.map((strokePath, idx) => (
                  <path key={`bg-${idx}`} d={strokePath} fill="#e2e8f0" />
                ))}

                {/* Completed strokes */}
                {richData.strokes.map((strokePath, idx) => {
                  const showSolid =
                    currentStrokeIdx === -1 ? !isPlaying : idx < currentStrokeIdx;
                  if (!showSolid) return null;
                  return <path key={`done-${idx}`} d={strokePath} fill="#334155" />;
                })}

                {/* Currently animating calligraphic stroke (crimson brush flow clipped inside contour) */}
                {currentStrokeIdx >= 0 && currentStrokeIdx < richData.strokes.length && (
                  medianPaths[currentStrokeIdx] ? (
                    <path
                      key={`anim-${activeSingleChar}-${currentStrokeIdx}`}
                      d={medianPaths[currentStrokeIdx]}
                      clipPath={`url(#hc-${uid}-${currentStrokeIdx})`}
                      fill="none"
                      stroke="#e11d48"
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
                      key={`anim-fill-${currentStrokeIdx}`}
                      d={richData.strokes[currentStrokeIdx]}
                      fill="#e11d48"
                    />
                  )
                )}
              </g>
            </svg>
          ) : fallbackSimplePaths.length > 0 ? (
            /* Offline fallback simple vector stroke order (viewBox 0..100) */
            <svg viewBox="0 0 100 100" className="w-full h-full p-4 pointer-events-none select-none">
              {fallbackSimplePaths.map((path, idx) => {
                const isDrawn =
                  currentStrokeIdx === -1 ? !isPlaying : idx < currentStrokeIdx;
                const isCurrent = idx === currentStrokeIdx;
                return (
                  <path
                    key={`${activeSingleChar}-fb-${idx}-${isCurrent ? 'cur' : 'std'}`}
                    d={path}
                    fill="none"
                    stroke={isCurrent ? '#e11d48' : isDrawn ? '#334155' : '#e2e8f0'}
                    strokeWidth={isCurrent ? '7' : '5'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={isCurrent ? 1 : undefined}
                    strokeDasharray={isCurrent ? 1 : undefined}
                    strokeDashoffset={isCurrent ? 1 : undefined}
                    className={isCurrent ? 'animate-hanzi-stroke' : 'transition-colors duration-200'}
                  />
                );
              })}
            </svg>
          ) : (
            <span className="text-8xl sm:text-9xl font-hanzi-serif font-bold text-slate-800 select-none text-center px-2">
              {activeSingleChar}
            </span>
          )
        ) : (
          <>
            {/* Background tracing watermark (matches exact calligraphic strokes when loaded) */}
            {richData ? (
              <svg
                viewBox="0 0 1024 1024"
                className="absolute inset-0 w-full h-full p-3 pointer-events-none select-none"
              >
                <g transform="scale(1, -1) translate(0, -900)">
                  {richData.strokes.map((strokePath, idx) => (
                    <path
                      key={`trace-${idx}`}
                      d={strokePath}
                      fill="rgba(148, 163, 184, 0.34)"
                    />
                  ))}
                </g>
              </svg>
            ) : (
              <span className="absolute text-8xl sm:text-9xl font-hanzi-serif font-bold text-slate-300/65 select-none pointer-events-none text-center px-2">
                {activeSingleChar}
              </span>
            )}
            <canvas
              ref={canvasRef}
              width={288}
              height={288}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishStroke}
              onPointerCancel={finishStroke}
              className="absolute inset-0 w-full h-full touch-none select-none z-10"
              style={{ cursor: 'crosshair', touchAction: 'none' }}
            />
          </>
        )}
      </div>

      {/* Interactive Stroke Step Pills in SVG mode */}
      {activeTab === 'svg' && totalAnimatableStrokes > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1 max-w-sm">
          {Array.from({ length: totalAnimatableStrokes }).map((_, idx) => {
            const isCur = idx === currentStrokeIdx;
            const isPast = currentStrokeIdx >= 0 && idx < currentStrokeIdx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleJumpToStroke(idx)}
                title={`Xem nét thứ ${idx + 1}`}
                className={`w-6 h-6 rounded-md text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                  isCur
                    ? 'bg-[#BE123C] text-white'
                    : isPast
                      ? 'bg-zinc-800 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* Live Stroke Progress Indicator on Canvas tab */}
      {activeTab === 'canvas' && (
        <div className="mt-3 text-xs font-medium text-zinc-600 flex items-center gap-2">
          {justCompleted ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Hoàn thành chữ “{activeSingleChar}” ({drawnStrokes} nét đã viết)!
            </span>
          ) : drawnStrokes === 0 ? (
            <span className="text-zinc-500">
              Dùng chuột hoặc tay tô theo nét chữ mờ trên ô ({targetStrokes} nét chuẩn)
            </span>
          ) : (
            <span>
              Đã viết:{' '}
              <strong className="text-[#BE123C] font-mono">
                {drawnStrokes} / {targetStrokes} nét
              </strong>
            </span>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
        {activeTab === 'svg' ? (
          <>
            <button
              type="button"
              onClick={handlePlayAnimation}
              disabled={isPlaying || (isLoadingStrokes && totalAnimatableStrokes === 0)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isPlaying
                ? `Đang viết nét ${Math.max(1, currentStrokeIdx + 1)}/${totalAnimatableStrokes}...`
                : 'Xem từng nét'}
            </button>
            <button
              type="button"
              onClick={handleResetAnimation}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Hiện tất cả
            </button>
          </>
        ) : justCompleted ? (
          <>
            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Viết lại chữ này
            </button>
            {onNextCharacter && (
              <button
                type="button"
                onClick={onNextCharacter}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <span>Sang chữ tiếp theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={clearCanvas}
              disabled={drawnStrokes === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold text-xs transition-colors disabled:opacity-40 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xóa nét vẽ
            </button>
            {onPracticeComplete && (
              <button
                type="button"
                onClick={handleConfirmComplete}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                  drawnStrokes > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-zinc-100 border border-zinc-200 text-zinc-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Hoàn thành chữ này
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
