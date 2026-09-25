/**
 * Orders/Loads API endpoints
 */

import { apiClient } from './client';

export enum OrderStatus {
  PENDING = 'PENDING',
  MATCHING = 'MATCHING',
  NEGOTIATING = 'NEGOTIATING',
  BOOKED = 'BOOKED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  AUDIT_FAILED = 'AUDIT_FAILED',
}

export interface OrderLoad {
  id: string;
  tenantId: string;
  origin: string;
  destination: string;
  weightKg: number;
  targetRate: number;
  status: OrderStatus;
  createdAt: string;
  telemetryLogs?: TelemetryLog[];
  invoice?: SettlementInvoice;
}

export interface TelemetryLog {
  id: string;
  orderId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface SettlementInvoice {
  id: string;
  orderId: string;
  billedAmount: number;
  aiAuditStatus: string;
  discrepancyFlags: string[];
  createdAt: string;
}

export interface CarrierDriver {
  id: string;
  name: string;
  phone: string;
  vehicleCapacityKg: number;
  languagePreference: string;
  createdAt: string;
}

// Mock data for now - will be replaced with real API calls when endpoints are built
export const ordersApi = {
  /**
   * Get all active orders for the tenant
   * TODO: Implement backend endpoint GET /api/orders
   */
  async getOrders(filters?: { status?: OrderStatus; limit?: number }): Promise<OrderLoad[]> {
    return apiClient.get('/orders', { params: filters });
  },

  /**
   * Get single order details
   * TODO: Implement backend endpoint GET /api/orders/:loadId
   */
  async getOrder(loadId: string): Promise<OrderLoad> {
    return apiClient.get(`/orders/${loadId}`);
  },

  /**
   * Get carriers available for matching
   * TODO: Implement backend endpoint GET /api/carriers
   */
  async getCarriers(): Promise<CarrierDriver[]> {
    return apiClient.get('/orders/carriers');
  },
};
