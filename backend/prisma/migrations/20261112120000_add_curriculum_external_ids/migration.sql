-- Add stable JSON identifiers without changing existing numeric primary keys.
ALTER TABLE "Chapters" ADD COLUMN "external_id" TEXT;
ALTER TABLE "Lessons" ADD COLUMN "external_id" TEXT;
ALTER TABLE "LessonBlocks" ADD COLUMN "external_id" TEXT;

CREATE UNIQUE INDEX "Chapters_external_id_key" ON "Chapters"("external_id");
CREATE UNIQUE INDEX "Lessons_external_id_key" ON "Lessons"("external_id");
CREATE UNIQUE INDEX "LessonBlocks_external_id_key" ON "LessonBlocks"("external_id");
