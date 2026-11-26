import { prisma } from '../shared/database/prisma.client';

interface MigrationOptions {
  actorEmail?: string;
  dryRun?: boolean;
  levelCode?: string;
  lessonNumber?: number;
}

export async function migratePracticeToCms(options: MigrationOptions = {}) {
  const actorEmail = options.actorEmail || process.env.MIGRATION_ACTOR_EMAIL;
  const isDryRun = options.dryRun ?? false;
  const { levelCode, lessonNumber } = options;

  console.log(`\n========================================`);
  console.log(`Starting Practice to CMS Data Migration`);
  console.log(`Dry Run: ${isDryRun}`);
  console.log(`Target: ${levelCode || 'ALL'}${lessonNumber ? ` Lesson ${lessonNumber}` : ''}`);
  console.log(`Actor Email: ${actorEmail || 'NONE'}`);
  console.log(`========================================\n`);

  if (!actorEmail) {
    throw new Error(
      'Actor email must be provided via --actor-email <email> or MIGRATION_ACTOR_EMAIL environment variable.'
    );
  }

  // 1. Validate actor
  const actor = await prisma.users.findUnique({
    where: { email: actorEmail },
  });

  if (!actor) {
    throw new Error(`Actor with email "${actorEmail}" was not found.`);
  }

  if (actor.role !== 'ADMIN') {
    throw new Error(`Actor "${actorEmail}" has role "${actor.role}", but ADMIN role is required.`);
  }

  if (actor.status !== 'ACTIVE') {
    throw new Error(`Actor "${actorEmail}" is not ACTIVE (status: "${actor.status}").`);
  }

  console.log(`✓ Validated Actor: ID ${actor.user_id} (${actor.email}), Role: ${actor.role}, Status: ${actor.status}`);

  // 2. Fetch existing PracticeLevels and PracticeLessons
  const levels = await prisma.practiceLevel.findMany({
    where: levelCode ? { code: levelCode.toUpperCase() } : undefined,
    include: {
      lessons: {
        where: lessonNumber ? { lessonNumber } : undefined,
        orderBy: { lessonNumber: 'asc' },
        include: {
          exerciseSets: {
            include: {
              questions: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${levels.length} level(s) in database.`);

  const summary = {
    collectionsCreated: 0,
    collectionsExisting: 0,
    versionsCreated: 0,
    versionsExisting: 0,
    exerciseSetsLinked: 0,
    attemptsLinked: 0,
    attemptsSnapshotGenerated: 0,
  };

  const timestamp = new Date();

  // Run in interactive transaction (or simulated if dryRun)
  await prisma.$transaction(async (tx) => {
    for (const level of levels) {
      console.log(`\nProcessing Level: ${level.code} (${level.name})...`);

      for (const lesson of level.lessons) {
        const isMock = lesson.lessonNumber === 16;
        const category = isMock ? 'MOCK_EXAM' : 'WORKBOOK_LESSON';
        const collectionCode = isMock
          ? `${level.code}-MOCK-01`
          : `${level.code}-WORKBOOK-L${String(lesson.lessonNumber).padStart(2, '0')}`;

        // Kiểm tra xem bài học đã có câu hỏi nào chưa (ví dụ Bài 3 hoặc Bài thi mẫu)
        const hasQuestions = lesson.exerciseSets.some((s) => s.questions.length > 0);
        // Content remains unpublished unless the source lesson is approved and has questions.
        const targetStatus = hasQuestions && lesson.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

        // Check if collection already exists
        let collection = await tx.practiceCollection.findUnique({
          where: { code: collectionCode },
        });

        if (!collection) {
          if (!isDryRun) {
            collection = await tx.practiceCollection.create({
              data: {
                levelId: level.id,
                code: collectionCode,
                category,
                titleZh: lesson.titleZh,
                titlePinyin: lesson.titlePinyin,
                titleVi: lesson.titleVi,
                description: lesson.description,
                orderIndex: lesson.sortOrder,
                status: targetStatus,
                createdById: actor.user_id,
                updatedById: actor.user_id,
                reviewedById: targetStatus === 'PUBLISHED' ? actor.user_id : null,
                reviewedAt: targetStatus === 'PUBLISHED' ? timestamp : null,
                publishedAt: targetStatus === 'PUBLISHED' ? timestamp : null,
              },
            });
          }
          summary.collectionsCreated++;
          console.log(`  + Created Collection: ${collectionCode} (Status: ${targetStatus})`);
        } else {
          summary.collectionsExisting++;
          console.log(`  ~ Existing Collection: ${collectionCode} (ID: ${collection.id})`);
        }

        if (targetStatus === 'DRAFT' && collection?.status === 'PUBLISHED') {
          throw new Error(
            `Refusing to attach unreviewed content to published collection ${collectionCode}.`
          );
        }

        const collectionId = collection?.id ?? 0;

        // Check Version 1
        let version = null;
        if (collectionId) {
          version = await tx.practiceCollectionVersion.findUnique({
            where: {
              collectionId_versionNumber: {
                collectionId,
                versionNumber: 1,
              },
            },
          });
        }

        if (!version) {
          if (!isDryRun && collection) {
            version = await tx.practiceCollectionVersion.create({
              data: {
                collectionId: collection.id,
                versionNumber: 1,
                status: targetStatus,
                changeSummary: 'Initial migration from PracticeLesson to Collection & Versioning system',
                createdById: actor.user_id,
                updatedById: actor.user_id,
                reviewedById: targetStatus === 'PUBLISHED' ? actor.user_id : null,
                reviewedAt: targetStatus === 'PUBLISHED' ? timestamp : null,
                publishedAt: targetStatus === 'PUBLISHED' ? timestamp : null,
              },
            });

            // If PUBLISHED, set currentVersionId on collection
            if (targetStatus === 'PUBLISHED') {
              await tx.practiceCollection.update({
                where: { id: collection.id },
                data: { currentVersionId: version.id },
              });
            }
          }
          summary.versionsCreated++;
          console.log(`    + Created Version 1 for ${collectionCode} (Status: ${targetStatus})`);
        } else {
          summary.versionsExisting++;
          console.log(`    ~ Existing Version 1 (ID: ${version.id}) for ${collectionCode}`);
        }

        if (targetStatus === 'DRAFT' && version?.status === 'PUBLISHED') {
          throw new Error(
            `Refusing to attach unreviewed content to published version ${version.id}.`
          );
        }

        const versionId = version?.id;

        // Link ExerciseSets of this lesson to Version 1
        if (versionId && lesson.exerciseSets.length > 0) {
          for (const set of lesson.exerciseSets) {
            if (!set.versionId) {
              if (!isDryRun) {
                await tx.practiceExerciseSet.update({
                  where: { id: set.id },
                  data: { versionId },
                });
              }
              summary.exerciseSetsLinked++;
              console.log(`      * Linked ExerciseSet ID ${set.id} (${set.code}) -> Version ${versionId}`);
            }
          }
        }
      }
    }

    // 3. Backfill PracticeAttempt with versionId and snapshotData
    const targetLessonIds = levels.flatMap((level) => level.lessons.map((lesson) => lesson.id));
    const attempts = await tx.practiceAttempt.findMany({
      where: levelCode || lessonNumber
        ? { exerciseSet: { lessonId: { in: targetLessonIds } } }
        : undefined,
      include: {
        exerciseSet: {
          include: {
            questions: true,
            version: {
              include: {
                collection: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    console.log(`\nChecking ${attempts.length} PracticeAttempt(s)...`);

    for (const attempt of attempts) {
      const targetVersionId = attempt.versionId || attempt.exerciseSet?.versionId;

      let snapshotString = attempt.snapshotData;
      let shouldUpdateSnapshot = false;

      if (!snapshotString && attempt.exerciseSet) {
        const snapshotPayload = {
          attemptId: attempt.id,
          userId: attempt.userId,
          status: attempt.status,
          totalScore: attempt.totalScore,
          earnedScore: attempt.earnedScore,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          collection: attempt.exerciseSet.version?.collection
            ? {
                id: attempt.exerciseSet.version.collection.id,
                code: attempt.exerciseSet.version.collection.code,
                titleZh: attempt.exerciseSet.version.collection.titleZh,
                titleVi: attempt.exerciseSet.version.collection.titleVi,
              }
            : null,
          version: attempt.exerciseSet.version
            ? {
                id: attempt.exerciseSet.version.id,
                versionNumber: attempt.exerciseSet.version.versionNumber,
                status: attempt.exerciseSet.version.status,
              }
            : null,
          exerciseSet: {
            id: attempt.exerciseSet.id,
            code: attempt.exerciseSet.code,
            skill: attempt.exerciseSet.skill,
            titleZh: attempt.exerciseSet.titleZh,
            titleVi: attempt.exerciseSet.titleVi,
          },
          questions: attempt.exerciseSet.questions.map((q) => ({
            id: q.id,
            code: q.code,
            type: q.type,
            score: q.score,
            sortOrder: q.sortOrder,
            prompt: q.prompt,
            answer: q.answer,
            explanation: q.explanation,
          })),
          answers: attempt.answers.map((a) => ({
            id: a.id,
            questionId: a.questionId,
            userAnswer: a.answer,
            isCorrect: a.isCorrect,
            earnedScore: a.earnedScore,
            answeredAt: a.answeredAt,
          })),
        };

        snapshotString = JSON.stringify(snapshotPayload);
        shouldUpdateSnapshot = true;
      }

      if ((targetVersionId && attempt.versionId !== targetVersionId) || shouldUpdateSnapshot) {
        if (!isDryRun) {
          await tx.practiceAttempt.update({
            where: { id: attempt.id },
            data: {
              versionId: targetVersionId || undefined,
              snapshotData: snapshotString || undefined,
            },
          });
        }

        if (targetVersionId && attempt.versionId !== targetVersionId) {
          summary.attemptsLinked++;
        }
        if (shouldUpdateSnapshot) {
          summary.attemptsSnapshotGenerated++;
        }
        console.log(
          `  * Backfilled Attempt ID ${attempt.id} (versionId: ${targetVersionId}, snapshot: ${shouldUpdateSnapshot})`
        );
      }
    }

    // 4. Audit Log entry
    if (!isDryRun) {
      await tx.auditLogs.create({
        data: {
          user_id: actor.user_id,
          action_type: 'MIGRATE_PRACTICE_TO_CMS',
          target_entity: 'PracticeCollection',
          target_id: '0',
          new_value: JSON.stringify({
            timestamp,
            summary,
            actor: {
              id: actor.user_id,
              email: actor.email,
            },
          }),
        },
      });
      console.log(`\n✓ Recorded Audit Log entry for MIGRATE_PRACTICE_TO_CMS.`);
    }

    if (isDryRun) {
      console.log(`\n[DRY RUN] Rolled back all simulated changes.`);
      throw new Error('DRY_RUN_ROLLBACK');
    }
  }).catch((err) => {
    if (err.message === 'DRY_RUN_ROLLBACK') {
      console.log(`DRY RUN completed successfully without writing to database.`);
      return;
    }
    throw err;
  });

  console.log(`\n========================================`);
  console.log(`Migration Summary:`);
  console.log(`- Collections created: ${summary.collectionsCreated}`);
  console.log(`- Collections existing: ${summary.collectionsExisting}`);
  console.log(`- Versions created: ${summary.versionsCreated}`);
  console.log(`- Versions existing: ${summary.versionsExisting}`);
  console.log(`- ExerciseSets linked: ${summary.exerciseSetsLinked}`);
  console.log(`- Attempts linked: ${summary.attemptsLinked}`);
  console.log(`- Attempts snapshots generated: ${summary.attemptsSnapshotGenerated}`);
  console.log(`========================================\n`);

  return summary;
}

// CLI Execution entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  let actorEmail: string | undefined;
  let dryRun = false;
  let levelCode: string | undefined;
  let lessonNumber: number | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--actor-email' && args[i + 1]) {
      actorEmail = args[i + 1];
      i++;
    } else if (args[i] === '--level-code' && args[i + 1]) {
      levelCode = args[i + 1];
      i++;
    } else if (args[i] === '--lesson' && args[i + 1]) {
      lessonNumber = Number(args[i + 1]);
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  migratePracticeToCms({ actorEmail, dryRun, levelCode, lessonNumber })
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
