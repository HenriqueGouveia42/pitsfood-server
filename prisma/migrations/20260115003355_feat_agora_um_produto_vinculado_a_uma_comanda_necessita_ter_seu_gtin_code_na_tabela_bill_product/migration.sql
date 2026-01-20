/*
  Warnings:

  - Added the required column `product_gtin_code` to the `bill_products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bill_products" ADD COLUMN     "product_gtin_code" TEXT NOT NULL;
