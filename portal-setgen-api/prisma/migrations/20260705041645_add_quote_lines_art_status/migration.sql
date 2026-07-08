-- CreateEnum
CREATE TYPE "QuoteLineType" AS ENUM ('SERVICE', 'MATERIAL', 'LABOR_HOUR', 'TRAVEL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ServiceOrderStatus" ADD VALUE 'SENT_TO_CLIENT';
ALTER TYPE "ServiceOrderStatus" ADD VALUE 'AWAITING_RESPONSE';
ALTER TYPE "ServiceOrderStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "ServiceOrderStatus" ADD VALUE 'AWAITING_MATERIALS';

-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "validUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "quote_lines" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "type" "QuoteLineType" NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitValue" DECIMAL(10,2) NOT NULL,
    "totalValue" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arts" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "engineerName" TEXT NOT NULL,
    "creaNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quote_lines_serviceOrderId_idx" ON "quote_lines"("serviceOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "arts_serviceOrderId_key" ON "arts"("serviceOrderId");

-- AddForeignKey
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arts" ADD CONSTRAINT "arts_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
