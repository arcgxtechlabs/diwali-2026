/**
 * Post-processing stack per quality tier: bloom, chromatic aberration, film grain,
 * vignette, SMAA and ACES tone mapping. Keep it cheap on low tiers.
 */
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette, SMAA, ToneMapping, BrightnessContrast, HueSaturation } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Vector2 } from 'three';
import { sim } from '@/game/sim';
import type { QualityTier } from '@/game/types';

export function PostFX({ quality }: { quality: QualityTier }) {
  const ca = useRef<{ offset: Vector2 } | null>(null);
  const hue = useRef<{ saturation: number } | null>(null);
  const offset = useRef(new Vector2(0.0006, 0.0006));
  useFrame(() => {
    // more aberration during slow motion, hits and the final arrow
    const slow = sim.t < sim.slowUntil ? 1 : 0; const k = 0.0006 + sim.camera.shake * 0.004 + slow * 0.002 + sim.camera.fovKick * 0.0002;
    offset.current.set(k, k); if (ca.current) ca.current.offset = offset.current;
    if (hue.current) hue.current.saturation = -0.35 * slow + sim.rage * 0.08;
  });
  if (quality === 'low') return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.7} luminanceThreshold={0.6} luminanceSmoothing={0.3} mipmapBlur />
      <Vignette eskil={false} offset={0.22} darkness={0.85} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom intensity={quality === 'ultra' ? 1.35 : 1.1} luminanceThreshold={0.45} luminanceSmoothing={0.25} mipmapBlur radius={0.75} />
      <ChromaticAberration ref={ca as never} blendFunction={BlendFunction.NORMAL} offset={offset.current} radialModulation modulationOffset={0.3} />
      <HueSaturation ref={hue as never} saturation={0} />
      <BrightnessContrast brightness={0.02} contrast={0.12} />
      <Noise opacity={quality === 'ultra' ? 0.06 : 0.045} blendFunction={BlendFunction.SOFT_LIGHT} />
      <Vignette eskil={false} offset={0.2} darkness={0.9} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  );
}
