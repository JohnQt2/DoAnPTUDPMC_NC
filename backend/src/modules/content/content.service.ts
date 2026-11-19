/**
 * content.service.ts
 * Hệ thống API tra cứu, phân rã và tải nội dung bài học chi tiết.
 * Bao gồm: Vocabulary, SentencePattern, Grammar, Dialogue, Phonetic, Hanzi
 * theo cấu trúc Unit (Chapter) của khóa học HSK 1-6.
 */
import { prisma } from '../../shared/database/prisma.client';
import { AppError } from '../../shared/errors/app-error';

export class ContentService {

  // ──────────────────────────────────────────────────────────────
  //  1. Courses — Danh sách & chi tiết khóa học HSK 1-6
  // ──────────────────────────────────────────────────────────────

  async listCourses(level?: string) {
    const where: any = {};
    if (level) {
      where.level = level.toUpperCase();
    }

    const courses = await prisma.courses.findMany({
      where,
      include: {
        _count: { select: { chapters: true } },
      },
      orderBy: { level: 'asc' },
    });

    return courses.map((c) => ({
      courseId: c.course_id,
      title: c.title,
      code: c.code,
      description: c.description,
      level: c.level,
      isPublished: c.is_published,
      totalUnits: c._count.chapters,
      createdAt: c.created_at,
    }));
  }

  // ──────────────────────────────────────────────────────────────
  //  2. Units — Danh sách Unit theo khóa học
  // ──────────────────────────────────────────────────────────────

  async listUnitsByCourse(courseId: number, userId?: number) {
    const course = await prisma.courses.findUnique({ where: { course_id: courseId } });
    if (!course) throw AppError.notFound('Không tìm thấy khóa học này.');

    // Prefer chapters with slug (curriculum units) if available
    const hasUnitsWithSlug = await prisma.chapters.count({
      where: { course_id: courseId, slug: { not: null } },
    });

    const chapters = await prisma.chapters.findMany({
      where: {
        course_id: courseId,
        ...(hasUnitsWithSlug > 0 ? { slug: { not: null } } : {}),
      },
      orderBy: { order_index: 'asc' },
      include: {
        _count: {
          select: {
            unitVocabularies: true,
            unitGrammars: true,
            unitSentencePatterns: true,
            unitDialogues: true,
            unitPhonetics: true,
            unitHanzis: true,
            exercises: true,
          },
        },
        lessons: {
          orderBy: { order_index: 'asc' },
          select: { lesson_id: true, status: true, order_index: true },
        },
      },
    });

    // Optionally compute unlock status per lesson if userId provided
    const progressMap = new Map<number, string>();
    if (userId) {
      const lessonIds = chapters.flatMap(ch => ch.lessons.map(l => l.lesson_id));
      if (lessonIds.length > 0) {
        const progRecords = await prisma.userLessonProgress.findMany({
          where: { user_id: userId, lesson_id: { in: lessonIds } },
        });
        for (const p of progRecords) {
          progressMap.set(p.lesson_id, p.status || (p.is_completed ? 'COMPLETED' : 'LOCKED'));
        }
      }
    }

    return {
      courseId: course.course_id,
      title: course.title,
      level: course.level,
      units: chapters.map((ch, idx) => {
        // Determine overall unit unlock status from first lesson
        const firstLesson = ch.lessons.find(l => l.status === 'PUBLISHED');
        let unitStatus = 'LOCKED';
        if (idx === 0) unitStatus = 'UNLOCKED';
        if (firstLesson && userId) {
          unitStatus = progressMap.get(firstLesson.lesson_id) || (idx === 0 ? 'UNLOCKED' : 'LOCKED');
        } else if (!userId) {
          unitStatus = 'UNLOCKED';
        }

        return {
          unitId: ch.chapter_id,
          unitNumber: ch.unit_number || ch.order_index,
          title: ch.title,
          description: ch.description,
          slug: (ch as any).slug,
          thumbnailUrl: (ch as any).thumbnail_url,
          objective: (ch as any).objective,
          orderIndex: ch.order_index,
          status: unitStatus,
          stats: {
            vocabularies: ch._count.unitVocabularies,
            grammars: ch._count.unitGrammars,
            sentencePatterns: ch._count.unitSentencePatterns,
            dialogues: ch._count.unitDialogues,
            phonetics: ch._count.unitPhonetics,
            hanzis: ch._count.unitHanzis,
            exercises: ch._count.exercises,
          },
        };
      }),
    };
  }

