-- ============================================================
-- Split ServiceOrder (comercial + execucao) into Quote + ServiceOrder
--
-- "service_orders" ate today held both the commercial proposal (orcamento)
-- and the actual execution work order (OS) in a single row, distinguished
-- only by status. This migration turns the existing table into "quotes"
-- (commercial phase) and creates a fresh, smaller "service_orders" table
-- for the execution phase, linked 1:1 via quotes.id <-> service_orders.quoteId.
--
-- Any existing quote that already carries execution artifacts (ART,
-- Delivery, MaterialRequest, ServiceOrderProduct, ServiceOrderVisit) is
-- promoted to QuoteStatus.ACCEPTED and gets a paired ServiceOrder created
-- for it, regardless of its old status, so no existing FK is orphaned.
-- ============================================================

-- STEP 1: rename existing table -> quotes (Postgres updates FK targets by OID, so
-- every table still referencing "service_orders(id)" keeps working transparently).
ALTER TABLE "service_orders" RENAME TO "quotes";
ALTER TABLE "quotes" RENAME COLUMN "orderNumber" TO "quoteNumber";
ALTER TABLE "quotes" RENAME CONSTRAINT "service_orders_pkey" TO "quotes_pkey";
ALTER INDEX "service_orders_orderNumber_key" RENAME TO "quotes_quoteNumber_key";
ALTER TABLE "quotes" RENAME CONSTRAINT "service_orders_clientId_fkey" TO "quotes_clientId_fkey";
ALTER TABLE "quotes" RENAME CONSTRAINT "service_orders_technicalVisitId_fkey" TO "quotes_technicalVisitId_fkey";
ALTER TABLE "quotes" RENAME CONSTRAINT "service_orders_createdById_fkey" TO "quotes_createdById_fkey";
ALTER TABLE "quotes" RENAME CONSTRAINT "service_orders_salesRepId_fkey" TO "quotes_salesRepId_fkey";

-- Columns that now belong to Quote instead of ServiceOrder
ALTER TABLE "quote_lines" RENAME COLUMN "serviceOrderId" TO "quoteId";
ALTER TABLE "quote_lines" RENAME CONSTRAINT "quote_lines_serviceOrderId_fkey" TO "quote_lines_quoteId_fkey";

ALTER TABLE "approvals" RENAME COLUMN "serviceOrderId" TO "quoteId";
ALTER TABLE "approvals" RENAME CONSTRAINT "approvals_serviceOrderId_fkey" TO "approvals_quoteId_fkey";

ALTER TABLE "purchase_orders" RENAME COLUMN "serviceOrderId" TO "quoteId";
ALTER TABLE "purchase_orders" RENAME CONSTRAINT "purchase_orders_serviceOrderId_fkey" TO "purchase_orders_quoteId_fkey";

-- STEP 2: new enums (QuoteStatus for the commercial phase, ServiceOrderStatus shrunk to execution-only)
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','SENT_TO_CLIENT','AWAITING_RESPONSE','EXPIRED','ACCEPTED','CANCELLED');
ALTER TYPE "ServiceOrderStatus" RENAME TO "ServiceOrderStatus_old";
CREATE TYPE "ServiceOrderStatus" AS ENUM ('AWAITING_MATERIALS','IN_PROGRESS','COMPLETED','CANCELLED');

-- STEP 3: snapshot legacy status text (needed below to seed the new service_orders rows)
-- before converting quotes.status onto the new QuoteStatus enum.
ALTER TABLE "quotes" ADD COLUMN "legacyStatus" TEXT;
UPDATE "quotes" SET "legacyStatus" = "status"::text;

ALTER TABLE "quotes" ADD COLUMN "status_new" "QuoteStatus";
UPDATE "quotes" SET "status_new" = CASE "legacyStatus"
  WHEN 'DRAFT' THEN 'DRAFT'
  WHEN 'PENDING_APPROVAL' THEN 'PENDING_APPROVAL'
  WHEN 'APPROVED' THEN 'APPROVED'
  WHEN 'REJECTED' THEN 'REJECTED'
  WHEN 'SENT_TO_CLIENT' THEN 'SENT_TO_CLIENT'
  WHEN 'AWAITING_RESPONSE' THEN 'AWAITING_RESPONSE'
  WHEN 'EXPIRED' THEN 'EXPIRED'
  WHEN 'CANCELLED' THEN 'CANCELLED'
  ELSE 'ACCEPTED' -- legacy IN_PROGRESS / AWAITING_MATERIALS / COMPLETED
END::"QuoteStatus";

-- Quotes that already hold execution artifacts must count as ACCEPTED so they
-- get a paired ServiceOrder in STEP 5, regardless of their legacy status.
UPDATE "quotes" SET "status_new" = 'ACCEPTED'
WHERE id IN (
  SELECT "serviceOrderId" FROM "arts"
  UNION SELECT "serviceOrderId" FROM "deliveries"
  UNION SELECT "serviceOrderId" FROM "material_requests"
  UNION SELECT "serviceOrderId" FROM "service_order_products"
  UNION SELECT "serviceOrderId" FROM "service_order_visits"
);

ALTER TABLE "quotes" ALTER COLUMN "status_new" SET DEFAULT 'DRAFT';
ALTER TABLE "quotes" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "quotes" DROP COLUMN "status";
ALTER TABLE "quotes" RENAME COLUMN "status_new" TO "status";
DROP TYPE "ServiceOrderStatus_old";

