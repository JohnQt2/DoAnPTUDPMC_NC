-- CreateTable
CREATE TABLE "PracticeCollections" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "levelId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'WORKBOOK_LESSON',
    "titleZh" TEXT NOT NULL,
    "titlePinyin" TEXT,
    "titleVi" TEXT,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentVersionId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER NOT NULL,
    "reviewedById" INTEGER,
    "reviewedAt" DATETIME,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeCollections_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "PracticeLevels" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollections_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollections_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollections_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollections_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "PracticeCollectionVersions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeCollectionVersions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "collectionId" INTEGER NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "changeSummary" TEXT,
    "reviewNotes" TEXT,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER NOT NULL,
    "reviewedById" INTEGER,
    "reviewedAt" DATETIME,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeCollectionVersions_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "PracticeCollections" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollectionVersions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollectionVersions_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollectionVersions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PracticeAttempts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "exerciseSetId" INTEGER NOT NULL,
    "versionId" INTEGER,
    "snapshotData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "earnedScore" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PracticeAttempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticeAttempts_exerciseSetId_fkey" FOREIGN KEY ("exerciseSetId") REFERENCES "PracticeExerciseSets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticeAttempts_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PracticeCollectionVersions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PracticeAttempts" ("correctCount", "earnedScore", "exerciseSetId", "id", "startedAt", "status", "submittedAt", "totalQuestions", "totalScore", "userId") SELECT "correctCount", "earnedScore", "exerciseSetId", "id", "startedAt", "status", "submittedAt", "totalQuestions", "totalScore", "userId" FROM "PracticeAttempts";
DROP TABLE "PracticeAttempts";
ALTER TABLE "new_PracticeAttempts" RENAME TO "PracticeAttempts";
CREATE INDEX "PracticeAttempts_userId_exerciseSetId_idx" ON "PracticeAttempts"("userId", "exerciseSetId");
CREATE INDEX "PracticeAttempts_versionId_idx" ON "PracticeAttempts"("versionId");
CREATE TABLE "new_PracticeExerciseSets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lessonId" INTEGER,
    "versionId" INTEGER,
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
    CONSTRAINT "PracticeExerciseSets_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "PracticeLessons" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PracticeExerciseSets_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PracticeCollectionVersions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PracticeExerciseSets" ("audioUrl", "code", "createdAt", "estimatedMinutes", "id", "instructions", "isPublished", "lessonId", "skill", "sortOrder", "status", "titleVi", "titleZh", "updatedAt") SELECT "audioUrl", "code", "createdAt", "estimatedMinutes", "id", "instructions", "isPublished", "lessonId", "skill", "sortOrder", "status", "titleVi", "titleZh", "updatedAt" FROM "PracticeExerciseSets";
DROP TABLE "PracticeExerciseSets";
ALTER TABLE "new_PracticeExerciseSets" RENAME TO "PracticeExerciseSets";
CREATE UNIQUE INDEX "PracticeExerciseSets_code_key" ON "PracticeExerciseSets"("code");
CREATE INDEX "PracticeExerciseSets_lessonId_sortOrder_idx" ON "PracticeExerciseSets"("lessonId", "sortOrder");
CREATE INDEX "PracticeExerciseSets_versionId_sortOrder_idx" ON "PracticeExerciseSets"("versionId", "sortOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PracticeCollections_code_key" ON "PracticeCollections"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeCollections_currentVersionId_key" ON "PracticeCollections"("currentVersionId");

-- CreateIndex
CREATE INDEX "PracticeCollections_levelId_orderIndex_idx" ON "PracticeCollections"("levelId", "orderIndex");

-- CreateIndex
CREATE INDEX "PracticeCollections_category_status_idx" ON "PracticeCollections"("category", "status");

-- CreateIndex
CREATE INDEX "PracticeCollectionVersions_collectionId_status_idx" ON "PracticeCollectionVersions"("collectionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeCollectionVersions_collectionId_versionNumber_key" ON "PracticeCollectionVersions"("collectionId", "versionNumber");
