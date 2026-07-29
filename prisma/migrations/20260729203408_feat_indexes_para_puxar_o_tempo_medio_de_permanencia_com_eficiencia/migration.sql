-- CreateIndex
CREATE INDEX "bills_store_id_status_closed_at_idx" ON "bills"("store_id", "status", "closed_at");
