# Steal list: razee4315.github.io hub

Researched 2026-09-28. Job: a personal hub that sends visitors (from Reddit, GitHub, launch posts, Google) to one of five free, open-source projects. Archetype: portfolio (skill `site-archetypes.md` §3): prove taste, work must be viewable immediately, fast.

## Sites examined

| # | Site | Stack | Type | Palette (observed) | Memorable thing |
|---|---|---|---|---|---|
| 1 | teenage.engineering | custom | Custom "TE" grotesk + technical mono labels | #F5F5F5 paper, #121114 ink, #ED2024 signal red | Product codes (PO-33, EP-133, OB-4) make every product a catalog entry |
| 2 | marclou.com | Indie Page | System sans | White, black, colored logos | One hard fact per product card (monthly revenue) turns hobby projects into businesses |
| 3 | emilkowal.ski | Next.js, Motion | Custom sans + serif inline | #F5F4F4, #0B0B09, #989898 | Plain list of project name + one line, huge whitespace; nothing competes with the work |
| 4 | paco.me | Next.js | Sans / mono / serif vars | #1C1C1C, #FCFCFC, stepped grays | Near-empty dark page; the name is a whisper, and content choreographs in |
| 5 | basement.studio | Next.js, GSAP | Geist + Geist Mono, "flauta" display | #1A1A1A, #E6E6E6, #FF4D00 signal orange | Wireframe/dithered pixel rendering as texture; tiny mono labels; a single hot accent |
| 6 | cassie.codes | GSAP, three.js | system-ui + Courier New | #1E1E1E, #FFFFFF, warm liquid highlights | A slow, liquid, distorted colour field behind a small text panel |
| 7 | lusion.co | WebGL | Custom sans | #000, #FFF | Preloader with an enormous counter in the bottom-left corner |
| — | levels.io | — | — | — | Fetch blocked ("Access blocked"); replaced by marclou.com, the closest maker-hub analogue |

Adjacent vertical: teenage.engineering (hardware product catalogue), used for the naming system rather than the look.

## Moves to steal

| # | Move | From | Category | How it adapts here |
|---|---|---|---|---|
| 1 | Product codes as identity | 1 | content/type | Each project gets a catalogue code in mono: SF-01 Snipflag, PL-02 Paperling, PW-03 Paperwren, VM-04 Vuoom, CF-05 coldframe |
| 2 | One hard fact per item | 2 | content | A real spec line per project (platforms, licence, what it replaces). No invented numbers |
| 3 | List, not cards | 3 | layout | Projects as a full-width typographic index; rows separated by a hairline, no card chrome |
| 4 | Whisper-size name | 4 | type | Name is small in the corner; the project names are the huge type |
| 5 | Single hot accent on a neutral base | 5 | colour | Neutral base; colour comes only from the project being pointed at |
| 6 | Tiny mono labels | 1, 5 | type | Status labels ("desktop", "android", "MIT") in 11–12px mono caps |
| 7 | Liquid colour field | 6 | motion | A slow SVG-turbulence colour blob that eases to the hovered project's brand colour |
| 8 | Giant corner counter | 7 | motion | Not a preloader. An oversized "01/05" index pinned in a corner that updates as you move through projects |
| 9 | Hover image reveal | 3 (list) + common studio pattern | interaction | The project's real share image follows the cursor over its row (desktop only) |
| 10 | Masked line reveal on load | skill floor, seen on 5 | motion | Project names rise out of masks in sequence |

## Table stakes

Every project visible without scrolling far; one click to each site; GitHub link; fast; works on a phone.

## Deliberate deviations

- No avatar photo and no bio paragraph at the top (every personal site has both). The projects are the introduction.
- No three-card grid (the current page has it, and so does almost every maker hub).
- No dark-mode toggle. One mode, executed properly.

## Rejected

- Preloader (7): a five-link page has nothing to preload. It would be a stall that costs visitors.
- Revenue numbers (2): these are free projects; there are no honest numbers to show. GitHub stars could work later if fetched at build time.
- WebGL scene (5, 7): too heavy for a hub whose job is to hand people off quickly. The SVG colour field gets most of the effect for a fraction of the weight.
