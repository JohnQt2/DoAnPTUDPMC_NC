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
    FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chapters" (
    "chapter_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "course_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "description" TEXT,
    "objective" TEXT,
    "slug" TEXT,
    "thumbnail_url" TEXT,
    "unit_number" INTEGER,
    FOREIGN KEY ("course_id") REFERENCES "Courses" ("course_id") ON DELETE CASCADE ON UPDATE CASCADE
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
    FOREIGN KEY ("audio_resource_id") REFERENCES "MediaResources" ("resource_id") ON DELETE SET NULL ON UPDATE CASCADE
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

-- CreateTable
CREATE TABLE "Dialogue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dialogue_id" TEXT NOT NULL,
    "title" TEXT,
    "audio_path" TEXT,
    "turns" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Exercise" (
    "exercise_id" TEXT NOT NULL,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unit_id" INTEGER,
    "exercise_type" TEXT NOT NULL,
    "instruction" TEXT,
    "question" TEXT,
    "options" TEXT,
    "items" TEXT,
    "left_items" TEXT,
    "right_items" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("unit_id") REFERENCES "Chapters" ("chapter_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseAnswer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "exercise_id" TEXT NOT NULL,
    "answer_type" TEXT NOT NULL,
    "correct_data" TEXT NOT NULL,
    "explanation" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("exercise_id") REFERENCES "Exercise" ("exercise_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Grammar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grammar_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "structure" TEXT,
    "explanation" TEXT,
    "notes" TEXT,
    "examples" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Hanzi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hanzi_id" TEXT NOT NULL,
    "character" TEXT NOT NULL,
    "pinyin" TEXT,
    "meaning" TEXT,
    "stroke_count" INTEGER,
    "radical" TEXT,
    "notes" TEXT,
    "examples" TEXT,
    "character_audio_path" TEXT,
    "stroke_svg_path" TEXT,
    "svg_content" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LessonBlocks" (
    "block_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lesson_id" INTEGER NOT NULL,
    "block_type" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "content_json" TEXT NOT NULL,
    "media_resource_id" INTEGER,
    FOREIGN KEY ("media_resource_id") REFERENCES "MediaResources" ("resource_id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("lesson_id") REFERENCES "Lessons" ("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonVocabularies" (
    "lesson_id" INTEGER NOT NULL,
    "char_id" INTEGER NOT NULL,

    PRIMARY KEY ("lesson_id", "char_id"),
    FOREIGN KEY ("char_id") REFERENCES "Characters" ("char_id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("lesson_id") REFERENCES "Lessons" ("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE
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
    FOREIGN KEY ("chapter_id") REFERENCES "Chapters" ("chapter_id") ON DELETE CASCADE ON UPDATE CASCADE
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
    FOREIGN KEY ("uploaded_by") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "setting_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "reminder_time" TEXT NOT NULL DEFAULT '20:00',
    "notify_email" BOOLEAN NOT NULL DEFAULT true,
    "notify_webpush" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OutboxMessages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" DATETIME
);

-- CreateTable
CREATE TABLE "Phonetic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phonetic_id" TEXT NOT NULL,
    "syllables" TEXT,
    "rules" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    FOREIGN KEY ("contrast_pair_id") REFERENCES "PinyinSyllables" ("syllable_id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("audio_resource_id") REFERENCES "MediaResources" ("resource_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeAttemptAnswers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "attemptId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "earnedScore" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("questionId") REFERENCES "PracticeQuestions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("attemptId") REFERENCES "PracticeAttempts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeAttempts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "exerciseSetId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "earnedScore" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY ("exerciseSetId") REFERENCES "PracticeExerciseSets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeExerciseSets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lessonId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "titleVi" TEXT,
    "instructions" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 15,
    "audioUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("lessonId") REFERENCES "PracticeLessons" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeLessonProgress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "completedExerciseCount" INTEGER NOT NULL DEFAULT 0,
    "lastExerciseSetId" INTEGER,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("lessonId") REFERENCES "PracticeLessons" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeLessons" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "levelId" INTEGER NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "titleZh" TEXT NOT NULL,
    "titlePinyin" TEXT,
    "titleVi" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("levelId") REFERENCES "PracticeLevels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeLevels" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PracticeMediaAssets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalFilename" TEXT,
    "duration" REAL,
    "checksum" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PracticeQuestions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "exerciseSetId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "explanation" TEXT,
    "score" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "sourcePage" INTEGER,
    "sourceAudio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("exerciseSetId") REFERENCES "PracticeExerciseSets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    FOREIGN KEY ("media_resource_id") REFERENCES "MediaResources" ("resource_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SentencePattern" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sentence_pattern_id" TEXT NOT NULL,
    "title" TEXT,
    "pattern" TEXT NOT NULL,
    "explanation" TEXT,
    "notes" TEXT,
    "examples" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TestQuestions" (
    "test_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,

    PRIMARY KEY ("test_id", "question_id"),
    FOREIGN KEY ("question_id") REFERENCES "Questions" ("question_id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("test_id") REFERENCES "Tests" ("test_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestSubmissionDetails" (
    "detail_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "submission_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "user_answer" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    FOREIGN KEY ("question_id") REFERENCES "Questions" ("question_id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("submission_id") REFERENCES "TestSubmissions" ("submission_id") ON DELETE CASCADE ON UPDATE CASCADE
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
    FOREIGN KEY ("test_id") REFERENCES "Tests" ("test_id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
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
    FOREIGN KEY ("lesson_id") REFERENCES "Lessons" ("lesson_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnitDialogue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unit_id" INTEGER NOT NULL,
    "dialogue_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "block_type" TEXT,
    FOREIGN KEY ("dialogue_id") REFERENCES "Dialogue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("unit_id") REFERENCES "Chapters" ("chapter_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnitGrammar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unit_id" INTEGER NOT NULL,
    "grammar_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "block_type" TEXT,
    FOREIGN KEY ("grammar_id") REFERENCES "Grammar" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("unit_id") REFERENCES "Chapters" ("chapter_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnitHanzi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unit_id" INTEGER NOT NULL,
    "hanzi_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "block_type" TEXT,
    FOREIGN KEY ("hanzi_id") REFERENCES "Hanzi" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("unit_id") REFERENCES "Chapters" ("chapter_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnitPhonetic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unit_id" INTEGER NOT NULL,
    "phonetic_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "block_type" TEXT,
    FOREIGN KEY ("phonetic_id") REFERENCES "Phonetic" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("unit_id") REFERENCES "Chapters" ("chapter_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnitSentencePattern" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unit_id" INTEGER NOT NULL,
    "sentence_pattern_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "block_type" TEXT,
    FOREIGN KEY ("sentence_pattern_id") REFERENCES "SentencePattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("unit_id") REFERENCES "Chapters" ("chapter_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnitVocabulary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unit_id" INTEGER NOT NULL,
    "vocabulary_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "block_type" TEXT,
    FOREIGN KEY ("vocabulary_id") REFERENCES "Vocabulary" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("unit_id") REFERENCES "Chapters" ("chapter_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserLessonProgress" (
    "progress_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "status" TEXT DEFAULT 'LOCKED',
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "highest_score" REAL DEFAULT 0,
    "completed_at" DATETIME,
    "last_studied_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("lesson_id") REFERENCES "Lessons" ("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
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
    FOREIGN KEY ("course_id") REFERENCES "Courses" ("course_id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
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
    FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
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
    FOREIGN KEY ("syllable_id") REFERENCES "PinyinSyllables" ("syllable_id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("char_id") REFERENCES "Characters" ("char_id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
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
    FOREIGN KEY ("char_id") REFERENCES "Characters" ("char_id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Users" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "display_name" TEXT NOT NULL,
    "avatar_resource_id" INTEGER,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" DATETIME,
    FOREIGN KEY ("avatar_resource_id") REFERENCES "MediaResources" ("resource_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vocabulary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vocabulary_id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "word_type" TEXT,
    "notes" TEXT,
    "examples" TEXT,
    "word_image_path" TEXT,
    "word_audio_path" TEXT,
    "hsk_level" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "profile_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "goal" TEXT,
    "current_level" TEXT,
    "expected_duration" TEXT,
    "daily_study_minutes" INTEGER DEFAULT 15,
    "phone" TEXT,
    "bio" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AuditLogs_user_id_idx" ON "AuditLogs"("user_id" ASC);

-- CreateIndex
CREATE INDEX "AuditLogs_created_at_idx" ON "AuditLogs"("created_at" ASC);

-- CreateIndex
CREATE INDEX "Chapters_course_id_order_index_idx" ON "Chapters"("course_id" ASC, "order_index" ASC);

-- CreateIndex
CREATE INDEX "Characters_character_idx" ON "Characters"("character" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Characters_character_key" ON "Characters"("character" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Courses_code_key" ON "Courses"("code" ASC);

-- CreateIndex
CREATE INDEX "Dialogue_dialogue_id_idx" ON "Dialogue"("dialogue_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Dialogue_dialogue_id_key" ON "Dialogue"("dialogue_id" ASC);

-- CreateIndex
CREATE INDEX "Exercise_unit_id_idx" ON "Exercise"("unit_id" ASC);

-- CreateIndex
CREATE INDEX "Exercise_exercise_id_idx" ON "Exercise"("exercise_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_exercise_id_key" ON "Exercise"("exercise_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseAnswer_exercise_id_key" ON "ExerciseAnswer"("exercise_id" ASC);

-- CreateIndex
CREATE INDEX "Grammar_grammar_id_idx" ON "Grammar"("grammar_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Grammar_grammar_id_key" ON "Grammar"("grammar_id" ASC);

-- CreateIndex
CREATE INDEX "Hanzi_character_idx" ON "Hanzi"("character" ASC);

-- CreateIndex
CREATE INDEX "Hanzi_hanzi_id_idx" ON "Hanzi"("hanzi_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Hanzi_character_key" ON "Hanzi"("character" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Hanzi_hanzi_id_key" ON "Hanzi"("hanzi_id" ASC);

-- CreateIndex
CREATE INDEX "LessonBlocks_lesson_id_order_index_idx" ON "LessonBlocks"("lesson_id" ASC, "order_index" ASC);

-- CreateIndex
CREATE INDEX "Lessons_chapter_id_order_index_idx" ON "Lessons"("chapter_id" ASC, "order_index" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_user_id_key" ON "NotificationSettings"("user_id" ASC);

-- CreateIndex
CREATE INDEX "OutboxMessages_status_created_at_idx" ON "OutboxMessages"("status" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "Phonetic_phonetic_id_idx" ON "Phonetic"("phonetic_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Phonetic_phonetic_id_key" ON "Phonetic"("phonetic_id" ASC);

-- CreateIndex
CREATE INDEX "PinyinSyllables_syllable_tone_idx" ON "PinyinSyllables"("syllable" ASC, "tone" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PracticeAttemptAnswers_attemptId_questionId_key" ON "PracticeAttemptAnswers"("attemptId" ASC, "questionId" ASC);

-- CreateIndex
CREATE INDEX "PracticeAttemptAnswers_attemptId_idx" ON "PracticeAttemptAnswers"("attemptId" ASC);

-- CreateIndex
CREATE INDEX "PracticeAttempts_userId_exerciseSetId_idx" ON "PracticeAttempts"("userId" ASC, "exerciseSetId" ASC);

-- CreateIndex
CREATE INDEX "PracticeExerciseSets_lessonId_sortOrder_idx" ON "PracticeExerciseSets"("lessonId" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PracticeExerciseSets_code_key" ON "PracticeExerciseSets"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PracticeLessonProgress_userId_lessonId_key" ON "PracticeLessonProgress"("userId" ASC, "lessonId" ASC);

-- CreateIndex
CREATE INDEX "PracticeLessonProgress_userId_idx" ON "PracticeLessonProgress"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PracticeLessons_levelId_lessonNumber_key" ON "PracticeLessons"("levelId" ASC, "lessonNumber" ASC);

-- CreateIndex
CREATE INDEX "PracticeLessons_levelId_sortOrder_idx" ON "PracticeLessons"("levelId" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PracticeLevels_code_key" ON "PracticeLevels"("code" ASC);

-- CreateIndex
CREATE INDEX "PracticeQuestions_exerciseSetId_sortOrder_idx" ON "PracticeQuestions"("exerciseSetId" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PracticeQuestions_code_key" ON "PracticeQuestions"("code" ASC);

-- CreateIndex
CREATE INDEX "SentencePattern_sentence_pattern_id_idx" ON "SentencePattern"("sentence_pattern_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SentencePattern_sentence_pattern_id_key" ON "SentencePattern"("sentence_pattern_id" ASC);

-- CreateIndex
CREATE INDEX "TestSubmissions_user_id_submitted_at_idx" ON "TestSubmissions"("user_id" ASC, "submitted_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TestSubmissions_idempotency_key_key" ON "TestSubmissions"("idempotency_key" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UnitDialogue_unit_id_dialogue_id_key" ON "UnitDialogue"("unit_id" ASC, "dialogue_id" ASC);

-- CreateIndex
CREATE INDEX "UnitDialogue_unit_id_order_index_idx" ON "UnitDialogue"("unit_id" ASC, "order_index" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UnitGrammar_unit_id_grammar_id_key" ON "UnitGrammar"("unit_id" ASC, "grammar_id" ASC);

-- CreateIndex
CREATE INDEX "UnitGrammar_unit_id_order_index_idx" ON "UnitGrammar"("unit_id" ASC, "order_index" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UnitHanzi_unit_id_hanzi_id_key" ON "UnitHanzi"("unit_id" ASC, "hanzi_id" ASC);

-- CreateIndex
CREATE INDEX "UnitHanzi_unit_id_order_index_idx" ON "UnitHanzi"("unit_id" ASC, "order_index" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UnitPhonetic_unit_id_phonetic_id_key" ON "UnitPhonetic"("unit_id" ASC, "phonetic_id" ASC);

-- CreateIndex
CREATE INDEX "UnitPhonetic_unit_id_order_index_idx" ON "UnitPhonetic"("unit_id" ASC, "order_index" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UnitSentencePattern_unit_id_sentence_pattern_id_key" ON "UnitSentencePattern"("unit_id" ASC, "sentence_pattern_id" ASC);

-- CreateIndex
CREATE INDEX "UnitSentencePattern_unit_id_order_index_idx" ON "UnitSentencePattern"("unit_id" ASC, "order_index" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UnitVocabulary_unit_id_vocabulary_id_key" ON "UnitVocabulary"("unit_id" ASC, "vocabulary_id" ASC);

-- CreateIndex
CREATE INDEX "UnitVocabulary_unit_id_order_index_idx" ON "UnitVocabulary"("unit_id" ASC, "order_index" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserLessonProgress_user_id_lesson_id_key" ON "UserLessonProgress"("user_id" ASC, "lesson_id" ASC);

-- CreateIndex
CREATE INDEX "UserRoadmaps_user_id_is_active_idx" ON "UserRoadmaps"("user_id" ASC, "is_active" ASC);

-- CreateIndex
CREATE INDEX "UserSessions_family_id_idx" ON "UserSessions"("family_id" ASC);

-- CreateIndex
CREATE INDEX "UserSessions_refresh_token_hash_idx" ON "UserSessions"("refresh_token_hash" ASC);

-- CreateIndex
CREATE INDEX "UserSessions_user_id_idx" ON "UserSessions"("user_id" ASC);

-- CreateIndex
CREATE INDEX "UserSkillPractices_user_id_practice_type_practiced_at_idx" ON "UserSkillPractices"("user_id" ASC, "practice_type" ASC, "practiced_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserSrsItems_user_id_char_id_key" ON "UserSrsItems"("user_id" ASC, "char_id" ASC);

-- CreateIndex
CREATE INDEX "UserSrsItems_user_id_next_review_at_idx" ON "UserSrsItems"("user_id" ASC, "next_review_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email" ASC);

-- CreateIndex
CREATE INDEX "Vocabulary_hsk_level_idx" ON "Vocabulary"("hsk_level" ASC);

-- CreateIndex
CREATE INDEX "Vocabulary_vocabulary_id_idx" ON "Vocabulary"("vocabulary_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Vocabulary_vocabulary_id_key" ON "Vocabulary"("vocabulary_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id" ASC);
