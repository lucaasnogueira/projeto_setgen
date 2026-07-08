-- CreateEnum
CREATE TYPE "VisitPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "technical_visits" ADD COLUMN     "actualValue" DECIMAL(10,2),
ADD COLUMN     "checklist" JSONB[],
ADD COLUMN     "checklistTemplateId" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "externalCode" TEXT,
ADD COLUMN     "priority" "VisitPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "taskTypeId" TEXT;

-- CreateTable
CREATE TABLE "visit_task_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultChecklistTemplateId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_task_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_equipment" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "visit_task_types_name_key" ON "visit_task_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "visit_equipment_visitId_equipmentId_key" ON "visit_equipment"("visitId", "equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "technical_visits_externalCode_key" ON "technical_visits"("externalCode");

-- AddForeignKey
ALTER TABLE "visit_task_types" ADD CONSTRAINT "visit_task_types_defaultChecklistTemplateId_fkey" FOREIGN KEY ("defaultChecklistTemplateId") REFERENCES "checklist_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_visits" ADD CONSTRAINT "technical_visits_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_visits" ADD CONSTRAINT "technical_visits_taskTypeId_fkey" FOREIGN KEY ("taskTypeId") REFERENCES "visit_task_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_visits" ADD CONSTRAINT "technical_visits_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "checklist_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_equipment" ADD CONSTRAINT "visit_equipment_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "technical_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_equipment" ADD CONSTRAINT "visit_equipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

