import React from 'react';
import { Lock, Check, FileText, Target } from 'lucide-react';
import { goToInProgressLesson } from '../lib/resumeLesson';

export type PathNodeStatus = 'done' | 'current' | 'locked';

export interface PathNode {
  id: string | number;
  label: string;
  glyph: string;
  status: PathNodeStatus;
  onClick?: () => void;
  href?: string;
}

const ROW_H = 150;
const LEFT_X = 28; // %
const RIGHT_X = 72; // %

/** Winding learning path (zig-zag nodes connected by a dashed road). */
export const PathMap: React.FC<{
  title: string;
  nodes: PathNode[];
  onHeaderAction?: () => void;
}> = ({ title, nodes, onHeaderAction }) => {
  const height = Math.max(nodes.length, 1) * ROW_H + 40;
  const pos = (i: number) => ({ x: i % 2 === 0 ? LEFT_X : RIGHT_X, y: i * ROW_H + 70 });

  const roadPath = nodes
    .map((_, i) => {
      if (i === 0) return '';
      const a = pos(i - 1);
      const b = pos(i);
      const midY = (a.y + b.y) / 2;
      return `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
    })
    .join(' ');

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 px-5 py-3.5 rounded-2xl glass-light font-extrabold text-[#1C1917]">
          {title}
        </div>
        {onHeaderAction && (
          <button
            type="button"
            onClick={onHeaderAction}
            aria-label="Chi tiết"
            className="w-12 h-12 rounded-2xl glass-light flex items-center justify-center text-[#57534E] hover:text-[#C41E3A] cursor-pointer transition-colors"
          >
            <FileText className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Path canvas */}
      <div className="relative mx-auto w-full max-w-md" style={{ height }}>
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
        >
          <path
            d={roadPath}
            fill="none"
            className="stroke-[#E6DACB] dark:stroke-slate-700"
            strokeWidth="9"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={roadPath}
            fill="none"
            className="stroke-[#FCFBF8] dark:stroke-slate-500"
            strokeWidth="2"
            strokeDasharray="8 10"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {nodes.map((node, i) => {
          const p = pos(i);
          const isLocked = node.status === 'locked';
          const isCurrent = node.status === 'current';
          const isDone = node.status === 'done';

          const tile = (
            <div className="relative">
              {isCurrent && <span className="absolute -inset-2 rounded-[22px] border-2 border-[#D4A017]" />}
              <div
                className={`relative w-[72px] h-[72px] rounded-[18px] flex items-center justify-center font-hanzi-serif font-black text-3xl transition-transform ${
                  isLocked
                    ? 'bg-[#EFEAE2] text-[#78716C] border border-[#1C1917]/10'
                    : 'bg-[#C41E3A] text-white shadow-[0_6px_0_#8A1228] hover:-translate-y-0.5'
                }`}
              >
                <span className="absolute inset-[5px] rounded-[13px] border border-[#E6BE4C]/45" />
                {node.glyph}
              </div>
              {isLocked && (
                <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#57534E] text-white flex items-center justify-center border-2 border-[#FCFBF8]">
                  <Lock className="w-3.5 h-3.5" />
                </span>
              )}
              {isDone && (
                <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#157A57] text-white flex items-center justify-center border-2 border-[#FCFBF8]">
                  <Check className="w-4 h-4" />
                </span>
              )}
            </div>
          );

          return (
            <div
              key={node.id}
              className="absolute flex flex-col items-center gap-3 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${p.x}%`, top: p.y }}
            >
              {isLocked ? (
                <div className="cursor-not-allowed" title="Hoàn thành bài trước để mở khóa">{tile}</div>
              ) : node.href ? (
                <a href={node.href}>{tile}</a>
              ) : (
                <button type="button" onClick={node.onClick} className="cursor-pointer">
                  {tile}
                </button>
              )}

              {isCurrent && (
                <span
                  className={`absolute top-5 ${i % 2 === 0 ? 'left-full ml-4' : 'right-full mr-4'} whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#1C1917] text-white text-xs font-bold shadow-md`}
                >
                  Học tiếp
                </span>
              )}

              <span
                className={`max-w-[150px] truncate px-3 py-1 rounded-lg text-xs font-bold ${
                  isCurrent
                    ? 'bg-[#C41E3A] text-white'
                    : isLocked
                      ? 'bg-[#FCFBF8]/85 text-[#78716C] border border-[#1C1917]/10'
                      : 'bg-[#FCFBF8] text-[#A51730] border border-[#C41E3A]/20'
                }`}
              >
                {node.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Floating "Bài hôm nay" pill button — luôn trỏ về bài học viên đang học dở. */
export const TodayFloatingButton: React.FC<{
  fallbackLessonId?: number;
  label?: string;
}> = ({ fallbackLessonId, label = 'Bài hôm nay' }) => {
  const cls =
    'fixed bottom-6 left-1/2 lg:left-[calc(50%+var(--sidebar-offset,17.25rem)/2)] -translate-x-1/2 z-30 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#C41E3A] hover:bg-[#A51730] text-white font-bold text-sm shadow-lg shadow-[#C41E3A]/30 cursor-pointer transition-transform hover:-translate-y-0.5';
  return (
    <button
      type="button"
      onClick={() => {
        void goToInProgressLesson(fallbackLessonId);
      }}
      className={cls}
    >
      <Target className="w-4 h-4" />
      {label}
    </button>
  );
};

