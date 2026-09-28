'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';

function SkyBackground() {
  const fragmentShader = `
    varying vec2 vUv;
    void main() {
      // gradient from navy (07111f) to dark purple (1c1236) to amber (f59e0b)
      vec3 topColor = vec3(0.027, 0.067, 0.122); // #07111F
      vec3 midColor = vec3(0.125, 0.08, 0.22);   // dark purple
      vec3 bottomColor = vec3(0.96, 0.62, 0.04); // #F59E0B
      
      float h = vUv.y;
      vec3 color = mix(bottomColor, midColor, smoothstep(0.4, 0.6, h));
      color = mix(color, topColor, smoothstep(0.6, 1.0, h));
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  
  return (
    <mesh position={[0, 0, -150]}>
      <planeGeometry args={[1000, 500]} />
      <shaderMaterial 
        vertexShader={vertexShader} 
        fragmentShader={fragmentShader} 
        depthWrite={false}
      />
    </mesh>
  );
}

function FogVolume() {
  return (
    <fog attach="fog" args={['#0c1424', 15, 80]} />
  );
}

function Truck() {
  const truckGroup = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Group[]>([]);
  const cabRef = useRef<THREE.Group>(null);
  const logoRef = useRef<THREE.Group>(null);
  
  const [logoOpacity, setLogoOpacity] = useState(0);

  // Materials
  const cabMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#101820', metalness: 0.8, roughness: 0.25 }), []);
  const trailerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#18232D', metalness: 0.4, roughness: 0.6 }), []);
  const wheelMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#050505', roughness: 0.9 }), []);
  const grillMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#000000', metalness: 0.9, roughness: 0.3 }), []);
  const windowMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#050a0f', metalness: 0.9, roughness: 0.1, transmission: 0.1 }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const introDuration = 4.0;
    
    if (truckGroup.current && cabRef.current && logoRef.current) {
      if (t < introDuration) {
        // Entry animation
        const progress = Math.min(t / introDuration, 1);
        const easeOutQuint = 1 - Math.pow(1 - progress, 5);
        
        truckGroup.current.position.z = THREE.MathUtils.lerp(-50, 0, easeOutQuint);
        
        // Suspension bounce during entry
        cabRef.current.position.y = 1.2 + Math.sin(t * 18) * 0.06 * (1 - easeOutQuint);
        
        // Fast wheel rotation based on speed
        const speed = (1 - easeOutQuint) * 0.5 + 0.05;
        wheelsRef.current.forEach(w => {
          if (w) w.rotation.x -= speed;
        });
      } else {
        // Idle ambient loop
        const idleT = t - introDuration;
        
        // Subtle suspension
        cabRef.current.position.y = 1.2 + Math.sin(idleT * 2) * 0.015;
        
        // Constant wheel motion (ambient highway rolling)
        wheelsRef.current.forEach(w => {
          if (w) w.rotation.x -= 0.03;
        });
        
        // Reveal Logo with a sweep effect simulation
        if (logoOpacity < 1) {
          setLogoOpacity(prev => Math.min(prev + 0.015, 1));
        }
      }
    }
  });

  return (
    <group ref={truckGroup}>
      {/* Cab */}
      <group ref={cabRef} position={[0, 1.2, 4]}>
        {/* Main Body */}
        <mesh position={[0, 0.5, 0]} material={cabMat}>
          <boxGeometry args={[2.4, 2, 3]} />
        </mesh>
        
        {/* Hood */}
        <mesh position={[0, -0.2, 2]} material={cabMat}>
          <boxGeometry args={[2.4, 1.4, 1.5]} />
        </mesh>
        
        {/* Grill */}
        <mesh position={[0, -0.2, 2.76]} material={grillMat}>
          <boxGeometry args={[1.8, 1.2, 0.1]} />
        </mesh>
        
        {/* Windshield */}
        <mesh position={[0, 1.2, 1.4]} rotation={[-0.2, 0, 0]} material={windowMat}>
          <boxGeometry args={[2.2, 1, 0.1]} />
        </mesh>

        {/* Side Mirrors */}
        <mesh position={[-1.3, 0.8, 1.2]} material={cabMat}>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
        </mesh>
        <mesh position={[1.3, 0.8, 1.2]} material={cabMat}>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
        </mesh>
        
        {/* Headlights (Amber glow) */}
        <mesh position={[-0.9, -0.4, 2.75]}>
          <boxGeometry args={[0.4, 0.2, 0.1]} />
          <meshBasicMaterial color="#F59E0B" />
        </mesh>
        <mesh position={[0.9, -0.4, 2.75]}>
          <boxGeometry args={[0.4, 0.2, 0.1]} />
          <meshBasicMaterial color="#F59E0B" />
        </mesh>

        {/* Headlight beams */}
        <spotLight position={[-0.9, -0.4, 2.8]} angle={0.45} penumbra={0.6} intensity={40} color="#F59E0B" target={new THREE.Object3D()} />
        <spotLight position={[0.9, -0.4, 2.8]} angle={0.45} penumbra={0.6} intensity={40} color="#F59E0B" target={new THREE.Object3D()} />
      </group>

      {/* Trailer */}
      <group position={[0, 2, -3]}>
        <mesh material={trailerMat}>
          <boxGeometry args={[2.6, 3.8, 10]} />
        </mesh>
        
        {/* Logo Reveal on side */}
        <group ref={logoRef} position={[1.31, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <Text
            position={[0, 0.3, 0]}
            fontSize={0.8}
            color="#F59E0B"
            fillOpacity={logoOpacity}
            characters="HAULAGE"
            anchorX="center"
            anchorY="middle"
          >
            HAULAGE
          </Text>
          <Text
            position={[0, -0.4, 0]}
            fontSize={0.25}
            color="#94A3B8"
            fillOpacity={logoOpacity}
            letterSpacing={0.2}
            anchorX="center"
            anchorY="middle"
          >
            LOGISTICS PLATFORM
          </Text>
          
          {/* Subtle amber light sweep across logo */}
          <mesh position={[-2 + (logoOpacity * 4), 0, 0.05]} scale={[0.1, 1.5, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial color="#F59E0B" transparent opacity={logoOpacity < 1 && logoOpacity > 0.1 ? 0.3 : 0} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      </group>

      {/* Wheels */}
      {[
        [-1.2, 0.5, 5], [1.2, 0.5, 5], // Front cab
        [-1.2, 0.5, 2.5], [1.2, 0.5, 2.5], // Rear cab 1
        [-1.2, 0.5, 1.5], [1.2, 0.5, 1.5], // Rear cab 2
        [-1.2, 0.5, -5], [1.2, 0.5, -5], // Trailer 1
        [-1.2, 0.5, -6.5], [1.2, 0.5, -6.5], // Trailer 2
        [-1.2, 0.5, -8], [1.2, 0.5, -8], // Trailer 3
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]} ref={el => { if (el) wheelsRef.current[i] = el; }}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelMat}>
            <cylinderGeometry args={[0.5, 0.5, 0.4, 32]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[pos[0] > 0 ? 0.21 : -0.21, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
            <meshStandardMaterial color="#444" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function HighwayEnvironment() {
  const roadRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    // Ambient road movement
    if (roadRef.current && roadRef.current.material) {
      const mat = roadRef.current.material as THREE.MeshStandardMaterial;
      if (mat.map) {
        mat.map.offset.y -= 0.01;
      }
    }
  });

  return (
    <group>
      {/* Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[14, 250]} />
        <meshStandardMaterial color="#0A0F14" roughness={0.8} />
      </mesh>
      
      {/* Lane Markings */}
      {Array.from({ length: 25 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -50 + i * 4]}>
          <planeGeometry args={[0.2, 2]} />
          <meshBasicMaterial color="#F59E0B" opacity={0.4} transparent />
        </mesh>
      ))}

      {/* Reflective Road Edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6.8, 0.02, 0]}>
        <planeGeometry args={[0.1, 250]} />
        <meshBasicMaterial color="#F8FAFC" opacity={0.2} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6.8, 0.02, 0]}>
        <planeGeometry args={[0.1, 250]} />
        <meshBasicMaterial color="#F8FAFC" opacity={0.2} transparent />
      </mesh>
    </group>
  );
}

function CameraRig() {
  const cameraGroup = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const introDuration = 4.0;
    
    if (cameraGroup.current) {
      if (t < introDuration) {
        // Track the truck coming in
        const progress = Math.min(t / introDuration, 1);
        const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        // Start wide, move in
        cameraGroup.current.position.set(
          THREE.MathUtils.lerp(18, 12, easeOutExpo),
          THREE.MathUtils.lerp(10, 4, easeOutExpo),
          THREE.MathUtils.lerp(25, 16, easeOutExpo)
        );
        
        cameraGroup.current.lookAt(0, 2, THREE.MathUtils.lerp(-12, 0, easeOutExpo));
      } else {
        // Gentle parallax/ambient movement
        const idleT = t - introDuration;
        const targetX = 12 + Math.sin(idleT * 0.4) * 0.4;
        const targetY = 4 + Math.cos(idleT * 0.25) * 0.2;
        
        cameraGroup.current.position.x = THREE.MathUtils.lerp(cameraGroup.current.position.x, targetX, 0.02);
        cameraGroup.current.position.y = THREE.MathUtils.lerp(cameraGroup.current.position.y, targetY, 0.02);
        cameraGroup.current.lookAt(0, 2, 0);
      }
    }
  });

  return (
    <group ref={cameraGroup}>
      <PerspectiveCamera makeDefault fov={32} />
    </group>
  );
}

export default function TruckScene() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundColor: '#07111F' }}>
      <Canvas shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}>
        <FogVolume />
        <SkyBackground />
        
        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.2} color="#18232D" />
        <directionalLight 
          position={[-15, 8, -15]} 
          intensity={2.5} 
          color="#F97316" // warm sunset/amber light
          castShadow 
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        />
        <directionalLight 
          position={[10, 5, 15]} 
          intensity={0.8} 
          color="#94A3B8"
        />

        <CameraRig />
        <Truck />
        <HighwayEnvironment />
        
        {/* Soft shadow plane under the truck */}
        <ContactShadows resolution={1024} scale={30} blur={2.5} opacity={0.6} far={10} color="#000000" position={[0, 0.05, 0]} />
      </Canvas>
    </div>
  );
}
