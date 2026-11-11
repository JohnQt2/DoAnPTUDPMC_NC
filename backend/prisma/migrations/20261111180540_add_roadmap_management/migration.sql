-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserRoadmaps" (
    "roadmap_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "starting_level" TEXT NOT NULL,
    "target_goal" TEXT NOT NULL,
    "daily_commitment_mins" INTEGER NOT NULL DEFAULT 15,
    "expected_duration_months" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "confirmed_at" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRoadmaps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserRoadmaps_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Courses" ("course_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserRoadmaps" ("course_id", "created_at", "daily_commitment_mins", "is_active", "roadmap_id", "starting_level", "target_goal", "user_id") SELECT "course_id", "created_at", "daily_commitment_mins", "is_active", "roadmap_id", "starting_level", "target_goal", "user_id" FROM "UserRoadmaps";
DROP TABLE "UserRoadmaps";
ALTER TABLE "new_UserRoadmaps" RENAME TO "UserRoadmaps";
CREATE INDEX "UserRoadmaps_user_id_status_idx" ON "UserRoadmaps"("user_id", "status");
CREATE INDEX "UserRoadmaps_user_id_is_active_idx" ON "UserRoadmaps"("user_id", "is_active");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
