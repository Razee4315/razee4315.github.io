# 05 Motion spec

> Brought back in line with the built site on 2026-10-03 (ADR-36 to ADR-39). Where this file and the decision log differ, the log wins.

Crafted tier: floor of 9, of which 8 are present. Item 7 (pinned scrub) was removed by the owner in ADR-24 and is deliberately not replaced. Every JS tween runs inside `gsap.matchMedia()` for `(prefers-reduced-motion: no-preference)`; the reduce branch sets end states.

| # | Item | Trigger | What | Timing | Reduced motion |
|---|---|---|---|---|---|
| 1 | Row reveal | one ScrollTrigger per band, band top at 62% | header row, lockup, description, Visit, plate and footer row rise y 40 to 0, opacity 0 to 1; stagger .08 | 0.9s expo.out | visible, still |
| 2 | Hover states | pointer | arrows nudge (Visit x +4px, Next and See the tools y +3px, footer out-arrows 2px up-right); primary button turns teal; ghost button fills ink; the nav wren hops. No hover on a band itself (ADR-17) | 240ms expo.out | same, instant |
| 3 | Press feedback | :active | buttons scale .97, nav GitHub .95 | 120ms expo.out | same |
| 4 | Wipe underline | hover/focus | footer links and the Next link in each band: scaleX in from the left, out to the right | 320ms expo.out | same |
| 5 | Lenis | fine pointer only | lerp .1, driven by gsap.ticker, lagSmoothing(0). Anchor jumps land flush with the top of a band. Touch and reduced motion use native scrolling (CSS smooth, off for reduced motion) | | off |
| 6 | h1 masked line reveal | load, after fonts.ready | SplitText lines with mask, yPercent 110 to 0, stagger .1 | 1.0s expo.out | static |
| 7 | Pinned scrub | removed (ADR-24) | | | |
| 8 | Scroll-linked transform | each band while it crosses the viewport, 961px and wider | the mounted plate drifts y +28px to -28px against its page | scrub 1, ease none | none |
| 9 | Hero load choreography | load | 0ms nav · 50ms eyebrow · 100ms h1 lines · 400ms lede · 550ms buttons (scale .95 to 1) · 0 to 1800ms the tree grows from its root (clip-path circle) · 650ms the first wren is on its perch | overlapped | scene drawn, bird perched |

## Signature details

- Tree: drawn once. It moves only when a bird lands or leaves (the limb dips and settles, 1.1s) or a gust passes (every 9 to 15s, limbs swing ±0.6° in sequence). Five canopy leaves fall on a slow CSS loop. A click, Enter or Space on the tree releases one bird and a twelve-leaf shower. Overlapping showers reuse only idle leaves, growing the pool from twelve up to 96 leaves as needed. At capacity, further activations use any free leaves and let all active falls finish; completed leaves become reusable. Reduced motion disables the shower.
- Flock (assets/birds.js): up to ten birds on a page-wide layer, one rAF loop, transforms only. A click anywhere pops a bird out; it hops, bows and flies an arc-length-sampled curve with flap bursts and tucked glides to a letter, a button edge, the top of a plate, the tree or its nest. Perched birds turn, flick the tail, bow, hop along an edge, blink, and flee a cursor within 70px. Every 3.5 to 6.5s two neighbours face each other and trade drawn symbols in bubbles; a lone bird sings drawn notes. Every fourth song gets the Snipflag bracket snap. Birds are silent on the hub (ADR-23).
- Roost: each bird flies to its own nest when the footer is on screen; its letter appears on landing.
- Meadow (assets/meadow.js): one rAF loop for the rabbit and the two chicks, paused off-screen, in hidden tabs and for reduced motion.
  - Rabbit: crouch, push-off, arc with pitch, reach and landing squash; spring ears and tail; sniffs, looks, sits tall, grooms, rests; startles away from a click.
  - Chick gait: the legs step with the ground covered (step 0.18 body widths, lengthening to 0.38 in a run), the body bobs once per step, and the head holds still in space then darts forward. A turn is a 0.2s hop, never thinner than 62% width.
  - Chick actions: peck (draw back, strike, lift, sometimes a swallow), scratch then peck, preen, stretch a wing and leg, ruffle, flutter, sparrow hops, a nap in the grass, wander around a home patch (black left, yellow right), curiosity about a nearby cursor, a hop back from a cursor on top of them, a look up when a bird lands in the tree.
  - Chick manners (ADR-38): bodies never overlap (at least 1 body width between centres, in practice 1.24 or more); a walk never goes through the friend (it stops 1.5 widths short); idle chicks closer than 1.7 widths turn away rather than stand nose to nose.
  - Chick games, each behind its own cool-down counted from page load: a hello from 1.35 widths apart with two nods (first after 45 to 80s, then every 75 to 130s; a heart on at most 40% of them and never within 150s of the last); a chase that stays 1.4 widths behind (every 35 to 70s); a leapfrog over the ducking friend (every 55 to 100s, desktop widths only).
  - A click on a chick: a flutter, then a hello with one heart from the chick that was clicked.
