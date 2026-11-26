import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { PracticeAdminExerciseSet } from '../../pages/admin/practice/practice-admin.types';
import { SKILL_OPTIONS } from '../../pages/admin/practice/practice-admin.constants';
import { ShimmerButton } from '../ui';
import { appConfirm } from '../../lib/dialog';

interface ExerciseSetFormProps {
  exerciseSet: PracticeAdminExerciseSet;
  isEditable: boolean;
  onSave: (data: Partial<PracticeAdminExerciseSet>) => Promise<void>;
  onDelete: () => Promise<void>;
}

export const ExerciseSetForm: React.FC<ExerciseSetFormProps> = ({
  exerciseSet,
  isEditable,
  onSave,
  onDelete,
}) => {
  const [skill, setSkill] = useState(exerciseSet.skill);
  const [titleZh, setTitleZh] = useState(exerciseSet.titleZh);
  const [titleVi, setTitleVi] = useState(exerciseSet.titleVi || '');
  const [instructions, setInstructions] = useState(exerciseSet.instructions || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(exerciseSet.estimatedMinutes || 15);
  const [audioUrl, setAudioUrl] = useState(exerciseSet.audioUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSkill(exerciseSet.skill);
    setTitleZh(exerciseSet.titleZh);
    setTitleVi(exerciseSet.titleVi || '');
    setInstructions(exerciseSet.instructions || '');
    setEstimatedMinutes(exerciseSet.estimatedMinutes || 15);
    setAudioUrl(exerciseSet.audioUrl || '');
  }, [exerciseSet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) return;
    try {
      setIsSaving(true);
      await onSave({
        skill,
        titleZh: titleZh.trim(),
        titleVi: titleVi.trim() || null,
        instructions: instructions.trim() || null,
        estimatedMinutes: Number(estimatedMinutes) || 15,
        audioUrl: audioUrl.trim() || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await appConfirm({
      title: 'Xác nhận xóa phần bài tập',
      message: `Bạn có chắc chắn muốn xóa phần "${exerciseSet.titleZh}" cùng tất cả các câu hỏi bên trong không?`,
      danger: true,
      confirmLabel: 'Xóa phần thi',
    });
    if (!confirmed) return;
    await onDelete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Chỉnh sửa phần bài tập: <span className="font-mono text-rose-500">{exerciseSet.code}</span>
          </h3>
          <p className="text-xs text-slate-400">Thiết lập tiêu đề, kỹ năng và file âm thanh dùng chung</p>
        </div>

        {isEditable && (
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa phần</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Skill */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Kỹ năng làm bài
          </label>
          <select
            disabled={!isEditable}
            value={skill}
            onChange={(e) => setSkill(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            {SKILL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.labelVi} ({opt.labelZh})
              </option>
            ))}
          </select>
        </div>

        {/* Estimated minutes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Thời lượng dự kiến (phút)
          </label>
          <input
            type="number"
            min="1"
            max="300"
            disabled={!isEditable}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 15)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Title Zh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Tiêu đề tiếng Trung (Zh) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            disabled={!isEditable}
            value={titleZh}
            onChange={(e) => setTitleZh(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-chinese text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Title Vi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Tiêu đề tiếng Việt
          </label>
          <input
            type="text"
            disabled={!isEditable}
            value={titleVi}
            onChange={(e) => setTitleVi(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Audio URL */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Đường dẫn file Audio chung cho phần thi (audioUrl)
          </label>
          <input
            type="text"
            disabled={!isEditable}
            placeholder="Ví dụ: /media/practice/hsk1/audio/L03_Listening.mp3"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Instructions */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Chỉ dẫn / Hướng dẫn làm bài
          </label>
          <textarea
            rows={2}
            disabled={!isEditable}
            placeholder="Ví dụ: Nghe đoạn ghi âm và chọn bức tranh đúng..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {isEditable && (
        <div className="flex justify-end pt-2">
          <ShimmerButton disabled={isSaving} type="submit">
            {isSaving ? 'Đang lưu...' : 'Lưu phần bài tập'}
          </ShimmerButton>
        </div>
      )}
    </form>
  );
};
