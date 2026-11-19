import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, Volume2, CheckCircle2, PenTool } from 'lucide-react';

interface HanziCanvasProps {
  character: string;
  pinyin: string;
  meaning: string;
  sinoVietnamese?: string;
  strokesCount?: number;
  strokeOrderSvg?: string | null;
  audioUrl?: string | null;
  onPracticeComplete?: () => void;
}

export const HanziCanvas: React.FC<HanziCanvasProps> = ({
  character,
  pinyin,
  meaning,
  sinoVietnamese,
  strokesCount,
  strokeOrderSvg,
  audioUrl,
  onPracticeComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'svg' | 'canvas'>('svg');
  const [currentStrokeIdx, setCurrentStrokeIdx] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Parse SVG stroke paths if available
  let strokePaths: string[] = [];
  try {
    if (strokeOrderSvg) {
      strokePaths = JSON.parse(strokeOrderSvg);
    }
  } catch {
    strokePaths = [];
  }

  // Animation controller for stroke order
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      if (currentStrokeIdx < strokePaths.length - 1) {
        timer = setTimeout(() => {
          setCurrentStrokeIdx((prev) => prev + 1);
        }, 800);
      } else {
        timer = setTimeout(() => {
          setIsPlaying(false);
          setCurrentStrokeIdx(strokePaths.length - 1);
        }, 1000);
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
    } else {
      // SpeechSynthesis fallback
      const utterance = new SpeechSynthesisUtterance(character);
      utterance.lang = 'zh-CN';
      window.speechSynthesis?.speak(utterance);
    }
  };

  // Canvas drawing logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#C41E3A'; // Chinese Red brush
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-primary-600">{pinyin}</span>
            <button
              onClick={playPronunciation}
              className="p-1.5 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
              title="Nghe phát âm"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {sinoVietnamese && <span className="font-semibold text-gray-700">[{sinoVietnamese}] </span>}
            {meaning}
          </p>
        </div>

        {strokesCount && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
            {strokesCount} nét viết
          </span>
        )}
      </div>

      {/* Tabs: Animation or Drawing Canvas */}
      <div className="flex items-center gap-2 mb-4 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('svg')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'svg' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Hoạt ảnh Thứ tự nét
        </button>
        <button
          onClick={() => setActiveTab('canvas')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
            activeTab === 'canvas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          Tự luyện viết trên ô
        </button>
      </div>

      {/* Grid Box (田字格) */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 border-red-300 tianzige-grid flex items-center justify-center overflow-hidden bg-amber-50/20 shadow-inner">
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
                    stroke={isCurrent ? '#C41E3A' : isDrawn ? '#333333' : '#e5e7eb'}
                    strokeWidth={isCurrent ? '7' : '5'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
          ) : (
            <span className="text-8xl sm:text-9xl font-chinese font-black text-gray-800 select-none">
              {character}
            </span>
          )
        ) : (
          <>
            {/* Background watermark of the character */}
            <span className="absolute text-8xl sm:text-9xl font-chinese font-black text-gray-200 select-none pointer-events-none">
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
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            />
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mt-5">
        {activeTab === 'svg' ? (
          <>
            <button
              onClick={handlePlayAnimation}
              disabled={isPlaying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isPlaying ? 'Đang viết...' : 'Xem từng nét'}
            </button>
            <button
              onClick={handleResetAnimation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-xs transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Hiện tất cả
            </button>
          </>
        ) : (
          <>
            <button
              onClick={clearCanvas}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-xs transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xóa nét vẽ
            </button>
            {onPracticeComplete && (
              <button
                onClick={onPracticeComplete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-semibold text-xs transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã hoàn thành
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
