/*
  Warnings:

  - A unique constraint covering the columns `[course_id,external_id]` on the table `Chapters` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[course_id,order_index]` on the table `Chapters` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('VOCABULARY', 'DIALOGUE', 'GRAMMAR', 'HANZI', 'PHONETIC', 'SENTENCE_PATTERN', 'EXERCISE');

-- AlterTable
ALTER TABLE "Chapters" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "LearningContents" (
    "content_id" SERIAL NOT NULL,
    "external_id" TEXT NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "content_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningContents_pkey" PRIMARY KEY ("content_id")
);

-- CreateTable
CREATE TABLE "LessonBlockContentReferences" (
    "reference_id" SERIAL NOT NULL,
    "lesson_block_id" INTEGER NOT NULL,
    "content_id" INTEGER NOT NULL,
    "item_id" TEXT,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "LessonBlockContentReferences_pkey" PRIMARY KEY ("reference_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningContents_content_type_external_id_key" ON "LearningContents"("content_type", "external_id");

-- CreateIndex
CREATE INDEX "LessonBlockContentReferences_content_id_idx" ON "LessonBlockContentReferences"("content_id");

-- CreateIndex
CREATE UNIQUE INDEX "LessonBlockContentReferences_lesson_block_id_content_id_ite_key" ON "LessonBlockContentReferences"("lesson_block_id", "content_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "Chapters_course_id_external_id_key" ON "Chapters"("course_id", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "Chapters_course_id_order_index_key" ON "Chapters"("course_id", "order_index");

-- AddForeignKey
ALTER TABLE "LessonBlockContentReferences" ADD CONSTRAINT "LessonBlockContentReferences_lesson_block_id_fkey" FOREIGN KEY ("lesson_block_id") REFERENCES "LessonBlocks"("block_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonBlockContentReferences" ADD CONSTRAINT "LessonBlockContentReferences_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "LearningContents"("content_id") ON DELETE CASCADE ON UPDATE CASCADE;
