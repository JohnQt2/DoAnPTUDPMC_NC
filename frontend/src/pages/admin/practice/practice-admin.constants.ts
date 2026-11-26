import {
  PracticeCategory,
  PracticeCollectionStatus,
  PracticeVersionStatus,
  SupportedQuestionType,
  ExerciseSkill,
} from './practice-admin.types';

export const CATEGORY_LABELS: Record<PracticeCategory, { label: string; badge: string }> = {
  WORKBOOK_LESSON: { label: 'Sách bài tập', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  SKILL_PRACTICE: { label: 'Luyện kỹ năng', badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  MIXED_PRACTICE: { label: 'Luyện tập tổng hợp', badge: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  MOCK_EXAM: { label: 'Đề thi mô phỏng', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  REAL_EXAM_SIMULATION: { label: 'Thi thử thực tế', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
};

export const COLLECTION_STATUS_CONFIG: Record<
  PracticeCollectionStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  DRAFT: {
    label: 'Bản nháp',
    bg: 'bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/20',
    dot: 'bg-slate-400',
  },
  IN_REVIEW: {
    label: 'Chờ duyệt',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500 animate-pulse',
  },
  REVISION_REQUIRED: {
    label: 'Yêu cầu sửa',
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20',
    dot: 'bg-rose-500',
  },
  PUBLISHED: {
    label: 'Đã xuất bản',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  ARCHIVED: {
    label: 'Đã lưu trữ',
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-500 dark:text-zinc-400',
    border: 'border-zinc-500/20',
    dot: 'bg-zinc-400',
  },
};

export const VERSION_STATUS_CONFIG: Record<
  PracticeVersionStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  DRAFT: { label: 'Bản nháp', bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/20' },
  IN_REVIEW: { label: 'Chờ duyệt', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  REVISION_REQUIRED: { label: 'Yêu cầu sửa', bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20' },
  PUBLISHED: { label: 'Đang phát hành', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  RETIRED: { label: 'Đã thu hồi', bg: 'bg-zinc-500/10', text: 'text-zinc-500 dark:text-zinc-400', border: 'border-zinc-500/20' },
};

export const SKILL_OPTIONS: Array<{ value: ExerciseSkill; labelZh: string; labelVi: string }> = [
  { value: 'LISTENING', labelZh: '听力', labelVi: 'Nghe hiểu' },
  { value: 'READING', labelZh: '阅读', labelVi: 'Đọc hiểu' },
  { value: 'PHONETICS', labelZh: '语音', labelVi: 'Ngữ âm' },
  { value: 'HANZI', labelZh: '汉字', labelVi: 'Chữ Hán' },
  { value: 'WRITING', labelZh: '书写', labelVi: 'Viết' },
  { value: 'MOCK_TEST', labelZh: '模拟', labelVi: 'Mô phỏng' },
];

export const QUESTION_TYPE_OPTIONS: Array<{ value: SupportedQuestionType; label: string; desc: string }> = [
  { value: 'TRUE_FALSE', label: 'Đúng / Sai (Phán đoán tranh/audio)', desc: 'Xác định hình ảnh hoặc nội dung đúng/sai' },
  { value: 'SINGLE_CHOICE', label: 'Trắc nghiệm đơn', desc: 'Chọn 1 trong các đáp án A, B, C, D...' },
  { value: 'IMAGE_CHOICE', label: 'Chọn hình ảnh', desc: 'Chọn hình ảnh tương ứng với từ/ngữ cảnh' },
  { value: 'LISTEN_AND_CHOOSE', label: 'Nghe và chọn đáp án', desc: 'Nghe file âm thanh và chọn câu trả lời đúng' },
  { value: 'TONE_SELECTION', label: 'Chọn thanh điệu', desc: 'Luyện nhận biết thanh 1, 2, 3, 4' },
  { value: 'CHARACTER_WRITING', label: 'Tập viết chữ Hán', desc: 'Kiểm tra thứ tự nét viết chữ Hán' },
  { value: 'TEXT_INPUT', label: 'Điền từ / Điền câu', desc: 'Nhập câu trả lời dạng văn bản' },
];
