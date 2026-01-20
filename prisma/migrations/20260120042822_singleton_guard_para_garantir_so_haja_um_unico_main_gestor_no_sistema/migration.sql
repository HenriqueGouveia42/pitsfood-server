/*
  Warnings:

  - A unique constraint covering the columns `[singleton_guard]` on the table `MainGestor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MainGestor" ADD COLUMN     "singleton_guard" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "MainGestor_singleton_guard_key" ON "MainGestor"("singleton_guard");
