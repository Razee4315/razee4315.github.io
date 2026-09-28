/* Page behaviour (docs/05). The birds and the catalogue work without any library; GSAP, ScrollTrigger,
   SplitText and Lenis add the scroll choreography when they load. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger && window.SplitText);

  /* ================= the tree and the flock ================= */
  var sceneArt = $('.scene-art'), label = $('[data-invite-label]'), live = $('[data-live]'), inviteBtn = $('[data-invite]');
  var sceneSvg = $('.scene-svg'), compactScene = window.matchMedia('(max-width: 960px)');
  // Reframe the existing drawing at the breakpoint; never rebuild its paths or perches.
  function frameTree() { sceneSvg.setAttribute('viewBox', compactScene.matches ? '200 80 1200 826' : '0 80 1600 826'); }
  frameTree();
  compactScene.addEventListener('change', frameTree);
  var tree = window.Birds ? Birds.tree(sceneSvg) : null;
  var flock = window.Birds ? Birds.flock({
    sky: $('[data-sky]'), tree: tree,
    // Tell the meadow when a bird lands in the tree so the animals can look up.
    onLand: function (spot) { if (spot && spot.kind === 'tree') document.dispatchEvent(new CustomEvent('flock:tree-landing')); },
    onChange: function (n, max) {
      var roostInvite = $('[data-roost-invite]');
      if (roostInvite && n >= max) { roostInvite.disabled = true; roostInvite.textContent = 'The flock is complete'; }
      live.textContent = n >= max ? 'Ten birds. The flock is complete.' : (n === 1 ? 'One bird is out.' : n + ' birds are out.');
      if (n >= max) { inviteBtn.setAttribute('aria-disabled', 'true'); label.textContent = 'The flock is full'; }
    }
  }) : null;

  if (flock) {
    flock.setSound(false);
    // Grow the tree, then the first wren is already sitting on it.
    requestAnimationFrame(function () {
      sceneArt.classList.add('grown');
      setTimeout(function () { sceneArt.classList.add('done'); }, 1900);
    });
    setTimeout(function () { flock.spawnOnTree(5); }, reduce ? 0 : 650);

    inviteBtn.addEventListener('click', function () { flock.spawnFromHouse(); });
    // The tree owns its click so the document's no-bird guard cannot swallow it.
    sceneSvg.addEventListener('click', function (event) { flock.spawnAt(event.clientX, event.clientY); });
    sceneSvg.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); flock.spawnFromHouse(); }
    });
    sceneSvg.addEventListener('pointerdown', function () { sceneSvg.classList.remove('keyboard-focus'); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Tab') sceneSvg.classList.add('keyboard-focus'); });

    document.addEventListener('click', function (e) {
      var t = e.target; if (e.button !== 0 || !t || !t.closest || t.closest('a, button, input, textarea, select, label, [data-no-bird]')) return;
      var sel = window.getSelection && String(window.getSelection()); if (sel) return;
      flock.spawnAt(e.clientX, e.clientY);
    });
  }

  /* Meadow residents live in assets/meadow.js. */

  /* ================= nav: hide going down, show going up; mark the project on screen ================= */
  var nav = $('[data-nav]'), lastY = window.scrollY;
  function onScroll(y) {
    if (y > lastY + 6 && y > 160) nav.classList.add('hide'); else if (y < lastY - 6 || y < 160) nav.classList.remove('hide');
    lastY = y;
  }
  window.addEventListener('scroll', function () { onScroll(window.scrollY); }, { passive: true });
  nav.addEventListener('focusin', function () { nav.classList.remove('hide'); });
  var navLinks = $$('[data-nav-link]');
  if ('IntersectionObserver' in window) {
    var bandIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.band').forEach(function (b) { bandIO.observe(b); });
    new IntersectionObserver(function (e) { if (e[0].isIntersecting) navLinks.forEach(function (a) { a.setAttribute('aria-current', 'false'); }); }, { rootMargin: '-45% 0px -50% 0px' }).observe($('.hero'));
  }

  /* ================= scroll choreography (GSAP) ================= */
  if (!hasGsap) return;
  window.__hubReady = true;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.defaults({ ease: 'expo.out', duration: .9 });

  if (!reduce && fine && window.Lenis) {
    var lenis = window.__lenis = new Lenis({ lerp: .1, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    root.classList.add('lenis');
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'), target = id.length > 1 && document.getElementById(id.slice(1));
        if (!target) return;
        e.preventDefault(); lenis.scrollTo(target, { offset: -24, duration: 1.3 });
        target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
      });
    });
  }

  var mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    gsap.set('.band-copy, .band-shot', { autoAlpha: 0, y: 40 });
    ScrollTrigger.batch('.band-copy, .band-shot', { start: 'top 88%', once: true, onEnter: function (els) { gsap.to(els, { autoAlpha: 1, y: 0, stagger: .12, duration: 1, overwrite: true }); } });

    document.fonts.ready.then(function () {
      var h1 = $('[data-split]');
      h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
      var split = SplitText.create(h1, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: function (self) { self.lines.forEach(function (l) { l.setAttribute('aria-hidden', 'true'); }); } });
      gsap.timeline()
        .fromTo('.nav', { autoAlpha: 0 }, { autoAlpha: 1, duration: .8, ease: 'power2.out' }, 0)
        .fromTo('.eyebrow', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .8 }, .05)
        .from(split.lines, { yPercent: 110, duration: 1, stagger: .1 }, .1)
        .fromTo('.lede', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0 }, .4)
        .fromTo('.actions', { autoAlpha: 0, scale: .95, transformOrigin: '0% 50%' }, { autoAlpha: 1, scale: 1, duration: .8 }, .55);

      ScrollTrigger.refresh();
      return function () { split.revert(); };
    });
  });
  mm.add('(prefers-reduced-motion: reduce)', function () { gsap.set('[data-hero-fade], .band-copy, .band-shot', { autoAlpha: 1, y: 0 }); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
