import prisma from "../config/db.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { ENV } from "../config/env.js";

export const ingestEmail = async (req, res) => {
  try {
    let { tenantId, origin, destination, weightKg, targetRate } = req.body;
    const rawEmail = req.body.email_text || req.body.raw_email_text;

    let extractedData = null;

    // If raw email text is supplied, extract structured fields via AI service
    if (rawEmail) {
      const response = await fetch(`${ENV.AI_SERVICE_URL}/ingest/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_text: rawEmail }),
      });

      if (response.ok) {
        const result = await response.json();
        extractedData = result.load;
        origin = origin || extractedData.origin;
        destination = destination || extractedData.destination;
        targetRate = targetRate ?? extractedData.rate;
        weightKg = weightKg ?? extractedData.weight_kg ?? 0;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status === 422 ? 422 : 502,
          errorData.detail || "AI email extraction failed"
        );
      }
    }

    // Resolve tenantId: use provided, find existing, or create default
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      const existingTenant = await prisma.tenant.findFirst();
      if (existingTenant) {
        resolvedTenantId = existingTenant.id;
      } else {
        const newTenant = await prisma.tenant.create({
          data: { name: "Default Ingestion Tenant" },
        });
        resolvedTenantId = newTenant.id;
      }
    }

    if (!origin || !destination || targetRate === undefined) {
      throw new ApiError(400, "Missing required load fields: origin, destination, and targetRate are required");
    }

    const newOrder = await prisma.orderLoad.create({
      data: {
        tenantId: resolvedTenantId,
        origin,
        destination,
        weightKg: Number(weightKg) || 0,
        targetRate: Number(targetRate),
      },
    });

    res.status(201).json(
      new ApiResponse(201, "Load data ingested successfully", {
        ...newOrder,
        extracted: extractedData,
      })
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
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
