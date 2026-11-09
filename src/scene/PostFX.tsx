/**
 * HD-2D post chain per quality tier: strong bloom (the practicals glow), a tilt-shift band that
 * follows the riders' screen height so the world reads as a tabletop model, a heavy vignette, a
 * touch of contrast and saturation, ACES filmic tone mapping, SMAA. No film grain: pixel art
 * and grain fight. Chromatic aberration only flares on hits, slow motion and the final arrow.
 */
import { EffectComposer, Bloom, ChromaticAberration, Vignette, SMAA, ToneMapping, BrightnessContrast, HueSaturation, TiltShift } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode, KernelSize } from 'postprocessing';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { Vector2, Vector3 } from 'three';
import { sim } from '@/game/sim';
import { WORLD } from '@/game/world';
import { gs } from '@/store/gameStore';
import type { QualityTier } from '@/game/types';

const _p = new Vector3();
export function PostFX({ quality }: { quality: QualityTier }) {
  const ca = useRef<{ offset: Vector2 } | null>(null);
  const hue = useRef<{ saturation: number } | null>(null);
  const tilt = useRef<{ offset: number; focusArea: number; feather: number } | null>(null);
  const offset = useRef(new Vector2(0.0004, 0.0004));
  const { camera } = useThree();
  const band = useRef(0.5);
  useFrame(() => {
    const slow = sim.t < sim.slowUntil ? 1 : 0; const k = 0.0004 + sim.camera.shake * 0.004 + slow * 0.002 + sim.camera.fovKick * 0.0002;
    offset.current.set(k, k); if (ca.current) ca.current.offset = offset.current;
    if (hue.current) hue.current.saturation = 0.1 - 0.4 * slow + sim.rage * 0.08;
    if (tilt.current) {
      // the sharp band follows the subject: the riders in flight, Narakasura while he is on screen, a fixed height otherwise
      const s = gs(); let target = 0.5;
      if (sim.garuda.visible) { _p.copy(sim.garuda.pos).y += 0.8; if (s.flags.bossEnter && !s.flags.bossDeath && (s.scene === 'battle' || s.scene === 'rage')) _p.lerp(WORLD.bossPos.clone().setY(WORLD.bossPos.y + 5), 0.5); _p.project(camera); if (_p.z < 1) target = Math.min(0.8, Math.max(0.2, (_p.y + 1) / 2)); }
      else target = s.scene === 'name' || s.scene === 'title' ? 0.42 : 0.5;
      band.current += (target - band.current) * Math.min(1, sim.raw * 4);
      const half = s.scene === 'ride' || s.scene === 'battle' || s.scene === 'rage' ? 0.5 : 0.36;
      // offset is relative to the screen centre (-1..1); focusArea is the sharp band's relative size, feather its edge softness
      tilt.current.offset = (band.current - 0.5) * 2; tilt.current.focusArea = half * (1 - slow * 0.4); tilt.current.feather = 0.32;
    }
  });
  if (quality === 'low') return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.9} luminanceThreshold={0.62} luminanceSmoothing={0.3} mipmapBlur />
      <Vignette eskil={false} offset={0.2} darkness={0.9} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom intensity={quality === 'ultra' ? 1.5 : 1.25} luminanceThreshold={0.5} luminanceSmoothing={0.25} mipmapBlur radius={0.8} />
      {quality !== 'medium' && <TiltShift ref={tilt as never} offset={0} focusArea={0.5} feather={0.32} kernelSize={quality === 'ultra' ? KernelSize.MEDIUM : KernelSize.SMALL} resolutionScale={0.5} />}
      <ChromaticAberration ref={ca as never} blendFunction={BlendFunction.NORMAL} offset={offset.current} radialModulation modulationOffset={0.3} />
      <HueSaturation ref={hue as never} saturation={0.1} />
      <BrightnessContrast brightness={0.0} contrast={0.18} />
      <Vignette eskil={false} offset={0.18} darkness={1.0} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  );
}
