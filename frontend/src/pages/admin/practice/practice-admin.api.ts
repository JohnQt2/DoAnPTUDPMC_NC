import { api } from '../../../lib/api';
import {
  PracticeCollectionListResponse,
  PracticeAdminCollectionDetail,
  PracticeAdminVersionDetail,
  PracticeAdminVersionSummary,
  PracticeAdminExerciseSet,
  PracticeAdminQuestion,
  PracticeValidationResult,
  PracticeLevelOption,
  PracticeAssignableUsersResponse,
} from './practice-admin.types';

const ADMIN_PRACTICE_BASE = '/practice/admin';

export const practiceAdminApi = {
  // Collections
  listCollections: (
    params?: Record<string, string | number | boolean | undefined>,
    options?: { signal?: AbortSignal }
  ) => api.get<PracticeCollectionListResponse>(`${ADMIN_PRACTICE_BASE}/collections`, { params, ...options }),

  listLevels: () => api.get<PracticeLevelOption[]>('/practice/levels'),

  listAssignableUsers: (params: {
    role: 'ADMIN' | 'CONTENT_EDITOR';
    status: 'ACTIVE';
    search?: string;
    page: number;
    limit: number;
  }) => api.get<PracticeAssignableUsersResponse>('/users/admin/all', { params }),

  assignEditor: (collectionId: number, editorId: number) =>
    api.post<PracticeAdminCollectionDetail>(`${ADMIN_PRACTICE_BASE}/collections/${collectionId}/assign-editor`, {
      editorId,
    }),

  createCollection: (data: {
    levelId: number;
    code: string;
    category: string;
    titleZh: string;
    titlePinyin?: string | null;
    titleVi: string;
    description?: string | null;
    orderIndex?: number;
  }) =>
    api.post<{ collection: PracticeAdminCollectionDetail; initialVersion: PracticeAdminVersionDetail }>(
      `${ADMIN_PRACTICE_BASE}/collections`,
      data
    ),

  getCollection: (collectionId: number) =>
    api.get<PracticeAdminCollectionDetail>(`${ADMIN_PRACTICE_BASE}/collections/${collectionId}`),

  updateCollection: (
    collectionId: number,
    data: {
      titleZh?: string;
      titlePinyin?: string | null;
      titleVi?: string;
      description?: string | null;
      orderIndex?: number;
      expectedUpdatedAt: string;
    }
  ) =>
    api.put<PracticeAdminCollectionDetail>(`${ADMIN_PRACTICE_BASE}/collections/${collectionId}`, data),

  duplicateCollection: (
    collectionId: number,
    data: {
      newCode: string;
      titleVi?: string;
      sourceVersionId?: number;
    }
  ) =>
    api.post<{ collection: PracticeAdminCollectionDetail; initialVersionId: number }>(
      `${ADMIN_PRACTICE_BASE}/collections/${collectionId}/duplicate`,
      data
    ),

  archiveCollection: (collectionId: number) =>
    api.post<PracticeAdminCollectionDetail>(`${ADMIN_PRACTICE_BASE}/collections/${collectionId}/archive`),

  // Versions
  listVersions: (collectionId: number) =>
    api.get<PracticeAdminVersionSummary[]>(`${ADMIN_PRACTICE_BASE}/collections/${collectionId}/versions`),

  createVersion: (collectionId: number, data: { sourceVersionId?: number; changeSummary: string }) =>
    api.post<PracticeAdminVersionDetail>(`${ADMIN_PRACTICE_BASE}/collections/${collectionId}/versions`, data),

  getVersion: (versionId: number) =>
    api.get<PracticeAdminVersionDetail>(`${ADMIN_PRACTICE_BASE}/versions/${versionId}`),

  updateVersion: (versionId: number, data: { changeSummary?: string; expectedUpdatedAt: string }) =>
    api.put<PracticeAdminVersionDetail>(`${ADMIN_PRACTICE_BASE}/versions/${versionId}`, data),

  validateVersion: (versionId: number) =>
    api.post<PracticeValidationResult>(`${ADMIN_PRACTICE_BASE}/versions/${versionId}/validate`),

  previewVersion: (versionId: number, showAnswers: boolean = false) =>
    api.get<any>(`${ADMIN_PRACTICE_BASE}/versions/${versionId}/preview`, {
      params: { showAnswers: showAnswers ? 'true' : 'false' },
    }),

  submitReview: (versionId: number, data?: { reviewNotes?: string }) =>
    api.post<PracticeAdminVersionDetail>(`${ADMIN_PRACTICE_BASE}/versions/${versionId}/submit-review`, data || {}),

  requestChanges: (versionId: number, data: { reviewNote: string }) =>
    api.post<PracticeAdminVersionDetail>(`${ADMIN_PRACTICE_BASE}/versions/${versionId}/request-changes`, data),

  publishVersion: (versionId: number, data?: { notes?: string }) =>
    api.post<PracticeAdminVersionDetail>(`${ADMIN_PRACTICE_BASE}/versions/${versionId}/publish`, data || {}),

  retireVersion: (versionId: number) =>
    api.post<PracticeAdminVersionDetail>(`${ADMIN_PRACTICE_BASE}/versions/${versionId}/retire`),

  // Exercise Sets
  createExerciseSet: (
    versionId: number,
    data: {
      code: string;
      skill: string;
      titleZh: string;
      titleVi?: string | null;
      instructions?: string | null;
      estimatedMinutes?: number;
      audioUrl?: string | null;
      sortOrder?: number;
    }
  ) =>
    api.post<PracticeAdminExerciseSet>(`${ADMIN_PRACTICE_BASE}/versions/${versionId}/exercise-sets`, data),

  updateExerciseSet: (
    exerciseSetId: number,
    data: {
      titleZh?: string;
      titleVi?: string | null;
      instructions?: string | null;
      estimatedMinutes?: number;
      audioUrl?: string | null;
      sortOrder?: number;
      expectedUpdatedAt?: string;
    }
  ) =>
    api.put<PracticeAdminExerciseSet>(`${ADMIN_PRACTICE_BASE}/exercise-sets/${exerciseSetId}`, data),

  deleteExerciseSet: (exerciseSetId: number) =>
    api.delete<{ success: boolean; message: string }>(`${ADMIN_PRACTICE_BASE}/exercise-sets/${exerciseSetId}`),

  reorderExerciseSets: (versionId: number, items: Array<{ id: number; sortOrder: number }>) =>
    api.put<{ success: boolean; message: string }>(
      `${ADMIN_PRACTICE_BASE}/versions/${versionId}/exercise-sets/reorder`,
      { items }
    ),

  // Questions
  createQuestion: (
    exerciseSetId: number,
    data: {
      code: string;
      type: string;
      prompt: Record<string, unknown>;
      answer: Record<string, unknown>;
      explanation?: unknown;
      score?: number;
      sortOrder?: number;
      sourcePage?: number | null;
      sourceAudio?: string | null;
    }
  ) =>
    api.post<PracticeAdminQuestion>(`${ADMIN_PRACTICE_BASE}/exercise-sets/${exerciseSetId}/questions`, data),

  updateQuestion: (
    questionId: number,
    data: {
      type?: string;
      prompt?: Record<string, unknown>;
      answer?: Record<string, unknown>;
      explanation?: unknown;
      score?: number;
      sortOrder?: number;
      sourcePage?: number | null;
      sourceAudio?: string | null;
      expectedUpdatedAt?: string;
    }
  ) =>
    api.put<PracticeAdminQuestion>(`${ADMIN_PRACTICE_BASE}/questions/${questionId}`, data),

  deleteQuestion: (questionId: number) =>
    api.delete<{ success: boolean; message: string }>(`${ADMIN_PRACTICE_BASE}/questions/${questionId}`),

  duplicateQuestion: (questionId: number, data?: { newCode?: string }) =>
    api.post<PracticeAdminQuestion>(`${ADMIN_PRACTICE_BASE}/questions/${questionId}/duplicate`, data || {}),

  reorderQuestions: (exerciseSetId: number, items: Array<{ id: number; sortOrder: number }>) =>
    api.put<{ success: boolean; message: string }>(
      `${ADMIN_PRACTICE_BASE}/exercise-sets/${exerciseSetId}/questions/reorder`,
      { items }
    ),
};
