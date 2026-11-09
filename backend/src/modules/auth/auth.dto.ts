import { z } from 'zod';

const gmailOrSystemEmail = z
  .string()
  .email('Địa chỉ email không đúng định dạng.')
  .trim()
  .toLowerCase()
  .refine(
    (val) =>
      val.endsWith('@gmail.com') ||
      val.endsWith('@chinaeasy.vn') ||
      val.endsWith('@example.com'),
    {
      message: 'Vui lòng sử dụng địa chỉ email có định dạng @gmail.com.',
    }
  );

export const SendOtpDto = z.object({
  email: gmailOrSystemEmail,
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.').optional(),
  displayName: z.string().min(2, 'Tên hiển thị tối thiểu 2 ký tự.').max(50).optional(),
  mode: z.enum(['register', 'login']).optional(),
});

export const VerifyOtpDto = z.object({
  email: gmailOrSystemEmail,
  otp: z.string().regex(/^\d{6}$/, 'Mã OTP phải gồm đúng 6 chữ số.'),
});

export const LoginPasswordDto = z.object({
  email: gmailOrSystemEmail,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

export const GoogleAuthDto = z.object({
  accessToken: z.string().optional(),
  code: z.string().optional(),
  redirectUri: z.string().optional(),
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
export type LoginPasswordInput = z.infer<typeof LoginPasswordDto>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthDto>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenDto>;
