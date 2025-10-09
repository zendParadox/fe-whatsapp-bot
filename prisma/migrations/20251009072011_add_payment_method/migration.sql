-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CASH', 'SHOPEEPAY', 'GOPAY', 'BANK_TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'E_WALLET');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "payment_method" "PaymentMethodType";
