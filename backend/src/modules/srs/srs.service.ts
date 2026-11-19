import { prisma } from '../../shared/database/prisma.client';
import { AppError } from '../../shared/errors/app-error';
import { calculateSM2, ratingToQuality, previewNextIntervals } from '../../shared/utils/sm2';
import { ReviewSrsCardInput } from './srs.dto';

export class SrsService {
  /**
   * UC08/UC09: Lấy hàng đợi thẻ đến hạn ôn tập trong ngày (tối đa 25 từ)
   */
  async getDailyQueue(userId: number, limit: number = 25) {
    const now = new Date();

    const dueItems = await prisma.userSrsItems.findMany({
      where: {
        user_id: userId,
        next_review_at: { lte: now },
      },
      take: limit,
      orderBy: { next_review_at: 'asc' },
      include: {
        character: {
          include: { audioResource: true },
        },
      },
    });

    // If user has few due items, also suggest unstudied characters up to limit
    let unstudiedChars: any[] = [];
    if (dueItems.length < 5) {
      const existingCharIds = (
        await prisma.userSrsItems.findMany({
          where: { user_id: userId },
          select: { char_id: true },
        })
      ).map((item) => item.char_id);

      unstudiedChars = await prisma.characters.findMany({
        where: {
          char_id: { notIn: existingCharIds.length > 0 ? existingCharIds : [0] },
        },
        take: Math.min(10, limit - dueItems.length),
        include: { audioResource: true },
      });
    }

    const cards = dueItems.map((item) => {
      const preview = previewNextIntervals({
        repetitions: item.repetitions,
        easeFactor: item.ease_factor,
        intervalDays: item.interval_days,
      });

      return {
        srsId: item.srs_id,
        charId: item.char_id,
        character: item.character.character,
        pinyin: item.character.pinyin,
        sinoVietnamese: item.character.sino_vietnamese,
        meaning: item.character.meaning,
        radical: item.character.radical,
        strokesCount: item.character.strokes_count,
        strokeOrderSvg: item.character.stroke_order_svg,
        audioUrl: item.character.audioResource?.public_url || `/audio/characters/${item.character.character}.mp3`,
        repetitions: item.repetitions,
        easeFactor: item.ease_factor,
        intervalDays: item.interval_days,
        nextReviewAt: item.next_review_at,
        isNew: false,
        intervalPreviews: preview,
      };
    });

    for (const c of unstudiedChars) {
      const preview = previewNextIntervals({
        repetitions: 0,
        easeFactor: 2.5,
        intervalDays: 1,
      });

      cards.push({
        srsId: 0,
        charId: c.char_id,
        character: c.character,
        pinyin: c.pinyin,
        sinoVietnamese: c.sino_vietnamese,
        meaning: c.meaning,
        radical: c.radical,
        strokesCount: c.strokes_count,
        strokeOrderSvg: c.stroke_order_svg,
        audioUrl: c.audioResource?.public_url || `/audio/characters/${c.character}.mp3`,
        repetitions: 0,
        easeFactor: 2.5,
        intervalDays: 1,
        nextReviewAt: now,
        isNew: true,
        intervalPreviews: preview,
      });
    }

    return {
      dueCount: dueItems.length,
      totalQueueCount: cards.length,
      cards,
    };
  }

  /**
   * UC08: Ghi nhận đánh giá ôn tập Flashcard theo thuật toán SuperMemo-2 (SM-2)
   */
  async submitReview(userId: number, data: ReviewSrsCardInput) {
    const quality = ratingToQuality(data.rating as any);

    // Fetch existing SRS item or default initialization
    let srsItem = await prisma.userSrsItems.findUnique({
      where: {
        UQ_User_Char_SRS: {
          user_id: userId,
          char_id: data.char_id,
        },
      },
    });

    const currentRepetitions = srsItem ? srsItem.repetitions : 0;
    const currentEaseFactor = srsItem ? srsItem.ease_factor : 2.5;
    const currentIntervalDays = srsItem ? srsItem.interval_days : 1;

    // Run SM-2 Calculation
    const sm2Result = calculateSM2({
      repetitions: currentRepetitions,
      easeFactor: currentEaseFactor,
      intervalDays: currentIntervalDays,
      quality,
    });

    // Upsert record in database
    const updated = await prisma.userSrsItems.upsert({
      where: {
        UQ_User_Char_SRS: {
          user_id: userId,
          char_id: data.char_id,
        },
      },
      create: {
        user_id: userId,
        char_id: data.char_id,
        repetitions: sm2Result.repetitions,
        ease_factor: sm2Result.easeFactor,
        interval_days: sm2Result.intervalDays,
        next_review_at: sm2Result.nextReviewAt,
        last_reviewed_at: new Date(),
      },
      update: {
        repetitions: sm2Result.repetitions,
        ease_factor: sm2Result.easeFactor,
        interval_days: sm2Result.intervalDays,
        next_review_at: sm2Result.nextReviewAt,
        last_reviewed_at: new Date(),
      },
      include: { character: true },
    });

    // Record practice record
    await prisma.userSkillPractices.create({
      data: {
        user_id: userId,
        practice_type: 'HANZI_STROKE',
        char_id: data.char_id,
        is_successful: quality >= 3,
        mistakes_count: quality < 3 ? 1 : 0,
      },
    });

    return {
      srsId: updated.srs_id,
      charId: updated.char_id,
      character: updated.character.character,
      repetitions: updated.repetitions,
      easeFactor: updated.ease_factor,
      intervalDays: updated.interval_days,
      nextReviewAt: updated.next_review_at,
      message: `Đã cập nhật lịch ôn tập: ${updated.interval_days} ngày sau.`,
    };
  }

  /**
   * Thống kê toàn diện SRS của học viên
   */
  async getSrsStats(userId: number) {
    const now = new Date();

    const [totalCards, dueToday, mastered, learning] = await Promise.all([
      prisma.userSrsItems.count({ where: { user_id: userId } }),
      prisma.userSrsItems.count({
        where: { user_id: userId, next_review_at: { lte: now } },
      }),
      prisma.userSrsItems.count({
        where: { user_id: userId, repetitions: { gte: 5 } },
      }),
      prisma.userSrsItems.count({
        where: { user_id: userId, repetitions: { lt: 5 } },
      }),
    ]);

    return {
      totalCards,
      dueToday,
      masteredCards: mastered,
      learningCards: learning,
    };
  }

  /**
   * Xem trước khoảng thời gian tiếp theo cho 1 chữ Hán cụ thể
   */
  async previewIntervalsForChar(userId: number, charId: number) {
    const srsItem = await prisma.userSrsItems.findUnique({
      where: {
        UQ_User_Char_SRS: {
          user_id: userId,
          char_id: charId,
        },
      },
    });

    return previewNextIntervals({
      repetitions: srsItem?.repetitions || 0,
      easeFactor: srsItem?.ease_factor || 2.5,
      intervalDays: srsItem?.interval_days || 1,
    });
  }
}

export const srsService = new SrsService();
