import { z } from 'zod';

export const ReviewSrsCardDto = z.object({
  char_id: z.number().int().positive('Mã chữ Hán phải là số nguyên dương.'),
  rating: z.union([
    z.enum(['again', 'hard', 'good', 'easy']),
    z.number().int().min(0).max(5),
  ]),
});

export type ReviewSrsCardInput = z.infer<typeof ReviewSrsCardDto>;
