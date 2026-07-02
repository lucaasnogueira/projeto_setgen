-- CreateEnum
CREATE TYPE "ChecklistFieldType" AS ENUM ('TEXT', 'NUMBER', 'PHOTO', 'SIGNATURE', 'BOOLEAN', 'MULTIPLE_CHOICE');

-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "checklistTemplateId" TEXT;

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serviceOrderType" "ServiceOrderType",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "checklist_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

