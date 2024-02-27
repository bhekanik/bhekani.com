/*
  Warnings:

  - You are about to drop the column `viewKey` on the `IPHashes` table. All the data in the column will be lost.
  - The primary key for the `Views` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `key` on the `Views` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "IPHashes" DROP CONSTRAINT "IPHashes_viewKey_fkey";

-- AlterTable
ALTER TABLE "IPHashes" DROP COLUMN "viewKey";

-- AlterTable
ALTER TABLE "Views" DROP CONSTRAINT "Views_pkey",
DROP COLUMN "key",
ADD COLUMN     "slug" TEXT NOT NULL DEFAULT '',
ADD CONSTRAINT "Views_pkey" PRIMARY KEY ("slug");

-- AddForeignKey
ALTER TABLE "IPHashes" ADD CONSTRAINT "IPHashes_slug_fkey" FOREIGN KEY ("slug") REFERENCES "Views"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
