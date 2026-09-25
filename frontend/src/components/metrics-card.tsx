/**
 * Metrics card component for dashboard stats
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import styles from './metrics-card.module.css';

interface MetricsCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  icon?: string;
  trend?: number; // percentage change
  loading?: boolean;
}

export function MetricsCard({
  label,
  value,
  suffix = '',
  icon = '📊',
  trend,
  loading = false,
}: MetricsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animate number counting
  useEffect(() => {
    if (typeof value !== 'number' || loading) return;

    let start = 0;
    const end = value;
    const duration = 800; // ms
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, loading]);

  const finalValue = typeof value === 'string' ? value : `${displayValue}${suffix}`;

  if (loading) {
    return (
      <motion.div 
        className={`${styles.card} ${styles.loading}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.skeletonIcon}></div>
        <div className={styles.content}>
          <div className={styles.skeletonLabel}></div>
          <div className={styles.skeletonValue}></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={styles.card}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.icon}>{icon}</div>
      <div className={styles.content}>
        <p className={styles.label}>{label}</p>
        <p className={styles.value}>{finalValue}</p>
        {trend !== undefined && (
          <div className={`${styles.trend} ${trend > 0 ? styles.up : styles.down}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </motion.div>
  );
}
