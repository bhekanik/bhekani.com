/*
  Warnings:

  - The primary key for the `Views` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Views` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Views_key_key";

-- AlterTable
ALTER TABLE "Views" DROP CONSTRAINT "Views_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Views_pkey" PRIMARY KEY ("key");
