import { z } from 'zod';
export declare const UpdateProfileDto: z.ZodObject<{
    display_name: z.ZodOptional<z.ZodString>;
    avatar_url: z.ZodOptional<z.ZodString>;
    avatar_resource_id: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    display_name?: string | undefined;
    avatar_resource_id?: number | undefined;
    avatar_url?: string | undefined;
}, {
    display_name?: string | undefined;
    avatar_resource_id?: number | undefined;
    avatar_url?: string | undefined;
}>;
export declare const OnboardingSurveyDto: z.ZodObject<{
    starting_level: z.ZodEnum<["ZERO", "PINYIN_KNOWN", "ELEMENTARY"]>;
    target_goal: z.ZodEnum<["HSK1", "HSK2", "COMMUNICATION", "HOBBY"]>;
    daily_commitment_mins: z.ZodDefault<z.ZodNumber>;
    reminder_time: z.ZodDefault<z.ZodString>;
    course_id: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    reminder_time: string;
    starting_level: "ZERO" | "PINYIN_KNOWN" | "ELEMENTARY";
    target_goal: "HSK1" | "HSK2" | "COMMUNICATION" | "HOBBY";
    daily_commitment_mins: number;
    course_id?: number | undefined;
}, {
    starting_level: "ZERO" | "PINYIN_KNOWN" | "ELEMENTARY";
    target_goal: "HSK1" | "HSK2" | "COMMUNICATION" | "HOBBY";
    reminder_time?: string | undefined;
    course_id?: number | undefined;
    daily_commitment_mins?: number | undefined;
}>;
export declare const UpdateNotificationsDto: z.ZodObject<{
    reminder_time: z.ZodOptional<z.ZodString>;
    notify_email: z.ZodOptional<z.ZodBoolean>;
    notify_webpush: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    reminder_time?: string | undefined;
    notify_email?: boolean | undefined;
    notify_webpush?: boolean | undefined;
}, {
    reminder_time?: string | undefined;
    notify_email?: boolean | undefined;
    notify_webpush?: boolean | undefined;
}>;
export declare const AdminUpdateUserDto: z.ZodObject<{
    role: z.ZodOptional<z.ZodEnum<["STUDENT", "CONTENT_EDITOR", "ADMIN"]>>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "LOCKED", "BANNED"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "LOCKED" | "ACTIVE" | "BANNED" | undefined;
    role?: "STUDENT" | "ADMIN" | "CONTENT_EDITOR" | undefined;
}, {
    status?: "LOCKED" | "ACTIVE" | "BANNED" | undefined;
    role?: "STUDENT" | "ADMIN" | "CONTENT_EDITOR" | undefined;
}>;
