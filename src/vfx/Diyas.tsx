/**
 * PLACEHOLDER diyas: a field of small lamps across the land that light up with sim.lamps at dawn.
 * The environment builder replaces this with proper clay diyas with flame sprites, instanced across rooftops and streets.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, InstancedMesh, Object3D } from 'three';
import { sim } from '@/game/sim';
import { WORLD } from '@/game/world';

const N = 600;
export function Diyas() {
  const ref = useRef<InstancedMesh>(null!); const dummy = useMemo(() => new Object3D(), []);
  const seeds = useMemo(() => Array.from({ length: N }, () => ({ x: (Math.random() - 0.5) * 220, z: -10 - Math.random() * 260, order: Math.random(), p: Math.random() * 6 })), []);
  useFrame(() => {
    const m = ref.current; if (!m) return; const on = sim.lamps;
    for (let i = 0; i < N; i++) { const s = seeds[i]; const lit = Math.min(1, Math.max(0, on * 1.4 - s.order)); const f = lit * (0.8 + 0.2 * Math.sin(sim.t * 7 + s.p)); dummy.position.set(s.x, WORLD.groundY + 0.4, s.z); dummy.scale.setScalar(0.5 * f + 0.001); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }
    m.instanceMatrix.needsUpdate = true; m.visible = on > 0;
  });
  return <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#FFC15A" emissive={new Color('#FFC15A')} emissiveIntensity={4} /></instancedMesh>;
}
