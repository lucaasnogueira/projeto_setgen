-- CreateEnum
CREATE TYPE "CashFlowType" AS ENUM ('INFLOW', 'OUTFLOW');

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "installment" INTEGER,
ADD COLUMN     "isFixed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentExpenseId" TEXT,
ADD COLUMN     "reconciled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reconciledAt" TIMESTAMP(3),
ADD COLUMN     "reconciledBy" TEXT,
ADD COLUMN     "supplier" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "totalInstallments" INTEGER;

-- CreateTable
CREATE TABLE "cash_flow" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "CashFlowType" NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "expenseId" TEXT,
    "bankAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_flow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_flow_date_idx" ON "cash_flow"("date");

-- CreateIndex
CREATE INDEX "cash_flow_bankAccountId_idx" ON "cash_flow"("bankAccountId");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_parentExpenseId_fkey" FOREIGN KEY ("parentExpenseId") REFERENCES "expenses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_flow" ADD CONSTRAINT "cash_flow_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow" ADD CONSTRAINT "cash_flow_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
