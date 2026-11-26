export type PracticeCategory =
  | 'WORKBOOK_LESSON'
  | 'SKILL_PRACTICE'
  | 'MIXED_PRACTICE'
  | 'MOCK_EXAM'
  | 'REAL_EXAM_SIMULATION';

export type PracticeCollectionStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'REVISION_REQUIRED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type PracticeVersionStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'REVISION_REQUIRED'
  | 'PUBLISHED'
  | 'RETIRED';

export type SupportedQuestionType =
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

export interface PracticeAdminCollectionSummary {
  id: number;
  levelId: number;
  levelCode: string;
  levelName: string;
  code: string;
  category: PracticeCategory;
  titleZh: string;
  titlePinyin?: string | null;
  titleVi: string;
  description?: string | null;
  orderIndex: number;
  status: PracticeCollectionStatus;
  currentVersionId?: number | null;
  currentVersionNumber?: number | null;
  createdById: number;
  creatorName: string;
  updatedById: number;
  updaterName: string;
  assignedEditorId?: number | null;
  assignedEditorName?: string | null;
  reviewedById?: number | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  versionsCount: number;
}

export interface PracticeAdminQuestion {
  id: number;
  exerciseSetId: number;
  code: string;
  type: SupportedQuestionType;
  prompt: Record<string, any>;
  answer: Record<string, any>;
  explanation?: any;
  score: number;
  sortOrder: number;
  status: string;
  sourcePage?: number | null;
  sourceAudio?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeAdminExerciseSet {
  id: number;
  lessonId?: number | null;
  versionId: number;
  code: string;
  skill: ExerciseSkill;
  titleZh: string;
  titleVi?: string | null;
  instructions?: string | null;
  sortOrder: number;
  status: string;
  isPublished: boolean;
  estimatedMinutes: number;
  audioUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  questions: PracticeAdminQuestion[];
}

export interface PracticeAdminVersionSummary {
  id: number;
  versionNumber: number;
  status: PracticeVersionStatus;
  changeSummary?: string | null;
  reviewNotes?: string | null;
  createdById: number;
  creatorName: string;
  reviewedById?: number | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  exerciseSetsCount: number;
  attemptsCount: number;
}

export interface PracticeAdminVersionDetail extends PracticeAdminVersionSummary {
  collectionId: number;
  collectionCode: string;
  updatedById: number;
  updaterName: string;
  exerciseSets: PracticeAdminExerciseSet[];
}

export interface PracticeAdminCollectionDetail extends PracticeAdminCollectionSummary {
  currentVersion: PracticeAdminVersionDetail | null;
  versions: PracticeAdminVersionSummary[];
}

export interface PracticeValidationIssue {
  entityType: 'VERSION' | 'EXERCISE_SET' | 'QUESTION';
  entityId: number;
  field: string;
  code: string;
  message: string;
}

export interface PracticeValidationResult {
  valid: boolean;
  errors: PracticeValidationIssue[];
  warnings: PracticeValidationIssue[];
}

export interface PracticePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PracticeCollectionSummaryCounts {
  draft: number;
  inReview: number;
  revisionRequired: number;
  published: number;
  archived: number;
}

export interface PracticeCollectionListResponse {
  items: PracticeAdminCollectionSummary[];
  pagination: PracticePagination;
  summary: PracticeCollectionSummaryCounts;
}

export interface PracticeLevelOption {
  id: number;
  code: string;
  name: string;
}

export interface PracticeAssignableUser {
  user_id: number;
  email: string;
  display_name: string;
  role: 'ADMIN' | 'CONTENT_EDITOR';
  status: string;
}

export interface PracticeAssignableUsersResponse {
  users: PracticeAssignableUser[];
  pagination: PracticePagination;
}
