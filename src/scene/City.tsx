/**
 * PLACEHOLDER Pragjyotisha: instanced boxes scrolling past with sim.scroll, lit windows,
 * and a flat ground. To be replaced by the environment builder (fortress walls, gate,
 * towers, torches, smoke, river, diyas that light at dawn).
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { InstancedMesh, Object3D, Color } from 'three';
import { sim } from '@/game/sim';
import { WORLD } from '@/game/world';

const N = 220, SPAN = 400;
export function City() {
  const ref = useRef<InstancedMesh>(null!);
  const dummy = useMemo(() => new Object3D(), []);
  const seeds = useMemo(() => Array.from({ length: N }, (_, i) => { const side = Math.random() < 0.5 ? -1 : 1; return { x: side * (22 + Math.random() * 70), z: -(i / N) * SPAN, h: 4 + Math.random() * 30, w: 3 + Math.random() * 8 }; }), []);
  useFrame(() => {
    const m = ref.current; if (!m) return;
    for (let i = 0; i < N; i++) { const s = seeds[i]; let z = ((s.z + sim.scroll) % SPAN + SPAN) % SPAN; z = z - SPAN + 60; dummy.position.set(s.x, WORLD.groundY - WORLD.rideAltitude * (sim.garuda.hover ? 0 : 1) + s.h / 2, z); dummy.scale.set(s.w, s.h, s.w); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }
    m.instanceMatrix.needsUpdate = true;
  });
  return (<group>
    <instancedMesh ref={ref} args={[undefined, undefined, N]} castShadow receiveShadow><boxGeometry /><meshStandardMaterial color="#0d1c26" roughness={0.9} emissive={new Color('#FF8071')} emissiveIntensity={0.08} /></instancedMesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, WORLD.groundY - 0.01, -100]} receiveShadow><planeGeometry args={[600, 600]} /><meshStandardMaterial color="#06111a" roughness={1} /></mesh>
  </group>);
}
