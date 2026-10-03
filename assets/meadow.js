/* Meadow residents: one rabbit and two chicks living in the grass under the tree.
   Built to the same standard as the flying birds in birds.js: jointed SVG rigs, spring physics,
   squash and stretch, smoothed turning, and a small planner that picks the next thing to do from
   what the animal just did, where its friend is and where your cursor is. Nothing repeats on a timer.
   The chicks keep their distance: bodies never overlap, a hello is said from a step apart, and
   greetings, chases and hearts each sit behind their own long cool-down.
   One requestAnimationFrame loop, transforms only, paused off-screen, in hidden tabs and for reduced motion.
   Separate from the ten flying birds: these never count toward the flock or the roost. */
(function () {
  'use strict';
  var scene = document.querySelector('[data-scene]');
  var rabbitEl = document.querySelector('[data-rabbit]');
  var chickEls = Array.prototype.slice.call(document.querySelectorAll('[data-chick]'));
  if (!scene || !rabbitEl || chickEls.length !== 2) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  var damp = function (a, b, k, dt) { return a + (b - a) * (1 - Math.exp(-k * dt)); };
  var f2 = function (v) { return (Math.round(v * 100) / 100).toString(); };
  function weighted(options) {
    var sum = 0, i; for (i = 0; i < options.length; i++) sum += Math.max(0, options[i][1]);
    var x = Math.random() * sum;
    for (i = 0; i < options.length; i++) if ((x -= Math.max(0, options[i][1])) <= 0) return options[i][0];
    return options[0][0];
  }

  var W = 0, sceneLeft = 0, sceneTop = 0, T = 0, last = 0, running = false, visible = false;
  var pointer = { x: -1e4, y: -1e4, t: -10 };
  function measure() { var r = scene.getBoundingClientRect(); W = r.width; sceneLeft = r.left; sceneTop = r.top; }
  document.addEventListener('pointermove', function (e) { pointer = { x: e.clientX, y: e.clientY, t: T }; }, { passive: true });

  /* ================================================================== RABBIT */
  var R = {
    el: rabbitEl, w: 0, x: 0, dir: 1, faceS: 1,
    root: rabbitEl.querySelector('.r-root'), shadow: rabbitEl.querySelector('.r-shadow'),
    head: rabbitEl.querySelector('.r-head'), earF: rabbitEl.querySelector('.r-ear-front'), earB: rabbitEl.querySelector('.r-ear-back'),
    hind: rabbitEl.querySelector('.r-hind'), front: rabbitEl.querySelector('.r-front'), eye: rabbitEl.querySelector('.r-eye'),
    nose: rabbitEl.querySelector('.r-nose'), tail: rabbitEl.querySelector('.r-tail'),
    lift: 0, sx: 1, sy: 1, tilt: 0, headA: 0, headT: 0, hindA: 0, frontA: 0,
    ear: [0, 0], earV: [0, 0], earT: 0, noseK: 0, sniff: false, blink: 0, blinkT: rand(1, 3), twitchT: rand(1, 3),
    tailA: 0, tailV: 0, act: null, bout: 0, sinceHop: 0, alert: 0
  };
  function rabbitRange() {
    var narrow = W < 700, lo = W * (narrow ? .02 : .04), hi = W * (narrow ? .44 : .38) - R.w;
    return [lo, Math.max(lo + 10, hi)];
  }
  function rabbitStart(act) { act.t = 0; R.act = act; }
  function rabbitHop(big) {
    var range = rabbitRange(), dist = clamp(W * rand(.03, .052), 18, 64) * (big ? 1.35 : 1);
    if (R.x + R.dir * dist > range[1] || R.x + R.dir * dist < range[0]) { R.dir = -R.dir; }
    rabbitStart({ type: 'hop', dur: big ? .56 : rand(.6, .7), dist: dist, height: (big ? 30 : rand(16, 24)), x0: R.x, pushed: false, landed: false });
  }
  function rabbitNext() {
    if (R.bout > 0) {
      // A breath between hops in a bout: longer when relaxed, a blink when startled.
      if (R.lastType === 'hop') { rabbitStart({ type: 'pause', dur: R.startled ? rand(.05, .1) : rand(.18, .5) }); return; }
      R.bout--; rabbitHop(R.startled); return;
    }
    R.startled = false;
    var range = rabbitRange(), room = R.dir > 0 ? range[1] - R.x : R.x - range[0];
    var type = weighted([
      ['sniff', .34], ['look', .24], ['tall', .1], ['groom', .08], ['rest', .1],
      ['bout', .12 + Math.min(.5, R.sinceHop / 12)]
    ]);
    if (type === 'bout') {
      if (room < 40 || Math.random() < .3) R.dir = -R.dir;
      R.bout = Math.floor(rand(1, 4)); rabbitHop(false); R.bout--; return;
    }
    rabbitStart({ type: type, dur: { sniff: rand(1.2, 2.6), look: rand(1, 2.2), tall: rand(1.2, 2), groom: rand(1.4, 2.2), rest: rand(.8, 1.8) }[type], flip: type === 'look' && Math.random() < .45 });
  }
  function startle(fromX) {
    if (reduce) return;
    var center = sceneLeft + R.x + R.w / 2;
    R.dir = fromX < center ? 1 : -1;
    var range = rabbitRange(), room = R.dir > 0 ? range[1] - R.x : R.x - range[0];
    if (room < 50) R.dir = -R.dir;
    R.startled = true; R.alert = 1; R.earV[0] -= 260; R.earV[1] -= 200;
    R.bout = 2; rabbitHop(true);
  }
  function rabbitUpdate(dt) {
    var a = R.act; if (!a) rabbitNext(); a = R.act; a.t += dt;
    var p = clamp(a.t / a.dur, 0, 1), earTarget = 4, headT = 0, sx = 1, sy = 1, tilt = 0, hind = 0, front = 0, lift = 0;
    R.sniff = false;
    if (a.type === 'hop') {
      R.sinceHop = 0;
      if (p < .22) { var k = smooth(p / .22); sy = 1 - .13 * k; sx = 1 + .07 * k; tilt = 4 * k; hind = -6 * k; earTarget = -20; headT = 4 * k; }
      else if (p < .3) { var k2 = (p - .22) / .08; sy = .87 + .3 * k2; sx = 1.07 - .12 * k2; hind = -6 + 44 * k2; tilt = 4 - 16 * k2; earTarget = -26;
        if (!a.pushed) { a.pushed = true; R.earV[0] -= 230; R.earV[1] -= 180; R.tailV += 300; } }
      else if (p < .8) { var k3 = (p - .3) / .5; lift = a.height * 4 * k3 * (1 - k3); R.x = a.x0 + a.dist * R.dir * k3;
        sy = 1.12 - .12 * k3; sx = .95 + .05 * k3; tilt = -12 + 26 * k3; hind = 38 - 30 * k3; front = k3 > .45 ? -38 * smooth((k3 - .45) / .55) : 12 * k3; earTarget = -14 + 10 * k3; headT = -6 + 8 * k3; }
      else { var k4 = (p - .8) / .2; R.x = a.x0 + a.dist * R.dir; sy = .86 + .14 * smooth(k4); sx = 1.08 - .08 * smooth(k4); tilt = 14 * (1 - smooth(k4)); front = -38 * (1 - smooth(k4)); hind = 8 * (1 - k4);
        if (!a.landed) { a.landed = true; R.earV[0] += 320; R.earV[1] += 260; R.tailV -= 200; } earTarget = 8; }
    } else if (a.type === 'pause') { sy = .96; earTarget = R.startled ? -12 : 2; }
    else if (a.type === 'sniff') { headT = 13 + Math.sin(a.t * 2.2) * 3; R.sniff = true; earTarget = 9; tilt = 3; }
    else if (a.type === 'look') {
      headT = -9 + Math.sin(a.t * 1.7) * 5; earTarget = -8;
      if (a.flip && !a.flipped && p > .45) { a.flipped = true; R.dir = -R.dir; }
    }
    else if (a.type === 'tall') { var up = smooth(Math.min(1, a.t / .3)) * (1 - smooth((a.t - a.dur + .3) / .3)); sy = 1 + .1 * up; sx = 1 - .04 * up; tilt = -9 * up; headT = -12 * up; front = 16 * up; earTarget = -10; }
    else if (a.type === 'groom') { var g = Math.sin(a.t * 9); headT = 20; front = -26 + g * 8; earTarget = 16; tilt = 4; }
    else { earTarget = 10; sy = .985; }
    if (p >= 1) { R.act = null; R.lastType = a.type; if (a.type !== 'hop' && a.type !== 'pause') R.sinceHop += a.dur; }

    // Cursor nearby: ears prick up and the head turns toward it.
    var cx = sceneLeft + R.x + R.w / 2, dx = pointer.x - cx, dy = pointer.y - (sceneTop + scene.clientHeight - R.w * .45);
    if (T - pointer.t < 1.2 && Math.abs(dx) < 170 && Math.abs(dy) < 140) { R.alert = Math.min(1, R.alert + dt * 3); if (a.type !== 'hop') { headT = Math.min(headT, -6); if (Math.sign(dx) !== R.dir && a.type !== 'hop' && Math.random() < dt * 1.2) R.dir = Math.sign(dx) || 1; } }
    else R.alert = Math.max(0, R.alert - dt * .6);
    earTarget -= R.alert * 12;

    if (R.dir !== R.lastDir) { R.lastDir = R.dir; if (a.type !== 'hop') R.turnHop = 1; }
    if (R.turnHop > 0) { R.turnHop -= dt / .26; lift = Math.max(lift, Math.sin(Math.PI * (1 - Math.max(0, R.turnHop))) * 7); }
    R.faceS = damp(R.faceS, R.dir, 26, dt);
    R.sx = damp(R.sx, sx, 30, dt); R.sy = damp(R.sy, sy * (a.type === 'hop' ? 1 : 1 + .012 * Math.sin(T * 2.6)), 30, dt);
    R.tilt = damp(R.tilt, tilt, 24, dt); R.headA = damp(R.headA, headT, 10, dt);
    R.hindA = damp(R.hindA, hind, 34, dt); R.frontA = damp(R.frontA, front, 30, dt); R.lift = lift;
    for (var i = 0; i < 2; i++) { var k5 = i ? 120 : 150, c = i ? 9 : 11; R.earV[i] += ((earTarget + (i ? 5 : 0) - R.ear[i]) * k5 - R.earV[i] * c) * dt; R.ear[i] += R.earV[i] * dt; }
    R.tailV += ((0 - R.tailA) * 220 - R.tailV * 12) * dt; R.tailA += R.tailV * dt;
    if ((R.blinkT -= dt) < 0) { R.blink = .12; R.blinkT = rand(2.2, 6); } R.blink -= dt;
    if (R.sniff) R.noseK = Math.max(0, Math.sin(T * 34)) * .22;
    else { if ((R.twitchT -= dt) < 0) { R.twitchT = rand(1.2, 3.4); R.twitchUntil = T + .35; } R.noseK = T < (R.twitchUntil || 0) ? Math.max(0, Math.sin(T * 40)) * .16 : 0; }
  }
  function rabbitDraw() {
    R.el.style.transform = 'translate3d(' + f2(R.x) + 'px,0,0)';
    var fs = Math.sign(R.faceS || 1) * Math.max(.6, Math.abs(R.faceS));
    R.root.setAttribute('transform', 'translate(0 ' + f2(-R.lift) + ') translate(95 131) scale(' + f2(fs * R.sx) + ' ' + f2(R.sy) + ') rotate(' + f2(R.tilt) + ') translate(-95 -131)');
    R.shadow.setAttribute('transform', 'translate(95 132) scale(' + f2(Math.max(.5, 1 - R.lift / 70)) + ' 1) translate(-95 -132)');
    R.head.setAttribute('transform', 'rotate(' + f2(R.headA) + ' 120 84)');
    R.earF.setAttribute('transform', 'rotate(' + f2(R.ear[0]) + ' 132 60)');
    R.earB.setAttribute('transform', 'rotate(' + f2(R.ear[1] * .9) + ' 124 61)');
    R.hind.setAttribute('transform', 'rotate(' + f2(R.hindA) + ' 72 106)');
    R.front.setAttribute('transform', 'rotate(' + f2(R.frontA) + ' 119 104)');
    R.tail.setAttribute('transform', 'rotate(' + f2(R.tailA) + ' 52 104)');
    R.nose.setAttribute('transform', 'translate(156 78) scale(' + f2(1 + R.noseK) + ' ' + f2(1 - R.noseK * .5) + ') translate(-156 -78)');
    var bl = R.blink > 0; if (bl !== R._bl) { R._bl = bl; R.eye.setAttribute('transform', bl ? 'translate(0 70) scale(1 .12) translate(0 -70)' : ''); }
  }

  /* ================================================================== CHICKS */
  // Centre-to-centre distances in body widths. SEP: bodies never overlap. GREET: a hello is said from a
  // polite step away, beaks well apart. COMFORT: closer than this, idle chicks mind their own business.
  var SEP = 1, GREET = 1.35, COMFORT = 1.7, faceT = 0;
  function makeChick(el, i) {
    return {
      el: el, i: i, w: 0, u: 1, x: 0, dir: i ? -1 : 1, lastDir: i ? -1 : 1, faceS: i ? -1 : 1, home: i ? .74 : .26,
      flip: el.querySelector('.c-flip'), body: el.querySelector('.c-body'), head: el.querySelector('.c-head'), wing: el.querySelector('.c-wing'), tail: el.querySelector('.c-tail'),
      legs: [el.querySelector('.c-leg-a'), el.querySelector('.c-leg-b')], eye: el.querySelector('.c-eye'), beak: el.querySelector('.c-beak-low'), heart: el.querySelector('.c-heart'), shadow: el.querySelector('.c-shadow'),
      speed: 0, phase: rand(0, 6), bob: 0, tilt: 0, shake: 0, headA: 0, headX: 0, wingA: 0, wingS: 1, tailA: 0, tailV: 0, beakA: 0, beakV: 0,
      lift: 0, liftV: 0, air: 0, sx: 1, sy: 1, sit: 0, shut: 0, turn: 0, flapT: 0, legA: [0, 0],
      blink: 0, blinkT: rand(1, 3), wagT: rand(2, 5), act: null, lastType: '', curiosity: rand(.4, 1),
      // Social things are rare and never bunch up: each has its own cool-down, counted from page load.
      lastHeart: -60, lastMeet: 0, meetGap: rand(45, 80), lastChase: 0, chaseGap: rand(18, 40), lastLeap: 0, leapGap: rand(30, 60), lastNap: 0, napGap: rand(30, 60)
    };
  }
  var chicks = chickEls.map(makeChick);
  chicks[0].other = chicks[1]; chicks[1].other = chicks[0];
  function chickRange(c) {
    var narrow = W < 700, lo = W * (narrow ? .55 : .57), hi = W * (narrow ? .985 : .965) - c.w;
    return [lo, Math.max(lo + 10, hi)];
  }
  function cx(c) { return c.x + c.w / 2; }
  function gap(c) { return Math.abs(c.x - c.other.x); }
  function side(c) { return c.x < c.other.x ? -1 : 1; }          // which side of my friend am I on
  function is(c, types) { return !!c.act && types.indexOf(c.act.type) > -1; }
  // Free to be approached: idling, not asleep and not already in a game.
  function calm(c) { return !c.act || (is(c, ['peck', 'scratch', 'look', 'preen', 'stretch', 'walk', 'hops']) && !c.act.why); }
  // Where a chick may stand without pushing through its friend.
  function span(c) {
    var r = chickRange(c), keep = 1.5 * c.w;
    if (side(c) < 0) return [r[0], clamp(c.other.x - keep, r[0], r[1])];
    return [clamp(c.other.x + keep, r[0], r[1]), r[1]];
  }
  function blocked(c, d) { return d === -side(c) && gap(c) < 1.4 * c.w; }
  function nearPointer(c, k) { return T - pointer.t < 1.5 && Math.abs(pointer.x - sceneLeft - cx(c)) < k * c.w && Math.abs(pointer.y - (sceneTop + scene.clientHeight - c.w * .6)) < 2.6 * c.w; }
  function chickStart(c, act) { act.t = 0; if (c.act) c.lastType = c.act.type; c.act = act; }
  function heart(c) {
    if (!c.heart.animate) return;
    c.lastHeart = c.other.lastHeart = T;
    c.heart.animate([
      { opacity: 0, transform: 'translate(0px,4px) scale(.3)' },
      { opacity: 1, transform: 'translate(' + (c.dir * 3) + 'px,-6px) scale(1.05)', offset: .2 },
      { opacity: 1, transform: 'translate(' + (c.dir * 6) + 'px,-14px) scale(1)', offset: .7 },
      { opacity: 0, transform: 'translate(' + (c.dir * 8) + 'px,-22px) scale(.9)' }
    ], { duration: 1500, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' });
    c.beakV = 1;
  }
  function walkTo(c, tx, speed, why) {
    var s = why === 'meet' ? chickRange(c) : span(c); tx = clamp(tx, s[0], s[1]);
    chickStart(c, { type: 'walk', tx: tx, speed: speed * c.u, why: why || '', dur: Math.abs(tx - c.x) / (speed * c.u) * 1.6 + 1.2, pause: !why && Math.random() < .35 ? rand(.25, .7) : 0 });
  }
  // A hello: both walk up and stop a polite step apart. Only the host may send a heart.
  function meet(c, withHeart) {
    var o = c.other, r = chickRange(c), half = GREET * c.w / 2;
    var mid = clamp((c.x + o.x) / 2, Math.min(r[0] + half, (r[0] + r[1]) / 2), Math.max(r[1] - half, (r[0] + r[1]) / 2));
    var left = side(c) < 0 ? c : o, right = left.other;
    walkTo(left, mid - half, 60, 'meet'); walkTo(right, mid + half, 60, 'meet');
    left.act.host = right.act.host = c; left.act.heart = right.act.heart = !!withHeart;
    c.lastMeet = o.lastMeet = T; c.meetGap = o.meetGap = rand(75, 130);
  }
  function canLeap(c) { var r = chickRange(c), to = c.other.x - side(c) * 1.4 * c.w; return to > r[0] && to < r[1]; }
  function chickNext(c) {
    var o = c.other, w = c.w, d = gap(c), r = chickRange(c), close = d < COMFORT * w;
    // Near your cursor? Curious chicks turn and wander over (but not too close).
    var px = pointer.x - sceneLeft;
    if (nearPointer(c, 3.2) && Math.random() < c.curiosity * .55) {
      c.dir = Math.sign(px - cx(c)) || c.dir;
      if (Math.abs(px - cx(c)) > w && Math.random() < .5) walkTo(c, px - w / 2 - c.dir * .7 * w, 40, 'curious');
      else chickStart(c, { type: 'look', dur: rand(.8, 1.6), at: 'pointer' });
      return;
    }
    var ok = calm(o), opts = [
      ['peck', .26], ['scratch', .08], ['wander', close ? .5 : .2], ['look', .12], ['preen', .07], ['stretch', .03], ['ruffle', .03], ['flutter', .03], ['hops', close ? .12 : .07],
      ['nap', T - c.lastNap > c.napGap && !is(o, ['nap']) ? .05 : 0],
      ['meet', ok && T - c.lastMeet > c.meetGap && d > (GREET + .3) * w ? .07 : 0],
      ['chase', ok && T - c.lastChase > c.chaseGap && d > 1.7 * w && d < 5.5 * w ? .07 : 0],
      ['leap', ok && T - c.lastLeap > c.leapGap && d < 4.5 * w && canLeap(c) ? .05 : 0]
    ];
    opts.forEach(function (op) { if (op[0] === c.lastType) op[1] *= .25; });   // nothing twice in a row
    var type = weighted(opts);
    // Standing close with nothing to say: turn away more often than not.
    if (close && Math.random() < .8) c.dir = side(c);
    if (type === 'peck') chickStart(c, { type: 'peck', n: Math.floor(rand(1, 5)), swallow: Math.random() < .4 });
    else if (type === 'scratch') chickStart(c, { type: 'scratch', dur: rand(1, 1.4) });
    else if (type === 'wander') {
      var s = span(c), tx;
      if (close) tx = c.x + side(c) * rand(1, 2.4) * w;                           // drift apart
      else if (Math.random() < .2) tx = rand(s[0], s[1]);                         // a longer stroll
      else tx = r[0] + (r[1] - r[0]) * c.home + rand(-1, 1) * rand(.05, .26) * (r[1] - r[0]);   // potter about the home patch
      tx = clamp(tx, s[0], s[1]);
      if (Math.abs(tx - c.x) < 16 * c.u) tx = clamp(c.x + (Math.random() < .5 ? -1 : 1) * rand(30, 70) * c.u, s[0], s[1]);
      if (Math.abs(tx - c.x) < 6) chickStart(c, { type: 'look', dur: rand(.7, 1.3), at: null });
      else walkTo(c, tx, Math.abs(tx - c.x) > 3 * w ? rand(42, 56) : rand(27, 42));   // a long stroll is brisker
    }
    else if (type === 'look') chickStart(c, { type: 'look', dur: rand(.8, 1.8), at: !close && Math.random() < .35 ? 'friend' : null });
    else if (type === 'flutter') chickStart(c, { type: 'flutter', dur: .6 });
    else if (type === 'preen') chickStart(c, { type: 'preen', dur: rand(1.1, 1.7) });
    else if (type === 'stretch') chickStart(c, { type: 'stretch', dur: rand(1.5, 2) });
    else if (type === 'ruffle') chickStart(c, { type: 'ruffle', dur: .6 });
    else if (type === 'hops') {
      var sp = span(c), room = c.dir > 0 ? sp[1] - c.x : c.x - sp[0];
      if (room < .5 * w) c.dir = -c.dir;
      chickStart(c, { type: 'hops', n: Math.floor(rand(2, 4)), len: rand(.26, .34) * w, idx: -1 });
    }
    else if (type === 'nap') chickStart(c, { type: 'nap', dur: rand(5, 9) });
    else if (type === 'meet') meet(c, T - c.lastHeart > 150 && Math.random() < .4);
    else if (type === 'chase') {
      c.lastChase = o.lastChase = T; c.chaseGap = o.chaseGap = rand(35, 70);
      chickStart(c, { type: 'chase', dur: rand(1.8, 2.8) });
      // The friend scampers off if there is room; cornered, it turns round to face the game.
      var so = side(o), ro = chickRange(o), roomO = so > 0 ? ro[1] - o.x : o.x - ro[0];
      if (roomO > 1.2 * w && Math.random() < .8) walkTo(o, o.x + so * rand(2.5, 4.5) * w, rand(96, 114), 'flee');
      else { o.dir = -so; chickStart(o, { type: 'flutter', dur: .6 }); }
    }
    else if (type === 'leap') {
      c.lastLeap = o.lastLeap = T; c.leapGap = o.leapGap = rand(55, 100);
      chickStart(c, { type: 'leap', stage: 0, from: o.x + side(c) * 1.4 * w });
      chickStart(o, { type: 'look', dur: 3, at: 'friend', why: 'leap' });           // watches the run-up
    }
  }
  function chickUpdate(c, dt) {
    var o = c.other; if (!c.act) chickNext(c);
    var a = c.act, u = c.u, w = c.w; a.t += dt;
    var target = 0, headT = 0, tilt = 0, sx = 1, sy = 1, sit = 0, shut = 0, wingT = 0, tailT = 0, legs = null, air = 0, scripted = false, done = false, k, f, idx, e, s, dx;
    c.flapping = false; c.shake = 0;
    switch (a.type) {
      case 'walk':
        dx = a.tx - c.x; s = Math.sign(dx) || c.dir;
        if (a.pause && !a.paused && a.t > .7) { a.paused = true; a.hold = a.pause; }
        if (a.hold > 0) { a.hold -= dt; headT = -9; }                               // stops to look about
        else if (Math.abs(dx) < 3 || a.t > a.dur || (a.why !== 'meet' && blocked(c, s))) done = true;
        else {
          c.dir = s; target = a.speed * (Math.abs(dx) < 26 * u ? clamp(Math.abs(dx) / (26 * u), .35, 1) : 1);
          if (a.speed > 80 * u && c.lift <= 0 && Math.random() < dt * 2.2) c.liftV = 95;   // little running skips
        }
        if (done && a.why === 'meet') done = false, chickStart(c, { type: 'greet', dur: 1.5, wait: true, heart: a.heart && a.host === c, hop: a.heart && a.host !== c });
        break;
      case 'hops':                                                                   // two-footed hops, like a sparrow
        k = a.t / .3; idx = Math.floor(k); f = k - idx;
        if (idx >= a.n || blocked(c, c.dir)) { done = true; break; }
        if (idx !== a.idx) { a.idx = idx; a.x0 = c.x; }
        scripted = true; s = span(c); e = f < .7 ? Math.sin(Math.PI * f / .7) : 0;
        c.x = clamp(a.x0 + c.dir * a.len * smooth(f / .7), s[0], s[1]);
        air = 9 * e; sy = f < .7 ? 1 + .05 * e : 1 - .1 * Math.sin(Math.PI * (f - .7) / .3); sx = 2 - sy;
        legs = e > .1 ? [20, 28] : [0, 0]; headT = -6; tailT = 10 * e;
        break;
      case 'peck':                                                                   // draw back, strike, lift
        k = a.t / .36; idx = Math.floor(k); f = k - idx;
        if (idx >= a.n) {
          e = (a.t - a.n * .36) / .5;
          if (a.swallow && e < 1) { headT = -16 * Math.sin(Math.PI * e); if (!a.gulp) { a.gulp = true; c.beakV = 1; } }
          else done = true;
        } else {
          e = f < .12 ? -.18 * (f / .12) : f < .34 ? -.18 + 1.18 * smooth((f - .12) / .22) : f < .5 ? 1 : 1 - smooth((f - .5) / .5);
          headT = 54 * e; tilt = 15 * Math.max(0, e); sy = 1 - .05 * Math.max(0, e); tailT = 16 * Math.max(0, e);
        }
        break;
      case 'scratch':
        s = a.t * 7.5; legs = [-50 * Math.max(0, Math.sin(s)), 0]; tilt = 9; headT = 22; tailT = 10;
        if (Math.sin(s) < 0 && !a.stepped) { a.stepped = true; e = span(c); c.x = clamp(c.x - c.dir * 2.5 * u, e[0], e[1]); }
        if (Math.sin(s) > 0) a.stepped = false;
        if (a.t > a.dur) chickStart(c, { type: 'peck', n: Math.floor(rand(2, 4)), swallow: Math.random() < .5 });
        break;
      case 'look':
        if (a.at === 'friend') c.dir = -side(c);
        else if (a.at === 'pointer') c.dir = Math.sign(pointer.x - sceneLeft - cx(c)) || c.dir;
        headT = a.at === 'sky' ? -26 + Math.sin(a.t * 3) * 4 : -10 + Math.sin(a.t * 4.2 + c.i) * 9;   // curious tilts; up at a landing bird
        if (a.t > a.dur) done = true;
        break;
      case 'flutter':
        if (!a.jumped) { a.jumped = true; if (c.lift <= 0) c.liftV = 126; }
        c.flapping = true; headT = -8;
        if (a.t > a.dur) done = true;
        break;
      case 'preen':
        headT = 34 + Math.sin(a.t * 11) * 6; wingT = -20; tilt = -3;
        if (a.t > a.dur) done = true;
        break;
      case 'stretch':                                                                // one leg and the wing reach back
        e = smooth(a.t / .4) * (1 - smooth((a.t - a.dur + .4) / .4));
        legs = [0, 40 * e]; wingT = -30 * e; tilt = 9 * e; headT = -9 * e; sx = 1 + .05 * e; tailT = -8 * e;
        if (a.t > a.dur) done = true;
        break;
      case 'ruffle':                                                                 // a quick shake that fluffs the feathers
        e = 1 - smooth(a.t / a.dur); c.shake = Math.sin(a.t * 62) * 5.5 * e; sx = 1 + .09 * e; sy = 1 + .04 * e; wingT = -12 * e; tailT = Math.sin(a.t * 62 + 1) * 14 * e;
        if (a.t > a.dur) done = true;
        break;
      case 'nap':                                                                    // settles into the grass and dozes
        e = smooth(a.t / .6) * (a.wake ? 1 - smooth((a.t - a.wake) / .35) : 1);
        sit = e; shut = a.t > 1.4 && !a.wake ? 1 : 0; headT = 10 * e + 6 * shut; sx = 1 + .06 * e; sy = (1 - .03 * e) * (1 + .03 * Math.sin(a.t * 1.7) * shut); wingT = 4 * e;
        // Up again when rested, when your cursor comes close or when the friend gets lively nearby.
        if (!a.wake && (a.t > a.dur || nearPointer(c, 1.6) || (is(o, ['chase', 'leap', 'flutter', 'greet']) && gap(c) < 3 * w))) a.wake = a.t;
        if (a.wake && a.t > a.wake + .35) { c.lastNap = T; c.napGap = rand(45, 80); chickStart(c, { type: 'ruffle', dur: .6 }); }
        break;
      case 'greet':                                                                  // two nods across the gap
        c.dir = -side(c);
        if (a.wait) {
          headT = -7;
          if (is(o, ['greet'])) { a.wait = false; a.t = 0; if (o.act.wait) { o.act.wait = false; o.act.t = 0; } }
          else if (a.t > 3) done = true;
          break;
        }
        e = Math.max(0, Math.sin(a.t * 8.5));
        if (a.t < .95) { headT = 16 * e; sy = 1 - .05 * e; } else headT = -6;
        if (a.heart && !a.hearted && a.t > .45) { a.hearted = true; heart(c); }
        if (a.hop && !a.hopped && a.t > .7) { a.hopped = true; if (c.lift <= 0) c.liftV = 112; c.flapT = .36; }
        if (a.t > a.dur) walkTo(c, c.x + side(c) * rand(1.6, 3.2) * w, rand(30, 44));   // and off they go, opposite ways
        break;
      case 'chase':                                                                  // runs after the friend, never onto it
        s = side(c); dx = o.x + s * 1.4 * w - c.x;
        if (a.t > a.dur || (Math.abs(dx) < 5 && o.speed < 14 * u)) { c.dir = -s; chickStart(c, { type: 'flutter', dur: .55 }); }
        else if (Math.sign(dx) === -s && Math.abs(dx) > 3) { c.dir = -s; target = 112 * u * clamp(Math.abs(dx) / (30 * u), .25, 1); if (c.lift <= 0 && Math.random() < dt * 2.4) c.liftV = 95; }
        else c.dir = -s;
        break;
      case 'duck':                                                                   // the friend is sailing overhead
        e = smooth(a.t / .14) * (1 - smooth((a.t - a.dur + .22) / .22)); sy = 1 - .2 * e; sx = 1 + .1 * e; headT = -22 * e;
        if (a.t > a.dur * .6) c.dir = -side(c);
        if (a.t > a.dur) chickStart(c, { type: 'look', dur: rand(.7, 1.1), at: 'friend' });
        break;
      case 'leap':                                                                   // leapfrog: run up, flap over, land on the far side
        if (a.stage === 0) {
          dx = a.from - c.x;
          if (Math.abs(dx) < 4 || a.t > 2.6) {
            s = side(c); e = chickRange(c); k = o.x - s * 1.4 * w;
            if (k <= e[0] || k >= e[1] || gap(c) > 2.2 * w || !is(o, ['look'])) { done = true; if (is(o, ['look']) && o.act.why) o.act.dur = 0; break; }   // lost its nerve
            a.stage = 1; a.t = 0; a.x0 = c.x; a.to = k; a.away = -s; c.dir = -s; c.leaping = true;
            chickStart(o, { type: 'duck', dur: .9 });
          } else { c.dir = Math.sign(dx); target = 104 * u; }
        } else if (a.t < .14) { scripted = true; sy = 1 - .2 * smooth(a.t / .14); sx = 1 + .1 * smooth(a.t / .14); wingT = -30; }   // crouch
        else {
          scripted = true; k = clamp((a.t - .14) / .62, 0, 1);
          c.x = a.x0 + (a.to - a.x0) * k; air = 92 * 4 * k * (1 - k); c.flapping = true;
          tilt = -16 + 34 * k; legs = [26, 34]; headT = -6; sy = 1.06; sx = .96; tailT = -14 + 28 * k;
          if (k >= 1) { c.leaping = false; c.sy = .78; c.sx = 1.16; c.tailV += 320; c.flapT = .18; chickStart(c, { type: 'look', dur: rand(.8, 1.2), at: 'friend' }); }
        }
        break;
      case 'dodge':                                                                  // a startled hop back from your cursor
        scripted = true; k = clamp(a.t / a.dur, 0, 1); s = span(c);
        c.x = clamp(a.x0 + a.away * .6 * w * smooth(k), s[0], s[1]); air = 13 * Math.sin(Math.PI * k); c.flapping = true; c.dir = -a.away; headT = -10;
        if (k >= 1) { done = true; c.sy = .86; c.sx = 1.1; }
        break;
    }
    if (done) c.act = null;

    // Your cursor right on top of an awake chick: it hops back.
    dx = pointer.x - sceneLeft - cx(c);
    if (T - pointer.t < .3 && Math.abs(dx) < .4 * w && Math.abs(pointer.y - (sceneTop + scene.clientHeight - w * .6)) < .75 * w && c.lift <= 0 && !c.leaping && !is(c, ['dodge', 'nap', 'duck']))
      chickStart(c, { type: 'dodge', away: dx > 0 ? -1 : 1, x0: c.x, dur: .34 });

    c.speed = damp(c.speed, target, 9, dt);
    if (!scripted) { c.x += c.dir * c.speed * dt; s = chickRange(c); c.x = clamp(c.x, s[0], s[1]); }

    // Gait: the legs step with the ground covered, so the feet do not skate; strides lengthen into a run.
    var run = clamp((c.speed / u - 55) / 50, 0, 1), g = clamp(c.speed / (22 * u), 0, 1);
    c.phase += c.speed * dt / (w * (.18 + .2 * run)) * Math.PI;
    var up = c.lift + air > .5;
    if (!legs) legs = up ? [20, 28] : [Math.sin(c.phase) * 27 * g, Math.sin(c.phase + Math.PI) * 27 * g];
    c.legA[0] = damp(c.legA[0], legs[0], 30, dt); c.legA[1] = damp(c.legA[1], legs[1], 30, dt);
    c.bob = -Math.abs(Math.sin(c.phase)) * 1.5 * g;
    // The chicken walk: the head holds still in space while the body moves under it, then darts forward.
    var st = (c.phase / Math.PI) % 1, thrust = st < .62 ? .5 - st / .62 : (st - .62) / .38 - .5;
    c.headX = damp(c.headX, thrust * 3.4 * g * (1 - run * .6), 40, dt);
    headT += Math.sin(c.phase * 2) * 3 * g; tilt += 4 * g + 8 * run;
    // Hops and skips.
    if (c.liftV !== 0 || c.lift > 0) { c.liftV -= 640 * dt; c.lift += c.liftV * dt; if (c.lift <= 0) { c.lift = 0; c.liftV = 0; c.sy = .86; c.sx = 1.1; c.tailV += 240; } }
    c.air = air;
    if (c.dir !== c.lastDir) { c.lastDir = c.dir; if (!up && !scripted && c.sit < .2) c.turn = 1; }
    if (c.turn > 0) { c.turn -= dt / .2; c.air += Math.sin(Math.PI * (1 - Math.max(0, c.turn))) * 2.6; }
    // Wings: flapping, pumping on a run, or tucked.
    if (c.flapT > 0) { c.flapT -= dt; c.flapping = true; }
    if (c.flapping) c.wingA = 6 + Math.sin(T * 40 + c.i) * 48;                // opens past the back, beats through a wide arc
    else c.wingA = damp(c.wingA, run > .5 ? -14 + Math.sin(c.phase * 2) * 9 : wingT, run > .5 ? 22 : 12, dt);
    // Tail: a spring with the odd idle flick.
    if ((c.wagT -= dt) < 0) { c.wagT = rand(2.5, 7); if (c.sit < .2) c.tailV += (Math.random() < .5 ? -1 : 1) * 260; }
    c.tailV += ((tailT - c.tailA) * 200 - c.tailV * 13) * dt; c.tailA += c.tailV * dt;

    c.wingS = damp(c.wingS, c.flapping ? 1.32 : 1, 26, dt);
    c.faceS = damp(c.faceS, c.dir, 22, dt);
    c.headA = damp(c.headA, headT, is(c, ['peck']) ? 40 : 14, dt);
    c.tilt = damp(c.tilt, tilt, 16, dt);
    c.sx = damp(c.sx, sx, 12, dt); c.sy = damp(c.sy, sy * (1 + .015 * Math.sin(T * 3 + c.i)), 12, dt);
    c.sit = damp(c.sit, sit, 14, dt); c.shut = damp(c.shut, shut, 7, dt);
    if (c.beakV > 0) { c.beakV -= dt * 3; c.beakA = Math.max(0, Math.sin((1 - c.beakV) * Math.PI * 3)) * 22; } else c.beakA = 0;
    if ((c.blinkT -= dt) < 0) { c.blink = .1; c.blinkT = rand(1.6, 4.5); } c.blink -= dt;
  }
  // Between the two of them: never overlap, and never stand idle nose to nose.
  function neighbours(dt) {
    var a = chicks[0], b = chicks[1], w = a.w, d = Math.abs(a.x - b.x);
    if (!a.leaping && !b.leaping && d < SEP * w) {
      // Each gives half; at a fence the other gives it all.
      var l = a.x < b.x ? a : b, r = l.other, rg = chickRange(l), push = (SEP * w - d) * Math.min(1, dt * 14);
      var lx = l.x - push / 2, rx = r.x + push / 2;
      if (lx < rg[0]) { rx += rg[0] - lx; lx = rg[0]; }
      if (rx > rg[1]) { lx -= rx - rg[1]; rx = rg[1]; }
      l.x = Math.max(rg[0], lx); r.x = rx;
    }
    var facing = a.x < b.x ? a.dir > 0 && b.dir < 0 : a.dir < 0 && b.dir > 0;
    var talking = [a, b].some(function (c) { return is(c, ['greet', 'chase', 'leap', 'duck', 'dodge']) || (c.act && (c.act.why === 'meet' || c.act.at === 'friend' || c.act.at === 'pointer')); });
    if (facing && d < COMFORT * w && !talking) {
      if ((faceT += dt) > 1.1) { faceT = 0; var t = Math.random() < .5 ? a : b; if (is(t, ['walk', 'hops'])) t = t.other; if (!is(t, ['walk', 'hops'])) t.dir = side(t); }
    } else faceT = 0;
  }
  function chickDraw(c) {
    c.el.style.transform = 'translate3d(' + f2(c.x) + 'px,0,0)';
    if (!!c.leaping !== c._lp) { c._lp = !!c.leaping; c.el.style.zIndex = c.leaping ? 3 : ''; }
    var h = c.lift + c.air, fs = Math.sign(c.faceS || 1) * Math.max(.62, Math.abs(c.faceS));
    c.flip.setAttribute('transform', 'translate(0 ' + f2(-h) + ') translate(40 76) scale(' + f2(fs) + ' 1) translate(-40 -76)');
    c.shadow.setAttribute('transform', 'translate(40 76.5) scale(' + f2(Math.max(.45, 1 - h / 110)) + ' 1) translate(-40 -76.5)');
    c.body.setAttribute('transform', 'translate(0 ' + f2(c.bob + c.sit * 11) + ') translate(40 76) rotate(' + f2(c.tilt + c.shake) + ') scale(' + f2(c.sx) + ' ' + f2(c.sy) + ') translate(-40 -76)');
    c.head.setAttribute('transform', 'translate(' + f2(c.headX) + ' 0) rotate(' + f2(c.headA) + ' 49 41)');
    c.wing.setAttribute('transform', 'rotate(' + f2(c.wingA) + ' 42 42) translate(42 42) scale(' + f2(c.wingS) + ') translate(-42 -42)');
    c.tail.setAttribute('transform', 'rotate(' + f2(c.tailA) + ' 22 43)');
    c.legs[0].setAttribute('transform', 'rotate(' + f2(c.legA[0]) + ' 35 60)');
    c.legs[1].setAttribute('transform', 'rotate(' + f2(c.legA[1]) + ' 43 60)');
    c.beak.setAttribute('transform', 'rotate(' + f2(c.beakA) + ' 64 33)');
    var bl = c.blink > 0 || c.shut > .5; if (bl !== c._bl) { c._bl = bl; c.eye.setAttribute('transform', bl ? 'translate(0 27) scale(1 .12) translate(0 -27)' : ''); }
  }

  /* ================================================================== loop */
  function place() {
    measure();
    R.w = R.el.offsetWidth; chicks.forEach(function (c) { c.w = c.el.offsetWidth; c.u = c.w / 60; });
    var rr = rabbitRange(); R.x = clamp(R.x || rr[0] + (rr[1] - rr[0]) * .45, rr[0], rr[1]);
    chicks.forEach(function (c) { var r = chickRange(c); c.x = clamp(c.x || r[0] + (r[1] - r[0]) * c.home, r[0], r[1]); });
  }
  function step(dt) {
    T += dt; measure();
    rabbitUpdate(dt); chicks.forEach(function (c) { chickUpdate(c, dt); }); neighbours(dt);
  }
  function draw() { rabbitDraw(); chicks.forEach(chickDraw); }
  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60; last = now;
    step(dt); draw();
    requestAnimationFrame(frame);
  }
  var frozen = false;
  function setRunning() {
    var should = visible && !document.hidden && !reduce && !frozen;
    if (should && !running) { running = true; last = 0; requestAnimationFrame(frame); }
    else if (!should) running = false;
  }
  place(); draw();
  window.addEventListener('resize', function () { place(); if (!running) draw(); }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; setRunning(); }).observe(scene);
  else { visible = true; setRunning(); }
  document.addEventListener('visibilitychange', setRunning);

  // Test hook (only with ?meadow-debug): freeze the live loop and step the simulation by hand.
  if (/meadow-debug/.test(location.search)) window.__meadow = { R: R, chicks: chicks, startle: startle, start: chickStart, meet: meet,
    freeze: function () { frozen = true; setRunning(); },
    tick: function (dt) { step(dt); },
    step: function (n, dt) { dt = dt || 1 / 60; for (var k = 0; k < n; k++) step(dt); draw(); return T; } };

  // A bird landing in the tree: idle chicks look up, the rabbit's ears prick.
  document.addEventListener('flock:tree-landing', function () {
    if (reduce || !running) return;
    chicks.forEach(function (c) {
      if (!c.act || (is(c, ['peck', 'look', 'preen']) && !c.act.why)) { c.dir = cx(c) > W / 2 ? -1 : 1; chickStart(c, { type: 'look', dur: rand(.9, 1.5), at: 'sky' }); }
    });
    R.alert = 1; R.earV[0] -= 140; R.earV[1] -= 110;
  });

  /* ================================================================== clicks */
  rabbitEl.addEventListener('click', function (e) {
    if (reduce) { R.ear = [-12, -8]; rabbitDraw(); return; }
    startle(e.clientX || (sceneLeft + R.x));
    // The chicks notice the commotion (a dozing one wakes with a start).
    chicks.forEach(function (c) {
      if (is(c, ['nap'])) { if (!c.act.wake) c.act.wake = c.act.t; }
      else if (calm(c) && !is(c, ['walk', 'hops'])) { c.dir = -1; chickStart(c, { type: 'look', dur: rand(.8, 1.4), at: null }); }
    });
  });
  chickEls.forEach(function (el, i) {
    el.addEventListener('click', function () {
      var c = chicks[i], o = c.other;
      if (reduce) { el.classList.add('is-hearting'); setTimeout(function () { el.classList.remove('is-hearting'); }, 1400); return; }
      if (c.leaping || o.leaping) return;
      // A happy flutter, then the two say hello from a step apart; the one you clicked sends the heart.
      chickStart(c, { type: 'flutter', dur: .6 });
      setTimeout(function () { if (!c.leaping && !o.leaping && !is(c, ['dodge'])) meet(c, true); }, 480);
    });
  });
})();
