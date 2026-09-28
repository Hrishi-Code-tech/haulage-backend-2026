'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Cylinder, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const PAINT_COLORS: { name: string; hex: string }[] = [
  { name: 'Midnight Navy', hex: '#0f172a' },
  { name: 'Arctic White', hex: '#e2e8f0' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Racing Red', hex: '#dc2626' },
  { name: 'Forest Green', hex: '#166534' },
  { name: 'Gunmetal', hex: '#374151' },
];

function Wheel({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.x += delta * 2;
  });
  return (
    <group position={position} ref={ref}>
      <Cylinder args={[0.45, 0.45, 0.35, 24]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.3} />
      </Cylinder>
      {/* Hub cap */}
      <Cylinder args={[0.2, 0.2, 0.36, 8]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
      </Cylinder>
    </group>
  );
}

function ConfigTruck({ paintColor }: { paintColor: string }) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={[0, -0.8, 0]}>
      {/* Cab */}
      <Box args={[2.8, 2.2, 2.2]} position={[-1.8, 1.3, 0]}>
        <meshStandardMaterial color={paintColor} roughness={0.3} metalness={0.7} />
      </Box>
      
      {/* Windshield */}
      <Box args={[0.08, 1.2, 1.8]} position={[-0.34, 1.5, 0]}>
        <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.2} transparent opacity={0.8} />
      </Box>

      {/* Trailer */}
      <Box args={[5, 2.6, 2.4]} position={[2.3, 1.5, 0]}>
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.4} />
      </Box>
      
      {/* Trailer Side Stripe */}
      <Box args={[4.8, 0.15, 2.42]} position={[2.3, 1.8, 0]}>
        <meshStandardMaterial color={paintColor} roughness={0.3} metalness={0.5} />
      </Box>

      {/* Chassis Rail */}
      <Box args={[8, 0.2, 1.6]} position={[0.5, 0.15, 0]}>
        <meshStandardMaterial color="#0f0f0f" roughness={0.8} />
      </Box>

      {/* Exhaust Pipes */}
      <Cylinder args={[0.08, 0.08, 1.5, 8]} position={[-2.8, 1.5, 1.1]}>
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.05} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 1.5, 8]} position={[-2.8, 1.5, -1.1]}>
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.05} />
      </Cylinder>

      {/* Front Bumper */}
      <Box args={[0.15, 0.5, 2.4]} position={[-3.15, 0.5, 0]}>
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
      </Box>

      {/* Headlights */}
      <Box args={[0.1, 0.3, 0.4]} position={[-3.2, 0.9, 0.8]}>
        <meshStandardMaterial color="#fef9c3" emissive="#fbbf24" emissiveIntensity={0.6} />
      </Box>
      <Box args={[0.1, 0.3, 0.4]} position={[-3.2, 0.9, -0.8]}>
        <meshStandardMaterial color="#fef9c3" emissive="#fbbf24" emissiveIntensity={0.6} />
      </Box>

      {/* Wheels - Front Axle */}
      <Wheel position={[-2.2, 0.45, 1.25]} />
      <Wheel position={[-2.2, 0.45, -1.25]} />
      
      {/* Wheels - Rear Axle 1 */}
      <Wheel position={[1.5, 0.45, 1.25]} />
      <Wheel position={[1.5, 0.45, -1.25]} />
      
      {/* Wheels - Rear Axle 2 */}
      <Wheel position={[2.8, 0.45, 1.25]} />
      <Wheel position={[2.8, 0.45, -1.25]} />

      {/* Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0a1017" roughness={1} />
      </mesh>
    </group>
  );
}

interface FleetConfiguratorProps {
  onColorChange?: (color: string) => void;
}

export function FleetConfigurator({ onColorChange }: FleetConfiguratorProps) {
  const [selectedColor, setSelectedColor] = useState(PAINT_COLORS[0].hex);

  const handleColorChange = (hex: string) => {
    setSelectedColor(hex);
    onColorChange?.(hex);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* 3D Viewport */}
      <div style={{
        flex: 1,
        background: 'rgba(10, 16, 23, 0.6)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--line)',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '350px'
      }}>
        <div style={{
          position: 'absolute', top: '12px', left: '12px', zIndex: 10,
          color: '#94a3b8', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em'
        }}>
          INTERACTIVE 3D — CLICK &amp; DRAG TO ROTATE
        </div>
        <Canvas camera={{ position: [6, 4, 8], fov: 40 }} shadows>
          <ambientLight intensity={1.2} />
          <directionalLight position={[10, 10, 5]} intensity={2} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.8} color="#6366f1" />
          <pointLight position={[0, 5, 0]} intensity={1} color="#f59e0b" />
          <ConfigTruck paintColor={selectedColor} />
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={5}
            maxDistance={15}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* Paint Selector */}
      <div style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        padding: '1.25rem'
      }}>
        <h4 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: '0.85rem' }}>Fleet Paint Configuration</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {PAINT_COLORS.map((c) => (
            <button
              key={c.hex}
              onClick={() => handleColorChange(c.hex)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                background: c.hex,
                border: selectedColor === c.hex ? '3px solid var(--amber)' : '2px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedColor === c.hex ? '0 0 12px rgba(245, 163, 58, 0.4)' : 'none',
                transform: selectedColor === c.hex ? 'scale(1.1)' : 'scale(1)'
              }}
              title={c.name}
            />
          ))}
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '10px' }}>
          Selected: <span style={{ color: '#fff', fontWeight: 600 }}>{PAINT_COLORS.find(c => c.hex === selectedColor)?.name}</span>
        </p>
      </div>
    </div>
  );
}
