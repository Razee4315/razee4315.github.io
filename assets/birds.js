/* The wren tree and the flock (docs/02 signature).
   Tree: drawn once as SVG; it only moves when a bird lands or leaves (the branch dips) or a gust passes.
   Flock: up to ten birds on a page-wide sky layer, in the spirit of the flying wren on Paperwren's site.
   Click anywhere and a bird pops out there, hops and flies across to perch on a letter, an edge, the tree
   or the footer. Birds hop, bow, turn, sing, talk to each other with drawn symbols, flee from a close
   cursor, and follow you down the page. One requestAnimationFrame loop; transforms only.
   Exposes window.Birds = { tree(svg), flock(opts), STYLES }. No library needed. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  var damp = function (a, b, k, dt) { return a + (b - a) * (1 - Math.exp(-k * dt)); };
  var f1 = function (v) { return (Math.round(v * 10) / 10).toString(); };
  function seeded(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
    var f = function (c) { return clamp(Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt), 0, 255); };
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================================================================== TREE */
  var C = { card: '#FBFAF6', ink: '#141414', stone: '#6B6860', bark: '#4A3F35', barkDark: '#2E2620', barkLight: '#6E5E4E',
    leaves: ['#7F9464', '#3F5A45', '#A3B386', '#5E7A56', '#8FA372'], blossom: '#F2B8A2', blossomCore: '#FF9F43' };

  function bz(p, t) { var u = 1 - t; return { x: u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0], y: u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1] }; }
  function bzd(p, t) { var u = 1 - t; return { x: 3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]), y: 3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1]) }; }
  function nrm(d) { var L = Math.hypot(d.x, d.y) || 1; return { x: -d.y / L, y: d.x / L }; }
  function up(n) { return n.y > 0 ? { x: -n.x, y: -n.y } : n; }
  function widthAt(b, t) { return b.w0 + (b.w1 - b.w0) * Math.pow(t, .85); }
  function limbPath(b, rng) {
    var N = 26, Ls = [], Rs = [], ph = rng() * 6;
    for (var i = 0; i <= N; i++) {
      var t = i / N, c = bz(b.p, t), n = nrm(bzd(b.p, t)), w = widthAt(b, t) / 2 * (1 + .07 * Math.sin(t * 11 + ph));
      Ls.push([c.x + n.x * w, c.y + n.y * w]); Rs.push([c.x - n.x * w, c.y - n.y * w]);
    }
    var r = Math.max(widthAt(b, 1) / 2, .5), e = Rs[N];
    return 'M' + Ls.map(function (q) { return f1(q[0]) + ' ' + f1(q[1]); }).join('L') + 'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(e[0]) + ' ' + f1(e[1]) +
      'L' + Rs.slice().reverse().map(function (q) { return f1(q[0]) + ' ' + f1(q[1]); }).join('L') + 'Z';
  }

  function tree(svg) {
    var world = svg.querySelector('[data-world]');
    var rng = seeded(20260928);
    var perches = [], limbs = {};
    // Leaves are merged into one path per colour: a handful of nodes instead of hundreds.
    var foliage = [], currentFoliage, leafSources = [];
    function foliageFor(limb) {
      if (!limb.foliage) { limb.foliage = { parent: limb.g, leaves: C.leaves.map(function () { return ''; }), ribs: '', stems: '' }; foliage.push(limb.foliage); }
      currentFoliage = limb.foliage;
    }

    var bg = el('g', {}, world), trunkG = el('g', {}, world);
    el('circle', { cx: 1060, cy: 300, r: 170, fill: '#F3D3A0', opacity: .42 }, bg);
    el('circle', { cx: 1060, cy: 300, r: 112, fill: '#F6C98A', opacity: .32 }, bg);

    function leafAt(x, y, deg, sc, ci) {
      var a = deg * Math.PI / 180, c = Math.cos(a) * sc, s = Math.sin(a) * sc;
      var P = function (u, v) { return f1(x + u * c - v * s) + ' ' + f1(y + u * s + v * c); };
      currentFoliage.leaves[ci] += 'M' + P(0, 0) + 'C' + P(8, -9) + ' ' + P(24, -10) + ' ' + P(36, 0) + 'C' + P(24, 10) + ' ' + P(8, 9) + ' ' + P(0, 0) + 'Z';
      currentFoliage.ribs += 'M' + P(0, 0) + 'Q' + P(14, -1) + ' ' + P(31, 0);
      leafSources.push({ x: x, y: y, angle: deg, scale: sc, color: C.leaves[ci] });
    }
    function addLimb(name, spec, parent) {
      var g = el('g', {}, parent), d = limbPath(spec, rng);
      el('path', { d: d, fill: C.barkDark, transform: 'translate(0 3)' }, g);
      el('path', { d: d, fill: C.bark }, g);
      var hl = '';
      for (var i = 1; i <= 22; i++) { var t = i / 26, c = bz(spec.p, t), n = up(nrm(bzd(spec.p, t))), w = widthAt(spec, t) / 2 * .5; hl += (i === 1 ? 'M' : 'L') + f1(c.x + n.x * w) + ' ' + f1(c.y + n.y * w); }
      el('path', { d: hl, fill: 'none', stroke: C.barkLight, 'stroke-width': Math.max(1.4, spec.w0 * .07), 'stroke-linecap': 'round', opacity: .75 }, g);
      var limb = { name: name, g: g, spec: spec, px: spec.p[0][0], py: spec.p[0][1] };
      g.style.transformBox = 'view-box'; g.style.transformOrigin = f1(limb.px) + 'px ' + f1(limb.py) + 'px';
      if (name) limbs[name] = limb;
      return limb;
    }
    // Each spray grows from a real branch point. Alternating leaves have visible petioles,
    // air between their silhouettes, and smaller new growth near the shoot tip.
    function cluster(x, y, baseDeg, n, spread) {
      for (var j = 0; j < (n >= 9 ? 3 : 1); j++) {
        var angle = (baseDeg + (j - (n >= 9 ? 1 : 0)) * 38 + (rng() - .5) * 18) * Math.PI / 180;
        var len = 46 + rng() * 40, dx = Math.cos(angle), dy = Math.sin(angle);
        var curve = [[x, y], [x + dx * len * .35 - dy * 9, y + dy * len * .35 + dx * 9],
          [x + dx * len * .7 - dy * 7, y + dy * len * .7 + dx * 7], [x + dx * len, y + dy * len]];
        currentFoliage.stems += 'M' + f1(x) + ' ' + f1(y) + 'C' + curve.slice(1).map(function (p) { return f1(p[0]) + ' ' + f1(p[1]); }).join(' ');
        for (var k = 0; k < 6; k++) {
          var t = .2 + k * .135, point = bz(curve, t), tangent = bzd(curve, t);
          var a = Math.atan2(tangent.y, tangent.x) + (k % 2 ? 1 : -1) * ( .75 + rng() * .35);
          var petiole = 4 + rng() * 3, lx = point.x + Math.cos(a) * petiole, ly = point.y + Math.sin(a) * petiole;
          currentFoliage.stems += 'M' + f1(point.x) + ' ' + f1(point.y) + 'L' + f1(lx) + ' ' + f1(ly);
          leafAt(lx, ly, a * 180 / Math.PI, (.48 + rng() * .32) * (1 - t * .26), Math.floor(rng() * C.leaves.length));
        }
        leafAt(curve[3][0], curve[3][1], angle * 180 / Math.PI, .42 + rng() * .16, 2);
      }
    }
    function twig(parent, t, angle, len, bend) {
      foliageFor(parent);
      var s = parent.spec, c = bz(s.p, t), a = angle * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx, end = [c.x + dx * len, c.y + dy * len];
      var spec = { p: [[c.x, c.y], [c.x + dx * len * .35 + px * bend * .3, c.y + dy * len * .35 + py * bend * .3], [end[0] - dx * len * .3 + px * bend, end[1] - dy * len * .3 + py * bend], end], w0: Math.min(widthAt(s, t) * .6, 13), w1: 2.2 };
      addLimb(null, spec, parent.g);
      cluster(end[0], end[1], angle, 16, 165);
      var mid = bz(spec.p, .55); cluster(mid.x, mid.y, angle + (rng() > .5 ? 70 : -70), 6, 90);
    }
    function perch(limb, t) {
      var s = limb.spec, c = bz(s.p, t), n = up(nrm(bzd(s.p, t))), w = widthAt(s, t) / 2;
      perches.push({ x: c.x + n.x * (w - 1), y: c.y + n.y * (w - 1), layer: limb.g, limb: limb });
    }

    // A straight trunk in the middle; two branches reach left, two reach right, a leader grows up the centre.
    var trunk = addLimb('trunk', { p: [[800, 906], [800, 790], [800, 665], [800, 540]], w0: 74, w1: 42 }, trunkG);
    el('ellipse', { cx: 812, cy: 800, rx: 9, ry: 14, fill: C.barkDark, opacity: .85 }, trunk.g);
    var D = addLimb('D', { p: [[798, 770], [740, 752], [680, 756], [612, 730]], w0: 20, w1: 4 }, trunk.g);
    var L1 = addLimb('L1', { p: [[792, 640], [650, 612], [480, 566], [300, 472]], w0: 32, w1: 5 }, trunk.g);
    var R1 = addLimb('R1', { p: [[808, 632], [950, 604], [1120, 556], [1300, 470]], w0: 32, w1: 5 }, trunk.g);
    var L2 = addLimb('L2', { p: [[796, 575], [704, 474], [596, 364], [488, 252]], w0: 26, w1: 5 }, trunk.g);
    var R2 = addLimb('R2', { p: [[804, 570], [898, 472], [1006, 362], [1114, 248]], w0: 26, w1: 5 }, trunk.g);
    var T = addLimb('T', { p: [[800, 560], [806, 430], [792, 300], [806, 150]], w0: 30, w1: 5 }, trunk.g);
    twig(L1, .34, -108, 92, 12); twig(L1, .6, -122, 100, -12); twig(L1, .8, 62, 70, 10); twig(L1, .47, 70, 66, -8);
    cluster(300, 472, 200, 14, 170);
    twig(R1, .34, -72, 92, -12); twig(R1, .6, -58, 100, 12); twig(R1, .8, 118, 70, -10); twig(R1, .47, 110, 66, 8);
    cluster(1300, 470, -20, 14, 170);
    twig(L2, .4, -150, 82, 10); twig(L2, .66, -64, 90, -10); twig(L2, .5, 150, 64, 8);
    cluster(488, 252, 225, 14, 170);
    twig(R2, .4, -30, 82, -10); twig(R2, .66, -116, 90, 10); twig(R2, .5, 30, 64, -8);
    cluster(1114, 248, -45, 14, 170);
    twig(T, .45, -158, 82, 10); twig(T, .55, -22, 82, -10); twig(T, .75, -140, 64, 8); twig(T, .8, -40, 64, -8);
    cluster(806, 150, -90, 16, 190);
    foliageFor(D);
    cluster(612, 730, 190, 10, 160);

    foliage.forEach(function (f) {
      var g = el('g', { 'data-foliage': '' }, f.parent);
      el('path', { d: f.stems, fill: 'none', stroke: C.barkLight, 'stroke-width': 1.4, 'stroke-linecap': 'round' }, g);
      f.leaves.forEach(function (d, i) { el('path', { d: d, fill: C.leaves[i] }, g); });
      el('path', { d: f.ribs, fill: 'none', stroke: '#38503A', 'stroke-width': .65, opacity: .45 }, g);
    });

    // A few real canopy positions seed falling leaves. Only transforms/opacity animate;
    // foliage and its fine stems stay in their limb group during gusts and bird landings.
    for (var fi = 0; fi < 5; fi++) {
      var source = leafSources[Math.floor((fi + .5) * leafSources.length / 5)];
      var anchor = el('g', { transform: 'translate(' + f1(source.x) + ' ' + f1(source.y) + ')' }, world);
      var falling = el('g', { 'class': 'falling-leaf' }, anchor);
      falling.style.setProperty('--drop', f1(920 - source.y) + 'px');
      falling.style.setProperty('--drift', (fi % 2 ? -1 : 1) * (35 + fi * 12) + 'px');
      falling.style.animationDuration = (12 + fi * 1.7) + 's';
      falling.style.animationDelay = (2 + fi * 2.8) + 's';
      el('path', { d: 'M0 0C8 -9 24 -10 36 0C24 10 8 9 0 0Z', fill: source.color,
        transform: 'rotate(' + f1(source.angle) + ') scale(' + f1(source.scale) + ')' }, falling);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { svg.classList.toggle('tree-active', entries[0].isIntersecting); }).observe(svg);
    } else svg.classList.add('tree-active');

    [.3, .56, .8].forEach(function (t) { perch(L1, t); });
    [.3, .58, .8].forEach(function (t) { perch(R1, t); });
    [.46, .76].forEach(function (t) { perch(L2, t); });
    [.46, .76].forEach(function (t) { perch(R2, t); });
    perch(T, .66); perch(D, .66);

    // Birdhouse hanging under the right low branch.
    var house = (function () {
      var t = .44, c = bz(R1.spec.p, t), n = up(nrm(bzd(R1.spec.p, t))), w = widthAt(R1.spec, t) / 2, hx = c.x - n.x * w, hy = c.y - n.y * w, ry = hy + 54;
      var g = el('g', {}, R1.g);
      g.style.transformBox = 'view-box'; g.style.transformOrigin = f1(hx) + 'px ' + f1(hy) + 'px';
      el('path', { d: 'M' + f1(hx) + ' ' + f1(hy) + 'V' + f1(ry + 6), stroke: C.stone, 'stroke-width': 2.2 }, g);
      el('rect', { x: f1(hx - 36), y: f1(ry + 28), width: 72, height: 74, fill: '#E6D8C0' }, g);
      el('path', { d: 'M' + f1(hx - 18) + ' ' + f1(ry + 30) + 'V' + f1(ry + 102) + 'M' + f1(hx + 18) + ' ' + f1(ry + 30) + 'V' + f1(ry + 102), stroke: '#CDBB9E', 'stroke-width': 2 }, g);
      el('rect', { x: f1(hx - 36), y: f1(ry + 96), width: 72, height: 6, fill: '#CDBB9E' }, g);
      el('path', { d: 'M' + f1(hx) + ' ' + f1(ry) + 'L' + f1(hx - 52) + ' ' + f1(ry + 38) + 'H' + f1(hx + 52) + 'Z', fill: C.barkDark }, g);
      el('path', { d: 'M' + f1(hx - 44) + ' ' + f1(ry + 32) + 'L' + f1(hx) + ' ' + f1(ry + 4), stroke: C.bark, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
      el('circle', { cx: f1(hx), cy: f1(ry + 60), r: 13, fill: C.barkDark }, g);
      el('circle', { cx: f1(hx + 2), cy: f1(ry + 62), r: 9, fill: '#141414' }, g);
      el('path', { d: 'M' + f1(hx - 3) + ' ' + f1(ry + 82) + 'h20', stroke: C.bark, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
      perches.push({ x: hx, y: ry + 1, layer: g, limb: null, house: true });
      return { g: g, hole: { x: hx, y: ry + 62 } };
    })();

    // Full-width grass stays at the hero baseline independently of the tree aspect ratio.
    // Three merged paths keep hundreds of blades inexpensive; drawn only once.
    var ground = svg.parentNode.querySelector('[data-ground]'), grass = ['', '', ''];
    if (ground) {
      for (var gx = -6; gx <= 1606; gx += 3) {
        var h = 12 + rng() * 46, lean = (rng() - .5) * 24, ci = Math.floor(rng() * 3);
        grass[ci] += 'M' + f1(gx) + ' 82Q' + f1(gx + lean * .25) + ' ' + f1(82 - h * .7) + ' ' + f1(gx + lean) + ' ' + f1(82 - h);
      }
      grass.forEach(function (d, i) { el('path', { d: d, fill: 'none', stroke: ['#8FA372', '#7F9464', '#5E7A56'][i], 'stroke-width': 2, 'stroke-linecap': 'round' }, ground); });
      el('path', { d: 'M0 69Q200 66 400 69T800 69T1200 69T1600 69V82H0Z', fill: '#0C1F1B' }, ground);
    }

    function client(node, x, y) { var m = node.getScreenCTM(); return m ? { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f } : null; }
    function swing(g, deg, ms) {
      if (reduce || !g.animate) return;
      g.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(' + deg + 'deg)' }, { transform: 'rotate(' + (-deg * .45) + 'deg)' }, { transform: 'rotate(' + (deg * .18) + 'deg)' }, { transform: 'rotate(0deg)' }],
        { duration: ms, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }
    return {
      count: perches.length,
      perch: function (i) { var p = perches[i]; return client(p.layer, p.x, p.y); },
      hole: function () { return client(house.g, house.hole.x, house.hole.y); },
      // A landing or take-off pushes the branch; perches left of the pivot dip counter-clockwise.
      bump: function (i, strength) {
        var p = perches[i];
        if (p.house) { swing(house.g, 5 * strength, 1400); return; }
        swing(p.limb.g, (p.x < p.limb.px ? -1 : 1) * 1.3 * strength, 1100);
      },
      houseSwing: function () { swing(house.g, 7, 1600); },
      gust: function () { ['L1', 'L2', 'T', 'R2', 'R1'].forEach(function (k, i) { var l = limbs[k]; setTimeout(function () { swing(l.g, (k.charAt(0) === 'R' ? 1 : -1) * .6, 2600); }, i * 140); }); }
    };
  }

  /* ================================================================== BIRDS */
  // 64-unit bird after the Paperwren flyer: near/far wings in flight, a folded wing when perched. Feet at (32, 59).
  var P = {
    wing: 'M44 32C44 20 38.5 6.5 22-4C24 1 22.5 4 24.5 6.5C22 8.2 22 11.2 24.5 13C22 15 22.5 18 25 19.5C23 21.5 23.5 24.5 26.5 25.5C25 27.5 26 30 28.5 31L30 34Z',
    coverts: 'M43.5 32.5C43 25 40 17.5 34 11C31.5 17.5 30.5 25 31.5 33.5Z',
    tail: 'M27 27.5L12.6 9.6Q10.8 7.4 8.6 8.8L6.6 10.4Q4.6 12 6 14.2L19.5 33.5Z',
    tailShort: 'M25 31L16 21Q14.5 19.5 13 20.5L11.5 21.8Q10 23 11.2 24.6L19.5 35.5Z',
    legs: 'M29 53L27.5 59M35 53L36 59M27.5 59l-2 .6M36 59l2 .6',
    body: 'M50.5 19C48 12.5 39 11 35 17C32.5 21 29 24.5 24 26.5C15.5 30 13 38 15.5 44.5C18.5 51.5 25.5 55 33 54.5C44 54 51.5 45.5 51.5 34C51.5 29.5 52.5 26 53.5 24Z',
    belly: 'M52.6 25C51.6 28 51.5 31 51.5 34C51.5 45.5 44 53.5 33 54.5C39.5 50.5 43.5 44.5 44.8 37.5C46 31.5 48.5 27 52.6 25Z',
    bodyRound: 'M44 14C51.5 14 55 22 54 30C52.5 43 44 54.5 32.5 54.5C21 54.5 14.5 47.5 15.5 39.5C16.5 31.5 22 27.5 28 25.5C32 18.5 37 14 44 14Z',
    bellyRound: 'M53.6 29C54 40.5 47 51.5 37 54C43.5 48 46.5 41 46.5 34C46.5 30 48.5 27.5 51 26.5C52.5 27 53.3 27.8 53.6 29Z',
    fold: 'M45 34C41 27.5 29 27 21 33.5L14.5 38C23 45.5 38 45.5 45 34Z',
    stripes: 'M22.5 36C28.5 33.8 36 33.4 42 34.4M25 39.2C30.5 37.8 36 37.8 40.5 38.4',
    beak: 'M51.4 19Q56 20.2 59.5 22.6Q55.5 23.6 52.4 24.4Z',
    crest: {
      tuft: 'M38.5 13.8C37 9.2 39 6 41.8 5C41.3 7.4 42.2 9 43.8 10C43.4 7 45.6 5 48 5.5C45.8 8 45.6 10.7 44.6 13.8Z',
      plume: 'M39 14.2C36 8.7 36.5 3.7 39.5 .7C39.5 4.7 41.3 7.7 43 9.7C43.2 5.7 45.4 3 48.5 2.4C46.4 5.8 45.8 9.4 44.8 13.8Z'
    }
  };
  var STYLES = [
    { name: 'Wren',     body: '#F6EFE4', belly: '#FFFFFF', dark: '#174A44', tail: '#174A44', beak: '#EC8A5A', eye: '#174A44', legs: '#174A44', accent: '#246C60', size: 1,    pitch: 3000 },
    { name: 'Apricot',  body: '#FFB25B', belly: '#FFE2BD', dark: '#0C1F1B', tail: '#0C1F1B', beak: '#2E2620', eye: '#0C1F1B', legs: '#2E2620', accent: '#E07A1F', crest: 'tuft', crestColor: '#0C1F1B', cheek: '#F2856B', size: .95, pitch: 3400 },
    { name: 'Cobalt',   body: '#8FD9EF', belly: '#E7F8FC', dark: '#1D5FD0', tail: '#1FA0DC', beak: '#FFB25B', eye: '#0E2A6B', legs: '#0E2A6B', accent: '#1F4FD6', crest: 'plume', crestColor: '#1D5FD0', stripes: '#7FD6EE', size: 1.05, pitch: 2650 },
    { name: 'Recorder', body: '#F2F0EB', belly: '#FFFFFF', dark: '#0E0E0E', tail: '#0E0E0E', beak: '#E5484D', eye: '#0E0E0E', legs: '#0E0E0E', accent: '#D2452F', crest: 'dot', crestColor: '#E5484D', size: .97, pitch: 3250 },
    { name: 'Marker',   body: '#FFF1D6', belly: '#FFFFFF', dark: '#00A9C4', tail: '#FF8C00', beak: '#FF8C00', eye: '#1F3A2F', legs: '#1F3A2F', accent: '#E07A00', crest: 'tuft', crestColor: '#FF8C00', stripes: '#8BE7F2', size: .92, pitch: 3700 },
    { name: 'Moss',     body: '#C7D3A4', belly: '#EEF2DD', dark: '#3F5A45', tail: '#3F5A45', beak: '#D86C48', eye: '#2A3A2C', legs: '#4A3F35', accent: '#5E7A42', cheek: '#F2B8A2', size: 1.1, pitch: 2400 },
    { name: 'Ink',      body: '#2B2A27', belly: '#EEEBE3', dark: '#141414', tail: '#141414', beak: '#FFB25B', eye: '#141414', eyeRing: '#EEEBE3', legs: '#141414', accent: '#141414', size: 1.02, pitch: 2050 },
    { name: 'Blossom',  body: '#F4BFAA', belly: '#FCE7DD', dark: '#A5594A', tail: '#A5594A', beak: '#4A3F35', eye: '#3B2622', legs: '#4A3F35', accent: '#C2574A', crest: 'plume', crestColor: '#A5594A', cheek: '#E77F6A', size: .96, pitch: 3500 },
    { name: 'Goldie',   body: '#F3C94C', belly: '#FBECB2', dark: '#6B4E16', tail: '#6B4E16', beak: '#E26D3D', eye: '#3A2A0B', legs: '#6B4E16', accent: '#B8861A', crest: 'tuft', crestColor: '#6B4E16', stripes: '#F9DD86', size: 1, pitch: 3100 },
    { name: 'Chick',    body: '#FBE7A1', belly: '#FFF7D9', dark: '#EBBF4E', tail: '#EBBF4E', beak: '#EC8A5A', eye: '#3A2A0B', legs: '#EC8A5A', accent: '#D99A1E', crest: 'sprout', crestColor: '#3F5A45', cheek: '#F4A98E', round: true, size: .78, pitch: 4300 }
  ];

  function birdSVG(st) {
    var svg = el('svg', { viewBox: '0 0 64 64', overflow: 'visible', 'aria-hidden': 'true' });
    var far = el('g', { style: 'display:none' }, svg); el('path', { d: P.wing, fill: shade(st.dark, -.25) }, far);
    var tail = el('g', {}, svg); el('path', { d: st.round ? P.tailShort : P.tail, fill: st.tail }, tail);
    var legs = el('g', {}, svg); el('path', { d: P.legs, stroke: st.legs, 'stroke-width': 2.2, 'stroke-linecap': 'round', fill: 'none' }, legs);
    el('path', { d: st.round ? P.bodyRound : P.body, fill: st.body }, svg);
    el('path', { d: st.round ? P.bellyRound : P.belly, fill: st.belly }, svg);
    if (st.cheek) el('ellipse', { cx: 48.4, cy: 25.6, rx: 2.3, ry: 1.4, fill: st.cheek, opacity: .85 }, svg);
    var fold = el('g', {}, svg); el('path', { d: P.fold, fill: st.dark }, fold);
    if (st.stripes) el('path', { d: P.stripes, stroke: st.stripes, 'stroke-width': 1.2, 'stroke-linecap': 'round', fill: 'none', opacity: .9 }, fold);
    var near = el('g', { style: 'display:none' }, svg); el('path', { d: P.wing, fill: st.dark }, near); el('path', { d: P.coverts, fill: shade(st.dark, .22) }, near);
    if (st.crest === 'tuft' || st.crest === 'plume') el('path', { d: P.crest[st.crest], fill: st.crestColor }, svg);
    if (st.crest === 'dot') { el('circle', { cx: 40.5, cy: 12.2, r: 2.9, fill: st.crestColor }, svg); el('circle', { cx: 39.7, cy: 11.4, r: .8, fill: '#fff', opacity: .6 }, svg); }
    if (st.crest === 'sprout') { el('path', { d: 'M40 14.5C39 10.5 40.6 8 43.2 7.6', stroke: st.crestColor, 'stroke-width': 1.2, 'stroke-linecap': 'round', fill: 'none' }, svg); el('path', { d: 'M43.2 7.6C44.8 5.4 47.8 5.1 49.8 6.1C48.4 8.1 45.8 8.6 43.2 7.6Z', fill: '#7F9464' }, svg); }
    el('path', { d: P.beak, fill: st.beak }, svg);
    var eye = el('g', {}, svg);
    if (st.eyeRing) el('circle', { cx: 45, cy: 19.5, r: 3.3, fill: st.eyeRing }, eye);
    el('circle', { cx: 45, cy: 19.5, r: 2.1, fill: st.eye }, eye);
    el('circle', { cx: 45.7, cy: 18.8, r: .7, fill: '#fff' }, eye);
    return { svg: svg, near: near, far: far, fold: fold, tail: tail, legs: legs, eye: eye };
  }
  function wingY(ph) { var t = ph - Math.floor(ph), n = t < .42 ? t / .42 * .5 : .5 + (t - .42) / .58 * .5; return .075 + .925 * Math.cos(n * 2 * Math.PI); }

  /* Drawn symbols for speech bubbles (24x24). */
  var SYM = {
    note: function (g, c) { el('path', { d: 'M10 17.2a3.2 3.2 0 1 1-1.8-2.9V4.5l9.6-2.2v11.9a3.2 3.2 0 1 1-1.8-2.9V6.9L10 8.3z', fill: c }, g); },
    heart: function (g, c) { el('path', { d: 'M12 21s-7.5-4.6-9.6-9.2C.8 8 3 4.5 6.6 4.5c2.2 0 3.8 1.2 5.4 3.2 1.6-2 3.2-3.2 5.4-3.2 3.6 0 5.8 3.5 4.2 7.3C19.5 16.4 12 21 12 21z', fill: c }, g); },
    star: function (g, c) { el('polygon', { points: '12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6', fill: c }, g); },
    sparkle: function (g, c) { el('path', { d: 'M12 1.5 13.9 10.1 22.5 12 13.9 13.9 12 22.5 10.1 13.9 1.5 12 10.1 10.1z', fill: c }, g); },
    sun: function (g, c) { el('circle', { cx: 12, cy: 12, r: 4.6, fill: c }, g); var d = ''; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; d += 'M' + f1(12 + Math.cos(a) * 7.4) + ' ' + f1(12 + Math.sin(a) * 7.4) + 'L' + f1(12 + Math.cos(a) * 10.6) + ' ' + f1(12 + Math.sin(a) * 10.6); } el('path', { d: d, stroke: c, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g); },
    leaf: function (g, c) { el('path', { d: 'M4 20C4 10.5 10 4 20.5 3.5 20 14 13.5 20 4 20z', fill: c }, g); el('path', { d: 'M5.5 18.5 15 9', stroke: '#FBFAF6', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, g); },
    question: function (g, c) { el('path', { d: 'M8.2 8.4a3.9 3.9 0 1 1 5.9 3.3c-1.3.8-2 1.6-2 3.1', stroke: c, 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none' }, g); el('circle', { cx: 12.1, cy: 19.6, r: 1.9, fill: c }, g); },
    bang: function (g, c) { el('path', { d: 'M12 3.5v10.5', stroke: c, 'stroke-width': 3.4, 'stroke-linecap': 'round' }, g); el('circle', { cx: 12, cy: 19.6, r: 2, fill: c }, g); },
    dots: function (g, c) { [5, 12, 19].forEach(function (x) { el('circle', { cx: x, cy: 13, r: 2.5, fill: c }, g); }); },
    code: function (g, c) { el('path', { d: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16', stroke: c, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, g); },
    sf: function (g) { el('rect', { width: 24, height: 24, rx: 5, fill: '#0A0A0A' }, g); el('path', { d: 'M9.6 6.3H6.3v3.3M14.4 17.7h3.3v-3.3M6.3 14.4v3.3h3.3M11 13l6.5-6.5m-4.2 0h4.2v4.2', stroke: '#fff', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, g); },
    vm: function (g) { el('rect', { width: 24, height: 24, rx: 5, fill: '#0E0E0E' }, g); el('path', { d: 'M7.1 7.9 12 16.9 16.4 8.7', stroke: '#F2F0EB', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, g); el('circle', { cx: 16.9, cy: 7.9, r: 2.3, fill: '#E5484D' }, g); },
    cf: function (g) { el('polygon', { points: '2.5,3 7.3,5.4 7.3,18.6 2.5,21', fill: '#1D5FD0' }, g); el('polygon', { points: '9.5,6.2 14.3,8.6 14.3,15.4 9.5,17.8', fill: '#1FA0DC' }, g); el('polygon', { points: '16.5,9 22,12 16.5,15', fill: '#7FD6EE' }, g); },
    pl: function (g) { el('path', { d: 'M7 5 2.5 12 7 19M9.5 10h5M9.5 14h5M11.2 8v8M12.8 8v8', stroke: '#FF8C00', 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, g); el('path', { d: 'M17 5l4.5 7-4.5 7', stroke: '#00A9C4', 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, g); },
    pw: function (g) { el('rect', { width: 24, height: 24, rx: 5, fill: '#2B6E66' }, g); el('path', { d: 'M16.7 8.5C16 6.8 13.8 6.4 12.8 8 12.1 9 11.3 9.8 10 10.4 7.8 11.3 7.2 13.3 7.8 15 8.6 16.8 10.4 17.7 12.3 17.5 15.1 17.4 17 15.2 17 12.3 17 11.2 17.2 10.2 17.5 9.7Z', fill: '#F6EFE4' }, g); el('path', { d: 'M16.9 8.5 19 9.3 17.1 9.8Z', fill: '#EC8A5A' }, g); }
  };
  var SAY = ['note', 'heart', 'star', 'sun', 'leaf', 'question', 'sparkle', 'sf', 'vm', 'cf', 'pl', 'pw', 'code', 'dots'];
  var REPLY = { question: ['bang', 'note', 'sparkle', 'dots'], heart: ['heart', 'sparkle'], note: ['note', 'star'], dots: ['question'], code: ['sparkle', 'bang'],
    sf: ['heart', 'sparkle', 'star'], vm: ['star', 'note'], cf: ['sparkle', 'sun'], pl: ['leaf', 'heart'], pw: ['heart', 'note'] };
  var FLAT = /[BDEFHIKLMNPRTUbdhkl1]/;

  /* ------------------------------------------------------------------ the flock */
  function flock(opts) {
    var sky = opts.sky, tr = opts.tree || null, MAX = 10, W = window.innerWidth < 700 ? 34 : 42;
    var birds = [], view = { left: 0, top: 0, right: 0, bottom: 0 }, off = { x: 0, y: 0 };
    var T = 0, last = 0, pointer = { x: -1e4, y: -1e4, t: -1 }, scrollDir = 0, lastScroll = 0, talkT = 4, songs = 0, gustT = 8;
    var measure = document.createElement('canvas').getContext('2d'), textCache = new Map();
    var nests = Array.prototype.slice.call(document.querySelectorAll('[data-nest]')), homes = [], homeClock = 0;
    nests.forEach(function (nest, i) { nest.parentNode.style.setProperty('--bird-color', STYLES[i].dark); });
    function occupancy(b, on) {
      var nest = nests[birds.indexOf(b)];
      if (nest) nest.parentNode.classList.toggle('occupied', on);
      var status = document.querySelector('[data-roost-status]');
      if (status) status.textContent = nests.filter(function (n) { return n.parentNode.classList.contains('occupied'); }).length + ' of 10 birds at home';
    }
    function measureHomes() { homes = nests.map(function (nest) { var sp = { kind: 'nest', el: nest }, p = resolve(sp); return p && visible(p) ? sp : null; }); }
    var audio = null, soundOn = opts.sound !== false, running = false;

    function measureView() {
      var r = sky.getBoundingClientRect(); off = { x: r.left, y: r.top };
      view = { left: -r.left, top: -r.top, right: -r.left + document.documentElement.clientWidth, bottom: -r.top + innerHeight };
    }
    function sizeSky() { sky.style.height = '0px'; sky.style.height = document.documentElement.scrollHeight + 'px'; textCache.clear(); }
    var toSky = function (x, y) { return { x: x - off.x, y: y - off.y }; };
    var visible = function (p, pad) { pad = pad || 0; return p.y > view.top + 90 - pad && p.y < view.bottom - 50 + pad && p.x > view.left + 20 - pad && p.x < view.right - 20 + pad; };

    function resolve(sp) {
      if (!sp) return null;
      switch (sp.kind) {
        case 'nest': { var nr = sp.el.getBoundingClientRect(); return nr.width ? toSky(nr.left + nr.width / 2, nr.top + nr.height * .27) : null; }
        case 'edge': { var r = sp.el.getBoundingClientRect(); return r.width ? toSky(r.left + sp.frac * r.width, r.top) : null; }
        case 'text': {
          if (!sp.node.isConnected || sp.i >= sp.node.data.length) return null;
          var rg = document.createRange(); rg.setStart(sp.node, sp.i); rg.setEnd(sp.node, sp.i + 1);
          var q = rg.getBoundingClientRect(); return q.width ? toSky(q.left + q.width / 2, q.top + sp.lift) : null;
        }
        case 'tree': { var t = tr && tr.perch(sp.i); return t ? toSky(t.x, t.y) : null; }
        case 'air': return sp.at;
      }
      return null;
    }
    function textSpots(node) {
      var c = textCache.get(node); if (c && c.length && c[0].node.isConnected) return c;
      var out = [], w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      for (var n = w.nextNode(); n; n = w.nextNode()) {
        var pe = n.parentElement; if (!pe) continue;
        var cs = getComputedStyle(pe); measure.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
        for (var i = 0; i < n.data.length; i++) {
          if (!FLAT.test(n.data[i])) continue;
          var m = measure.measureText(n.data[i]);
          out.push({ kind: 'text', el: node, node: n, i: i, lift: m.fontBoundingBoxAscent - m.actualBoundingBoxAscent });
        }
      }
      textCache.set(node, out); return out;
    }
    var keyOf = function (sp) { return sp.kind === 'tree' ? 'tree' + sp.i : sp.el; };
    function taken(p, self) {
      for (var i = 0; i < birds.length; i++) {
        var b = birds[i]; if (b === self) continue;
        var q = b.mode === 'flying' && b.fl ? b.fl.planned : b.pos;
        if (Math.hypot(q.x - p.x, q.y - p.y) < 34) return true;
      }
      return false;
    }
    function choose(b, o) {
      o = o || {};
      var home = homes[birds.indexOf(b)]; if (home) return home;
      var cands = [];
      function add(sp, w) {
        var p = resolve(sp); if (!p || !visible(p)) return;
        var d = Math.hypot(p.x - b.pos.x, p.y - b.pos.y); if (d < 70 || taken(p, b)) return;
        var ideal = o.far ? 560 : 280, wt = w * (.25 + Math.exp(-Math.pow((d - ideal) / 360, 2)));
        var f = (p.y - view.top) / (view.bottom - view.top);
        if (scrollDir > 0) wt *= .5 + 1.6 * f; if (scrollDir < 0) wt *= .5 + 1.6 * (1 - f);
        if (o.dir) wt *= ((p.x - b.pos.x) * o.dir.x + (p.y - b.pos.y) * o.dir.y) / d > .2 ? 2.5 : .1;
        if (o.near) wt *= 4 * Math.exp(-Math.pow(Math.hypot(p.x - o.near.x, p.y - o.near.y) / 200, 2)) + .02;
        if (b.recent.indexOf(keyOf(sp)) > -1) wt *= .06;
        cands.push({ sp: sp, w: wt });
      }
      var els = document.querySelectorAll('[data-perch]');
      for (var i = 0; i < els.length; i++) {
        var e = els[i], r = e.getBoundingClientRect();
        if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
        if (e.dataset.perch === 'text') { var ts = textSpots(e); for (var k = 0; k < 3 && ts.length; k++) add(pick(ts), 1.4 / 3); }
        else { var m = Math.min(.4, 28 / r.width); add({ kind: 'edge', el: e, frac: rand(m, 1 - m) }, 1); }
      }
      if (tr) for (var j = 0; j < tr.count; j++) add({ kind: 'tree', i: j }, 1.8);
      var sum = cands.reduce(function (a, c) { return a + c.w; }, 0), x = Math.random() * sum;
      for (var n = 0; n < cands.length; n++) if ((x -= cands[n].w) <= 0) return cands[n].sp;
      return null;
    }
    function airSpot(b, o) {
      var w = view.right - view.left, h = view.bottom - view.top;
      var a = { x: view.left + w * rand(.12, .88), y: view.top + h * rand(.22, .68) };
      if (o && o.dir) a = { x: clamp(b.pos.x + o.dir.x * 260, view.left + 40, view.right - 40), y: clamp(b.pos.y + o.dir.y * 200 - 60, view.top + 100, view.bottom - 80) };
      return { kind: 'air', at: a };
    }

    /* arc-length sampled cubic */
    function curve(a, b, c, d) {
      var pts = [], len = [], s = 0;
      for (var i = 0; i <= 48; i++) {
        var t = i / 48, u = 1 - t, p = { x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x, y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y };
        if (pts.length) s += Math.hypot(p.x - pts[pts.length - 1].x, p.y - pts[pts.length - 1].y);
        pts.push(p); len.push(s);
      }
      return { pts: pts, len: len, total: s };
    }
    function along(cv, s) {
      if (s <= 0) return { x: cv.pts[0].x, y: cv.pts[0].y };
      if (s >= cv.total) { var e = cv.pts[cv.pts.length - 1]; return { x: e.x, y: e.y }; }
      var lo = 0, hi = cv.len.length - 1;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (cv.len[mid] < s) lo = mid; else hi = mid; }
      var p = cv.pts[lo], q = cv.pts[hi], f = (s - cv.len[lo]) / ((cv.len[hi] - cv.len[lo]) || 1);
      return { x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f };
    }

    /* ---------- a bird ---------- */
    function make(style, x, y) {
      var node = document.createElement('div'); node.className = 'bird';
      var w = Math.round(W * style.size); node.style.width = node.style.height = w + 'px';
      var parts = birdSVG(style); node.appendChild(parts.svg); sky.appendChild(node);
      var b = { style: style, node: node, p: parts, w: w, pos: { x: x, y: y }, vel: { x: 0, y: 0 }, mode: 'pop', spot: null, fl: null, recent: [],
        face: Math.random() < .5 ? 1 : -1, faceS: 1, tilt: 0, squash: .5, scale: .1, tailR: 0, tailV: 0, legsS: 1, legsR: 0, flap: 0, flying: 0,
        stay: 0, fidget: 1, flee: -1, blinkT: rand(1, 3), blink: 0, singT: -1, bow: 0, hop: null, popT: 0, dir: null, far: false };
      b.faceS = b.face;
      birds.push(b);
      return b;
    }
    function flyTo(b, sp, land) {
      if (b.spot && b.spot.kind === 'nest') occupancy(b, false);
      var tgt = resolve(sp) || b.pos, p0 = { x: b.pos.x, y: b.pos.y }, dx = tgt.x - p0.x, dy = tgt.y - p0.y, L = Math.hypot(dx, dy) || 1, sp0 = Math.hypot(b.vel.x, b.vel.y);
      var c1 = sp0 > 60 ? { x: p0.x + b.vel.x / sp0 * clamp(L * .4, 50, 240), y: p0.y + b.vel.y / sp0 * clamp(L * .4, 50, 240) } : { x: p0.x + dx * .18, y: p0.y - clamp(40 + L * .22, 50, 130) };
      var wob = (Math.random() - .5) * L * .6;
      var c2 = land ? { x: tgt.x - dx * .2, y: tgt.y - clamp(L * .3, 40, 150) } : { x: tgt.x - dx * .35 - dy / L * wob, y: tgt.y - dy * .35 + dx / L * wob };
      var ceiling = view.top + 34;
      if (p0.y > ceiling) { c1.y = Math.max(c1.y, ceiling); c2.y = Math.max(c2.y, ceiling); }
      var offscreen = !visible(p0, 200);
      if (b.spot && b.spot.kind === 'tree' && tr) tr.bump(b.spot.i, .6);
      b.fl = { cv: curve(p0, c1, c2, tgt), s: 0, speed: Math.max(sp0, b.mode === 'crouch' ? 140 : 0), cruise: offscreen ? 620 : clamp(L * .75, 200, 420), land: land, spot: sp, planned: { x: tgt.x, y: tgt.y }, age: 0, check: .25, burst: 0, tuck: 0, flaps: Math.round(rand(2, 4)) };
      if (sp.kind !== 'air') { b.recent.push(keyOf(sp)); if (b.recent.length > 3) b.recent.shift(); }
      b.spot = null; b.mode = 'flying';
    }
    function depart(b) {
      var sp = !b.dir && Math.random() < .1 ? null : choose(b, { dir: b.dir, far: b.far });
      flyTo(b, sp || airSpot(b, { dir: b.dir }), !!sp);
      b.dir = null; b.far = false;
    }
    function crouch(b, dir) {
      b.dir = dir || null; b.mode = 'crouch'; b.crouchT = .1; b.hop = null; b.flee = -1;
    }
    function land(b) {
      var sp = b.fl.spot, v = Math.hypot(b.vel.x, b.vel.y);
      b.mode = 'perched'; b.spot = sp; b.fl = null; b.squash = .8; b.legsR = 0;
      b.tailV += 260; b.stay = sp.kind === 'tree' ? rand(5, 10) : rand(3, 7); b.fidget = rand(.5, 1.2);
      if (sp.kind === 'nest') { b.stay = 1e9; occupancy(b, true); }
      b.singT = Math.random() < .25 ? rand(.6, 1.4) : -1;
      if (sp.kind === 'tree' && tr) tr.bump(sp.i, clamp(.7 + v / 400, .7, 1.4));
      if (opts.onLand) opts.onLand(sp, b);
    }

    /* ---------- speech ---------- */
    function ensureAudio() {
      if (audio || !(window.AudioContext || window.webkitAudioContext)) return;
      var ctx = new (window.AudioContext || window.webkitAudioContext)(), master = ctx.createGain();
      master.gain.value = .5; master.connect(ctx.destination); audio = { ctx: ctx, master: master };
    }
    function chirp(pitch, n) {
      if (!audio || !soundOn) return;
      var ctx = audio.ctx; if (ctx.state === 'suspended') ctx.resume();
      var t0 = ctx.currentTime + .01; n = n || 1 + Math.floor(Math.random() * 3);
      for (var i = 0; i < n; i++) {
        var st = t0 + i * rand(.08, .12), base = pitch * rand(.92, 1.1), o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(base, st); o.frequency.exponentialRampToValueAtTime(base * rand(1.3, 1.6), st + .045); o.frequency.exponentialRampToValueAtTime(base * .95, st + .075);
        g.gain.setValueAtTime(.0001, st); g.gain.exponentialRampToValueAtTime(.06, st + .01); g.gain.exponentialRampToValueAtTime(.0001, st + .085);
        o.connect(g); g.connect(audio.master); o.start(st); o.stop(st + .1);
      }
    }
    function beakAt(b) { return { x: b.pos.x + Math.sign(b.faceS || 1) * b.w * .36, y: b.pos.y - b.w * .66 }; }
    function notes(b) {
      var p = beakAt(b);
      for (var i = 0; i < 3; i++) (function (i) {
        var n = document.createElement('span'); n.className = 'note'; n.textContent = i % 2 ? '♫' : '♪'; n.style.color = b.style.accent; sky.appendChild(n);
        var dx = Math.sign(b.faceS || 1) * rand(10, 24);
        n.animate([{ transform: 'translate(' + p.x + 'px,' + p.y + 'px) scale(.6)', opacity: 0 }, { transform: 'translate(' + (p.x + dx * .4) + 'px,' + (p.y - 12) + 'px) scale(1)', opacity: 1, offset: .25 }, { transform: 'translate(' + (p.x + dx) + 'px,' + (p.y - 34) + 'px) scale(.9)', opacity: 0 }],
          { duration: 1300, delay: i * 240, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'both' }).onfinish = function () { n.remove(); };
      })(i);
      chirp(b.style.pitch);
    }
    function say(b, sym) {
      if (b.mode !== 'perched') return;
      songs++; b.bow = .6; b.tailV += 180;
      var p = beakAt(b), left = b.faceS < 0, box = document.createElement('div'); box.className = 'bubble' + (left ? ' left' : '');
      var s = el('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }); (SYM[sym] || SYM.note)(s, b.style.accent); box.appendChild(s); sky.appendChild(box);
      var x = p.x + (left ? -46 : 2), y = p.y - 52;
      box.animate([{ transform: 'translate(' + x + 'px,' + (y + 10) + 'px) scale(.2)', opacity: 0 }, { transform: 'translate(' + x + 'px,' + y + 'px) scale(1)', opacity: 1, offset: .14 }, { transform: 'translate(' + x + 'px,' + (y - 6) + 'px) scale(1)', opacity: 1, offset: .82 }, { transform: 'translate(' + x + 'px,' + (y - 18) + 'px) scale(.9)', opacity: 0 }],
        { duration: 2100, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }).onfinish = function () { box.remove(); };
      chirp(b.style.pitch);
      if (songs % 4 === 0) snap(b);
    }
    /* Snipflag moment: brackets snap around the singer like a screenshot. */
    function snap(b) {
      var box = document.createElement('div'); box.className = 'snap';
      var w = b.w + 18, h = b.w + 14, x = b.pos.x - w / 2, y = b.pos.y - b.w - 4;
      box.style.width = w + 'px'; box.style.height = h + 'px';
      box.innerHTML = '<i></i><i></i><i></i><i></i><b></b><span>SF—01 · SNAP</span>';
      sky.appendChild(box);
      box.animate([{ transform: 'translate(' + x + 'px,' + y + 'px) scale(1.5)', opacity: 0 }, { transform: 'translate(' + x + 'px,' + y + 'px) scale(1)', opacity: 1, offset: .15 }, { transform: 'translate(' + x + 'px,' + y + 'px) scale(1)', opacity: 1, offset: .8 }, { transform: 'translate(' + x + 'px,' + y + 'px) scale(1)', opacity: 0 }],
        { duration: 1500, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }).onfinish = function () { box.remove(); };
    }
    function talk() {
      var idle = birds.filter(function (b) { return b.mode === 'perched' && visible(b.pos, -10); });
      if (!idle.length) return;
      var a = pick(idle), others = idle.filter(function (b) { return b !== a && Math.hypot(b.pos.x - a.pos.x, b.pos.y - a.pos.y) < 420; });
      if (!others.length) { if (Math.random() < .6) notes(a); else say(a, pick(['note', 'question', 'sun', 'sparkle', 'dots'])); return; }
      var o = others.sort(function (p, q) { return Math.hypot(p.pos.x - a.pos.x, p.pos.y - a.pos.y) - Math.hypot(q.pos.x - a.pos.x, q.pos.y - a.pos.y); })[0];
      a.face = o.pos.x > a.pos.x ? 1 : -1; o.face = -a.face;
      var sym = pick(SAY);
      setTimeout(function () { say(a, sym); }, 220);
      setTimeout(function () { say(o, pick(REPLY[sym] || ['note', 'heart', 'sparkle', 'star'])); }, 1050);
    }

    /* ---------- per-frame updates ---------- */
    function perched(b, dt) {
      var p = resolve(b.spot);
      if (!p) { crouch(b); return; }
      var x = p.x, y = p.y;
      if (b.hop && b.spot.kind === 'edge') {
        b.hop.t += dt / .3; var k = smooth(b.hop.t);
        b.spot.frac = b.hop.from + (b.hop.to - b.hop.from) * k;
        var q = resolve(b.spot); if (q) { x = q.x; y = q.y - Math.sin(Math.PI * clamp(b.hop.t, 0, 1)) * 9; }
        if (b.hop.t >= 1) { b.hop = null; b.squash = .88; }
      }
      b.pos = { x: x, y: y }; b.vel = { x: 0, y: 0 };
      b.tilt = damp(b.tilt, Math.sin(Math.PI * clamp(b.bow, 0, 1)) * 26, 18, dt);
      b.bow = b.bow > 0 ? b.bow - dt / .24 : 0;
      if (!visible(p, 30)) { if (b.flee < 0) b.flee = rand(.12, .4); } else b.flee = -1;
      if ((b.flee >= 0 && (b.flee -= dt) < 0) || (b.stay -= dt) < 0) { crouch(b); return; }
      var head = { x: b.pos.x, y: b.pos.y - b.w * .45 }, d = Math.hypot(pointer.x - head.x, pointer.y - head.y);
      if (b.spot.kind !== 'nest' && T - pointer.t < .25 && d < 70) { crouch(b, { x: (head.x - pointer.x) / (d || 1), y: (head.y - pointer.y) / (d || 1) }); return; }
      if (b.singT > 0 && (b.singT -= dt) <= 0) notes(b);
      if ((b.fidget -= dt) < 0 && !b.hop) {
        b.fidget = rand(.6, 2.2);
        var r = Math.random();
        if (r < .36) b.face = -b.face;
        else if (r < .56) b.tailV += rand(200, 320);
        else if (r < .74) b.bow = 1;
        else if (r < .9 && b.spot.kind === 'edge') {
          var wEl = b.spot.el.getBoundingClientRect().width, m = Math.min(.4, 28 / wEl), to = clamp(b.spot.frac + b.face * rand(12, 26) / wEl, m, 1 - m);
          if (Math.abs(to - b.spot.frac) * wEl > 6) { b.hop = { from: b.spot.frac, to: to, t: 0 }; b.squash = .86; }
        }
      }
    }
    function flying(b, dt) {
      var f = b.fl; f.age += dt;
      var h = view.bottom - view.top;
      if (b.pos.y < view.top - h * .7 || b.pos.y > view.bottom + h * .7) {
        b.pos = { x: clamp(b.pos.x, view.left + 30, view.right - 30), y: b.pos.y < view.top ? view.top - 50 : view.bottom + 50 };
        b.vel = { x: 0, y: b.pos.y < view.top ? 300 : -300 };
        flyTo(b, f.spot, f.land); return;
      }
      if ((f.check -= dt) < 0) { f.check = .25; var chk = resolve(f.spot); if (!chk || !visible(chk, f.spot.kind === 'air' ? 60 : 20)) { depart(b); return; } }
      var left = f.cv.total - f.s, endV = f.land ? 30 : f.cruise * .75;
      f.speed = Math.max(Math.min(f.speed + 900 * dt, f.cruise, Math.sqrt(endV * endV + 1400 * Math.max(0, left))), Math.min(endV, 30));
      f.s = Math.min(f.cv.total, f.s + f.speed * dt);
      var p = along(f.cv, f.s);
      if (f.land) { var now = resolve(f.spot); if (now) { var k = smooth(f.s / f.cv.total); p.x += (now.x - f.planned.x) * k; p.y += (now.y - f.planned.y) * k; } }
      var landing = f.land && left < 110, bob = 0;
      if (f.age < .32 || landing || left < 60 || f.speed < 170) { b.flap += dt * (landing ? 6.5 : 10.5); b.flying = 1; f.tuck = 0; }
      else if (f.tuck > 0) { f.tuck -= dt; b.flying = 0; bob = -7 * (1 - smooth(1 - f.tuck / .22)); if (f.tuck <= 0) { f.burst = 0; f.flaps = Math.round(rand(2, 4)); } }
      else { b.flap += dt * 8; b.flying = 1; f.burst += dt; bob = -7 * smooth(f.burst / (f.flaps / 8)); if (f.burst >= f.flaps / 8) f.tuck = .22; }
      var fade = smooth(f.s / 90) * smooth(left / 140), np = { x: p.x, y: p.y + bob * fade };
      b.vel = { x: damp(b.vel.x, (np.x - b.pos.x) / dt, 20, dt), y: damp(b.vel.y, (np.y - b.pos.y) / dt, 20, dt) };
      b.pos = np;
      if (Math.abs(b.vel.x) > 30 && !(f.land && left < 24)) b.face = Math.sign(b.vel.x);
      var ang = Math.atan2(b.vel.y, Math.abs(b.vel.x)) * 180 / Math.PI;
      b.tilt = damp(b.tilt, landing ? -16 : clamp(ang * .55, -26, 30), 10, dt);
      b.legsS = damp(b.legsS, landing || f.age < .12 ? 1 : 0, 14, dt);
      b.legsR = damp(b.legsR, landing ? -24 : 0, 10, dt);
      if (f.s >= f.cv.total - .5) { if (f.land) land(b); else depart(b); }
    }
    function draw(b) {
      var s = b.scale, sgn = Math.sign(b.faceS || 1);
      b.node.style.transform = 'translate3d(' + (b.pos.x - b.w * .5).toFixed(1) + 'px,' + (b.pos.y - b.w * 59 / 64).toFixed(1) + 'px,0)';
      var sx = sgn * Math.max(.2, Math.abs(b.faceS));
      b.p.svg.style.transform = 'rotate(' + (b.tilt * sgn).toFixed(1) + 'deg) scale(' + (sx * s * Math.sqrt(2 - b.squash)).toFixed(3) + ',' + (s * b.squash).toFixed(3) + ')';
      var fl = b.flying > .5;
      if (fl !== b._fl) { b._fl = fl; b.p.near.style.display = b.p.far.style.display = fl ? '' : 'none'; b.p.fold.style.display = fl ? 'none' : ''; }
      if (fl) {
        b.p.near.setAttribute('transform', 'translate(0 33) scale(1 ' + wingY(b.flap).toFixed(3) + ') translate(0 -33)');
        b.p.far.setAttribute('transform', 'translate(4 -2) translate(0 33) scale(1 ' + (wingY(b.flap - .08) * .92).toFixed(3) + ') translate(0 -33)');
      }
      b.p.tail.setAttribute('transform', 'rotate(' + b.tailR.toFixed(1) + ' 23 30.5)');
      b.p.legs.setAttribute('transform', 'rotate(' + b.legsR.toFixed(1) + ' 32 53) translate(0 53) scale(1 ' + b.legsS.toFixed(3) + ') translate(0 -53)');
      var bl = b.blink > 0; if (bl !== b._bl) { b._bl = bl; b.p.eye.setAttribute('transform', bl ? 'translate(0 19.5) scale(1 .15) translate(0 -19.5)' : ''); }
    }
    function frame(now) {
      var dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60; last = now; T += dt;
      measureView();
      homeClock -= dt; if (homeClock <= 0) { measureHomes(); homeClock = .35; }
      var y = -off.y; scrollDir = Math.abs(y - lastScroll) > .5 ? Math.sign(y - lastScroll) : damp(scrollDir, 0, .8, dt); lastScroll = y;
      for (var i = 0; i < birds.length; i++) {
        var b = birds[i], home = homes[i];
        if (home && !(b.spot && b.spot.el === home.el) && !(b.fl && b.fl.spot.el === home.el)) flyTo(b, home, true);
        if (b.mode === 'pop') {
          b.popT += dt; b.scale = damp(b.scale, 1, 16, dt);
          if (b.popT > .3 && b.popT - dt <= .3) b.bow = 1;
          b.tilt = damp(b.tilt, Math.sin(Math.PI * clamp(b.bow, 0, 1)) * 22, 18, dt); b.bow = b.bow > 0 ? b.bow - dt / .24 : 0;
          if (b.popT > .6) { b.far = true; crouch(b); }
        } else if (b.mode === 'perched') perched(b, dt);
        else if (b.mode === 'crouch') {
          b.squash = damp(b.squash, .8, 30, dt);
          if (b.spot) { var p = resolve(b.spot); if (p) b.pos = p; }
          if ((b.crouchT -= dt) <= 0) { b.squash = 1.08; depart(b); }
        } else flying(b, dt);
        b.faceS = damp(b.faceS, b.face, 38, dt);
        b.squash = damp(b.squash, 1, 9, dt);
        if (b.mode !== 'pop') b.scale = damp(b.scale, b.mode === 'flying' ? 1.1 : 1, 4, dt);
        b.tailV += (((b.mode === 'flying' ? (b.flying ? -24 : -18) : 0) - b.tailR) * 160 - b.tailV * 14) * dt; b.tailR += b.tailV * dt;
        if (b.mode !== 'flying') { b.legsS = damp(b.legsS, 1, 14, dt); b.legsR = damp(b.legsR, 0, 12, dt); b.flying = 0; }
        if ((b.blinkT -= dt) < 0) { b.blink = .09; b.blinkT = rand(1.8, 5); }
        b.blink -= dt;
        draw(b);
      }
      if ((talkT -= dt) < 0) { talk(); talkT = rand(3.5, 6.5); }
      if (tr && (gustT -= dt) < 0) { tr.gust(); gustT = rand(9, 15); }
      requestAnimationFrame(frame);
    }
    function start() { if (!running) { running = true; requestAnimationFrame(frame); } }

    /* ---------- spawning ---------- */
    function spawnAt(cx, cy) {
      if (soundOn) ensureAudio(); measureView();
      var p = toSky(cx, cy);
      if (birds.length >= MAX) {
        // All ten are out: the nearest perched bird comes over to where you clicked.
        var best = null, bd = 1e9;
        birds.forEach(function (b) { var d = Math.hypot(b.pos.x - p.x, b.pos.y - p.y); if (b.mode === 'perched' && d < bd) { bd = d; best = b; } });
        if (best) { var sp = choose(best, { near: p }); if (sp) flyTo(best, sp, true); }
        return false;
      }
      var b = make(STYLES[birds.length], p.x, p.y);
      if (reduce) { var s2 = choose(b, {}); b.scale = 1; b.squash = 1; if (s2) { b.pos = resolve(s2); b.spot = s2; b.mode = 'perched'; b.stay = 1e9; if (s2.kind === 'nest') occupancy(b, true); } draw(b); }
      chirp(b.style.pitch, 2);
      if (opts.onChange) opts.onChange(birds.length, MAX);
      if (!reduce) start();
      return true;
    }
    function spawnFromHouse() {
      if (!tr) return false;
      var h = tr.hole(); if (!h) return false;
      tr.houseSwing();
      return spawnAt(h.x, h.y + 10);
    }
    function spawnOnTree(i) {
      if (!tr) return;
      var q = tr.perch(i); if (!q) return;
      measureView();
      var p = toSky(q.x, q.y), b = make(STYLES[birds.length], p.x, p.y);
      b.spot = { kind: 'tree', i: i }; b.mode = 'perched'; b.stay = reduce ? 1e9 : rand(4, 7); b.scale = 1; b.squash = 1; b.face = 1;
      if (opts.onChange) opts.onChange(birds.length, MAX);
      draw(b);
      if (!reduce) start();
    }

    document.addEventListener('pointermove', function (e) { var p = toSky(e.clientX, e.clientY); pointer = { x: p.x, y: p.y, t: T }; }, { passive: true });
    new ResizeObserver(sizeSky).observe(document.body);
    sizeSky(); measureView();
    var roostInvite = document.querySelector('[data-roost-invite]');
    if (roostInvite) roostInvite.addEventListener('click', function () {
      measureView(); measureHomes(); var r = roostInvite.getBoundingClientRect(); spawnAt(r.left + r.width / 2, r.top - 20);
      if (birds.length >= MAX) { roostInvite.disabled = true; roostInvite.textContent = 'The flock is complete'; }
    });
    // Reduced motion settles birds without flight; coalesce scrolling into one layout read.
    if (reduce) {
      var homePending = false;
      function settleHomes() {
        if (homePending) return; homePending = true;
        requestAnimationFrame(function () {
          homePending = false; measureView(); measureHomes();
          birds.forEach(function (b, i) {
            if (homes[i]) { b.spot = homes[i]; b.pos = resolve(b.spot); b.mode = 'perched'; occupancy(b, true); draw(b); }
            else if (b.spot && b.spot.kind === 'nest') occupancy(b, false);
          });
        });
      }
      window.addEventListener('scroll', settleHomes, { passive: true });
      window.addEventListener('resize', settleHomes); settleHomes();
    }

    return {
      spawnAt: spawnAt, spawnFromHouse: spawnFromHouse, spawnOnTree: spawnOnTree,
      count: function () { return birds.length; }, max: MAX,
      setSound: function (on) { soundOn = !!on; if (on) ensureAudio(); }, soundOn: function () { return soundOn; },
      scatter: function () { birds.forEach(function (b) { if (b.mode === 'perched') crouch(b, { x: rand(-.6, .6), y: -1 }); }); }
    };
  }

  window.Birds = { tree: tree, flock: flock, STYLES: STYLES, SYM: SYM, reduce: reduce };
})();
