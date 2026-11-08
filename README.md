# The Night Before the Lights — ArcGX TechLabs Diwali 2026

A cinematic retelling of the Narakasura story as a real-time 3D game. Players enter their
name, ride with Krishna and Satyabhama on Garuda through the burning fortress city of
Pragjyotisha, bring Narakasura down with the final arrow, watch the dawn and the lamps
light across the land, and finish with a Diwali card in their name, ready to share.

Built with Vite, React, TypeScript, Three.js (react-three-fiber + postprocessing) and
Remotion for the cinematic sequences. Every character is a fully animated procedural rig;
every sound is synthesised in the browser; no binary assets are shipped.

## The story, as the game tells it

1. **Title sequence.** A Remotion title over a fly-over of Pragjyotisha at night.
2. **Prologue.** Narakasura rules Pragjyotisha, steals Aditi's earrings and holds sixteen
   thousand princesses captive. A boon says only his mother, Bhudevi the Earth, can end him.
3. **Mount.** Krishna turns to Satyabhama, born of the Earth. They climb onto Garuda.
4. **Chapter 1: The ride of Garuda.** Asuras on fire-wings and fireballs come at Garuda.
   Tap them before they reach the three lamps. Quick hits build a combo.
5. **The gates shatter.** Narakasura walks out of the smoke, nine metres tall, mace burning.
6. **Chapter 2: Narakasura.** Tap him, hit his glowing marks for heavy damage, break the
   fire maces he hurls, survive his stomps.
7. **Krishna falls.** Halfway through, Narakasura's blast strikes Krishna down. In slow
   motion Satyabhama rises and takes the bow. Every hit now counts double.
8. **The final arrow.** Press and hold to draw; release. The camera rides the arrow of light
   into Narakasura, who dissolves into embers.
9. **Dawn.** Narakasura asks that his end be remembered with light. The sky turns, the sun
   rises, and thousands of diyas light across the city. That is Deepavali.
10. **Finale and card.** "Happy Diwali" with the player's name, fireworks, a score screen
    with a rank, and a 1080 by 1350 Diwali card with the name, wish, score, a portrait of
    Krishna or Satyabhama and the ArcGX lockup. On phones it shares straight to WhatsApp
    and other apps; on desktop it saves.

Keyboard: Space fires at the nearest target, holding Space draws the final arrow, Enter or
Space continues the story. Graphics quality (Low to Ultra) can be picked on the first screen.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve dist/ on http://localhost:4173
```

Pushes to `main` build and deploy `dist/` to GitHub Pages through
`.github/workflows/deploy.yml` (enable Pages with the "GitHub Actions" source once).

## Cinematics with Remotion

The title, chapter cards, banners, impact overlays, the charging ring, the victory slam, the
dawn light leaks and the finale typography are Remotion compositions in
`src/cinematics/compositions.tsx`. In the game they play through `@remotion/player` on top
of the live 3D scene. They can be previewed and rendered to video:

```bash
npm run remotion:studio                                  # open the compositions in Remotion Studio
npx remotion render video/index.ts title out/title.mp4   # render one sequence
npm run remotion:render:all                              # render every sequence into out/
```

## Development

* `?showcase=krishna|satyabhama|narakasura|garuda|foes|city|sky|vfx|party&state=<state>&param=<0..1>`
  renders one component on a turntable with the full post stack.
* `?scene=battle` (or any scene name) jumps straight to that part of the story.
* `node scripts/screenshot.mjs <url> out.png [waitMs] [WxH]` screenshots a URL with headless Chromium.
* `node scripts/playthrough.mjs [url]` plays the whole game automatically and reports scene timings.
* See `docs/ARCHITECTURE.md` for how the director, simulation, rigs, VFX bus and cinematics fit together.

## Credits

Story, design and code: Suneel Bose, ArcGX TechLabs. The ArcGX palette and lockup follow the
brand guidelines. Fonts: Cinzel, Outfit and Inter from Google Fonts.
