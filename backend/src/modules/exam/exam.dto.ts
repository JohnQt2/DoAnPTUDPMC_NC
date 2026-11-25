export type HskLevel = 'HSK1' | 'HSK2' | 'HSK3' | 'HSK4' | 'HSK5' | 'HSK6';
export type SectionType = 'LISTENING' | 'READING' | 'WRITING';
export type QuestionType =
  | 'MCQ_ABCD'
  | 'TRUE_FALSE'
  | 'MCQ_ABCDEF'
  | 'WRITING_FILL'
  | 'WRITING_ESSAY';
export type ExamStatus = 'DRAFT' | 'PUBLISHED';

export interface CreateQuestionDto {
  question_number: number;
  question_type: QuestionType;
  prompt_text?: string;
  options?: string[] | string;
  correct_answer?: string;
  sample_answer?: string;
  points: number;
  explanation?: string;
  order_index?: number;
}

export interface CreateSectionDto {
  section_type: SectionType;
  title: string;
  instructions?: string;
  audio_url?: string;
  order_index?: number;
  questions?: CreateQuestionDto[];
}

export interface CreateExamDto {
  code: string;
  title: string;
  description?: string;
  hsk_level: HskLevel;
  exam_pdf_url: string;
  audio_url?: string;
  answer_pdf_url?: string;
  duration_minutes?: number;
  total_score?: number;
  pass_score?: number;
  status?: ExamStatus;
  sections?: CreateSectionDto[];
}

export interface UpdateExamDto {
  code?: string;
  title?: string;
  description?: string;
  hsk_level?: HskLevel;
  exam_pdf_url?: string;
  audio_url?: string;
  answer_pdf_url?: string;
  duration_minutes?: number;
  total_score?: number;
  pass_score?: number;
  status?: ExamStatus;
  sections?: CreateSectionDto[];
}

export interface SubmitAnswerItemDto {
  question_id: number;
  user_answer?: string;
}

export interface SubmitExamDto {
  answers: SubmitAnswerItemDto[];
}
