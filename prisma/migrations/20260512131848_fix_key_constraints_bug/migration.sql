-- DropForeignKey
ALTER TABLE "bill_products" DROP CONSTRAINT "bill_products_store_id_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_store_id_user_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_entries" DROP CONSTRAINT "stock_entries_store_id_user_id_fkey";

-- DropIndex
DROP INDEX "users_store_id_user_id_key";

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_products" ADD CONSTRAINT "bill_products_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
