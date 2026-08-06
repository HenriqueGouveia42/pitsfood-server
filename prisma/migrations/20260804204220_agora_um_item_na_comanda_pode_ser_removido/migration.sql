-- AlterTable
ALTER TABLE "bill_products" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "deactivated_by_user_id" TEXT;
