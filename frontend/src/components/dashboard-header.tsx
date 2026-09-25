/**
 * Dashboard header component - displays user info and quick actions
 */

'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from './dashboard-header.module.css';

export function DashboardHeader() {
  const { user, logout } = useAuth();

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
