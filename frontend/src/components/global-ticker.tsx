'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_EVENTS = [
  '[SYS] Carrier Omega Logistics accepted load #8921 at €1200',
  '[ALERT] Weather anomaly detected on Route I-70 (Denver)',
  '[SYS] Truck 402 crossed border checkpoint successfully',
  '[INFO] AI Agent secured 15% rate reduction on Dallas lane',
  '[SYS] Routing engine optimized fleet pathing - ETA improved by 45m',
  '[ALERT] Trailer temperature dropped below threshold on Load #9912'
];

export function GlobalTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MOCK_EVENTS.length);
    }, 4500); // Change event every 4.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '32px',
      background: 'rgba(10, 16, 23, 0.95)',
      borderTop: '1px solid rgba(245, 163, 58, 0.1)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      fontSize: '11px',
      fontFamily: 'monospace',
      color: 'rgba(255, 255, 255, 0.5)',
      overflow: 'hidden'
    }}>
      <div style={{
        marginRight: '16px',
        color: 'var(--amber)',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <div style={{
          width: '6px', height: '6px', background: 'var(--amber)', borderRadius: '50%',
          boxShadow: '0 0 6px var(--amber)', animation: 'pulse 2s infinite'
        }} />
        GLOBAL COMMS
      </div>

      <div style={{ position: 'relative', flex: 1, height: '100%', display: 'flex', alignItems: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              color: MOCK_EVENTS[currentIndex].includes('[ALERT]') ? '#ef4444' : '#e2e8f0',
              textShadow: MOCK_EVENTS[currentIndex].includes('[ALERT]') ? '0 0 8px rgba(239,68,68,0.4)' : 'none'
            }}
          >
            {MOCK_EVENTS[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
