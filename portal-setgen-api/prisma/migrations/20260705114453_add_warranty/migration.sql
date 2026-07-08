-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'ALERT';

-- CreateTable
CREATE TABLE "warranties" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "coverageMonths" INTEGER NOT NULL DEFAULT 12,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warranties_deliveryId_key" ON "warranties"("deliveryId");

-- CreateIndex
CREATE INDEX "warranties_endDate_idx" ON "warranties"("endDate");

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
