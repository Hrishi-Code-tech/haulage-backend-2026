/**
 * Telemetry hook for managing real-time location tracking
 * Connects to real backend API with graceful fallback to mock data
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { telemetryApi, TelemetryPoint } from '@/api/telemetry.api';
import { mockLoads } from '@/mock/mockData';

export interface UseTelemetryReturn {
  position: TelemetryPoint | null;
  history: TelemetryPoint[];
  isLoading: boolean;
  error: string | null;
  isLive: boolean;
  refetch: () => Promise<void>;
}

export function useTelemetry(loadId: string | null): UseTelemetryReturn {
  const [position, setPosition] = useState<TelemetryPoint | null>(null);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchTelemetry = useCallback(async () => {
    if (!loadId) {
      setPosition(null);
      setHistory([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try real backend first
      const telemetryHistory = await telemetryApi.getTelemetryHistory(loadId);
      if (telemetryHistory && Array.isArray(telemetryHistory) && telemetryHistory.length > 0) {
        setPosition(telemetryHistory[0]);
        setHistory(telemetryHistory);
        setIsLive(true);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('[useTelemetry] Backend unavailable, using mock data:', (err as Error).message);
    }

    // Fallback to mock data
    const load = mockLoads.find(l => l.id === loadId);
    if (load && load.lat && load.lng) {
      setPosition({
        latitude: load.lat,
        longitude: load.lng,
        timestamp: new Date().toISOString()
      });
      setHistory([]);
      setIsLive(false);
    } else {
      setPosition(null);
      setHistory([]);
    }

    setIsLoading(false);
  }, [loadId]);

  // Fetch when loadId changes
  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  // Auto-refresh every 10s for live tracking
  useEffect(() => {
    if (!loadId) return;
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, [loadId, fetchTelemetry]);

  return {
    position,
    history,
    isLoading,
    error,
    isLive,
    refetch: fetchTelemetry,
  };
}
