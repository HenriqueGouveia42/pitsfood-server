/*
  Warnings:

  - You are about to drop the `MainGestor` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[bill_id,store_id]` on the table `bills` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gtin_code,store_id]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[product_id,store_id]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,store_id]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sale_id,store_id]` on the table `sales` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username,store_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,store_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `store_id` to the `bill_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `bills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `sale_payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_gtin_snapshot` to the `sale_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_name_snapshot` to the `sale_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `sale_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "bill_products" DROP CONSTRAINT "bill_products_bill_id_fkey";

-- DropForeignKey
ALTER TABLE "bill_products" DROP CONSTRAINT "bill_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE "bill_products" DROP CONSTRAINT "bill_products_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sale_payments" DROP CONSTRAINT "sale_payments_sale_id_fkey";

-- DropForeignKey
ALTER TABLE "sale_products" DROP CONSTRAINT "sale_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE "sale_products" DROP CONSTRAINT "sale_products_sale_id_fkey";

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_user_id_fkey";

-- DropIndex
DROP INDEX "products_gtin_code_key";

-- DropIndex
DROP INDEX "products_name_key";

-- DropIndex
DROP INDEX "users_username_key";

-- AlterTable
ALTER TABLE "bill_products" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "bills" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sale_payments" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sale_products" ADD COLUMN     "product_gtin_snapshot" TEXT NOT NULL,
ADD COLUMN     "product_name_snapshot" TEXT NOT NULL,
ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "store_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "MainGestor";

-- CreateTable
CREATE TABLE "stores" (
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("store_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bills_bill_id_store_id_key" ON "bills"("bill_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_gtin_code_store_id_key" ON "products"("gtin_code", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_product_id_store_id_key" ON "products"("product_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_name_store_id_key" ON "products"("name", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_sale_id_store_id_key" ON "sales"("sale_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_store_id_key" ON "users"("username", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_store_id_key" ON "users"("user_id", "store_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_products" ADD CONSTRAINT "bill_products_bill_id_store_id_fkey" FOREIGN KEY ("bill_id", "store_id") REFERENCES "bills"("bill_id", "store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_products" ADD CONSTRAINT "bill_products_product_id_store_id_fkey" FOREIGN KEY ("product_id", "store_id") REFERENCES "products"("product_id", "store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_products" ADD CONSTRAINT "bill_products_user_id_store_id_fkey" FOREIGN KEY ("user_id", "store_id") REFERENCES "users"("user_id", "store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_products" ADD CONSTRAINT "bill_products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_store_id_fkey" FOREIGN KEY ("user_id", "store_id") REFERENCES "users"("user_id", "store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_products" ADD CONSTRAINT "sale_products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_products" ADD CONSTRAINT "sale_products_sale_id_store_id_fkey" FOREIGN KEY ("sale_id", "store_id") REFERENCES "sales"("sale_id", "store_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_products" ADD CONSTRAINT "sale_products_product_id_store_id_fkey" FOREIGN KEY ("product_id", "store_id") REFERENCES "products"("product_id", "store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_products" ADD CONSTRAINT "sale_products_origin_bill_id_store_id_fkey" FOREIGN KEY ("origin_bill_id", "store_id") REFERENCES "bills"("bill_id", "store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_sale_id_store_id_fkey" FOREIGN KEY ("sale_id", "store_id") REFERENCES "sales"("sale_id", "store_id") ON DELETE CASCADE ON UPDATE CASCADE;
