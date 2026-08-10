/*
  Warnings:

  - You are about to drop the column `inStock` on the `product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product" DROP COLUMN "inStock",
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true;
