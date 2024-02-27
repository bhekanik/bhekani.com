/*
  Warnings:

  - The primary key for the `ip_hashes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[ip_hash,slug]` on the table `ip_hashes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ip_hashes" DROP CONSTRAINT "ip_hashes_pkey",
ALTER COLUMN "ip_hash" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "ip_hashes_ip_hash_slug_key" ON "ip_hashes"("ip_hash", "slug");