  async listUnitsByLevel(hskLevel: string, userId?: number) {
    const level = hskLevel.toUpperCase();
    const course = await prisma.courses.findFirst({ where: { level } });
    if (!course) throw AppError.notFound(`Không tìm thấy khóa học ${level}.`);
    return this.listUnitsByCourse(course.course_id, userId);
  }

  // ──────────────────────────────────────────────────────────────
  //  3. Unit Detail — Tải trọn gói nội dung phân rã của 1 Unit
  // ──────────────────────────────────────────────────────────────

  async getUnitDetail(unitId: number, userId?: number) {
    const chapter = await prisma.chapters.findUnique({
      where: { chapter_id: unitId },
      include: {
        course: { select: { course_id: true, title: true, level: true, code: true } },
        lessons: { orderBy: { order_index: 'asc' } },
        unitVocabularies: {
          orderBy: { order_index: 'asc' },
          include: { vocabulary: true },
        },
        unitSentencePatterns: {
          orderBy: { order_index: 'asc' },
          include: { sentencePattern: true },
        },
        unitGrammars: {
          orderBy: { order_index: 'asc' },
          include: { grammar: true },
        },
        unitDialogues: {
          orderBy: { order_index: 'asc' },
          include: { dialogue: true },
        },
        unitPhonetics: {
          orderBy: { order_index: 'asc' },
          include: { phonetic: true },
        },
        unitHanzis: {
          orderBy: { order_index: 'asc' },
          include: { hanzi: true },
        },
        exercises: {
          orderBy: { id: 'asc' },
          include: { answer: true },
        },
      },
    });

    if (!chapter) throw AppError.notFound('Không tìm thấy Unit này.');

    // User progress
    let userProgress: any = null;
    if (userId) {
      const firstLesson = chapter.lessons.find(l => l.status === 'PUBLISHED');
      if (firstLesson) {
        const prog = await prisma.userLessonProgress.findUnique({
          where: { user_id_lesson_id: { user_id: userId, lesson_id: firstLesson.lesson_id } },
        });
        if (prog) {
          userProgress = {
            status: prog.status || (prog.is_completed ? 'COMPLETED' : 'LOCKED'),
            isCompleted: prog.is_completed,
            highestScore: prog.highest_score || 0,
            completedAt: prog.completed_at,
          };
        }
      }
    }

    return {
      unitId: chapter.chapter_id,
      unitNumber: chapter.unit_number || chapter.order_index,
      title: chapter.title,
      description: chapter.description,
      objective: (chapter as any).objective,
      slug: (chapter as any).slug,
      orderIndex: chapter.order_index,
      course: chapter.course,
      userProgress,
      lessons: chapter.lessons.map(l => ({
        lessonId: l.lesson_id,
        title: l.title,
        orderIndex: l.order_index,
        status: l.status,
      })),
      vocabularies: chapter.unitVocabularies.map(uv => formatVocabulary(uv.vocabulary)),
      sentencePatterns: chapter.unitSentencePatterns.map(usp => formatSentencePattern(usp.sentencePattern)),
      grammars: chapter.unitGrammars.map(ug => formatGrammar(ug.grammar)),
      dialogues: chapter.unitDialogues.map(ud => formatDialogue(ud.dialogue)),
      phonetics: chapter.unitPhonetics.map(up => formatPhonetic(up.phonetic)),
      hanzi: chapter.unitHanzis.map(uh => formatHanzi(uh.hanzi)),
      exercises: chapter.exercises.map(ex => formatExercise(ex)),
    };
  }

