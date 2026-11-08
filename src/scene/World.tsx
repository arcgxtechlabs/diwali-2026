/**
 * The 3D world. Composes sky, city, Garuda with the riders, Narakasura, enemies, VFX,
 * lighting, post-processing and the camera rig, and steps the simulation each frame.
 */
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef } from 'react';
import { Group, PCFSoftShadowMap } from 'three';
import { Sky } from './Sky';
import { City } from './City';
import { Lighting } from './Lighting';
import { PostFX } from './PostFX';
import { CameraRig } from './CameraRig';
import { Garuda } from '@/characters/Garuda';
import { Krishna } from '@/characters/Krishna';
import { Satyabhama } from '@/characters/Satyabhama';
import { Narakasura } from '@/characters/Narakasura';
import { Foes } from '@/characters/Foes';
import { Particles } from '@/vfx/Particles';
import { Shockwaves } from '@/vfx/Shockwaves';
import { Projectiles } from '@/vfx/Projectiles';
import { Diyas } from '@/vfx/Diyas';
import { Floats } from '@/vfx/Floats';
import { sim } from '@/game/sim';
import { stepSim } from '@/game/entities';
import { WORLD } from '@/game/world';
import { gs, useGameStore } from '@/store/gameStore';
import { easeInOut } from '@/characters/rig';

function Stepper() { useFrame((_, delta) => stepSim(delta)); return null; }

/** Garuda with Krishna and Satyabhama aboard. Positioned from sim.garuda each frame. */
export function GarudaParty() {
  const party = useRef<Group>(null!), satya = useRef<Group>(null!);
  useFrame(() => {
    const g = party.current; if (!g) return; const s = gs(); const gd = sim.garuda; g.visible = gd.visible;
    // during the prologue fly-in, Garuda sweeps in from the lower left
    const intro = s.flags.flightIntro ? Math.min(1, (sim.t - s.flags.flightIntro) / 3.2) : 1; const e = easeInOut(intro);
    g.position.set(gd.pos.x - (1 - e) * 26, gd.pos.y - (1 - e) * 9, gd.pos.z + (1 - e) * 6);
    g.rotation.set(gd.pitch, 0, gd.bank);
    if (satya.current) { const k = s.flags.satyaRise ? easeInOut(Math.min(1, (sim.t - s.flags.satyaRise) / 1.8)) : 0; satya.current.position.lerpVectors(WORLD.satyaSeat, WORLD.satyaStandOffset, k); }
  });
  return (<group ref={party}>
    <Garuda />
    <group position={WORLD.krishnaSeat.toArray()}><Krishna /></group>
    <group ref={satya} position={WORLD.satyaSeat.toArray()}><Satyabhama /></group>
  </group>);
}
export function Boss() {
  const ref = useRef<Group>(null!);
  useFrame(() => { const g = ref.current; if (!g) return; const f = gs().flags; g.visible = !!f.bossEnter && sim.boss.dissolve < 1; g.position.copy(WORLD.bossPos); g.scale.setScalar(sim.boss.scale); });
  return <group ref={ref} visible={false}><Narakasura /></group>;
}

export function World() {
  const quality = useGameStore((s) => s.quality);
  return (
    <Canvas dpr={quality === 'ultra' ? [1, 2] : quality === 'high' ? [1, 1.75] : [1, 1.25]} shadows={{ type: PCFSoftShadowMap }} gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }} camera={{ fov: 46, near: 0.1, far: 900, position: [0, 10, 40] }} style={{ position: 'fixed', inset: 0 }} eventSource={typeof document !== 'undefined' ? document.body : undefined}>
      <Suspense fallback={null}>
        <Stepper />
        <Sky />
        <Lighting quality={quality} />
        <City />
        <Diyas />
        <GarudaParty />
        <Boss />
        <Foes />
        <Projectiles />
        <Shockwaves />
        <Particles />
        <Floats />
        <CameraRig />
        <PostFX quality={quality} />
      </Suspense>
    </Canvas>
  );
}
