/*
  Warnings:

  - You are about to drop the column `modalidade` on the `notas_fiscais` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `notas_fiscais` table. All the data in the column will be lost.
  - You are about to drop the `invoices` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `createdById` to the `notas_fiscais` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_createdById_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_purchaseOrderId_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_serviceOrderId_fkey";

-- AlterTable
ALTER TABLE "notas_fiscais" DROP COLUMN "modalidade",
DROP COLUMN "tipo",
ADD COLUMN     "createdById" TEXT NOT NULL,
ALTER COLUMN "serviceOrderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "ncm" TEXT;

-- DropTable
DROP TABLE "invoices";

-- DropEnum
DROP TYPE "InvoiceStatus";

-- DropEnum
DROP TYPE "ModalidadeNota";

-- DropEnum
DROP TYPE "TipoNota";

-- CreateTable
CREATE TABLE "nota_fiscal_itens" (
    "id" TEXT NOT NULL,
    "notaId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ncm" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "valorUnitario" DECIMAL(14,4) NOT NULL,
    "valorTotal" DECIMAL(14,2) NOT NULL,
    "fabricadoNaZfm" BOOLEAN NOT NULL DEFAULT false,
    "cfop" TEXT NOT NULL DEFAULT '5102',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nota_fiscal_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nota_fiscal_itens_notaId_idx" ON "nota_fiscal_itens"("notaId");

-- CreateIndex
CREATE INDEX "notas_fiscais_clientId_idx" ON "notas_fiscais"("clientId");

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal_itens" ADD CONSTRAINT "nota_fiscal_itens_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal_itens" ADD CONSTRAINT "nota_fiscal_itens_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
