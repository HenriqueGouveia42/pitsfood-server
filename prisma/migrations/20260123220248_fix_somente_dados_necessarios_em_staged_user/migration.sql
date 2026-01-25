/*
  Warnings:

  - You are about to drop the column `password_hash` on the `staged_users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "staged_users" DROP COLUMN "password_hash";
