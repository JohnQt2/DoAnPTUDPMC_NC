-- CreateTable
CREATE TABLE "Users" (
    "user_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "display_name" TEXT NOT NULL,
    "avatar_resource_id" INTEGER,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "UserSessions" (
    "session_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "setting_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "reminder_time" TEXT NOT NULL DEFAULT '20:00',
    "notify_email" BOOLEAN NOT NULL DEFAULT true,
    "notify_webpush" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("setting_id")
);

-- CreateTable
CREATE TABLE "Courses" (
    "course_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT NOT NULL DEFAULT 'HSK1',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Courses_pkey" PRIMARY KEY ("course_id")
);

-- CreateTable
CREATE TABLE "Chapters" (
    "chapter_id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "Chapters_pkey" PRIMARY KEY ("chapter_id")
);

-- CreateTable
CREATE TABLE "Lessons" (
    "lesson_id" SERIAL NOT NULL,
    "chapter_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "estimated_duration_mins" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lessons_pkey" PRIMARY KEY ("lesson_id")
);

-- CreateTable
CREATE TABLE "LessonBlocks" (
    "block_id" SERIAL NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "block_type" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "content_json" JSONB NOT NULL,
    "media_resource_id" INTEGER,

    CONSTRAINT "LessonBlocks_pkey" PRIMARY KEY ("block_id")
);

-- CreateTable
CREATE TABLE "Characters" (
    "char_id" SERIAL NOT NULL,
    "character" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "sino_vietnamese" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "radical" TEXT,
    "strokes_count" INTEGER NOT NULL DEFAULT 1,
    "stroke_order_svg" TEXT,
    "audio_resource_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Characters_pkey" PRIMARY KEY ("char_id")
);

-- CreateTable
CREATE TABLE "LessonVocabularies" (
    "lesson_id" INTEGER NOT NULL,
    "char_id" INTEGER NOT NULL,

    CONSTRAINT "LessonVocabularies_pkey" PRIMARY KEY ("lesson_id","char_id")
);

-- CreateTable
CREATE TABLE "PinyinSyllables" (
    "syllable_id" SERIAL NOT NULL,
    "syllable" TEXT NOT NULL,
    "tone" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "f0_pitch_contour" TEXT,
    "mouth_shape_guide" TEXT,
    "audio_resource_id" INTEGER,
    "contrast_pair_id" INTEGER,

    CONSTRAINT "PinyinSyllables_pkey" PRIMARY KEY ("syllable_id")
);

-- CreateTable
CREATE TABLE "MediaResources" (
    "resource_id" SERIAL NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL DEFAULT 0,
    "resource_type" TEXT NOT NULL,
    "uploaded_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaResources_pkey" PRIMARY KEY ("resource_id")
);

-- CreateTable
CREATE TABLE "Questions" (
    "question_id" SERIAL NOT NULL,
    "question_type" TEXT NOT NULL,
    "skill_category" TEXT NOT NULL,
    "difficulty_level" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "options_json" TEXT NOT NULL,
    "correct_answer" TEXT NOT NULL,
    "explanation" TEXT,
    "media_resource_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Questions_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "Tests" (
    "test_id" SERIAL NOT NULL,
    "lesson_id" INTEGER,
    "title" TEXT NOT NULL,
    "test_type" TEXT NOT NULL DEFAULT 'QUIZ',
    "passing_score" INTEGER NOT NULL DEFAULT 80,
    "time_limit_mins" INTEGER NOT NULL DEFAULT 15,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tests_pkey" PRIMARY KEY ("test_id")
);

-- CreateTable
CREATE TABLE "TestQuestions" (
    "test_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "TestQuestions_pkey" PRIMARY KEY ("test_id","question_id")
);

-- CreateTable
CREATE TABLE "TestSubmissions" (
    "submission_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "test_id" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "is_passed" BOOLEAN NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "idempotency_key" TEXT,
    "snapshot_data" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestSubmissions_pkey" PRIMARY KEY ("submission_id")
);

-- CreateTable
CREATE TABLE "TestSubmissionDetails" (
    "detail_id" SERIAL NOT NULL,
    "submission_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "user_answer" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "TestSubmissionDetails_pkey" PRIMARY KEY ("detail_id")
);

-- CreateTable
CREATE TABLE "UserLessonProgress" (
    "progress_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "last_studied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLessonProgress_pkey" PRIMARY KEY ("progress_id")
);

-- CreateTable
CREATE TABLE "UserRoadmaps" (
    "roadmap_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "starting_level" TEXT NOT NULL,
    "target_goal" TEXT NOT NULL,
    "daily_commitment_mins" INTEGER NOT NULL DEFAULT 15,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoadmaps_pkey" PRIMARY KEY ("roadmap_id")
);

-- CreateTable
CREATE TABLE "UserSkillPractices" (
    "practice_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "practice_type" TEXT NOT NULL,
    "char_id" INTEGER,
    "syllable_id" INTEGER,
    "is_successful" BOOLEAN NOT NULL,
    "mistakes_count" INTEGER NOT NULL DEFAULT 0,
    "practiced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSkillPractices_pkey" PRIMARY KEY ("practice_id")
);

-- CreateTable
CREATE TABLE "UserSrsItems" (
    "srs_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "char_id" INTEGER NOT NULL,
    "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval_days" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "next_review_at" TIMESTAMP(3) NOT NULL,
    "last_reviewed_at" TIMESTAMP(3),

    CONSTRAINT "UserSrsItems_pkey" PRIMARY KEY ("srs_id")
);

-- CreateTable
CREATE TABLE "AuditLogs" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action_type" TEXT NOT NULL,
    "target_entity" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "DatabaseBackups" (
    "backup_id" SERIAL NOT NULL,
    "backup_file_name" TEXT NOT NULL,
    "storage_r2_url" TEXT,
    "file_size_bytes" INTEGER,
    "checksum_sha256" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "DatabaseBackups_pkey" PRIMARY KEY ("backup_id")
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

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_avatar_resource_id_fkey" FOREIGN KEY ("avatar_resource_id") REFERENCES "MediaResources"("resource_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSessions" ADD CONSTRAINT "UserSessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapters" ADD CONSTRAINT "Chapters_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lessons" ADD CONSTRAINT "Lessons_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "Chapters"("chapter_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonBlocks" ADD CONSTRAINT "LessonBlocks_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lessons"("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonBlocks" ADD CONSTRAINT "LessonBlocks_media_resource_id_fkey" FOREIGN KEY ("media_resource_id") REFERENCES "MediaResources"("resource_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Characters" ADD CONSTRAINT "Characters_audio_resource_id_fkey" FOREIGN KEY ("audio_resource_id") REFERENCES "MediaResources"("resource_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonVocabularies" ADD CONSTRAINT "LessonVocabularies_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lessons"("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonVocabularies" ADD CONSTRAINT "LessonVocabularies_char_id_fkey" FOREIGN KEY ("char_id") REFERENCES "Characters"("char_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinyinSyllables" ADD CONSTRAINT "PinyinSyllables_audio_resource_id_fkey" FOREIGN KEY ("audio_resource_id") REFERENCES "MediaResources"("resource_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinyinSyllables" ADD CONSTRAINT "PinyinSyllables_contrast_pair_id_fkey" FOREIGN KEY ("contrast_pair_id") REFERENCES "PinyinSyllables"("syllable_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaResources" ADD CONSTRAINT "MediaResources_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_media_resource_id_fkey" FOREIGN KEY ("media_resource_id") REFERENCES "MediaResources"("resource_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tests" ADD CONSTRAINT "Tests_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lessons"("lesson_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuestions" ADD CONSTRAINT "TestQuestions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "Tests"("test_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuestions" ADD CONSTRAINT "TestQuestions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSubmissions" ADD CONSTRAINT "TestSubmissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSubmissions" ADD CONSTRAINT "TestSubmissions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "Tests"("test_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSubmissionDetails" ADD CONSTRAINT "TestSubmissionDetails_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "TestSubmissions"("submission_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSubmissionDetails" ADD CONSTRAINT "TestSubmissionDetails_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lessons"("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoadmaps" ADD CONSTRAINT "UserRoadmaps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoadmaps" ADD CONSTRAINT "UserRoadmaps_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillPractices" ADD CONSTRAINT "UserSkillPractices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillPractices" ADD CONSTRAINT "UserSkillPractices_char_id_fkey" FOREIGN KEY ("char_id") REFERENCES "Characters"("char_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillPractices" ADD CONSTRAINT "UserSkillPractices_syllable_id_fkey" FOREIGN KEY ("syllable_id") REFERENCES "PinyinSyllables"("syllable_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSrsItems" ADD CONSTRAINT "UserSrsItems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSrsItems" ADD CONSTRAINT "UserSrsItems_char_id_fkey" FOREIGN KEY ("char_id") REFERENCES "Characters"("char_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogs" ADD CONSTRAINT "AuditLogs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
