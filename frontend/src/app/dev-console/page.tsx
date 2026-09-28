'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from './dev-console.module.css';

// Using the same mock ID as the vanilla JS dashboard
const MOCK_LOAD_ID = '550e8400-e29b-41d4-a716-446655440000';

type ResultState = {
  data: string | null;
  isError: boolean;
};

export default function DevConsole() {
  const { token } = useAuth();
  
  // States for inputs
  const [weight, setWeight] = useState(25000);
  const [lat, setLat] = useState(34.0522);
  const [lng, setLng] = useState(-118.2437);
  
  // States for results
  const [optResult, setOptResult] = useState<ResultState>({ data: null, isError: false });
  const [mediaResult, setMediaResult] = useState<ResultState>({ data: null, isError: false });
  const [telemetryResult, setTelemetryResult] = useState<ResultState>({ data: null, isError: false });
  const [webhookResult, setWebhookResult] = useState<ResultState>({ data: null, isError: false });

  const formatData = (data: any) => typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const handleOptimize = async () => {
    try {
      const res = await fetch('/api/internal/optimize-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          load: { origin: { latitude: 34.05, longitude: -118.25 }, destination: { latitude: 36.16, longitude: -115.13 }, weight },
          nearby_drivers: [{ latitude: 34.06, longitude: -118.24 }]
        })
      });
      const data = await res.json();
      setOptResult({ data: formatData(data), isError: !res.ok });
    } catch (e: any) {
      setOptResult({ data: e.message, isError: true });
    }
  };

  const handleMediaReq = async (type: 'invoice' | 'pallet') => {
    try {
      const endpoint = type === 'invoice' ? '/api/media/upload/invoice' : '/api/media/upload/pallet-photo';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          load_id: MOCK_LOAD_ID,
          file_name: `test_${type}.jpg`,
          content_type: 'image/jpeg'
        })
      });
      const data = await res.json();
      setMediaResult({ data: formatData(data), isError: !res.ok });
    } catch (e: any) {
      setMediaResult({ data: e.message, isError: true });
    }
  };

  const handleTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ load_id: MOCK_LOAD_ID, latitude: lat, longitude: lng })
      });
      const data = await res.json();
      setTelemetryResult({ data: formatData(data), isError: !res.ok });
    } catch (e: any) {
      setTelemetryResult({ data: e.message, isError: true });
    }
  };

  const handleWebhook = async () => {
    try {
      const res = await fetch('/api/webhook/voice-negotiation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          orderId: MOCK_LOAD_ID,
          agreedRate: 1500,
          transcript: "Agent: Hello. Driver: I'll take it for 1500. Agent: Agreed.",
          agentDurationSec: 45
        })
      });
      const data = await res.json();
      setWebhookResult({ data: formatData(data), isError: !res.ok });
    } catch (e: any) {
      setWebhookResult({ data: e.message, isError: true });
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dev / Ops Console</h1>
        <p>Internal testing tools for routing, telemetry, and webhooks.</p>
      </header>

      <div className={styles.grid}>
        {/* Routing Optimization */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18M9 9l5-5 7 7"/>
              </svg>
            </div>
            <h2>Routing Optimization</h2>
          </div>
          <div className={styles.cardBody}>
            <p>Trigger the internal routing engine to find optimal matches for a load.</p>
            <div className={styles.formGroup}>
              <label>Load Weight (kg)</label>
              <input type="number" value={weight} onChange={(e) => setWeight(parseInt(e.target.value) || 0)} />
            </div>
            <button className={`${styles.btn} ${styles.primaryBtn}`} onClick={handleOptimize}>
              Run Optimization
            </button>
            {optResult.data && (
              <div className={`${styles.resultBox} ${optResult.isError ? styles.error : ''}`}>
                {optResult.data}
              </div>
            )}
          </div>
        </section>

        {/* Document & Media */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            </div>
            <h2>Document & Media</h2>
          </div>
          <div className={styles.cardBody}>
            <p>Generate S3 pre-signed URLs for secure document ingestion.</p>
            <div className={styles.uploadActions}>
              <button className={`${styles.btn} ${styles.secondaryBtn}`} onClick={() => handleMediaReq('invoice')}>
                Invoice URL
              </button>
              <button className={`${styles.btn} ${styles.secondaryBtn}`} onClick={() => handleMediaReq('pallet')}>
                Pallet Photo URL
              </button>
            </div>
            {mediaResult.data && (
              <div className={`${styles.resultBox} ${mediaResult.isError ? styles.error : ''}`}>
                {mediaResult.data}
              </div>
            )}
          </div>
        </section>

        {/* Telemetry Stream */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h2>Telemetry Stream</h2>
          </div>
          <div className={styles.cardBody}>
            <p>Ingest real-time truck location data.</p>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Lat</label>
                <input type="number" step="0.0001" value={lat} onChange={(e) => setLat(parseFloat(e.target.value) || 0)} />
              </div>
              <div className={styles.formGroup}>
                <label>Lng</label>
                <input type="number" step="0.0001" value={lng} onChange={(e) => setLng(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <button className={`${styles.btn} ${styles.secondaryBtn}`} onClick={handleTelemetry}>
              Send Ping
            </button>
            {telemetryResult.data && (
              <div className={`${styles.resultBox} ${telemetryResult.isError ? styles.error : ''}`}>
                {telemetryResult.data}
              </div>
            )}
          </div>
        </section>

        {/* Webhook Events */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
            <h2>Webhook Events</h2>
          </div>
          <div className={styles.cardBody}>
            <p>Simulate incoming partner webhooks.</p>
            <button className={`${styles.btn} ${styles.secondaryBtn}`} onClick={handleWebhook}>
              Simulate AI Voice Booking
            </button>
            {webhookResult.data && (
              <div className={`${styles.resultBox} ${webhookResult.isError ? styles.error : ''}`}>
                {webhookResult.data}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
