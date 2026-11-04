import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

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
  GOOGLE_CLIENT_ID: z.string().default('mock-google-client-id-chinaeasy.apps.googleusercontent.com'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
