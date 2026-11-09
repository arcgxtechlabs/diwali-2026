/**
 * Arrows, fire maces and weak-point marks in the pixel grammar. Arrows are unlit gold shafts
 * (light sources, so bloom takes them; the final arrow is a long white comet); maces are a
 * dark spiked head wrapped in the pixel flame with a halo; marks are octagonal gold rings
 * with a timer ring that shrinks as the mark expires.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, Color, InstancedMesh, Object3D, Vector3, Quaternion, Group, Mesh, MeshStandardMaterial, DodecahedronGeometry } from 'three';
import { sim } from '@/game/sim';
import { WORLD } from '@/game/world';
import { fire, glow, flick } from '@/style/px';

const MAX = 48, MACES = 12; const _q = new Quaternion(), _d = new Vector3(), _up = new Vector3(0, 1, 0);
export function Projectiles() {
  const arrows = useRef<InstancedMesh>(null!), marks = useRef<InstancedMesh>(null!), timers = useRef<InstancedMesh>(null!); const dummy = useMemo(() => new Object3D(), []);
  const maces = useMemo(() => Array.from({ length: MACES }, (_, i) => { const g = new Group(); const core = new Mesh(new DodecahedronGeometry(0.75, 0), new MeshStandardMaterial({ color: '#1a0d12', roughness: 0.6, metalness: 0.4, emissive: new Color('#ff5a3a'), emissiveIntensity: 0.6, flatShading: true })); core.castShadow = true; g.add(core); const f = fire(1.9, { seed: i * 11, i: 3 }); f.position.y = -0.8; g.add(f); const h = glow('#ff8c3a', 2.4, 0.8); g.add(h); g.visible = false; return { g, core, f, h }; }), []);
  const { camera } = useThree();
  useFrame(() => {
    let n = 0; const A = arrows.current; const t = sim.t;
    if (A) { for (const a of sim.arrows) { if (n >= MAX) break; _d.subVectors(a.to, a.from).normalize(); _q.setFromUnitVectors(_up, _d); dummy.position.copy(a.pos); dummy.quaternion.copy(_q); dummy.scale.set(a.big ? 0.35 : 0.07, a.big ? 6 : 1.4, a.big ? 0.35 : 0.07); dummy.updateMatrix(); A.setMatrixAt(n, dummy.matrix); A.setColorAt(n, new Color(a.big ? '#ffffff' : '#ffd35a')); n++; } A.count = n; A.instanceMatrix.needsUpdate = true; if (A.instanceColor) A.instanceColor.needsUpdate = true; }
    n = 0; for (const m of sim.maces) { if (n >= MACES) break; const M = maces[n++]; M.g.visible = true; M.g.position.copy(m.pos); M.core.rotation.set(t * 6, t * 4, 0); const k = m.r / 1.2 * flick(t, m.id); M.core.scale.setScalar(k); M.f.userData.update?.(t + m.id, { x: camera.position.x, z: camera.position.z }, k); M.h.scale.setScalar(2.4 * k); } for (let i = n; i < MACES; i++) maces[i].g.visible = false;
    n = 0; const K = marks.current, T = timers.current;
    if (K && T) { for (const k of sim.marks) { if (n >= MAX) break; const s = sim.boss.scale; dummy.position.set(WORLD.bossPos.x + k.offset.x * s, WORLD.bossPos.y + k.offset.y * s, WORLD.bossPos.z + k.offset.z * s); dummy.quaternion.copy(camera.quaternion); const life = k.hit ? 1 + (t - k.hitT) * 4 : 0.85 + 0.15 * Math.sin(t * 8); dummy.scale.setScalar(k.r * s * life); dummy.updateMatrix(); K.setMatrixAt(n, dummy.matrix); K.setColorAt(n, new Color(k.hit ? '#ffffff' : '#ffd35a'));
      const left = k.hit ? 0 : Math.max(0, 1 - (t - k.born) / k.life); dummy.scale.setScalar(k.r * s * 1.35 * left); dummy.updateMatrix(); T.setMatrixAt(n, dummy.matrix); n++; } K.count = n; T.count = n; K.instanceMatrix.needsUpdate = true; T.instanceMatrix.needsUpdate = true; if (K.instanceColor) K.instanceColor.needsUpdate = true; }
  });
  return (<group>
    <instancedMesh ref={arrows} args={[undefined, undefined, MAX]} frustumCulled={false}><cylinderGeometry args={[0.5, 0.5, 1, 6]} /><meshBasicMaterial color="#fff" toneMapped={false} /></instancedMesh>
    {maces.map((m, i) => <primitive key={i} object={m.g} />)}
    <instancedMesh ref={marks} args={[undefined, undefined, MAX]} frustumCulled={false}><ringGeometry args={[0.72, 1, 8]} /><meshBasicMaterial color="#fff" transparent opacity={0.95} blending={AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} /></instancedMesh>
    <instancedMesh ref={timers} args={[undefined, undefined, MAX]} frustumCulled={false}><ringGeometry args={[0.9, 1, 8]} /><meshBasicMaterial color="#ff9d4a" transparent opacity={0.6} blending={AdditiveBlending} depthWrite={false} depthTest={false} /></instancedMesh>
  </group>);
}
