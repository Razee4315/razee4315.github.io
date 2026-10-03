# 06 Page specs (plus components, assets, content)

> Brought back in line with the built site on 2026-10-03 (ADR-36 to ADR-39). Where this file and the decision log differ, the log wins.

## / (index.html)

Seven full pages on desktop: the hero, five project spreads and the roost. Every section is at least `100svh` and sits on the same 12-column grid (1440px, 24px gutter, 32px side padding; 16px under 700px).

0. **Nav** (floating, fixed): wren mark and name, jump links to the five bands (the one on screen is underlined; hidden at 960px and under), GitHub. Solid paper with a hairline, no shadow. As wide as the page grid. Hides on the way down, returns on the way up.
1. **Hero** (exactly the first screen when the window is tall enough). Top row on the grid: eyebrow and h1 on the left, lede and two buttons on the right with the buttons standing on the headline's last baseline. Below it the tree scene takes all the height that is left (at least clamp(320px, 30vw, 520px)), so the grass and the animals meet the fold. 960px and under: the type stacks and the scene is at least clamp(280px, 60vw, 480px).
   - Eyebrow: "Saqlain Abbas · independent software"
   - h1: "Five free tools." / "One *small* tree."
   - Lede: "I'm Saqlain. I make small, open-source apps for everyday annoyances. Pick one below, or click anywhere to set a bird loose."
   - Buttons: "See the tools" (to #catalogue), "Invite a bird" (adds a bird from the birdhouse; at ten it reads "The flock is full").
   - Scene: the tree (click or Enter: one bird plus a leaf shower), a rabbit left of the trunk, a black and a yellow chick right of it, full-width grass on dark soil.
2. **Catalogue** (#catalogue): five bands, one full page each, in the project's own colours (docs/03). The soil under the grass is the first band's colour, so the tree stands on the catalogue. Each band is a spread:
   - Header row with a hairline under it: accent square, code, kind, and "01/05" at the right.
   - Copy (4 columns): the lockup (a square logo tile as tall as the capitals, on the name's baseline), one description, the Visit button.
   - Plate (7 columns): the share image mounted in the band's text colour with a caption strip (the site address and an out-arrow). The plate links to the project (not a tab stop; the name and Visit are).
   - Footer row with a hairline over it: platforms and licence at the left, "Next · [project]" at the right (the last one goes to the roost).
   - Copy and plate swap sides on even bands. 960px and under: one column, plate under the copy, still at least one screen tall.
   - SF-01 Snipflag: "Turn screenshots into Linear issues. Snip anything on screen, mark it up, pixelate private bits, and send it straight to Linear." · "Windows · macOS · Linux · MIT"
   - PL-02 Paperling: "A calm Markdown editor with live preview, math, diagrams and optional AI. Open a file and start writing." · "Desktop · Android · Apache-2.0"
   - PW-03 Paperwren: "Open PDF, Word, Excel and PowerPoint in a blink. No account, no ads, no internet access, no permissions." · "Android · Windows · MIT"
   - VM-04 Vuoom: "Record polished demos with automatic zoom, quick edits, offline captions and GIF or MP4 export. No watermark." · "Windows · Apache-2.0"
   - CF-05 coldframe: "Render Remotion videos on free GitHub machines instead of your laptop. One setup command, parallel renders, every frame checked." · "GitHub Actions · MIT"
3. **The evening roost** (#roost, footer, one full page): "The evening roost" / "A place to land." / "Ten little nests. A hello from every bird that comes home." Ten nests in two rows of five spell HELLO RAZEE as birds land. A status line, an Invite button, then on the page grid: name and "Small tools. Built in public.", GitHub, LinkedIn, Back to the tree.

## /404.html
Same paper, ink, stone and typefaces (Instrument Serif headline, Bricolage text, mono labels); one bird on a twig with a "?" bubble; links to all five; the case-fixing redirect stays.

## States
No JS or CDN failure: everything visible and static (boot safety net at 2.5s). Image failure: alt text, the band still works. Ten birds: Invite is disabled and says the flock is full. Reduced motion: no smooth scroll, no reveals, animals posed, a chick click shows a still heart, birds are placed rather than flown.

## Components
- Primary button: ink background, paper text, 0 radius, 48px tall, mono 12px uppercase. Hover background --teal. Focus-visible 2px outline in the current colour, 3px offset. Active scale .97. Disabled: stone outline and text.
- Ghost button: 1.5px inset ink, transparent; hover fills ink.
- Visit button (in a band): --fg background, --bg text, a drawn arrow that nudges on hover.
- Plate: --fg mount, 10px (8px on small screens), caption strip 40px with the address in lowercase mono and an out-arrow in --bg.
- Arrows: one drawn SVG family (2px round stroke) for every arrow on the page. No font glyphs for arrows or music notes.
- Logo tile: square, the brand mark on a tile that contrasts with the band (light tiles on dark bands, the dark tile on orange).
- Bird rig: tail, body, belly, folded wing, flight wings (near and far), crest, beak, eye, legs.
- Chick rig: shadow, two legs, tail, body, belly, wing, head (tuft, cheek, eye, two-part beak), heart.
- Bubble: card-coloured shape, 2.5px ink stroke, tail toward the beak; symbol drawn in the speaker's accent.

## Assets
- Five share images, copied from each project site and converted to 960×504 WebP (q80), with alt text naming the product.
- Five project logos inlined as SVG (aria-hidden beside the linked name).
- Wren rig redrawn from the Paperwren favicon geometry. Tree, leaves, animals, nests, symbols and arrows drawn for this site. Grain: SVG turbulence data URI.
