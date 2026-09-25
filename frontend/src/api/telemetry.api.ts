/**
 * Telemetry API endpoints for real-time tracking
 */

import { apiClient } from './client';

export interface TelemetryPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface TelemetryPayload {
  load_id: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
}

export const telemetryApi = {
  /**
   * Ingest telemetry data from a tracking device
   * Backend: POST /api/telemetry/ingest
   */
  async ingestTelemetry(payload: TelemetryPayload): Promise<void> {
    // Will be used by backend devices/simulators to report location
    // Not typically called from frontend
    return apiClient.post('/telemetry/ingest', payload);
  },

  /**
   * Get telemetry history for an order
   * TODO: Implement backend endpoint GET /api/telemetry/orders/:loadId
   */
  async getTelemetryHistory(loadId: string): Promise<TelemetryPoint[]> {
    return apiClient.get(`/telemetry/orders/${loadId}`);
  },

  /**
   * Get real-time position of an order
   * TODO: Implement WebSocket or GET endpoint for live updates
   */
  async getCurrentPosition(loadId: string): Promise<TelemetryPoint> {
    const history = await this.getTelemetryHistory(loadId);
    return history[0];
  },
};
