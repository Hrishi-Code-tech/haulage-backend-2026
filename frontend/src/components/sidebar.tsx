'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TowerControl, Truck, Map as MapIcon, ScrollText, FileCheck, Settings } from 'lucide-react';
import styles from './sidebar.module.css';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Control Tower', path: '/dashboard', icon: <TowerControl className={styles.navIcon} /> },
    { name: 'Loads', path: '/loads', icon: <Truck className={styles.navIcon} /> },
    { name: 'Live Map', path: '/live-map', icon: <MapIcon className={styles.navIcon} /> },
    { name: 'AI Negotiation Log', path: '/negotiation-log', icon: <ScrollText className={styles.navIcon} /> },
    { name: 'Documents & Audit', path: '/documents-audit', icon: <FileCheck className={styles.navIcon} /> },
    { name: 'Settings', path: '/settings', icon: <Settings className={styles.navIcon} /> },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>
          <i></i><i></i><i></i>
        </div>
        <span>haulage</span>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.name} 
              href={item.path} 
              className={`${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className={styles.devOpsSection}>
        <Link href="/dev-console" className={styles.devOpsLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          Dev / Ops Console
        </Link>
      </div>
    </aside>
  );
}
