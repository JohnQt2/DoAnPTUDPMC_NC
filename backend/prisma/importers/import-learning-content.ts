import fs from 'node:fs';
import path from 'node:path';
import { Prisma, PrismaClient, type ContentType } from '@prisma/client';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

type ContentReference = {
  content_type: string;
  content_id: string;
  item_id?: string | null;
};

type Unit = {
  course_id: string;
  chapter_id: string;
  title: string;
  description?: string | null;
  order_index?: number;
  lessons: Array<{
    lesson_id: string;
    title: string;
    order_index: number;
    lesson_blocks: Array<{
      lesson_block_id: string;
      block_type: string;
      order_index: number;
      content_references?: ContentReference[];
    }>;
  }>;
};

type ContentSource = {
  relativePath: string;
  contentType: ContentType;
  idField: string;
};

type LearningContentRecord = {
  contentType: ContentType;
  externalId: string;
  content: JsonObject;
};

type ImportSummary = {
  units: number;
  lessons: number;
  blocks: number;
  contents: number;
  references: number;
};

const dataRoot = path.resolve(__dirname, '../seed-data');
const unitPaths = [
  'Courses/hsk1/unit1.json',
  'Courses/hsk1/unit2.json',
  'Courses/hsk1/unit3.json',
];

const contentSources: ContentSource[] = [
  { relativePath: 'contents/vocabularies.json', contentType: 'VOCABULARY', idField: 'vocabulary_id' },
  { relativePath: 'contents/dialogues.json', contentType: 'DIALOGUE', idField: 'dialogue_id' },
  { relativePath: 'contents/grammars.json', contentType: 'GRAMMAR', idField: 'grammar_id' },
  { relativePath: 'contents/hanzi.json', contentType: 'HANZI', idField: 'hanzi_id' },
  { relativePath: 'contents/phonetics.json', contentType: 'PHONETIC', idField: 'phonetic_id' },
  { relativePath: 'contents/sentence-patterns.json', contentType: 'SENTENCE_PATTERN', idField: 'sentence_pattern_id' },
  { relativePath: 'Exercise/Exercise.json', contentType: 'EXERCISE', idField: 'exercise_id' },
];

const referenceContentTypes: Readonly<Record<string, ContentType>> = {
  VOCABULARY: 'VOCABULARY',
  DIALOGUE: 'DIALOGUE',
  GRAMMAR: 'GRAMMAR',
  GRAMMAR_EXAMPLE: 'GRAMMAR',
  HANZI: 'HANZI',
  PHONETIC: 'PHONETIC',
  SENTENCE_PATTERN: 'SENTENCE_PATTERN',
  SENTENCE_PATTERN_EXAMPLE: 'SENTENCE_PATTERN',
  EXERCISE: 'EXERCISE',
};

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(dataRoot, relativePath), 'utf8')) as T;
}

function contentKey(contentType: ContentType, externalId: string): string {
  return `${contentType}\0${externalId}`;
}

function loadUnits(): Unit[] {
  return unitPaths.map((relativePath) => readJson<Unit>(relativePath));
}

function loadLearningContents(): LearningContentRecord[] {
  const answers = readJson<JsonObject[]>('Exercise/exercise-answers.json');
  const exerciseAnswers = new Map<string, JsonObject>();
  const exercises = readJson<JsonObject[]>('Exercise/Exercise.json');
  const exerciseIds = new Set(
    exercises.map((exercise) => {
      const id = exercise.exercise_id;
      if (typeof id !== 'string' || !id) {
        throw new Error('Exercise.json contains an exercise without a valid exercise_id.');
      }
      return id;
    }),
  );

  for (const answer of answers) {
    const id = answer.exercise_id;
    if (typeof id !== 'string' || !id) {
      throw new Error('exercise-answers.json contains an answer without a valid exercise_id.');
    }
    if (!exerciseIds.has(id)) {
      throw new Error(`Exercise answer references missing exercise: ${id}`);
    }
    if (exerciseAnswers.has(id)) {
      throw new Error(`Duplicate exercise answer found for exercise: ${id}`);
    }
    exerciseAnswers.set(id, answer);
  }

  const records: LearningContentRecord[] = [];
  const seen = new Set<string>();

  for (const source of contentSources) {
    const entries = source.relativePath === 'Exercise/Exercise.json'
      ? exercises
      : readJson<JsonObject[]>(source.relativePath);

    for (const entry of entries) {
      const externalId = entry[source.idField];
      if (typeof externalId !== 'string' || !externalId) {
        throw new Error(`${source.relativePath} contains a record without a valid ${source.idField}.`);
      }

      const key = contentKey(source.contentType, externalId);
      if (seen.has(key)) {
        throw new Error(`Duplicate ${source.contentType} content ID found: ${externalId}`);
      }
      seen.add(key);

      const answer = source.contentType === 'EXERCISE' ? exerciseAnswers.get(externalId) : undefined;
      records.push({
        contentType: source.contentType,
        externalId,
        content: answer ? { ...entry, ...answer } : entry,
      });
    }
  }

  return records;
}

