import { z } from 'zod';

export const SendOtpDto = z.object({
  email: z.string().email('Địa chỉ email không đúng định dạng.').trim().toLowerCase(),
});

export const VerifyOtpDto = z.object({
  email: z.string().email('Địa chỉ email không đúng định dạng.').trim().toLowerCase(),
  otp: z.string().regex(/^\d{6}$/, 'Mã OTP phải gồm đúng 6 chữ số.'),
});

export const GoogleAuthDto = z.object({
  credential: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  googleId: z.string().optional(),
});

export const RefreshTokenDto = z.object({
  refreshToken: z.string().optional(),
});

export type SendOtpInput = z.infer<typeof SendOtpDto>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpDto>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthDto>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenDto>;
