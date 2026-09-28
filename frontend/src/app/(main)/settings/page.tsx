'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import styles from '../layout.module.css';

const FleetConfigurator = dynamic(
  () => import('@/components/fleet-configurator').then(mod => mod.FleetConfigurator),
  { ssr: false }
);

export default function SettingsPage() {
  const [aiStrictness, setAiStrictness] = useState(70);

  return (
    <motion.div 
      className={styles.container} 
      style={{ paddingTop: '2rem' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>Settings & Fleet Configuration</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Column - Profile & AI Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Profile */}
          <section style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '0.95rem' }}>Profile</h3>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Manage your account settings and preferences.
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.4rem', letterSpacing: '0.03em' }}>Name</label>
                <input type="text" defaultValue="System Admin" style={{ 
                  width: '100%', padding: '0.75rem', borderRadius: '8px', 
                  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)', 
                  color: '#fff', fontSize: '0.9rem', outline: 'none',
                  transition: 'border-color 0.2s'
                }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.4rem', letterSpacing: '0.03em' }}>Email</label>
                <input type="email" defaultValue="admin@haulage.com" style={{ 
                  width: '100%', padding: '0.75rem', borderRadius: '8px', 
                  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)', 
                  color: '#fff', fontSize: '0.9rem', outline: 'none'
                }} />
              </div>
            </div>
          </section>

          {/* AI Negotiation Config */}
          <section style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '0.95rem' }}>AI Broker Configuration</h3>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Tune how aggressively the AI negotiates carrier rates.
            </div>
            
            {/* Strictness Slider */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Negotiation Strictness</span>
                <span style={{ 
                  color: aiStrictness > 80 ? '#ef4444' : aiStrictness > 50 ? 'var(--amber)' : '#4ade80', 
                  fontSize: '0.85rem', fontWeight: 700 
                }}>{aiStrictness}%</span>
              </div>
              <input 
                type="range" min="10" max="100" value={aiStrictness}
                onChange={(e) => setAiStrictness(Number(e.target.value))}
                style={{ 
                  width: '100%', accentColor: 'var(--amber)', height: '6px',
                  cursor: 'pointer'
                }} 
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ color: '#4ade80', fontSize: '0.7rem' }}>Flexible</span>
                <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>Aggressive</span>
              </div>
            </div>

            {/* AI Behavior Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                background: aiStrictness > 60 ? 'rgba(245, 163, 58, 0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${aiStrictness > 60 ? 'rgba(245, 163, 58, 0.3)' : 'var(--line)'}`,
              }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Max Counter-Offers</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>{Math.max(2, Math.round(aiStrictness / 20))}</div>
              </div>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                background: aiStrictness > 80 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${aiStrictness > 80 ? 'rgba(239, 68, 68, 0.3)' : 'var(--line)'}`,
              }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Auto-Reject Threshold</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>+{Math.round(aiStrictness / 5)}%</div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '0.95rem' }}>Notifications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--amber)' }} /> Email alerts for Audit Failures
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--amber)' }} /> Push notifications for Delay Warnings
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--amber)' }} /> AI Negotiation completion alerts
              </label>
            </div>
          </section>
        </div>

        {/* Right Column - 3D Fleet Configurator */}
        <div>
          <FleetConfigurator />
        </div>
      </div>
    </motion.div>
  );
}
