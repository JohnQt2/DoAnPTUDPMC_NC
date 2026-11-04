import { ReviewSrsCardInput } from './srs.dto';
export declare class SrsService {
    /**
     * UC08/UC09: Lấy hàng đợi thẻ đến hạn ôn tập trong ngày (tối đa 25 từ)
     */
    getDailyQueue(userId: number, limit?: number): Promise<{
        dueCount: number;
        totalQueueCount: number;
        cards: {
            srsId: number;
            charId: number;
            character: string;
            pinyin: string;
            sinoVietnamese: string;
            meaning: string;
            radical: string | null;
            strokesCount: number;
            strokeOrderSvg: string | null;
            audioUrl: string;
            repetitions: number;
            easeFactor: number;
            intervalDays: number;
            nextReviewAt: Date;
            isNew: boolean;
            intervalPreviews: Record<import("../../shared/utils/sm2").ReviewRating, {
                intervalDays: number;
                label: string;
            }>;
        }[];
    }>;
    /**
     * UC08: Ghi nhận đánh giá ôn tập Flashcard theo thuật toán SuperMemo-2 (SM-2)
     */
    submitReview(userId: number, data: ReviewSrsCardInput): Promise<{
        srsId: number;
        charId: number;
        character: string;
        repetitions: number;
        easeFactor: number;
        intervalDays: number;
        nextReviewAt: Date;
        message: string;
    }>;
    /**
     * Thống kê toàn diện SRS của học viên
     */
    getSrsStats(userId: number): Promise<{
        totalCards: number;
        dueToday: number;
        masteredCards: number;
        learningCards: number;
    }>;
    /**
     * Xem trước khoảng thời gian tiếp theo cho 1 chữ Hán cụ thể
     */
    previewIntervalsForChar(userId: number, charId: number): Promise<Record<import("../../shared/utils/sm2").ReviewRating, {
        intervalDays: number;
        label: string;
    }>>;
}
export declare const srsService: SrsService;
