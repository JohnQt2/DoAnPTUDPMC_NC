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

const noWhitespacePassword = (minMsg: string) =>
  z
    .string()
    .min(6, minMsg)
    .max(128, 'Mật khẩu không được vượt quá 128 ký tự.')
    .refine((val) => !/\s/.test(val), 'Mật khẩu không được chứa dấu cách.');

export const RegisterDto = z.object({
  email: z.string().email('Địa chỉ email không đúng định dạng.').trim().toLowerCase(),
  password: noWhitespacePassword('Mật khẩu phải có ít nhất 6 ký tự.'),
  full_name: z.string().min(2, 'Tên hiển thị tối thiểu 2 ký tự.').max(100).optional(),
  displayName: z.string().min(2).max(100).optional(),
  display_name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export const SendOtpDto = z.object({
  email: z.string().email('Địa chỉ email không đúng định dạng.').trim().toLowerCase(),
  password: noWhitespacePassword('Mật khẩu phải có ít nhất 6 ký tự.').optional(),
  displayName: z.string().min(2, 'Tên hiển thị tối thiểu 2 ký tự.').max(50).optional(),
  mode: z.enum(['register', 'login']).optional(),
});

export const VerifyOtpDto = z.object({
  email: z.string().email('Địa chỉ email không đúng định dạng.').trim().toLowerCase(),
  otp: z.string().regex(/^\d{6}$/, 'Mã OTP phải gồm đúng 6 chữ số.'),
});

export const LoginPasswordDto = z.object({
  email: z.string().email('Địa chỉ email không đúng định dạng.').trim().toLowerCase(),
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

export const ForgotPasswordSendOtpDto = z.object({
  email: z.string().email('Địa chỉ email không đúng định dạng.').trim().toLowerCase(),
});

export const ForgotPasswordVerifyOtpDto = z.object({
  email: z.string().email('Địa chỉ email không đúng định dạng.').trim().toLowerCase(),
  otp: z.string().regex(/^\d{6}$/, 'Mã OTP phải gồm đúng 6 chữ số.'),
});

export const ResetPasswordWithOtpDto = z
  .object({
    email: z.string().email('Địa chỉ email không đúng định dạng.').trim().toLowerCase(),
    otp: z.string().regex(/^\d{6}$/, 'Mã OTP phải gồm đúng 6 chữ số.').optional(),
    resetToken: z.string().min(16, 'Phiên đặt lại mật khẩu không hợp lệ.').optional(),
    newPassword: noWhitespacePassword('Mật khẩu mới phải có ít nhất 6 ký tự.'),
  })
  .refine((data) => Boolean(data.resetToken || data.otp), {
    message: 'Thiếu mã xác thực OTP hoặc phiên đặt lại mật khẩu.',
    path: ['otp'],
  });

export type RegisterInput = z.infer<typeof RegisterDto>;
export type SendOtpInput = z.infer<typeof SendOtpDto>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpDto>;
export type LoginPasswordInput = z.infer<typeof LoginPasswordDto>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthDto>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenDto>;
export type ForgotPasswordSendOtpInput = z.infer<typeof ForgotPasswordSendOtpDto>;
export type ForgotPasswordVerifyOtpInput = z.infer<typeof ForgotPasswordVerifyOtpDto>;
export type ResetPasswordWithOtpInput = z.infer<typeof ResetPasswordWithOtpDto>;
