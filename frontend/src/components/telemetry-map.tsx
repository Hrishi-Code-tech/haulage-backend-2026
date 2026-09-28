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
  const animationRef = useRef<number>();

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

    let angle = 0;

    const renderFrame = () => {
      // Clear canvas with trail effect
      ctx.fillStyle = 'rgba(10, 16, 23, 0.2)';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = 'rgba(245, 163, 58, 0.03)';
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

      // Draw Weather System (Storm Cell)
      const gradient = ctx.createRadialGradient(width * 0.7, height * 0.4, 10, width * 0.7, height * 0.4, 150);
      gradient.addColorStop(0, 'rgba(220, 38, 38, 0.15)'); // Red storm center
      gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.05)'); // Amber edge
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(width * 0.7 + Math.sin(angle) * 10, height * 0.4 + Math.cos(angle) * 10, 150, 0, Math.PI * 2);
      ctx.fill();

      // Normalize coordinates to canvas
      const normalizeCoord = (lat: number, lng: number) => {
        const x = ((lng + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        return { x, y };
      };

      // Draw route history
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
      }

      // Draw current position as pulsing dot
      const { x, y } = normalizeCoord(position.latitude, position.longitude);

      // Radar Sweep Effect
      angle += 0.03;
      const radarGrad = ctx.createConicGradient(angle, x, y);
      radarGrad.addColorStop(0, 'transparent');
      radarGrad.addColorStop(0.8, 'transparent');
      radarGrad.addColorStop(1, 'rgba(245, 163, 58, 0.4)');
      
      ctx.fillStyle = radarGrad;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, 100, angle, angle + Math.PI / 4);
      ctx.lineTo(x, y);
      ctx.fill();

      // Outer pulse
      ctx.fillStyle = `rgba(245, 163, 58, ${0.1 + Math.sin(angle * 3) * 0.05})`;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Main dot
      ctx.fillStyle = '#f5a33a';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      animationRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
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
