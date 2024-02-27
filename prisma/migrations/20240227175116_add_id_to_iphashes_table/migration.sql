/*
  Warnings:

  - The primary key for the `IPHashes` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "IPHashes" DROP CONSTRAINT "IPHashes_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "IPHashes_pkey" PRIMARY KEY ("id");
