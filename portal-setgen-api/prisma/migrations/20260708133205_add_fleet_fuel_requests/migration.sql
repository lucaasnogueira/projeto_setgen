-- CreateEnum
CREATE TYPE "VehicleTripStatus" AS ENUM ('OUT', 'RETURNED');

-- CreateEnum
CREATE TYPE "FuelRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "photoUrl" TEXT,
    "currentKm" INTEGER NOT NULL DEFAULT 0,
    "lastOilChangeKm" INTEGER NOT NULL DEFAULT 0,
    "oilChangeIntervalKm" INTEGER NOT NULL DEFAULT 10000,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_trips" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "startKm" INTEGER NOT NULL,
    "endKm" INTEGER,
    "status" "VehicleTripStatus" NOT NULL DEFAULT 'OUT',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_requests" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liters" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalValue" DECIMAL(10,2) NOT NULL,
    "currentKm" INTEGER,
    "fuelStation" TEXT,
    "status" "FuelRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "expenseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE INDEX "vehicle_trips_vehicleId_idx" ON "vehicle_trips"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_trips_status_idx" ON "vehicle_trips"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fuel_requests_expenseId_key" ON "fuel_requests"("expenseId");

-- CreateIndex
CREATE INDEX "fuel_requests_vehicleId_idx" ON "fuel_requests"("vehicleId");

-- CreateIndex
CREATE INDEX "fuel_requests_status_idx" ON "fuel_requests"("status");

-- AddForeignKey
ALTER TABLE "vehicle_trips" ADD CONSTRAINT "vehicle_trips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_trips" ADD CONSTRAINT "vehicle_trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_trips" ADD CONSTRAINT "vehicle_trips_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_requests" ADD CONSTRAINT "fuel_requests_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_requests" ADD CONSTRAINT "fuel_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_requests" ADD CONSTRAINT "fuel_requests_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_requests" ADD CONSTRAINT "fuel_requests_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
