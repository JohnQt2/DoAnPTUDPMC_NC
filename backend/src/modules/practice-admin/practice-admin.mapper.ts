import { PracticeCollection, PracticeCollectionVersion, PracticeExerciseSet, PracticeQuestion } from '@prisma/client';

export function mapCollectionSummary(collection: any) {
  return {
    id: collection.id,
    levelId: collection.levelId,
    levelCode: collection.level?.code,
    levelName: collection.level?.name,
    code: collection.code,
    category: collection.category,
    titleZh: collection.titleZh,
    titlePinyin: collection.titlePinyin,
    titleVi: collection.titleVi,
    description: collection.description,
    orderIndex: collection.orderIndex,
    status: collection.status,
    currentVersionId: collection.currentVersionId,
    currentVersionNumber: collection.currentVersion?.versionNumber ?? null,
    createdById: collection.createdById,
    creatorName: collection.createdBy?.display_name || collection.createdBy?.email,
    updatedById: collection.updatedById,
    updaterName: collection.updatedBy?.display_name || collection.updatedBy?.email,
    assignedEditorId: collection.assignedEditorId,
    assignedEditorName: collection.assignedEditor?.display_name || collection.assignedEditor?.email,
    reviewedById: collection.reviewedById,
    reviewerName: collection.reviewedBy?.display_name || collection.reviewedBy?.email,
    reviewedAt: collection.reviewedAt,
    publishedAt: collection.publishedAt,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    versionsCount: collection._count?.versions ?? collection.versions?.length ?? 0,
  };
}

export function mapVersionDetail(version: any) {
  return {
    id: version.id,
    collectionId: version.collectionId,
    collectionCode: version.collection?.code,
    versionNumber: version.versionNumber,
    status: version.status,
    changeSummary: version.changeSummary,
    reviewNotes: version.reviewNotes,
    createdById: version.createdById,
    creatorName: version.createdBy?.display_name || version.createdBy?.email,
    updatedById: version.updatedById,
    updaterName: version.updatedBy?.display_name || version.updatedBy?.email,
    assignedEditorId: version.assignedEditorId,
    assignedEditorName: version.assignedEditor?.display_name || version.assignedEditor?.email,
    reviewedById: version.reviewedById,
    reviewerName: version.reviewedBy?.display_name || version.reviewedBy?.email,
    reviewedAt: version.reviewedAt,
    publishedAt: version.publishedAt,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
    exerciseSets: (version.exerciseSets || []).map(mapExerciseSetDetail),
  };
}

export function mapExerciseSetDetail(set: any) {
  return {
    id: set.id,
    lessonId: set.lessonId,
    versionId: set.versionId,
    code: set.code,
    skill: set.skill,
    titleZh: set.titleZh,
    titleVi: set.titleVi,
    instructions: set.instructions,
    sortOrder: set.sortOrder,
    status: set.status,
    isPublished: set.isPublished,
    estimatedMinutes: set.estimatedMinutes,
    audioUrl: set.audioUrl,
    createdAt: set.createdAt,
    updatedAt: set.updatedAt,
    questions: (set.questions || []).map(mapQuestionDetail),
  };
}

export function mapQuestionDetail(q: any) {
  let parsedPrompt = q.prompt;
  try {
    parsedPrompt = JSON.parse(q.prompt);
  } catch {}

  let parsedAnswer = q.answer;
  try {
    parsedAnswer = JSON.parse(q.answer);
  } catch {}

  let parsedExplanation = q.explanation;
  if (q.explanation) {
    try {
      parsedExplanation = JSON.parse(q.explanation);
    } catch {}
  }

  return {
    id: q.id,
    exerciseSetId: q.exerciseSetId,
    code: q.code,
    type: q.type,
    prompt: parsedPrompt,
    answer: parsedAnswer,
    explanation: parsedExplanation,
    score: q.score,
    sortOrder: q.sortOrder,
    status: q.status,
    sourcePage: q.sourcePage,
    sourceAudio: q.sourceAudio,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  };
}
