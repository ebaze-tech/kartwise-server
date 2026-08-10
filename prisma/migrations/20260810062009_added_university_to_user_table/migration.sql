-- AlterTable
ALTER TABLE "users" ADD COLUMN     "university" TEXT;

-- CreateTable
CREATE TABLE "business_bank_details" (
    "id" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_bank_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_bank_details_businessId_idx" ON "business_bank_details"("businessId");

-- AddForeignKey
ALTER TABLE "business_bank_details" ADD CONSTRAINT "business_bank_details_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
