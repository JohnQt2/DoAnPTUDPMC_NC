import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, AlertCircle } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHasError(false);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        setHasError(true);
      });
    }
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => setHasError(true));
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
    setIsLoading(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div
      className={`flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#F3E8D6] shadow-sm ${className}`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />

      {hasError ? (
        <div className="flex items-center gap-2 text-[#D97706] text-xs font-medium px-3 py-2 bg-[#FFF7E6] rounded-xl border border-[#F59E0B]/30">
          <AlertCircle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          <span>Âm thanh đang được cập nhật</span>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={togglePlay}
            disabled={isLoading}
            className="w-10 h-10 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold flex items-center justify-center transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title={isPlaying ? 'Tạm dừng' : 'Phát audio'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={handleReplay}
            className="w-9 h-9 rounded-xl bg-[#FAF7F2] hover:bg-[#F3E8D6] text-[#1F2937] border border-[#F3E8D6] flex items-center justify-center transition-all active:scale-95"
            title="Nghe lại từ đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex-1 flex flex-col justify-center gap-1 min-w-[120px]">
            <div className="flex justify-between items-center text-xs text-[#6B7280]">
              <span className="flex items-center gap-1 font-medium text-[#1F2937] truncate">
                <Volume2 className="w-3.5 h-3.5 text-[#F59E0B] inline" />
                {title || 'Audio bài nghe'}
              </span>
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="w-full bg-[#FAF7F2] border border-[#F3E8D6] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#F59E0B] h-full rounded-full transition-all duration-150"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
