import fs from 'node:fs';
import path from 'node:path';

type JsonObject = Record<string, unknown>;
type Issue = { file: string; id: string; field: string; value: unknown };
type RegisteredRecord = { file: string; value: JsonObject; parentId?: string };

const root = path.resolve(__dirname, '../seed-data');
const issues: Issue[] = [];
const records = new Map<string, Map<string, RegisteredRecord>>();
const files: string[] = [];
const contentIdFields: Record<string, string> = {
  VOCABULARY: 'vocabulary_id',
  DIALOGUE: 'dialogue_id',
  GRAMMAR: 'grammar_id',
  HANZI: 'hanzi_id',
  PHONETIC: 'phonetic_id',
  SENTENCE_PATTERN: 'sentence_pattern_id',
  EXERCISE: 'exercise_id',
};
const referenceContentTypes: Record<string, string> = {
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

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function issue(file: string, id: unknown, field: string, value: unknown): void {
  issues.push({ file: path.relative(root, file), id: String(id ?? '(unknown)'), field, value });
}

function walk(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) files.push(full);
  }
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as unknown;
  } catch (error) {
    issue(file, '(file)', 'json', error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

function add(kind: string, id: unknown, file: string, value: JsonObject, parentId?: string): void {
  if (typeof id !== 'string' || !id.trim()) {
    issue(file, '(unknown)', 'id', id);
    return;
  }
  let bucket = records.get(kind);
  if (!bucket) records.set(kind, (bucket = new Map()));
  if (bucket.has(id)) issue(file, id, 'id', `duplicate; first defined in ${bucket.get(id)!.file}`);
  else bucket.set(id, { file, value, parentId });
}

function contentKindFromFile(file: string): string | null {
  const name = path.basename(file).toLowerCase();
  if (name.includes('vocabular')) return 'VOCABULARY';
  if (name.includes('grammar')) return 'GRAMMAR';
  if (name.includes('sentence-pattern')) return 'SENTENCE_PATTERN';
  if (name.includes('hanzi')) return 'HANZI';
  if (name.includes('phonetic')) return 'PHONETIC';
  if (name.includes('dialogue')) return 'DIALOGUE';
  if (name === 'exercise.json') return 'EXERCISE';
  return null;
}

function registerContentArray(data: unknown, file: string): void {
  if (!Array.isArray(data)) return;
  const kind = contentKindFromFile(file);
  if (!kind) return;
  const idField = contentIdFields[kind];

  for (const item of data) {
    if (!isObject(item)) {
      issue(file, '(unknown)', 'record', item);
      continue;
    }

    const id = item[idField];
    add(kind, id, file, item);
    if (Array.isArray(item.examples)) {
      for (const example of item.examples) {
        if (!isObject(example)) {
          issue(file, id, 'examples', example);
          continue;
        }
        add(`${kind}_EXAMPLE`, example.example_id, file, example, typeof id === 'string' ? id : undefined);
      }
    }
  }
}

function hasNestedId(value: unknown, id: string): boolean {
  if (Array.isArray(value)) return value.some((item) => hasNestedId(item, id));
  if (!isObject(value)) return false;
  for (const [key, child] of Object.entries(value)) {
    if (['example_id', 'item_id', 'turn_id', 'rule_id', 'syllable_id'].includes(key) && child === id) return true;
    if (hasNestedId(child, id)) return true;
  }
  return false;
}

function validateReference(
  reference: JsonObject,
  file: string,
  ownerId: string,
  requireCanonicalType: boolean,
  validateItemId: boolean,
): void {
  const rawType = reference.content_type;
  const contentType = typeof rawType === 'string' ? referenceContentTypes[rawType] : undefined;
  const contentId = reference.content_id;

  if (!contentType) {
    issue(file, ownerId, 'content_type', rawType);
    return;
  }
  if (requireCanonicalType && rawType !== contentType) {
    issue(file, ownerId, 'content_type', `must use ${contentType}, found ${rawType}`);
  }
  if (typeof contentId !== 'string' || !records.get(contentType)?.has(contentId)) {
    issue(file, ownerId, 'content_id', `${rawType}:${String(contentId)}`);
    return;
  }

  const target = records.get(contentType)!.get(contentId)!;
  if (typeof reference.field === 'string' && !(reference.field in target.value)) {
    issue(file, ownerId, 'content_reference.field', `${contentId}.${reference.field}`);
  }
  if (validateItemId && reference.item_id !== null && reference.item_id !== undefined) {
    const itemId = reference.item_id;
    if (typeof itemId !== 'string' || !hasNestedId(target.value, itemId)) {
      issue(file, ownerId, 'item_id', `${contentType}:${contentId} does not contain ${String(itemId)}`);
    }
  }
}

function collectNestedReferences(value: unknown, file: string, ownerId: string): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectNestedReferences(item, file, ownerId));
    return;
  }
  if (!isObject(value)) return;

  for (const [key, child] of Object.entries(value)) {
    if (key === 'content_reference' && isObject(child)) {
      validateReference(child, file, ownerId, true, false);
    } else if (key === 'content_references' && Array.isArray(child)) {
      for (const reference of child) {
        if (!isObject(reference)) {
          issue(file, ownerId, 'content_references', reference);
          continue;
        }
        validateReference(reference, file, ownerId, true, true);
      }
    } else {
      collectNestedReferences(child, file, ownerId);
    }
  }
}

