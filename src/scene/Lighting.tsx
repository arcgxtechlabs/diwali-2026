/**
 * The HD-2D light rig: one dim cold moon that casts shadows, a hemisphere fill, warm practicals
 * (Narakasura's fire and the gate), a cool front fill two metres before the riders so their
 * billboards are never lit only from behind, and the three life lamps on Garuda's back as one
 * small warm light. Fog colour belongs to the set: night, the gate, rage, dawn.
 */
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Color, DirectionalLight, HemisphereLight, PointLight, FogExp2 } from 'three';
import { sim } from '@/game/sim';
import { WORLD } from '@/game/world';
import { gs } from '@/store/gameStore';
import type { QualityTier } from '@/game/types';

const HEMI_SKY = new Color('#3a4c7a'), HEMI_GROUND = new Color('#0a0a12'), DAWN_SKY = new Color('#ffb070'), DAWN_GROUND = new Color('#5a3a30');
const MOON = new Color('#8fa8e0'), SUN = new Color('#ffb36b'), FIRE = new Color('#ff9d4a'), RAGE = new Color('#ff5a3a'), FILL = new Color('#9fb2e8');
const FOG_NIGHT = new Color('#16223a'), FOG_GATE = new Color('#1c1a2e'), FOG_RAGE = new Color('#2a1420'), FOG_DAWN = new Color('#e8a070');
export function Lighting({ quality }: { quality: QualityTier }) {
  const bossFill = useRef<PointLight>(null!); const hemi = useRef<HemisphereLight>(null!), key = useRef<DirectionalLight>(null!), fire = useRef<PointLight>(null!), rim = useRef<DirectionalLight>(null!), boss = useRef<PointLight>(null!), fill = useRef<PointLight>(null!), lamps = useRef<PointLight>(null!), fog = useRef<FogExp2>(null!);
  useFrame(() => {
    const d = sim.dawn, t = sim.t, s = gs(); const battle = s.flags.bossEnter && !s.flags.bossDeath ? 1 : 0; const dark = s.flags.krishnaDown && !s.flags.satyaRise ? 1 : 0; // the one beat that may go dark
    const lift = 1 - dark * 0.45;
    if (hemi.current) { hemi.current.color.copy(HEMI_SKY).lerp(DAWN_SKY, d); hemi.current.groundColor.copy(HEMI_GROUND).lerp(DAWN_GROUND, d); hemi.current.intensity = (1.1 + d * 1.2) * lift; }
    if (key.current) { key.current.color.copy(MOON).lerp(SUN, d); key.current.intensity = (1.3 + d * 2.6) * lift; key.current.position.set(-30 + d * 70, 60 - d * 35, -40 + d * 60); }
    if (rim.current) { rim.current.color.copy(FIRE).lerp(RAGE, sim.rage); rim.current.intensity = (0.5 + battle * 1.0 + Math.sin(t * 9) * 0.12) * (1 - d); }
    if (fire.current) { fire.current.position.copy(WORLD.bossPos).add({ x: 2, y: 8, z: 7 } as never); fire.current.intensity = (50 + Math.sin(t * 13) * 10 + Math.sin(t * 7.3) * 8) * (0.3 + battle * 0.7) * (1 - d); fire.current.color.copy(FIRE).lerp(RAGE, sim.rage); }
    if (boss.current) { boss.current.position.copy(WORLD.bossPos).add({ x: -3, y: 7.5, z: 3 } as never); boss.current.intensity = battle ? 30 + sim.boss.hurt * 160 : 0; }
    if (fill.current) { const g = sim.garuda; fill.current.position.set(g.pos.x + 0.4, g.pos.y + 1.8, g.pos.z + 2.6); fill.current.intensity = (g.visible ? 2.2 : 0) * (1 - d * 0.5); fill.current.color.copy(FILL).lerp(DAWN_SKY, d); }
    if (lamps.current) { const g = sim.garuda; lamps.current.position.set(g.pos.x, g.pos.y + 0.9, g.pos.z + 1.2); lamps.current.intensity = (g.visible ? 1.2 * Math.max(0, s.lives) : 0) * (1 + 0.1 * Math.sin(t * 11)); }
    if (bossFill.current) { bossFill.current.position.copy(WORLD.bossPos).add({ x: 0, y: 7, z: 9 } as never); bossFill.current.intensity = (battle || s.scene === 'name' ? 1 : 0) * 55 * (1 - d) * (s.scene === 'name' ? 0.6 : 1); }
    if (fog.current) { fog.current.color.copy(FOG_NIGHT).lerp(FOG_GATE, battle * 0.8).lerp(FOG_RAGE, sim.rage * 0.7).lerp(FOG_DAWN, d); fog.current.density = (s.scene === 'ride' ? 0.0075 : 0.0095) * (1 - d * 0.45); }
  });
  const shadows = quality !== 'low';
  return (<>
    <fogExp2 ref={fog} attach="fog" args={['#16223a', 0.009]} />
    <hemisphereLight ref={hemi} args={['#3a4c7a', '#0a0a12', 1.1]} />
    <directionalLight ref={key} position={[-30, 60, -40]} intensity={1.3} color="#8fa8e0" castShadow={shadows} shadow-mapSize={[quality === 'ultra' ? 2048 : 1024, quality === 'ultra' ? 2048 : 1024]} shadow-bias={-0.0004} shadow-normalBias={0.03}>
      <orthographicCamera attach="shadow-camera" args={[-40, 40, 40, -40, 1, 160]} />
    </directionalLight>
    <directionalLight ref={rim} position={[10, 8, -60]} intensity={0.5} color="#ff9d4a" />
    <pointLight ref={fire} position={[2, 6, -28]} intensity={30} color="#ff9d4a" distance={90} decay={2} />
    <pointLight ref={boss} position={[-3, 5, -31]} intensity={0} color="#ff8071" distance={40} decay={2} />
    <pointLight ref={fill} position={[0, 2, 3]} intensity={2} color="#9fb2e8" distance={9} decay={2} />
    <pointLight ref={bossFill} position={[0, 5, -25]} intensity={0} color="#c9a8d8" distance={30} decay={2} />
    <pointLight ref={lamps} position={[0, 1, 1]} intensity={2} color="#ffc15a" distance={7} decay={2} />
  </>);
}
