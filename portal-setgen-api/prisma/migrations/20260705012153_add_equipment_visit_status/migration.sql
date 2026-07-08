-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('GENERATOR', 'SUBSTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- AlterTable
ALTER TABLE "technical_visits" ADD COLUMN     "chargeable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "equipmentId" TEXT,
ADD COLUMN     "failureCategoryId" TEXT,
ADD COLUMN     "scheduledEnd" TIMESTAMP(3),
ADD COLUMN     "scheduledStart" TIMESTAMP(3),
ADD COLUMN     "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED';

-- CreateTable
CREATE TABLE "equipments" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "EquipmentType" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "powerRating" TEXT,
    "installLocation" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "failure_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "failure_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipments_clientId_idx" ON "equipments"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "failure_categories_name_key" ON "failure_categories"("name");

-- CreateIndex
CREATE INDEX "technical_visits_equipmentId_idx" ON "technical_visits"("equipmentId");

-- CreateIndex
CREATE INDEX "technical_visits_technicianId_idx" ON "technical_visits"("technicianId");

-- AddForeignKey
ALTER TABLE "equipments" ADD CONSTRAINT "equipments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_visits" ADD CONSTRAINT "technical_visits_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_visits" ADD CONSTRAINT "technical_visits_failureCategoryId_fkey" FOREIGN KEY ("failureCategoryId") REFERENCES "failure_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
