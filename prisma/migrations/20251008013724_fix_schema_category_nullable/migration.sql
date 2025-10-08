-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_category_id_fkey";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "category_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
