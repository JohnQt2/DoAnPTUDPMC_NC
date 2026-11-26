-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "browser_notification_enabled" BOOLEAN DEFAULT false;
ALTER TABLE "user_profiles" ADD COLUMN "email_reminder_enabled" BOOLEAN DEFAULT true;
ALTER TABLE "user_profiles" ADD COLUMN "reminder_time" TEXT DEFAULT '20:00';
ALTER TABLE "user_profiles" ADD COLUMN "timezone" TEXT DEFAULT 'Asia/Ho_Chi_Minh';

-- CreateTable
CREATE TABLE "PushSubscriptions" (
    "subscription_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReminderDeliveryLogs" (
    "log_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "study_date" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "offset_minutes" INTEGER NOT NULL,
    "sent_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReminderDeliveryLogs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MockExam" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "hsk_level" TEXT NOT NULL,
    "exam_pdf_url" TEXT NOT NULL,
    "audio_url" TEXT,
    "answer_pdf_url" TEXT,
    "duration_minutes" INTEGER NOT NULL DEFAULT 35,
    "total_score" REAL NOT NULL DEFAULT 100,
    "pass_score" REAL NOT NULL DEFAULT 60,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "created_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MockExam_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamSection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "exam_id" INTEGER NOT NULL,
    "section_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "audio_url" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ExamSection_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "MockExam" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "section_id" INTEGER NOT NULL,
    "question_number" INTEGER NOT NULL,
    "question_type" TEXT NOT NULL,
    "prompt_text" TEXT,
    "options" TEXT,
    "correct_answer" TEXT,
    "sample_answer" TEXT,
    "points" REAL NOT NULL DEFAULT 2.5,
    "explanation" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ExamQuestion_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "ExamSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "listening_score" REAL NOT NULL DEFAULT 0,
    "reading_score" REAL NOT NULL DEFAULT 0,
    "writing_score" REAL NOT NULL DEFAULT 0,
    "total_score" REAL NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "is_passed" BOOLEAN NOT NULL DEFAULT false,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" DATETIME,
    CONSTRAINT "ExamAttempt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamAttempt_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "MockExam" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamAttemptAnswer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "attempt_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "user_answer" TEXT,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "earned_score" REAL NOT NULL DEFAULT 0,
    "teacher_feedback" TEXT,
    CONSTRAINT "ExamAttemptAnswer_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "ExamAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamAttemptAnswer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "ExamQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscriptions_endpoint_key" ON "PushSubscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscriptions_user_id_idx" ON "PushSubscriptions"("user_id");

-- CreateIndex
CREATE INDEX "ReminderDeliveryLogs_user_id_study_date_idx" ON "ReminderDeliveryLogs"("user_id", "study_date");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderDeliveryLogs_user_id_study_date_channel_offset_minutes_key" ON "ReminderDeliveryLogs"("user_id", "study_date", "channel", "offset_minutes");

-- CreateIndex
CREATE UNIQUE INDEX "MockExam_code_key" ON "MockExam"("code");

-- CreateIndex
CREATE INDEX "MockExam_hsk_level_idx" ON "MockExam"("hsk_level");

-- CreateIndex
CREATE INDEX "MockExam_status_idx" ON "MockExam"("status");

-- CreateIndex
CREATE INDEX "ExamSection_exam_id_order_index_idx" ON "ExamSection"("exam_id", "order_index");

-- CreateIndex
CREATE INDEX "ExamQuestion_section_id_order_index_idx" ON "ExamQuestion"("section_id", "order_index");

-- CreateIndex
CREATE INDEX "ExamAttempt_user_id_idx" ON "ExamAttempt"("user_id");

-- CreateIndex
CREATE INDEX "ExamAttempt_exam_id_idx" ON "ExamAttempt"("exam_id");

-- CreateIndex
CREATE INDEX "ExamAttemptAnswer_attempt_id_idx" ON "ExamAttemptAnswer"("attempt_id");

-- CreateIndex
CREATE INDEX "ExamAttemptAnswer_question_id_idx" ON "ExamAttemptAnswer"("question_id");
