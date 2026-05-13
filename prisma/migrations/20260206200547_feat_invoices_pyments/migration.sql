-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "subscription_invoices" (
    "invoice_id" TEXT NOT NULL,
    "amount_in_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "gateway_invoice_id" TEXT,
    "pix_code" TEXT,
    "payment_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "store_id" TEXT NOT NULL,
    "plan_tag" "SubscriptionPlan" NOT NULL,

    CONSTRAINT "subscription_invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateIndex
CREATE INDEX "subscription_invoices_store_id_idx" ON "subscription_invoices"("store_id");

-- AddForeignKey
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;
