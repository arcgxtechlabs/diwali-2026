/**
 * Shared types for "The Night Before the Lights" (ArcGX TechLabs Diwali 2026).
 * Everything that crosses a module boundary is declared here so the
 * director, the 3D scene, the characters, the VFX bus and the UI agree.
 */
import type { Vector3 } from 'three';

/** Story scenes, in order. The director walks through them. */
export type Scene =
  | 'name'      // intro form, city at night behind it
  | 'title'     // Remotion title sequence over a fly-over
  | 'prologue'  // narration: Narakasura, Aditi's earrings, the captives
  | 'mount'     // Krishna and Satyabhama climb onto Garuda, take off
  | 'ride'      // Chapter 1 gameplay: asuras and fireballs
  | 'preboss'   // gates shatter, Narakasura emerges, narration
  | 'battle'    // Chapter 2 gameplay: tap Narakasura, marks, maces
  | 'fall'      // Krishna is struck down (slow motion)
  | 'rage'      // Satyabhama takes the bow, double damage
  | 'final'     // press-and-hold final arrow
  | 'victory'   // arrow flies, Narakasura falls
  | 'dawn'      // sky turns, lamps light across the land
  | 'finale'    // Happy Diwali {name}, fireworks
  | 'closing';  // score panel, card

export const GAMEPLAY_SCENES: Scene[] = ['ride', 'battle', 'rage'];
export const WORLD_SCENES: Scene[] = ['prologue', 'mount', 'ride', 'preboss', 'battle', 'fall', 'rage', 'final', 'victory', 'dawn', 'finale', 'closing'];

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';

export interface Stats { kills: number; shots: number; hits: number; lives: number; time: number; maces: number; marks: number; bestCombo: number; }

/** Timestamps (in game seconds, sim.t) at which story events happened. 0 means "not yet". */
export interface Flags {
  flightIntro: number;  // Garuda enters frame during the prologue
  mount: number;        // Krishna and Satyabhama mount Garuda
  rideStart: number;
  gatesBreak: number;   // fortress gates shatter
  bossEnter: number;    // Narakasura walks out of the smoke
  battleStart: number;
  krishnaDown: number;  // the blast strikes Krishna
  satyaRise: number;    // Satyabhama stands and takes the bow
  finalStart: number;   // press-and-hold phase begins
  arrowRelease: number; // the final arrow leaves the bow
  bossDeath: number;    // arrow hits; Narakasura dissolves
  dawn: number;         // sky starts turning
  lampsOn: number;      // diyas light across the land
  finale: number;
}

export type Companion = 'Krishna' | 'Satyabhama';

/** A Remotion cinematic requested by the director and played by <CinematicOverlay>. */
export type CinematicId =
  | 'title'        // ARCGX TECHLABS PRESENTS / The Night Before the Lights
  | 'chapter'      // CHAPTER n / subtitle
  | 'banner'       // short slam text (e.g. "Satyabhama takes the bow")
  | 'impact'       // screen-space hit: flash, radial blur streaks, vignette pulse
  | 'krishnaFalls' // desaturate + heartbeat vignette + slow-mo chroma
  | 'gates'        // gates shatter: debris streaks, dust, flash
  | 'charge'       // final arrow charging ring + light rays (driven by inputProps.draw)
  | 'victory'      // NARAKASURA FALLS slam + light burst
  | 'dawn'         // light leaks and lens flare as the sun rises
  | 'finale';      // Happy Diwali {name} typography with sparkles

export interface CinematicRequest {
  id: CinematicId;
  key: number;                  // unique per request so the same id can replay
  props: Record<string, unknown>;
  durationInFrames: number;     // at 30 fps
  loop?: boolean;
}

export interface NarrationLine { who: string; text: string; at?: () => void; }

export interface Foe {
  id: number; kind: 'asura' | 'fire';
  pos: Vector3; vel: Vector3;
  r: number;          // hit radius in world units
  phase: number; born: number; hp: number; dead: boolean; dying: number; // dying: timestamp of kill (for death anim)
  seed: number;
}
export interface Arrow {
  id: number; from: Vector3; to: Vector3; pos: Vector3; t: number; dur: number; big: boolean;
  onArrive?: () => void; shooter: Companion;
  /** Homing target: while alive, the arrow's destination tracks this foe. */
  follow?: Foe;
}
export interface Mace { id: number; pos: Vector3; from: Vector3; to: Vector3; t: number; dur: number; r: number; dead: boolean; }
export interface Mark { id: number; offset: Vector3; r: number; born: number; life: number; hit: boolean; hitT: number; }
export interface FloatText { id: number; pos: Vector3; text: string; color: string; t: number; }
