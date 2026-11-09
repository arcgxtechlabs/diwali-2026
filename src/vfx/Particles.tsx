/**
 * Particle system in the pixel grammar: a CPU pool of additive square dabs (no soft discs) with
 * stepped alpha, subscribed to the VFX bus. Sparks, embers, smoke, debris, dust, fireworks
 * (peony / ring / willow) and the holy light of the final arrow all come from here.
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Points, ShaderMaterial, Vector3 } from 'three';
import { vfx, type BurstOpts } from './bus';
import { sim } from '@/game/sim';

const MAX = 6000;
interface P { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; size: number; r: number; g: number; b: number; drag: number; grav: number; soft: number; }
export function Particles() {
  const pool = useMemo<P[]>(() => [], []);
  const geo = useMemo(() => { const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(new Float32Array(MAX * 3), 3)); g.setAttribute('color', new Float32BufferAttribute(new Float32Array(MAX * 3), 3)); g.setAttribute('aSize', new Float32BufferAttribute(new Float32Array(MAX), 1)); g.setAttribute('aAlpha', new Float32BufferAttribute(new Float32Array(MAX), 1)); g.setAttribute('aSoft', new Float32BufferAttribute(new Float32Array(MAX), 1)); return g; }, []);
  const mat = useMemo(() => new ShaderMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending, vertexColors: true,
    uniforms: { uScale: { value: 400 } },
    vertexShader: 'attribute float aSize, aAlpha, aSoft; varying vec3 vC; varying float vA, vS; uniform float uScale; void main(){ vC = color; vA = aAlpha; vS = aSoft; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = max(2.0, aSize * uScale / -mv.z); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying vec3 vC; varying float vA, vS; void main(){ vec2 d = gl_PointCoord - 0.5; float sq = step(max(abs(d.x), abs(d.y)), 0.5 * (0.55 + 0.45 * vA)); float r = length(d) * 2.0; float soft = pow(max(0.0, 1.0 - r), 1.4); float m = mix(sq, soft, vS); float a = floor(vA * 4.0 + 0.5) / 4.0; gl_FragColor = vec4(vC * (1.0 + (1.0 - r) * 0.8) * m, a * m); }' }), []);
  const ref = useRef<Points>(null!);
  useEffect(() => vfx.subscribe({
    burst(pos, o) { spawn(pool, pos, o); },
    firework(pos, o) { spawn(pool, pos, { ...o, kind: o.kind || 'peony', count: o.count || 140, life: 2.2, size: 0.35, gravity: 3 }); },
    flash(pos, color, size) { const c = new Color(color); pool.push({ x: pos.x, y: pos.y, z: pos.z, vx: 0, vy: 0, vz: 0, life: 0, max: 0.3, size: size * 2, r: c.r, g: c.g, b: c.b, drag: 1, grav: 0, soft: 1 }); },
  }), [pool]);
  useFrame(({ size: vp }) => {
    const dt = sim.dt; const pos = geo.getAttribute('position'), col = geo.getAttribute('color'), sz = geo.getAttribute('aSize'), al = geo.getAttribute('aAlpha'), so = geo.getAttribute('aSoft');
    let n = 0; mat.uniforms.uScale.value = vp.height * 0.9;
    for (let i = pool.length - 1; i >= 0; i--) {
      const p = pool[i]; p.life += dt; if (p.life > p.max) { pool[i] = pool[pool.length - 1]; pool.pop(); continue; }
      const d = Math.pow(p.drag, dt * 60); p.vx *= d; p.vz *= d; p.vy = p.vy * d - p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (n < MAX) { const k = p.life / p.max; pos.setXYZ(n, p.x, p.y, p.z); col.setXYZ(n, p.r, p.g, p.b); sz.setX(n, p.size * (1 - k * 0.4)); al.setX(n, (1 - k * k) * (k > 0.6 ? 0.6 + 0.4 * Math.sin(p.life * 28) : 1)); so.setX(n, p.soft); n++; }
    }
    pos.needsUpdate = col.needsUpdate = sz.needsUpdate = al.needsUpdate = so.needsUpdate = true; geo.setDrawRange(0, n);
  });
  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} />;
}
function spawn(pool: P[], pos: Vector3, o: BurstOpts) {
  const n = o.count ?? 30, c1 = new Color(o.color ?? '#FFC15A'), c2 = new Color(o.color2 ?? o.color ?? '#FFFFFF'), speed = o.speed ?? 6, life = o.life ?? 1, size = o.size ?? 0.2, grav = o.gravity ?? (o.kind === 'smoke' || o.kind === 'dust' ? -0.5 : 6);
  const soft = o.kind === 'smoke' || o.kind === 'dust' || o.kind === 'holy' ? 1 : 0;
  for (let i = 0; i < n; i++) {
    const ring = o.kind === 'ring'; const a = Math.random() * Math.PI * 2, b = ring ? Math.PI / 2 : Math.acos(2 * Math.random() - 1); const sp = speed * (ring ? 0.95 + Math.random() * 0.1 : 0.4 + Math.random() * 0.7);
    const c = Math.random() < 0.5 ? c1 : c2;
    pool.push({ x: pos.x, y: pos.y, z: pos.z, vx: Math.sin(b) * Math.cos(a) * sp + (o.spread?.x || 0), vy: Math.cos(b) * sp + (o.spread?.y || 0), vz: Math.sin(b) * Math.sin(a) * sp + (o.spread?.z || 0), life: 0, max: life * (0.7 + Math.random() * 0.6), size: size * (0.6 + Math.random() * 0.8), r: c.r, g: c.g, b: c.b, drag: o.kind === 'willow' ? 0.97 : 0.955, grav, soft });
  }
}
