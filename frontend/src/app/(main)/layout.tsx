'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import styles from './layout.module.css';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

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

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainContent}>
        <div className={styles.dashboard}>
          <div className="ambient-orbs">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
          </div>
          <DashboardHeader />
          <main className={styles.main}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
