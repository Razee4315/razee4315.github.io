# 03 Design tokens

Mirrored as custom properties in `assets/site.css` `:root`. No value may appear in CSS that is not listed here (except scene drawing coordinates).

| Token | Value | Role |
|---|---|---|
| --paper | #EEEBE3 | page background |
| --ink | #141414 | text, primary button |
| --stone | #6B6860 | muted text (4.9:1 on paper) |
| --rule | rgba(20,20,20,.14) | row rules |
| --sf / --pl / --pw / --vm / --cf | #FF9F43 / #6F8A4E / #246C60 / #D2452F / #1F4FD6 | project accents |
| --bark / --bark-dark | #4A3F35 / #2E2620 | branches |
| --leaf / --leaf-deep / --blossom | #7F9464 / #3F5A45 / #F2B8A2 | foliage |
| --font-display | "Archivo", wdth 118, wght 800 | h1, names |
| --font-text | "Archivo", wdth 100, wght 400 | body |
| --font-mono | "JetBrains Mono" 500 | codes, labels, buttons |
| --s-label / --s-body / --s-lede | 12px / 16px / clamp(1.05rem, 1.4vw, 1.25rem) | |
| --s-h1 / --s-name | clamp(3rem, 8.4vw, 8rem) / clamp(2.6rem, 11vw, 10rem) | |
| --track-display / --track-label | -0.035em / 0.08em | |
| --pad-x | 32px (16px under 700px) | |
| --section | clamp(6rem, 12vw, 12rem) | |
| --max / --gutter | 1440px / 24px | |
| --radius | 0 | |
| --ease-out | cubic-bezier(0.16, 1, 0.3, 1) | default (GSAP expo.out) |
| --ease-inout | cubic-bezier(0.77, 0, 0.175, 1) | on-screen moves (power4.inOut) |
| --dur-ui / --dur-in / --dur-out | 240ms / 900ms / 650ms | |
