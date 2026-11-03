import { prisma } from '../../shared/database/prisma.client';
import { AppError } from '../../shared/errors/app-error';
import { RecordPracticeInput } from './learning.dto';

export class LearningService {
  /**
   * UC05: Cung cấp danh mục ngữ âm Pinyin và thanh điệu
   */
  async getPinyinList(category?: string, tone?: number) {
    const where: any = {};
    if (category) where.category = category;
    if (tone !== undefined && !isNaN(tone)) where.tone = tone;

    const syllables = await prisma.pinyinSyllables.findMany({
      where,
      include: {
        audioResource: true,
        contrastPair: {
          include: { audioResource: true },
        },
      },
      orderBy: [{ category: 'asc' }, { syllable: 'asc' }, { tone: 'asc' }],
    });

    return syllables.map((s) => ({
      syllableId: s.syllable_id,
      syllable: s.syllable,
      tone: s.tone,
      category: s.category,
      f0PitchContour: s.f0_pitch_contour,
      mouthShapeGuide: s.mouth_shape_guide,
      audioUrl: s.audioResource?.public_url || `/audio/pinyin/${s.syllable}_${s.tone}.mp3`,
      contrastPair: s.contrastPair
        ? {
            syllableId: s.contrastPair.syllable_id,
            syllable: s.contrastPair.syllable,
            tone: s.contrastPair.tone,
            audioUrl: s.contrastPair.audioResource?.public_url || `/audio/pinyin/${s.contrastPair.syllable}_${s.contrastPair.tone}.mp3`,
          }
        : null,
    }));
  }

  /**
   * UC05: Danh sách các bộ tương phản tối thiểu (Minimal Pairs)
   */
  async getMinimalPairs() {
    const pairs = await prisma.pinyinSyllables.findMany({
      where: {
        contrast_pair_id: { not: null },
      },
      include: {
        audioResource: true,
        contrastPair: {
          include: { audioResource: true },
        },
      },
    });

    return pairs.map((item) => ({
      id: item.syllable_id,
      primary: {
        id: item.syllable_id,
        syllable: item.syllable,
        tone: item.tone,
        f0: item.f0_pitch_contour,
        mouthGuide: item.mouth_shape_guide,
        audioUrl: item.audioResource?.public_url || `/audio/pinyin/${item.syllable}_${item.tone}.mp3`,
      },
      contrasting: item.contrastPair
        ? {
            id: item.contrastPair.syllable_id,
            syllable: item.contrastPair.syllable,
            tone: item.contrastPair.tone,
            f0: item.contrastPair.f0_pitch_contour,
            mouthGuide: item.contrastPair.mouth_shape_guide,
            audioUrl: item.contrastPair.audioResource?.public_url || `/audio/pinyin/${item.contrastPair.syllable}_${item.contrastPair.tone}.mp3`,
          }
        : null,
      pedagogicalTip: item.mouth_shape_guide || 'Chú ý độ mở của khẩu hình và luồng hơi bật ra.',
    }));
  }

  /**
   * UC06: Luyện viết chữ Hán và danh sách từ vựng kèm SVG nét vẽ
   */
  async getCharacters(search?: string, limit: number = 30) {
    const where: any = {};
    if (search) {
      where.OR = [
        { character: { contains: search } },
        { pinyin: { contains: search } },
        { sino_vietnamese: { contains: search } },
        { meaning: { contains: search } },
      ];
    }

    const characters = await prisma.characters.findMany({
      where,
      take: limit,
      include: { audioResource: true },
      orderBy: { char_id: 'asc' },
    });

    return characters.map((c) => ({
      charId: c.char_id,
      character: c.character,
      pinyin: c.pinyin,
      sinoVietnamese: c.sino_vietnamese,
      meaning: c.meaning,
      radical: c.radical,
      strokesCount: c.strokes_count,
      strokeOrderSvg: c.stroke_order_svg,
      audioUrl: c.audioResource?.public_url || `/audio/characters/${c.character}.mp3`,
    }));
  }

  async getCharacterDetail(charId: number) {
    const char = await prisma.characters.findUnique({
      where: { char_id: charId },
      include: {
        audioResource: true,
        vocabularies: {
          include: { lesson: true },
        },
      },
    });

    if (!char) {
      throw AppError.notFound('Không tìm thấy chữ Hán này.');
    }

    return {
      charId: char.char_id,
      character: char.character,
      pinyin: char.pinyin,
      sinoVietnamese: char.sino_vietnamese,
      meaning: char.meaning,
      radical: char.radical,
      strokesCount: char.strokes_count,
      strokeOrderSvg: char.stroke_order_svg,
      audioUrl: char.audioResource?.public_url || `/audio/characters/${char.character}.mp3`,
      lessons: char.vocabularies.map((v) => ({
        lessonId: v.lesson.lesson_id,
        lessonTitle: v.lesson.title,
      })),
    };
  }

  /**
   * Lưu trữ kết quả luyện tập của học viên (UserSkillPractices)
   */
  async recordPractice(userId: number, data: RecordPracticeInput) {
    const practice = await prisma.userSkillPractices.create({
      data: {
        user_id: userId,
        practice_type: data.practice_type,
        char_id: data.char_id || null,
        syllable_id: data.syllable_id || null,
        is_successful: data.is_successful,
        mistakes_count: data.mistakes_count,
      },
    });

    // If practicing a character successfully, automatically add or maintain item in SRS!
    if (data.char_id && data.is_successful) {
      await prisma.userSrsItems.upsert({
        where: {
          UQ_User_Char_SRS: {
            user_id: userId,
            char_id: data.char_id,
          },
        },
        create: {
          user_id: userId,
          char_id: data.char_id,
          ease_factor: 2.5,
          interval_days: 1,
          repetitions: 1,
          next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
        },
        update: {
          last_reviewed_at: new Date(),
        },
      });
    }

    return {
      practiceId: practice.practice_id,
      isSuccessful: practice.is_successful,
      mistakesCount: practice.mistakes_count,
      practicedAt: practice.practiced_at,
    };
  }

  /**
   * Lấy thống kê luyện tập cá nhân
   */
  async getPracticeStats(userId: number) {
    const [total, successful, byType] = await Promise.all([
      prisma.userSkillPractices.count({ where: { user_id: userId } }),
      prisma.userSkillPractices.count({ where: { user_id: userId, is_successful: true } }),
      prisma.userSkillPractices.groupBy({
        by: ['practice_type'],
        where: { user_id: userId },
        _count: { practice_id: true },
      }),
    ]);

    const accuracy = total > 0 ? Math.round((successful / total) * 100) : 0;

    return {
      totalPractices: total,
      successfulPractices: successful,
      accuracyPercentage: accuracy,
      breakdownByType: byType.map((b) => ({
        type: b.practice_type,
        count: b._count.practice_id,
      })),
    };
  }
}

export const learningService = new LearningService();
