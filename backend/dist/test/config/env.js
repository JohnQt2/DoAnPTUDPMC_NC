"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('5000').transform((v) => parseInt(v, 10)),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: zod_1.z.string().default('file:./dev.db'),
    JWT_ACCESS_SECRET: zod_1.z.string().default('chinaeasy_super_secret_access_jwt_key_2026_xyz'),
    JWT_REFRESH_SECRET: zod_1.z.string().default('chinaeasy_super_secret_refresh_jwt_key_2026_abc'),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('30d'),
    REDIS_URL: zod_1.z.string().default('redis://127.0.0.1:6379'),
    USE_MEMORY_REDIS: zod_1.z
        .string()
        .default('true')
        .transform((v) => v === 'true'),
    GOOGLE_CLIENT_ID: zod_1.z.string().default('mock-google-client-id-chinaeasy.apps.googleusercontent.com'),
    CLIENT_URL: zod_1.z.string().default('http://localhost:5173'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;
