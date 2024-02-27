/*
  Warnings:

  - You are about to drop the `IPHashes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Views` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "IPHashes" DROP CONSTRAINT "IPHashes_slug_fkey";

-- DropTable
DROP TABLE "IPHashes";

-- DropTable
DROP TABLE "Views";

-- CreateTable
CREATE TABLE "views" (
    "slug" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "views_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "ip_hashes" (
    "ip_hash" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ip_hashes_pkey" PRIMARY KEY ("ip_hash")
);

-- CreateIndex
CREATE INDEX "views_slug_idx" ON "views"("slug");

-- CreateIndex
CREATE INDEX "views_updated_at_idx" ON "views"("updated_at");

-- CreateIndex
CREATE INDEX "ip_hashes_ip_hash_idx" ON "ip_hashes"("ip_hash");

-- CreateIndex
CREATE INDEX "ip_hashes_slug_idx" ON "ip_hashes"("slug");

-- AddForeignKey
ALTER TABLE "ip_hashes" ADD CONSTRAINT "ip_hashes_slug_fkey" FOREIGN KEY ("slug") REFERENCES "views"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
