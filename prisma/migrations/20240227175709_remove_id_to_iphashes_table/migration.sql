/*
  Warnings:

  - The primary key for the `IPHashes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `IPHashes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "IPHashes" DROP CONSTRAINT "IPHashes_pkey",
DROP COLUMN "id",
ALTER COLUMN "ipHash" SET DEFAULT '',
ADD CONSTRAINT "IPHashes_pkey" PRIMARY KEY ("ipHash");
