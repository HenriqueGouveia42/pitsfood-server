-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('GESTOR', 'CAIXA', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('ABERTA', 'FECHADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('CONCLUIDA', 'CANCELADA', 'ESTORNADA');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'ESPECIE', 'CARTAO_DEBITO', 'CARTAO_CREDITO');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('NONE', 'BASIC', 'EXTENDED', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateTable
CREATE TABLE "stores" (
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'NONE',
    "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'NONE',
    "subscription_expires_at" TIMESTAMP(3),
    "owner_id" TEXT NOT NULL,
    "affiliate_id" TEXT,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("store_id")
);

-- CreateTable
CREATE TABLE "affiliates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf_cnpj" TEXT NOT NULL,
    "pix_key" TEXT,
    "referral_code" TEXT NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 20.0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staged_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "verification_code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staged_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "email" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "paying_user" BOOLEAN NOT NULL DEFAULT false,
    "store_id" TEXT,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "products" (
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit_price_in_reais" DECIMAL(10,2) NOT NULL,
    "gtin_code" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "store_id" TEXT NOT NULL,
    "track_stock" BOOLEAN NOT NULL DEFAULT false,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "requires_preparation" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "stock_entries" (
    "entry_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(10,2),
    "total_cost" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "stock_entries_pkey" PRIMARY KEY ("entry_id")
);

-- CreateTable
CREATE TABLE "bills" (
    "bill_id" TEXT NOT NULL,
    "bill_code_gtin" TEXT NOT NULL,
    "status" "BillStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "store_id" TEXT NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("bill_id")
);

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

-- CreateTable
CREATE TABLE "bill_products" (
    "bill_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_at_addition" DECIMAL(10,2) NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_gtin_code" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,

    CONSTRAINT "bill_products_pkey" PRIMARY KEY ("bill_item_id")
);

-- CreateTable
CREATE TABLE "sales" (
    "sale_id" TEXT NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "status" "SaleStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "store_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("sale_id")
);

-- CreateTable
CREATE TABLE "sale_products" (
    "sale_product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_sold" DECIMAL(10,2) NOT NULL,
    "product_name_snapshot" TEXT NOT NULL,
    "product_gtin_snapshot" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "origin_bill_id" TEXT,

    CONSTRAINT "sale_products_pkey" PRIMARY KEY ("sale_product_id")
);

-- CreateTable
CREATE TABLE "sale_payments" (
    "sale_payment_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "sale_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("sale_payment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_email_key" ON "affiliates"("email");

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_cpf_cnpj_key" ON "affiliates"("cpf_cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_referral_code_key" ON "affiliates"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "staged_users_email_key" ON "staged_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_store_id_username_key" ON "users"("store_id", "username");

-- CreateIndex
CREATE UNIQUE INDEX "users_store_id_user_id_key" ON "users"("store_id", "user_id");

-- CreateIndex
CREATE INDEX "products_store_id_name_idx" ON "products"("store_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "products_store_id_gtin_code_key" ON "products"("store_id", "gtin_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_store_id_product_id_key" ON "products"("store_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_store_id_name_key" ON "products"("store_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "bills_store_id_bill_id_key" ON "bills"("store_id", "bill_id");

-- CreateIndex
CREATE UNIQUE INDEX "physical_bills_store_id_code_key" ON "physical_bills"("store_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "sales_store_id_sale_id_key" ON "sales"("store_id", "sale_id");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_store_id_product_id_fkey" FOREIGN KEY ("store_id", "product_id") REFERENCES "products"("store_id", "product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_store_id_user_id_fkey" FOREIGN KEY ("store_id", "user_id") REFERENCES "users"("store_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_bills" ADD CONSTRAINT "physical_bills_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_products" ADD CONSTRAINT "bill_products_store_id_bill_id_fkey" FOREIGN KEY ("store_id", "bill_id") REFERENCES "bills"("store_id", "bill_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_products" ADD CONSTRAINT "bill_products_store_id_product_id_fkey" FOREIGN KEY ("store_id", "product_id") REFERENCES "products"("store_id", "product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_products" ADD CONSTRAINT "bill_products_store_id_user_id_fkey" FOREIGN KEY ("store_id", "user_id") REFERENCES "users"("store_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_products" ADD CONSTRAINT "bill_products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_store_id_user_id_fkey" FOREIGN KEY ("store_id", "user_id") REFERENCES "users"("store_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_products" ADD CONSTRAINT "sale_products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_products" ADD CONSTRAINT "sale_products_store_id_sale_id_fkey" FOREIGN KEY ("store_id", "sale_id") REFERENCES "sales"("store_id", "sale_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_products" ADD CONSTRAINT "sale_products_store_id_product_id_fkey" FOREIGN KEY ("store_id", "product_id") REFERENCES "products"("store_id", "product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_products" ADD CONSTRAINT "sale_products_store_id_origin_bill_id_fkey" FOREIGN KEY ("store_id", "origin_bill_id") REFERENCES "bills"("store_id", "bill_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("store_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_store_id_sale_id_fkey" FOREIGN KEY ("store_id", "sale_id") REFERENCES "sales"("store_id", "sale_id") ON DELETE CASCADE ON UPDATE CASCADE;
