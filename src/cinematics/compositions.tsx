/**
 * PLACEHOLDER Remotion compositions. The cinematics builder replaces each with a fully designed
 * sequence (see the id list in game/types.ts). Every composition is a pure function of
 * useCurrentFrame() so it renders identically in the in-game <Player> and in `remotion render`.
 * Compositions are transparent overlays: never paint an opaque full-frame background unless the
 * composition is meant to cover the 3D scene (the title sequence may dim it).
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import type { CinematicId } from '@/game/types';
import type { ComponentType } from 'react';

const OUTFIT = "'Outfit', 'Segoe UI', sans-serif", CINZEL = "'Cinzel', 'Outfit', serif";
const fadeInOut = (f: number, total: number, inF = 18, outF = 18) => Math.min(interpolate(f, [0, inF], [0, 1], { extrapolateRight: 'clamp' }), interpolate(f, [total - outF, total], [1, 0], { extrapolateLeft: 'clamp' }));

export function TitleSequence({ small = 'ARCGX TECHLABS PRESENTS', big = 'The Night Before the Lights' }: { small?: string; big?: string }) {
  const f = useCurrentFrame(); const { durationInFrames: d, fps } = useVideoConfig();
  const o = fadeInOut(f, d, 24, 30); const s = spring({ frame: f - 10, fps, config: { damping: 18, stiffness: 60 } });
  const blur = interpolate(f, [8, 48], [14, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return (<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', background: `rgba(4,12,18,${0.35 * o})` }}>
    <div style={{ textAlign: 'center', opacity: o, padding: '0 6%' }}>
      <p style={{ fontFamily: OUTFIT, fontWeight: 600, letterSpacing: '.42em', paddingLeft: '.42em', color: '#A7F0FF', fontSize: 22, margin: 0 }}>{small}</p>
      <p style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: 112, lineHeight: 1, color: '#fff', margin: '18px 0 0', letterSpacing: '-.01em', transform: `scale(${0.92 + 0.08 * s})`, filter: `blur(${blur}px)`, textShadow: '0 0 60px rgba(255,193,90,.45)' }}>{big}</p>
    </div>
  </AbsoluteFill>);
}
export function ChapterCard({ small = 'CHAPTER 1', big = 'The ride of Garuda' }: { small?: string; big?: string }) {
  const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig(); const o = fadeInOut(f, d, 14, 18);
  const y = interpolate(f, [0, 30], [30, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  return (<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
    <div style={{ textAlign: 'center', opacity: o, transform: `translateY(${y}px)` }}>
      <p style={{ fontFamily: OUTFIT, fontWeight: 600, letterSpacing: '.42em', paddingLeft: '.42em', color: '#FFC15A', fontSize: 20, margin: 0 }}>{small}</p>
      <p style={{ fontFamily: CINZEL, fontWeight: 700, fontSize: 92, lineHeight: 1, color: '#fff', margin: '14px 0 0', textShadow: '0 4px 40px rgba(0,0,0,.6)' }}>{big}</p>
    </div>
  </AbsoluteFill>);
}
export function Banner({ text = '', accent = false }: { text?: string; accent?: boolean }) {
  const f = useCurrentFrame(); const { durationInFrames: d, fps } = useVideoConfig(); const o = fadeInOut(f, d, 6, 14); const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 180 } });
  return (<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
    <p style={{ fontFamily: OUTFIT, fontWeight: 700, fontSize: 84, color: accent ? '#FFC15A' : '#fff', opacity: o, transform: `scale(${0.8 + 0.2 * s})`, margin: 0, textAlign: 'center', padding: '0 5%', textShadow: '0 6px 50px rgba(0,0,0,.7)', letterSpacing: '-.02em' }}>{text}</p>
  </AbsoluteFill>);
}
export function Impact() { const f = useCurrentFrame(); const o = interpolate(f, [0, 3, 18], [0.9, 0.5, 0], { extrapolateRight: 'clamp' }); return <AbsoluteFill style={{ background: '#fff', opacity: o }} />; }
export function KrishnaFalls() { const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig(); const o = fadeInOut(f, d, 6, 30); const beat = 0.5 + 0.5 * Math.sin(f / 30 * Math.PI * 2.4); return <AbsoluteFill style={{ opacity: o, background: `radial-gradient(ellipse at center, transparent ${40 + beat * 10}%, rgba(90,10,20,.75) 100%)` }} />; }
export function Gates() { const f = useCurrentFrame(); const o = interpolate(f, [0, 4, 40], [1, 0.6, 0], { extrapolateRight: 'clamp' }); return <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 55%, #fff5d6, #ffb060 30%, transparent 70%)', opacity: o }} />; }
export function Charge() { const f = useCurrentFrame(); const k = Math.min(1, f / 60); return (<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}><div style={{ width: 240, height: 240, borderRadius: '50%', border: '6px solid rgba(255,193,90,.25)', borderTopColor: '#FFC15A', transform: `rotate(${f * 6}deg) scale(${0.8 + k * 0.3})`, boxShadow: `0 0 ${40 + k * 80}px rgba(255,193,90,${0.2 + k * 0.5})` }} /></AbsoluteFill>); }
export function Victory({ text = 'Narakasura falls' }: { text?: string }) { const f = useCurrentFrame(); const { durationInFrames: d, fps } = useVideoConfig(); const o = fadeInOut(f, d, 4, 24); const s = spring({ frame: f, fps, config: { damping: 10, stiffness: 120 } }); return (<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}><AbsoluteFill style={{ background: '#fff', opacity: interpolate(f, [0, 6, 30], [1, 0.4, 0], { extrapolateRight: 'clamp' }) }} /><p style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: 110, color: '#FFC15A', opacity: o, transform: `scale(${0.7 + 0.3 * s})`, margin: 0, textShadow: '0 0 80px rgba(255,193,90,.8)' }}>{text}</p></AbsoluteFill>); }
export function Dawn() { const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig(); const o = fadeInOut(f, d, 40, 60) * 0.5; return <AbsoluteFill style={{ opacity: o, background: 'linear-gradient(180deg, rgba(255,200,120,.0), rgba(255,160,80,.35) 70%, rgba(255,120,60,.5))' }} />; }
export function Finale({ name = 'Friend' }: { name?: string }) {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const s1 = spring({ frame: f - 6, fps, config: { damping: 14, stiffness: 70 } }), s2 = spring({ frame: f - 22, fps, config: { damping: 14, stiffness: 70 } }); const o3 = interpolate(f, [48, 70], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return (<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}><div style={{ textAlign: 'center' }}>
    <p style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: 150, lineHeight: 0.95, color: '#fff', margin: 0, opacity: s1, transform: `translateY(${(1 - s1) * 40}px)`, textShadow: '0 0 80px rgba(255,193,90,.5)' }}>Happy</p>
    <p style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: 150, lineHeight: 0.95, color: '#FFC15A', margin: 0, opacity: s2, transform: `translateY(${(1 - s2) * 40}px)`, textShadow: '0 0 80px rgba(255,193,90,.7)' }}>Diwali</p>
    <p style={{ fontFamily: OUTFIT, fontWeight: 600, fontSize: 44, color: '#A7F0FF', margin: '26px 0 0', opacity: o3 }}>{name}</p>
  </div></AbsoluteFill>);
}
export const COMPOSITIONS: Record<CinematicId, ComponentType<Record<string, unknown>>> = {
  title: TitleSequence as ComponentType<Record<string, unknown>>, chapter: ChapterCard as ComponentType<Record<string, unknown>>, banner: Banner as ComponentType<Record<string, unknown>>, impact: Impact, krishnaFalls: KrishnaFalls, gates: Gates, charge: Charge, victory: Victory as ComponentType<Record<string, unknown>>, dawn: Dawn, finale: Finale as ComponentType<Record<string, unknown>>,
};
/** Default durations (frames at 30 fps) used by the Remotion studio/render registry. */
export const DEFAULT_DURATIONS: Record<CinematicId, number> = { title: 156, chapter: 96, banner: 54, impact: 20, krishnaFalls: 102, gates: 48, charge: 90, victory: 96, dawn: 270, finale: 222 };
