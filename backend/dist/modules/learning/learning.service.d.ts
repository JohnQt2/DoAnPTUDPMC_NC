import { RecordPracticeInput } from './learning.dto';
export declare class LearningService {
    /**
     * UC05: Cung cấp danh mục ngữ âm Pinyin và thanh điệu
     */
    getPinyinList(category?: string, tone?: number): Promise<{
        syllableId: number;
        syllable: string;
        tone: number;
        category: string;
        f0PitchContour: string | null;
        mouthShapeGuide: string | null;
        audioUrl: string;
        contrastPair: {
            syllableId: number;
            syllable: string;
            tone: number;
            audioUrl: string;
        } | null;
    }[]>;
    /**
     * UC05: Danh sách các bộ tương phản tối thiểu (Minimal Pairs)
     */
    getMinimalPairs(): Promise<{
        id: number;
        primary: {
            id: number;
            syllable: string;
            tone: number;
            f0: string | null;
            mouthGuide: string | null;
            audioUrl: string;
        };
        contrasting: {
            id: number;
            syllable: string;
            tone: number;
            f0: string | null;
            mouthGuide: string | null;
            audioUrl: string;
        } | null;
        pedagogicalTip: string;
    }[]>;
    /**
     * UC06: Luyện viết chữ Hán và danh sách từ vựng kèm SVG nét vẽ
     */
    getCharacters(search?: string, limit?: number): Promise<{
        charId: number;
        character: string;
        pinyin: string;
        sinoVietnamese: string;
        meaning: string;
        radical: string | null;
        strokesCount: number;
        strokeOrderSvg: string | null;
        audioUrl: string;
    }[]>;
    getCharacterDetail(charId: number): Promise<{
        charId: number;
        character: string;
        pinyin: string;
        sinoVietnamese: string;
        meaning: string;
        radical: string | null;
        strokesCount: number;
        strokeOrderSvg: string | null;
        audioUrl: string;
        lessons: {
            lessonId: number;
            lessonTitle: string;
        }[];
    }>;
    /**
     * Lưu trữ kết quả luyện tập của học viên (UserSkillPractices)
     */
    recordPractice(userId: number, data: RecordPracticeInput): Promise<{
        practiceId: number;
        isSuccessful: boolean;
        mistakesCount: number;
        practicedAt: Date;
    }>;
    /**
     * Lấy thống kê luyện tập cá nhân
     */
    getPracticeStats(userId: number): Promise<{
        totalPractices: number;
        successfulPractices: number;
        accuracyPercentage: number;
        breakdownByType: {
            type: string;
            count: number;
        }[];
    }>;
}
export declare const learningService: LearningService;
