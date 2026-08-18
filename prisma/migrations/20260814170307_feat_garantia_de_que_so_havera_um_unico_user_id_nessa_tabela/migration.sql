/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `QuantityActiveStoresPerPayingUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "QuantityActiveStoresPerPayingUser_user_id_key" ON "QuantityActiveStoresPerPayingUser"("user_id");
