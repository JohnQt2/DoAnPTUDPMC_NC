"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryPinyinDto = exports.RecordPracticeDto = void 0;
const zod_1 = require("zod");
exports.RecordPracticeDto = zod_1.z.object({
    practice_type: zod_1.z.enum(['PINYIN', 'TONE', 'MINIMAL_PAIR', 'HANZI_STROKE'], {
        errorMap: () => ({ message: 'Loại bài luyện tập không hợp lệ.' }),
    }),
    char_id: zod_1.z.number().int().positive().optional(),
    syllable_id: zod_1.z.number().int().positive().optional(),
    is_successful: zod_1.z.boolean(),
    mistakes_count: zod_1.z.number().int().min(0).default(0),
    score: zod_1.z.number().min(0).max(100).optional(),
});
exports.QueryPinyinDto = zod_1.z.object({
    category: zod_1.z.enum(['INITIAL', 'FINAL', 'SYLLABLE']).optional(),
    tone: zod_1.z.string().transform((v) => parseInt(v, 10)).optional(),
});
