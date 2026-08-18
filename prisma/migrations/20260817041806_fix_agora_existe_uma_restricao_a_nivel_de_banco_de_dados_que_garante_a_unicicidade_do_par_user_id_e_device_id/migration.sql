/*
  Warnings:

  - A unique constraint covering the columns `[user_id,device_id]` on the table `AuthorizedDevice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AuthorizedDevice_user_id_device_id_key" ON "AuthorizedDevice"("user_id", "device_id");
