/**
 * Pragjyotisha as an HD-2D diorama: instanced pixel-textured buildings scrolling past under
 * Garuda during the ride (lit windows, a few burning), a battlement wall with the gate and the
 * demon palace behind it for the battle, braziers with real point lights, and a street floor.
 * The whole set sits 26 m below Garuda in flight and rises to ground level when he hovers.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Group, Mesh, PointLight, BoxGeometry, CylinderGeometry, Object3D } from 'three';
import { sim } from '@/game/sim';
import { WORLD } from '@/game/world';
import { gs } from '@/store/gameStore';
import { setMats, boxClass, building, type BuildingSpec } from '@/style/set';
import { pxMesh, fire, glow, flick, mulberry } from '@/style/px';

const SPAN = 420;
const CLASSES: BuildingSpec[] = [
  { w: 6, d: 6, h: 8, wall: 'wallLit' }, { w: 8, d: 7, h: 12, wall: 'wallLit2' }, { w: 5, d: 5, h: 6, wall: 'wallDark' }, { w: 10, d: 8, h: 18, wall: 'wallLit' },
  { w: 7, d: 9, h: 10, wall: 'wallFire' }, { w: 12, d: 10, h: 26, wall: 'wallLit2' }, { w: 6, d: 8, h: 14, wall: 'wallDark' },
];
const PER_CLASS = 34;
interface Seed { x: number; z: number; ry: number; cls: number; fire: boolean }
const wrapZ = (z: number) => ((z + sim.scroll) % SPAN + SPAN) % SPAN - SPAN + 70;

function Fortress() {
  const g = useMemo(() => {
    const MM = setMats(), root = new Group(); const zWall = -42, H = 13;
    const put = (geo: BoxGeometry | CylinderGeometry, m = MM.fort, z = zWall) => { const me = pxMesh(geo, m); me.position.z = z; root.add(me); return me; };
    for (const side of [-1, 1]) {
      const w = 46; const geo = new BoxGeometry(w, H, 4); geo.translate(side * (5.5 + w / 2), H / 2, 0); put(geo);
      for (let i = 0; i < 11; i++) { const mer = new BoxGeometry(2.2, 1.6, 2); mer.translate(side * (7 + i * 4.2), H + 0.8, 0); put(mer); }
      const tw = new CylinderGeometry(3.6, 4, H + 9, 12); tw.translate(side * 8.5, (H + 9) / 2, 0); put(tw);
      const cap = new CylinderGeometry(4.4, 4.4, 1.2, 12); cap.translate(side * 8.5, H + 9.6, 0); put(cap, MM.gold);
    }
    const lintel = new BoxGeometry(14, 5, 5); lintel.translate(0, H - 0.5, 0); put(lintel);
    const palace: [BuildingSpec, number, number][] = [[{ w: 22, d: 16, h: 30, wall: 'wallFire', dome: true }, 0, -72], [{ w: 12, d: 12, h: 40, wall: 'wallDark', dome: true }, -22, -66], [{ w: 12, d: 12, h: 36, wall: 'wallLit2', dome: true }, 23, -68], [{ w: 14, d: 10, h: 16, wall: 'wallLit' }, -34, -52], [{ w: 14, d: 10, h: 18, wall: 'wallFire' }, 36, -54], [{ w: 9, d: 9, h: 22, wall: 'wallDark', dome: true }, -8, -58], [{ w: 9, d: 9, h: 20, wall: 'wallDark', dome: true }, 10, -60]];
    for (const [spec, x, z] of palace) { const b = building(spec); b.position.set(x, 0, z); root.add(b); }
    // gate doors (fall when the gates break)
    const doors: Mesh[] = [];
    for (const side of [-1, 1]) { const dg = new BoxGeometry(5.2, 10, 0.6); dg.translate(0, 5, 0); const d = pxMesh(dg, MM.wallDark); d.position.set(side * 2.7, 0, -41); root.add(d); doors.push(d); }
    return { root, doors };
  }, []);
  useFrame(() => { const f = gs().flags.gatesBreak; const k = f ? Math.min(1, (sim.t - f) / 1.2) : 0; const e = k * k; g.doors.forEach((d, i) => { const s = i === 0 ? -1 : 1; d.visible = k < 1; d.rotation.x = -e * 1.5; d.rotation.z = s * e * 0.4; d.position.y = -e * 6; }); });
  return <primitive object={g.root} />;
}

/** Braziers with pixel fire and real point lights (the two nearest cast shadows). */
const SPOTS: [number, number, number][] = [[-7, -31, 1], [7, -31, 1], [-15, -38, 0], [15, -38, 0], [-26, -36, 0], [26, -36, 0]];
function Braziers() {
  const fires = useMemo(() => SPOTS.map((_, i) => fire(2.2, { seed: i * 3, i: 3.2 })), []);
  const glows = useMemo(() => SPOTS.map(() => glow('#ff9d4a', 3.5, 0.9)), []);
  const lights = useRef<PointLight[]>([]);
  const { camera } = useThree();
  useFrame(() => {
    const s = gs(); const battle = s.flags.bossEnter ? Math.min(1, (sim.t - s.flags.bossEnter) / 1.5) : 0.35; const d = sim.dawn;
    SPOTS.forEach((_, i) => { const fl = flick(sim.t, i * 1.7) * (0.45 + battle * 0.55) * (1 - d * 0.6); fires[i].userData.update?.(sim.t, { x: camera.position.x, z: camera.position.z }, 1.6 * fl); const L = lights.current[i]; if (L) L.intensity = (i < 2 ? 60 : 26) * fl; glows[i].scale.setScalar(3.5 * fl); });
  });
  const MM = setMats();
  return (<group>
    {SPOTS.map(([x, z, sh], i) => (<group key={i} position={[x, 0, z]}>
      <primitive object={bowlFor(MM, i)} />
      <primitive object={fires[i]} position={[0, 1.15, 0]} />
      <pointLight ref={(l: PointLight) => { if (l) lights.current[i] = l; }} position={[0, 2.2, 1.2]} color="#ff9d4a" intensity={30} distance={38} decay={2} castShadow={sh === 1} shadow-mapSize={[512, 512]} shadow-bias={-0.004} />
      <primitive object={glows[i]} position={[0, 2, 0.4]} />
    </group>))}
  </group>);
}
const bowls = new Map<number, Mesh>();
function bowlFor(MM: ReturnType<typeof setMats>, i: number) { let b = bowls.get(i); if (!b) { const g = new CylinderGeometry(0.9, 0.5, 1.2, 8); g.translate(0, 0.6, 0); b = pxMesh(g, MM.fort); bowls.set(i, b); } return b; }

