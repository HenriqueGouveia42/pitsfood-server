/*
  Warnings:

  - You are about to drop the column `due_date` on the `subscription_invoices` table. All the data in the column will be lost.
  - Added the required column `code_expires_at` to the `staged_users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_verification_code_sent_at` to the `staged_users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `staged_users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period_end` to the `subscription_invoices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'CANCELED';

-- AlterTable
ALTER TABLE "staged_users" ADD COLUMN     "code_expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "last_verification_code_sent_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "subscription_invoices" DROP COLUMN "due_date",
ADD COLUMN     "period_end" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "subscription_invoices_gateway_invoice_id_idx" ON "subscription_invoices"("gateway_invoice_id");