  // ──────────────────────────────────────────────────────────────
  //  4. Modular Content Loading — tải từng phần theo Unit
  // ──────────────────────────────────────────────────────────────

  async getUnitVocabularies(unitId: number) {
    const chapter = await prisma.chapters.findUnique({ where: { chapter_id: unitId } });
    if (!chapter) throw AppError.notFound('Không tìm thấy Unit này.');

    const items = await prisma.unitVocabulary.findMany({
      where: { unit_id: unitId },
      orderBy: { order_index: 'asc' },
      include: { vocabulary: true },
    });
    return { unitId, unitTitle: chapter.title, vocabularies: items.map(i => formatVocabulary(i.vocabulary)) };
  }

  async getUnitSentencePatterns(unitId: number) {
    const chapter = await prisma.chapters.findUnique({ where: { chapter_id: unitId } });
    if (!chapter) throw AppError.notFound('Không tìm thấy Unit này.');

    const items = await prisma.unitSentencePattern.findMany({
      where: { unit_id: unitId },
      orderBy: { order_index: 'asc' },
      include: { sentencePattern: true },
    });
    return { unitId, unitTitle: chapter.title, sentencePatterns: items.map(i => formatSentencePattern(i.sentencePattern)) };
  }

  async getUnitGrammars(unitId: number) {
    const chapter = await prisma.chapters.findUnique({ where: { chapter_id: unitId } });
    if (!chapter) throw AppError.notFound('Không tìm thấy Unit này.');

    const items = await prisma.unitGrammar.findMany({
      where: { unit_id: unitId },
      orderBy: { order_index: 'asc' },
      include: { grammar: true },
    });
    return { unitId, unitTitle: chapter.title, grammars: items.map(i => formatGrammar(i.grammar)) };
  }

  async getUnitDialogues(unitId: number) {
    const chapter = await prisma.chapters.findUnique({ where: { chapter_id: unitId } });
    if (!chapter) throw AppError.notFound('Không tìm thấy Unit này.');

    const items = await prisma.unitDialogue.findMany({
      where: { unit_id: unitId },
      orderBy: { order_index: 'asc' },
      include: { dialogue: true },
    });
    return { unitId, unitTitle: chapter.title, dialogues: items.map(i => formatDialogue(i.dialogue)) };
  }

  async getUnitPhonetics(unitId: number) {
    const chapter = await prisma.chapters.findUnique({ where: { chapter_id: unitId } });
    if (!chapter) throw AppError.notFound('Không tìm thấy Unit này.');

    const items = await prisma.unitPhonetic.findMany({
      where: { unit_id: unitId },
      orderBy: { order_index: 'asc' },
      include: { phonetic: true },
    });
    return { unitId, unitTitle: chapter.title, phonetics: items.map(i => formatPhonetic(i.phonetic)) };
  }

  async getUnitHanzi(unitId: number) {
    const chapter = await prisma.chapters.findUnique({ where: { chapter_id: unitId } });
    if (!chapter) throw AppError.notFound('Không tìm thấy Unit này.');

    const items = await prisma.unitHanzi.findMany({
      where: { unit_id: unitId },
      orderBy: { order_index: 'asc' },
      include: { hanzi: true },
    });
    return { unitId, unitTitle: chapter.title, hanzi: items.map(i => formatHanzi(i.hanzi)) };
  }

  async getUnitExercises(unitId: number) {
    const chapter = await prisma.chapters.findUnique({ where: { chapter_id: unitId } });
    if (!chapter) throw AppError.notFound('Không tìm thấy Unit này.');

    const items = await prisma.exercise.findMany({
      where: { unit_id: unitId },
      orderBy: { id: 'asc' },
      include: { answer: true },
    });
    return { unitId, unitTitle: chapter.title, exercises: items.map(formatExercise) };
  }

