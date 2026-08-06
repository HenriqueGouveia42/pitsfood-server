-- CreateIndex
CREATE INDEX "bill_products_store_id_active_updated_at_idx" ON "bill_products"("store_id", "active", "updated_at");
