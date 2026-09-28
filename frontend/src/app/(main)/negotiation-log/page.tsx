'use client';

import React, { useState } from 'react';
import { mockNegotiations, Negotiation } from '@/mock/mockData';
import styles from '../../dashboard/dashboard.module.css';

export default function NegotiationLogPage() {
  const [selectedNeg, setSelectedNeg] = useState<Negotiation | null>(mockNegotiations[0] || null);

  return (
    <div className={styles.container} style={{ paddingTop: '2rem' }}>
      <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>AI Negotiation Log</h2>
      <div className={styles.contentGrid}>
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', height: '70vh', overflowY: 'auto' }}>
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
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', height: '70vh', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          {selectedNeg ? (
            <>
              <h3 style={{ color: '#fff', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--line)' }}>
                Transcript: {selectedNeg.id} ({selectedNeg.carrierName})
              </h3>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedNeg.turns.map((turn, idx) => (
                  <div key={idx} style={{
                    alignSelf: turn.speaker === 'AI_AGENT' ? 'flex-start' : 'flex-end',
                    background: turn.speaker === 'AI_AGENT' ? 'rgba(245, 163, 58, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: turn.speaker === 'AI_AGENT' ? '1px solid rgba(245, 163, 58, 0.3)' : '1px solid var(--line)',
                    padding: '1rem',
                    borderRadius: '8px',
                    maxWidth: '80%'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                      {turn.speaker === 'AI_AGENT' ? 'AI Agent' : turn.speaker}
                    </div>
                    <div style={{ color: '#fff' }}>{turn.message}</div>
                    {turn.proposedRate && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--amber)', fontWeight: 'bold' }}>
                        Proposed: €{turn.proposedRate}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ margin: 'auto', color: 'var(--muted)' }}>Select a negotiation to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
