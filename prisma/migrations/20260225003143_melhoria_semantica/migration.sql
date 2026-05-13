/*
  Warnings:

  - You are about to drop the column `unit_price_sold` on the `sale_products` table. All the data in the column will be lost.
  - Added the required column `unit_price_snapshot` to the `sale_products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sale_products" DROP COLUMN "unit_price_sold",
ADD COLUMN     "unit_price_snapshot" DECIMAL(10,2) NOT NULL;
