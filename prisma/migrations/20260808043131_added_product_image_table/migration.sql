/*
  Warnings:

  - Added the required column `publicId` to the `product_image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product_image" ADD COLUMN     "publicId" TEXT NOT NULL;
