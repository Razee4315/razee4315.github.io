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
  var sceneArt = $('.scene-art'), countEl = $('[data-count]'), label = $('[data-invite-label]'), live = $('[data-live]'),
      inviteBtn = $('[data-invite]'), soundBtn = $('[data-sound]'), birdsLine = $('[data-birds-line]');
  var rows = $$('[data-row]');
  function poke(row) { row.classList.remove('poke'); void row.offsetWidth; row.classList.add('poke'); setTimeout(function () { row.classList.remove('poke'); }, 850); }
  var tree = window.Birds ? Birds.tree($('.scene-svg')) : null;
  var flock = window.Birds ? Birds.flock({
    sky: $('[data-sky]'), tree: tree,
    onChange: function (n, max) {
      countEl.textContent = n + '/' + max;
      birdsLine.textContent = n >= max ? 'Ten birds on this page · the flock is complete' : (n === 1 ? 'One bird' : n + ' birds') + ' on this page · click anywhere to add one';
      live.textContent = n >= max ? 'Ten birds. The flock is complete.' : (n === 1 ? 'One bird is out.' : n + ' birds are out.');
      if (n >= max) { inviteBtn.setAttribute('aria-disabled', 'true'); label.textContent = 'The flock is full'; }
    },
    onLand: function (sp) { var row = sp.el && sp.el.closest ? sp.el.closest('.row') : null; if (row) poke(row); }
  }) : null;

  if (flock) {
    // Grow the tree, then the first wren is already sitting on it.
    requestAnimationFrame(function () {
      sceneArt.classList.add('grown');
      setTimeout(function () { sceneArt.classList.add('done'); }, 1900);
    });
    setTimeout(function () { flock.spawnOnTree(5); }, reduce ? 0 : 650);

    inviteBtn.addEventListener('click', function () { flock.spawnFromHouse(); });
    document.addEventListener('click', function (e) {
      if (e.button !== 0 || e.target.closest('a, button, input, textarea, select, label, [data-no-bird]')) return;
      var sel = window.getSelection && String(window.getSelection()); if (sel) return;
      flock.spawnAt(e.clientX, e.clientY);
    });
    soundBtn.addEventListener('click', function () {
      var on = !flock.soundOn(); flock.setSound(on);
      soundBtn.setAttribute('aria-pressed', String(on)); soundBtn.setAttribute('aria-label', on ? 'Bird sounds on' : 'Bird sounds off');
    });
  }

  /* ================= catalogue ================= */
  var indexEl = $('[data-index]'), refreshT = 0;
  function setIndex(i) { indexEl.textContent = String(i + 1).padStart(2, '0'); }
  function refreshSoon() { clearTimeout(refreshT); refreshT = setTimeout(function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 750); }
  function syncLinks(row) { var v = $('.visit', row); if (v) v.tabIndex = row.classList.contains('is-open') ? 0 : -1; }
  function openRow(row) {
    rows.forEach(function (r) { if (r !== row && r.classList.contains('is-open')) { r.classList.remove('is-open'); syncLinks(r); } });
    if (!row.classList.contains('is-open')) {
      row.classList.add('is-open', 'opened'); setTimeout(function () { row.classList.remove('opened'); }, 850);
      syncLinks(row); setIndex(rows.indexOf(row)); refreshSoon();
    }
  }
  if (fine) {
    // Desktop: a row opens when you rest on it and stays open until you rest on another one (no jumping list).
    rows.forEach(function (row) {
      var head = $('.row-head', row), t = 0;
      head.addEventListener('pointerenter', function () { t = setTimeout(function () { openRow(row); }, 110); });
      head.addEventListener('pointerleave', function () { clearTimeout(t); });
      row.addEventListener('focusin', function () { openRow(row); });
    });
    openRow(rows[0]);
  } else {
    // Touch: every project is a full colour card, nothing to hover.
    rows.forEach(function (row) { row.classList.add('is-open'); syncLinks(row); });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { e[0].target.classList.toggle('in-view', e[0].isIntersecting); }).observe($('[data-catalogue]'));
    if (!fine) rows.forEach(function (row, i) {
      new IntersectionObserver(function (e) { if (e[0].isIntersecting) setIndex(i); }, { rootMargin: '-45% 0px -45% 0px' }).observe(row);
    });
  }

  /* ================= footer ================= */
  var mark = $('[data-wordmark]'), colors = ['#FFB25B', '#FF8C00', '#5FB3A6', '#E5484D', '#7FD6EE'], revealed = !hasGsap || reduce;
  var letters = mark.textContent.split('');
  mark.textContent = '';
  var chars = letters.map(function (ch, i) {
    var s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--c', colors[i % colors.length]); mark.appendChild(s); return s;
  });
  if (!reduce) {
    mark.addEventListener('pointermove', function (e) {
      if (!revealed) return;
      chars.forEach(function (c) {
        var r = c.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)), k = Math.max(0, 1 - d / (r.width * 1.25));
        c.style.transform = k ? 'translateY(' + (-k * 12).toFixed(1) + '%) scale(' + (1 - k * .06).toFixed(3) + ',' + (1 + k * .14).toFixed(3) + ')' : '';
        c.classList.toggle('lit', k > .55);
      });
    });
    mark.addEventListener('pointerleave', function () { chars.forEach(function (c) { c.style.transform = ''; c.classList.remove('lit'); }); });
    chars.forEach(function (c) {
      c.addEventListener('click', function () { c.classList.remove('jelly'); void c.offsetWidth; c.classList.add('jelly'); });
      c.addEventListener('animationend', function () { c.classList.remove('jelly'); });
    });
  }
  $('[data-top]').addEventListener('click', function () {
    if (flock) flock.scatter();
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.6 }); else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

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
    gsap.set('.row', { autoAlpha: 0, y: 40 });
    ScrollTrigger.batch('.row', { start: 'top 92%', once: true, onEnter: function (els) { gsap.to(els, { autoAlpha: 1, y: 0, stagger: .08, duration: .9, overwrite: true }); } });

    document.fonts.ready.then(function () {
      var h1 = $('[data-split]');
      h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
      var split = SplitText.create(h1, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: function (self) { self.lines.forEach(function (l) { l.setAttribute('aria-hidden', 'true'); }); } });
      gsap.timeline()
        .fromTo('.strip', { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: .8 }, 0)
        .from(split.lines, { yPercent: 110, duration: 1, stagger: .1 }, .1)
        .fromTo('.lede', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0 }, .4)
        .fromTo('.actions', { autoAlpha: 0, scale: .95, transformOrigin: '0% 50%' }, { autoAlpha: 1, scale: 1, duration: .8 }, .55);

      gsap.to('.hero-type', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
      gsap.to('.scene-art', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });

      var words = SplitText.create('[data-words]', { type: 'words' });
      gsap.timeline({ scrollTrigger: { trigger: '.colophon', start: 'top top', end: '+=140%', pin: true, scrub: 1 } })
        .fromTo(words.words, { opacity: .12 }, { opacity: 1, stagger: .1, ease: 'none', duration: 1 });

      gsap.from(chars, { yPercent: 70, autoAlpha: 0, stagger: .07, duration: 1, scrollTrigger: { trigger: mark, start: 'top 95%', once: true },
        onComplete: function () { gsap.set(chars, { clearProps: 'transform,opacity,visibility' }); revealed = true; } });

      ScrollTrigger.refresh();
      return function () { split.revert(); words.revert(); };
    });
  });
  mm.add('(prefers-reduced-motion: reduce)', function () { gsap.set('[data-hero-fade], .row', { autoAlpha: 1, y: 0 }); revealed = true; });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
