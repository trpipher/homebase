-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "websiteUrl" TEXT NOT NULL,
    "accountNum" TEXT,
    "dueDay" INTEGER,
    "amount" REAL,
    "autopay" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Bill" ("accountNum", "createdAt", "dueDay", "id", "name", "notes", "provider", "websiteUrl") SELECT "accountNum", "createdAt", "dueDay", "id", "name", "notes", "provider", "websiteUrl" FROM "Bill";
DROP TABLE "Bill";
ALTER TABLE "new_Bill" RENAME TO "Bill";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
