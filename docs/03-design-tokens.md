# 03 Design tokens

> Brought back in line with the built site on 2026-10-03 (ADR-36). Type follows ADR-16 and ADR-21.

Mirrored as custom properties in `assets/site.css` `:root`. No value may appear in CSS that is not listed here (except scene drawing coordinates, the meadow animals' own colours and the per-band colours below).

| Token | Value | Role |
|---|---|---|
| --paper | #EEEBE3 | page background, nav |
| --ink | #141414 | text, primary button |
| --stone | #6B6860 | muted text (4.7:1 on paper). On the roost it is #5C5A52 (5.4:1 on --roost) |
| --rule | rgba(20,20,20,.14) | hairlines on paper |
| --card | #FBFAF6 | speech bubbles |
| --teal | #246C60 | the one accent on paper: italic "small", button hover, scene focus ring |
| --soil | #0C1F1B | ground under the grass; the catalogue starts on it |
| --roost | #E5E4D8 | footer |
| --font | "Bricolage Grotesque" (opsz 12-96, wght 400-800) | body, project names (800) |
| --serif | "Instrument Serif" 400, with italic | h1, roost heading and letters |
| --mono | "JetBrains Mono" 500 | codes, labels, buttons, URLs |
| --s-label / --s-body / --s-lede | 12px / 16px / clamp(1.05rem, 1.4vw, 1.25rem) | |
| --s-h1 / --s-name | clamp(3.4rem, 5.6vw, 6.4rem) / clamp(2.75rem, 5.2vw, 5rem) | the name is capped so its lockup fits a four-column copy block |
| --track-display / --track-label | 0 / 0.08em | Bricolage is already cut tight at display sizes; negative tracking made letters collide |
| --pad-x | 32px (16px under 700px) | |
| --max / --gutter | 1440px / 24px | 12 columns; nav, hero, bands and footer all sit on this grid |
| --nav-clear | 88px | top padding of every full-page section, so its first row clears the floating nav |
| radius | 0 | everywhere in the interface. Speech bubbles and scene drawings are the only rounded things |
| --ease-out | cubic-bezier(0.16, 1, 0.3, 1) | default (GSAP expo.out) |
| --dur-ui / --dur-wipe | 240ms / 320ms | hover and press / underline wipe. Reveals run 0.9s in GSAP |

## Band colours

Set inline on each band as `--bg`, `--fg`, `--hi`. A band uses exactly two colours plus one small accent.

| Band | --bg | --fg | --hi | Text contrast |
|---|---|---|---|---|
| SF-01 Snipflag | #0C1F1B | #EEF2EE | #FFB25B | 15.1:1 |
| PL-02 Paperling | #FF8C00 | #1C1206 | #FFF1D6 | 7.9:1 |
| PW-03 Paperwren | #2B6E66 | #F6EFE4 | #EC8A5A | 5.2:1 |
| VM-04 Vuoom | #0E0E0E | #F2F0EB | #E5484D | 17.0:1 |
| CF-05 coldframe | #1F4FD6 | #FFFFFF | #7FD6EE | 6.7:1 |

- `--fg` on `--bg`: all copy, the header and footer rules (`--fg` at 26%).
- `--bg` on `--fg` (the inverse pair): the Visit button and the plate that mounts the share image. Because the plate is always the band's opposite colour, a share image never sits directly on a band of its own colour.
- `--hi`: the 8px square beside the catalogue code. Logo marks are unboxed and use the band foreground, with retained brand details: the wren wing/belly/beak, Vuoom red dot, and coldframe pale-blue frames (#B8E9F6, #7FD6EE).
- Mono labels in a band are dimmed to 92% at most, which keeps every band at or above 4.5:1.

## Scene colours (drawing only, in `assets/birds.js`)

Bark #4A3F35, bark-dark #2E2620, bark-light #6E5E4E. Leaves #7F9464, #3F5A45, #A3B386, #5E7A56, #8FA372. Sun #F3D3A0 and #F6C98A. Birdhouse #E6D8C0 and #CDBB9E.
