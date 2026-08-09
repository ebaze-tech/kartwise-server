/*
  Warnings:

  - You are about to drop the column `categoryId` on the `business` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `business_category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categoryName` to the `business` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "business" DROP CONSTRAINT "business_categoryId_fkey";

-- DropIndex
DROP INDEX "business_ownerId_categoryId_idx";

-- AlterTable
ALTER TABLE "business" DROP COLUMN "categoryId",
ADD COLUMN     "categoryName" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "business_ownerId_categoryName_idx" ON "business"("ownerId", "categoryName");

-- CreateIndex
CREATE UNIQUE INDEX "business_category_name_key" ON "business_category"("name");

-- AddForeignKey
ALTER TABLE "business" ADD CONSTRAINT "business_categoryName_fkey" FOREIGN KEY ("categoryName") REFERENCES "business_category"("name") ON DELETE CASCADE ON UPDATE CASCADE;
