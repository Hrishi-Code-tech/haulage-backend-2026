'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { mockLoads } from '@/mock/mockData';
import { TelemetryMap } from '@/components/telemetry-map';
import styles from '../layout.module.css';

export default function LiveMapPage() {
  const searchParams = useSearchParams();
  const loadId = searchParams.get('loadId');
  const [selectedId, setSelectedId] = useState<string | null>(loadId);

  useEffect(() => {
    if (loadId) setSelectedId(loadId);
  }, [loadId]);

  const inTransitLoads = mockLoads.filter(l => l.status === 'IN_TRANSIT');
  const selectedLoad = mockLoads.find(l => l.id === selectedId) || null;

  return (
    <div className={styles.container} style={{ paddingTop: '2rem' }}>
      <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>Live Map</h2>
      <div className={styles.contentGrid}>
        <div className={styles.mapSection} style={{ height: '70vh' }}>
          {/* Mock position based on the selected load, or default null */}
          <TelemetryMap
            order={selectedLoad as any}
            position={selectedLoad && selectedLoad.lat && selectedLoad.lng ? { id: selectedLoad.id, lat: selectedLoad.lat, lng: selectedLoad.lng, speed: 60, heading: 90, timestamp: '' } : null}
            history={[]}
            isLoading={false}
          />
        </div>
        <div className={styles.rightPanel}>
          <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)', height: '70vh', overflowY: 'auto' }}>
            <h3 style={{ color: '#fff', marginBottom: '1rem' }}>In Transit Loads</h3>
            {inTransitLoads.map(load => (
              <div 
                key={load.id} 
                onClick={() => setSelectedId(load.id)}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--line)',
                  cursor: 'pointer',
                  background: selectedId === load.id ? 'rgba(245, 163, 58, 0.15)' : 'transparent',
                  borderLeft: selectedId === load.id ? '3px solid var(--amber)' : '3px solid transparent'
                }}
              >
                <div style={{ color: '#fff', fontWeight: 'bold' }}>{load.id}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {load.origin} &rarr; {load.destination}
                </div>
              </div>
            ))}
            {inTransitLoads.length === 0 && (
              <div style={{ color: 'var(--muted)', padding: '1rem' }}>No loads in transit.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
