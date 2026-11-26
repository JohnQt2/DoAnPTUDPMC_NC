import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';

export interface JsonEditorFieldProps {
  value: string;
  onChange: (newValue: string, isValid: boolean, parsedObj?: any) => void;
  label?: string;
  helperText?: string;
  minHeight?: string | number;
  placeholder?: string;
  readOnly?: boolean;
}

export const JsonEditorField: React.FC<JsonEditorFieldProps> = ({
  value,
  onChange,
  label = 'Dữ liệu JSON',
  helperText = 'Chỉnh sửa cấu trúc dữ liệu của nội dung bài học',
  minHeight = '320px',
  placeholder = '{\n  ...\n}',
  readOnly = false,
}) => {
  const [copied, setCopied] = useState(false);

  // Validate JSON string and get parsed object / error
  const { isValid, error, formattedText } = useMemo(() => {
    if (!value || !value.trim()) {
      return { isValid: false, error: 'Dữ liệu JSON không được để trống.', formattedText: '' };
    }
    try {
      const parsed = JSON.parse(value);
      return { isValid: true, error: null, formattedText: JSON.stringify(parsed, null, 2) };
    } catch (err: any) {
      return {
        isValid: false,
        error: err.message || 'Cú pháp JSON không hợp lệ. Vui lòng kiểm tra dấu ngoặc và dấu phẩy.',
        formattedText: '',
      };
    }
  }, [value]);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    if (isValid && formattedText && formattedText !== value) {
      onChange(formattedText, true, JSON.parse(formattedText));
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <div>
          {label && (
            <label className="block text-xs font-bold text-gray-800 dark:text-slate-200">
              {label}
            </label>
          )}
          {helperText && (
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
              {helperText}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isValid && (
            <button
              type="button"
              onClick={handleFormat}
              className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 hover:text-primary-600 px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              title="Định dạng lại thụt lề 2 spaces"
            >
              Format JSON
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 hover:text-primary-600 px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
            title="Sao chép JSON"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden transition-all">
        <textarea
          rows={12}
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value;
            try {
              const parsed = JSON.parse(raw);
              onChange(raw, true, parsed);
            } catch {
              onChange(raw, false);
            }
          }}
          style={{
            minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '13.5px',
            lineHeight: '1.6',
            resize: 'vertical',
          }}
          className={`w-full p-4 rounded-2xl outline-none transition-all duration-200 text-gray-900 dark:text-slate-100 bg-[#f8fafc]/90 dark:bg-slate-950/80 border ${
            !isValid && value.trim()
              ? 'border-rose-400 dark:border-rose-500/80 focus:ring-2 focus:ring-rose-400/30'
              : isValid
              ? 'border-emerald-400/80 dark:border-emerald-500/60 focus:ring-2 focus:ring-emerald-400/30'
              : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary-400/30'
          }`}
          spellCheck={false}
        />
      </div>

      {/* Validation status badge & error message */}
      <div className="min-h-[22px] flex items-center justify-between text-xs px-1">
        {!isValid && value.trim() ? (
          <div className="flex items-center gap-1.5 text-rose-500 font-medium animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[650px]">{error}</span>
          </div>
        ) : isValid && value.trim() ? (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>JSON hợp lệ</span>
          </div>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
};
