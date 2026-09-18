-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'MATCHING', 'NEGOTIATING', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'AUDIT_FAILED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarrierDriver" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vehicleCapacityKg" DOUBLE PRECISION NOT NULL,
    "languagePreference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarrierDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLoad" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "targetRate" DOUBLE PRECISION NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLoad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemetryLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemetryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiNegotiationLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "transcript" TEXT,
    "agreedRate" DOUBLE PRECISION NOT NULL,
    "agentDurationSec" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiNegotiationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementInvoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "billedAmount" DOUBLE PRECISION NOT NULL,
    "aiAuditStatus" TEXT NOT NULL,
    "discrepancyFlags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CarrierDriver_phone_key" ON "CarrierDriver"("phone");

-- CreateIndex
CREATE INDEX "TelemetryLog_orderId_idx" ON "TelemetryLog"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "AiNegotiationLog_orderId_key" ON "AiNegotiationLog"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementInvoice_orderId_key" ON "SettlementInvoice"("orderId");

-- AddForeignKey
ALTER TABLE "CarrierDriver" ADD CONSTRAINT "CarrierDriver_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLoad" ADD CONSTRAINT "OrderLoad_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelemetryLog" ADD CONSTRAINT "TelemetryLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderLoad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiNegotiationLog" ADD CONSTRAINT "AiNegotiationLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderLoad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementInvoice" ADD CONSTRAINT "SettlementInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderLoad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
