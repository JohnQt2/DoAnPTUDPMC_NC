/**
 * seed.ts — Idempotent seed script for HSK 1-6 curriculum content.
 * Chạy: npm run db:seed  (hoặc: npx tsx prisma/seed.ts)
 * Idempotent: chạy lại nhiều lần không sinh dữ liệu trùng lặp (upsert).
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { runComprehensiveHskSeed } from './seed-hsk-full';

const prisma = new PrismaClient();

const SEED_DATA_DIR = path.join(__dirname, 'seed-data');
const CONTENTS_DIR = path.join(SEED_DATA_DIR, 'contents');
const COURSES_DIR = path.join(SEED_DATA_DIR, 'Courses');
const EXERCISE_DIR = path.join(SEED_DATA_DIR, 'Exercise');

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

function safeJson(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function deriveHskLevel(id: string): string {
  const match = id.match(/^(hsk\d)/i);
  if (match) return match[1].toUpperCase();
  return 'HSK1';
}

// ─────────────────────────────────────────────
//  PHASE 0: Seed admin users (from original seed)
// ─────────────────────────────────────────────
async function seedUsers() {
  console.log('  → Seeding default users...');
  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  await prisma.users.upsert({
    where: { email: 'admin@chinaeasy.vn' },
    create: {
      email: 'admin@chinaeasy.vn',
      password_hash: defaultPasswordHash,
      display_name: 'Admin ChinaEasy',
      role: 'ADMIN',
      status: 'ACTIVE',
      is_verified: true,
    },
    update: { role: 'ADMIN' },
  });

  await prisma.users.upsert({
    where: { email: 'student@chinaeasy.vn' },
    create: {
      email: 'student@chinaeasy.vn',
      password_hash: defaultPasswordHash,
      display_name: 'Học viên Demo',
      role: 'STUDENT',
      status: 'ACTIVE',
      is_verified: true,
    },
    update: { role: 'STUDENT' },
  });
  console.log('     ✓ Default users seeded.');
}

// ─────────────────────────────────────────────
//  PHASE 1: Seed Atomic Content Repositories
// ─────────────────────────────────────────────

async function seedVocabularies() {
  console.log('  → Seeding Vocabulary...');
  const data = readJson<any[]>(path.join(CONTENTS_DIR, 'vocabularies.json'));
  let count = 0;
  for (const item of data) {
    await prisma.vocabulary.upsert({
      where: { vocabulary_id: item.vocabulary_id },
      create: {
        vocabulary_id: item.vocabulary_id,
        word: item.word,
        pinyin: item.pinyin || '',
        meaning: item.meaning || '',
        word_type: item.word_type || null,
        notes: safeJson(item.notes),
        examples: safeJson(item.examples),
        word_image_path: item.word_image_path || null,
        word_audio_path: item.word_audio_path || null,
        hsk_level: item.hsk_level || deriveHskLevel(item.vocabulary_id),
      },
      update: {
        word: item.word,
        pinyin: item.pinyin || '',
        meaning: item.meaning || '',
        word_type: item.word_type || null,
        notes: safeJson(item.notes),
        examples: safeJson(item.examples),
        word_image_path: item.word_image_path || null,
        word_audio_path: item.word_audio_path || null,
        hsk_level: item.hsk_level || deriveHskLevel(item.vocabulary_id),
      },
    });
    count++;
  }
  console.log(`     ✓ ${count} vocabularies seeded.`);
}

async function seedSentencePatterns() {
  console.log('  → Seeding SentencePattern...');
  const data = readJson<any[]>(path.join(CONTENTS_DIR, 'sentence-patterns.json'));
  let count = 0;
  for (const item of data) {
    await prisma.sentencePattern.upsert({
      where: { sentence_pattern_id: item.sentence_pattern_id },
      create: {
        sentence_pattern_id: item.sentence_pattern_id,
        title: item.title || null,
        pattern: item.pattern || '',
        explanation: item.explanation || null,
        notes: safeJson(item.notes),
        examples: safeJson(item.examples),
      },
      update: {
        title: item.title || null,
        pattern: item.pattern || '',
        explanation: item.explanation || null,
        notes: safeJson(item.notes),
        examples: safeJson(item.examples),
      },
    });
    count++;
  }
  console.log(`     ✓ ${count} sentence patterns seeded.`);
}

async function seedGrammars() {
  console.log('  → Seeding Grammar...');
  const data = readJson<any[]>(path.join(CONTENTS_DIR, 'grammars.json'));
  let count = 0;
  for (const item of data) {
    await prisma.grammar.upsert({
      where: { grammar_id: item.grammar_id },
      create: {
        grammar_id: item.grammar_id,
        title: item.title || '',
        structure: item.structure || null,
        explanation: item.explanation || null,
        notes: safeJson(item.notes),
        examples: safeJson(item.examples),
      },
      update: {
        title: item.title || '',
        structure: item.structure || null,
        explanation: item.explanation || null,
        notes: safeJson(item.notes),
        examples: safeJson(item.examples),
      },
    });
    count++;
  }
  console.log(`     ✓ ${count} grammars seeded.`);
}

async function seedDialogues() {
  console.log('  → Seeding Dialogue...');
  const data = readJson<any[]>(path.join(CONTENTS_DIR, 'dialogues.json'));
  let count = 0;
  for (const item of data) {
    const turns = item.turns || item.lines || [];
    const audioPath = item.audio_path || item.audio_url || null;

    await prisma.dialogue.upsert({
      where: { dialogue_id: item.dialogue_id },
      create: {
        dialogue_id: item.dialogue_id,
        title: item.title || null,
        audio_path: audioPath,
        turns: safeJson(turns),
      },
      update: {
        title: item.title || null,
        audio_path: audioPath,
        turns: safeJson(turns),
      },
    });
    count++;
  }
  console.log(`     ✓ ${count} dialogues seeded.`);
}

async function seedPhonetics() {
  console.log('  → Seeding Phonetic...');
  const data = readJson<any[]>(path.join(CONTENTS_DIR, 'phonetics.json'));
  let count = 0;
  for (const item of data) {
    await prisma.phonetic.upsert({
      where: { phonetic_id: item.phonetic_id },
      create: {
        phonetic_id: item.phonetic_id,
        syllables: safeJson(item.syllables),
        rules: safeJson(item.rules),
      },
      update: {
        syllables: safeJson(item.syllables),
        rules: safeJson(item.rules),
      },
    });
    count++;
  }
  console.log(`     ✓ ${count} phonetics seeded.`);
}

async function seedHanzi() {
  console.log('  → Seeding Hanzi...');
  const data = readJson<any[]>(path.join(CONTENTS_DIR, 'hanzi.json'));
  let count = 0;
  for (const item of data) {
    // Try upsert by hanzi_id first; if character conflict, update by character
    try {
      await prisma.hanzi.upsert({
        where: { hanzi_id: item.hanzi_id },
        create: {
          hanzi_id: item.hanzi_id,
          character: item.character,
          pinyin: item.pinyin || null,
          meaning: item.meaning || null,
          stroke_count: item.stroke_count || null,
          radical: item.radical || null,
          notes: safeJson(item.notes),
          examples: safeJson(item.examples),
          character_audio_path: item.character_audio_path || null,
          stroke_svg_path: item.stroke_svg_path || null,
          svg_content: item.svg_content || null,
        },
        update: {
          pinyin: item.pinyin || null,
          meaning: item.meaning || null,
          stroke_count: item.stroke_count || null,
          radical: item.radical || null,
          notes: safeJson(item.notes),
          examples: safeJson(item.examples),
          character_audio_path: item.character_audio_path || null,
          stroke_svg_path: item.stroke_svg_path || null,
          svg_content: item.svg_content || null,
        },
      });
    } catch {
      // character unique conflict: update existing by character
      await prisma.hanzi.updateMany({
        where: { character: item.character },
        data: {
          hanzi_id: item.hanzi_id,
          pinyin: item.pinyin || null,
          meaning: item.meaning || null,
          stroke_count: item.stroke_count || null,
          radical: item.radical || null,
          notes: safeJson(item.notes),
          examples: safeJson(item.examples),
          character_audio_path: item.character_audio_path || null,
          stroke_svg_path: item.stroke_svg_path || null,
        },
      });
    }
    count++;
  }
  console.log(`     ✓ ${count} hanzi seeded.`);
}

// ─────────────────────────────────────────────
//  PHASE 2: Seed Courses HSK1 - HSK6
// ─────────────────────────────────────────────

const HSK_COURSES = [
  { level: 'HSK1', code: 'HSK1', title: 'HSK 1 - Sơ cấp', description: 'Tiếng Trung sơ cấp HSK cấp độ 1' },
  { level: 'HSK2', code: 'HSK2', title: 'HSK 2 - Sơ trung cấp', description: 'Tiếng Trung HSK cấp độ 2' },
  { level: 'HSK3', code: 'HSK3', title: 'HSK 3 - Trung cấp', description: 'Tiếng Trung HSK cấp độ 3' },
  { level: 'HSK4', code: 'HSK4', title: 'HSK 4 - Trung thượng cấp', description: 'Tiếng Trung HSK cấp độ 4' },
  { level: 'HSK5', code: 'HSK5', title: 'HSK 5 - Thượng cấp', description: 'Tiếng Trung HSK cấp độ 5' },
  { level: 'HSK6', code: 'HSK6', title: 'HSK 6 - Cao cấp', description: 'Tiếng Trung HSK cấp độ 6' },
];

async function seedCourses(): Promise<Map<string, number>> {
  console.log('  → Seeding Courses (HSK1-HSK6)...');
  const courseIdMap = new Map<string, number>(); // "hsk1" -> course_id

  for (const c of HSK_COURSES) {
    const course = await prisma.courses.upsert({
      where: { code: c.code },
      create: {
        title: c.title,
        code: c.code,
        description: c.description,
        level: c.level,
        is_published: true,
      },
      update: {
        title: c.title,
        description: c.description,
        level: c.level,
        is_published: true,
      },
    });
    courseIdMap.set(c.code.toLowerCase(), course.course_id);
  }

  console.log(`     ✓ ${courseIdMap.size} courses seeded.`);
  return courseIdMap;
}

// ─────────────────────────────────────────────
//  PHASE 3: Seed Units (Chapters) & Decompose Content
// ─────────────────────────────────────────────

async function seedUnitsForCourse(courseKey: string, courseId: number) {
  const courseDir = path.join(COURSES_DIR, courseKey);
  if (!fs.existsSync(courseDir)) {
    console.log(`     ⚠  No course directory for ${courseKey}, skipping.`);
    return;
  }

  // Auto-discover all unit*.json files
  const unitFiles = fs.readdirSync(courseDir)
    .filter(f => /^unit\d+\.json$/i.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] || '0');
      const nb = parseInt(b.match(/\d+/)?.[0] || '0');
      return na - nb;
    });

  if (unitFiles.length === 0) {
    console.log(`     ⚠  No unit files found in ${courseKey}/`);
    return;
  }

  console.log(`  → Seeding ${unitFiles.length} units for ${courseKey.toUpperCase()}...`);

  for (const unitFile of unitFiles) {
    const unitData = readJson<any>(path.join(courseDir, unitFile));
    const unitNumber = unitData.order_index || parseInt(unitFile.match(/\d+/)?.[0] || '1');
    const slug = unitData.chapter_id || `${courseKey}_u${String(unitNumber).padStart(2, '0')}`;

    // Upsert the Chapter (Unit) — find by slug or create
    let chapter = await prisma.chapters.findFirst({
      where: { course_id: courseId, slug },
    });

    if (chapter) {
      chapter = await prisma.chapters.update({
        where: { chapter_id: chapter.chapter_id },
        data: {
          title: unitData.title || `Unit ${unitNumber}`,
          order_index: unitNumber,
          description: unitData.description || null,
          unit_number: unitNumber,
          slug,
        },
      });
    } else {
      chapter = await prisma.chapters.create({
        data: {
          course_id: courseId,
          title: unitData.title || `Unit ${unitNumber}`,
          order_index: unitNumber,
          description: unitData.description || null,
          unit_number: unitNumber,
          slug,
        },
      });
    }

    const unitId = chapter.chapter_id;

    // ── Seed Lessons inside this Unit ──────────────────────────────
    const lessons: any[] = unitData.lessons || [];
    for (const lessonData of lessons) {
      let lesson = await prisma.lessons.findFirst({
        where: { chapter_id: unitId, order_index: lessonData.order_index },
      });

      if (lesson) {
        lesson = await prisma.lessons.update({
          where: { lesson_id: lesson.lesson_id },
          data: {
            title: lessonData.title || `Lesson ${lessonData.order_index}`,
            status: 'PUBLISHED',
          },
        });
      } else {
        lesson = await prisma.lessons.create({
          data: {
            chapter_id: unitId,
            title: lessonData.title || `Lesson ${lessonData.order_index}`,
            order_index: lessonData.order_index,
            estimated_duration_mins: 15,
            status: 'PUBLISHED',
          },
        });
      }

      // ── Process lesson_blocks → collect content references ───────
      const lessonBlocks: any[] = lessonData.lesson_blocks || [];
      let globalVocabIdx = 0, globalPatternIdx = 0, globalGrammarIdx = 0;
      let globalDialogueIdx = 0, globalPhoneticIdx = 0, globalHanziIdx = 0;

      for (const block of lessonBlocks) {
        // Upsert LessonBlock
        const blockContentJson = JSON.stringify({
          lesson_block_id: block.lesson_block_id,
          block_type: block.block_type,
          order_index: block.order_index,
          content_references: block.content_references || [],
        });

        const existingBlock = await prisma.lessonBlocks.findFirst({
          where: {
            lesson_id: lesson.lesson_id,
            order_index: block.order_index,
            block_type: block.block_type,
          },
        });

        if (!existingBlock) {
          await prisma.lessonBlocks.create({
            data: {
              lesson_id: lesson.lesson_id,
              block_type: block.block_type,
              order_index: block.order_index,
              content_json: blockContentJson,
            },
          });
        } else {
          await prisma.lessonBlocks.update({
            where: { block_id: existingBlock.block_id },
            data: { content_json: blockContentJson },
          });
        }

        // ── Decompose content_references into Unit* tables ────────
        const refs: any[] = block.content_references || [];
        for (const ref of refs) {
          if (ref.content_type === 'VOCABULARY') {
            const vocab = await prisma.vocabulary.findUnique({ where: { vocabulary_id: ref.content_id } });
            if (vocab) {
              try {
                await prisma.unitVocabulary.upsert({
                  where: { unit_id_vocabulary_id: { unit_id: unitId, vocabulary_id: vocab.id } },
                  create: { unit_id: unitId, vocabulary_id: vocab.id, order_index: globalVocabIdx++, block_type: block.block_type },
                  update: { block_type: block.block_type },
                });
              } catch { globalVocabIdx++; }
            }
          } else if (ref.content_type === 'SENTENCE_PATTERN') {
            const sp = await prisma.sentencePattern.findUnique({ where: { sentence_pattern_id: ref.content_id } });
            if (sp) {
              try {
                await prisma.unitSentencePattern.upsert({
                  where: { unit_id_sentence_pattern_id: { unit_id: unitId, sentence_pattern_id: sp.id } },
                  create: { unit_id: unitId, sentence_pattern_id: sp.id, order_index: globalPatternIdx++, block_type: block.block_type },
                  update: { block_type: block.block_type },
                });
              } catch { globalPatternIdx++; }
            }
          } else if (ref.content_type === 'GRAMMAR') {
            const gr = await prisma.grammar.findUnique({ where: { grammar_id: ref.content_id } });
            if (gr) {
              try {
                await prisma.unitGrammar.upsert({
                  where: { unit_id_grammar_id: { unit_id: unitId, grammar_id: gr.id } },
                  create: { unit_id: unitId, grammar_id: gr.id, order_index: globalGrammarIdx++, block_type: block.block_type },
                  update: { block_type: block.block_type },
                });
              } catch { globalGrammarIdx++; }
            }
          } else if (ref.content_type === 'DIALOGUE') {
            const dl = await prisma.dialogue.findUnique({ where: { dialogue_id: ref.content_id } });
            if (dl) {
              try {
                await prisma.unitDialogue.upsert({
                  where: { unit_id_dialogue_id: { unit_id: unitId, dialogue_id: dl.id } },
                  create: { unit_id: unitId, dialogue_id: dl.id, order_index: globalDialogueIdx++, block_type: block.block_type },
                  update: { block_type: block.block_type },
                });
              } catch { globalDialogueIdx++; }
            }
          } else if (ref.content_type === 'PHONETIC') {
            const ph = await prisma.phonetic.findUnique({ where: { phonetic_id: ref.content_id } });
            if (ph) {
              try {
                await prisma.unitPhonetic.upsert({
                  where: { unit_id_phonetic_id: { unit_id: unitId, phonetic_id: ph.id } },
                  create: { unit_id: unitId, phonetic_id: ph.id, order_index: globalPhoneticIdx++, block_type: block.block_type },
                  update: { block_type: block.block_type },
                });
              } catch { globalPhoneticIdx++; }
            }
          } else if (ref.content_type === 'HANZI') {
            const hz = await prisma.hanzi.findUnique({ where: { hanzi_id: ref.content_id } });
            if (hz) {
              try {
                await prisma.unitHanzi.upsert({
                  where: { unit_id_hanzi_id: { unit_id: unitId, hanzi_id: hz.id } },
                  create: { unit_id: unitId, hanzi_id: hz.id, order_index: globalHanziIdx++, block_type: block.block_type },
                  update: { block_type: block.block_type },
                });
              } catch { globalHanziIdx++; }
            }
          }
          // EXERCISE refs handled in Phase 4
        }
      }
    }
    console.log(`     ✓ ${courseKey.toUpperCase()} Unit ${unitNumber} (chapter_id=${unitId}) seeded.`);
  }
}

async function seedAllUnits(courseIdMap: Map<string, number>) {
  for (const [key, courseId] of courseIdMap.entries()) {
    await seedUnitsForCourse(key, courseId);
  }
}

// ─────────────────────────────────────────────
//  PHASE 4: Seed Exercises & Answers
// ─────────────────────────────────────────────

async function seedExercises(courseIdMap: Map<string, number>) {
  console.log('  → Seeding Exercises...');

  const exercisesRaw = readJson<any[]>(path.join(EXERCISE_DIR, 'Exercise.json'));
  const answersRaw = readJson<any[]>(path.join(EXERCISE_DIR, 'exercise-answers.json'));
  const answersMap = new Map<string, any>();
  for (const ans of answersRaw) {
    answersMap.set(ans.exercise_id, ans);
  }

  // Build exercise → unit_id mapping
  const exerciseToUnit = new Map<string, number>();

  for (const [hskKey, courseId] of courseIdMap.entries()) {
    const courseDir = path.join(COURSES_DIR, hskKey);
    if (!fs.existsSync(courseDir)) continue;

    const unitFiles = fs.readdirSync(courseDir).filter(f => /^unit\d+\.json$/i.test(f));
    for (const unitFile of unitFiles) {
      const unitData = readJson<any>(path.join(courseDir, unitFile));
      const unitNumber = unitData.order_index || parseInt(unitFile.match(/\d+/)?.[0] || '1');
      const slug = unitData.chapter_id || `${hskKey}_u${String(unitNumber).padStart(2, '0')}`;

      const chapter = await prisma.chapters.findFirst({ where: { course_id: courseId, slug } });
      if (!chapter) continue;

      const lessons: any[] = unitData.lessons || [];
      for (const lesson of lessons) {
        for (const block of (lesson.lesson_blocks || [])) {
          for (const ref of (block.content_references || [])) {
            if (ref.content_type === 'EXERCISE') {
              exerciseToUnit.set(ref.content_id, chapter.chapter_id);
            }
          }
        }
      }
    }
  }

  let count = 0;
  for (const ex of exercisesRaw) {
    const unitId = exerciseToUnit.get(ex.exercise_id) || null;

    await prisma.exercise.upsert({
      where: { exercise_id: ex.exercise_id },
      create: {
        exercise_id: ex.exercise_id,
        unit_id: unitId,
        exercise_type: ex.exercise_type || 'MULTIPLE_CHOICE',
        instruction: ex.instruction || null,
        question: safeJson(ex.question),
        options: safeJson(ex.options),
        items: safeJson(ex.items),
        left_items: safeJson(ex.left_items),
        right_items: safeJson(ex.right_items),
      },
      update: {
        unit_id: unitId,
        exercise_type: ex.exercise_type || 'MULTIPLE_CHOICE',
        instruction: ex.instruction || null,
        question: safeJson(ex.question),
        options: safeJson(ex.options),
        items: safeJson(ex.items),
        left_items: safeJson(ex.left_items),
        right_items: safeJson(ex.right_items),
      },
    });

    // Seed answer
    const ans = answersMap.get(ex.exercise_id);
    if (ans) {
      await prisma.exerciseAnswer.upsert({
        where: { exercise_id: ex.exercise_id },
        create: {
          exercise_id: ex.exercise_id,
          answer_type: ans.answer_type || 'SINGLE_CHOICE',
          correct_data: safeJson(ans.correct_data) || '{}',
          explanation: ans.explanation || null,
        },
        update: {
          answer_type: ans.answer_type || 'SINGLE_CHOICE',
          correct_data: safeJson(ans.correct_data) || '{}',
          explanation: ans.explanation || null,
        },
      });
    }

    count++;
  }
  console.log(`     ✓ ${count} exercises seeded (${answersMap.size} answers).`);
}

// ─────────────────────────────────────────────
//  PHASE 5: Seed Legacy Assessment Data & Characters
// ─────────────────────────────────────────────

async function seedLegacyAssessment() {
  console.log('  → Seeding Legacy Assessment & Characters for Testing...');

  // 1. Seed Characters (used by SRS Test 5 & Hanzi stroke order viewer)
  const charactersData = [
    {
      char_id: 1,
      character: '你',
      pinyin: 'nǐ',
      sino_vietnamese: 'nhĩ',
      meaning: 'bạn, anh, chị (ngôi thứ 2)',
      radical: '亻',
      strokes_count: 7,
      stroke_order_svg: JSON.stringify([
        'M35,18 c-0.1,5 -1.2,14 -4.8,22 c-4.2,9.3 -11.5,21.8 -21.2,29.7',
        'M27,42 c0.6,0.6 0.9,1.8 0.9,3.1 c0,13.6 -0.3,42.4 -0.3,49.4',
        'M58,16 c0.04,0.6 0.17,1.6 -0.08,2.3 c-2.3,6.3 -6.8,14.6 -12.4,20.8',
        'M54,34 c2.8,0 20.2,-2.7 22.8,-2.7 c2.6,0 3.7,1.8 1.9,3.8 C73.4,41.4 67.5,48.2 60,54',
        'M50,44 c0.7,0.7 1.1,1.8 1.1,3.1 c0,14.2 -0.4,41.9 -0.4,46.9',
        'M52,65 c6,-0.8 22,-2.5 28.5,-3.2',
        'M69,45 c0.8,0.8 1.2,2 1.2,3.3 c0,9.7 -0.2,35.2 -0.2,42.2 c0,9 5.5,8 14.5,8 c8,0 10.5,-1.5 10.5,-7.5',
      ]),
    },
    {
      char_id: 2,
      character: '好',
      pinyin: 'hǎo',
      sino_vietnamese: 'hảo',
      meaning: 'tốt, đẹp, khỏe',
      radical: '女',
      strokes_count: 6,
      stroke_order_svg: JSON.stringify([
        'M28,18 c0.4,1 0.6,2.4 0.4,3.8 C26.7,35 20.3,55.8 15.8,63.2 c-0.9,1.5 -0.2,2.1 0.4,2.2 c7.8,1.4 16.5,5.2 21.8,11.8',
        'M39.5,33 c0.1,1.1 0.2,3.2 -0.2,4.8 C35.7,52 26.2,74.5 11,85',
        'M10,48 c0.7,0.3 2.6,0.4 3.7,0.3 c8.8,-0.8 19.3,-2.3 29.8,-3.1 c1.8,-0.1 3.5,0.2 4.5,0.4',
        'M59,20 c1.2,0.5 2.8,0.7 4.2,0.5 c4.6,-0.7 17.1,-3.5 18.6,-3.7 c2.2,-0.3 3.6,1.4 1.8,3.4 C77.5,27.5 69,38 64,42',
        'M64,41 c2.2,2.8 10.5,18.8 13.8,38.2 c0.9,5.5 -0.8,9.6 -6.8,9.6 c-5.2,0 -8.5,-5.2 -9.5,-6.2',
        'M47,52 c1.5,0.8 3.8,0.9 5.5,0.6 c9.2,-1.6 27.5,-3.8 38.5,-4.4 c2.3,-0.1 4.2,0.3 5.5,0.7',
      ]),
    },
    {
      char_id: 3,
      character: '我',
      pinyin: 'wǒ',
      sino_vietnamese: 'ngã',
      meaning: 'tôi, mình (ngôi thứ 1)',
      radical: '戈',
      strokes_count: 7,
      stroke_order_svg: JSON.stringify([
        'M36,15 c-0.1,0.9 -0.6,1.9 -1.2,2.4 c-4.6,3.6 -12.4,7.8 -23.8,11.2',
        'M18,39 c0.7,0.4 2.8,0.6 4.1,0.5 c7.9,-0.6 15.9,-2.4 23.4,-3.6 c1.3,-0.2 2.7,0.1 3.5,0.3',
        'M32.5,27 c0.9,0.9 1.4,2.2 1.4,3.7 c0,14.3 -0.2,49.2 -0.2,55.1 c0,4.2 -1.2,6.2 -4.2,3.2 c-3,-3 -5.5,-5.5 -7.5,-7.2',
        'M16,66 c1.5,1.2 2.8,1.2 4.2,0.5 c5.8,-3 14.8,-8.2 21.8,-12.7',
        'M64,12 c1,1.2 1.5,2.8 1.6,4.5 c1.5,22.5 8,62 23.4,78 c4.5,4.6 4,-2 3.8,-7.5',
        'M84,38 c0.1,0.9 -0.2,2.3 -0.7,3.3 c-3.5,6.5 -11.5,17.2 -24.8,25.2',
        'M77,16 c3.5,1.8 8.5,5.8 10.2,8.8',
      ]),
    },
    {
      char_id: 4,
      character: '是',
      pinyin: 'shì',
      sino_vietnamese: 'thị',
      meaning: 'là, đúng',
      radical: '日',
      strokes_count: 9,
      stroke_order_svg: JSON.stringify([
        'M29,14 c0.8,0.8 1.3,1.8 1.3,3 c0,10.2 -0.2,23.5 -0.2,27',
        'M31,16 c4.5,-0.6 34.5,-4 38,-4.2 c2.5,-0.2 3.8,1.2 3.8,3.5 c0,6.2 -0.5,17.5 -0.5,24.5',
        'M31,30 c6.5,-0.7 33.5,-3.2 40.5,-3.5',
        'M31,43 c9.5,-0.8 31.5,-2.8 40,-3.2',
        'M18,57 c1.8,0.6 4.5,0.4 6.5,0.2 c16.5,-1.6 38.5,-3.8 55.5,-4.6 c2.5,-0.1 4.5,0.3 6,0.6',
        'M49,45 c0.8,0.8 1.2,2 1.2,3.2 c0,6.5 -0.2,21.5 -0.2,27.5',
        'M32,67 c0.1,0.8 -0.1,1.8 -0.5,2.4 c-2.8,4.2 -8.5,10.8 -18.5,16.2',
        'M30,76 c4.5,-0.5 12.5,-1.5 17.5,-2.2',
        'M52,62 c5.5,5.2 21.5,18.5 32.5,24.5 c2.5,1.4 5.2,2.8 8,3.2',
      ]),
    },
    {
      char_id: 5,
      character: '人',
      pinyin: 'rén',
      sino_vietnamese: 'nhân',
      meaning: 'người',
      radical: '人',
      strokes_count: 2,
      stroke_order_svg: JSON.stringify([
        'M52,15 c0.2,1.8 0.4,3.5 -0.4,5.2 C46.5,33.5 33.5,63.5 12,82',
        'M49,38 c6.5,8.8 24.5,31.2 36.5,41.5 c2.8,2.4 5.8,4.8 9.5,6',
      ]),
    },
  ];

  for (const c of charactersData) {
    await prisma.characters.upsert({
      where: { character: c.character },
      create: c,
      update: c,
    });
  }
  console.log(`     ✓ ${charactersData.length} characters seeded.`);

  // 2. Find Lesson 1 (first lesson of first chapter of HSK1)
  const lesson1 = await prisma.lessons.findFirst({
    where: { order_index: 1 },
    orderBy: { lesson_id: 'asc' },
  });

  if (!lesson1) {
    console.log('     ⚠ Lesson 1 not found, skipping assessment seed.');
    return;
  }

  // 3. Seed 4 Questions with exact question_id 1..4 and correct answers B, B, B, C (required by Test 4 & Test 9)
  const questionsData = [
    {
      question_id: 1,
      question_type: 'MULTIPLE_CHOICE',
      skill_category: 'READING',
      difficulty_level: 'HSK1',
      content: '“你好” 的意思是？',
      options_json: JSON.stringify(['A. Tạm biệt', 'B. Xin chào', 'C. Cảm ơn', 'D. Xin lỗi']),
      correct_answer: 'B',
      explanation: '“你好” có nghĩa là Xin chào trong tiếng Trung.',
    },
    {
      question_id: 2,
      question_type: 'MULTIPLE_CHOICE',
      skill_category: 'READING',
      difficulty_level: 'HSK1',
      content: 'Đại từ nhân xưng ngôi thứ nhất số ít “我” có nghĩa là gì?',
      options_json: JSON.stringify(['A. Bạn', 'B. Tôi', 'C. Anh ấy', 'D. Chúng tôi']),
      correct_answer: 'B',
      explanation: '“我” (wǒ) có nghĩa là Tôi.',
    },
    {
      question_id: 3,
      question_type: 'MULTIPLE_CHOICE',
      skill_category: 'READING',
      difficulty_level: 'HSK1',
      content: 'Chọn phiên âm đúng của chữ “好”:',
      options_json: JSON.stringify(['A. hē', 'B. hǎo', 'C. hán', 'D. huà']),
      correct_answer: 'B',
      explanation: 'Chữ “好” có pinyin là “hǎo”.',
    },
    {
      question_id: 4,
      question_type: 'MULTIPLE_CHOICE',
      skill_category: 'READING',
      difficulty_level: 'HSK1',
      content: 'Khi gặp một người lớn tuổi hoặc cần thể hiện sự tôn trọng, ta dùng:',
      options_json: JSON.stringify(['A. 你好', 'B. 你们好', 'C. 您好', 'D. 大家好']),
      correct_answer: 'C',
      explanation: '“您好” (nín hǎo) thể hiện sự kính trọng hơn “你好”.',
    },
  ];

  for (const q of questionsData) {
    await prisma.questions.upsert({
      where: { question_id: q.question_id },
      create: q,
      update: q,
    });
  }
  console.log(`     ✓ ${questionsData.length} assessment questions seeded.`);

  // 4. Seed Test with test_id = 1 linked to lesson_id = lesson1.lesson_id (1), published = true
  const test1 = await prisma.tests.upsert({
    where: { test_id: 1 },
    create: {
      test_id: 1,
      lesson_id: lesson1.lesson_id,
      title: 'Kiểm tra Unit 1 - Bài 1',
      test_type: 'QUIZ',
      passing_score: 80,
      time_limit_mins: 15,
      is_published: true,
    },
    update: {
      lesson_id: lesson1.lesson_id,
      title: 'Kiểm tra Unit 1 - Bài 1',
      test_type: 'QUIZ',
      passing_score: 80,
      time_limit_mins: 15,
      is_published: true,
    },
  });

  // Link questions to Test 1
  for (let i = 0; i < questionsData.length; i++) {
    const q = questionsData[i];
    await prisma.testQuestions.upsert({
      where: {
        test_id_question_id: {
          test_id: test1.test_id,
          question_id: q.question_id,
        },
      },
      create: {
        test_id: test1.test_id,
        question_id: q.question_id,
        order_index: i + 1,
      },
      update: {
        order_index: i + 1,
      },
    });
  }
  console.log(`     ✓ Test 1 with ${questionsData.length} questions linked to Lesson ${lesson1.lesson_id}.`);
}

// ─────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Starting HSK Curriculum Seed...\n');

  console.log('👤 Phase 0: Default Users');
  await seedUsers();

  console.log('\n📚 Phase 1: Atomic Content Repositories');
  await seedVocabularies();
  await seedSentencePatterns();
  await seedGrammars();
  await seedDialogues();
  await seedPhonetics();
  await seedHanzi();

  console.log('\n🏫 Phase 2: Courses (HSK1-HSK6)');
  const courseIdMap = await seedCourses();

  console.log('\n📋 Phase 3: Units & Content Decomposition');
  await seedAllUnits(courseIdMap);

  console.log('\n📝 Phase 4: Exercises & Answers');
  await seedExercises(courseIdMap);

  console.log('\n🎯 Phase 5: Legacy Assessment & Characters');
  await seedLegacyAssessment();

  console.log('\n🌟 Phase 6: Comprehensive HSK 1–6 Enrichment (Vocab, Pinyin, Lessons, 30 Mock Exams & 18 Workbooks)');
  await runComprehensiveHskSeed(prisma);

  console.log('\n✅ Seed completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
