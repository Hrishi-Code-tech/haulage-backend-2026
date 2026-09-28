'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Point {
  x: number;
  y: number;
  date: string;
  rate: number;
}

export function PredictiveChart() {
  const width = 600;
  const height = 200;
  const padding = 20;

  // Mock historical data + AI prediction (last 3 points are predictive)
  const data = [
    { date: 'Mon', rate: 1450 },
    { date: 'Tue', rate: 1420 },
    { date: 'Wed', rate: 1500 },
    { date: 'Thu', rate: 1480 },
    { date: 'Fri', rate: 1550 },
    { date: 'Sat', rate: 1390, isPrediction: true },
    { date: 'Sun', rate: 1350, isPrediction: true },
    { date: 'Next Mon', rate: 1280, isPrediction: true }
  ];

  const maxRate = Math.max(...data.map(d => d.rate)) + 100;
  const minRate = Math.min(...data.map(d => d.rate)) - 100;

  const points: (Point & { isPrediction?: boolean })[] = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: height - padding - ((d.rate - minRate) / (maxRate - minRate)) * (height - padding * 2),
    date: d.date,
    rate: d.rate,
    isPrediction: d.isPrediction
  }));

  const historicalPoints = points.filter(p => !p.isPrediction);
  const predictionPoints = points.slice(historicalPoints.length - 1); // overlap last historical point

  const drawPath = (pts: Point[]) => {
    return pts.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h4 style={{ color: '#fff', fontSize: '0.85rem', margin: 0 }}>Dallas &rarr; Seattle Spot Rates</h4>
        <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem' }}>
          <span style={{ color: '#94a3b8' }}>&mdash; Historical</span>
          <span style={{ color: '#f5a33a' }}>- - AI Forecast</span>
        </div>
      </div>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          
          {/* Grid lines */}
          {[0, 0.5, 1].map((pct, i) => (
            <line 
              key={i}
              x1={padding} 
              y1={padding + pct * (height - padding * 2)} 
              x2={width - padding} 
              y2={padding + pct * (height - padding * 2)} 
              stroke="rgba(255,255,255,0.05)" 
              strokeDasharray="4 4"
            />
          ))}

          {/* Historical Path */}
          <motion.path
            d={drawPath(historicalPoints)}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Predictive Path */}
          <motion.path
            d={drawPath(predictionPoints)}
            fill="none"
            stroke="#f5a33a"
            strokeWidth="3"
            strokeDasharray="6 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={4}
                fill={p.isPrediction ? '#f5a33a' : '#94a3b8'}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.15 + (p.isPrediction ? 1.5 : 0) }}
              />
              <text 
                x={p.x} 
                y={height - 2} 
                fill="rgba(255,255,255,0.4)" 
                fontSize="10" 
                textAnchor="middle"
              >
                {p.date}
              </text>
              <text 
                x={p.x} 
                y={p.y - 10} 
                fill={p.isPrediction ? '#f5a33a' : '#fff'} 
                fontSize="10" 
                textAnchor="middle"
              >
                €{p.rate}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
