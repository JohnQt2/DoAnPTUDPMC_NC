import { ContentType, Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.client';
import { AppError } from '../../shared/errors/app-error';
import {
  CreateCourseInput,
  UpdateCourseInput,
  CreateChapterInput,
  UpdateChapterInput,
  CreateLessonInput,
  UpdateLessonInput,
  CreateLessonBlockInput,
  UpdateLessonBlockInput,
} from './curriculum.dto';

const lessonContentInclude = {
  blocks: {
    orderBy: { order_index: 'asc' as const },
    include: {
      contentReferences: {
        orderBy: { order_index: 'asc' as const },
        include: { content: true },
      },
    },
  },
} satisfies Prisma.LessonsInclude;

type LessonWithLearningContent = Prisma.LessonsGetPayload<{
  include: typeof lessonContentInclude;
}>;

function mapLessonLearningContent(lesson: LessonWithLearningContent) {
  return {
    lessonId: lesson.lesson_id,
    externalId: lesson.external_id,
    title: lesson.title,
    orderIndex: lesson.order_index,
    estimatedDurationMins: lesson.estimated_duration_mins,
    status: lesson.status,
    lessonBlocks: lesson.blocks.map((block) => ({
      blockId: block.block_id,
      externalId: block.external_id,
      blockType: block.block_type,
      orderIndex: block.order_index,
      contentJson: block.content_json,
      media: [],
      contents: block.contentReferences.map((reference) => ({
        content_id: reference.content.content_id,
        external_id: reference.content.external_id,
        content_type: reference.content.content_type,
        item_id: reference.item_id,
        order_index: reference.order_index,
        content_json: reference.content.content_json,
      })),
    })),
  };
}

export class CurriculumService {
  // ─── Courses ───────────────────────────────────────────────────────

  async listCourses() {
    const courses = await prisma.courses.findMany({
      include: {
        _count: { select: { chapters: true } },
      },
      orderBy: [{ level: 'asc' }, { course_id: 'asc' }],
    });

    return courses.map((c) => ({
      courseId: c.course_id,
      title: c.title,
      code: c.code,
      description: c.description,
      level: c.level,
      isPublished: c.is_published,
      chaptersCount: c._count.chapters,
      createdAt: c.created_at,
    }));
  }

  async listUnitsForCourse(courseId: number) {
    const course = await prisma.courses.findUnique({
      where: { course_id: courseId },
      select: { course_id: true },
    });
    if (!course) throw AppError.notFound('Không tìm thấy khóa học này.');

    const units = await prisma.chapters.findMany({
      where: { course_id: courseId },
      orderBy: { order_index: 'asc' },
      include: { _count: { select: { lessons: true } } },
    });

    return units.map((unit) => ({
      unitId: unit.chapter_id,
      externalId: unit.external_id,
      courseId: unit.course_id,
      title: unit.title,
      description: unit.description,
      orderIndex: unit.order_index,
      lessonsCount: unit._count.lessons,
    }));
  }

  async getUnitDetail(unitId: number) {
    const unit = await prisma.chapters.findUnique({
      where: { chapter_id: unitId },
      include: {
        course: { select: { course_id: true, title: true, code: true, level: true } },
        lessons: {
          orderBy: { order_index: 'asc' },
          select: {
            lesson_id: true,
            external_id: true,
            title: true,
            order_index: true,
            estimated_duration_mins: true,
            status: true,
          },
        },
      },
    });

    if (!unit) throw AppError.notFound('Không tìm thấy Unit này.');

    return {
      unitId: unit.chapter_id,
      externalId: unit.external_id,
      courseId: unit.course_id,
      title: unit.title,
      description: unit.description,
      orderIndex: unit.order_index,
      course: unit.course,
      lessons: unit.lessons.map((lesson) => ({
        lessonId: lesson.lesson_id,
        externalId: lesson.external_id,
        title: lesson.title,
        orderIndex: lesson.order_index,
        estimatedDurationMins: lesson.estimated_duration_mins,
        status: lesson.status,
      })),
    };
  }

  async getUnitContent(unitId: number) {
    const unit = await prisma.chapters.findUnique({
      where: { chapter_id: unitId },
      include: {
        lessons: {
          orderBy: { order_index: 'asc' },
          include: lessonContentInclude,
        },
      },
    });

    if (!unit) throw AppError.notFound('Không tìm thấy Unit này.');

    return {
      unit: {
        unitId: unit.chapter_id,
        externalId: unit.external_id,
        courseId: unit.course_id,
        title: unit.title,
        description: unit.description,
        orderIndex: unit.order_index,
      },
      lessons: unit.lessons.map(mapLessonLearningContent),
    };
  }

  async getLessonContent(lessonId: number) {
    const lesson = await prisma.lessons.findUnique({
      where: { lesson_id: lessonId },
      include: {
        ...lessonContentInclude,
        chapter: {
          select: {
            chapter_id: true,
            external_id: true,
            title: true,
            course_id: true,
          },
        },
      },
    });

    if (!lesson) throw AppError.notFound('Không tìm thấy bài học này.');

    return {
      ...mapLessonLearningContent(lesson),
      unit: {
        unitId: lesson.chapter.chapter_id,
        externalId: lesson.chapter.external_id,
        title: lesson.chapter.title,
        courseId: lesson.chapter.course_id,
      },
    };
  }

  async listUnitContents(unitId: number, contentType?: ContentType) {
    const unit = await prisma.chapters.findUnique({
      where: { chapter_id: unitId },
      select: { chapter_id: true },
    });
    if (!unit) throw AppError.notFound('Không tìm thấy Unit này.');

    const references = await prisma.lessonBlockContentReferences.findMany({
      where: {
        lessonBlock: {
          is: {
            lesson: { is: { chapter_id: unitId } },
          },
        },
        ...(contentType ? { content: { is: { content_type: contentType } } } : {}),
      },
      include: {
        content: true,
        lessonBlock: {
          select: {
            block_id: true,
            order_index: true,
            lesson: { select: { lesson_id: true, order_index: true } },
          },
        },
      },
      orderBy: [{ lesson_block_id: 'asc' }, { order_index: 'asc' }],
    });

    references.sort(
      (a, b) =>
        a.lessonBlock.lesson.order_index - b.lessonBlock.lesson.order_index ||
        a.lessonBlock.order_index - b.lessonBlock.order_index ||
        a.order_index - b.order_index
    );

    const contents = new Map<
      number,
      {
        content_id: number;
        external_id: string;
        content_type: ContentType;
        item_id: string | null;
        order_index: number;
        content_json: Prisma.JsonValue;
        references: Array<{
          lesson_id: number;
          lesson_block_id: number;
          item_id: string | null;
          order_index: number;
        }>;
      }
    >();

    for (const reference of references) {
      let content = contents.get(reference.content_id);
      if (!content) {
        content = {
          content_id: reference.content.content_id,
          external_id: reference.content.external_id,
          content_type: reference.content.content_type,
          item_id: reference.item_id,
          order_index: reference.order_index,
          content_json: reference.content.content_json,
          references: [],
        };
        contents.set(reference.content_id, content);
      }
      content.references.push({
        lesson_id: reference.lessonBlock.lesson.lesson_id,
        lesson_block_id: reference.lessonBlock.block_id,
        item_id: reference.item_id,
        order_index: reference.order_index,
      });
    }

    return Array.from(contents.values());
  }

  async getLearningContent(contentId: number) {
    const content = await prisma.learningContents.findUnique({
      where: { content_id: contentId },
    });
    if (!content) throw AppError.notFound('Không tìm thấy nội dung học liệu này.');

    return {
      content_id: content.content_id,
      external_id: content.external_id,
      content_type: content.content_type,
      content_json: content.content_json,
      created_at: content.created_at,
      updated_at: content.updated_at,
    };
  }

  async getCourseDetail(courseId: number, userId?: number) {
    const course = await prisma.courses.findUnique({
      where: { course_id: courseId },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
          include: {
            lessons: {
              orderBy: { order_index: 'asc' },
              include: {
                _count: { select: { blocks: true, vocabularies: true, tests: true } },
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw AppError.notFound('Không tìm thấy khóa học này.');
    }

    // If userId provided, fetch user lesson progress for this course's lessons
    let progressMap: Map<number, boolean> = new Map();
    if (userId) {
      const lessonIds = course.chapters.flatMap((ch) => ch.lessons.map((l) => l.lesson_id));
      if (lessonIds.length > 0) {
        const progressRecords = await prisma.userLessonProgress.findMany({
          where: { user_id: userId, lesson_id: { in: lessonIds } },
        });
        for (const p of progressRecords) {
          progressMap.set(p.lesson_id, p.is_completed);
        }
      }
    }

    return {
      courseId: course.course_id,
      title: course.title,
      code: course.code,
      description: course.description,
      level: course.level,
      isPublished: course.is_published,
      createdAt: course.created_at,
      chapters: course.chapters.map((ch) => ({
        chapterId: ch.chapter_id,
        title: ch.title,
        orderIndex: ch.order_index,
        lessons: ch.lessons.map((l) => ({
          lessonId: l.lesson_id,
          title: l.title,
          orderIndex: l.order_index,
          estimatedDurationMins: l.estimated_duration_mins,
          status: l.status,
          blocksCount: l._count.blocks,
          vocabulariesCount: l._count.vocabularies,
          testsCount: l._count.tests,
          ...(userId ? { isCompleted: progressMap.get(l.lesson_id) ?? false } : {}),
        })),
      })),
    };
  }

  async createCourse(data: CreateCourseInput) {
    const existing = await prisma.courses.findUnique({ where: { code: data.code } });
    if (existing) {
      throw AppError.conflict(`Khóa học với mã "${data.code}" đã tồn tại.`);
    }

    const course = await prisma.courses.create({
      data: {
        title: data.title,
        code: data.code,
        description: data.description,
        level: data.level,
        is_published: data.is_published,
      },
    });

    return {
      courseId: course.course_id,
      title: course.title,
      code: course.code,
      level: course.level,
      isPublished: course.is_published,
      createdAt: course.created_at,
    };
  }

  async updateCourse(courseId: number, data: UpdateCourseInput) {
    const course = await prisma.courses.findUnique({ where: { course_id: courseId } });
    if (!course) {
      throw AppError.notFound('Không tìm thấy khóa học này.');
    }

    if (data.code && data.code !== course.code) {
      const existing = await prisma.courses.findUnique({ where: { code: data.code } });
      if (existing) {
        throw AppError.conflict(`Khóa học với mã "${data.code}" đã tồn tại.`);
      }
    }

    const updated = await prisma.courses.update({
      where: { course_id: courseId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.level !== undefined && { level: data.level }),
        ...(data.is_published !== undefined && { is_published: data.is_published }),
      },
    });

    return {
      courseId: updated.course_id,
      title: updated.title,
      code: updated.code,
      level: updated.level,
      isPublished: updated.is_published,
    };
  }

  // ─── Chapters ──────────────────────────────────────────────────────

  async createChapter(data: CreateChapterInput) {
    const course = await prisma.courses.findUnique({ where: { course_id: data.course_id } });
    if (!course) {
      throw AppError.notFound('Không tìm thấy khóa học để thêm chương.');
    }

    const chapter = await prisma.chapters.create({
      data: {
        course_id: data.course_id,
        title: data.title,
        order_index: data.order_index,
      },
    });

    return {
      chapterId: chapter.chapter_id,
      courseId: chapter.course_id,
      title: chapter.title,
      orderIndex: chapter.order_index,
    };
  }

  async updateChapter(chapterId: number, data: UpdateChapterInput) {
    const chapter = await prisma.chapters.findUnique({ where: { chapter_id: chapterId } });
    if (!chapter) {
      throw AppError.notFound('Không tìm thấy chương này.');
    }

    const updated = await prisma.chapters.update({
      where: { chapter_id: chapterId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.order_index !== undefined && { order_index: data.order_index }),
      },
    });

    return {
      chapterId: updated.chapter_id,
      courseId: updated.course_id,
      title: updated.title,
      orderIndex: updated.order_index,
    };
  }

  async deleteChapter(chapterId: number) {
    const chapter = await prisma.chapters.findUnique({ where: { chapter_id: chapterId } });
    if (!chapter) {
      throw AppError.notFound('Không tìm thấy chương này.');
    }

    await prisma.chapters.delete({ where: { chapter_id: chapterId } });
    return { message: 'Đã xóa chương thành công.' };
  }

  // ─── Lessons ───────────────────────────────────────────────────────

  async createLesson(data: CreateLessonInput) {
    const chapter = await prisma.chapters.findUnique({ where: { chapter_id: data.chapter_id } });
    if (!chapter) {
      throw AppError.notFound('Không tìm thấy chương để thêm bài học.');
    }

    const lesson = await prisma.lessons.create({
      data: {
        chapter_id: data.chapter_id,
        title: data.title,
        order_index: data.order_index,
        estimated_duration_mins: data.estimated_duration_mins,
        status: data.status,
      },
    });

    return {
      lessonId: lesson.lesson_id,
      chapterId: lesson.chapter_id,
      title: lesson.title,
      orderIndex: lesson.order_index,
      estimatedDurationMins: lesson.estimated_duration_mins,
      status: lesson.status,
    };
  }

  async updateLesson(lessonId: number, data: UpdateLessonInput) {
    const lesson = await prisma.lessons.findUnique({ where: { lesson_id: lessonId } });
    if (!lesson) {
      throw AppError.notFound('Không tìm thấy bài học này.');
    }

    const updated = await prisma.lessons.update({
      where: { lesson_id: lessonId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.order_index !== undefined && { order_index: data.order_index }),
        ...(data.estimated_duration_mins !== undefined && { estimated_duration_mins: data.estimated_duration_mins }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    return {
      lessonId: updated.lesson_id,
      chapterId: updated.chapter_id,
      title: updated.title,
      orderIndex: updated.order_index,
      estimatedDurationMins: updated.estimated_duration_mins,
      status: updated.status,
    };
  }

  async deleteLesson(lessonId: number) {
    const lesson = await prisma.lessons.findUnique({ where: { lesson_id: lessonId } });
    if (!lesson) {
      throw AppError.notFound('Không tìm thấy bài học này.');
    }

    await prisma.lessons.delete({ where: { lesson_id: lessonId } });
    return { message: 'Đã xóa bài học thành công.' };
  }

  async getLessonDetail(lessonId: number) {
    const lesson = await prisma.lessons.findUnique({
      where: { lesson_id: lessonId },
      include: {
        chapter: {
          include: { course: { select: { course_id: true, title: true, code: true } } },
        },
        blocks: {
          orderBy: { order_index: 'asc' },
          include: { mediaResource: true },
        },
        vocabularies: {
          include: {
            character: {
              include: { audioResource: true },
            },
          },
        },
        tests: {
          where: { is_published: true },
          select: { test_id: true, title: true, test_type: true, passing_score: true, time_limit_mins: true },
        },
      },
    });

    if (!lesson) {
      throw AppError.notFound('Không tìm thấy bài học này.');
    }

    return {
      lessonId: lesson.lesson_id,
      title: lesson.title,
      orderIndex: lesson.order_index,
      estimatedDurationMins: lesson.estimated_duration_mins,
      status: lesson.status,
      chapter: {
        chapterId: lesson.chapter.chapter_id,
        title: lesson.chapter.title,
        course: lesson.chapter.course,
      },
      blocks: lesson.blocks.map((b) => ({
        blockId: b.block_id,
        blockType: b.block_type,
        orderIndex: b.order_index,
        contentJson: b.content_json,
        mediaUrl: b.mediaResource?.public_url || null,
      })),
      vocabularies: lesson.vocabularies.map((v) => ({
        charId: v.character.char_id,
        character: v.character.character,
        pinyin: v.character.pinyin,
        sinoVietnamese: v.character.sino_vietnamese,
        meaning: v.character.meaning,
        strokesCount: v.character.strokes_count,
        audioUrl: v.character.audioResource?.public_url || null,
      })),
      tests: lesson.tests,
    };
  }

  // ─── Lesson Blocks ─────────────────────────────────────────────────

  async createLessonBlock(data: CreateLessonBlockInput) {
    const lesson = await prisma.lessons.findUnique({ where: { lesson_id: data.lesson_id } });
    if (!lesson) {
      throw AppError.notFound('Không tìm thấy bài học để thêm block.');
    }

    // Validate content_json is valid JSON
    try {
      JSON.parse(data.content_json);
    } catch {
      throw AppError.badRequest('Nội dung content_json không phải là JSON hợp lệ.');
    }

    const block = await prisma.lessonBlocks.create({
      data: {
        lesson_id: data.lesson_id,
        block_type: data.block_type,
        order_index: data.order_index,
        content_json: data.content_json,
        media_resource_id: data.media_resource_id || null,
      },
    });

    return {
      blockId: block.block_id,
      lessonId: block.lesson_id,
      blockType: block.block_type,
      orderIndex: block.order_index,
      contentJson: block.content_json,
    };
  }

  async updateLessonBlock(blockId: number, data: UpdateLessonBlockInput) {
    const block = await prisma.lessonBlocks.findUnique({ where: { block_id: blockId } });
    if (!block) {
      throw AppError.notFound('Không tìm thấy block này.');
    }

    if (data.content_json) {
      try {
        JSON.parse(data.content_json);
      } catch {
        throw AppError.badRequest('Nội dung content_json không phải là JSON hợp lệ.');
      }
    }

    const updated = await prisma.lessonBlocks.update({
      where: { block_id: blockId },
      data: {
        ...(data.block_type !== undefined && { block_type: data.block_type }),
        ...(data.order_index !== undefined && { order_index: data.order_index }),
        ...(data.content_json !== undefined && { content_json: data.content_json }),
        ...(data.media_resource_id !== undefined && { media_resource_id: data.media_resource_id }),
      },
    });

    return {
      blockId: updated.block_id,
      lessonId: updated.lesson_id,
      blockType: updated.block_type,
      orderIndex: updated.order_index,
      contentJson: updated.content_json,
    };
  }

  async deleteLessonBlock(blockId: number) {
    const block = await prisma.lessonBlocks.findUnique({ where: { block_id: blockId } });
    if (!block) {
      throw AppError.notFound('Không tìm thấy block này.');
    }

    await prisma.lessonBlocks.delete({ where: { block_id: blockId } });
    return { message: 'Đã xóa block thành công.' };
  }

  // ─── Publishing ────────────────────────────────────────────────────

  async publishLesson(lessonId: number) {
    const lesson = await prisma.lessons.findUnique({
      where: { lesson_id: lessonId },
      include: { _count: { select: { blocks: true } } },
    });

    if (!lesson) {
      throw AppError.notFound('Không tìm thấy bài học này.');
    }

    if (lesson.status === 'PUBLISHED') {
      throw AppError.badRequest('Bài học này đã được xuất bản.');
    }

    if (lesson._count.blocks === 0) {
      throw AppError.badRequest('Bài học phải có ít nhất 1 block nội dung trước khi xuất bản.');
    }

    const updated = await prisma.lessons.update({
      where: { lesson_id: lessonId },
      data: { status: 'PUBLISHED' },
    });

    return {
      lessonId: updated.lesson_id,
      title: updated.title,
      status: updated.status,
      message: 'Đã xuất bản bài học thành công.',
    };
  }

  async publishCourse(courseId: number) {
    const course = await prisma.courses.findUnique({
      where: { course_id: courseId },
      include: {
        chapters: {
          include: {
            lessons: { select: { lesson_id: true, status: true, title: true } },
          },
        },
      },
    });

    if (!course) {
      throw AppError.notFound('Không tìm thấy khóa học này.');
    }

    if (course.is_published) {
      throw AppError.badRequest('Khóa học này đã được xuất bản.');
    }

    // Validate all lessons are published
    const unpublishedLessons = course.chapters
      .flatMap((ch) => ch.lessons)
      .filter((l) => l.status !== 'PUBLISHED');

    if (unpublishedLessons.length > 0) {
      throw AppError.badRequest(
        `Không thể xuất bản khóa học. ${unpublishedLessons.length} bài học chưa được xuất bản: ${unpublishedLessons.map((l) => l.title).join(', ')}`,
        'UNPUBLISHED_LESSONS',
        { unpublishedLessons: unpublishedLessons.map((l) => ({ lessonId: l.lesson_id, title: l.title })) }
      );
    }

    if (course.chapters.length === 0) {
      throw AppError.badRequest('Khóa học phải có ít nhất 1 chương trước khi xuất bản.');
    }

    const updated = await prisma.courses.update({
      where: { course_id: courseId },
      data: { is_published: true },
    });

    return {
      courseId: updated.course_id,
      title: updated.title,
      isPublished: updated.is_published,
      message: 'Đã xuất bản khóa học thành công.',
    };
  }
}

export const curriculumService = new CurriculumService();
