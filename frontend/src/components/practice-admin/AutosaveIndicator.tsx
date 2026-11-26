import React from 'react';
import { RefreshCw, AlertCircle, Clock } from 'lucide-react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt?: Date | null;
  errorMessage?: string;
  onRetry?: () => void;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  status,
  lastSavedAt,
  errorMessage,
  onRetry,
}) => {
  if (status === 'saving') {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-amber-500 font-medium animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Đang lưu...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="inline-flex items-center gap-2 text-xs text-rose-500 font-medium">
        <div className="inline-flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorMessage || 'Lưu thất bại'}</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="underline hover:text-rose-600 font-bold cursor-pointer"
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  if (status === 'saved' && lastSavedAt) {
    const timeStr = lastSavedAt.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        <Clock className="w-3.5 h-3.5" />
        <span>Đã lưu lúc {timeStr}</span>
      </div>
    );
  }

  return null;
};
