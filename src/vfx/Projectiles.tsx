/**
 * PLACEHOLDER arrows, maces and weak-point marks. Renders sim.arrows / sim.maces / sim.marks.
 * The VFX builder replaces this with: glowing arrows with light trails (the final arrow is a comet of white-gold light),
 * spinning fire maces with flame and smoke, and pulsing weak-point rings with a timer ring.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, Color, InstancedMesh, Object3D, Vector3, Quaternion } from 'three';
import { sim } from '@/game/sim';
import { WORLD } from '@/game/world';

const MAX = 48; const _q = new Quaternion(), _d = new Vector3(), _up = new Vector3(0, 1, 0);
export function Projectiles() {
  const arrows = useRef<InstancedMesh>(null!), maces = useRef<InstancedMesh>(null!), marks = useRef<InstancedMesh>(null!); const dummy = useMemo(() => new Object3D(), []);
  useFrame(({ camera }) => {
    let n = 0; const A = arrows.current; if (A) { for (const a of sim.arrows) { if (n >= MAX) break; _d.subVectors(a.to, a.from).normalize(); _q.setFromUnitVectors(_up, _d); dummy.position.copy(a.pos); dummy.quaternion.copy(_q); dummy.scale.set(a.big ? 0.25 : 0.08, a.big ? 4 : 1.2, a.big ? 0.25 : 0.08); dummy.updateMatrix(); A.setMatrixAt(n, dummy.matrix); A.setColorAt(n, new Color(a.big ? '#ffffff' : '#FFC15A')); n++; } A.count = n; A.instanceMatrix.needsUpdate = true; if (A.instanceColor) A.instanceColor.needsUpdate = true; }
    n = 0; const M = maces.current; if (M) { for (const m of sim.maces) { if (n >= MAX) break; dummy.position.copy(m.pos); dummy.rotation.set(sim.t * 6, sim.t * 4, 0); dummy.scale.setScalar(m.r * 0.8); dummy.updateMatrix(); M.setMatrixAt(n, dummy.matrix); n++; } M.count = n; M.instanceMatrix.needsUpdate = true; }
    n = 0; const K = marks.current; if (K) { for (const k of sim.marks) { if (n >= MAX) break; const s = sim.boss.scale; dummy.position.set(WORLD.bossPos.x + k.offset.x * s, WORLD.bossPos.y + k.offset.y * s, WORLD.bossPos.z + k.offset.z * s); dummy.quaternion.copy(camera.quaternion); const life = k.hit ? 1 + (sim.t - k.hitT) * 4 : 0.8 + 0.2 * Math.sin(sim.t * 8); dummy.scale.setScalar(k.r * s * life); dummy.updateMatrix(); K.setMatrixAt(n, dummy.matrix); K.setColorAt(n, new Color(k.hit ? '#ffffff' : '#FFC15A')); n++; } K.count = n; K.instanceMatrix.needsUpdate = true; if (K.instanceColor) K.instanceColor.needsUpdate = true; }
  });
  return (<group>
    <instancedMesh ref={arrows} args={[undefined, undefined, MAX]} frustumCulled={false}><cylinderGeometry args={[0.5, 0.5, 1, 6]} /><meshBasicMaterial color="#fff" /></instancedMesh>
    <instancedMesh ref={maces} args={[undefined, undefined, MAX]} frustumCulled={false}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#1a0d12" emissive={new Color('#FF8071')} emissiveIntensity={2} /></instancedMesh>
    <instancedMesh ref={marks} args={[undefined, undefined, MAX]} frustumCulled={false}><ringGeometry args={[0.7, 1, 40]} /><meshBasicMaterial color="#fff" transparent opacity={0.9} blending={AdditiveBlending} depthWrite={false} depthTest={false} /></instancedMesh>
  </group>);
}