export function City() {
  const seeds = useMemo<Seed[]>(() => { const R = mulberry(21); return Array.from({ length: CLASSES.length * PER_CLASS }, (_, i) => { const side = R() < 0.5 ? -1 : 1; const cls = i % CLASSES.length; return { x: side * (16 + R() * 90), z: -R() * SPAN, ry: Math.floor(R() * 4) * Math.PI / 2, cls, fire: CLASSES[cls].wall === 'wallFire' && R() < 0.6 }; }); }, []);
  const classes = useMemo(() => CLASSES.map((c) => boxClass(c, PER_CLASS)), []);
  const dummy = useMemo(() => new Object3D(), []);
  const root = useRef<Group>(null!);
  const level = useRef(WORLD.groundY - WORLD.rideAltitude);
  const burning = useMemo(() => seeds.filter((s) => s.fire).slice(0, 10), [seeds]);
  const roofFires = useMemo(() => burning.map((_, i) => fire(2.4, { seed: i * 5, i: 2.8 })), [burning]);
  const floor = useMemo(() => { const geo = new BoxGeometry(700, 0.4, 700); geo.translate(0, -0.2, -120); return pxMesh(geo, setMats().street, { cast: false }); }, []);
  const { camera } = useThree();
  useFrame(() => {
    const g = root.current; if (!g) return;
    const want = WORLD.groundY - (sim.garuda.hover ? 0 : WORLD.rideAltitude); level.current += (want - level.current) * Math.min(1, sim.raw * 1.6); g.position.y = level.current;
    const counts = new Array(CLASSES.length).fill(0);
    for (const s of seeds) { const cls = classes[s.cls]; const i = counts[s.cls]++; dummy.position.set(s.x, 0, wrapZ(s.z)); dummy.rotation.set(0, s.ry, 0); dummy.updateMatrix(); cls.walls.setMatrixAt(i, dummy.matrix); cls.roofs.setMatrixAt(i, dummy.matrix); }
    for (const c of classes) { c.walls.instanceMatrix.needsUpdate = true; c.roofs.instanceMatrix.needsUpdate = true; }
    burning.forEach((s, i) => { const m = roofFires[i]; m.position.set(s.x, CLASSES[s.cls].h + 0.2, wrapZ(s.z)); m.userData.update?.(sim.t, { x: camera.position.x, z: camera.position.z }, (2.4 + Math.sin(i) * 0.6) * flick(sim.t, i) * (1 - sim.dawn * 0.7)); });
  });
  return (<group ref={root} position={[0, WORLD.groundY - WORLD.rideAltitude, 0]}>
    {classes.map((c, i) => (<group key={i}><primitive object={c.walls} /><primitive object={c.roofs} /></group>))}
    {roofFires.map((m, i) => <primitive key={i} object={m} />)}
    <Fortress />
    <Braziers />
    <primitive object={floor} />
  </group>);
}
