import { z } from 'zod';
export declare const SendOtpDto: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const VerifyOtpDto: z.ZodObject<{
    email: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    otp: string;
}, {
    email: string;
    otp: string;
}>;
export declare const GoogleAuthDto: z.ZodObject<{
    credential: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    googleId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    credential?: string | undefined;
    name?: string | undefined;
    avatar?: string | undefined;
    googleId?: string | undefined;
}, {
    email?: string | undefined;
    credential?: string | undefined;
    name?: string | undefined;
    avatar?: string | undefined;
    googleId?: string | undefined;
}>;
export declare const RefreshTokenDto: z.ZodObject<{
    refreshToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    refreshToken?: string | undefined;
}, {
    refreshToken?: string | undefined;
}>;
export type SendOtpInput = z.infer<typeof SendOtpDto>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpDto>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthDto>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenDto>;
