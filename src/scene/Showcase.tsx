/**
 * Component showcase for building and reviewing pieces in isolation:
 *   ?showcase=krishna|satyabhama|narakasura|garuda|foes|city|sky|vfx|party&state=<state>&param=<0..1>
 * Renders the component on a turntable with studio lighting and the full post stack.
 */
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { PCFShadowMap, Vector3 } from 'three';
import { CameraRig } from './CameraRig';
import { PostFX } from './PostFX';
import { Lighting } from './Lighting';
import { Sky } from './Sky';
import { City } from './City';
import { Krishna } from '@/characters/Krishna';
import { Satyabhama } from '@/characters/Satyabhama';
import { Narakasura } from '@/characters/Narakasura';
import { Garuda } from '@/characters/Garuda';
import { Foes } from '@/characters/Foes';
import { Particles } from '@/vfx/Particles';
import { Shockwaves } from '@/vfx/Shockwaves';
import { Projectiles } from '@/vfx/Projectiles';
import { Diyas } from '@/vfx/Diyas';
import { GarudaParty } from './World';
import { sim, setShot } from '@/game/sim';
import { stepSim } from '@/game/entities';
import { vfx, PALETTE } from '@/vfx/bus';
import { gs } from '@/store/gameStore';

function Stepper() { useFrame((_, d) => stepSim(d)); return null; }
function VfxDemo() { useFrame(() => { if (Math.floor(sim.t * 2) !== Math.floor((sim.t - sim.dt) * 2)) { const p = new Vector3((Math.random() - 0.5) * 4, 1 + Math.random() * 2, (Math.random() - 0.5) * 4); vfx.burst(p, { kind: 'sparks', count: 40, color: PALETTE.flame, color2: PALETTE.white, speed: 6, life: 0.8, size: 0.2 }); vfx.shockwave(p, { color: PALETTE.coral, radius: 3 }); } if (Math.floor(sim.t / 3) !== Math.floor((sim.t - sim.dt) / 3)) vfx.firework(new Vector3(0, 8, -10), { color: PALETTE.cyan }); }); return null; }

export function Showcase({ name, state, param }: { name: string; state?: string; param?: number }) {
  useEffect(() => { setShot('showcase'); gs().set({ scene: name === 'party' ? 'ride' : 'name', quality: 'ultra' }); sim.garuda.visible = true; if (name === 'party') { sim.garuda.hover = state === 'hover'; sim.speed = 30; } if (name === 'city' || name === 'sky') { sim.speed = 20; sim.dawn = param || 0; sim.lamps = param || 0; } if (name === 'foes') { for (let i = 0; i < 8; i++) sim.foes.push({ id: i, kind: i % 3 === 0 ? 'fire' : 'asura', pos: new Vector3((i - 4) * 1.6, 1 + (i % 2), -2 - (i % 3) * 2), vel: new Vector3(), r: i % 3 === 0 ? 1.1 : 1.6, phase: i, born: 0, hp: 1, dead: false, dying: 0, seed: i / 8 }); } }, [name, state, param]);
  const big = name === 'narakasura' || name === 'city' || name === 'party' || name === 'sky';
  const fixed = big ? (name === 'narakasura' ? { pos: [8, 6, 16] as [number, number, number], look: [0, 4.5, 0] as [number, number, number], fov: 42 } : name === 'party' ? { pos: [5, 5.5, 14] as [number, number, number], look: [0, 0.6, -2] as [number, number, number], fov: 42 } : undefined) : undefined;
  return (<>
    <Canvas dpr={[1, 2]} shadows={{ type: PCFShadowMap }} gl={{ antialias: false, powerPreference: 'high-performance' }} camera={{ fov: 38, near: 0.1, far: 900, position: [0, 1.6, 4.5] }} style={{ position: 'fixed', inset: 0 }}>
      <Suspense fallback={null}>
        <Stepper />
        <Sky />
        <Lighting quality="ultra" />
        {/* HD-2D rule: a billboard lit only from behind goes black, so every showcase gets a front fill */}
        {name !== 'city' && name !== 'sky' && <pointLight position={name === 'narakasura' ? [2, 7, 11] : [0.6, 1.8, 2.6]} intensity={name === 'narakasura' ? 90 : 4} color="#c9b0d8" distance={name === 'narakasura' ? 40 : 10} decay={2} />}
        {(name === 'city' || name === 'sky' || name === 'party') && <City />}
        {(name === 'city' || name === 'sky') && <Diyas />}
        {name !== 'city' && name !== 'sky' && name !== 'party' && <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow><circleGeometry args={[name === 'narakasura' ? 14 : 4, 48]} /><meshStandardMaterial color="#0d1c26" roughness={0.9} /></mesh>}
        {name === 'krishna' && <Krishna mode="showcase" state={state || 'idle'} param={param} />}
        {name === 'satyabhama' && <Satyabhama mode="showcase" state={state || 'idle'} param={param} />}
        {name === 'narakasura' && <Narakasura mode="showcase" state={state || 'idle'} param={param} />}
        {name === 'garuda' && <Garuda mode="showcase" state={state || 'fly'} />}
        {name === 'party' && <GarudaParty />}
        {name === 'foes' && <Foes />}
        {name === 'vfx' && <VfxDemo />}
        <Projectiles /><Shockwaves /><Particles />
        <CameraRig fixed={fixed} />
        <PostFX quality="ultra" />
      </Suspense>
    </Canvas>
    <div className="showcase-label">showcase: {name}{state ? ` · ${state}` : ''}{param ? ` · ${param}` : ''}</div>
  </>);
}
