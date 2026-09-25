'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useTelemetry } from '@/hooks/useTelemetry';
import { DashboardHeader } from '@/components/dashboard-header';
import { MetricsCard } from '@/components/metrics-card';
import { OrdersTable } from '@/components/orders-table';
import { TelemetryMap } from '@/components/telemetry-map';
import { OrderDetail } from '@/components/order-detail';
import { motion } from 'framer-motion';
import styles from './dashboard.module.css';

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const { orders, selectedOrder, selectOrder, isLoading: ordersLoading, error } = useOrders(true);
  const { position, history } = useTelemetry(selectedOrder?.id || null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        setShowAuth(true);
      }
    }
  }, [isAuthenticated, authLoading, router]);

  if (!showAuth) return null;

  // Calculate metrics
  const activeLoads = orders.filter((o) => ['IN_TRANSIT', 'BOOKED'].includes(o.status)).length;
  const totalWeight = orders.reduce((sum, o) => sum + o.weightKg, 0);
  const avgRate = orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.targetRate, 0) / orders.length) : 0;
  const deliveryRate = 96.8; // Mock percentage

  return (
    <div className={styles.dashboard}>
      <div className="ambient-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
      
      <DashboardHeader />

      <main className={styles.main}>
        <motion.div 
          className={styles.container}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {/* Metrics Section */}
          <motion.section 
            className={styles.metricsGrid}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <MetricsCard
              label="Active Loads"
              value={activeLoads}
              icon="🚚"
              trend={12}
              loading={ordersLoading}
            />
            <MetricsCard
              label="Total Weight"
              value={totalWeight}
              suffix=" kg"
              icon="⚖️"
              loading={ordersLoading}
            />
            <MetricsCard
              label="Avg Rate"
              value={`€${avgRate}`}
              icon="💰"
              loading={ordersLoading}
            />
            <MetricsCard
              label="On-Time Rate"
              value={deliveryRate}
              suffix="%"
              icon="✓"
              trend={3}
            />
          </motion.section>

          {/* Main Content Grid */}
          <motion.div 
            className={styles.contentGrid}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            {/* Orders Table */}
            <div className={styles.ordersSection}>
              <OrdersTable
                orders={orders}
                isLoading={ordersLoading}
                error={error}
                onSelectOrder={selectOrder}
              />
            </div>

            {/* Right Panel - Map and Details */}
            <div className={styles.rightPanel}>
              <div className={styles.mapWrapper}>
                <TelemetryMap
                  order={selectedOrder || null}
                  position={position}
                  history={history}
                  isLoading={false}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          telemetry={position}
          onClose={() => selectOrder(null)}
        />
      )}
    </div>
  );
}
