"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewSrsCardDto = void 0;
const zod_1 = require("zod");
exports.ReviewSrsCardDto = zod_1.z.object({
    char_id: zod_1.z.number().int().positive('Mã chữ Hán phải là số nguyên dương.'),
    rating: zod_1.z.union([
        zod_1.z.enum(['again', 'hard', 'good', 'easy']),
        zod_1.z.number().int().min(0).max(5),
    ]),
});
