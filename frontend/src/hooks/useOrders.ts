/**
 * Orders hook for fetching and managing order state
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ordersApi, OrderLoad, OrderStatus } from '@/api/orders.api';

export interface UseOrdersReturn {
  orders: OrderLoad[];
  selectedOrder: OrderLoad | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  selectOrder: (order: OrderLoad | null) => void;
  filterByStatus: (status: OrderStatus) => void;
}

export function useOrders(autoRefresh = false): UseOrdersReturn {
  const [orders, setOrders] = useState<OrderLoad[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderLoad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ordersApi.getOrders();
      setOrders(data);
    } catch (err: any) {
      const message = err.message || 'Failed to load orders';
      setError(message);
      console.error('Orders fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Optional: Set up auto-refresh for real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds
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
    refetch: fetchOrders,
    selectOrder,
    filterByStatus,
  };
}
