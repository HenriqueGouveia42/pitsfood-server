/*
  Warnings:

  - A unique constraint covering the columns `[owner_id]` on the table `stores` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "owner_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "stores_owner_id_key" ON "stores"("owner_id");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