function validateExerciseItems(exercise: JsonObject, file: string, id: string): void {
  for (const field of ['items', 'options', 'left_items', 'right_items']) {
    const entries = exercise[field];
    if (!Array.isArray(entries)) continue;
    const key = field === 'options' ? 'option_id' : 'item_id';
    const seen = new Set<string>();
    for (const entry of entries) {
      if (!isObject(entry)) continue;
      const itemId = entry[key];
      if (typeof itemId !== 'string') continue;
      if (seen.has(itemId)) issue(file, id, `${field}.${key}`, `duplicate ${itemId}`);
      seen.add(itemId);
    }
  }
}

function validateExerciseAnswers(filesByName: Map<string, string>): void {
  const exerciseFile = filesByName.get('exercise.json');
  const answerFile = filesByName.get('exercise-answers.json');
  if (!exerciseFile || !answerFile) {
    issue(root, '(exercise answers)', 'files', 'Exercise.json or exercise-answers.json is missing');
    return;
  }

  const exerciseData = readJson(exerciseFile);
  const answerData = readJson(answerFile);
  if (!Array.isArray(exerciseData) || !Array.isArray(answerData)) {
    issue(answerFile, '(exercise answers)', 'structure', 'expected arrays');
    return;
  }

  const exercises = new Map<string, JsonObject>();
  for (const record of exerciseData) {
    if (!isObject(record) || typeof record.exercise_id !== 'string') continue;
    exercises.set(record.exercise_id, record);
    validateExerciseItems(record, exerciseFile, record.exercise_id);
  }

  const answers = new Map<string, JsonObject>();
  const validAnswerTypes: Record<string, string[]> = {
    AUDIO_MULTIPLE_CHOICE: ['SINGLE_CHOICE'],
    IMAGE_MULTIPLE_CHOICE: ['SINGLE_CHOICE'],
    MULTIPLE_CHOICE: ['SINGLE_CHOICE'],
    FILL_BLANK_CHOICE: ['SINGLE_CHOICE'],
    SENTENCE_ORDERING: ['ORDERED_ITEMS'],
    MATCHING: ['MATCHING'],
  };

  for (const answer of answerData) {
    if (!isObject(answer) || typeof answer.exercise_id !== 'string') {
      issue(answerFile, '(unknown)', 'exercise_id', answer);
      continue;
    }
    const id = answer.exercise_id;
    const exercise = exercises.get(id);
    if (!exercise) {
      issue(answerFile, id, 'exercise_id', 'has no matching Exercise.json record');
      continue;
    }
    if (answers.has(id)) issue(answerFile, id, 'exercise_id', 'duplicate answer');
    answers.set(id, answer);

    const acceptedTypes = typeof exercise.exercise_type === 'string'
      ? validAnswerTypes[exercise.exercise_type]
      : undefined;
    if (!acceptedTypes?.includes(String(answer.answer_type))) {
      issue(answerFile, id, 'answer_type', `${String(answer.answer_type)} does not match ${String(exercise.exercise_type)}`);
    }

    const correctData = isObject(answer.correct_data) ? answer.correct_data : {};
    if (typeof correctData.correct_option_id === 'string') {
      const options = Array.isArray(exercise.options) ? exercise.options : [];
      if (!options.some((option) => isObject(option) && option.option_id === correctData.correct_option_id)) {
        issue(answerFile, id, 'correct_option_id', correctData.correct_option_id);
      }
    }
    if (Array.isArray(correctData.correct_item_ids)) {
      const items = Array.isArray(exercise.items) ? exercise.items : [];
      const itemIds = new Set(items.filter(isObject).map((item) => item.item_id));
      for (const itemId of correctData.correct_item_ids) {
        if (typeof itemId !== 'string' || !itemIds.has(itemId)) {
          issue(answerFile, id, 'correct_item_ids', itemId);
        }
      }
    }
    if (Array.isArray(correctData.correct_pairs)) {
      const left = Array.isArray(exercise.left_items) ? exercise.left_items : [];
      const right = Array.isArray(exercise.right_items) ? exercise.right_items : [];
      const leftIds = new Set(left.filter(isObject).map((item) => item.item_id));
      const rightIds = new Set(right.filter(isObject).map((item) => item.item_id));
      for (const pair of correctData.correct_pairs) {
        if (!isObject(pair) || !leftIds.has(pair.left_item_id) || !rightIds.has(pair.right_item_id)) {
          issue(answerFile, id, 'correct_pairs', pair);
        }
      }
    }
  }

  for (const id of exercises.keys()) {
    if (!answers.has(id)) issue(exerciseFile, id, 'answer', 'exercise has no answer record');
  }
}

