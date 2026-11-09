/**
 * HD-2D sky: a gradient dome quantised into dithered pixel bands, a moon with a halo,
 * square twinkling stars, and a dawn that brings a sun up over a warm horizon (sim.dawn).
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BackSide, Color, ShaderMaterial, Points, BufferGeometry, Float32BufferAttribute, Vector3, AdditiveBlending } from 'three';
import { sim } from '@/game/sim';
import { mulberry } from '@/style/px';

const NIGHT = { top: new Color('#050818'), mid: new Color('#101d3e'), hor: new Color('#2c4262') };
const DAWN = { top: new Color('#5a86c8'), mid: new Color('#e8a070'), hor: new Color('#ffd0a0') };
const BATTLE = { top: new Color('#07050f'), mid: new Color('#1c1026'), hor: new Color('#4a2230') };

export function Sky() {
  const { size } = useThree();
  const mat = useMemo(() => new ShaderMaterial({
    side: BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: NIGHT.top.clone() }, mid: { value: NIGHT.mid.clone() }, hor: { value: NIGHT.hor.clone() }, moonDir: { value: new Vector3(-0.35, 0.42, -1).normalize() }, moonI: { value: 1 }, sunDir: { value: new Vector3(0.5, 0.05, -1).normalize() }, sunI: { value: 0 }, px: { value: 4 }, res: { value: 1080 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize((modelMatrix * vec4(position,0.)).xyz); vec4 p = projectionMatrix * viewMatrix * vec4((modelMatrix*vec4(position,1.)).xyz,1.); gl_Position = p.xyww; }',
    fragmentShader: `varying vec3 vD; uniform vec3 top, mid, hor, moonDir, sunDir; uniform float moonI, sunI, px, res;
      float bayer(vec2 p){ vec2 q = mod(floor(p), 4.); float x = q.x, y = q.y; float i = y*4.+x; float B[16]; B[0]=0.;B[1]=8.;B[2]=2.;B[3]=10.;B[4]=12.;B[5]=4.;B[6]=14.;B[7]=6.;B[8]=3.;B[9]=11.;B[10]=1.;B[11]=9.;B[12]=15.;B[13]=7.;B[14]=13.;B[15]=5.; for(int k=0;k<16;k++) if(float(k)==i) return (B[k]+.5)/16.; return .5; }
      void main(){ vec3 d = normalize(vD); float y = d.y;
        // quantised gradient: 14 bands, Bayer-dithered at the band edges so it reads as pixel art
        float k = y > .16 ? .5 + .5 * smoothstep(.16, .8, y) : .5 * smoothstep(-.04, .16, y);
        float steps = 14.; float kq = floor(k * steps + bayer(gl_FragCoord.xy / px)) / steps;
        vec3 c = kq < .5 ? mix(hor, mid, kq * 2.) : mix(mid, top, (kq - .5) * 2.);
        float m = max(dot(d, moonDir), 0.); c += vec3(.86,.9,1.) * (pow(m, 1400.) * 5. + pow(m, 80.) * .22 + pow(m, 8.) * .05) * moonI;
        float s = max(dot(d, sunDir), 0.); c += vec3(1.,.72,.42) * (pow(s, 900.) * 8. + pow(s, 40.) * .6 + pow(s, 6.) * .25) * sunI;
        gl_FragColor = vec4(c, 1.); }`,
  }), []);
  const stars = useMemo(() => { const g = new BufferGeometry(); const R = mulberry(3); const n = 900, p = new Float32Array(n * 3), ph = new Float32Array(n * 2); for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, y = 0.06 + Math.pow(R(), 0.8) * 0.92, r = Math.sqrt(1 - y * y); p[i * 3] = Math.cos(a) * r * 800; p[i * 3 + 1] = y * 800; p[i * 3 + 2] = Math.sin(a) * r * 800; ph[i * 2] = R() * 10; ph[i * 2 + 1] = 0.4 + R() * R() * 1.6; } g.setAttribute('position', new Float32BufferAttribute(p, 3)); g.setAttribute('ph', new Float32BufferAttribute(ph, 2)); return g; }, []);
  const starMat = useMemo(() => new ShaderMaterial({
    uniforms: { t: { value: 0 }, k: { value: 1 }, px: { value: 3 } }, transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false,
    vertexShader: 'attribute vec2 ph; uniform float t, px; varying float vA; void main(){ vec4 p = projectionMatrix * viewMatrix * vec4(position,1.); gl_Position = p.xyww; vA = ph.y * (.65 + .35 * sin(t * (1.5 + ph.x * .3) + ph.x * 7.)); gl_PointSize = px * (ph.y > 1.3 ? 2. : 1.); }',
    fragmentShader: 'varying float vA; uniform float k; void main(){ gl_FragColor = vec4(vec3(.8,.87,1.) * vA * k, 1.); }',
  }), []);
  const starsRef = useRef<Points>(null!);
  const tmp = useMemo(() => ({ top: new Color(), mid: new Color(), hor: new Color() }), []);
  useFrame(() => {
    const d = sim.dawn, battle = sim.rage * 0.6 + (sim.garuda.hover && d < 0.01 ? 0.5 : 0); const u = mat.uniforms;
    tmp.top.copy(NIGHT.top).lerp(BATTLE.top, battle).lerp(DAWN.top, d); tmp.mid.copy(NIGHT.mid).lerp(BATTLE.mid, battle).lerp(DAWN.mid, d); tmp.hor.copy(NIGHT.hor).lerp(BATTLE.hor, battle).lerp(DAWN.hor, d);
    (u.top.value as Color).copy(tmp.top); (u.mid.value as Color).copy(tmp.mid); (u.hor.value as Color).copy(tmp.hor);
    u.moonI.value = 1 - d; u.sunI.value = Math.max(0, d - 0.15) * 1.2; (u.sunDir.value as Vector3).set(0.5, -0.08 + d * 0.3, -1).normalize(); u.px.value = Math.max(2, Math.round(size.height / 270));
    starMat.uniforms.t.value = sim.t; starMat.uniforms.k.value = Math.max(0, 1 - d * 1.6); starMat.uniforms.px.value = Math.max(2, Math.round(size.height / 360));
  });
  return (<group>
    <mesh material={mat} renderOrder={-10} frustumCulled={false}><sphereGeometry args={[800, 32, 16]} /></mesh>
    <points ref={starsRef} geometry={stars} material={starMat} renderOrder={-9} frustumCulled={false} />
  </group>);
}
