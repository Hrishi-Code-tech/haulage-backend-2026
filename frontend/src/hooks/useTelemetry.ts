/**
 * Telemetry hook for managing real-time location tracking
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { telemetryApi, TelemetryPoint } from '@/api/telemetry.api';

export interface UseTelemetryReturn {
  position: TelemetryPoint | null;
  history: TelemetryPoint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTelemetry(loadId: string | null): UseTelemetryReturn {
  const [position, setPosition] = useState<TelemetryPoint | null>(null);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetry = useCallback(async () => {
    if (!loadId) {
      setPosition(null);
      setHistory([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [pos, hist] = await Promise.all([
        telemetryApi.getCurrentPosition(loadId),
        telemetryApi.getTelemetryHistory(loadId),
      ]);

      setPosition(pos);
      setHistory(hist);
    } catch (err: any) {
      const message = err.message || 'Failed to load telemetry';
      setError(message);
      console.error('Telemetry fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadId]);

  // Fetch when loadId changes
  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  // Auto-refresh every 5 seconds for real-time updates
  useEffect(() => {
    if (!loadId) return;

    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, [loadId, fetchTelemetry]);

  return {
    position,
    history,
    isLoading,
    error,
    refetch: fetchTelemetry,
  };
}