function validateUnits(unitFiles: string[]): void {
  const lessonIds = new Set<string>();
  const blockIds = new Set<string>();
  const expectedBlockCounts: Record<number, number> = { 1: 5, 2: 6, 3: 6 };

  for (const file of unitFiles.sort((a, b) => {
    const aIndex = Number(path.basename(a).match(/^unit(\d+)\.json$/i)?.[1] ?? 0);
    const bIndex = Number(path.basename(b).match(/^unit(\d+)\.json$/i)?.[1] ?? 0);
    return aIndex - bIndex;
  })) {
    const unit = readJson(file);
    if (!isObject(unit)) continue;
    const id = typeof unit.chapter_id === 'string' ? unit.chapter_id : '(unit)';
    const unitNumber = Number(path.basename(file).match(/^unit(\d+)\.json$/i)?.[1] ?? 0);
    if (unit.order_index !== unitNumber) issue(file, id, 'order_index', `expected ${unitNumber}, found ${String(unit.order_index)}`);
    if (!Array.isArray(unit.lessons) || unit.lessons.length < 2 || unit.lessons.length > 3) {
      issue(file, id, 'lessons', 'each Unit must have 2 or 3 Lessons');
      continue;
    }

    let blockCount = 0;
    for (const [lessonIndex, lesson] of unit.lessons.entries()) {
      if (!isObject(lesson)) {
        issue(file, id, 'lessons', lesson);
        continue;
      }
      const lessonId = typeof lesson.lesson_id === 'string' ? lesson.lesson_id : '(lesson)';
      if (lessonIds.has(lessonId)) issue(file, lessonId, 'lesson_id', 'duplicate across Units');
      lessonIds.add(lessonId);
      if (lesson.order_index !== lessonIndex + 1) {
        issue(file, lessonId, 'order_index', `expected ${lessonIndex + 1}, found ${String(lesson.order_index)}`);
      }
      if (!Array.isArray(lesson.lesson_blocks) || lesson.lesson_blocks.length === 0) {
        issue(file, lessonId, 'lesson_blocks', 'Lesson must contain at least one screen block');
        continue;
      }

      for (const [blockIndex, block] of lesson.lesson_blocks.entries()) {
        if (!isObject(block)) {
          issue(file, lessonId, 'lesson_blocks', block);
          continue;
        }
        blockCount++;
        const blockId = typeof block.lesson_block_id === 'string' ? block.lesson_block_id : '(block)';
        if (blockIds.has(blockId)) issue(file, blockId, 'lesson_block_id', 'duplicate across Units');
        blockIds.add(blockId);
        if (block.order_index !== blockIndex + 1) {
          issue(file, blockId, 'order_index', `expected ${blockIndex + 1}, found ${String(block.order_index)}`);
        }
        if (!Array.isArray(block.content_references)) {
          issue(file, blockId, 'content_references', 'expected an array');
        }
      }
    }

    if (expectedBlockCounts[unitNumber] !== undefined && blockCount !== expectedBlockCounts[unitNumber]) {
      issue(file, id, 'lesson_blocks', `expected ${expectedBlockCounts[unitNumber]} source screens, found ${blockCount}`);
    }
  }
}

walk(root);
const parsed = new Map<string, unknown>();
for (const file of files) parsed.set(file, readJson(file));
for (const [file, data] of parsed) registerContentArray(data, file);

for (const [file, data] of parsed) {
  if (!isObject(data) && !Array.isArray(data)) continue;
  const isUnit = path.basename(file).toLowerCase().match(/^unit\d+\.json$/);
  if (isUnit) collectNestedReferences(data, file, '(unit)');
  else collectNestedReferences(data, file, path.basename(file));
}

const unitFiles = files.filter((file) => /^unit\d+\.json$/i.test(path.basename(file)));
validateUnits(unitFiles);
validateExerciseAnswers(new Map(files.map((file) => [path.basename(file).toLowerCase(), file])));

if (issues.length) {
  for (const item of issues) {
    console.error(`${item.file} | ID=${item.id} | ${item.field} | invalid: ${JSON.stringify(item.value)}`);
  }
  console.error(`Seed data validation failed: ${issues.length} issue(s).`);
  process.exitCode = 1;
} else {
  console.log(`Seed data validation passed (${files.length} JSON files).`);
}
