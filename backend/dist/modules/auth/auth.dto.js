"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenDto = exports.GoogleAuthDto = exports.VerifyOtpDto = exports.SendOtpDto = void 0;
const zod_1 = require("zod");
exports.SendOtpDto = zod_1.z.object({
    email: zod_1.z.string().email('Địa chỉ email không đúng định dạng.').trim().toLowerCase(),
});
exports.VerifyOtpDto = zod_1.z.object({
    email: zod_1.z.string().email('Địa chỉ email không đúng định dạng.').trim().toLowerCase(),
    otp: zod_1.z.string().regex(/^\d{6}$/, 'Mã OTP phải gồm đúng 6 chữ số.'),
});
exports.GoogleAuthDto = zod_1.z.object({
    credential: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    name: zod_1.z.string().optional(),
    avatar: zod_1.z.string().optional(),
    googleId: zod_1.z.string().optional(),
});
exports.RefreshTokenDto = zod_1.z.object({
    refreshToken: zod_1.z.string().optional(),
});
