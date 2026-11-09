# Visual style: HD-2D Pragjyotisha

The game's look is directed with the **HD-2D** style from the Lemo-Opuscar library
(`styles/hd-2d/STYLE.md`): hand-made pixel sprites standing like paper cut-outs inside a lit,
fogged, fully 3D diorama, seen from above through a tilt-shift lens. Light is the subject.
This document is the treatment: what the style fixes, and the choices made for this story.

"HD-2D" is Square Enix's term for the look; it names a grammar here, never a title or a brand.

## 1. Why this style

Diwali is the festival of lights, and the story ends with thousands of lamps lighting across a
city at dawn. In HD-2D, **"lights popping on one by one"** is a native move, practicals carry the
story and the cold ambient carries the mood. Krishna's night ride over a burning fortress and the
dawn of lamps are the two temperatures of the style: a cold moon over navy fog, small hot fires
below. The game is already a Three.js diorama with real lights, fog, bloom and vignette, so the
style upgrades every placeholder module instead of fighting the engine.

Benchmark (grammar only): the sprite-in-diorama games that defined the look. Learned: high 3/4
camera, sprites that step while light glides, point lights with shadows, the focus band, the
framed dialogue box. Not taken: any character, place, UI ornament or music.

## 2. The three rules

1. **Sprites step, everything else glides.** Characters are flat pixel sprites (30 px per metre),
   stepping between drawn frames at 6–10 fps; idles alternate two frames at ~1.4 Hz. Camera,
   lights, fog, particles, focus and the world scroll update every frame.
2. **Constant texel density.** Every surface is a pixel texture at 24 px/m with `NearestFilter`
   and world-space UVs. Colour comes from 3–6 swatch ramps through a 4×4 Bayer dither: a narrow
   band (.22) on sprites, wider (.45) on textures. Sprites get a 1 px selout outline.
3. **Light is the subject.** One dim cold key with shadows, a hemisphere fill, warm practicals
   with shadows where it matters (the gate braziers, Narakasura's fire), a cool front fill 2 m
   before the heroes so billboards never go black, and an additive glow sprite on every source so
   bloom has something to grab. No film grain.

## 3. Sets and ladders

Each set owns one fog colour and one light key, so a scene change reads instantly.

| Set | When | Ambient key | Practicals | Fog |
|---|---|---|---|---|
| **Night over Pragjyotisha** | name, title, prologue, mount, ride | moon `#8fa8e0`, hemisphere `#3a4c7a / #0a0a12`, sky `#050818 → #101d3e → #2c4262` | windows `#ffae55`, roof fires `#ff8c3a`, torches | `#16223a` |
| **The gate** | preboss, battle, fall, rage, final, victory | the same moon, dimmer; sky darker and warmer at the horizon | braziers `#ff9d4a` with shadows, Narakasura's eyes and mace `#ff5a3a`, weak-point marks `#ffd35a` | `#1c1a2e` (rage: `#2a1420`) |
| **Dawn** | dawn, finale, closing | sun `#ffb36b`, hemisphere `#ffb070 / #5a3a30`, sky `#ff8c50 → #ffd0a0 → #7fb0e0` | diyas `#ffc15a`, fireworks in the brand fire colours | `#e8a070` |

The darkest value is a warm ink `#1a1016`, never black. The brightest is a light source, bloomed.

**Characters' colours** are the saturated ones no set uses, so they read in a wide:
Krishna skin `#4a7bd8` (one blue in a navy world, lit by the fill), dhoti gold `#f2b33d`;
Satyabhama sari `#c2423a` with a gold border; Narakasura skin `#2a1a22` with gold armour and
`#ff5a3a` eyes; Garuda red-brown feathers `#7a2a1a … #d8a040` with a gold beak; asuras ash grey with
ember wings; fireballs the pixel flame ramp `#b3260e → #fff6c8`.

## 4. Camera grammar

Always look **down** on the world; never eye level. The ride chase cam sits higher and farther
than before, the battle camera is a medium-high 3/4 over Garuda's shoulder, the gate shot is the
"very high, very far" preciousness wide with the band on the tiny riders, the final arrow keeps
its dolly-zoom and the dawn shot is the rising pull-back with lamps popping on below. Every shot
eases on a monotone path (the existing rig), no overshoot. The tilt-shift band follows the heroes'
projected screen height, clamped to .2–.8, and uses a fixed band height on shots without them.

## 5. Type and UI

Cinzel (inscriptional capitals, wide tracking) for chapter labels, titles and the boss name;
Cormorant Garamond italic for narration subtitles, Cormorant for dialogue. UI is **one metal
(gold `#d8c28e / #e2c989 / #c9a863`) plus paper white `#f3ead6`** over a dark translucent navy
plate. Narration is an italic serif line low on a soft dark band. On-screen speech gets the
**dialogue box**: dark plate, 2 px gold border with an inner 1 px line, gold diamond corners, a
name plate overlapping the top edge, typewriter text and a blinking caret. The ArcGX lockup, the
closing panel's brand colours and the share card keep the brand guidelines.

## 6. Native moves used

- **Lights popping on one by one**: the diyas across the city at dawn (`sim.lamps`).
- **The carried light as a meter**: the three lamps on Garuda's back are the lives; each lamp is a
  real point light that goes out when a foe gets through.
- **Shadows jump when a light is lit**: the braziers at the gate flare when Narakasura enters.
- **Tilt-shift preciousness**: the gate wide, the dawn crane.
- **RPG grammar**: chapter cards, a named companion in a dialogue box, a boss name plate.

## 7. What we do not take from the demo

The demo is a lighthouse story with a harbour, a forest and a cliff stair. None of its places,
props (lantern, taper, ships), characters, shots or score appear here. We use only its techniques:
the pixel canvas, ramps and selout, lit billboards with cut-out shadows, world UVs, the pixel
flame atlas, glow sprites, the light-toward-the-lens rule and the sprite lighting cap.

## 8. Pitfalls to check

Checkerboard (dither band too wide); a light burning out the sprite that holds it (move the light
0.45 m toward the camera, cap sprite lighting); billboards lit only from behind (always the front
fill); dark scenes unreadable (lift mid-tones ×2 outside the one beat that must go dark: Krishna's
fall); distant glows hidden by fog (`depthTest false`, higher render order).
