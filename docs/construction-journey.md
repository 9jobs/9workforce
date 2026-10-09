# Construction journey

The homepage now includes a pinned construction sequence immediately after `HomeHero`. The existing navbar, hero, subsequent sections, footer and contact form retain their layouts.

## Preview locally

From the project directory:

```powershell
npm install
npm run dev
```

Open the URL printed by the existing application server (normally `http://localhost:3000`). Scroll past the homepage hero, then keep scrolling to build the project. Scroll upward to reverse it. The final **GET MY WORKFORCE** HTML button navigates to `/contact`, the same enquiry form used by the existing Request Workers buttons.

For an animation-only preview without the form API:

```powershell
npm run dev:client -- --host 127.0.0.1 --port 3001 --strictPort
```

Open `http://127.0.0.1:3001/`. This is the preview used for browser verification. To test real form delivery locally, use the existing full application server and its configured services, rather than the client-only preview.

## Animation implementation

One scrubbed GSAP ScrollTrigger maps scrolling to progress from 0 to 1. It pins for 5.5 section heights on desktop/tablet and 4.5 on mobile. A 1.05-second scrub smooths both directions. The viewport uses fixed pinning after the existing route entrance transform settles, retaining React event delegation and avoiding transform-pin scroll/compositor drift. There is no autoplay loop, snapping or forced wheel handling.

| Progress | Scene |
| --- | --- |
| 0–0.115 | Draw blue architectural plan lines, room partitions, door swings, stairs and dimension ticks over a navy grid. |
| 0.105–0.32 | Raise four floors of genuine Three.js wireframe geometry from the plan and orbit the camera. |
| 0.31–0.53 | Reveal the same model's concrete geometry from bottom to top with a clipping plane; camera pushes closer. |
| 0.43–0.59 | Add timber formwork, scaffolding, rebar, material stacks and excavator; rotate the tower-crane jib and lift its load. |
| 0.57–0.675 | Blend the geometric site into a clean generated photographic scene. |
| 0.68–0.82 | Push into workers depicted finishing concrete, carrying timber and assisting formwork. |
| 0.82–1 | Pull out to the wider project and reveal the accessible HTML heading and enquiry button. |

The supplied 12.22-second video was inspected for its drawing-to-wireframe, material reveal, camera push and pullback. The subject is a reinforced-concrete construction site. Neither the reference video's Instagram icon/watermark nor the storyboard's numbers, headings and arrows are used.

The first four beats use actual geometry, camera motion and progressive construction reveals. The human-detail beat uses a single generated photographic plate with camera motion: workers are depicted performing tasks, but their limbs are not individually rigged or animated. This is the deliberate geometric-to-photographic transition; it is not a sequence of six crossfading slides. The final view shows the construction project, consistent with the supplied unfinished-building references, rather than claiming a finished occupied building.

## Files

Created:

- `src/ConstructionJourney.jsx`: lazy initialization, scroll timeline, photographic camera motion, HTML copy/CTA, accessibility and lifecycle cleanup.
- `src/construction/createConstructionScene.js`: procedural building, plan, materials, equipment, camera and renderer disposal.
- `src/construction-journey.css`: scoped cinematic styling and responsive framing.
- `public/assets/construction-journey/site-wide.webp`: optimized desktop site plate, 333,382 bytes.
- `public/assets/construction-journey/site-mobile.webp`: optimized mobile site plate, 244,172 bytes.
- `tests/construction-journey.spec.js` and `playwright.config.js`: local browser regression checks.
- This implementation guide.

Modified:

- `src/main.jsx`: insert the section after the hero and exclude it from the pre-existing reveal observer.
- `src/styles.css`: exclude this section from the existing global `transform: none !important` reset so ScrollTrigger can pin it.
- `package.json` and `package-lock.json`: GSAP, Three.js, Playwright and a `test:construction` command.

Local screenshots, video inspection frames and build logs are saved in the already-ignored `scratch/` directory.

## Loading, rendering and accessibility

- GSAP, ScrollTrigger, Three.js and scene code are dynamically imported when the section approaches the viewport.
- The site image loads only when the section initializes, using a smaller mobile source. The 3D scene remains visible while the photographic asset loads.
- Geometry is merged where practical; materials and textures are shared.
- Rendering happens only on scroll-progress changes or resize, and stops once the photo fully covers the scene. There is no continuous render loop.
- Pixel ratio is capped at 1.25 on desktop and 1 on mobile at initialization, with the high-performance GPU preference. Mobile disables shadows. The blueprint halo uses an alpha-backed canvas filter rather than a multi-pass bloom pipeline; filter updates are quantized to avoid a new filter value every frame.
- Reduced-motion users receive a single unpinned image and immediately usable CTA, without loading the animation libraries. Live preference changes clean up/rebuild the scene.
- WebGL creation failure or context loss releases the pin and leaves the static enquiry CTA available.
- Hidden CTA content is inert until revealed. A keyboard-accessible Skip animation control moves past the section and focuses the following section.
- Unmounting disposes geometry, materials, texture, WebGL context, listeners and ScrollTrigger pin state.

