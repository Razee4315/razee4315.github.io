# 06 Page specs (plus components, assets, content)

## / (index.html)

1. **Hero** (100dvh). Desktop: type in columns 1 to 6, scene in 6 to 12 bleeding off the right edge. Phones: type, then the scene at 60svh.
   - Mono strip: "SAQLAIN RAZEE — INDEPENDENT SOFTWARE" · "CATALOGUE 2026 · 05 ITEMS"
   - h1: "Five free tools." / "One small tree."
   - Lede: "I'm Saqlain. I make small, open-source apps for everyday annoyances. Pick one below, or invite a bird."
   - Buttons: "See the tools" (to #catalogue), "Invite a bird" (adds a bird; label shows n/10; disabled at 10 with "The tree is full").
   - Scene label: "Click the tree to invite a bird" · counter · sound toggle.
2. **Catalogue** (#catalogue): five rows, each one link: code, name, one line, spec line, animated logo, arrow. Desktop hover: the share image follows the cursor (480×252). Touch: share image inline under the text. Sticky "01/05" index on desktop.
   - SF-01 Snipflag: "Turn screenshots into Linear issues." · "Windows · macOS · Linux · MIT"
   - PL-02 Paperling: "A Markdown editor with live preview, math and diagrams." · "Desktop · Android · Apache-2.0"
   - PW-03 Paperwren: "Open PDF, Word, Excel and PowerPoint. No account, no ads." · "Android · Windows · MIT"
   - VM-04 Vuoom: "Screen recordings with automatic zoom. No watermark." · "Windows · Apache-2.0"
   - CF-05 coldframe: "Render Remotion videos on GitHub's machines, not your laptop." · "GitHub Actions · MIT"
3. **Colophon** (pinned): "Free to use. Source on GitHub. Made by one person, in public." with a scrubbed word reveal and a bird crossing.
4. **Footer**: name, GitHub, LinkedIn, "Hand-built on GitHub Pages", year.

## /404.html
Same tokens; one bird on a twig with a "?" bubble; links to all five; the case-fixing redirect stays.

## States
No JS or CDN failure: everything visible and static (boot safety net at 2.5s). Image failure: alt text, row still works. Ten birds: button disabled, label says the tree is full.

## Components
- Primary button: ink background, paper text, 0 radius, 48px tall, mono 12px uppercase. Hover background --pw. Focus-visible 2px ink outline, 3px offset. Active scale .98. Disabled: stone, aria-disabled.
- Ghost button: 1px inset ink, transparent.
- Row: grid [code | name + line | spec | logo | arrow], hairline top rule, hover/focus tint (accent at 12%) wiping left to right.
- Bird rig: tail, body, belly, wing, head (eye, glint, cheek, crest), beak (upper, lower), legs.
- Bubble: paper shape, 2px ink stroke, tail toward the beak; symbol drawn in the speaker's accent.

## Assets
- Five share images, copied from each project site and converted to 960×504 WebP (q80), with alt text naming the product.
- Five project logos inlined as SVG (aria-hidden inside labelled links).
- Wren rig redrawn from the Paperwren favicon geometry. Tree, leaves, blossoms, symbols drawn for this site. Grain: SVG turbulence data URI.
