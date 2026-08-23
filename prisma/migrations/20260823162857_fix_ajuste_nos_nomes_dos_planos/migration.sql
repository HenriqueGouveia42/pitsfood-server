/*
  Warnings:

  - The values [BASIC,PERSONALIZED] on the enum `SubscriptionPlan` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionPlan_new" AS ENUM ('NONE', 'EMPREENDEDOR', 'EXTENDED', 'PREMIUM');
ALTER TABLE "public"."stores" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "subscription_invoices" ALTER COLUMN "plan_tag" TYPE "SubscriptionPlan_new" USING ("plan_tag"::text::"SubscriptionPlan_new");
ALTER TABLE "stores" ALTER COLUMN "plan" TYPE "SubscriptionPlan_new" USING ("plan"::text::"SubscriptionPlan_new");
ALTER TYPE "SubscriptionPlan" RENAME TO "SubscriptionPlan_old";
ALTER TYPE "SubscriptionPlan_new" RENAME TO "SubscriptionPlan";
DROP TYPE "public"."SubscriptionPlan_old";
ALTER TABLE "stores" ALTER COLUMN "plan" SET DEFAULT 'NONE';
COMMIT;
