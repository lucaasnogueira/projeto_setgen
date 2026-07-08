-- AlterEnum
ALTER TYPE "QuoteLineType" ADD VALUE 'ADDITIONAL_COST';

-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN     "pixKey" TEXT;

-- AlterTable
ALTER TABLE "quote_lines" ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "salesRepId" TEXT,
ADD COLUMN     "warrantyMonths" INTEGER;

-- CreateTable
CREATE TABLE "service_order_visits" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "technicalVisitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_order_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_order_visits_serviceOrderId_technicalVisitId_key" ON "service_order_visits"("serviceOrderId", "technicalVisitId");

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_visits" ADD CONSTRAINT "service_order_visits_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_visits" ADD CONSTRAINT "service_order_visits_technicalVisitId_fkey" FOREIGN KEY ("technicalVisitId") REFERENCES "technical_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
