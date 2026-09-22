import prisma from "../config/db.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const ingestEmail = async (req, res) => {
  try {
    const { tenantId, origin, destination, weightKg, targetRate } = req.body;
    const newOrder = await prisma.orderLoad.create({
      data: { tenantId, origin, destination, weightKg, targetRate },
    });
    res
      .status(201)
      .json(new ApiResponse(201, "Load data ingested successfully", newOrder));
  } catch (error) {
    throw new ApiError(500, "Failed to ingest load data", [error.message]);
  }
};

export const handleVoiceNegotiation = async (req, res) => {
  const { orderId, agreedRate, transcript, agentDurationSec } = req.body;
  try {
    await prisma.$transaction([
      prisma.orderLoad.update({
        where: { id: orderId },
        data: { status: "BOOKED" },
      }),
      prisma.aiNegotiationLog.create({
        data: { orderId, agreedRate, transcript, agentDurationSec },
      }),
    ]);
    res
      .status(200)
      .json(
        new ApiResponse(200, "Negotiation logged and order updated successfully"),
      );
  } catch (error) {
    throw new ApiError(500, "Failed to log negotiation and update order", [error.message]);
  }
};

export const handleWarehouseVision = async (req, res) => {
  const { orderId, passedInspection, complianceNotes } = req.body;
  // In semester 2, this will update the invoice/order status. For now, acknowledge.
  res.status(200).json(new ApiResponse(200, "Warehouse vision data acknowledged", {
      acknowledged: true,
      passedInspection,
      complianceNotes,
    }));
};

export const handleInvoiceAudit = async (req, res) => {
  const { orderId, billedAmount, aiAuditStatus, discrepancyFlags } = req.body;
  try {
    await prisma.settlementInvoice.create({
      data: { orderId, billedAmount, aiAuditStatus, discrepancyFlags },
    });
    res
      .status(200)
      .json(new ApiResponse(200, "Audit data logged successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to log audit", [error.message]);
  }
};
