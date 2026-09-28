'use client';

import React from 'react';
import styles from '../layout.module.css';

export default function SettingsPage() {
  return (
    <div className={styles.container} style={{ paddingTop: '2rem' }}>
      <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>Settings</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
        <section style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
          <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Profile</h3>
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Manage your account settings and preferences.
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#fff', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Name</label>
              <input type="text" value="System Admin" readOnly style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: '#fff', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Email</label>
              <input type="email" value="admin@haulage.com" readOnly style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', color: '#fff' }} />
            </div>
          </div>
        </section>
        
        <section style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
          <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Notifications</h3>
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Configure how you want to be alerted.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontSize: '0.9rem' }}>
              <input type="checkbox" checked readOnly /> Email alerts for Audit Failures
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontSize: '0.9rem' }}>
              <input type="checkbox" checked readOnly /> Push notifications for Delay Warnings
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
