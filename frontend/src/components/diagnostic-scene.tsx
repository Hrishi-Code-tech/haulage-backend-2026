'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Cylinder, Html } from '@react-three/drei';
import * as THREE from 'three';

const Wheel = ({ position, rotation, isLeft }: { position: [number, number, number], rotation?: [number, number, number], isLeft: boolean }) => {
  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      <Cylinder args={[0.4, 0.4, 0.3, 16]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </Cylinder>
    </group>
  );
};

const DiagnosticTruck = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Cab */}
      <Box args={[2.5, 2, 2]} position={[0, 1.2, 0]}>
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </Box>
      
      {/* Engine Compartment (Glowing Red for Diagnostics) */}
      <Box args={[1.5, 1.2, 1.8]} position={[2, 0.8, 0]}>
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.8} />
      </Box>

      {/* Wheels */}
      <Wheel position={[2, 0.4, 1.1]} isLeft={true} />
      <Wheel position={[2, 0.4, -1.1]} isLeft={false} />
      <Wheel position={[-1, 0.4, 1.1]} isLeft={true} />
      <Wheel position={[-1, 0.4, -1.1]} isLeft={false} />
    </group>
  );
};

export function DiagnosticScene() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: '30%',
        right: '10%',
        zIndex: 20,
        background: 'rgba(220, 38, 38, 0.1)',
        border: '1px solid #ef4444',
        color: '#ef4444',
        padding: '6px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 8px #ef4444', animation: 'pulse 1.5s infinite' }}></div>
          ENGINE FAULT: TEMP HIGH
        </div>
      </div>
      <Canvas camera={{ position: [5, 3, 5], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#f59e0b" />
        <DiagnosticTruck />
      </Canvas>
    </div>
  );
}
