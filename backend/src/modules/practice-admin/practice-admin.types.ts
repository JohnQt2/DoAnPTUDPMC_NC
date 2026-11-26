export type CollectionCategory =
  | 'WORKBOOK_LESSON'
  | 'SKILL_PRACTICE'
  | 'MIXED_PRACTICE'
  | 'MOCK_EXAM'
  | 'REAL_EXAM_SIMULATION';

export type CollectionStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'REVISION_REQUIRED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type VersionStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'REVISION_REQUIRED'
  | 'PUBLISHED'
  | 'RETIRED';

export type QuestionType =
  | 'TRUE_FALSE'
  | 'SINGLE_CHOICE'
  | 'IMAGE_CHOICE'
  | 'LISTEN_AND_CHOOSE'
  | 'TONE_SELECTION'
  | 'CHARACTER_WRITING'
  | 'TEXT_INPUT';

export type ExerciseSkill =
  | 'LISTENING'
  | 'READING'
  | 'PHONETICS'
  | 'HANZI'
  | 'MOCK_TEST'
  | 'WRITING';

export interface ValidationErrorItem {
  entityType: 'VERSION' | 'EXERCISE_SET' | 'QUESTION';
  entityId: number;
  field: string;
  code: string;
  message: string;
}

export interface ValidationWarningItem {
  entityType: 'VERSION' | 'EXERCISE_SET' | 'QUESTION';
  entityId: number;
  field: string;
  code: string;
  message: string;
}

export interface PublishValidationResult {
  valid: boolean;
  errors: ValidationErrorItem[];
  warnings: ValidationWarningItem[];
}
