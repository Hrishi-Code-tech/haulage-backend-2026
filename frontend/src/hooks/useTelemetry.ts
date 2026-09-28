/**
 * Telemetry hook for managing real-time location tracking
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

    setIsLoading(true);
    setError(null);

    const load = mockLoads.find(l => l.id === loadId);
    if (load && load.lat && load.lng) {
      setPosition({
        id: load.id,
        lat: load.lat,
        lng: load.lng,
        speed: 60,
        heading: 90,
        timestamp: new Date().toISOString()
      });
      setHistory([]);
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

  return {
    position,
    history,
    isLoading,
    error,
    refetch: fetchTelemetry,
  };
}
