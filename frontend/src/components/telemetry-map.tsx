/**
 * Live telemetry map component
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { OrderLoad } from '@/api/orders.api';
import { TelemetryPoint } from '@/api/telemetry.api';
import styles from './telemetry-map.module.css';

interface TelemetryMapProps {
  order: OrderLoad | null;
  position: TelemetryPoint | null;
  history: TelemetryPoint[];
  isLoading?: boolean;
}

export function TelemetryMap({
  order,
  position,
  history,
  isLoading = false,
}: TelemetryMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !position) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = 'rgba(10, 16, 23, 0.5)';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(245, 163, 58, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo((width / 10) * i, 0);
      ctx.lineTo((width / 10) * i, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, (height / 10) * i);
      ctx.lineTo(width, (height / 10) * i);
      ctx.stroke();
    }

    // Normalize coordinates to canvas
    const normalizeCoord = (lat: number, lng: number) => {
      const x = ((lng + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      return { x, y };
    };

    // Draw route history as line
    if (history.length > 1) {
      ctx.strokeStyle = 'rgba(245, 163, 58, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();

      history.forEach((point, index) => {
        const { x, y } = normalizeCoord(point.latitude, point.longitude);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw history points
      history.slice(1).forEach((point) => {
        const { x, y } = normalizeCoord(point.latitude, point.longitude);
        ctx.fillStyle = 'rgba(245, 163, 58, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw current position as pulsing dot
    const { x, y } = normalizeCoord(position.latitude, position.longitude);

    // Outer pulse
    ctx.fillStyle = 'rgba(245, 163, 58, 0.1)';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Main dot
    ctx.fillStyle = '#f5a33a'; // amber color
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }, [position, history]);

  if (!order || !position) {
    return (
      <div className={`${styles.container} ${styles.empty}`}>
        <div className={styles.placeholder}>
          <p>📍</p>
          <p>Select a load to view live location</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Live Location</h3>
        <span className={styles.status}>
          <span className={styles.dot}></span> Live
        </span>
      </div>
      <canvas ref={canvasRef} className={styles.canvas}></canvas>
      <div className={styles.info}>
        <p className={styles.label}>
          {position.latitude.toFixed(4)}° N, {position.longitude.toFixed(4)}° E
        </p>
        <p className={styles.timestamp}>
          Last updated: {new Date(position.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