  // ──────────────────────────────────────────────────────────────
  //  5. Dictionary / Quick Lookup
  // ──────────────────────────────────────────────────────────────

  async getHanziDetail(character: string) {
    const hanzi = await prisma.hanzi.findFirst({
      where: { character },
      include: {
        unitHanzis: {
          include: {
            unit: {
              include: { course: { select: { level: true, title: true } } },
            },
          },
        },
      },
    });

    if (!hanzi) throw AppError.notFound(`Không tìm thấy chữ Hán "${character}".`);

    // Find related vocabulary containing this character
    const relatedVocab = await prisma.vocabulary.findMany({
      where: { word: { contains: character } },
      take: 10,
    });

    return {
      ...formatHanzi(hanzi),
      relatedUnits: hanzi.unitHanzis.map(uh => ({
        unitId: uh.unit.chapter_id,
        unitTitle: uh.unit.title,
        courseLevel: uh.unit.course.level,
        courseTitle: uh.unit.course.title,
      })),
      relatedVocabulary: relatedVocab.map(v => ({
        vocabularyId: v.vocabulary_id,
        word: v.word,
        pinyin: v.pinyin,
        meaning: v.meaning,
        audioUrl: v.word_audio_path,
      })),
    };
  }

  async searchMaterials(query: string, level?: string, type?: string) {
    const q = query.trim();
    if (!q) return { results: [] };

    const levelFilter = level ? level.toUpperCase() : undefined;
    const results: any[] = [];

    const types = type ? [type.toLowerCase()] : ['vocabulary', 'grammar', 'sentence_pattern'];

    if (types.includes('vocabulary')) {
      const vocabs = await prisma.vocabulary.findMany({
        where: {
          AND: [
            levelFilter ? { hsk_level: levelFilter } : {},
            {
              OR: [
                { word: { contains: q } },
                { pinyin: { contains: q } },
                { meaning: { contains: q } },
              ],
            },
          ],
        },
        take: 20,
      });
      results.push(...vocabs.map(v => ({ type: 'vocabulary', ...formatVocabulary(v) })));
    }

    if (types.includes('grammar')) {
      const grammars = await prisma.grammar.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { structure: { contains: q } },
            { explanation: { contains: q } },
          ],
        },
        take: 10,
      });
      results.push(...grammars.map(g => ({ type: 'grammar', ...formatGrammar(g) })));
    }

    if (types.includes('sentence_pattern') || types.includes('pattern')) {
      const patterns = await prisma.sentencePattern.findMany({
        where: {
          OR: [
            { pattern: { contains: q } },
            { title: { contains: q } },
            { explanation: { contains: q } },
          ],
        },
        take: 10,
      });
      results.push(...patterns.map(p => ({ type: 'sentence_pattern', ...formatSentencePattern(p) })));
    }

    return { query: q, level: levelFilter, type, results };
  }

  // ──────────────────────────────────────────────────────────────
  //  6. Admin — CRUD Unit Materials
  // ──────────────────────────────────────────────────────────────

  async createUnit(courseId: number, data: {
    title: string;
    orderIndex: number;
    description?: string;
    objective?: string;
    thumbnailUrl?: string;
  }) {
    const course = await prisma.courses.findUnique({ where: { course_id: courseId } });
    if (!course) throw AppError.notFound('Không tìm thấy khóa học.');

    const chapter = await prisma.chapters.create({
      data: {
        course_id: courseId,
        title: data.title,
        order_index: data.orderIndex,
        description: data.description || null,
        objective: data.objective || null,
        thumbnail_url: data.thumbnailUrl || null,
        unit_number: data.orderIndex,
      },
    });

    return {
      unitId: chapter.chapter_id,
      title: chapter.title,
      orderIndex: chapter.order_index,
      courseId,
    };
  }

  async updateUnit(unitId: number, data: {
    title?: string;
    orderIndex?: number;
    description?: string;
    objective?: string;
    thumbnailUrl?: string;
    status?: string;
  }) {
    const chapter = await prisma.chapters.findUnique({ where: { chapter_id: unitId } });
    if (!chapter) throw AppError.notFound('Không tìm thấy Unit này.');

    const updated = await prisma.chapters.update({
      where: { chapter_id: unitId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.orderIndex !== undefined && { order_index: data.orderIndex, unit_number: data.orderIndex }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.objective !== undefined && { objective: data.objective }),
        ...(data.thumbnailUrl !== undefined && { thumbnail_url: data.thumbnailUrl }),
      },
    });

    // If status change is requested, update associated lessons
    if (data.status === 'PUBLISHED' || data.status === 'DRAFT') {
      await prisma.lessons.updateMany({
        where: { chapter_id: unitId },
        data: { status: data.status },
      });
    }

    return {
      unitId: updated.chapter_id,
      title: updated.title,
      orderIndex: updated.order_index,
      description: updated.description,
    };
  }

  async assignMaterialsToUnit(unitId: number, materials: {
    vocabularyIds?: string[];
    grammarIds?: string[];
    sentencePatternIds?: string[];
    dialogueIds?: string[];
    phoneticIds?: string[];
    hanziIds?: string[];
  }) {
    const chapter = await prisma.chapters.findUnique({ where: { chapter_id: unitId } });
    if (!chapter) throw AppError.notFound('Không tìm thấy Unit này.');

    // Helper to get numeric id from string vocabulary_id
    const assignVocabularies = async (ids: string[]) => {
      for (let i = 0; i < ids.length; i++) {
        const v = await prisma.vocabulary.findUnique({ where: { vocabulary_id: ids[i] } });
        if (v) {
          await prisma.unitVocabulary.upsert({
            where: { unit_id_vocabulary_id: { unit_id: unitId, vocabulary_id: v.id } },
            create: { unit_id: unitId, vocabulary_id: v.id, order_index: i },
            update: { order_index: i },
          });
        }
      }
    };

    if (materials.vocabularyIds) await assignVocabularies(materials.vocabularyIds);

    if (materials.grammarIds) {
      for (let i = 0; i < materials.grammarIds.length; i++) {
        const g = await prisma.grammar.findUnique({ where: { grammar_id: materials.grammarIds[i] } });
        if (g) {
          await prisma.unitGrammar.upsert({
            where: { unit_id_grammar_id: { unit_id: unitId, grammar_id: g.id } },
            create: { unit_id: unitId, grammar_id: g.id, order_index: i },
            update: { order_index: i },
          });
        }
      }
    }

    if (materials.sentencePatternIds) {
      for (let i = 0; i < materials.sentencePatternIds.length; i++) {
        const sp = await prisma.sentencePattern.findUnique({ where: { sentence_pattern_id: materials.sentencePatternIds[i] } });
        if (sp) {
          await prisma.unitSentencePattern.upsert({
            where: { unit_id_sentence_pattern_id: { unit_id: unitId, sentence_pattern_id: sp.id } },
            create: { unit_id: unitId, sentence_pattern_id: sp.id, order_index: i },
            update: { order_index: i },
          });
        }
      }
    }

    if (materials.dialogueIds) {
      for (let i = 0; i < materials.dialogueIds.length; i++) {
        const d = await prisma.dialogue.findUnique({ where: { dialogue_id: materials.dialogueIds[i] } });
        if (d) {
          await prisma.unitDialogue.upsert({
            where: { unit_id_dialogue_id: { unit_id: unitId, dialogue_id: d.id } },
            create: { unit_id: unitId, dialogue_id: d.id, order_index: i },
            update: { order_index: i },
          });
        }
      }
    }

    if (materials.phoneticIds) {
      for (let i = 0; i < materials.phoneticIds.length; i++) {
        const p = await prisma.phonetic.findUnique({ where: { phonetic_id: materials.phoneticIds[i] } });
        if (p) {
          await prisma.unitPhonetic.upsert({
            where: { unit_id_phonetic_id: { unit_id: unitId, phonetic_id: p.id } },
            create: { unit_id: unitId, phonetic_id: p.id, order_index: i },
            update: { order_index: i },
          });
        }
      }
    }

    if (materials.hanziIds) {
      for (let i = 0; i < materials.hanziIds.length; i++) {
        const h = await prisma.hanzi.findUnique({ where: { hanzi_id: materials.hanziIds[i] } });
        if (h) {
          await prisma.unitHanzi.upsert({
            where: { unit_id_hanzi_id: { unit_id: unitId, hanzi_id: h.id } },
            create: { unit_id: unitId, hanzi_id: h.id, order_index: i },
            update: { order_index: i },
          });
        }
      }
    }

    return { unitId, message: 'Đã cập nhật danh sách học liệu cho Unit.' };
  }
}

