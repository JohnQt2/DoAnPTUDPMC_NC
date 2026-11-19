import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, Volume2, CheckCircle2, PenTool, ArrowRight } from 'lucide-react';
import { appNotice } from '../lib/dialog';

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
  const [activeTab, setActiveTab] = useState<'svg' | 'canvas'>('svg');
  const [currentStrokeIdx, setCurrentStrokeIdx] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawnStrokes, setDrawnStrokes] = useState<number>(0);
  const [justCompleted, setJustCompleted] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokeDistanceRef = useRef<number>(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Parse SVG stroke paths if available
  let strokePaths: string[] = [];
  try {
    if (strokeOrderSvg) {
      strokePaths = JSON.parse(strokeOrderSvg);
    }
  } catch {
    strokePaths = [];
  }

  const clearCanvasInternal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // CRITICAL: Automatically reset canvas drawing, stroke counter & animation whenever switching character!
  useEffect(() => {
    clearCanvasInternal();
    setDrawnStrokes(0);
    setJustCompleted(false);
    setIsPlaying(false);
    setCurrentStrokeIdx(-1);
    setIsDrawing(false);
    lastPointRef.current = null;
    strokeDistanceRef.current = 0;
  }, [character]);

  // Animation controller for stroke order
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      if (currentStrokeIdx < strokePaths.length - 1) {
        timer = setTimeout(() => {
          setCurrentStrokeIdx((prev) => prev + 1);
        }, 760);
      } else {
        timer = setTimeout(() => {
          setIsPlaying(false);
          setCurrentStrokeIdx(strokePaths.length - 1);
        }, 900);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStrokeIdx, strokePaths.length]);

  const handlePlayAnimation = () => {
    setCurrentStrokeIdx(-1);
    setIsPlaying(true);
  };

  const handleResetAnimation = () => {
    setIsPlaying(false);
    setCurrentStrokeIdx(-1);
  };

  const playPronunciation = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {});
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(character);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const pt = getCoords(e);
    const canvas = canvasRef.current;
    if (!pt || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setJustCompleted(false);
    strokeDistanceRef.current = 0;
    lastPointRef.current = pt;

    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const pt = getCoords(e);
    const canvas = canvasRef.current;
    if (!pt || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (lastPointRef.current) {
      const dx = pt.x - lastPointRef.current.x;
      const dy = pt.y - lastPointRef.current.y;
      strokeDistanceRef.current += Math.hypot(dx, dy);
    }
    lastPointRef.current = pt;

    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#e11d48';
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (strokeDistanceRef.current >= 6) {
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

  const isMultiChar = character.length > 1;
  const targetStrokes = strokesCount || 6;

  return (
    <div className="glass-light rounded-[28px] p-6 flex flex-col items-center w-full">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between border-b border-white/75 pb-4 mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-2xl font-mono font-bold text-rose-600">{pinyin}</span>
            <button
              type="button"
              onClick={playPronunciation}
              className="p-2 rounded-full bg-white/75 hover:bg-rose-500 text-rose-500 hover:text-white border border-white transition-colors cursor-pointer"
              title="Nghe phát âm"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            {(isAlreadyCompleted || justCompleted) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/85 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã luyện xong
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            {sinoVietnamese && <span className="font-semibold text-slate-800">[{sinoVietnamese}] </span>}
            {meaning}
          </p>
        </div>

        <span className="text-xs bg-white/70 border border-white/85 text-slate-600 px-3 py-1 rounded-full font-medium shrink-0">
          {targetStrokes} nét viết
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-1.5 mb-5 bg-white/55 border border-white/85 p-1 rounded-full text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('svg')}
          className={`px-4 py-1.5 rounded-full transition-colors cursor-pointer ${
            activeTab === 'svg'
              ? 'bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Xem thứ tự nét
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('canvas')}
          className={`px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'canvas'
              ? 'bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          Tự tập viết trên ô
        </button>
      </div>

      {/* Grid Box (田字格) */}
      <div
        className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 tianzige-grid flex items-center justify-center overflow-hidden shadow-inner transition-colors ${
          justCompleted
            ? 'border-emerald-400 bg-emerald-50/35'
            : 'border-rose-200 bg-white/55'
        }`}
      >
        {activeTab === 'svg' ? (
          strokePaths.length > 0 ? (
            <svg viewBox="0 0 100 100" className="w-full h-full p-4 pointer-events-none">
              {strokePaths.map((path, idx) => {
                const isDrawn = currentStrokeIdx === -1 || idx <= currentStrokeIdx;
                const isCurrent = idx === currentStrokeIdx;
                return (
                  <path
                    key={idx}
                    d={path}
                    fill="none"
                    stroke={isCurrent ? '#e11d48' : isDrawn ? '#334155' : '#e2e8f0'}
                    strokeWidth={isCurrent ? '7' : '5'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
          ) : (
            <span
              className={`${
                isMultiChar ? 'text-6xl' : 'text-8xl sm:text-9xl'
              } font-hanzi-serif font-bold text-slate-800 select-none text-center px-2`}
            >
              {character}
            </span>
          )
        ) : (
          <>
            {/* Background watermark of the character */}
            <span
              className={`absolute ${
                isMultiChar ? 'text-6xl' : 'text-8xl sm:text-9xl'
              } font-hanzi-serif font-bold text-slate-300/65 select-none pointer-events-none text-center px-2`}
            >
              {character}
            </span>
            <canvas
              ref={canvasRef}
              width={288}
              height={288}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="absolute inset-0 w-full h-full touch-none"
              style={{ cursor: 'crosshair' }}
            />
          </>
        )}
      </div>

      {/* Live Stroke Progress Indicator on Canvas tab */}
      {activeTab === 'canvas' && (
        <div className="mt-3 text-xs font-semibold text-slate-600 flex items-center gap-2">
          {justCompleted ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Hoàn thành chữ “{character}” ({drawnStrokes} nét đã viết)!
            </span>
          ) : drawnStrokes === 0 ? (
            <span className="text-slate-500">
              Dùng chuột hoặc tay tô theo nét chữ mờ trên ô ({targetStrokes} nét chuẩn)
            </span>
          ) : (
            <span>
              Đã viết:{' '}
              <strong className="text-rose-600 font-mono">
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
              disabled={isPlaying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-400 text-white font-bold text-xs shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isPlaying ? 'Đang viết...' : 'Xem từng nét'}
            </button>
            <button
              type="button"
              onClick={handleResetAnimation}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/70 hover:bg-white border border-white/90 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/75 hover:bg-white border border-white/90 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Viết lại chữ này
            </button>
            {onNextCharacter && (
              <button
                type="button"
                onClick={onNextCharacter}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/75 hover:bg-white border border-white/90 text-slate-600 font-bold text-xs transition-colors disabled:opacity-40 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xóa nét vẽ
            </button>
            {onPracticeComplete && (
              <button
                type="button"
                onClick={handleConfirmComplete}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  drawnStrokes > 0
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                    : 'bg-white/60 border border-white/85 text-slate-400'
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
