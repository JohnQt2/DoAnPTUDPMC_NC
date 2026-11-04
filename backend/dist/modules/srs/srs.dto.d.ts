import { z } from 'zod';
export declare const ReviewSrsCardDto: z.ZodObject<{
    char_id: z.ZodNumber;
    rating: z.ZodUnion<[z.ZodEnum<["again", "hard", "good", "easy"]>, z.ZodNumber]>;
}, "strip", z.ZodTypeAny, {
    char_id: number;
    rating: number | "again" | "hard" | "good" | "easy";
}, {
    char_id: number;
    rating: number | "again" | "hard" | "good" | "easy";
}>;
export type ReviewSrsCardInput = z.infer<typeof ReviewSrsCardDto>;
