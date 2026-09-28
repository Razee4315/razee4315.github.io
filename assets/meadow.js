/* Meadow residents: one rabbit and two chicks living in the grass under the tree.
   Built to the same standard as the flying birds in birds.js: jointed SVG rigs, spring physics,
   squash and stretch, smoothed turning, and a small planner that picks the next thing to do from
   what the animal just did, where its friend is and where your cursor is. Nothing repeats on a timer.
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
    var fs = Math.sign(R.faceS || 1) * Math.max(.4, Math.abs(R.faceS));
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
  function makeChick(el, i) {
    return {
      el: el, i: i, w: 0, x: 0, dir: i ? -1 : 1, faceS: i ? -1 : 1,
      flip: el.querySelector('.c-flip'), body: el.querySelector('.c-body'), head: el.querySelector('.c-head'), wing: el.querySelector('.c-wing'),
      legs: [el.querySelector('.c-leg-a'), el.querySelector('.c-leg-b')], eye: el.querySelector('.c-eye'), beak: el.querySelector('.c-beak-low'), heart: el.querySelector('.c-heart'),
      speed: 0, vx: 0, phase: rand(0, 6), bob: 0, tilt: 0, headA: 0, wingA: 0, wingV: 0, beakA: 0, hop: 0, hopV: 0, sx: 1, sy: 1,
      legA: [0, 0], blink: 0, blinkT: rand(1, 3), act: null, lastHeart: -20, lastMeet: -20, lookAt: null, curiosity: rand(.4, 1)
    };
  }
  var chicks = chickEls.map(makeChick);
  chicks[0].other = chicks[1]; chicks[1].other = chicks[0];
  function chickRange(c) {
    var narrow = W < 700, lo = W * (narrow ? .56 : .58), hi = W * (narrow ? .98 : .96) - c.w;
    return [lo, Math.max(lo + 10, hi)];
  }
  function cx(c) { return c.x + c.w / 2; }
  function chickStart(c, act) { act.t = 0; c.act = act; }
  function heart(c, delay) {
    if (!c.heart.animate) return;
    c.lastHeart = T;
    c.heart.animate([
      { opacity: 0, transform: 'translate(0px,4px) scale(.3)' },
      { opacity: 1, transform: 'translate(' + (c.dir * 3) + 'px,-6px) scale(1.05)', offset: .2 },
      { opacity: 1, transform: 'translate(' + (c.dir * 6) + 'px,-14px) scale(1)', offset: .7 },
      { opacity: 0, transform: 'translate(' + (c.dir * 8) + 'px,-22px) scale(.9)' }
    ], { duration: 1500, delay: delay || 0, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' });
    c.beakV = 1;
  }
  function walkTo(c, tx, speed, why) {
    var r = chickRange(c); tx = clamp(tx, r[0], r[1]);
    chickStart(c, { type: 'walk', tx: tx, speed: speed, why: why || 'wander', pause: Math.random() < .35 ? rand(.2, .6) : 0, dur: 8 });
  }
  function meet(c, withHeart) {
    var o = c.other, gap = 30 + c.w * .1;
    var mid = (cx(c) + cx(o)) / 2;
    var left = cx(c) < cx(o) ? c : o, right = left === c ? o : c;
    walkTo(left, mid - gap / 2 - left.w / 2, 70, 'meet'); walkTo(right, mid + gap / 2 - right.w / 2, 70, 'meet');
    left.meetHeart = right.meetHeart = !!withHeart;
    c.lastMeet = o.lastMeet = T;
  }
  function chickNext(c) {
    var o = c.other, d = Math.abs(cx(c) - cx(o)), r = chickRange(c);
    // Near your cursor? Curious chicks turn and wander over (but not too close).
    var px = pointer.x - sceneLeft, near = T - pointer.t < 1.5 && Math.abs(px - cx(c)) < 190 && Math.abs(pointer.y - (sceneTop + scene.clientHeight - 40)) < 170;
    if (near && Math.random() < c.curiosity * .6) {
      c.dir = Math.sign(px - cx(c)) || c.dir;
      if (Math.abs(px - cx(c)) > 60 && Math.random() < .5) walkTo(c, px - c.w / 2 - c.dir * 40, 42, 'curious');
      else chickStart(c, { type: 'look', dur: rand(.8, 1.6), at: 'pointer' });
      return;
    }
    var type = weighted([
      ['peck', .3], ['scratch', .1], ['wander', .24], ['look', .14], ['flutter', .04], ['preen', .06],
      ['approach', d > 110 && T - c.lastMeet > 7 ? .2 : .02],
      ['chase', (o.act && (o.act.type === 'walk' || o.act.type === 'peck')) && d < 260 && T - c.lastMeet > 4 ? .09 : 0]
    ]);
    if (type === 'peck') chickStart(c, { type: 'peck', n: Math.floor(rand(1, 5)), dur: 0 });
    else if (type === 'scratch') chickStart(c, { type: 'scratch', dur: rand(1, 1.4) });
    else if (type === 'wander') { var tx = clamp(c.x + rand(-1, 1) * rand(30, 140), r[0], r[1]); walkTo(c, tx, rand(26, 44)); }
    else if (type === 'look') chickStart(c, { type: 'look', dur: rand(.8, 1.8), at: Math.random() < .5 ? 'friend' : null });
    else if (type === 'flutter') chickStart(c, { type: 'flutter', dur: .7 });
    else if (type === 'preen') chickStart(c, { type: 'preen', dur: rand(1, 1.6) });
    else if (type === 'approach') meet(c, T - c.lastHeart > 10 && Math.random() < .4);
    else if (type === 'chase') {
      chickStart(c, { type: 'chase', dur: rand(1.8, 3.2) });
      // The friend runs off, or turns round to face the game.
      if (Math.random() < .7) { var away = cx(o) > cx(c) ? r[1] : r[0]; walkTo(o, away, rand(95, 120), 'flee'); }
      else { o.dir = cx(c) > cx(o) ? 1 : -1; chickStart(o, { type: 'look', dur: 1, at: 'friend' }); }
    }
  }
  function chickUpdate(c, dt) {
    var o = c.other; if (!c.act) chickNext(c);
    var a = c.act; a.t += dt;
    var targetSpeed = 0, headT = 0, tilt = 0, sx = 1, sy = 1, done = false;
    if (a.type === 'walk' || a.type === 'chase') {
      var tx = a.type === 'chase' ? cx(o) - c.w / 2 - Math.sign(cx(o) - cx(c)) * 26 : a.tx;
      var dx = tx - c.x;
      if (a.pause > 0 && a.t > .8 && !a.paused) { a.paused = true; a.hold = a.pause; }
      if (a.hold > 0) { a.hold -= dt; targetSpeed = 0; headT = -8; }
      else {
        targetSpeed = a.type === 'chase' ? 118 : a.speed;
        if (Math.abs(dx) < 4 || (a.type === 'chase' && a.t > a.dur)) { done = true; targetSpeed = 0; }
        else c.dir = Math.sign(dx);
        if (Math.abs(dx) < 30) targetSpeed *= clamp(Math.abs(dx) / 30, .3, 1);
        if (targetSpeed > 80 && Math.random() < dt * 2.2 && c.hop <= 0) c.hopV = 90; // little running skips
      }
      if (done && a.why === 'meet') {
        // Arrived: face each other, bob, and sometimes share a heart.
        c.dir = cx(o) > cx(c) ? 1 : -1;
        chickStart(c, { type: 'greet', dur: 1.3, heart: c.meetHeart, bobbed: 0 });
        return;
      }
    } else if (a.type === 'peck') {
      var n = a.n, per = .34, k = a.t / per, idx = Math.floor(k), f = k - idx;
      if (idx >= n) done = true;
      else { var dip = f < .3 ? smooth(f / .3) : f < .45 ? 1 : 1 - smooth((f - .45) / .55); headT = 56 * dip; tilt = 12 * dip; sy = 1 - .05 * dip; }
    } else if (a.type === 'scratch') {
      var s = a.t * 7, kick = Math.max(0, Math.sin(s)); c.legA[0] = -52 * kick; tilt = 8; headT = 20;
      if (Math.sin(s) < 0 && !a.stepped) { a.stepped = true; c.x -= c.dir * 3; } if (Math.sin(s) > 0) a.stepped = false;
      if (a.t > a.dur) { chickStart(c, { type: 'peck', n: Math.floor(rand(2, 4)), dur: 0 }); return; }
    } else if (a.type === 'look') {
      if (a.at === 'friend') c.dir = cx(o) > cx(c) ? 1 : -1;
      if (a.at === 'pointer') c.dir = Math.sign(pointer.x - sceneLeft - cx(c)) || c.dir;
      headT = a.at === 'sky' ? -24 + Math.sin(a.t * 3) * 4 : -10 + Math.sin(a.t * 4.2) * 9; // curious head tilts; up at a landing bird
      if (a.t > a.dur) done = true;
    } else if (a.type === 'flutter') {
      c.wingV += 0; if (a.t < .05 && c.hop <= 0) c.hopV = 70;
      c.flapping = true; headT = -6;
      if (a.t > a.dur) { done = true; c.flapping = false; }
    } else if (a.type === 'preen') {
      headT = 30 + Math.sin(a.t * 10) * 6; c.preening = true;
      if (a.t > a.dur) { done = true; c.preening = false; }
    } else if (a.type === 'greet') {
      var bob = Math.sin(a.t * 9); if (a.t < .9) { sy = 1 - .06 * Math.max(0, bob); headT = -12 * Math.max(0, bob); }
      if (a.heart && !a.hearted && a.t > .35) { a.hearted = true; heart(c, c.i * 180); }
      if (a.t > a.dur) {
        // Wander off in opposite directions.
        var r = chickRange(c), away = cx(o) > cx(c) ? -1 : 1;
        walkTo(c, c.x + away * rand(50, 120), rand(30, 46)); return;
      }
    }
    if (done) c.act = null;

    // Startled by a cursor right on top: skip back.
    var px = pointer.x - sceneLeft;
    if (T - pointer.t < .3 && Math.abs(px - cx(c)) < 22 && Math.abs(pointer.y - (sceneTop + scene.clientHeight - 36)) < 40 && c.hop <= 0) { c.hopV = 80; c.x -= Math.sign(px - cx(c) || 1) * 6; }

    c.speed = damp(c.speed, targetSpeed, 8, dt);
    c.x += c.dir * c.speed * dt * (a.type === 'walk' || a.type === 'chase' ? 1 : 0);
    var rg = chickRange(c); c.x = clamp(c.x, rg[0], rg[1]);
    // Keep a little personal space unless greeting.
    if (Math.abs(cx(c) - cx(o)) < c.w * .55 && (!c.act || c.act.type !== 'greet')) c.x += (cx(c) < cx(o) ? -1 : 1) * 20 * dt;

    // Walk cycle: alternating legs, body bob, the typical chick head-bob.
    var s = clamp(c.speed / 60, 0, 1.6);
    c.phase += dt * (4 + c.speed * .16);
    if (!(a && a.type === 'scratch')) { c.legA[0] = damp(c.legA[0], Math.sin(c.phase) * 28 * Math.min(1, s), 26, dt); }
    c.legA[1] = damp(c.legA[1], Math.sin(c.phase + Math.PI) * 28 * Math.min(1, s), 26, dt);
    c.bob = -Math.abs(Math.sin(c.phase)) * 1.6 * Math.min(1, s);
    headT += Math.sin(c.phase * 2) * 5 * Math.min(1, s);
    tilt += 5 * Math.min(1, s);
    // Hop physics.
    if (c.hopV !== 0 || c.hop > 0) { c.hopV -= 520 * dt; c.hop += c.hopV * dt; if (c.hop <= 0) { c.hop = 0; c.hopV = 0; c.sy = .86; c.sx = 1.08; } }
    // Wings: flutter spring or tucked.
    if (c.flapping) c.wingA = -40 + Math.sin(a.t * 38) * 32;
    else { c.wingV += ((0 - c.wingA) * 160 - c.wingV * 14) * dt; c.wingA += c.wingV * dt; if (c.speed > 90) c.wingA = -14 + Math.sin(c.phase * 2) * 10; }
    if (c.preening) c.wingA = -18;
    c.faceS = damp(c.faceS, c.dir, 18, dt);
    c.headA = damp(c.headA, headT, a && a.type === 'peck' ? 40 : 14, dt);
    c.tilt = damp(c.tilt, tilt, 16, dt);
    c.sx = damp(c.sx, sx, 12, dt); c.sy = damp(c.sy, sy * (1 + .015 * Math.sin(T * 3 + c.i)), 12, dt);
    if (c.beakV > 0) { c.beakV -= dt * 3; c.beakA = Math.max(0, Math.sin((1 - c.beakV) * Math.PI * 3)) * 22; } else c.beakA = 0;
    if ((c.blinkT -= dt) < 0) { c.blink = .1; c.blinkT = rand(1.6, 4.5); } c.blink -= dt;
  }
  function chickDraw(c) {
    c.el.style.transform = 'translate3d(' + f2(c.x) + 'px,0,0)';
    var fs = Math.sign(c.faceS || 1) * Math.max(.4, Math.abs(c.faceS));
    c.flip.setAttribute('transform', 'translate(0 ' + f2(-c.hop) + ') translate(40 76) scale(' + f2(fs) + ' 1) translate(-40 -76)');
    c.body.setAttribute('transform', 'translate(0 ' + f2(c.bob) + ') translate(40 76) rotate(' + f2(c.tilt) + ') scale(' + f2(c.sx) + ' ' + f2(c.sy) + ') translate(-40 -76)');
    c.head.setAttribute('transform', 'rotate(' + f2(c.headA) + ' 49 41)');
    c.wing.setAttribute('transform', 'rotate(' + f2(c.wingA) + ' 42 42)');
    c.legs[0].setAttribute('transform', 'rotate(' + f2(c.legA[0]) + ' 35 60)');
    c.legs[1].setAttribute('transform', 'rotate(' + f2(c.legA[1]) + ' 43 60)');
    c.beak.setAttribute('transform', 'rotate(' + f2(c.beakA) + ' 64 33)');
    var bl = c.blink > 0; if (bl !== c._bl) { c._bl = bl; c.eye.setAttribute('transform', bl ? 'translate(0 27) scale(1 .12) translate(0 -27)' : ''); }
  }

  /* ================================================================== loop */
  function place() {
    measure();
    R.w = R.el.offsetWidth; chicks.forEach(function (c) { c.w = c.el.offsetWidth; });
    var rr = rabbitRange(); R.x = clamp(R.x || rr[0] + (rr[1] - rr[0]) * .45, rr[0], rr[1]);
    chicks.forEach(function (c, i) { var r = chickRange(c); c.x = clamp(c.x || r[0] + (r[1] - r[0]) * (i ? .8 : .25), r[0], r[1]); });
  }
  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60; last = now; T += dt;
    measure();
    rabbitUpdate(dt); rabbitDraw();
    chicks.forEach(function (c) { chickUpdate(c, dt); chickDraw(c); });
    requestAnimationFrame(frame);
  }
  function setRunning() {
    var should = visible && !document.hidden && !reduce;
    if (should && !running) { running = true; last = 0; requestAnimationFrame(frame); }
    else if (!should) running = false;
  }
  place(); rabbitDraw(); chicks.forEach(chickDraw);
  window.addEventListener('resize', function () { place(); if (!running) { rabbitDraw(); chicks.forEach(chickDraw); } }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; setRunning(); }).observe(scene);
  else { visible = true; setRunning(); }
  document.addEventListener('visibilitychange', setRunning);

  // Test hook (only with ?meadow-debug): step the simulation by hand, e.g. when the tab is hidden.
  if (/meadow-debug/.test(location.search)) window.__meadow = { R: R, chicks: chicks, startle: startle,
    step: function (n, dt) { dt = dt || 1 / 60; for (var k = 0; k < n; k++) { T += dt; measure(); rabbitUpdate(dt); chicks.forEach(function (c) { chickUpdate(c, dt); }); } rabbitDraw(); chicks.forEach(chickDraw); return T; } };

  // A bird landing in the tree: idle chicks look up, the rabbit's ears prick.
  document.addEventListener('flock:tree-landing', function () {
    if (reduce || !running) return;
    chicks.forEach(function (c) {
      if (!c.act || c.act.type === 'peck' || c.act.type === 'look' || c.act.type === 'preen') { c.dir = cx(c) > W / 2 ? -1 : 1; chickStart(c, { type: 'look', dur: rand(.9, 1.5), at: 'sky' }); }
    });
    R.alert = 1; R.earV[0] -= 140; R.earV[1] -= 110;
  });

  /* ================================================================== clicks */
  rabbitEl.addEventListener('click', function (e) {
    if (reduce) { R.ear = [-12, -8]; rabbitDraw(); return; }
    startle(e.clientX || (sceneLeft + R.x));
    // The chicks notice the commotion.
    chicks.forEach(function (c) { if (!c.act || c.act.type !== 'walk') chickStart(c, { type: 'look', dur: rand(.8, 1.4), at: null }); c.dir = -1; });
  });
  chickEls.forEach(function (el, i) {
    el.addEventListener('click', function () {
      var c = chicks[i];
      if (reduce) { el.classList.add('is-hearting'); setTimeout(function () { el.classList.remove('is-hearting'); }, 1400); return; }
      // A happy flutter, then the friend comes over to say hello.
      chickStart(c, { type: 'flutter', dur: .6 });
      setTimeout(function () { meet(c.other, true); c.other.meetHeart = true; }, 450);
    });
  });
})();
