/*
  Warnings:

  - A unique constraint covering the columns `[store_id,bill_id]` on the table `bills` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id,gtin_code]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id,product_id]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id,name]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id,sale_id]` on the table `sales` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id,username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id,user_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "bill_products" DROP CONSTRAINT "bill_products_bill_id_store_id_fkey";

-- DropForeignKey
ALTER TABLE "bill_products" DROP CONSTRAINT "bill_products_product_id_store_id_fkey";

-- DropForeignKey
ALTER TABLE "bill_products" DROP CONSTRAINT "bill_products_user_id_store_id_fkey";

-- DropForeignKey
ALTER TABLE "sale_payments" DROP CONSTRAINT "sale_payments_sale_id_store_id_fkey";

-- DropForeignKey
ALTER TABLE "sale_products" DROP CONSTRAINT "sale_products_origin_bill_id_store_id_fkey";

-- DropForeignKey
ALTER TABLE "sale_products" DROP CONSTRAINT "sale_products_product_id_store_id_fkey";

-- DropForeignKey
ALTER TABLE "sale_products" DROP CONSTRAINT "sale_products_sale_id_store_id_fkey";

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_user_id_store_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_entries" DROP CONSTRAINT "stock_entries_product_id_store_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_entries" DROP CONSTRAINT "stock_entries_user_id_store_id_fkey";

-- DropIndex
DROP INDEX "bills_bill_id_store_id_key";

-- DropIndex
DROP INDEX "products_gtin_code_store_id_key";

-- DropIndex
DROP INDEX "products_name_store_id_key";

-- DropIndex
DROP INDEX "products_product_id_store_id_key";

-- DropIndex
DROP INDEX "sales_sale_id_store_id_key";

-- DropIndex
DROP INDEX "users_user_id_store_id_key";

-- DropIndex
DROP INDEX "users_username_store_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "bills_store_id_bill_id_key" ON "bills"("store_id", "bill_id");

-- CreateIndex
CREATE INDEX "products_store_id_name_idx" ON "products"("store_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "products_store_id_gtin_code_key" ON "products"("store_id", "gtin_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_store_id_product_id_key" ON "products"("store_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_store_id_name_key" ON "products"("store_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sales_store_id_sale_id_key" ON "sales"("store_id", "sale_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_store_id_username_key" ON "users"("store_id", "username");

-- CreateIndex
CREATE UNIQUE INDEX "users_store_id_user_id_key" ON "users"("store_id", "user_id");

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_store_id_product_id_fkey" FOREIGN KEY ("store_id", "product_id") REFERENCES "products"("store_id", "product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_store_id_user_id_fkey" FOREIGN KEY ("store_id", "user_id") REFERENCES "users"("store_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_products" ADD CONSTRAINT "bill_products_store_id_bill_id_fkey" FOREIGN KEY ("store_id", "bill_id") REFERENCES "bills"("store_id", "bill_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_products" ADD CONSTRAINT "bill_products_store_id_product_id_fkey" FOREIGN KEY ("store_id", "product_id") REFERENCES "products"("store_id", "product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_products" ADD CONSTRAINT "bill_products_store_id_user_id_fkey" FOREIGN KEY ("store_id", "user_id") REFERENCES "users"("store_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_store_id_user_id_fkey" FOREIGN KEY ("store_id", "user_id") REFERENCES "users"("store_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_products" ADD CONSTRAINT "sale_products_store_id_sale_id_fkey" FOREIGN KEY ("store_id", "sale_id") REFERENCES "sales"("store_id", "sale_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_products" ADD CONSTRAINT "sale_products_store_id_product_id_fkey" FOREIGN KEY ("store_id", "product_id") REFERENCES "products"("store_id", "product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_products" ADD CONSTRAINT "sale_products_store_id_origin_bill_id_fkey" FOREIGN KEY ("store_id", "origin_bill_id") REFERENCES "bills"("store_id", "bill_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_store_id_sale_id_fkey" FOREIGN KEY ("store_id", "sale_id") REFERENCES "sales"("store_id", "sale_id") ON DELETE CASCADE ON UPDATE CASCADE;
