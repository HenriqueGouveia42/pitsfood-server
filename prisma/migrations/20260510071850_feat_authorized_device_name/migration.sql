/*
  Warnings:

  - Added the required column `name` to the `AuthorizedDevice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AuthorizedDevice" ADD COLUMN     "name" TEXT NOT NULL;
