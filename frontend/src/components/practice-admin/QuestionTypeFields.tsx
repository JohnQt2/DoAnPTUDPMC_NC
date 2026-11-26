import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { SupportedQuestionType } from '../../pages/admin/practice/practice-admin.types';

interface QuestionTypeFieldsProps {
  type: SupportedQuestionType;
  prompt: Record<string, any>;
  answer: Record<string, any>;
  isEditable: boolean;
  onChangePrompt: (newPrompt: Record<string, any>) => void;
  onChangeAnswer: (newAnswer: Record<string, any>) => void;
}

export const QuestionTypeFields: React.FC<QuestionTypeFieldsProps> = ({
  type,
  prompt,
  answer,
  isEditable,
  onChangePrompt,
  onChangeAnswer,
}) => {
  // ─── TRUE / FALSE ───────────────────────────────────────────────────────────
  if (type === 'TRUE_FALSE') {
    const isTrue = answer?.value === true;
    const isFalse = answer?.value === false;

    return (
      <div className="space-y-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Nội dung nhận định / Câu hỏi
          </label>
          <input
            type="text"
            disabled={!isEditable}
            value={prompt?.text || ''}
            onChange={(e) => onChangePrompt({ ...prompt, text: e.target.value })}
            placeholder="Ví dụ: Bạn ấy đang đi ăn cơm..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Từ vựng tương ứng (Chữ Hán)
            </label>
            <input
              type="text"
              disabled={!isEditable}
              value={prompt?.wordZh || ''}
              onChange={(e) => onChangePrompt({ ...prompt, wordZh: e.target.value })}
              placeholder="Ví dụ: 喝水"
              className="w-full px-3 py-2 text-xs font-chinese rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Phiên âm Pinyin
            </label>
            <input
              type="text"
              disabled={!isEditable}
              value={prompt?.wordPinyin || ''}
              onChange={(e) => onChangePrompt({ ...prompt, wordPinyin: e.target.value })}
              placeholder="Ví dụ: hē shuǐ"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            URL hình ảnh đính kèm (imageUrl)
          </label>
          <input
            type="text"
            disabled={!isEditable}
            value={prompt?.imageUrl || ''}
            onChange={(e) => onChangePrompt({ ...prompt, imageUrl: e.target.value })}
            placeholder="Ví dụ: /media/practice/hsk1/images/L03_P1_Q01.png"
            className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Đáp án đúng <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 cursor-pointer">
              <input
                type="radio"
                name="tf_answer"
                disabled={!isEditable}
                checked={isTrue}
                onChange={() => onChangeAnswer({ value: true })}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <span>ĐÚNG (True / √)</span>
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-bold text-rose-600 cursor-pointer">
              <input
                type="radio"
                name="tf_answer"
                disabled={!isEditable}
                checked={isFalse}
                onChange={() => onChangeAnswer({ value: false })}
                className="w-4 h-4 text-rose-600 focus:ring-rose-500"
              />
              <span>SAI (False / X)</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // ─── SINGLE CHOICE / LISTEN AND CHOOSE ──────────────────────────────────────
  if (type === 'SINGLE_CHOICE' || type === 'LISTEN_AND_CHOOSE') {
    const options: Array<{ key: string; text?: string; pinyin?: string; label?: string }> =
      prompt?.options || [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
      ];

    const currentAnswerKey = answer?.value || '';

    const handleOptionChange = (idx: number, field: string, val: string) => {
      const next = [...options];
      next[idx] = { ...next[idx], [field]: val };
      onChangePrompt({ ...prompt, options: next });
    };

    const handleAddOption = () => {
      const nextKey = String.fromCharCode(65 + options.length);
      onChangePrompt({ ...prompt, options: [...options, { key: nextKey, text: '' }] });
    };

    const handleRemoveOption = (idx: number) => {
      const next = options.filter((_, i) => i !== idx);
      onChangePrompt({ ...prompt, options: next });
    };

    return (
      <div className="space-y-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Nội dung câu hỏi / Đề bài
          </label>
          <input
            type="text"
            disabled={!isEditable}
            value={prompt?.text || ''}
            onChange={(e) => onChangePrompt({ ...prompt, text: e.target.value })}
            placeholder="Ví dụ: Chọn câu trả lời đúng cho đoạn thoại..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {type === 'LISTEN_AND_CHOOSE' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              URL file Audio riêng cho câu hỏi (nếu có)
            </label>
            <input
              type="text"
              disabled={!isEditable}
              value={prompt?.audioUrl || ''}
              onChange={(e) => onChangePrompt({ ...prompt, audioUrl: e.target.value })}
              placeholder="Ví dụ: /media/practice/hsk1/audio/L03_Q05.mp3"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Danh sách lựa chọn & Chọn đáp án đúng <span className="text-rose-500">*</span>
            </label>
            {isEditable && (
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm lựa chọn</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {options.map((opt, idx) => {
              const isChecked = currentAnswerKey === opt.key;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                    isChecked
                      ? 'border-emerald-500 bg-emerald-500/[0.04]'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                    <input
                      type="radio"
                      name="single_choice_ans"
                      disabled={!isEditable}
                      checked={isChecked}
                      onChange={() => onChangeAnswer({ value: opt.key })}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-xs w-6">{opt.key}.</span>
                  </label>

                  <input
                    type="text"
                    disabled={!isEditable}
                    value={opt.text || opt.label || ''}
                    onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                    placeholder={`Nội dung lựa chọn ${opt.key}...`}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500 font-chinese"
                  />

                  {isEditable && options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── IMAGE CHOICE ───────────────────────────────────────────────────────────
  if (type === 'IMAGE_CHOICE') {
    const options: Array<{ key: string; imageUrl: string; caption?: string }> =
      prompt?.options || [
        { key: 'A', imageUrl: '' },
        { key: 'B', imageUrl: '' },
      ];

    const currentAnswerKey = answer?.value || '';

    const handleOptionChange = (idx: number, field: string, val: string) => {
      const next = [...options];
      next[idx] = { ...next[idx], [field]: val };
      onChangePrompt({ ...prompt, options: next });
    };

    const handleAddOption = () => {
      const nextKey = String.fromCharCode(65 + options.length);
      onChangePrompt({ ...prompt, options: [...options, { key: nextKey, imageUrl: '' }] });
    };

    const handleRemoveOption = (idx: number) => {
      const next = options.filter((_, i) => i !== idx);
      onChangePrompt({ ...prompt, options: next });
    };

    return (
      <div className="space-y-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Nội dung câu hỏi / Đề bài
          </label>
          <input
            type="text"
            disabled={!isEditable}
            value={prompt?.text || ''}
            onChange={(e) => onChangePrompt({ ...prompt, text: e.target.value })}
            placeholder="Ví dụ: Chọn hình ảnh phù hợp với đoạn ghi âm..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Danh sách hình ảnh lựa chọn & Chọn đáp án đúng <span className="text-rose-500">*</span>
            </label>
            {isEditable && (
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm hình ảnh</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((opt, idx) => {
              const isChecked = currentAnswerKey === opt.key;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border space-y-2 transition-colors ${
                    isChecked
                      ? 'border-emerald-500 bg-emerald-500/[0.04]'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-xs">
                      <input
                        type="radio"
                        name="img_choice_ans"
                        disabled={!isEditable}
                        checked={isChecked}
                        onChange={() => onChangeAnswer({ value: opt.key })}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span>Lựa chọn {opt.key}</span>
                    </label>

                    {isEditable && options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    disabled={!isEditable}
                    value={opt.imageUrl || ''}
                    onChange={(e) => handleOptionChange(idx, 'imageUrl', e.target.value)}
                    placeholder="URL ảnh: /media/practice/.../img.png"
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── CHARACTER WRITING ──────────────────────────────────────────────────────
  if (type === 'CHARACTER_WRITING') {
    return (
      <div className="space-y-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Chữ Hán cần tập viết <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!isEditable}
              value={prompt?.character || prompt?.hanzi || ''}
              onChange={(e) =>
                onChangePrompt({
                  ...prompt,
                  character: e.target.value,
                  hanzi: e.target.value,
                })
              }
              placeholder="Ví dụ: 你"
              className="w-full px-3 py-2 text-base font-chinese font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Phiên âm Pinyin
            </label>
            <input
              type="text"
              disabled={!isEditable}
              value={prompt?.pinyin || ''}
              onChange={(e) => onChangePrompt({ ...prompt, pinyin: e.target.value })}
              placeholder="Ví dụ: nǐ"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── TEXT INPUT ─────────────────────────────────────────────────────────────
  if (type === 'TEXT_INPUT') {
    return (
      <div className="space-y-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Nội dung câu hỏi
          </label>
          <input
            type="text"
            disabled={!isEditable}
            value={prompt?.text || ''}
            onChange={(e) => onChangePrompt({ ...prompt, text: e.target.value })}
            placeholder="Ví dụ: Điền từ còn thiếu vào chỗ trống..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Đáp án chuẩn (answer.value) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            disabled={!isEditable}
            value={answer?.value || ''}
            onChange={(e) => onChangeAnswer({ value: e.target.value })}
            placeholder="Ví dụ: 老师"
            className="w-full px-3 py-2 text-xs font-chinese rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">
      Chưa có trình chỉnh sửa riêng cho loại câu hỏi: {type}
    </div>
  );
};
