'use client';

import React from 'react';
import { useOrders } from '@/hooks/useOrders';
import { useTelemetry } from '@/hooks/useTelemetry';
import { MetricsCard } from '@/components/metrics-card';
import { TelemetryMap } from '@/components/telemetry-map';
import { ActionFeed } from '@/components/action-feed';
import { OrderDetail } from '@/components/order-detail';
import { motion } from 'framer-motion';
import { Truck, Scale, CircleDollarSign, CheckCircle2 } from 'lucide-react';
import styles from '../layout.module.css';

export default function ControlTower() {
  const { orders, selectedOrder, selectOrder, isLoading: ordersLoading } = useOrders(false);
  const { position, history } = useTelemetry(selectedOrder?.id || null);

  const activeLoads = orders.filter((o) => ['IN_TRANSIT', 'BOOKED'].includes(o.status)).length;
  const totalWeight = orders.reduce((sum, o) => sum + o.weightKg, 0);
  const avgRate = orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.targetRate, 0) / orders.length) : 0;
  const deliveryRate = 96.8;

  return (
    <motion.div 
      className={styles.container}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
    >
      <motion.section 
        className={styles.metricsGrid}
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      >
        <MetricsCard
          label="Active Loads"
          value={activeLoads}
          icon={<Truck size={20} />}
          trend={12}
          loading={ordersLoading}
        />
        <MetricsCard
          label="Total Weight"
          value={totalWeight}
          suffix=" kg"
          icon={<Scale size={20} />}
          loading={ordersLoading}
        />
        <MetricsCard
          label="Avg Rate"
          value={`€${avgRate}`}
          icon={<CircleDollarSign size={20} />}
          loading={ordersLoading}
        />
        <MetricsCard
          label="On-Time Rate"
          value={deliveryRate}
          suffix="%"
          icon={<CheckCircle2 size={20} />}
          trend={3}
        />
      </motion.section>

      <motion.div 
        className={styles.contentGrid}
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      >
        <div className={styles.mapSection}>
          <TelemetryMap
            order={selectedOrder || null}
            position={position}
            history={history}
            isLoading={false}
          />
        </div>

        <div className={styles.rightPanel}>
          <ActionFeed />
        </div>
      </motion.div>

      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          telemetry={position}
          onClose={() => selectOrder(null)}
        />
      )}
    </motion.div>
  );
}
