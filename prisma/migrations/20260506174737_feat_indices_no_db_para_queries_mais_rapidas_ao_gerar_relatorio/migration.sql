-- CreateIndex
CREATE INDEX "sale_payments_store_id_sale_id_idx" ON "sale_payments"("store_id", "sale_id");

-- CreateIndex
CREATE INDEX "sale_products_store_id_sale_id_idx" ON "sale_products"("store_id", "sale_id");

-- CreateIndex
CREATE INDEX "sales_store_id_status_created_at_idx" ON "sales"("store_id", "status", "created_at");
