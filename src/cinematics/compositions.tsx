/**
 * Remotion compositions in the HD-2D grammar: inscriptional Cinzel capitals with wide tracking
 * for chapter labels and titles over a gold ornament rule, Cormorant Garamond italic for chapter
 * names and taglines, gold `#d8c28e` and paper white `#f3ead6`. Every composition is a pure
 * function of useCurrentFrame() so it renders identically in the in-game <Player> and in
 * `remotion render`. They are transparent overlays unless they are meant to dim the scene.
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import type { CinematicId } from '@/game/types';
import type { ComponentType } from 'react';

const SERIF = "'Cormorant Garamond', 'Cormorant', Georgia, serif", CAPS = "'Cinzel', 'Cormorant Garamond', serif";
const GOLD = '#d8c28e', GOLD2 = '#e2c989', PAPER = '#f3ead6';
const GOLD_GRADIENT = { background: 'linear-gradient(180deg, #fff3cf, #e2c27c 55%, #a8803e)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: PAPER } as const;
const fadeInOut = (f: number, total: number, inF = 18, outF = 18) => Math.min(interpolate(f, [0, inF], [0, 1], { extrapolateRight: 'clamp' }), interpolate(f, [total - outF, total], [1, 0], { extrapolateLeft: 'clamp' }));

/** A gold rule with a diamond in the middle, growing from the centre. */
function Rule({ k = 1, width = 420 }: { k?: number; width?: number }) {
  return (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, width, margin: '0 auto', opacity: k }}>
    <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, ${GOLD})`, transform: `scaleX(${k})`, transformOrigin: 'right' }} />
    <div style={{ width: 9, height: 9, background: GOLD2, transform: `rotate(45deg) scale(${k})`, boxShadow: `0 0 12px ${GOLD2}` }} />
    <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)`, transform: `scaleX(${k})`, transformOrigin: 'left' }} />
  </div>);
}

