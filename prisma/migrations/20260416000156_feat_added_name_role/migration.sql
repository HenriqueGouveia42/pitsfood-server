/*
  Warnings:

  - Added the required column `seller_name` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seller_role` to the `sales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "seller_name" TEXT NOT NULL,
ADD COLUMN     "seller_role" TEXT NOT NULL;
