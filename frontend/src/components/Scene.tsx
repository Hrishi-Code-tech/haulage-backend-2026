'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Cylinder, Torus } from '@react-three/drei';
import * as THREE from 'three';

const Wheel = ({ position, rotation, isLeft }: { position: [number, number, number], rotation?: [number, number, number], isLeft: boolean }) => {
  const wheelRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (wheelRef.current) {
      wheelRef.current.rotation.z = -state.clock.elapsedTime * 5;
    }
  });

  return (
    <group position={position} rotation={rotation || [0, isLeft ? 0 : Math.PI, 0]} ref={wheelRef}>
      {/* Tire */}
      <Torus args={[0.34, 0.1, 8, 20]} material={new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.92 })} castShadow />
      {/* Rim */}
      <Cylinder args={[0.3, 0.3, 0.144, 20]} rotation={[Math.PI / 2, 0, 0]} material={new THREE.MeshStandardMaterial({ color: 0x444f55, roughness: 0.4, metalness: 0.5 })} castShadow />
      {/* Hub */}
      <Cylinder args={[0.1, 0.1, 0.168, 12]} rotation={[Math.PI / 2, 0, 0]} material={new THREE.MeshStandardMaterial({ color: 0x5c6870, roughness: 0.35, metalness: 0.65 })} castShadow />
      
      {/* Spokes */}
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <Box key={`spoke-${i}`} args={[0.05, 0.24, 0.04]} position={[Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0]} rotation={[0, 0, a]} material={new THREE.MeshStandardMaterial({ color: 0x3d4a52, roughness: 0.5, metalness: 0.4 })} castShadow />
        );
      })}

      {/* Treads */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <Box key={`tread-${i}`} args={[0.025, 0.03, 0.12]} position={[Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0]} rotation={[0, 0, a]} material={new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.92 })} castShadow />
        );
      })}
    </group>
  );
};

const Truck = () => {
  const truckRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (truckRef.current) {
      const t = state.clock.elapsedTime;
      const progress = Math.min(t / 4, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      truckRef.current.position.z = -13 + eased * 11.7 + (progress >= 1 ? Math.sin(t * 0.42) * 0.11 : 0);
      truckRef.current.position.y = -0.2 + Math.sin(t * 7) * 0.045 * progress;
    }
  });

  const orange = new THREE.MeshStandardMaterial({ color: 0xe68531, roughness: 0.52, metalness: 0.12 });
  const trailerPaint = new THREE.MeshStandardMaterial({ color: 0xcdd2c9, roughness: 0.5, metalness: 0.16 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x15212a, roughness: 0.75 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x27404d, roughness: 0.16, metalness: 0.35 });
  const logoMaterial = new THREE.MeshBasicMaterial({ color: 0x29363a });

  return (
    <group ref={truckRef} position={[1.05, -0.2, -13]} rotation={[0, Math.PI / 2, 0]} scale={0.64}>
      {/* Trailer */}
      <Box args={[4.1, 2.3, 2.1]} position={[1.25, 1.35, 0]} material={trailerPaint} castShadow />
      
      {/* Cab */}
      <Box args={[1.65, 1.8, 2.05]} position={[-1.85, 1.1, 0]} material={orange} castShadow />
      
      {/* Nose */}
      <Box args={[0.62, 0.58, 2.08]} position={[-2.84, 0.67, 0]} material={orange} castShadow />
      
      {/* Windshield */}
      <Box args={[0.05, 0.67, 1.55]} position={[-2.66, 1.38, 0]} rotation={[0, 0, -0.15]} material={glass} castShadow />
      
      {/* Bumper */}
      <Box args={[0.16, 0.23, 2.2]} position={[-3.16, 0.34, 0]} material={dark} castShadow />
      
      {/* Logo */}
      <group position={[1.2, 1.35, 1.08]}>
        <Box args={[0.1, 0.25, 0.03]} position={[-0.19, 0, 0]} material={logoMaterial} />
        <Box args={[0.1, 0.39, 0.03]} position={[0, 0.03, 0]} material={logoMaterial} />
        <Box args={[0.1, 0.53, 0.03]} position={[0.19, 0.06, 0]} material={logoMaterial} />
        <Box args={[1.38, 0.08, 0.03]} position={[0.06, -0.3, 0]} material={logoMaterial} />
      </group>

      {/* Wheels */}
      <Wheel position={[-2.15, 0.35, 1.05]} isLeft={true} />
      <Wheel position={[-2.15, 0.35, -1.05]} isLeft={false} />
      <Wheel position={[1.35, 0.35, 1.05]} isLeft={true} />
      <Wheel position={[1.35, 0.35, -1.05]} isLeft={false} />
      <Wheel position={[2.25, 0.35, 1.05]} isLeft={true} />
      <Wheel position={[2.25, 0.35, -1.05]} isLeft={false} />
    </group>
  );
};

const RoadMarks = () => {
  const marksRef = useRef<THREE.Group>(null);
  const markMaterial = new THREE.MeshBasicMaterial({ color: 0xc9a773 });

  useFrame((state) => {
    if (marksRef.current) {
      const t = state.clock.elapsedTime;
      marksRef.current.children.forEach((mark, index) => {
        mark.position.z = ((index * 2.7 + t * 3.1 + 14) % 32) - 16;
      });
    }
  });

  return (
    <group ref={marksRef}>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`mark-${i}`} material={markMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.19, -14 + i * 2.7]}>
          <planeGeometry args={[0.16, 1.6]} />
        </mesh>
      ))}
    </group>
  );
};

export default function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [6.4, 3.4, 9.5], fov: 31 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
    >
      <fog attach="fog" args={[0x172634, 10, 30]} />
      <hemisphereLight args={[0xd5e9ef, 0x17202b, 2]} />
      <directionalLight 
        color={0xffbd78} 
        intensity={4} 
        position={[-5, 8, 6]} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />

      {/* Road */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
        <planeGeometry args={[28, 34]} />
        <meshStandardMaterial color={0x202a31} roughness={0.95} />
      </mesh>

      {/* Road Edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.2, -0.2, 0]}>
        <planeGeometry args={[0.1, 34]} />
        <meshBasicMaterial color={0xe9a052} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.2, -0.2, 0]}>
        <planeGeometry args={[0.1, 34]} />
        <meshBasicMaterial color={0xe9a052} />
      </mesh>

      <RoadMarks />
      <Truck />
    </Canvas>
  );
}
