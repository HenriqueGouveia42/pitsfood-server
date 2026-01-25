/*
  Warnings:

  - Added the required column `password_hash` to the `staged_users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "staged_users" ADD COLUMN     "password_hash" TEXT NOT NULL;
