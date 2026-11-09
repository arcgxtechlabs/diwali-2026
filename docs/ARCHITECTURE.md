# Architecture: The Night Before the Lights (2026)

A real-time 3D cinematic story game. Vite + React 19 + TypeScript, Three.js through
react-three-fiber, post-processing from `postprocessing`, and Remotion for the
cinematic overlays (played in-game through `@remotion/player`, and renderable to video).

## Layout

```
src/
  game/        director.ts (story + rules), sim.ts (per-frame state), entities.ts (movement),
               targeting.ts (screen-space picking), world.ts (layout constants), types.ts
  store/       gameStore.ts (zustand: scene, score, flags, UI requests)
  scene/       World.tsx (composition), CameraRig.tsx (shots), Lighting.tsx, PostFX.tsx,
               Sky.tsx, City.tsx, Showcase.tsx (?showcase= mode)
  style/       px.ts (pixel canvas, Bayer ramps, NearestFilter textures, world UVs, lit billboards
               with cut-out shadows, glow, pixel fire), figure.ts (pose-table humanoid and Garuda
               drawers, atlas builder, PixelActor), cast.ts (every character's pose table and atlas),
               set.ts (wall/roof/street/fort textures, buildings, diya atlas), Sheet.tsx (?sheet= review)
  characters/  Krishna.tsx, Satyabhama.tsx, Narakasura.tsx, Garuda.tsx, Foes.tsx: pixel sprite actors;
               rig.ts / clips.ts: the older 3D joint rig (kept for easing helpers and reference)
  vfx/         bus.ts (imperative VFX API), Particles.tsx, Shockwaves.tsx, Projectiles.tsx,
               Diyas.tsx, Floats.tsx
  cinematics/  compositions.tsx (Remotion sequences), Overlay.tsx (in-game Player)
  ui/          Intro, Subtitles, Guide (dialogue + 3D portrait), HUD, Closing, ShareBox, card.ts
  audio/       engine.ts (all sound is synthesised)
video/         Remotion root for `remotion studio` / `remotion render`
scripts/       screenshot.mjs (headless WebGL screenshots)
```

## Data flow

* The **director** (`src/game/director.ts`) is an async script: it sets `scene`, plays
  cinematics, narrates, and runs the gameplay rules in `tick()`.
* **High-frequency state** lives in the `sim` singleton (`src/game/sim.ts`): positions of
  Garuda, foes, arrows, maces, marks, boss timers, camera shake, dawn/lamp progress.
  Scene components read it inside `useFrame`, never through React state.
* **Story flags** (`gs().flags`, timestamps in sim seconds) tell components when something
  happened: `flightIntro`, `bossEnter`, `krishnaDown`, `satyaRise`, `arrowRelease`, `bossDeath`,
  `dawn`, `lampsOn`... Components animate from `sim.t - flag`.
* **VFX** are requested through `vfx.burst / shockwave / firework / flash` (`src/vfx/bus.ts`).
* **Cinematics** are requested with `director.cinematic(id, props, seconds)`; the overlay
  plays `COMPOSITIONS[id]` in a Remotion Player.

## World

1 unit = 1 metre. Garuda flies toward -Z; the world scrolls past (`sim.scroll`).
Garuda sits at `WORLD.garudaRide` during the ride and `WORLD.garudaBattle` while hovering.
Narakasura's feet are at `WORLD.bossPos`, he is `WORLD.BOSS_HEIGHT` (9.5 m) tall and faces +Z.
The riders sit at `WORLD.krishnaSeat` / `WORLD.satyaSeat` relative to Garuda; once Krishna
falls, Satyabhama stands at `WORLD.satyaStandOffset`.

## Characters

Every character is an HD-2D pixel sprite (`docs/VISUAL-STYLE.md`). `src/style/figure.ts`
draws a humanoid pixel by pixel from a `Pose2` (limb angles, view, props) and a `Costume`
(ramps, bulk); `src/style/cast.ts` lists each character's poses, and `buildAtlas` packs them
into one strip with a selout outline (Narakasura's alpha carries a noise so a rising alphaTest
dissolves him). A `PixelActor` is the lit billboard in the world: it picks a frame, faces the
camera around Y, chooses back or front frames from the camera side, and casts cut-out shadows.
Animation is stepping between frames (idles at ~1.4 Hz, wing beats at 5–9 fps) while the
billboard itself glides with the simulation.
Props: `mode` = `game` (reads sim/store), `portrait` (dialogue avatar bust), `showcase`
(plays `state`/`param` on a turntable). `rig.ts` keeps the easing helpers the game uses.

## Showcase and screenshots

`?showcase=krishna&state=aim&param=1` renders a single component with studio lighting
and the full post stack. `?sheet=1` shows the generated sprite atlases without WebGL. `node scripts/screenshot.mjs <url> out.png [waitMs] [WxH]`
screenshots any URL with headless Chromium (SwiftShader). `?scene=battle` jumps the
real game to a scene (see `director.jumpTo`).

## Quality tiers

`low | medium | high | ultra` picked by `detectQuality()` and switchable on the intro
screen. Low disables shadows and most post effects; use `useGameStore(s => s.quality)`
to scale particle counts and instance counts.
