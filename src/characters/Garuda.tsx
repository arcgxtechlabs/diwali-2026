/**
 * PLACEHOLDER Garuda. The character builder replaces this with the full rig.
 * Contract: renders at the parent's origin (the parent is positioned at sim.garuda.pos and rotated by bank/pitch).
 * Body centre near y=0, riders sit at WORLD.krishnaSeat / satyaSeat (back at about y=0.45). Faces -Z. Wingspan about 9 m.
 * Game mode reads: sim.garuda.{flap, hover, bank, pitch}, gs().flags.flightIntro (fly in from the left/below).
 * Showcase states: fly, hover, glide.
 */
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Group } from 'three';
import { sim } from '@/game/sim';
import type { CharacterProps } from './types';

export function Garuda({ mode = 'game', state = 'fly' }: CharacterProps) {
  const wl = useRef<Group>(null!), wr = useRef<Group>(null!);
  useFrame(() => { const flap = mode === 'game' ? sim.garuda.flap : state === 'glide' ? 0 : 1; const a = Math.sin(sim.t * (sim.garuda.hover ? 5 : 8)) * 0.5 * (0.3 + 0.7 * flap); if (wl.current) wl.current.rotation.z = a; if (wr.current) wr.current.rotation.z = -a; });
  return (<group>
    <mesh castShadow><capsuleGeometry args={[0.55, 2.4, 6, 14]} /><meshStandardMaterial color="#1a1208" roughness={0.7} /></mesh>
    <mesh position={[0, 0.3, -1.8]} castShadow><sphereGeometry args={[0.45, 16, 12]} /><meshStandardMaterial color="#1a1208" /></mesh>
    <mesh position={[0, 0.25, -2.3]}><coneGeometry args={[0.18, 0.6, 8]} /><meshStandardMaterial color="#FFC15A" emissive="#FFC15A" emissiveIntensity={0.6} /></mesh>
    <group ref={wl} position={[0.4, 0.2, 0]}><mesh position={[2.3, 0, 0]} castShadow><boxGeometry args={[4.4, 0.08, 1.6]} /><meshStandardMaterial color="#2a1a0c" emissive="#FFC15A" emissiveIntensity={0.15} /></mesh></group>
    <group ref={wr} position={[-0.4, 0.2, 0]}><mesh position={[-2.3, 0, 0]} castShadow><boxGeometry args={[4.4, 0.08, 1.6]} /><meshStandardMaterial color="#2a1a0c" emissive="#FFC15A" emissiveIntensity={0.15} /></mesh></group>
    <mesh position={[0, 0, 1.9]} rotation-x={0.3}><boxGeometry args={[1.2, 0.06, 1.4]} /><meshStandardMaterial color="#2a1a0c" /></mesh>
  </group>);
}
