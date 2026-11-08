/**
 * Plays the current store.cinematic in a Remotion <Player> stretched over the 3D scene.
 * The composition is authored at 1920x1080 (or 1080x1920 in portrait) and scaled to fit.
 */
import { Player } from '@remotion/player';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { COMPOSITIONS } from './compositions';

export function CinematicOverlay() {
  const cine = useGameStore((s) => s.cinematic);
  const [portrait, setPortrait] = useState(() => typeof window !== 'undefined' && window.innerHeight > window.innerWidth);
  useEffect(() => { const on = () => setPortrait(window.innerHeight > window.innerWidth); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  if (!cine) return null;
  const Comp = COMPOSITIONS[cine.id];
  return (
    <div className="cine-layer" aria-hidden="true">
      <Player key={cine.key} component={Comp} inputProps={cine.props} durationInFrames={cine.durationInFrames} fps={30} compositionWidth={portrait ? 1080 : 1920} compositionHeight={portrait ? 1920 : 1080} autoPlay loop={!!cine.loop} controls={false} initiallyMuted acknowledgeRemotionLicense style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
