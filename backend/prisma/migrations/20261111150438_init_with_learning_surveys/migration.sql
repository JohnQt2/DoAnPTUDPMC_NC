-- CreateTable
CREATE TABLE "Users" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "display_name" TEXT NOT NULL,
    "avatar_resource_id" INTEGER,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" DATETIME,
    CONSTRAINT "Users_avatar_resource_id_fkey" FOREIGN KEY ("avatar_resource_id") REFERENCES "MediaResources" ("resource_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSessions" (
    "session_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "setting_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "reminder_time" TEXT NOT NULL DEFAULT '20:00',
    "notify_email" BOOLEAN NOT NULL DEFAULT true,
    "notify_webpush" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationSettings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserLearningSurveys" (
    "survey_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "current_level" TEXT NOT NULL,
    "target_goal" TEXT NOT NULL,
    "expected_duration_months" INTEGER NOT NULL,
    "daily_available_minutes" INTEGER NOT NULL,
    "learning_purposes_json" TEXT NOT NULL,
    "preferred_skills_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserLearningSurveys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Courses" (
    "course_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT NOT NULL DEFAULT 'HSK1',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Chapters" (
    "chapter_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "course_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    CONSTRAINT "Chapters_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Courses" ("course_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lessons" (
    "lesson_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chapter_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "estimated_duration_mins" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lessons_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "Chapters" ("chapter_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonBlocks" (
    "block_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lesson_id" INTEGER NOT NULL,
    "block_type" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "content_json" TEXT NOT NULL,
    "media_resource_id" INTEGER,
    CONSTRAINT "LessonBlocks_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lessons" ("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonBlocks_media_resource_id_fkey" FOREIGN KEY ("media_resource_id") REFERENCES "MediaResources" ("resource_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Characters" (
    "char_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "character" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "sino_vietnamese" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "radical" TEXT,
    "strokes_count" INTEGER NOT NULL DEFAULT 1,
    "stroke_order_svg" TEXT,
    "audio_resource_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Characters_audio_resource_id_fkey" FOREIGN KEY ("audio_resource_id") REFERENCES "MediaResources" ("resource_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonVocabularies" (
    "lesson_id" INTEGER NOT NULL,
    "char_id" INTEGER NOT NULL,

    PRIMARY KEY ("lesson_id", "char_id"),
    CONSTRAINT "LessonVocabularies_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lessons" ("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonVocabularies_char_id_fkey" FOREIGN KEY ("char_id") REFERENCES "Characters" ("char_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PinyinSyllables" (
    "syllable_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "syllable" TEXT NOT NULL,
    "tone" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "f0_pitch_contour" TEXT,
    "mouth_shape_guide" TEXT,
    "audio_resource_id" INTEGER,
    "contrast_pair_id" INTEGER,
    CONSTRAINT "PinyinSyllables_audio_resource_id_fkey" FOREIGN KEY ("audio_resource_id") REFERENCES "MediaResources" ("resource_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PinyinSyllables_contrast_pair_id_fkey" FOREIGN KEY ("contrast_pair_id") REFERENCES "PinyinSyllables" ("syllable_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaResources" (
    "resource_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "file_name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL DEFAULT 0,
    "resource_type" TEXT NOT NULL,
    "uploaded_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaResources_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Questions" (
    "question_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question_type" TEXT NOT NULL,
    "skill_category" TEXT NOT NULL,
    "difficulty_level" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "options_json" TEXT NOT NULL,
    "correct_answer" TEXT NOT NULL,
    "explanation" TEXT,
    "media_resource_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Questions_media_resource_id_fkey" FOREIGN KEY ("media_resource_id") REFERENCES "MediaResources" ("resource_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tests" (
    "test_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lesson_id" INTEGER,
    "title" TEXT NOT NULL,
    "test_type" TEXT NOT NULL DEFAULT 'QUIZ',
    "passing_score" INTEGER NOT NULL DEFAULT 80,
    "time_limit_mins" INTEGER NOT NULL DEFAULT 15,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tests_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lessons" ("lesson_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestQuestions" (
    "test_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,

    PRIMARY KEY ("test_id", "question_id"),
    CONSTRAINT "TestQuestions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "Tests" ("test_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestQuestions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Questions" ("question_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestSubmissions" (
    "submission_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "test_id" INTEGER NOT NULL,
    "score" REAL NOT NULL,
    "is_passed" BOOLEAN NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "idempotency_key" TEXT,
    "snapshot_data" TEXT,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestSubmissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestSubmissions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "Tests" ("test_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestSubmissionDetails" (
    "detail_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "submission_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "user_answer" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    CONSTRAINT "TestSubmissionDetails_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "TestSubmissions" ("submission_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestSubmissionDetails_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Questions" ("question_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserLessonProgress" (
    "progress_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "last_studied_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserLessonProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserLessonProgress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lessons" ("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserRoadmaps" (
    "roadmap_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "starting_level" TEXT NOT NULL,
    "target_goal" TEXT NOT NULL,
    "daily_commitment_mins" INTEGER NOT NULL DEFAULT 15,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRoadmaps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserRoadmaps_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Courses" ("course_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSkillPractices" (
    "practice_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "practice_type" TEXT NOT NULL,
    "char_id" INTEGER,
    "syllable_id" INTEGER,
    "is_successful" BOOLEAN NOT NULL,
    "mistakes_count" INTEGER NOT NULL DEFAULT 0,
    "practiced_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSkillPractices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserSkillPractices_char_id_fkey" FOREIGN KEY ("char_id") REFERENCES "Characters" ("char_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UserSkillPractices_syllable_id_fkey" FOREIGN KEY ("syllable_id") REFERENCES "PinyinSyllables" ("syllable_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSrsItems" (
    "srs_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "char_id" INTEGER NOT NULL,
    "ease_factor" REAL NOT NULL DEFAULT 2.5,
    "interval_days" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "next_review_at" DATETIME NOT NULL,
    "last_reviewed_at" DATETIME,
    CONSTRAINT "UserSrsItems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserSrsItems_char_id_fkey" FOREIGN KEY ("char_id") REFERENCES "Characters" ("char_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLogs" (
    "log_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "action_type" TEXT NOT NULL,
    "target_entity" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLogs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatabaseBackups" (
    "backup_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "backup_file_name" TEXT NOT NULL,
    "storage_r2_url" TEXT,
    "file_size_bytes" INTEGER,
    "checksum_sha256" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE INDEX "UserSessions_user_id_idx" ON "UserSessions"("user_id");

-- CreateIndex
CREATE INDEX "UserSessions_refresh_token_hash_idx" ON "UserSessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "UserSessions_family_id_idx" ON "UserSessions"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_user_id_key" ON "NotificationSettings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserLearningSurveys_user_id_key" ON "UserLearningSurveys"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Courses_code_key" ON "Courses"("code");

-- CreateIndex
CREATE INDEX "Chapters_course_id_order_index_idx" ON "Chapters"("course_id", "order_index");

-- CreateIndex
CREATE INDEX "Lessons_chapter_id_order_index_idx" ON "Lessons"("chapter_id", "order_index");

-- CreateIndex
CREATE INDEX "LessonBlocks_lesson_id_order_index_idx" ON "LessonBlocks"("lesson_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "Characters_character_key" ON "Characters"("character");

-- CreateIndex
CREATE INDEX "Characters_character_idx" ON "Characters"("character");

-- CreateIndex
CREATE INDEX "PinyinSyllables_syllable_tone_idx" ON "PinyinSyllables"("syllable", "tone");

-- CreateIndex
CREATE UNIQUE INDEX "TestSubmissions_idempotency_key_key" ON "TestSubmissions"("idempotency_key");

-- CreateIndex
CREATE INDEX "TestSubmissions_user_id_submitted_at_idx" ON "TestSubmissions"("user_id", "submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "UserLessonProgress_user_id_lesson_id_key" ON "UserLessonProgress"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "UserRoadmaps_user_id_is_active_idx" ON "UserRoadmaps"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "UserSkillPractices_user_id_practice_type_practiced_at_idx" ON "UserSkillPractices"("user_id", "practice_type", "practiced_at");

-- CreateIndex
CREATE INDEX "UserSrsItems_user_id_next_review_at_idx" ON "UserSrsItems"("user_id", "next_review_at");

-- CreateIndex
CREATE UNIQUE INDEX "UserSrsItems_user_id_char_id_key" ON "UserSrsItems"("user_id", "char_id");

-- CreateIndex
CREATE INDEX "AuditLogs_created_at_idx" ON "AuditLogs"("created_at");

-- CreateIndex
CREATE INDEX "AuditLogs_user_id_idx" ON "AuditLogs"("user_id");
