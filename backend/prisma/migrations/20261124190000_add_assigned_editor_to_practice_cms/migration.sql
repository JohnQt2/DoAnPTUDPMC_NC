-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PracticeCollectionVersions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "collectionId" INTEGER NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "changeSummary" TEXT,
    "reviewNotes" TEXT,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER NOT NULL,
    "assignedEditorId" INTEGER,
    "reviewedById" INTEGER,
    "reviewedAt" DATETIME,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeCollectionVersions_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "PracticeCollections" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollectionVersions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollectionVersions_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollectionVersions_assignedEditorId_fkey" FOREIGN KEY ("assignedEditorId") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollectionVersions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PracticeCollectionVersions" ("changeSummary", "collectionId", "createdAt", "createdById", "id", "publishedAt", "reviewNotes", "reviewedAt", "reviewedById", "status", "updatedAt", "updatedById", "versionNumber") SELECT "changeSummary", "collectionId", "createdAt", "createdById", "id", "publishedAt", "reviewNotes", "reviewedAt", "reviewedById", "status", "updatedAt", "updatedById", "versionNumber" FROM "PracticeCollectionVersions";
DROP TABLE "PracticeCollectionVersions";
ALTER TABLE "new_PracticeCollectionVersions" RENAME TO "PracticeCollectionVersions";
CREATE INDEX "PracticeCollectionVersions_collectionId_status_idx" ON "PracticeCollectionVersions"("collectionId", "status");
CREATE INDEX "PracticeCollectionVersions_assignedEditorId_idx" ON "PracticeCollectionVersions"("assignedEditorId");
CREATE UNIQUE INDEX "PracticeCollectionVersions_collectionId_versionNumber_key" ON "PracticeCollectionVersions"("collectionId", "versionNumber");
CREATE TABLE "new_PracticeCollections" (
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
    "assignedEditorId" INTEGER,
    "reviewedById" INTEGER,
    "reviewedAt" DATETIME,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeCollections_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "PracticeLevels" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollections_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollections_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollections_assignedEditorId_fkey" FOREIGN KEY ("assignedEditorId") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollections_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PracticeCollections_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "PracticeCollectionVersions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PracticeCollections" ("category", "code", "createdAt", "createdById", "currentVersionId", "description", "id", "levelId", "orderIndex", "publishedAt", "reviewedAt", "reviewedById", "status", "titlePinyin", "titleVi", "titleZh", "updatedAt", "updatedById") SELECT "category", "code", "createdAt", "createdById", "currentVersionId", "description", "id", "levelId", "orderIndex", "publishedAt", "reviewedAt", "reviewedById", "status", "titlePinyin", "titleVi", "titleZh", "updatedAt", "updatedById" FROM "PracticeCollections";
DROP TABLE "PracticeCollections";
ALTER TABLE "new_PracticeCollections" RENAME TO "PracticeCollections";
CREATE UNIQUE INDEX "PracticeCollections_code_key" ON "PracticeCollections"("code");
CREATE UNIQUE INDEX "PracticeCollections_currentVersionId_key" ON "PracticeCollections"("currentVersionId");
CREATE INDEX "PracticeCollections_levelId_orderIndex_idx" ON "PracticeCollections"("levelId", "orderIndex");
CREATE INDEX "PracticeCollections_category_status_idx" ON "PracticeCollections"("category", "status");
CREATE INDEX "PracticeCollections_assignedEditorId_idx" ON "PracticeCollections"("assignedEditorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
