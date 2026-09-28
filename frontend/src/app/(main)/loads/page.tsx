'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockLoads, OrderStatus } from '@/mock/mockData';
import styles from '../layout.module.css'; // Adjust as needed
import tableStyles from './loads.module.css';

export default function LoadsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('ALL');

  const filteredLoads = filter === 'ALL' 
    ? mockLoads 
    : mockLoads.filter(l => l.status === filter);

  return (
    <div className={styles.container} style={{ paddingTop: '2rem' }}>
      <div className={tableStyles.header}>
        <h2>All Loads</h2>
        <div className={tableStyles.filters}>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="MATCHING">Matching</option>
            <option value="NEGOTIATING">Negotiating</option>
            <option value="BOOKED">Booked</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="AUDIT_FAILED">Audit Failed</option>
          </select>
        </div>
      </div>

      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Weight</th>
              <th>Target Rate</th>
              <th>Status</th>
              <th>Carrier</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoads.map(load => (
              <tr 
                key={load.id} 
                onClick={() => router.push(`/live-map?loadId=${load.id}`)}
                className={tableStyles.row}
              >
                <td>{load.id}</td>
                <td>{load.origin}</td>
                <td>{load.destination}</td>
                <td>{load.weightKg} kg</td>
                <td>€{load.targetRate}</td>
                <td>
                  <span className={`${tableStyles.badge} ${tableStyles[load.status.toLowerCase()]}`}>
                    {load.status}
                  </span>
                </td>
                <td>{load.carrierName || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLoads.length === 0 && (
          <div className={tableStyles.emptyState}>No loads found for this filter.</div>
        )}
      </div>
    </div>
  );
}
