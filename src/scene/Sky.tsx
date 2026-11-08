/**
 * PLACEHOLDER sky: a gradient dome that turns from night to dawn with sim.dawn, plus stars.
 * To be replaced by the environment builder with a shader sky, moon, nebula and clouds.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BackSide, Color, ShaderMaterial, Points, BufferGeometry, Float32BufferAttribute, PointsMaterial } from 'three';
import { sim } from '@/game/sim';

export function Sky() {
  const mat = useMemo(() => new ShaderMaterial({
    side: BackSide, depthWrite: false,
    uniforms: { top: { value: new Color('#081A24') }, bot: { value: new Color('#1a1030') }, dawn: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top, bot; uniform float dawn; varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 night = mix(bot, top, smoothstep(-0.2, 0.6, h)); vec3 day = mix(vec3(1.0,0.55,0.25), vec3(0.45,0.7,0.95), smoothstep(-0.1, 0.7, h)); gl_FragColor = vec4(mix(night, day, dawn), 1.0); }',
  }), []);
  const stars = useMemo(() => { const g = new BufferGeometry(); const n = 1500, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 0.9); p[i * 3] = Math.sin(b) * Math.cos(a) * 480; p[i * 3 + 1] = Math.cos(b) * 480; p[i * 3 + 2] = Math.sin(b) * Math.sin(a) * 480; } g.setAttribute('position', new Float32BufferAttribute(p, 3)); return g; }, []);
  const starsRef = useRef<Points>(null!);
  useFrame(() => { mat.uniforms.dawn.value = sim.dawn; if (starsRef.current) (starsRef.current.material as PointsMaterial).opacity = 1 - sim.dawn; });
  return (<group>
    <mesh material={mat}><sphereGeometry args={[500, 32, 16]} /></mesh>
    <points ref={starsRef} geometry={stars}><pointsMaterial size={1.6} color="#dfe9ff" transparent opacity={1} sizeAttenuation={false} depthWrite={false} /></points>
  </group>);
}
