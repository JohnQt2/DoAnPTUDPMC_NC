import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Giá trị mẫu trong .env.example. Nếu người dùng copy .env.example -> .env mà chưa điền,
 * các giá trị này (hoặc chuỗi rỗng) sẽ bị bỏ qua để hệ thống dùng cấu hình mặc định thay vì
 * đăng nhập SMTP hoặc Google OAuth2 bằng cấu hình giả và thất bại.
 */
const PLACEHOLDER_VALUES = new Set([
  'your_email@gmail.com',
  'your_16_digit_gmail_app_password',
  'ChinaEasy <your_email@gmail.com>',
  'mock-google-client-id-chinaeasy.apps.googleusercontent.com',
  'mock-google-client-secret',
]);

export function cleanEnvValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || PLACEHOLDER_VALUES.has(trimmed)) return undefined;
  return trimmed;
}

const envSchema = z.object({
  PORT: z.string().default('5000').transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_ACCESS_SECRET: z.string().default('chinaeasy_super_secret_access_jwt_key_2026_xyz'),
  JWT_REFRESH_SECRET: z.string().default('chinaeasy_super_secret_refresh_jwt_key_2026_abc'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  USE_MEMORY_REDIS: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  GOOGLE_CLIENT_ID: z
    .string()
    .default('236710689789-ipu0ad4sdke0paakb5ujmu0ukq9b4mc9.apps.googleusercontent.com'),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_CALLBACK_URL: z
    .string()
    .default('http://localhost:5000/api/v1/auth/google/callback'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('465').transform((v) => parseInt(v, 10)),
  SMTP_USER: z.string().default('hieuhoanghuu436@gmail.com'),
  SMTP_PASS: z.string().default('nxax fptz ldpt txyu'),
  SMTP_FROM: z.string().default('ChinaEasy <hieuhoanghuu436@gmail.com>'),
});

const parsed = envSchema.safeParse(
  Object.fromEntries(
    Object.keys(envSchema.shape).map((key) => [key, cleanEnvValue(process.env[key])])
  )
);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
