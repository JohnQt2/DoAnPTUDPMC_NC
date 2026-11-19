import React from 'react';

interface PitchVisualizerProps {
  tone: number; // 0, 1, 2, 3, 4
  contour?: string | null; // e.g. "55", "35", "214", "51"
  syllable?: string;
}

export const PitchVisualizer: React.FC<PitchVisualizerProps> = ({ tone, contour, syllable }) => {
  // Map Chao scale coordinates (x from 10 to 90, y from 10 (rank 5) to 90 (rank 1))
  const getTonePath = () => {
    switch (tone) {
      case 1: // 55: High level
        return 'M 15 20 L 85 20';
      case 2: // 35: High rising
        return 'M 15 55 Q 50 40 85 20';
      case 3: // 214: Low dipping
        return 'M 15 65 Q 45 88 85 38';
      case 4: // 51: Falling
        return 'M 15 20 L 85 88';
      default: // 0: Neutral / Light
        return 'M 45 55 A 4 4 0 1 1 55 55';
    }
  };

  const getToneDescription = () => {
    switch (tone) {
      case 1:
        return { name: 'Thanh 1 (Âm Bình)', chao: '55 - Cao bằng', color: 'text-blue-600', stroke: '#2563eb' };
      case 2:
        return { name: 'Thanh 2 (Dương Bình)', chao: '35 - Lướt lên cao', color: 'text-emerald-600', stroke: '#059669' };
      case 3:
        return { name: 'Thanh 3 (Thượng Thanh)', chao: '214 - Xuống thấp rồi chếch lên', color: 'text-amber-600', stroke: '#d97706' };
      case 4:
        return { name: 'Thanh 4 (Khứ Thanh)', chao: '51 - Rơi dứt khoát', color: 'text-red-600', stroke: '#dc2626' };
      default:
        return { name: 'Khinh thanh', chao: '0 - Ngắn nhẹ', color: 'text-gray-500', stroke: '#6b7280' };
    }
  };

  const info = getToneDescription();

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-2">
        <span className={`text-xs font-bold ${info.color}`}>{info.name}</span>
        <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
          {contour || info.chao}
        </span>
      </div>

      {/* Chao 5-scale coordinate grid */}
      <div className="relative w-full h-28 bg-gray-50/70 rounded-lg p-2 border border-gray-100 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* 5-scale horizontal guide lines */}
          {[20, 37, 54, 71, 88].map((y, idx) => (
            <g key={y}>
              <line x1="10" y1={y} x2="90" y2={y} stroke="#e5e7eb" strokeDasharray="2,2" strokeWidth="0.8" />
              <text x="4" y={y + 3} fontSize="7" fill="#9ca3af" textAnchor="middle" fontFamily="sans-serif">
                {5 - idx}
              </text>
            </g>
          ))}

          {/* F0 Pitch Curve */}
          <path
            d={getTonePath()}
            fill={tone === 0 ? info.stroke : 'none'}
            stroke={info.stroke}
            strokeWidth={tone === 0 ? '0' : '4.5'}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
      </div>

      {syllable && (
        <span className="text-xs font-semibold text-gray-700 mt-2">
          Âm mẫu: <span className="text-primary-600">{syllable}</span>
        </span>
      )}
    </div>
  );
};
