/*
  Warnings:

  - You are about to drop the `QuantityActiveStoresPerPayingUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "QuantityActiveStoresPerPayingUser";

-- CreateTable
CREATE TABLE "QuantityStoresPerPayingUser" (
    "store_counter_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quantity_stores" INTEGER NOT NULL,

    CONSTRAINT "QuantityStoresPerPayingUser_pkey" PRIMARY KEY ("store_counter_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuantityStoresPerPayingUser_user_id_key" ON "QuantityStoresPerPayingUser"("user_id");