// ──────────────────────────────────────────────────────────────
//  Format helpers
// ──────────────────────────────────────────────────────────────

function safeParseJson(str: string | null | undefined): any {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return str; }
}

function formatVocabulary(v: any) {
  return {
    id: v.id,
    vocabularyId: v.vocabulary_id,
    word: v.word,
    pinyin: v.pinyin,
    meaning: v.meaning,
    wordType: v.word_type,
    notes: safeParseJson(v.notes),
    examples: safeParseJson(v.examples),
    imagePath: v.word_image_path,
    audioUrl: v.word_audio_path,
    hskLevel: v.hsk_level,
  };
}

function formatSentencePattern(sp: any) {
  return {
    id: sp.id,
    sentencePatternId: sp.sentence_pattern_id,
    title: sp.title,
    pattern: sp.pattern,
    explanation: sp.explanation,
    notes: safeParseJson(sp.notes),
    examples: safeParseJson(sp.examples),
  };
}

function formatGrammar(g: any) {
  return {
    id: g.id,
    grammarId: g.grammar_id,
    title: g.title,
    structure: g.structure,
    explanation: g.explanation,
    notes: safeParseJson(g.notes),
    examples: safeParseJson(g.examples),
  };
}

function formatDialogue(d: any) {
  return {
    id: d.id,
    dialogueId: d.dialogue_id,
    title: d.title,
    audioPath: d.audio_path,
    turns: safeParseJson(d.turns),
  };
}

