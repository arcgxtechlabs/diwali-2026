import { create } from 'zustand';
import type { Scene, Stats, Flags, Companion, CinematicRequest, QualityTier, NarrationLine } from '@/game/types';

export interface GuideTalk { who: Companion; lines: string[]; label: string; resolve: () => void; }
export interface Narration { lines: NarrationLine[]; resolve: () => void; }

export interface GameState {
  scene: Scene;
  player: string;
  score: number; combo: number; lives: number;
  bossHp: number;            // 0..100
  rage: boolean;
  stats: Stats;
  flags: Flags;
  quality: QualityTier;
  muted: boolean;
  cinematic: CinematicRequest | null;
  narration: Narration | null;
  talk: GuideTalk | null;
  hud: { level: string; stat: string } | null;
  prompt: { text: string; hot: boolean } | null;
  finalDraw: number;        // 0..1 while holding the final arrow
  drawing: boolean;
  toast: string;
  best: number;
  reduceMotion: boolean;
  set: (patch: Partial<GameState>) => void;
  flag: (name: keyof Flags, t: number) => void;
}

export const emptyStats = (): Stats => ({ kills: 0, shots: 0, hits: 0, lives: 3, time: 0, maces: 0, marks: 0, bestCombo: 1 });
export const emptyFlags = (): Flags => ({ flightIntro: 0, mount: 0, rideStart: 0, gatesBreak: 0, bossEnter: 0, battleStart: 0, krishnaDown: 0, satyaRise: 0, finalStart: 0, arrowRelease: 0, bossDeath: 0, dawn: 0, lampsOn: 0, finale: 0 });

const storage = { get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* no storage */ } } };
export const store = storage;

export const useGameStore = create<GameState>((set) => ({
  scene: 'name',
  player: storage.get('arcgx-diwali-name') || '',
  score: 0, combo: 1, lives: 3,
  bossHp: 100, rage: false,
  stats: emptyStats(),
  flags: emptyFlags(),
  quality: 'high',
  muted: false,
  cinematic: null,
  narration: null,
  talk: null,
  hud: null,
  prompt: null,
  finalDraw: 0,
  drawing: false,
  toast: '',
  best: Number(storage.get('arcgx-diwali-best') || 0),
  reduceMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  set: (patch) => set(patch),
  flag: (name, t) => set((s) => ({ flags: { ...s.flags, [name]: t } })),
}));

/** Non-reactive read for hot loops (useFrame). */
export const gs = () => useGameStore.getState();
