/**
 * Order detail panel - shows full details of selected order
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderLoad } from '@/api/orders.api';
import { TelemetryPoint } from '@/api/telemetry.api';
import styles from './order-detail.module.css';

interface OrderDetailProps {
  order: OrderLoad | null;
  telemetry: TelemetryPoint | null;
  isLoading?: boolean;
  onClose: () => void;
}

export function OrderDetail({
  order,
  telemetry,
  isLoading = false,
  onClose,
}: OrderDetailProps) {
  if (!order) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className={styles.panel}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          <div className={styles.header}>
            <h2>Order Details</h2>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close panel">
              ✕
            </button>
          </div>

          <div className={styles.content}>
            {/* Route Information */}
            <section className={styles.section}>
              <h3>Route</h3>
              <div className={styles.routeInfo}>
                <div className={styles.location}>
                  <span className={styles.label}>From</span>
                  <p>{order.origin}</p>
                </div>
                <div className={styles.arrow}>→</div>
                <div className={styles.location}>
                  <span className={styles.label}>To</span>
                  <p>{order.destination}</p>
                </div>
              </div>
            </section>

            {/* Load Information */}
            <section className={styles.section}>
              <h3>Load Details</h3>
              <div className={styles.grid}>
                <div className={styles.gridItem}>
                  <span className={styles.label}>Weight</span>
                  <p>{order.weightKg.toLocaleString()} kg</p>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.label}>Target Rate</span>
                  <p>€{order.targetRate}</p>
                </div>
              </div>
            </section>

            {/* Status */}
            <section className={styles.section}>
              <h3>Status</h3>
              <div className={styles.statusBadge} data-status={order.status}>
                {order.status.replace('_', ' ')}
              </div>
            </section>

            {/* Telemetry / Live Location */}
            {telemetry && (
              <section className={styles.section}>
                <h3>Current Location</h3>
                <div className={styles.grid}>
                  <div className={styles.gridItem}>
                    <span className={styles.label}>Latitude</span>
                    <p>{telemetry.latitude.toFixed(4)}°</p>
                  </div>
                  <div className={styles.gridItem}>
                    <span className={styles.label}>Longitude</span>
                    <p>{telemetry.longitude.toFixed(4)}°</p>
                  </div>
                </div>
                <div className={styles.gridItem} style={{ marginTop: '0.75rem' }}>
                  <span className={styles.label}>Last Update</span>
                  <p>{new Date(telemetry.timestamp).toLocaleTimeString()}</p>
                </div>
              </section>
            )}

            {/* Timestamps */}
            <section className={styles.section}>
              <h3>Timeline</h3>
              <div className={styles.gridItem}>
                <span className={styles.label}>Created</span>
                <p>{new Date(order.createdAt).toLocaleString()}</p>
              </div>
            </section>
          </div>

          <div className={styles.actions}>
            <button className={styles.primaryBtn}>Optimize Route</button>
            <button className={styles.secondaryBtn}>Contact Carrier</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