function normalizeContentType(contentType: string): ContentType {
  const normalized = referenceContentTypes[contentType];
  if (!normalized) {
    throw new Error(`Unsupported content_type in LessonBlock reference: ${contentType}`);
  }
  return normalized;
}

function asJsonObject(value: Prisma.JsonValue | undefined): Prisma.InputJsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Prisma.InputJsonObject;
}

export async function importLearningContent(prisma: PrismaClient): Promise<ImportSummary> {
  const units = loadUnits();
  const contents = loadLearningContents();
  const contentIds = new Map<string, number>();
  const summary: ImportSummary = {
    units: 0,
    lessons: 0,
    blocks: 0,
    contents: contents.length,
    references: 0,
  };

  for (const [unitIndex, unit] of units.entries()) {
    const unitSummary = await prisma.$transaction(async (tx) => {
      const courseCode = unit.course_id.toUpperCase();
      const course = await tx.courses.upsert({
        where: { code: courseCode },
        create: {
          code: courseCode,
          title: courseCode,
          level: 'HSK1',
        },
        update: {},
      });

      for (const record of contents) {
        const content = await tx.learningContents.upsert({
          where: {
            content_type_external_id: {
              content_type: record.contentType,
              external_id: record.externalId,
            },
          },
          create: {
            content_type: record.contentType,
            external_id: record.externalId,
            content_json: record.content,
          },
          update: {
            content_json: record.content,
          },
        });
        contentIds.set(contentKey(record.contentType, record.externalId), content.content_id);
      }

      const chapter = await tx.chapters.upsert({
        where: {
          course_id_external_id: {
            course_id: course.course_id,
            external_id: unit.chapter_id,
          },
        },
        create: {
          course_id: course.course_id,
          external_id: unit.chapter_id,
          title: unit.title,
          description: unit.description ?? null,
          order_index: unit.order_index ?? unitIndex + 1,
        },
        update: {
          title: unit.title,
          description: unit.description ?? null,
          order_index: unit.order_index ?? unitIndex + 1,
        },
      });

      let lessonCount = 0;
      let blockCount = 0;
      let referenceCount = 0;

      for (const lessonData of unit.lessons) {
        const lesson = await tx.lessons.upsert({
          where: { external_id: lessonData.lesson_id },
          create: {
            external_id: lessonData.lesson_id,
            chapter_id: chapter.chapter_id,
            title: lessonData.title,
            order_index: lessonData.order_index,
          },
          update: {
            chapter_id: chapter.chapter_id,
            title: lessonData.title,
            order_index: lessonData.order_index,
          },
        });
        lessonCount++;

        for (const blockData of lessonData.lesson_blocks) {
          const previous = await tx.lessonBlocks.findUnique({
            where: { external_id: blockData.lesson_block_id },
          });
          const contentJson = {
            ...asJsonObject(previous?.content_json),
            content_references: blockData.content_references ?? [],
          } satisfies Prisma.InputJsonObject;
          const block = await tx.lessonBlocks.upsert({
            where: { external_id: blockData.lesson_block_id },
            create: {
              external_id: blockData.lesson_block_id,
              lesson_id: lesson.lesson_id,
              block_type: blockData.block_type,
              order_index: blockData.order_index,
              content_json: contentJson,
            },
            update: {
              lesson_id: lesson.lesson_id,
              block_type: blockData.block_type,
              order_index: blockData.order_index,
              content_json: contentJson,
            },
          });
          blockCount++;

          const references = (blockData.content_references ?? []).map((reference, referenceIndex) => {
            const contentType = normalizeContentType(reference.content_type);
            const contentId = contentIds.get(contentKey(contentType, reference.content_id));
            if (contentId === undefined) {
              throw new Error(
                `Missing LearningContents for LessonBlock ${blockData.lesson_block_id}: ` +
                `content_type=${reference.content_type}, content_id=${reference.content_id}`,
              );
            }
            return {
              lesson_block_id: block.block_id,
              content_id: contentId,
              item_id: reference.item_id ?? null,
              order_index: referenceIndex + 1,
            };
          });

          await tx.lessonBlockContentReferences.deleteMany({
            where: { lesson_block_id: block.block_id },
          });
          if (references.length > 0) {
            await tx.lessonBlockContentReferences.createMany({ data: references });
          }
          referenceCount += references.length;
        }
      }

      return { lessonCount, blockCount, referenceCount };
    }, { timeout: 30_000 });

    summary.units++;
    summary.lessons += unitSummary.lessonCount;
    summary.blocks += unitSummary.blockCount;
    summary.references += unitSummary.referenceCount;
  }

  return summary;
}

async function runStandalone(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const summary = await importLearningContent(prisma);
    console.log(
      `Learning content import completed: ${summary.units} units, ${summary.lessons} lessons, ` +
      `${summary.blocks} blocks, ${summary.contents} contents, ${summary.references} references.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runStandalone().catch((error: unknown) => {
    console.error('Learning content import failed:', error);
    process.exitCode = 1;
  });
}
