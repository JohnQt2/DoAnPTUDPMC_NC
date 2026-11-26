import fs from 'fs';
import path from 'path';
import { prisma } from '../shared/database/prisma.client';

interface ImportStats {
  created: number;
  updated: number;
  unchanged: number;
  failed: number;
  byEntity: Record<string, { created: number; updated: number; unchanged: number }>;
}

type ImportEntity = 'levels' | 'lessons' | 'exerciseSets' | 'questions';

function trackChange(
  stats: ImportStats,
  entity: ImportEntity,
  change: 'created' | 'updated' | 'unchanged'
) {
  stats[change]++;
  stats.byEntity[entity][change]++;
}

function matchesData(record: Record<string, any>, data: Record<string, any>) {
  return Object.entries(data).every(([key, value]) => JSON.stringify(record[key]) === JSON.stringify(value));
}

export async function importPracticeData(options: {
  dryRun?: boolean;
  targetLevel?: string;
  targetLessonNumber?: number;
} = {}) {
  const { dryRun = false, targetLevel = 'HSK1', targetLessonNumber } = options;
  console.log(`\n===============================================================`);
  console.log(`🚀 STARTING PRACTICE DATA IMPORTER (Dry-Run: ${dryRun ? 'YES' : 'NO'}, Target: ${targetLevel})`);
  console.log(`===============================================================\n`);

  const stats: ImportStats = {
    created: 0,
    updated: 0,
    unchanged: 0,
    failed: 0,
    byEntity: {
      levels: { created: 0, updated: 0, unchanged: 0 },
      lessons: { created: 0, updated: 0, unchanged: 0 },
      exerciseSets: { created: 0, updated: 0, unchanged: 0 },
      questions: { created: 0, updated: 0, unchanged: 0 },
    },
  };

  const baseDir = path.resolve(__dirname, '../../../practice-data');
  const levelDir = path.join(baseDir, targetLevel.toLowerCase());
  const manifestPath = path.join(levelDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const lessonsDir = path.join(levelDir, 'lessons');

  const selectedLessons = targetLessonNumber
    ? manifest.lessons.filter((item: any) => item.lessonNumber === targetLessonNumber)
    : manifest.lessons;
  if (targetLessonNumber && selectedLessons.length === 0) {
    throw new Error(`Lesson ${targetLessonNumber} is not present in ${manifest.levelCode} manifest.`);
  }

  const allowedQuestionTypes = new Set([
    'TRUE_FALSE',
    'SINGLE_CHOICE',
    'IMAGE_CHOICE',
    'LISTEN_AND_CHOOSE',
    'TONE_SELECTION',
    'CHARACTER_WRITING',
    'TEXT_INPUT',
  ]);
  const seenCodes = new Set<string>();
  const publicMediaDir = path.resolve(__dirname, '../../public');
  const audioDir = path.join(publicMediaDir, 'media', 'practice', targetLevel.toLowerCase(), 'audio');
  for (const item of selectedLessons) {
    const lessonFileName = `lesson-${String(item.lessonNumber).padStart(2, '0')}.json`;
    const lessonFilePath = path.join(lessonsDir, lessonFileName);
    if (!fs.existsSync(lessonFilePath)) continue;
    const lessonData = JSON.parse(fs.readFileSync(lessonFilePath, 'utf-8'));
    if (lessonData.levelCode !== manifest.levelCode || lessonData.lessonNumber !== item.lessonNumber) {
      throw new Error(`Lesson identity mismatch in ${lessonFileName}.`);
    }

    for (const set of lessonData.exerciseSets || []) {
      if (!set.code || seenCodes.has(set.code)) throw new Error(`Duplicate or missing exercise-set code: ${set.code || '(empty)'}`);
      seenCodes.add(set.code);
      for (const question of set.questions || []) {
        if (!question.code || seenCodes.has(question.code)) throw new Error(`Duplicate or missing question code: ${question.code || '(empty)'}`);
        seenCodes.add(question.code);
        if (!allowedQuestionTypes.has(question.type)) {
          throw new Error(`Unsupported question type "${question.type}" in ${question.code}.`);
        }
        if (!['VERIFIED', 'NEEDS_REVIEW'].includes(question.verificationStatus)) {
          throw new Error(`Missing or invalid verificationStatus in ${question.code}.`);
        }

        if (question.sourceAudio) {
          const audioPath = path.resolve(audioDir, question.sourceAudio);
          if (!audioPath.startsWith(`${audioDir}${path.sep}`) || !fs.existsSync(audioPath) || fs.statSync(audioPath).size === 0) {
            throw new Error(`Missing or invalid source audio "${question.sourceAudio}" in ${question.code}.`);
          }
        }

        const checkMedia = (value: any, field: string) => {
          if (Array.isArray(value)) {
            value.forEach((itemValue) => checkMedia(itemValue, field));
          } else if (value && typeof value === 'object') {
            Object.entries(value).forEach(([key, nestedValue]) => checkMedia(nestedValue, key));
          } else if (typeof value === 'string' && (value.startsWith('/media/') || field === 'audioUrl' || field === 'imageUrl')) {
            if (!value.startsWith('/media/practice/')) {
              throw new Error(`Unsupported media path "${value}" in ${question.code}.`);
            }
            const resolved = path.resolve(publicMediaDir, value.slice(1));
            if (!resolved.startsWith(`${publicMediaDir}${path.sep}`) || !fs.existsSync(resolved) || fs.statSync(resolved).size === 0) {
              throw new Error(`Missing or invalid media "${value}" in ${question.code}.`);
            }
          }
        };
        checkMedia(question.prompt, 'prompt');
      }
      if (set.audioUrl) {
        const audioPath = path.resolve(publicMediaDir, set.audioUrl.slice(1));
        if (
          !set.audioUrl.startsWith('/media/practice/') ||
          !audioPath.startsWith(`${publicMediaDir}${path.sep}`) ||
          !fs.existsSync(audioPath) ||
          fs.statSync(audioPath).size === 0
        ) {
          throw new Error(`Missing or invalid exercise-set audio "${set.audioUrl}" in ${set.code}.`);
        }
      }
    }
  }

  // 1. PracticeLevel
  console.log(`[Level] Processing Level: ${manifest.levelCode} - ${manifest.levelName}`);
  let levelRecord: any = null;
  const levelData = {
    name: manifest.levelName,
    description: manifest.description,
  };
  const existingLevel = await prisma.practiceLevel.findUnique({ where: { code: manifest.levelCode } });
  if (!existingLevel) {
    trackChange(stats, 'levels', 'created');
    if (!dryRun) {
      levelRecord = await prisma.practiceLevel.create({
        data: {
          code: manifest.levelCode,
          ...levelData,
          sortOrder: 1,
          status: 'PUBLISHED',
          isPublished: true,
        },
      });
    }
  } else if (matchesData(existingLevel, levelData)) {
    levelRecord = existingLevel;
    trackChange(stats, 'levels', 'unchanged');
  } else {
    trackChange(stats, 'levels', 'updated');
    if (!dryRun) {
      levelRecord = await prisma.practiceLevel.update({
        where: { id: existingLevel.id },
        data: levelData,
      });
    } else {
      levelRecord = existingLevel;
    }
  }

  // 2. Iterate manifest lessons
  for (const item of selectedLessons) {
    const lessonFileName = `lesson-${String(item.lessonNumber).padStart(2, '0')}.json`;
    const lessonFilePath = path.join(lessonsDir, lessonFileName);

    const hasDetailedFile = fs.existsSync(lessonFilePath);
    const lessonData = hasDetailedFile
      ? JSON.parse(fs.readFileSync(lessonFilePath, 'utf-8'))
      : {
          levelCode: manifest.levelCode,
          lessonNumber: item.lessonNumber,
          titleZh: item.titleZh,
          titlePinyin: item.titlePinyin,
          titleVi: item.titleVi,
          exerciseSets: [],
        };

    const status = item.status === 'VERIFIED_READY' ? 'PUBLISHED' : 'NEEDS_REVIEW';
    const isPublished = status === 'PUBLISHED';

    console.log(`  -> [Lesson ${item.lessonNumber}] ${item.titleZh} (${item.titleVi || ''}) [${status}]`);

    let dbLesson: any = null;
    if (levelRecord || dryRun) {
      const lessonWhere = {
        levelId_lessonNumber: {
          levelId: levelRecord?.id,
          lessonNumber: item.lessonNumber,
        },
      };
      const existingLesson = levelRecord
        ? await prisma.practiceLesson.findUnique({ where: lessonWhere })
        : null;
      const lessonFields = {
        titleZh: item.titleZh,
        titlePinyin: item.titlePinyin || null,
        titleVi: item.titleVi || null,
        sortOrder: item.lessonNumber,
        status,
        isPublished,
      };
      if (!existingLesson) {
        trackChange(stats, 'lessons', 'created');
        if (!dryRun && levelRecord) {
          dbLesson = await prisma.practiceLesson.create({
            data: {
              levelId: levelRecord.id,
              lessonNumber: item.lessonNumber,
              ...lessonFields,
            },
          });
        }
      } else if (matchesData(existingLesson, lessonFields)) {
        dbLesson = existingLesson;
        trackChange(stats, 'lessons', 'unchanged');
      } else {
        trackChange(stats, 'lessons', 'updated');
        if (!dryRun) {
          dbLesson = await prisma.practiceLesson.update({
            where: { id: existingLesson.id },
            data: lessonFields,
          });
        } else {
          dbLesson = existingLesson;
        }
      }
    } else {
      trackChange(stats, 'lessons', 'created');
    }

    // 3. Upsert Exercise Sets & Questions for detailed lessons
    if (lessonData.exerciseSets && lessonData.exerciseSets.length > 0) {
      for (const [sIdx, es] of lessonData.exerciseSets.entries()) {
        console.log(`     => [ExerciseSet] ${es.code} - ${es.titleZh} (${es.skill}) [${es.questions?.length || 0} questions]`);

        let dbSet: any = null;
        if (dbLesson || dryRun) {
          const setFields = {
            lessonId: dbLesson?.id,
            skill: es.skill,
            titleZh: es.titleZh,
            titleVi: es.titleVi || null,
            instructions: es.instructions || null,
            sortOrder: sIdx + 1,
            status,
            isPublished,
            estimatedMinutes: es.estimatedMinutes || 15,
            audioUrl: es.audioUrl || null,
          };
          const existingSet = await prisma.practiceExerciseSet.findUnique({ where: { code: es.code } });
          if (!existingSet) {
            trackChange(stats, 'exerciseSets', 'created');
            if (!dryRun && dbLesson) {
              dbSet = await prisma.practiceExerciseSet.create({
                data: { code: es.code, ...setFields, lessonId: dbLesson.id },
              });
            }
          } else if (matchesData(existingSet, setFields)) {
            dbSet = existingSet;
            trackChange(stats, 'exerciseSets', 'unchanged');
          } else {
            trackChange(stats, 'exerciseSets', 'updated');
            if (!dryRun) {
              dbSet = await prisma.practiceExerciseSet.update({
                where: { id: existingSet.id },
                data: { ...setFields, lessonId: dbLesson?.id ?? existingSet.lessonId },
              });
            } else {
              dbSet = existingSet;
            }
          }
        } else {
          trackChange(stats, 'exerciseSets', 'created');
        }

        if (es.questions && es.questions.length > 0) {
          for (const [qIdx, q] of es.questions.entries()) {
            const questionFields = {
              exerciseSetId: dbSet?.id,
              type: q.type,
              prompt: JSON.stringify(q.prompt),
              answer: JSON.stringify(q.answer),
              explanation: typeof q.explanation === 'object' ? JSON.stringify(q.explanation) : q.explanation,
              score: q.score || 1,
              sortOrder: qIdx + 1,
              status,
              sourcePage: q.sourcePage || null,
              sourceAudio: q.sourceAudio || null,
            };
            const existingQuestion = await prisma.practiceQuestion.findUnique({ where: { code: q.code } });
            if (!existingQuestion) {
              trackChange(stats, 'questions', 'created');
              if (!dryRun && dbSet) {
                await prisma.practiceQuestion.create({
                  data: { code: q.code, ...questionFields, exerciseSetId: dbSet.id },
                });
              }
            } else if (matchesData(existingQuestion, questionFields)) {
              trackChange(stats, 'questions', 'unchanged');
            } else {
              trackChange(stats, 'questions', 'updated');
              if (!dryRun) {
                await prisma.practiceQuestion.update({
                  where: { id: existingQuestion.id },
                  data: { ...questionFields, exerciseSetId: dbSet?.id ?? existingQuestion.exerciseSetId },
                });
              }
            }
          }
        }
      }
    }
  }

  // 4. Upsert Mock Tests as Exercise Sets under a dedicated Mock Test Lesson
  if (!targetLessonNumber && manifest.mockTests && manifest.mockTests.length > 0) {
    for (const mt of manifest.mockTests) {
      console.log(`  -> [Mock Test] ${mt.code}: ${mt.titleZh} (${mt.status})`);
      // We can upsert mock test definition
      if (!dryRun && levelRecord) {
        const mockLesson = await prisma.practiceLesson.upsert({
          where: {
            levelId_lessonNumber: {
              levelId: levelRecord.id,
              lessonNumber: 16, // lesson 16 represents the simulation test
            },
          },
          create: {
            levelId: levelRecord.id,
            lessonNumber: 16,
            titleZh: mt.titleZh,
            titleVi: mt.titleVi,
            sortOrder: 16,
            status: 'NEEDS_REVIEW',
            isPublished: true,
          },
          update: {
            titleZh: mt.titleZh,
            titleVi: mt.titleVi,
          },
        });

        await prisma.practiceExerciseSet.upsert({
          where: { code: mt.code },
          create: {
            lessonId: mockLesson.id,
            code: mt.code,
            skill: 'MOCK_TEST',
            titleZh: mt.titleZh,
            titleVi: mt.titleVi,
            sortOrder: 1,
            status: 'NEEDS_REVIEW',
            isPublished: true,
            estimatedMinutes: 40,
            audioUrl: `/media/practice/hsk1/audio/${mt.audio}`,
          },
          update: {
            titleZh: mt.titleZh,
            titleVi: mt.titleVi,
            audioUrl: `/media/practice/hsk1/audio/${mt.audio}`,
          },
        });
      }
    }
  }

  // Write import report
  const reportPath = path.join(levelDir, 'reports', 'import-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    dryRun,
    targetLevel,
    stats,
  }, null, 2), 'utf-8');

  console.log(`\n===============================================================`);
  console.log(`✅ PRACTICE DATA IMPORT FINISHED`);
  console.log(`   - Level: ${manifest.levelCode}`);
  console.log(`   - Lessons: ${selectedLessons.length}`);
  console.log(`   - Created: ${stats.created}`);
  console.log(`   - Updated: ${stats.updated}`);
  console.log(`   - Unchanged: ${stats.unchanged}`);
  console.log(`   - Failed: ${stats.failed}`);
  console.log(`   - Report saved to: ${reportPath}`);
  console.log(`===============================================================\n`);

  return stats;
}

// CLI runner
if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');
  const lessonIndex = process.argv.indexOf('--lesson');
  const targetLessonNumber = lessonIndex >= 0 ? Number(process.argv[lessonIndex + 1]) : undefined;
  if (targetLessonNumber !== undefined && (!Number.isInteger(targetLessonNumber) || targetLessonNumber < 1)) {
    console.error('Import failed with error: --lesson must be a positive integer.');
    process.exit(1);
  }
  importPracticeData({ dryRun: isDryRun, targetLessonNumber })
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Import failed with error:', err);
      process.exit(1);
    });
}
