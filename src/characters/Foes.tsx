/**
 * PLACEHOLDER enemies: renders sim.foes (asuras on fire-wings and fireballs) each frame.
 * The enemy builder replaces this with animated flying asuras (wings, mace, glowing eyes,
 * death burst) and roaring fireballs with trailing fire. Must handle up to ~24 foes, dead ones for 0.8 s (f.dying timestamp).
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { InstancedMesh, Object3D, Color } from 'three';
import { sim } from '@/game/sim';

const MAX = 40;
export function Foes() {
  const asuras = useRef<InstancedMesh>(null!), fires = useRef<InstancedMesh>(null!);
  const dummy = useMemo(() => new Object3D(), []);
  useFrame(() => {
    let a = 0, f = 0;
    for (const foe of sim.foes) {
      const m = foe.kind === 'fire' ? fires.current : asuras.current; if (!m) continue; const i = foe.kind === 'fire' ? f++ : a++;
      const sc = foe.dead ? Math.max(0, 1 - (sim.t - foe.dying) / 0.3) : 1;
      dummy.position.copy(foe.pos); dummy.scale.setScalar(foe.r * sc); dummy.rotation.set(0, sim.t * 4 + foe.phase, 0); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
    }
    if (asuras.current) { asuras.current.count = a; asuras.current.instanceMatrix.needsUpdate = true; } if (fires.current) { fires.current.count = f; fires.current.instanceMatrix.needsUpdate = true; }
  });
  return (<group>
    <instancedMesh ref={asuras} args={[undefined, undefined, MAX]} frustumCulled={false}><octahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#1a0d12" emissive={new Color('#FF8071')} emissiveIntensity={0.8} /></instancedMesh>
    <instancedMesh ref={fires} args={[undefined, undefined, MAX]} frustumCulled={false}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#FFC15A" emissive={new Color('#FF6A2A')} emissiveIntensity={3} /></instancedMesh>
  </group>);
}
