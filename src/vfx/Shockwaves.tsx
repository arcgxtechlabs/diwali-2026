/** PLACEHOLDER expanding rings for impacts and stomps. Subscribes to vfx.shockwave. */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, Color, DoubleSide, InstancedMesh, Object3D, Vector3 } from 'three';
import { vfx } from './bus';
import { sim } from '@/game/sim';

interface W { pos: Vector3; color: Color; radius: number; dur: number; t: number; }
export function Shockwaves() {
  const list = useMemo<W[]>(() => [], []); const ref = useRef<InstancedMesh>(null!); const dummy = useMemo(() => new Object3D(), []);
  useEffect(() => vfx.subscribe({ shockwave(pos, o) { list.push({ pos, color: new Color(o.color ?? '#FFC15A'), radius: o.radius ?? 5, dur: o.duration ?? 0.6, t: 0 }); } }), [list]);
  useFrame(({ camera }) => {
    const m = ref.current; if (!m) return; let n = 0;
    for (let i = list.length - 1; i >= 0; i--) { const w = list[i]; w.t += sim.dt; const k = w.t / w.dur; if (k >= 1) { list.splice(i, 1); continue; } if (n >= 32) continue; dummy.position.copy(w.pos); dummy.quaternion.copy(camera.quaternion); dummy.scale.setScalar(w.radius * (0.1 + 0.9 * (1 - Math.pow(1 - k, 2)))); dummy.updateMatrix(); m.setMatrixAt(n, dummy.matrix); m.setColorAt(n, w.color.clone().multiplyScalar(1 - k)); n++; }
    m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[undefined, undefined, 32]} frustumCulled={false}><ringGeometry args={[0.86, 1, 48]} /><meshBasicMaterial color="#fff" transparent opacity={0.8} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} /></instancedMesh>;
}
