/**
 * Satyabhama as an HD-2D pixel sprite (pose table in src/style/cast.ts).
 * Contract: renders at the parent's origin, feet at y=0, facing -Z, about 1.7 m tall.
 * Game mode reads: gs().scene, gs().flags.satyaRise / dawn, sim.satya.{draw, shotAt}, gs().finalDraw, the camera side.
 * Showcase states: idle, ride, rise (param), stand, aim / draw (param), shoot, victory, portrait.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { PixelActor } from '@/style/figure';
import { satyabhamaAtlas, idleFrame } from '@/style/cast';
import type { CharacterProps } from './types';
import { sim } from '@/game/sim';
import { gs } from '@/store/gameStore';

const SEATED_SCENES = new Set(['mount', 'ride', 'preboss', 'battle', 'fall']);
export function Satyabhama({ mode = 'game', state = 'idle', param = 0 }: CharacterProps) {
  const actor = useMemo(() => { const a = new PixelActor(satyabhamaAtlas(), { shadowR: 0.4 }); a.facing = -1; return a; }, []);
  const { camera } = useThree();
  useFrame(() => {
    const t = sim.t; let frame = idleFrame(t, ['idle0', 'idle1'], 'blink'); let seated = false;
    const back = actor.seesBack(camera);
    const aimFrame = (d: number) => `aim${Math.min(3, Math.floor(d * 3.99))}`;
    if (mode === 'game') {
      const s = gs();
      if (s.flags.dawn) frame = 'victory';
      else if (s.flags.satyaRise) {
        const k = (t - s.flags.satyaRise) / 1.6;
        if (k < 0.5) frame = 'rise0'; else if (k < 1) frame = 'rise1';
        else { const d = s.scene === 'final' || s.scene === 'victory' ? s.finalDraw : sim.satya.draw, shot = t - sim.satya.shotAt; if (shot >= 0 && shot < 0.22) frame = 'shoot'; else if (d > 0.05) frame = aimFrame(d); else frame = idleFrame(t, ['stand0', 'stand1']); }
      } else if (SEATED_SCENES.has(s.scene)) { seated = true; frame = back ? idleFrame(t, ['ride0', 'ride1']) : idleFrame(t, ['rideF0', 'rideF1']); }
    } else if (mode === 'showcase') {
      if (state === 'ride') { seated = true; frame = idleFrame(t, ['ride0', 'ride1']); } else if (state === 'rise') frame = param < 0.5 ? 'rise0' : 'rise1'; else if (state === 'stand') frame = idleFrame(t, ['stand0', 'stand1']);
      else if (state === 'aim' || state === 'draw') frame = aimFrame(param); else if (state === 'shoot') frame = 'shoot'; else if (state === 'victory') frame = 'victory'; else if (state === 'portrait') frame = 'portrait';
    } else frame = idleFrame(t, ['portrait', 'portrait'], 'blink');
    actor.frame(frame); actor.face(camera);
    actor.mesh.position.y = seated ? -0.52 : 0; actor.shadow.visible = !seated && mode !== 'portrait';
  });
  return <primitive object={actor.root} />;
}