-- STEP 4: new service_orders table (execution phase)
CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'AWAITING_MATERIALS',
    "scope" TEXT NOT NULL,
    "requiredResources" JSONB,
    "deadline" TIMESTAMP(3),
    "responsibleIds" TEXT[],
    "checklist" JSONB[],
    "checklistTemplateId" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "attachments" TEXT[],
    "createdById" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "service_orders_orderNumber_key" ON "service_orders"("orderNumber");
CREATE UNIQUE INDEX "service_orders_quoteId_key" ON "service_orders"("quoteId");

ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "checklist_templates"("id") ON UPDATE CASCADE ON DELETE SET NULL;

-- STEP 5: populate service_orders, one row per ACCEPTED quote, carrying over the
-- execution-side columns (still present on "quotes" at this point in the script).
INSERT INTO "service_orders"
  ("id","orderNumber","quoteId","clientId","status","scope","requiredResources","deadline",
   "responsibleIds","checklist","checklistTemplateId","progress","attachments","createdById",
   "paymentStatus","completedAt","createdAt","updatedAt")
SELECT
  gen_random_uuid(),
  q."quoteNumber",
  q."id",
  q."clientId",
  (CASE WHEN q."legacyStatus" IN ('AWAITING_MATERIALS','IN_PROGRESS','COMPLETED','CANCELLED')
        THEN q."legacyStatus" ELSE 'AWAITING_MATERIALS' END)::"ServiceOrderStatus",
  q."scope",
  q."requiredResources",
  q."deadline",
  q."responsibleIds",
  q."checklist",
  q."checklistTemplateId",
  q."progress",
  q."attachments",
  q."createdById",
  q."paymentStatus",
  q."completedAt",
  q."createdAt",
  q."updatedAt"
FROM "quotes" q
WHERE q."status" = 'ACCEPTED';

-- STEP 6: repoint execution-artifact FKs from quotes(id) to the new service_orders(id)
ALTER TABLE "arts" DROP CONSTRAINT "arts_serviceOrderId_fkey";
UPDATE "arts" a SET "serviceOrderId" = so."id" FROM "service_orders" so WHERE so."quoteId" = a."serviceOrderId";
ALTER TABLE "arts" ADD CONSTRAINT "arts_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "deliveries" DROP CONSTRAINT "deliveries_serviceOrderId_fkey";
UPDATE "deliveries" d SET "serviceOrderId" = so."id" FROM "service_orders" so WHERE so."quoteId" = d."serviceOrderId";
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "material_requests" DROP CONSTRAINT "material_requests_serviceOrderId_fkey";
UPDATE "material_requests" m SET "serviceOrderId" = so."id" FROM "service_orders" so WHERE so."quoteId" = m."serviceOrderId";
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "service_order_products" DROP CONSTRAINT "service_order_products_serviceOrderId_fkey";
UPDATE "service_order_products" sop SET "serviceOrderId" = so."id" FROM "service_orders" so WHERE so."quoteId" = sop."serviceOrderId";
ALTER TABLE "service_order_products" ADD CONSTRAINT "service_order_products_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "service_order_visits" DROP CONSTRAINT "service_order_visits_serviceOrderId_fkey";
UPDATE "service_order_visits" sov SET "serviceOrderId" = so."id" FROM "service_orders" so WHERE so."quoteId" = sov."serviceOrderId";
ALTER TABLE "service_order_visits" ADD CONSTRAINT "service_order_visits_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON UPDATE CASCADE ON DELETE CASCADE;

-- notas_fiscais / expenses: optional link. Repoint rows that do have a paired
-- ServiceOrder; null out any that referenced a quote never promoted to ACCEPTED
-- (none in current data, kept for safety so the new FK below can never fail).
ALTER TABLE "notas_fiscais" DROP CONSTRAINT "notas_fiscais_serviceOrderId_fkey";
UPDATE "notas_fiscais" nf SET "serviceOrderId" = so."id" FROM "service_orders" so WHERE so."quoteId" = nf."serviceOrderId";
UPDATE "notas_fiscais" SET "serviceOrderId" = NULL WHERE "serviceOrderId" IS NOT NULL AND "serviceOrderId" NOT IN (SELECT "id" FROM "service_orders");
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "expenses" DROP CONSTRAINT "expenses_serviceOrderId_fkey";
UPDATE "expenses" e SET "serviceOrderId" = so."id" FROM "service_orders" so WHERE so."quoteId" = e."serviceOrderId";
UPDATE "expenses" SET "serviceOrderId" = NULL WHERE "serviceOrderId" IS NOT NULL AND "serviceOrderId" NOT IN (SELECT "id" FROM "service_orders");
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON UPDATE CASCADE ON DELETE SET NULL;

-- STEP 7: drop execution-only columns from quotes (now living on service_orders),
-- plus the legacy status snapshot. Dropping "checklistTemplateId" also drops its FK.
ALTER TABLE "quotes" DROP COLUMN "requiredResources";
ALTER TABLE "quotes" DROP COLUMN "deadline";
ALTER TABLE "quotes" DROP COLUMN "responsibleIds";
ALTER TABLE "quotes" DROP COLUMN "checklist";
ALTER TABLE "quotes" DROP COLUMN "checklistTemplateId";
ALTER TABLE "quotes" DROP COLUMN "progress";
ALTER TABLE "quotes" DROP COLUMN "attachments";
ALTER TABLE "quotes" DROP COLUMN "paymentStatus";
ALTER TABLE "quotes" DROP COLUMN "completedAt";
ALTER TABLE "quotes" DROP COLUMN "legacyStatus";