## Verification

```powershell
npm run build
npm run test:construction
```

The browser suite expects a running preview at `http://127.0.0.1:3001`. To use another port:

```powershell
$env:PREVIEW_URL = 'http://localhost:3000'
npm run test:construction
```

The default browser is installed Microsoft Edge. For another installed Playwright channel, set `PLAYWRIGHT_CHANNEL`, for example `chrome`. Tests do not submit customer enquiries or send messages.

Verified: pinned forward/reverse progress; 1440×900, 768×1024, 390×844, 320×740 and 844×390 layouts; no horizontal overflow; CTA navigation to the existing enquiry form; skip focus; resizing; route return without duplicate canvases or spacers; reduced motion without 3D downloads; WebGL unavailable and context-loss fallbacks. All 10 scenarios passed (the route-return selector was corrected and that scenario rerun). The production build passes; Vite reports upstream `use client` directive warnings and large-chunk advisories. The scene chunk is lazy-loaded and approximately 137 kB gzip.

The main desktop scroll/CTA scenario also passed against the existing full application server at `http://localhost:3000`, after its initial Vite dependency refresh. That server is the opened preview; the temporary client-only test server was stopped after verification.

### Smooth-scroll correction

The follow-up fix changes only this section's animation and its regression checks. It replaces transform pinning with viewport-fixed pinning, waits for the existing page entrance to settle, and defers late layout refreshes until scrolling is idle. The camera follows a continuous eased orbit instead of reversing its azimuth midway through the construction reveal. Crane/scaffolding appear via a clipping plane at full size instead of vertically scaling the whole site. Photographic push/pull movements use smooth easing. Section styles, copy, enquiry routing and surrounding page layouts are retained.

The expanded suite includes real continuous wheel input in both directions at 1920px and 390px, recording the section position on every animation frame. Both checks require at most 1px of vertical/horizontal drift and verify forward progress and return to the original progress. The original responsive, CTA, keyboard skip, reduced-motion, resize, unmount and WebGL fallback checks remain included.

### Bottom-to-top re-entry

The scroll tween now has explicit 0-to-1 endpoints. Leaving either end of the pinned range completes its corresponding frame immediately; re-entering from below refreshes the current visuals. The fixed endpoints are retained across layout refreshes. Lazy initialization also detects visitors who jump past the section, and preserves the lower-page viewport position if the 3D imports finish after they have passed it.

Additional regression checks cover entering from later homepage sections on desktop and mobile, reversing through all six stages after a resize below the section, immediate return after a fast exit, and returning upward after delayed 3D loading. UI copy, styling and enquiry routing are unchanged by this correction.

No GitHub push or deployment was performed.

## Generated visual asset provenance

The built-in image-generation tool was used, with the supplied concrete-building and labourer images as visual references. The output was saved into this project's `public/assets/construction-journey/` folder as the two optimized WebP files above. No production code refers to temporary attachments or the generator's output directory.

Generation prompt:

> Create a clean photorealistic cinematic panoramic 16:9 construction website background, 2048x1152. References are visual references only: reference 1 reinforced concrete building structure and golden hour site; reference 2 authentic labourers and concrete/formwork tasks. Remove ALL typography, labels, numbers, arrows, logos and graphics. Single coherent Australian construction site: four-storey reinforced concrete building, rectangular broad horizontal slabs and substantial square columns, scaffolding and timber formwork, tower crane at right, small excavator and organized material stacks. Building occupies centre and right background, photographed from front left three-quarter perspective. In foreground centre-right three realistic workers wearing white hard hats and orange/yellow high visibility vests, work boots and gloves actively finishing concrete with trowel, carrying timber and assisting formwork. Their anatomy and tools must be credible. Wide enough to show entire building and crane, but workers prominent in lower central foreground for camera push-in. Deep navy shadows, warm orange sunlight from upper right, atmospheric dust, subtle distant city. Left third darker breathing space for real HTML text overlay. Rich natural material detail, premium architectural photography, no dramatic unsafe actions, no text or border of any kind.

The original six storyboards and the later combined storyboard guided the sequence, materials and colour treatment; none are displayed as labeled slides.
