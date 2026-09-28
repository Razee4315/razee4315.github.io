# 13 Decision log (and stack, performance, plan)

- ADR-1 Direction Catalog, tier Crafted (owner, Gate 1).
- ADR-2 Signature changed from "colour flood" to "the wren tree" (owner request, 2026-09-28). The colour flood shrinks to a per-row tint so the page keeps one signature.
- ADR-3 Hero 100dvh on desktop. On phones the scene sits below the type, so the first row is one short scroll away (portfolio rule: the work must be reachable).
- ADR-4 No dark mode (one mode done well). The previous hub had one; dropped.
- ADR-5 Contact: GitHub + LinkedIn only (owner). ADR-6 Only the five projects (owner).
- ADR-7 Scene in SVG, not canvas/WebGL: crisp, themeable, accessible, cheap at ten birds.
- ADR-8 Chirps synthesized with Web Audio after a click, with a mute toggle; no audio files.
- ADR-9 Share images copied in as WebP so the hub never breaks if a project renames its image.
- ADR-10 Stack: static HTML/CSS/JS, no build; GSAP 3.13.0 + ScrollTrigger + SplitText + MotionPathPlugin and Lenis 1.3.11 from jsDelivr (same pinned versions as Snipflag's site). Rejected: Lottie (authoring tools plus a runtime).

- ADR-11 (owner feedback, 2026-09-28) Birds leave the tree: a page-wide flock after the Paperwren flying wren. Click anywhere and a bird pops out there, hops and flies across to perch on letters, edges, the tree or the footer; up to ten styles; they follow the reader down the page, talk in drawn bubbles and flee a close cursor. The tree stays as the hero art and a perch.
- ADR-12 (owner feedback) The cursor-following preview is removed. The catalogue becomes full-bleed rows that fill with each project's brand colour and open to show the real screenshot. Desktop opens on rest (110 ms intent) and stays open until another row is rested on, so the list never jumps; touch shows every project as an open colour card.
- ADR-13 (owner feedback) Logos are characters with idle loops (Snipflag focus hunt and arrow launch, Paperling clap and jelly #, Paperwren hop, Vuoom ball bouncing on the V, coldframe domino jump and shiver). They jump when their row opens or a bird lands on it. Squash-and-stretch is hand-keyframed; the one overshoot curve (--squish) is used only on the footer letters because the owner asked for squishy.
- ADR-14 (performance) Tree drawn once (125 SVG nodes, leaves merged per colour) and moved only by WAAPI dips on landing and occasional gusts; birds are HTML elements moved with translate3d in one rAF loop; grain is a tiled background instead of a fixed blend layer; distant flock and falling leaves are CSS; logo loops pause off-screen; MotionPathPlugin dropped; fonts trimmed to two Archivo instances (400/100%, 800/125%) and one mono weight. Measured locally with ten birds: no long tasks, 246 KB total transfer.
- ADR-15 Footer: dark, with large links that fill paper on hover, "Back to the tree" (scrolls up, birds scatter and follow), and a giant RAZEE wordmark whose letters rise and light in project colours under the cursor, squish on click, and are perches for the birds.

## Performance and accessibility targets
LCP < 2.5s (h1 text), CLS < 0.1 (all media sized), INP < 200ms (no work in scroll handlers). Contrast: ink on paper ≈ 15.9:1; stone on paper ≈ 4.9:1. Keyboard: skip link, rows are links, Invite is a button, visible focus everywhere, aria-live bird count, aria-label on split headings, no hover-only content on touch.

## Plan
1 foundation · 2 static skeleton (review at 1440 and 390) · 3 Lenis + reveals · 4 h1 + hero choreography · 5 tree, bird rig, ten styles, idle, flight, talk, Snipflag moment, invite, sound · 6 row hover, preview follower, logo moments, sticky index · 7 colophon pin, 404 bird · 8 Phase 6 audit with evidence, deploy, verify live.
