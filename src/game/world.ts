/** World layout constants shared by the director, the scene and the characters. 1 unit = 1 metre. */
import { Vector3 } from 'three';

export const WORLD = {
  /** Garuda's resting position during the ride (the world scrolls past). */
  garudaRide: new Vector3(0, 0, 0),
  /** Garuda hovers here during the battle, facing -Z toward Narakasura. */
  garudaBattle: new Vector3(0, 1.6, -1),
  /** Narakasura's feet during the battle. He is BOSS_HEIGHT tall. */
  bossPos: new Vector3(0, -2.2, -34),
  BOSS_HEIGHT: 9.5,
  /** Where Satyabhama stands on Garuda's back once Krishna has fallen (relative to Garuda). */
  satyaStandOffset: new Vector3(-0.15, 0.55, 0.2),
  /** Where the riders sit on Garuda (relative to Garuda's origin). */
  krishnaSeat: new Vector3(0.05, 0.45, -0.25),
  satyaSeat: new Vector3(-0.05, 0.5, 0.75),
  /** Enemy spawn distance ahead of Garuda. */
  spawnZ: -95,
  /** Ground plane height for the city during the battle. */
  groundY: -2.2,
  /** The fly-through altitude: the city roofs sit about this far below Garuda during the ride. */
  rideAltitude: 26,
};

/** Hit volumes on Narakasura, relative to his feet position, unscaled (metres for a 9.5 m demon). */
export const BOSS_HITBOXES: { name: string; offset: [number, number, number]; r: number; weak?: boolean }[] = [
  { name: 'head', offset: [0, 8.4, 0], r: 1.2, weak: true },
  { name: 'chest', offset: [0, 6.2, 0.2], r: 1.9, weak: true },
  { name: 'belly', offset: [0, 4.4, 0.3], r: 1.7 },
  { name: 'shoulderL', offset: [2.1, 6.9, 0], r: 1.0, weak: true },
  { name: 'shoulderR', offset: [-2.1, 6.9, 0], r: 1.0, weak: true },
  { name: 'armL', offset: [3.1, 5.2, 0.4], r: 0.9 },
  { name: 'armR', offset: [-3.2, 5.0, 0.4], r: 0.9 },
  { name: 'legL', offset: [1.0, 2.0, 0], r: 1.1 },
  { name: 'legR', offset: [-1.0, 2.0, 0], r: 1.1 },
];
/** Where the glowing weak-point marks may appear (offsets from the boss feet). */
export const MARK_SPOTS: [number, number, number][] = [[0, 8.4, -1.1], [0, 6.4, -1.6], [0.6, 4.6, -1.5], [2.2, 7.0, -0.9], [-2.2, 7.0, -0.9], [-0.9, 5.4, -1.6], [1.1, 5.6, -1.5]];
/** Narakasura's right hand, where maces and fire come from (offset from feet). */
export const BOSS_HAND: [number, number, number] = [-3.6, 7.6, -0.6];
