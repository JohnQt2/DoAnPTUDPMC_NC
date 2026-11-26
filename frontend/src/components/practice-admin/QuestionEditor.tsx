import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Sparkles } from 'lucide-react';
import {
  PracticeAdminQuestion,
  SupportedQuestionType,
} from '../../pages/admin/practice/practice-admin.types';
import { QUESTION_TYPE_OPTIONS } from '../../pages/admin/practice/practice-admin.constants';
import { QuestionTypeFields } from './QuestionTypeFields';
import { QuestionPreview } from './QuestionPreview';
import { ShimmerButton } from '../ui';
import { appConfirm } from '../../lib/dialog';

interface QuestionEditorProps {
  question: PracticeAdminQuestion;
  isEditable: boolean;
  onSave: (data: Partial<PracticeAdminQuestion>) => Promise<void>;
  onDelete: () => Promise<void>;
  onDuplicate: () => Promise<void>;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  isEditable,
  onSave,
  onDelete,
  onDuplicate,
}) => {
  const [type, setType] = useState<SupportedQuestionType>(question.type);
  const [prompt, setPrompt] = useState<Record<string, any>>(question.prompt || {});
  const [answer, setAnswer] = useState<Record<string, any>>(question.answer || {});
  const [explanation, setExplanation] = useState<string>(
    typeof question.explanation === 'string'
      ? question.explanation
      : question.explanation
      ? JSON.stringify(question.explanation)
      : ''
  );
  const [score, setScore] = useState<number>(question.score || 1);
  const [sourcePage, setSourcePage] = useState<number | ''>(question.sourcePage || '');
  const [sourceAudio, setSourceAudio] = useState<string>(question.sourceAudio || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setType(question.type);
    setPrompt(question.prompt || {});
    setAnswer(question.answer || {});
    setExplanation(
      typeof question.explanation === 'string'
        ? question.explanation
        : question.explanation
        ? JSON.stringify(question.explanation)
        : ''
    );
    setScore(question.score || 1);
    setSourcePage(question.sourcePage || '');
    setSourceAudio(question.sourceAudio || '');
  }, [question]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) return;
    try {
      setIsSaving(true);
      await onSave({
        type,
        prompt,
        answer,
        explanation: explanation.trim() || null,
        score: Number(score) || 1,
        sourcePage: sourcePage === '' ? null : Number(sourcePage),
        sourceAudio: sourceAudio.trim() || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await appConfirm({
      title: 'Xác nhận xóa câu hỏi',
      message: `Bạn có chắc muốn xóa câu hỏi ${question.code} không?`,
      danger: true,
      confirmLabel: 'Xóa câu hỏi',
    });
    if (!confirmed) return;
    await onDelete();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>Biên soạn câu hỏi:</span>
              <span className="font-mono text-rose-500">{question.code}</span>
            </h3>
            <p className="text-xs text-slate-400">Chọn loại câu hỏi, nhập đề bài, options và lời giải chi tiết</p>
          </div>

          {isEditable && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onDuplicate}
                title="Nhân bản câu hỏi này"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Nhân bản</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                title="Xóa câu hỏi"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa câu</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Question Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Loại câu hỏi <span className="text-rose-500">*</span>
            </label>
            <select
              disabled={!isEditable}
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {QUESTION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Score */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Điểm số (Score)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              disabled={!isEditable}
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Source Page */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Trang trong sách (PDF page)
            </label>
            <input
              type="number"
              min="1"
              disabled={!isEditable}
              placeholder="Ví dụ: 18"
              value={sourcePage}
              onChange={(e) => setSourcePage(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Type-Specific Fields */}
        <QuestionTypeFields
          type={type}
          prompt={prompt}
          answer={answer}
          isEditable={isEditable}
          onChangePrompt={setPrompt}
          onChangeAnswer={setAnswer}
        />

        {/* Explanation */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Giải thích chi tiết (Hiển thị sau khi học viên nộp bài)
          </label>
          <textarea
            rows={2}
            disabled={!isEditable}
            placeholder="Giải thích vì sao chọn đáp án này, ngữ pháp hoặc từ vựng liên quan..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {isEditable && (
          <div className="flex justify-end pt-2">
            <ShimmerButton disabled={isSaving} type="submit">
              {isSaving ? 'Đang lưu...' : 'Lưu câu hỏi'}
            </ShimmerButton>
          </div>
        )}
      </form>

      {/* Live Question Preview */}
      <QuestionPreview
        question={{
          ...question,
          type,
          prompt,
          answer,
          explanation,
          score,
        }}
      />
    </div>
  );
};
