import { z } from 'zod';
export declare const RecordPracticeDto: z.ZodObject<{
    practice_type: z.ZodEnum<["PINYIN", "TONE", "MINIMAL_PAIR", "HANZI_STROKE"]>;
    char_id: z.ZodOptional<z.ZodNumber>;
    syllable_id: z.ZodOptional<z.ZodNumber>;
    is_successful: z.ZodBoolean;
    mistakes_count: z.ZodDefault<z.ZodNumber>;
    score: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    practice_type: "PINYIN" | "TONE" | "MINIMAL_PAIR" | "HANZI_STROKE";
    is_successful: boolean;
    mistakes_count: number;
    char_id?: number | undefined;
    syllable_id?: number | undefined;
    score?: number | undefined;
}, {
    practice_type: "PINYIN" | "TONE" | "MINIMAL_PAIR" | "HANZI_STROKE";
    is_successful: boolean;
    char_id?: number | undefined;
    syllable_id?: number | undefined;
    mistakes_count?: number | undefined;
    score?: number | undefined;
}>;
export declare const QueryPinyinDto: z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<["INITIAL", "FINAL", "SYLLABLE"]>>;
    tone: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
}, "strip", z.ZodTypeAny, {
    category?: "INITIAL" | "FINAL" | "SYLLABLE" | undefined;
    tone?: number | undefined;
}, {
    category?: "INITIAL" | "FINAL" | "SYLLABLE" | undefined;
    tone?: string | undefined;
}>;
export type RecordPracticeInput = z.infer<typeof RecordPracticeDto>;
