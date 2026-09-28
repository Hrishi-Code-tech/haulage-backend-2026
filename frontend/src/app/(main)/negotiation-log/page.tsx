'use client';

import React, { useState } from 'react';
import { mockNegotiations, Negotiation } from '@/mock/mockData';
import { PredictiveChart } from '@/components/predictive-chart';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../layout.module.css';

export default function NegotiationLogPage() {
  const [selectedNeg, setSelectedNeg] = useState<Negotiation | null>(mockNegotiations[0] || null);

  return (
    <div className={styles.container} style={{ paddingTop: '2rem' }}>
      <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>AI Broker Terminal</h2>
      
      {/* Predictive Chart Panel */}
      <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', height: '250px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <PredictiveChart />
      </div>

      <div className={styles.contentGrid}>
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', height: '50vh', overflowY: 'auto' }}>
          {mockNegotiations.map(neg => (
            <div 
              key={neg.id}
              onClick={() => setSelectedNeg(neg)}
              style={{
                padding: '1rem',
                borderBottom: '1px solid var(--line)',
                cursor: 'pointer',
                background: selectedNeg?.id === neg.id ? 'rgba(245, 163, 58, 0.15)' : 'transparent',
                borderLeft: selectedNeg?.id === neg.id ? '3px solid var(--amber)' : '3px solid transparent'
              }}
            >
              <div style={{ color: '#fff', fontWeight: 'bold' }}>{neg.id} - {neg.loadId}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Carrier: {neg.carrierName}
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  background: neg.status === 'AGREED' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(245, 163, 58, 0.15)',
                  color: neg.status === 'AGREED' ? '#a78bfa' : 'var(--amber)'
                }}>
                  {neg.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', height: '50vh', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          {selectedNeg ? (
            <>
              <h3 style={{ color: '#fff', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--line)' }}>
                Terminal: {selectedNeg.id} ({selectedNeg.carrierName})
              </h3>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
                <AnimatePresence mode="popLayout">
                  {selectedNeg.turns.map((turn, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: idx * 0.4, type: 'spring', stiffness: 200, damping: 20 }}
                      style={{
                        alignSelf: turn.speaker === 'AI_AGENT' ? 'flex-start' : 'flex-end',
                        background: turn.speaker === 'AI_AGENT' ? 'rgba(245, 163, 58, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: turn.speaker === 'AI_AGENT' ? '1px solid rgba(245, 163, 58, 0.3)' : '1px solid var(--line)',
                        padding: '1rem',
                        borderRadius: '8px',
                        maxWidth: '80%',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: turn.speaker === 'AI_AGENT' ? 'var(--amber)' : 'var(--muted)', marginBottom: '0.4rem', fontWeight: 'bold' }}>
                        {turn.speaker === 'AI_AGENT' ? '● AI BROKER' : `CARRIER (${turn.speaker})`}
                      </div>
                      <div style={{ color: '#e2e8f0', lineHeight: '1.4' }}>{turn.message}</div>
                      {turn.proposedRate && (
                        <div style={{ 
                          marginTop: '0.75rem', 
                          fontSize: '0.85rem', 
                          color: '#fff', 
                          fontWeight: 'bold',
                          background: 'rgba(0,0,0,0.2)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          Proposed: €{turn.proposedRate}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {selectedNeg.status === 'AGREED' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: selectedNeg.turns.length * 0.4 }}
                    style={{ textAlign: 'center', marginTop: '1rem', color: '#4ade80', fontWeight: 'bold', fontSize: '0.9rem' }}
                  >
                    ✓ SECURED
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <div style={{ margin: 'auto', color: 'var(--muted)' }}>Select a negotiation to view live terminal.</div>
          )}
        </div>
      </div>
    </div>
  );
}
