/**
 * Imperative VFX bus. Gameplay code calls these; the VFX components subscribe.
 * Positions are world-space Vector3 (copied on call, so callers may reuse vectors).
 */
import { Vector3, Color } from 'three';

export type BurstKind = 'sparks' | 'embers' | 'smoke' | 'ring' | 'peony' | 'willow' | 'debris' | 'dust' | 'holy';
export interface BurstOpts {
  kind?: BurstKind;
  count?: number;
  color?: string | number;
  color2?: string | number;   // secondary colour mixed in
  speed?: number;             // m/s
  life?: number;              // seconds
  size?: number;              // world size
  gravity?: number;           // m/s^2 (negative floats up)
  spread?: Vector3;           // directional bias
}
export interface ShockwaveOpts { color?: string | number; radius?: number; duration?: number; }
export interface TrailOpts { color?: string | number; width?: number; life?: number; }

type Listener = {
  burst?: (pos: Vector3, opts: BurstOpts) => void;
  shockwave?: (pos: Vector3, opts: ShockwaveOpts) => void;
  firework?: (pos: Vector3, opts: BurstOpts) => void;
  flash?: (pos: Vector3, color: string | number, size: number) => void;
};

const listeners = new Set<Listener>();
export const vfx = {
  subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; },
  burst(pos: Vector3, opts: BurstOpts = {}) { const p = pos.clone(); listeners.forEach((l) => l.burst?.(p, opts)); },
  shockwave(pos: Vector3, opts: ShockwaveOpts = {}) { const p = pos.clone(); listeners.forEach((l) => l.shockwave?.(p, opts)); },
  firework(pos: Vector3, opts: BurstOpts = {}) { const p = pos.clone(); listeners.forEach((l) => l.firework?.(p, opts)); },
  flash(pos: Vector3, color: string | number = '#FFC15A', size = 3) { const p = pos.clone(); listeners.forEach((l) => l.flash?.(p, color, size)); },
};

export const PALETTE = {
  navy: '#081A24', navy2: '#0C2633', cyan: '#0CC1E0', light: '#A7F0FF', coral: '#FF8071', white: '#FFFFFF', flame: '#FFC15A', ink: '#040C12', gold: '#F6C453', ember: '#FF6A2A',
};
export const FIRE_COLORS = [PALETTE.light, PALETTE.cyan, PALETTE.coral, PALETTE.flame, PALETTE.white];
export const col = (c: string | number) => new Color(c);