function formatPhonetic(p: any) {
  return {
    id: p.id,
    phoneticId: p.phonetic_id,
    syllables: safeParseJson(p.syllables),
    rules: safeParseJson(p.rules),
  };
}

function formatHanzi(h: any) {
  return {
    id: h.id,
    hanziId: h.hanzi_id,
    character: h.character,
    pinyin: h.pinyin,
    meaning: h.meaning,
    strokeCount: h.stroke_count,
    radical: h.radical,
    notes: safeParseJson(h.notes),
    examples: safeParseJson(h.examples),
    audioPath: h.character_audio_path,
    svgUrl: h.stroke_svg_path,
    svgContent: h.svg_content,
  };
}

function formatExercise(ex: any) {
  return {
    id: ex.id,
    exerciseId: ex.exercise_id,
    unitId: ex.unit_id,
    exerciseType: ex.exercise_type,
    instruction: ex.instruction,
    question: safeParseJson(ex.question),
    options: safeParseJson(ex.options),
    items: safeParseJson(ex.items),
    leftItems: safeParseJson(ex.left_items),
    rightItems: safeParseJson(ex.right_items),
    answer: ex.answer ? {
      answerType: ex.answer.answer_type,
      correctData: safeParseJson(ex.answer.correct_data),
      explanation: ex.answer.explanation,
    } : null,
  };
}

export const contentService = new ContentService();
