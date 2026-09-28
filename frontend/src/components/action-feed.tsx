'use client';

import React from 'react';
import styles from './action-feed.module.css';

import { useRouter } from 'next/navigation';
import { mockEvents } from '@/mock/mockData';

export function ActionFeed() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'CRITICAL':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      case 'SUCCESS':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        );
      case 'WARNING':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        );
      case 'INFO':
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        );
    }
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case 'CRITICAL': return styles.typeCritical;
      case 'SUCCESS': return styles.typeSuccess;
      case 'WARNING': return styles.typeWarning;
      case 'INFO':
      default: return styles.typeInfo;
    }
  };

  const getStatusClass = (type: string) => {
    switch (type) {
      case 'CRITICAL': return styles.statusCritical;
      case 'SUCCESS': return styles.statusSuccess;
      case 'WARNING': return styles.statusWarning;
      case 'INFO':
      default: return styles.statusInfo;
    }
  };

  const router = useRouter();
  
  return (
    <div className={styles.feedContainer}>
      <div className={styles.header}>
        <h2>Action Feed</h2>
        <span className={styles.badge}>{mockEvents.length} New</span>
      </div>
      <ul className={styles.list}>
        {mockEvents.map((event) => (
          <li 
            key={event.id} 
            className={styles.item}
            onClick={() => router.push(`/live-map?loadId=${event.loadId}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className={`${styles.iconWrapper} ${getTypeClass(event.type)}`}>
              {getIcon(event.type)}
            </div>
            <div className={styles.itemContent}>
              <div className={styles.itemHeader}>
                <h3 className={styles.title}>{event.message}</h3>
                <span className={styles.time}>{event.timestamp}</span>
              </div>
              <p className={styles.desc}>{event.type}</p>
              <div className={styles.meta}>
                <span className={styles.loadId}>{event.loadId}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
