-- AlterTable
ALTER TABLE "products" ADD COLUMN     "stock_quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "track_stock" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "stock_entries" (
    "entry_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(10,2),
    "total_cost" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "stock_entries_pkey" PRIMARY KEY ("entry_id")
);

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_product_id_store_id_fkey" FOREIGN KEY ("product_id", "store_id") REFERENCES "products"("product_id", "store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_user_id_store_id_fkey" FOREIGN KEY ("user_id", "store_id") REFERENCES "users"("user_id", "store_id") ON DELETE RESTRICT ON UPDATE CASCADE;
