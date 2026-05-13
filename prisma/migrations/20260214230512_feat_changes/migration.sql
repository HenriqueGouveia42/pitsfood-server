/*
  Warnings:

  - You are about to drop the column `quantity` on the `bill_products` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `bill_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cpf_cnpj` to the `staged_users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cpf_cnpj` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "SubscriptionPlan" ADD VALUE 'PERSONALIZED';

-- AlterTable
ALTER TABLE "bill_products" DROP COLUMN "quantity",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "staged_users" ADD COLUMN     "cpf_cnpj" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "store_icon_url" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "cpf_cnpj" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT;
