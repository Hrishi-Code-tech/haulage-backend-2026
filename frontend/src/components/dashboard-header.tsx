/**
 * Dashboard header component - displays user info and quick actions
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from './dashboard-header.module.css';

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const [apiStatus, setApiStatus] = useState<'checking' | 'live' | 'offline'>('checking');

  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/health`);
        if (res.ok) {
          setApiStatus('live');
        } else {
          setApiStatus('offline');
        }
      } catch {
        setApiStatus('offline');
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.branding}>
          <div className="brand" style={{ pointerEvents: 'none' }}>
            <span className="brand-mark" style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}><i></i><i></i><i></i></span>
            <span style={{ fontSize: '18px', marginLeft: '2px', fontWeight: 600 }}>haulage</span>
          </div>
          <span className={styles.divider}>/</span>
          <h1>Control Tower</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* API Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: apiStatus === 'live' ? 'rgba(74, 222, 128, 0.1)' : apiStatus === 'offline' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${apiStatus === 'live' ? 'rgba(74, 222, 128, 0.3)' : apiStatus === 'offline' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'}`,
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.03em'
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: apiStatus === 'live' ? '#4ade80' : apiStatus === 'offline' ? '#ef4444' : '#94a3b8',
              boxShadow: apiStatus === 'live' ? '0 0 6px #4ade80' : 'none'
            }} />
            <span style={{ color: apiStatus === 'live' ? '#4ade80' : apiStatus === 'offline' ? '#ef4444' : '#94a3b8' }}>
              {apiStatus === 'live' ? 'API LIVE' : apiStatus === 'offline' ? 'MOCK DATA' : 'CHECKING...'}
            </span>
          </div>

          {/* Copilot Shortcut Badge */}
          <div style={{
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8',
            fontSize: '11px',
            cursor: 'pointer'
          }}
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          >
            Ctrl+K AI Copilot
          </div>
        </div>

        <div className={styles.userSection}>
          {user && (
            <>
              <div className={styles.userInfo}>
                <p className={styles.userName}>{user.name}</p>
                <p className={styles.companyName}>{user.companyName}</p>
              </div>
              <button className={styles.logoutBtn} onClick={logout} title="Log out">
                ↗
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

