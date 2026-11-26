import React from 'react';
import { AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { PracticeValidationResult, PracticeValidationIssue } from '../../pages/admin/practice/practice-admin.types';

interface PublishValidationPanelProps {
  validation: PracticeValidationResult | null;
  isValidating: boolean;
  onSelectIssue?: (issue: PracticeValidationIssue) => void;
}

export const PublishValidationPanel: React.FC<PublishValidationPanelProps> = ({
  validation,
  isValidating,
  onSelectIssue,
}) => {
  if (isValidating) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 animate-pulse">
        Đang kiểm tra tính hợp lệ của nội dung...
      </div>
    );
  }

  if (!validation) return null;

  if (validation.valid && validation.warnings.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" />
        <div className="space-y-1">
          <div className="text-sm font-bold">Nội dung hoàn toàn hợp lệ!</div>
          <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 leading-relaxed">
            Phiên bản đáp ứng đầy đủ tiêu chuẩn kiểm duyệt và sẵn sàng gửi duyệt hoặc xuất bản.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {validation.errors.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>Phát hiện {validation.errors.length} lỗi bắt buộc cần sửa:</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-xs">
            {validation.errors.map((err, idx) => (
              <li
                key={idx}
                onClick={() => onSelectIssue && onSelectIssue(err)}
                className={`cursor-pointer hover:underline ${
                  onSelectIssue ? 'hover:text-rose-900 dark:hover:text-rose-100' : ''
                }`}
              >
                <span className="font-semibold">[{err.entityType}]:</span> {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{validation.warnings.length} cảnh báo cần lưu ý:</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-xs">
            {validation.warnings.map((warn, idx) => (
              <li
                key={idx}
                onClick={() => onSelectIssue && onSelectIssue(warn)}
                className={`cursor-pointer hover:underline ${
                  onSelectIssue ? 'hover:text-amber-900 dark:hover:text-amber-100' : ''
                }`}
              >
                <span className="font-semibold">[{warn.entityType}]:</span> {warn.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
