/**
 * Shared procedural animation clips for the humanoid rig (see humanoid() in rig.ts).
 * Each clip returns a Pose for a given time/parameter. Characters layer and blend them.
 * Angles in radians. Facing -Z. rotation.x > 0 swings a hanging limb forward.
 */
import { type Pose, addPose, blendPose, DEG, breath, smooth, pulse, clamp01, easeOut } from './rig';

/** Relaxed standing pose with breathing and weight shift. */
export function idle(t: number, amp = 1): Pose {
  const b = breath(t, 0.25, 1) * amp;
  return {
    pelvis: { rot: [0, 0, 0.01 * b], pos: [0, 0.005 * b, 0] },
    spine: [0.03 + 0.02 * b, 0, 0], chest: [0.02 + 0.03 * b, 0, 0], neck: [-0.05, 0, 0], head: [0.02 * b, 0.05 * Math.sin(t * 0.3), 0],
    shoulderL: [0.05, 0, -75 * DEG + 0.02 * b], elbowL: [0, 0, -0.35], wristL: [0, 0, 0],
    shoulderR: [0.05, 0, 75 * DEG - 0.02 * b], elbowR: [0, 0, 0.35], wristR: [0, 0, 0],
    hipL: [0, 0, -0.02], kneeL: [0.02, 0, 0], ankleL: [0, 0, 0], hipR: [0, 0, 0.02], kneeR: [0.02, 0, 0], ankleR: [0, 0, 0],
  };
}
/** Arms-down neutral used as a base for layering. */
export const T_POSE: Pose = { shoulderL: [0, 0, -88 * DEG], shoulderR: [0, 0, 88 * DEG] };

/**
 * Seated on Garuda, leaning forward into the wind. intensity 0 = calm hover, 1 = full speed.
 * Both riders use this; the archer layers aim() on top.
 */
export function ride(t: number, intensity = 1): Pose {
  const w = 0.5 + 0.5 * intensity, jolt = Math.sin(t * 7.1) * 0.02 * w + Math.sin(t * 3.3) * 0.015;
  return {
    pelvis: { rot: [0.1 * w, 0, 0], pos: [0, -0.02, 0] },
    spine: [0.2 * w + jolt, 0, 0], chest: [0.15 * w + jolt, 0, 0], neck: [-0.2 * w, 0, 0], head: [-0.1 * w + jolt * 0.5, 0, 0],
    shoulderL: [0.6, 0.2, -50 * DEG], elbowL: [0, 0, -1.3], wristL: [0, 0, -0.2],
    shoulderR: [0.6, -0.2, 50 * DEG], elbowR: [0, 0, 1.3], wristR: [0, 0, 0.2],
    hipL: [1.55, 0.15, -0.25], kneeL: [-2.2, 0, 0], ankleL: [0.6, 0, 0], hipR: [1.55, -0.15, 0.25], kneeR: [-2.2, 0, 0], ankleR: [0.6, 0, 0],
  };
}
/**
 * Archery aim: bow arm (left) extended toward -Z, draw arm pulls the string back.
 * draw 0..1. aimYaw/aimPitch rotate the upper body toward the target.
 */
