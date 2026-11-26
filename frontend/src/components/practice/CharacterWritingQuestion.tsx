import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, Sparkles, BookOpen, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CharacterWritingProps {
  character: string;
  pinyin?: string;
  meaning?: string;
  strokeName?: string;
  strokes?: string[];
  instruction?: string;
  value?: any;
  onChange: (val: any) => void;
  readOnly?: boolean;
}

export const CharacterWritingQuestion: React.FC<CharacterWritingProps> = ({
  character,
  pinyin,
  meaning,
  strokeName,
  strokes,
  instruction,
  value,
  onChange,
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeCount, setStrokeCount] = useState<number>(() => {
    return value?.strokeCount || (value?.completed ? 1 : 0);
  });
  const [showCelebration, setShowCelebration] = useState(false);

  const isCompleted = (strokeCount > 0 && !!value?.completed) || !!value?.completed;

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Canvas background clean white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Border: #F3E8D6
    ctx.strokeStyle = '#F3E8D6';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, width, height);

    // Guideline 米字格: #E7D7BE
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#E7D7BE';
    ctx.lineWidth = 1.5;

    // Horizontal
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Vertical
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Diagonals
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawGrid(ctx, canvas.width, canvas.height);
  }, []);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    const mouseEvent = e as React.MouseEvent;
    return {
      x: (mouseEvent.clientX - rect.left) * scaleX,
      y: (mouseEvent.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // Dark ink color #1F2937 matching design system text
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const newCount = strokeCount + 1;
    setStrokeCount(newCount);
    onChange({ completed: true, strokeCount: newCount, drawnAt: Date.now() });
  };

  const handleMarkComplete = () => {
    if (strokeCount === 0) return;
    setShowCelebration(true);
    onChange({ completed: true, strokeCount, drawnAt: Date.now() });
    setTimeout(() => setShowCelebration(false), 2000);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawGrid(ctx, canvas.width, canvas.height);
    setStrokeCount(0);
    setShowCelebration(false);
    onChange({ completed: false, strokeCount: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Chữ mẫu bên trái - Canvas ở trung tâm */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-6 rounded-2xl bg-white border border-[#F3E8D6] shadow-sm">
        {/* Chữ mẫu bên trái: Kích thước 84-96px, nền #FFF7E6, border #F59E0B30 */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#FFF7E6] border border-[#F59E0B]/30 w-full md:w-60 text-center shadow-sm">
          <span className="text-xs text-[#D97706] font-bold tracking-wider uppercase mb-1">
            CHỮ MẪU
          </span>
          <div className="text-[84px] leading-tight font-chinese font-bold text-[#1F2937] my-1 select-none drop-shadow-sm">
            {character}
          </div>
          {pinyin && (
            <div className="text-base font-bold text-[#D97706] mt-1">{pinyin}</div>
          )}
          {meaning && (
            <div className="text-xs text-[#6B7280] font-medium mt-1">{meaning}</div>
          )}
          {strokeName && (
            <div className="text-xs text-[#22C55E] font-semibold mt-3 px-3 py-1 bg-[#ECFDF5] border border-[#22C55E]/30 rounded-lg">
              Nét chính: {strokeName}
            </div>
          )}
        </div>

        {/* Canvas ở trung tâm */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative rounded-2xl overflow-hidden shadow-sm bg-white border border-[#F3E8D6]">
            <canvas
              ref={canvasRef}
              width={260}
              height={260}
              className="cursor-crosshair touch-none block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />

            {/* Animation hoàn thành (Success celebration overlay) */}
            <AnimatePresence>
              {showCelebration && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-[#22C55E]/15 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 pointer-events-none"
                >
                  <motion.div
                    initial={{ rotate: -20, scale: 0.5 }}
                    animate={{ rotate: 0, scale: 1.1 }}
                    className="w-12 h-12 rounded-full bg-[#22C55E] text-white flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="w-6 h-6" />
                  </motion.div>
                  <span className="text-sm font-bold text-[#22C55E] bg-white/95 px-3 py-1 rounded-full shadow-sm border border-[#22C55E]/30">
                    Xuất sắc! Đã hoàn thành
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Canvas Controls & Statuses: Tối ưu footer giảm khoảng trắng */}
          {!readOnly && (
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF7F2] hover:bg-[#F3E8D6] text-[#1F2937] transition-all border border-[#F3E8D6]"
                  title="Xóa để viết lại"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Viết lại
                </button>

                {/* Chỉ hiển thị trạng thái Đã hoàn thành sau khi user thực sự viết */}
                {strokeCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkComplete}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                      isCompleted
                        ? 'bg-[#ECFDF5] text-[#22C55E] border border-[#22C55E]/40 hover:bg-[#D1FAE5]'
                        : 'bg-[#F59E0B] text-white hover:bg-[#D97706]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isCompleted ? 'Đã hoàn thành' : 'Xác nhận hoàn thành'}
                  </button>
                )}
              </div>

              {/* Trạng thái chi tiết: Đã lưu nét viết & Hoàn thành bước viết */}
              <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                {strokeCount > 0 ? (
                  <>
                    <span className="inline-flex items-center gap-1 font-medium text-[#22C55E]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] inline-block animate-pulse" />
                      Đã lưu {strokeCount} nét viết
                    </span>
                    {isCompleted && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-[#D97706]">
                          Hoàn thành bước viết
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[#6B7280]">
                    <PenTool className="w-3 h-3 text-[#F59E0B]" />
                    Đặt bút hoặc chạm để tập viết
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Khu vực hướng dẫn chi tiết cách viết chữ (Bên dưới) */}
      <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#F3E8D6] space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#F59E0B]" />
          <h4 className="text-sm font-bold text-[#1F2937]">Hướng dẫn chi tiết cách viết</h4>
        </div>

        <p className="text-xs text-[#6B7280] leading-relaxed">
          {instruction ||
            'Tập viết chữ Hán trên ô mễ tự cách (米字格). Tuân thủ quy tắc bút thuận: từ trên xuống dưới, từ trái sang phải, ngang trước sổ sau, phẩy trước mác sau, ngoài trước trong sau.'}
        </p>

        {strokes && strokes.length > 0 && (
          <div className="pt-2 border-t border-[#F3E8D6]">
            <span className="text-xs font-semibold text-[#1F2937] block mb-2">
              Thứ tự các nét từng bước ({strokes.length} nét):
            </span>
            <div className="flex items-center gap-2.5 flex-wrap">
              {strokes.map((stk, sIdx) => (
                <div
                  key={sIdx}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#F3E8D6] shadow-sm"
                >
                  <span className="text-[11px] font-bold text-[#D97706] w-4 text-center">
                    {sIdx + 1}.
                  </span>
                  <span className="font-chinese text-base text-[#1F2937] font-bold">
                    {stk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
