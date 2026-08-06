/*
  Warnings:

  - Added the required column `from` to the `sent_emails` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sent_emails" ADD COLUMN     "from" TEXT NOT NULL;
