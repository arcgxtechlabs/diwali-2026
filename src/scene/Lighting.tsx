/**
 * Scene lighting that follows the story: cold moonlight at night, fire light from the
 * fortress and Narakasura during the battle (warmer in the rage phase), and a rising sun at dawn.
 */
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Color, DirectionalLight, HemisphereLight, PointLight, FogExp2 } from 'three';
import { sim } from '@/game/sim';
import { WORLD } from '@/game/world';
import { gs } from '@/store/gameStore';
import type { QualityTier } from '@/game/types';

const NIGHT_SKY = new Color('#1b3a52'), NIGHT_GROUND = new Color('#2a1208'), DAWN_SKY = new Color('#ffb070'), DAWN_GROUND = new Color('#5a3a30');
const MOON = new Color('#9fc4ff'), SUN = new Color('#ffb36b'), FIRE = new Color('#ff7a3a'), RAGE = new Color('#ff5a3a');
const FOG_NIGHT = new Color('#07151f'), FOG_BATTLE = new Color('#140c1a'), FOG_DAWN = new Color('#e8a070');
export function Lighting({ quality }: { quality: QualityTier }) {
  const hemi = useRef<HemisphereLight>(null!), key = useRef<DirectionalLight>(null!), fire = useRef<PointLight>(null!), rim = useRef<DirectionalLight>(null!), boss = useRef<PointLight>(null!), fog = useRef<FogExp2>(null!);
  useFrame(() => {
    const d = sim.dawn, t = sim.t, s = gs(); const battle = s.flags.bossEnter && !s.flags.bossDeath ? 1 : 0;
    if (hemi.current) { hemi.current.color.copy(NIGHT_SKY).lerp(DAWN_SKY, d); hemi.current.groundColor.copy(NIGHT_GROUND).lerp(DAWN_GROUND, d); hemi.current.intensity = 0.55 + d * 0.9; }
    if (key.current) { key.current.color.copy(MOON).lerp(SUN, d); key.current.intensity = 1.6 + d * 2.4; key.current.position.set(-30 + d * 70, 60 - d * 40, -40 + d * 60); }
    if (rim.current) { rim.current.color.copy(FIRE).lerp(RAGE, sim.rage); rim.current.intensity = 0.8 + battle * 1.4 + Math.sin(t * 9) * 0.15; }
    if (fire.current) { fire.current.position.copy(WORLD.bossPos).add({ x: 2, y: 8, z: 6 } as never); fire.current.intensity = (60 + Math.sin(t * 13) * 12 + Math.sin(t * 7.3) * 8) * (0.4 + battle * 0.6) * (1 - d); fire.current.color.copy(FIRE).lerp(RAGE, sim.rage); }
    if (boss.current) { boss.current.position.copy(WORLD.bossPos).add({ x: -3, y: 7.5, z: -1 } as never); boss.current.intensity = battle ? 40 + sim.boss.hurt * 160 : 0; }
    if (fog.current) { fog.current.color.copy(FOG_NIGHT).lerp(FOG_BATTLE, battle * 0.7).lerp(FOG_DAWN, d); fog.current.density = (s.scene === 'ride' ? 0.0085 : 0.0105) * (1 - d * 0.45); }
  });
  const shadows = quality !== 'low';
  return (<>
    <fogExp2 ref={fog} attach="fog" args={['#07151f', 0.01]} />
    <hemisphereLight ref={hemi} args={['#1b3a52', '#2a1208', 0.55]} />
    <directionalLight ref={key} position={[-30, 60, -40]} intensity={1.6} color="#9fc4ff" castShadow={shadows} shadow-mapSize={[quality === 'ultra' ? 2048 : 1024, quality === 'ultra' ? 2048 : 1024]} shadow-bias={-0.0004} shadow-normalBias={0.02}>
      <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30, 1, 150]} />
    </directionalLight>
    <directionalLight ref={rim} position={[10, 8, -60]} intensity={0.8} color="#ff7a3a" />
    <pointLight ref={fire} position={[2, 6, -28]} intensity={30} color="#ff7a3a" distance={90} decay={2} />
    <pointLight ref={boss} position={[-3, 5, -35]} intensity={0} color="#ff8071" distance={40} decay={2} />
  </>);
}
