-- CreateTable
CREATE TABLE "QuantityActiveStoresPerPayingUser" (
    "store_counter_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quantity_active_stores" INTEGER NOT NULL,

    CONSTRAINT "QuantityActiveStoresPerPayingUser_pkey" PRIMARY KEY ("store_counter_id")
);
