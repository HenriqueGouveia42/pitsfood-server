-- CreateTable
CREATE TABLE "physical_bills" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_lost" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "store_id" TEXT NOT NULL,

    CONSTRAINT "physical_bills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "physical_bills_store_id_code_key" ON "physical_bills"("store_id", "code");

-- AddForeignKey
ALTER TABLE "physical_bills" ADD CONSTRAINT "physical_bills_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;
