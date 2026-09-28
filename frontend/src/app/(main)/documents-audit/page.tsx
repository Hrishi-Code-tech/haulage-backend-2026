'use client';

import React, { useState } from 'react';
import { mockInvoices, Invoice } from '@/mock/mockData';
import styles from '../layout.module.css';
import tableStyles from '../loads/loads.module.css';

export default function DocumentsAuditPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(mockInvoices[0] || null);

  return (
    <div className={styles.container} style={{ paddingTop: '2rem' }}>
      <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>Documents & Audit</h2>
      <div className={styles.contentGrid}>
        <div className={tableStyles.tableContainer} style={{ height: '70vh', overflowY: 'auto' }}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Load ID</th>
                <th>Carrier</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockInvoices.map(inv => (
                <tr 
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={tableStyles.row}
                  style={{ background: selectedInvoice?.id === inv.id ? 'rgba(255,255,255,0.05)' : '' }}
                >
                  <td>{inv.id}</td>
                  <td>{inv.loadId}</td>
                  <td>{inv.carrierName}</td>
                  <td>
                    <span className={`${tableStyles.badge} ${
                      inv.auditStatus === 'PASS' ? tableStyles.delivered :
                      inv.auditStatus === 'FAIL' ? tableStyles.audit_failed :
                      tableStyles.pending
                    }`}>
                      {inv.auditStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', height: '70vh', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          {selectedInvoice ? (
            <>
              <h3 style={{ color: '#fff', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--line)' }}>
                Audit Details: {selectedInvoice.id}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Negotiated Rate</div>
                  <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>€{selectedInvoice.negotiatedRate}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Billed Amount</div>
                  <div style={{ color: selectedInvoice.auditStatus === 'FAIL' ? '#ef4444' : '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>€{selectedInvoice.billedAmount}</div>
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Audit Result</div>
                {selectedInvoice.auditStatus === 'PASS' && (
                  <div style={{ padding: '1rem', background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', borderRadius: '8px', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                    All checks passed. Amounts match.
                  </div>
                )}
                {selectedInvoice.auditStatus === 'PENDING' && (
                  <div style={{ padding: '1rem', background: 'rgba(245, 163, 58, 0.1)', color: 'var(--amber)', borderRadius: '8px', border: '1px solid rgba(245, 163, 58, 0.2)' }}>
                    Awaiting document processing...
                  </div>
                )}
                {selectedInvoice.auditStatus === 'FAIL' && (
                  <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <strong>Discrepancies found:</strong>
                    <ul style={{ marginTop: '0.5rem', marginLeft: '1.25rem' }}>
                      {selectedInvoice.discrepancies.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ margin: 'auto', color: 'var(--muted)' }}>Select an invoice to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
