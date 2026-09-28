/**
 * Orders hook for fetching and managing order state
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
    setIsLoading(true);
    setError(null);
    // Simulate slight network delay if needed, but we can just set it immediately
    setOrders(mockLoads as any[]); 
    setIsLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
