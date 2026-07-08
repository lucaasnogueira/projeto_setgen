-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'RECEIVED');

-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "paymentTermDays" INTEGER;
