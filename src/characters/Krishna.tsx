/**
 * Krishna as an HD-2D pixel sprite (src/style/cast.ts holds the pose table).
 * Contract: renders at the parent's origin, feet at y=0, facing -Z, about 1.8 m tall.
 * Game mode reads: gs().scene, gs().flags.krishnaDown / dawn, sim.krishna.{draw, shotAt}, the camera side.
 * Showcase states: idle, ride, aim (param = draw), shoot, fallen, portrait, victory.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { PixelActor } from '@/style/figure';
import { krishnaAtlas, idleFrame } from '@/style/cast';
import type { CharacterProps } from './types';
import { sim } from '@/game/sim';
import { gs } from '@/store/gameStore';

const SEATED_SCENES = new Set(['mount', 'ride', 'preboss', 'battle', 'fall', 'rage', 'final', 'victory']);
export function Krishna({ mode = 'game', state = 'idle', param = 0 }: CharacterProps) {
  const actor = useMemo(() => { const a = new PixelActor(krishnaAtlas(), { shadowR: 0.42 }); a.facing = -1; return a; }, []);
  const { camera } = useThree();
  useFrame(() => {
    const t = sim.t; let frame = idleFrame(t, ['idle0', 'idle1'], 'blink'); let seated = false, lie = 0;
    const back = actor.seesBack(camera);
    const aimFrame = (d: number) => `aim${Math.min(3, Math.floor(d * 3.99))}`;
    if (mode === 'game') {
      const s = gs();
      if (s.flags.krishnaDown && !s.flags.dawn) { frame = 'fallen'; lie = Math.min(1, (t - s.flags.krishnaDown) / 0.9); }
      else if (s.flags.dawn) { seated = true; frame = back ? idleFrame(t, ['ride0', 'ride1']) : idleFrame(t, ['rideF0', 'rideF1']); }
      else if (SEATED_SCENES.has(s.scene)) {
        seated = true; const d = sim.krishna.draw, shot = t - sim.krishna.shotAt;
        if (shot >= 0 && shot < 0.22) frame = 'shoot'; else if (d > 0.05) frame = aimFrame(d); else frame = back ? idleFrame(t, ['ride0', 'ride1']) : idleFrame(t, ['rideF0', 'rideF1']);
      }
    } else if (mode === 'showcase') {
      if (state === 'ride') { seated = true; frame = idleFrame(t, ['ride0', 'ride1']); } else if (state === 'aim') { seated = true; frame = aimFrame(param); } else if (state === 'shoot') { seated = true; frame = 'shoot'; }
      else if (state === 'fallen') { frame = 'fallen'; lie = 1; } else if (state === 'victory') frame = 'victory'; else if (state === 'portrait') frame = 'portrait';
    } else frame = idleFrame(t, ['portrait', 'portrait'], 'blink');
    actor.frame(frame); actor.face(camera);
    actor.mesh.position.set(lie * -0.25, seated ? -0.56 : lie * -0.35, 0); actor.mesh.rotation.z = -lie * 1.25; actor.shadow.visible = !seated && lie === 0 && mode !== 'portrait';
  });
  return <primitive object={actor.root} />;
}
