# 02 Art direction: "Catalog, with a wren tree"

> Updated 2026-09-28 after owner review: the birds now fly across the whole page (ADR-11), the catalogue is full-bleed brand-colour rows (ADR-12), logos are animated characters (ADR-13), see 13-decision-log.md. Where this file and the log differ, the log wins.

Approved at Stop Gate 1 (Catalog, Crafted tier), then extended by the owner on 2026-09-28: the Paperwren bird becomes a living tree scene where visitors invite up to 10 birds that talk to each other. Re-specified here as one direction.

| Field | Decision | Source |
|---|---|---|
| Reference | teenage.engineering (catalogue codes), emilkowal.ski (plain list), cassie.codes (a living scene next to small text) | steals #1, #3, #7 |
| Feeling | Precise, warm, playful, handmade. A tidy product catalogue with a small living tree beside it. | |
| Palette | Paper `#EEEBE3` (bg), Ink `#141414` (text), Stone `#6B6860` (muted), Rule `rgba(20,20,20,.14)`. Project accents only on their own row or moment: SF `#FF9F43`, PL `#6F8A4E`, PW `#246C60`, VM `#D2452F`, CF `#1F4FD6`. Scene: Bark `#4A3F35`, Bark-dark `#2E2620`, Leaf `#7F9464`, Leaf-deep `#3F5A45`, Blossom `#F2B8A2`. | steal #5; accents sampled from each project's share image |
| Type | Display: Archivo (Omnibus-Type, variable, wdth 62 to 125) at wdth 118, wght 800. Text: Archivo wdth 100, wght 400. Labels: JetBrains Mono 500. | steal #6 |
| Type scale | Names clamp(2.6rem, 11vw, 10rem) = 160px on desktop; h1 clamp(3rem, 8.4vw, 8rem); body 16px; labels 12px. Ratio 10x. | |
| Grid | 12 columns, 24px gutter, max-width 1440px, 32px side padding (16px on phones). | |
| Density | Measured. Section padding clamp(6rem, 12vw, 12rem). | |
| Corners | 0 everywhere. Speech bubbles are drawn shapes and the only rounded things. | |
| Borders | Hairline rules between catalogue rows only. | steal #3 |
| Texture | SVG fractal-noise paper grain, fixed overlay, opacity .05, multiply. | original |
| Hero | Left-aligned split: type left (mono strip, h1, lede, two buttons), the tree scene right and bleeding off the right edge (the one container break). On phones the scene sits under the type. 100dvh. | techniques §1 "Left-aligned" + scene |
| SIGNATURE | **The wren tree.** A drawn branch system with leaves and blossoms sways in a slow wind. One wren (Paperwren's logo bird) sits on it. Clicking the tree or "Invite a bird" brings a new bird, up to 10, each a different style, flying in on a curved path with flapping wings to a free perch. Perched birds breathe, blink, hop, peck, look toward the cursor, and talk: one turns to another, opens its beak, and a bubble with a drawn symbol (note, heart, star, question, sun, leaf, a tiny project glyph) floats up; the other answers. | original, built on the Paperwren mark |
| Logo moments | Snipflag: capture brackets snap around a singing bird with a soft flash (a "screenshot"). Vuoom: its record dot blinks while its row is active. coldframe: the three frames step like a filmstrip. Paperling: the # bars draw in. Paperwren: hovering its row makes the logo bird hop. | original |
| Motion | Default expo.out; on-screen moves power4.inOut; flight sine.inOut on a MotionPath. Inventory in 05. | |
| Anti-list | No purple, no gradient text, no Inter, no three-card grid, no card borders, no soft drop shadows, no bounce or elastic easing, no emoji (symbols are drawn SVG), no stock images, no dark mode, no preloader, no full-page colour flood (reduced to a row tint so there is one signature). | anti-slop §2 |
| Risk | The scene could overpower the catalogue: it lives only in the hero and the catalogue is plain and big. Ten SVG birds on a weak phone: capped at 10, and the scene pauses off-screen and in hidden tabs. | |
