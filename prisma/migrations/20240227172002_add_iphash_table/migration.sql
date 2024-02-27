/*
  Warnings:

  - You are about to drop the column `ipHash` on the `Views` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Views" DROP COLUMN "ipHash";

-- CreateTable
CREATE TABLE "IPHashes" (
    "ipHash" TEXT NOT NULL,
    "viewKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IPHashes_pkey" PRIMARY KEY ("ipHash")
);

-- AddForeignKey
ALTER TABLE "IPHashes" ADD CONSTRAINT "IPHashes_viewKey_fkey" FOREIGN KEY ("viewKey") REFERENCES "Views"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
