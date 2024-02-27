/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `Views` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Views_key_key" ON "Views"("key");
