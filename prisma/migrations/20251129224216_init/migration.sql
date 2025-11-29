-- CreateTable
CREATE TABLE "ShortLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "originalUrl" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "length" INTEGER NOT NULL DEFAULT 6,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Click" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shortLinkId" INTEGER NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Click_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_shortId_key" ON "ShortLink"("shortId");

-- CreateIndex
CREATE INDEX "ShortLink_shortId_idx" ON "ShortLink"("shortId");

-- CreateIndex
CREATE INDEX "ShortLink_userId_idx" ON "ShortLink"("userId");

-- CreateIndex
CREATE INDEX "ShortLink_originalUrl_idx" ON "ShortLink"("originalUrl");

-- CreateIndex
CREATE INDEX "Click_shortLinkId_idx" ON "Click"("shortLinkId");

-- CreateIndex
CREATE INDEX "Click_createdAt_idx" ON "Click"("createdAt");
