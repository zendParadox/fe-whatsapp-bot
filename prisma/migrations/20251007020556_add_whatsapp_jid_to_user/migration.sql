/*
  Warnings:

  - A unique constraint covering the columns `[whatsapp_jid]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "whatsapp_jid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_whatsapp_jid_key" ON "User"("whatsapp_jid");
