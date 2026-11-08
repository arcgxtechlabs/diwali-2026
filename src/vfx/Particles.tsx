/**
 * PLACEHOLDER particle system: a CPU-simulated pool of additive sprites subscribed to the VFX bus.
 * The VFX builder replaces this with a GPU/instanced system with per-kind looks
 * (sparks, embers, smoke, debris, dust, fireworks with peony/ring/willow shapes and trails, holy light).
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Points, ShaderMaterial, Vector3 } from 'three';
import { vfx, type BurstOpts } from './bus';
import { sim } from '@/game/sim';

const MAX = 6000;
interface P { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; size: number; r: number; g: number; b: number; drag: number; grav: number; }
export function Particles() {
  const pool = useMemo<P[]>(() => [], []);
  const geo = useMemo(() => { const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(new Float32Array(MAX * 3), 3)); g.setAttribute('color', new Float32BufferAttribute(new Float32Array(MAX * 3), 3)); g.setAttribute('aSize', new Float32BufferAttribute(new Float32Array(MAX), 1)); g.setAttribute('aAlpha', new Float32BufferAttribute(new Float32Array(MAX), 1)); return g; }, []);
  const mat = useMemo(() => new ShaderMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending, vertexColors: true,
    uniforms: { uScale: { value: 400 } },
    vertexShader: 'attribute float aSize, aAlpha; varying vec3 vC; varying float vA; uniform float uScale; void main(){ vC = color; vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying vec3 vC; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; float a = smoothstep(1.0, 0.0, r); a *= a; gl_FragColor = vec4(vC * (1.0 + (1.0 - r) * 1.5), a * vA); }' }), []);
  const ref = useRef<Points>(null!);
  useEffect(() => vfx.subscribe({
    burst(pos, o) { spawn(pool, pos, o); },
    firework(pos, o) { spawn(pool, pos, { ...o, kind: o.kind || 'peony', count: o.count || 140, life: 2.2, size: 0.35, gravity: 3 }); },
    flash(pos, color, size) { const c = new Color(color); pool.push({ x: pos.x, y: pos.y, z: pos.z, vx: 0, vy: 0, vz: 0, life: 0, max: 0.35, size: size * 2, r: c.r, g: c.g, b: c.b, drag: 1, grav: 0 }); },
  }), [pool]);
  useFrame(({ size: vp }) => {
    const dt = sim.dt; const pos = geo.getAttribute('position'), col = geo.getAttribute('color'), sz = geo.getAttribute('aSize'), al = geo.getAttribute('aAlpha');
    let n = 0; mat.uniforms.uScale.value = vp.height * 0.9;
    for (let i = pool.length - 1; i >= 0; i--) {
      const p = pool[i]; p.life += dt; if (p.life > p.max) { pool[i] = pool[pool.length - 1]; pool.pop(); continue; }
      const d = Math.pow(p.drag, dt * 60); p.vx *= d; p.vz *= d; p.vy = p.vy * d - p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (n < MAX) { const k = p.life / p.max; pos.setXYZ(n, p.x, p.y, p.z); col.setXYZ(n, p.r, p.g, p.b); sz.setX(n, p.size * (1 - k * 0.5)); al.setX(n, (1 - k * k) * (k > 0.6 ? 0.6 + 0.4 * Math.sin(p.life * 28) : 1)); n++; }
    }
    pos.needsUpdate = col.needsUpdate = sz.needsUpdate = al.needsUpdate = true; geo.setDrawRange(0, n);
  });
  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} />;
}
function spawn(pool: P[], pos: Vector3, o: BurstOpts) {
  const n = o.count ?? 30, c1 = new Color(o.color ?? '#FFC15A'), c2 = new Color(o.color2 ?? o.color ?? '#FFFFFF'), speed = o.speed ?? 6, life = o.life ?? 1, size = o.size ?? 0.2, grav = o.gravity ?? (o.kind === 'smoke' || o.kind === 'dust' ? -0.5 : 6);
  for (let i = 0; i < n; i++) {
    const ring = o.kind === 'ring'; const a = Math.random() * Math.PI * 2, b = ring ? Math.PI / 2 : Math.acos(2 * Math.random() - 1); const sp = speed * (ring ? 0.95 + Math.random() * 0.1 : 0.4 + Math.random() * 0.7);
    const c = Math.random() < 0.5 ? c1 : c2;
    pool.push({ x: pos.x, y: pos.y, z: pos.z, vx: Math.sin(b) * Math.cos(a) * sp + (o.spread?.x || 0), vy: Math.cos(b) * sp + (o.spread?.y || 0), vz: Math.sin(b) * Math.sin(a) * sp + (o.spread?.z || 0), life: 0, max: life * (0.7 + Math.random() * 0.6), size: size * (0.6 + Math.random() * 0.8), r: c.r, g: c.g, b: c.b, drag: o.kind === 'willow' ? 0.97 : 0.955, grav });
  }
}
