/**
 * Thousands of clay diyas across the land, lighting one by one with sim.lamps at dawn:
 * instanced pixel billboards (bowl + stepping flame, three flicker phases) that turn to face the camera.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { InstancedMesh, Object3D, PlaneGeometry, MeshBasicMaterial, DoubleSide, Texture } from 'three';
import { sim } from '@/game/sim';
import { WORLD } from '@/game/world';
import { diyaAtlas, DIYA_SIZE } from '@/style/set';
import { mulberry } from '@/style/px';

const N = 720, GROUPS = 3;
export function Diyas() {
  const refs = useRef<InstancedMesh[]>([]); const dummy = useMemo(() => new Object3D(), []);
  const seeds = useMemo(() => { const R = mulberry(77); return Array.from({ length: N }, (_, i) => ({ x: (R() - 0.5) * 240, z: -6 - R() * 300, order: R(), g: i % GROUPS, sc: 0.9 + R() * 0.4 })); }, []);
  const mats = useMemo(() => { const A = diyaAtlas(); return Array.from({ length: GROUPS }, () => { const t = A.tex.clone() as Texture; t.needsUpdate = true; t.repeat.set(1 / A.n, 1); return new MeshBasicMaterial({ map: t, alphaTest: 0.4, side: DoubleSide, color: '#ffffff', fog: true, toneMapped: true }); }); }, []);
  const geo = useMemo(() => { const g = new PlaneGeometry(DIYA_SIZE.w, DIYA_SIZE.h); g.translate(0, DIYA_SIZE.h / 2, 0); return g; }, []);
  const { camera } = useThree();
  useFrame(() => {
    const on = sim.lamps; if (on <= 0) { refs.current.forEach((m) => { if (m) m.visible = false; }); return; }
    const A = diyaAtlas(); const yaw = Math.atan2(camera.position.x, camera.position.z + 60);
    const counts = new Array(GROUPS).fill(0); const level = WORLD.groundY + 0.02;
    for (const s of seeds) { const lit = Math.min(1, Math.max(0, on * 1.4 - s.order)); if (lit <= 0) continue; const m = refs.current[s.g]; if (!m) continue; const i = counts[s.g]++; dummy.position.set(s.x, level, s.z); dummy.rotation.set(0, yaw, 0); const pop = 0.6 + 0.4 * Math.min(1, lit * 3); dummy.scale.setScalar(s.sc * pop); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }
    refs.current.forEach((m, g) => { if (!m) return; m.visible = counts[g] > 0; m.count = counts[g]; m.instanceMatrix.needsUpdate = true; const f = 1 + (Math.floor(sim.t * 8 + g * 1.3) % 3); (m.material as MeshBasicMaterial).map!.offset.x = f / A.n; (m.material as MeshBasicMaterial).color.setScalar(1.6 + 0.3 * Math.sin(sim.t * 7 + g)); });
  });
  return (<group>{mats.map((m, g) => <instancedMesh key={g} ref={(r: InstancedMesh) => { if (r) refs.current[g] = r; }} args={[geo, m, Math.ceil(N / GROUPS) + 2]} frustumCulled={false} renderOrder={2} />)}</group>);
}
