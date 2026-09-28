/**
 * Orders hook for fetching and managing order state
 * Connects to real backend API with graceful fallback to mock data
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ordersApi, OrderLoad, OrderStatus } from '@/api/orders.api';
import { mockLoads } from '@/mock/mockData';

export interface UseOrdersReturn {
  orders: OrderLoad[];
  selectedOrder: OrderLoad | null;
  isLoading: boolean;
  error: string | null;
  isLive: boolean;
  refetch: () => Promise<void>;
  selectOrder: (order: OrderLoad | null) => void;
  filterByStatus: (status: OrderStatus) => void;
}

export function useOrders(autoRefresh = false): UseOrdersReturn {
  const [orders, setOrders] = useState<OrderLoad[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderLoad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try real backend first
      const liveOrders = await ordersApi.getOrders();
      if (liveOrders && Array.isArray(liveOrders) && liveOrders.length > 0) {
        setOrders(liveOrders);
        setIsLive(true);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      // Backend unavailable - fall through to mock
      console.warn('[useOrders] Backend unavailable, using mock data:', (err as Error).message);
    }

    // Fallback to mock data
    setOrders(mockLoads as any[]);
    setIsLive(false);
    setIsLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh polling (every 30s when enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchOrders]);

  const selectOrder = (order: OrderLoad | null) => {
    setSelectedOrder(order);
  };

  const filterByStatus = (status: OrderStatus) => {
    selectOrder(
      orders.find((o) => o.status === status) || null
    );
  };

  return {
    orders,
    selectedOrder,
    isLoading,
    error,
    isLive,
    refetch: fetchOrders,
    selectOrder,
    filterByStatus,
  };
}
