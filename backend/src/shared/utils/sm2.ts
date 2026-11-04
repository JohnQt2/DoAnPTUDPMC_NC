export interface SM2Input {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  quality: number; // 0 to 5
}

export interface SM2Result {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: Date;
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export function ratingToQuality(rating: ReviewRating | number): number {
  if (typeof rating === 'number') {
    return Math.max(0, Math.min(5, Math.round(rating)));
  }
  switch (rating.toLowerCase()) {
    case 'again':
      return 1; // Complete failure / forgotten
    case 'hard':
      return 2; // Recalled with extreme difficulty
    case 'good':
      return 4; // Good recall with slight hesitation
    case 'easy':
      return 5; // Perfect recall without hesitation
    default:
      return 3;
  }
}

export function calculateSM2(input: SM2Input, referenceDate: Date = new Date()): SM2Result {
  const { quality } = input;
  let { repetitions, easeFactor, intervalDays } = input;

  if (easeFactor < 1.3) easeFactor = 1.3;

  // If failed (q < 3), reset repetitions to 0 and interval to 1 day
  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    // Successful recall
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitions += 1;
  }

  // Update Ease Factor (EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
  const efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  easeFactor = Math.max(1.3, Number((easeFactor + efDelta).toFixed(2)));

  const nextReviewAt = new Date(referenceDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    repetitions,
    easeFactor,
    intervalDays,
    nextReviewAt,
  };
}

export function previewNextIntervals(current: {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
}): Record<ReviewRating, { intervalDays: number; label: string }> {
  const ratings: ReviewRating[] = ['again', 'hard', 'good', 'easy'];
  const preview: Partial<Record<ReviewRating, { intervalDays: number; label: string }>> = {};

  for (const r of ratings) {
    const q = ratingToQuality(r);
    const result = calculateSM2({ ...current, quality: q });
    const days = result.intervalDays;
    const label = days === 1 ? '1 ngày' : `${days} ngày`;
    preview[r] = { intervalDays: days, label };
  }

  return preview as Record<ReviewRating, { intervalDays: number; label: string }>;
}