export function TitleSequence({ small = 'ARCGX TECHLABS PRESENTS', big = 'The Night Before the Lights' }: { small?: string; big?: string }) {
  const f = useCurrentFrame(); const { durationInFrames: d, fps } = useVideoConfig();
  const o = fadeInOut(f, d, 24, 30); const s = spring({ frame: f - 10, fps, config: { damping: 18, stiffness: 60 } });
  const rule = interpolate(f, [14, 44], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp', easing: Easing.out(Easing.cubic) });
  return (<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', background: `rgba(2,3,8,${0.45 * o})` }}>
    <div style={{ textAlign: 'center', opacity: o, padding: '0 6%' }}>
      <p style={{ fontFamily: CAPS, fontWeight: 500, letterSpacing: '.42em', paddingLeft: '.42em', color: GOLD, fontSize: 24, margin: '0 0 22px' }}>{small}</p>
      <Rule k={rule} />
      <p style={{ fontFamily: CAPS, fontWeight: 700, fontSize: 104, lineHeight: 1.05, letterSpacing: '.08em', margin: '26px 0 0', transform: `scale(${0.94 + 0.06 * s})`, ...GOLD_GRADIENT, filter: 'drop-shadow(0 0 40px rgba(226,194,124,.35)) drop-shadow(0 6px 24px rgba(0,0,0,.8))' }}>{big}</p>
    </div>
  </AbsoluteFill>);
}
export function ChapterCard({ small = 'CHAPTER I', big = 'The ride of Garuda' }: { small?: string; big?: string }) {
  const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig(); const o = fadeInOut(f, d, 14, 18);
  const y = interpolate(f, [0, 30], [24, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }); const rule = interpolate(f, [6, 34], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp', easing: Easing.out(Easing.cubic) });
  const label = small.replace(/CHAPTER (\d)/, (_, n) => `CHAPTER  ${['I', 'II', 'III', 'IV'][Number(n) - 1] || n}`);
  return (<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
    <div style={{ textAlign: 'center', opacity: o, transform: `translateY(${y}px)` }}>
      <p style={{ fontFamily: CAPS, fontWeight: 500, letterSpacing: '.36em', paddingLeft: '.36em', color: GOLD, fontSize: 30, margin: '0 0 18px', textShadow: '0 2px 12px rgba(0,0,0,.8)' }}>{label}</p>
      <Rule k={rule} width={360} />
      <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 86, lineHeight: 1.1, color: PAPER, margin: '18px 0 0', textShadow: '0 4px 30px rgba(0,0,0,.8), 0 0 50px rgba(255,193,90,.25)' }}>{big}</p>
    </div>
  </AbsoluteFill>);
}
export function Banner({ text = '', accent = false }: { text?: string; accent?: boolean }) {
  const f = useCurrentFrame(); const { durationInFrames: d, fps } = useVideoConfig(); const o = fadeInOut(f, d, 6, 14); const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 160 } });
  return (<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
    <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 84, color: accent ? GOLD2 : PAPER, opacity: o, transform: `scale(${0.86 + 0.14 * s})`, margin: 0, textAlign: 'center', padding: '0 5%', textShadow: '0 6px 40px rgba(0,0,0,.85), 0 0 40px rgba(255,193,90,.2)' }}>{text}</p>
  </AbsoluteFill>);
}
export function Impact() { const f = useCurrentFrame(); const o = interpolate(f, [0, 3, 18], [0.9, 0.5, 0], { extrapolateRight: 'clamp' }); return <AbsoluteFill style={{ background: '#fff6e0', opacity: o }} />; }
export function KrishnaFalls() { const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig(); const o = fadeInOut(f, d, 6, 30); const beat = 0.5 + 0.5 * Math.sin((f / 30) * Math.PI * 2.4); return <AbsoluteFill style={{ opacity: o, background: `radial-gradient(ellipse at center, transparent ${40 + beat * 10}%, rgba(70,8,18,.78) 100%)` }} />; }
export function Gates() { const f = useCurrentFrame(); const o = interpolate(f, [0, 4, 40], [1, 0.6, 0], { extrapolateRight: 'clamp' }); return <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 55%, #fff5d6, #ffb060 30%, transparent 70%)', opacity: o }} />; }
export function Charge() { const f = useCurrentFrame(); const k = Math.min(1, f / 60); return (<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}><div style={{ width: 240, height: 240, border: `4px solid rgba(216,194,142,.25)`, borderTopColor: GOLD2, transform: `rotate(${45 + f * 4}deg) scale(${0.8 + k * 0.3})`, boxShadow: `0 0 ${40 + k * 80}px rgba(255,193,90,${0.2 + k * 0.5})` }} /></AbsoluteFill>); }
export function Victory({ text = 'Narakasura falls' }: { text?: string }) { const f = useCurrentFrame(); const { durationInFrames: d, fps } = useVideoConfig(); const o = fadeInOut(f, d, 4, 24); const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 110 } }); return (<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}><AbsoluteFill style={{ background: '#fff6e0', opacity: interpolate(f, [0, 6, 30], [1, 0.4, 0], { extrapolateRight: 'clamp' }) }} /><div style={{ textAlign: 'center', opacity: o, transform: `scale(${0.8 + 0.2 * s})` }}><Rule k={1} width={360} /><p style={{ fontFamily: CAPS, fontWeight: 700, fontSize: 96, letterSpacing: '.14em', paddingLeft: '.14em', margin: '18px 0 0', ...GOLD_GRADIENT, filter: 'drop-shadow(0 0 60px rgba(255,193,90,.6))' }}>{text}</p></div></AbsoluteFill>); }
export function Dawn() { const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig(); const o = fadeInOut(f, d, 40, 60) * 0.45; return <AbsoluteFill style={{ opacity: o, background: 'linear-gradient(180deg, rgba(255,200,120,.0), rgba(255,160,80,.35) 70%, rgba(255,120,60,.5))' }} />; }
export function Finale({ name = 'Friend' }: { name?: string }) {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const s1 = spring({ frame: f - 6, fps, config: { damping: 14, stiffness: 70 } }), s2 = spring({ frame: f - 22, fps, config: { damping: 14, stiffness: 70 } }); const o3 = interpolate(f, [48, 70], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return (<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}><div style={{ textAlign: 'center' }}>
    <p style={{ fontFamily: CAPS, fontWeight: 700, fontSize: 132, lineHeight: 1, letterSpacing: '.12em', paddingLeft: '.12em', color: PAPER, margin: 0, opacity: s1, transform: `translateY(${(1 - s1) * 40}px)`, textShadow: '0 0 80px rgba(255,193,90,.5), 0 6px 30px rgba(0,0,0,.8)' }}>Happy</p>
    <p style={{ fontFamily: CAPS, fontWeight: 700, fontSize: 132, lineHeight: 1, letterSpacing: '.12em', paddingLeft: '.12em', margin: 0, opacity: s2, transform: `translateY(${(1 - s2) * 40}px)`, ...GOLD_GRADIENT, filter: 'drop-shadow(0 0 60px rgba(255,193,90,.6)) drop-shadow(0 6px 30px rgba(0,0,0,.8))' }}>Diwali</p>
    <div style={{ opacity: o3, marginTop: 28 }}><Rule k={1} width={320} /><p style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 52, color: PAPER, margin: '16px 0 0', textShadow: '0 4px 24px rgba(0,0,0,.8)' }}>{name}</p></div>
  </div></AbsoluteFill>);
}
export const COMPOSITIONS: Record<CinematicId, ComponentType<Record<string, unknown>>> = {
  title: TitleSequence as ComponentType<Record<string, unknown>>, chapter: ChapterCard as ComponentType<Record<string, unknown>>, banner: Banner as ComponentType<Record<string, unknown>>, impact: Impact, krishnaFalls: KrishnaFalls, gates: Gates, charge: Charge, victory: Victory as ComponentType<Record<string, unknown>>, dawn: Dawn, finale: Finale as ComponentType<Record<string, unknown>>,
};
/** Default durations (frames at 30 fps) used by the Remotion studio/render registry. */
export const DEFAULT_DURATIONS: Record<CinematicId, number> = { title: 156, chapter: 96, banner: 54, impact: 20, krishnaFalls: 102, gates: 48, charge: 90, victory: 96, dawn: 270, finale: 222 };
