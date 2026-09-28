# 05 Motion spec

Crafted tier: floor of 9. Every JS tween runs inside `gsap.matchMedia()` for `(prefers-reduced-motion: no-preference)`; the reduce branch sets end states.

| # | Item | Trigger | What | Timing | Reduced motion |
|---|---|---|---|---|---|
| 1 | Row reveal | ScrollTrigger.batch, top 88% | rows y 40 to 0, opacity 0 to 1; rule scaleX 0 to 1; stagger .08 | 0.9s expo.out | visible, still |
| 2 | Hover states | pointer | name x +14px; arrow x +8px and rotate -45 to 0; project tint wipes in (clip-path inset) | 240ms expo.out | tint only |
| 3 | Press feedback | :active | buttons and rows scale .98 | 120ms | same |
| 4 | Wipe underline | hover/focus | footer links, scaleX with origin swap | 320ms expo.out | same |
| 5 | Lenis | fine pointer only | lerp .1, driven by gsap.ticker, lagSmoothing(0) | | off |
| 6 | h1 masked line reveal | load, after fonts.ready | SplitText lines with mask, yPercent 110 to 0, stagger .1 | 1.0s expo.out | static |
| 7 | Pinned scrub | colophon | pin +=150%; words opacity .12 to 1 scrubbed; a bird flies across on a scrubbed path | scrub 1, ease none | static, full opacity |
| 8 | Scroll-linked transform | hero leaving | scene yPercent -10 and h1 yPercent -16 | scrub 1 | none |
| 9 | Hero load choreography | load | 0ms strip · 100ms h1 lines · 400ms lede · 550ms buttons (scale .95 to 1) · 200 to 1100ms branches draw (stroke-dashoffset) and leaves pop (stagger .006) · 1100ms first wren flies in | < 1.8s, overlapped | scene drawn, bird perched |

## Signature details

- Wind: each branch group rotates ±0.5 to 1.2° around its base, sine.inOut yoyo, 4 to 7s, phase-offset. Leaves flutter ±5°.
- Bird idle (per bird): breathe (body scaleY 1 to 1.035, 1.8s); blink (eyes scaleY .1 for 90ms every 2.5 to 6s); tail flick; head follows cursor (±16°, lerped); hop (±12px along the perch with a 10px arc) and peck, randomly every 5 to 11s.
- Invite: spawn off-screen, fly a MotionPath curve (1.6 to 2.2s, sine.inOut) with wings flapping (rotate -45 to 25°, 0.11s yoyo), land with a squash (scaleY .88 to 1, 220ms expo.out).
- Talk: every 3 to 5.5s a speaker and a listener face each other; the upper beak opens twice (120ms); a bubble scales from the beak (400ms expo.out), rises 22px and fades after 1.6s; the listener answers 750ms later.
- Snipflag moment: on every third song, four brackets snap around the singer (scale 1.5 to 1, 260ms), a flash (opacity .55 to 0, 300ms), then fade.
- Pausing: the scene pauses when the hero is off-screen and when the tab is hidden.
