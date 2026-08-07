/*
  Warnings:

  - You are about to drop the column `businessCategoryId` on the `Business` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Business` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_businessCategoryId_fkey";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "businessCategoryId",
ADD COLUMN     "categoryId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BusinessCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
