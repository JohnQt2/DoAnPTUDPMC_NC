export interface SM2Input {
    repetitions: number;
    easeFactor: number;
    intervalDays: number;
    quality: number;
}
export interface SM2Result {
    repetitions: number;
    easeFactor: number;
    intervalDays: number;
    nextReviewAt: Date;
}
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';
export declare function ratingToQuality(rating: ReviewRating | number): number;
export declare function calculateSM2(input: SM2Input, referenceDate?: Date): SM2Result;
export declare function previewNextIntervals(current: {
    repetitions: number;
    easeFactor: number;
    intervalDays: number;
}): Record<ReviewRating, {
    intervalDays: number;
    label: string;
}>;