export function aim(draw: number, aimYaw = 0, aimPitch = 0): Pose {
  const d = smooth(draw);
  return {
    spine: [0.1 + aimPitch * 0.3, aimYaw * 0.4, 0], chest: [0.05 + aimPitch * 0.4, aimYaw * 0.5, -0.1 * d], neck: [-0.1, aimYaw * 0.1, 0], head: [aimPitch * 0.2, aimYaw * 0.15, 0.08 * d],
    shoulderL: [80 * DEG + aimPitch * 0.5, 0.1, -12 * DEG], elbowL: [0, 0, -0.05 - 0.1 * (1 - d)], wristL: [0, 0, -0.1],
    shoulderR: [75 * DEG - 25 * DEG * d, -0.2, 20 * DEG + 55 * DEG * d], elbowR: [-0.2, 0.1, 1.9 - 0.3 * d], wristR: [0, 0, 0.3],
  };
}
/** Release recoil, k 0..1 over ~0.35 s. */
export function shoot(k: number): Pose {
  const p = pulse(k);
  return { chest: [-0.06 * p, 0, 0], shoulderL: [-0.1 * p, 0, 0], shoulderR: [0.3 * p, 0, 0.25 * p], elbowR: [0, 0, -0.5 * p], head: [-0.04 * p, 0, 0] };
}
/** Hit reaction: thrown back, arms flung. k 0..1 over ~0.6 s. */
export function hit(k: number): Pose {
  const p = pulse(k), e = easeOut(k);
  return { pelvis: { rot: [-0.35 * e, 0, 0], pos: [0, 0.02 * p, 0.08 * e] }, spine: [-0.4 * e, 0, 0.1 * p], chest: [-0.3 * e, 0, 0], neck: [-0.3 * p, 0, 0], head: [-0.5 * p, 0.2 * p, 0], shoulderL: [-0.9 * p, 0, -1.4 * p], shoulderR: [-0.9 * p, 0, 1.4 * p], elbowL: [0, 0, -0.6 * p], elbowR: [0, 0, 0.6 * p] };
}
/** Lying collapsed across a surface (Krishna across Garuda's back). */
export function fallen(t: number): Pose {
  const b = breath(t, 0.5, 1);
  return {
    pelvis: { rot: [-1.25, 0.35, 0.9], pos: [0.1, -0.55, 0.1] }, spine: [-0.2, 0.1, 0.1], chest: [-0.15 + 0.02 * b, 0, 0.1], neck: [0.3, -0.3, 0], head: [0.2, -0.4, 0.2],
    shoulderL: [-0.4, 0.2, -1.6], elbowL: [0, 0, -0.5], wristL: [0, 0, -0.2], shoulderR: [1.6, 0, 0.9], elbowR: [0, 0, 0.9], wristR: [0, 0, 0.4],
    hipL: [0.4, 0, -0.3], kneeL: [-0.9, 0, 0], hipR: [1.2, 0, 0.4], kneeR: [-1.5, 0, 0],
  };
}
/** From kneeling to upright heroic stance, k 0..1. */
export function rise(k: number): Pose {
  const e = smooth(k); const kneel: Pose = { pelvis: { rot: [0.4, 0, 0], pos: [0, -0.45, 0] }, spine: [0.3, 0, 0], chest: [0.2, 0, 0], head: [-0.4, 0, 0], hipL: [1.2, 0, -0.2], kneeL: [-2.0, 0, 0], ankleL: [0.8, 0, 0], hipR: [-0.3, 0, 0.2], kneeR: [-1.8, 0, 0], ankleR: [0.5, 0, 0], shoulderL: [0.6, 0, -0.6], elbowL: [0, 0, -1.2], shoulderR: [0.6, 0, 0.6], elbowR: [0, 0, 1.2] };
  const stand: Pose = { pelvis: [0.02, 0, 0], spine: [-0.05, 0, 0], chest: [-0.08, 0, 0], neck: [-0.05, 0, 0], head: [-0.05, 0, 0], hipL: [-0.05, 0, -0.1], kneeL: [0.05, 0, 0], ankleL: [0, 0, 0], hipR: [-0.05, 0, 0.1], kneeR: [0.05, 0, 0], ankleR: [0, 0, 0], shoulderL: [0.1, 0, -70 * DEG], elbowL: [0, 0, -0.5], shoulderR: [0.1, 0, 70 * DEG], elbowR: [0, 0, 0.5] };
  return blendPose(kneel, stand, e);
}
/** Standing heroic stance with the bow (base for aim during the final arrow). */
export function heroStand(t: number): Pose {
  const b = breath(t, 0.3, 1);
  return addPose(idle(t, 0.6), { pelvis: [0, 0.15, 0], spine: [0.05, 0.1, 0], chest: [0.05 * b, 0.1, -0.05], hipL: [0.15, 0.1, -0.2], hipR: [-0.1, -0.1, 0.25], kneeL: [-0.2, 0, 0], kneeR: [-0.1, 0, 0] });
}
/** Both arms raised in triumph. */
export function victory(t: number): Pose {
  const b = breath(t, 0.4, 1);
  return addPose(idle(t, 0.5), { chest: [-0.2, 0, 0], neck: [-0.2, 0, 0], head: [-0.25, 0, 0], shoulderL: [-2.6 + 0.05 * b, 0, -0.5], elbowL: [0, 0, -0.4], shoulderR: [-2.6 + 0.05 * b, 0, 0.5], elbowR: [0, 0, 0.4] });
}
/** Look at a target in the character's local frame: returns yaw/pitch for the head (radians, clamped). */
export function lookAngles(localDir: { x: number; y: number; z: number }, maxYaw = 0.9, maxPitch = 0.6) {
  const yaw = Math.atan2(-localDir.x, -localDir.z), pitch = Math.atan2(localDir.y, Math.hypot(localDir.x, localDir.z));
  return { yaw: Math.max(-maxYaw, Math.min(maxYaw, yaw)), pitch: Math.max(-maxPitch, Math.min(maxPitch, pitch)) };
}
export { addPose, blendPose, clamp01 };
