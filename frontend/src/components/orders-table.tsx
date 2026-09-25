/**
 * Orders table component - displays list of active loads
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderLoad, OrderStatus } from '@/api/orders.api';
import styles from './orders-table.module.css';

interface OrdersTableProps {
  orders: OrderLoad[];
  isLoading: boolean;
  error: string | null;
  onSelectOrder: (order: OrderLoad) => void;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '#8b989b',
  [OrderStatus.MATCHING]: '#f5a33a',
  [OrderStatus.NEGOTIATING]: '#ffbd5e',
  [OrderStatus.BOOKED]: '#3a8fef',
  [OrderStatus.IN_TRANSIT]: '#4ade80',
  [OrderStatus.DELIVERED]: '#10b981',
  [OrderStatus.AUDIT_FAILED]: '#ef4444',
};

export function OrdersTable({
  orders,
  isLoading,
  error,
  onSelectOrder,
}: OrdersTableProps) {
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.status.localeCompare(b.status);
  });

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonRow}></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.errorIcon}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>Failed to load orders</p>
          <p className={styles.errorDetail}>{error}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <motion.div 
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className={styles.empty}>
          <div className={styles.emptyIconWrap}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.emptyIcon}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <p className={styles.emptyText}>No active loads</p>
          <p className={styles.emptyDetail}>The network is quiet. New loads will appear here.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Active Loads</h2>
        <div className={styles.controls}>
          <button
            className={sortBy === 'date' ? styles.active : ''}
            onClick={() => setSortBy('date')}
          >
            Recent
          </button>
          <button
            className={sortBy === 'status' ? styles.active : ''}
            onClick={() => setSortBy('status')}
          >
            Status
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Route</th>
              <th>Weight</th>
              <th>Rate</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {sortedOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  className={styles.row}
                  onClick={() => onSelectOrder(order)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(245, 163, 58, 0.03)' }}
                >
                  <td className={styles.route}>
                    <div>
                      <span className={styles.origin}>{order.origin}</span>
                      <span className={styles.arrow}>→</span>
                      <span className={styles.destination}>{order.destination}</span>
                    </div>
                  </td>
                  <td>{order.weightKg.toLocaleString()} kg</td>
                  <td>€{order.targetRate}</td>
                  <td>
                    <span
                      className={styles.status}
                      style={{ 
                        color: STATUS_COLORS[order.status],
                        backgroundColor: `${STATUS_COLORS[order.status]}15`,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={styles.date}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className={styles.action}>→</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
