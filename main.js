/* ════════════════════════════════════════════════════════════
   Portfolio — Olivier Gibert
   Scroll-driven (scrub) animation engine: GSAP + ScrollTrigger + Lenis
   Shared across every page of the site.
   ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── INTRO — smooth dissolve into the page ─── */
  const introEl = document.getElementById('intro-overlay');
  let heroStarted = false;

  // Reveal one split-into-letters title: fade the element in, stagger its
  // characters up. Works for #hero-name on index.html and any other page's
  // title that carries the .split-title class (e.g. Creator).
  function revealSplitTitle(el) {
    if (!el) return;
    el.classList.add('revealed');
    if (el.id === 'hero-name') armHeroScrollFadeWhenVisible(el);
    if (!window.gsap) return;
    const chars = el.querySelectorAll('.ch');
    gsap.set(chars, { yPercent: 120 });
    gsap.to(chars, { yPercent: 0, duration: 1.05, stagger: 0.04, ease: 'expo.out' });
  }

  // Only let ScrollTrigger take over #hero-name's opacity once it has actually
  // become visible (opacity:1) — otherwise it snapshots opacity:0 as an inline
  // style that permanently beats the CSS .revealed rule.
  function armHeroScrollFadeWhenVisible(heroNameEl) {
    function arm() {
      if (heroNameEl._scrollFadeArmed) return;
      heroNameEl._scrollFadeArmed = true;
      if (!window.gsap || !window.ScrollTrigger || !document.getElementById('hero')) return;
      gsap.to(heroNameEl, {
        yPercent: -40, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });
    }
    heroNameEl.addEventListener('transitionend', function onEnd(e) {
      if (e.target === heroNameEl && e.propertyName === 'opacity') {
        heroNameEl.removeEventListener('transitionend', onEnd);
        arm();
      }
    });
    setTimeout(arm, 700); // safety net if the CSS transition never fires
  }

  if (introEl) {
    // Build characters (for stagger) on every split-title on this page
    document.querySelectorAll('.split-title .ln').forEach(ln => {
      const word = ln.dataset.word || '';
      ln.innerHTML = word.split('').map(c => `<span class="ch">${c}</span>`).join('');
    });

    function reveal() {
      if (heroStarted) return;
      heroStarted = true;
      // titles only fade/slide in once the black has dissolved
      document.querySelectorAll('.split-title').forEach(revealSplitTitle);
      document.body.classList.add('intro-done');
      introEl.classList.add('done');
    }

    // Very short black hold, then dissolve quickly — page becomes visible as it fades.
    requestAnimationFrame(() => {
      setTimeout(() => introEl.classList.add('open'), 200);
    });

    // Reveal the title(s) exactly when the dissolve finishes (not before).
    introEl.addEventListener('transitionend', (e) => {
      if (e.target === introEl && e.propertyName === 'opacity') reveal();
    });
    // Safety net in case the transition event doesn't fire for any reason.
    setTimeout(reveal, 200 + 550 + 250);
  } else {
    // No intro on this page — reveal any split-title immediately if present
    document.body.classList.add('intro-done');
    document.querySelectorAll('.split-title').forEach(el => {
      el.classList.add('revealed');
      if (el.id === 'hero-name') armHeroScrollFadeWhenVisible(el);
    });
  }

  /* ─── LENIS smooth scroll + GSAP wiring ─── */
  const hasGSAP = window.gsap && window.ScrollTrigger;
  let lenis = null;

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    window.lenis = lenis;
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ════════════════════════════════════════════════
     SCROLL-DRIVEN ANIMATIONS (scrub → tied to scroll
     position; freeze when scroll stops, resume on scroll)
     ════════════════════════════════════════════════ */
  if (hasGSAP && !reduceMotion) {

    /* Hero parallax as you scroll away (index.html only) — the hero-name fade
       tween is armed separately, only once the intro reveal has finished, so it
       doesn't snapshot opacity:0 before the name has ever been shown. */
    if (document.getElementById('hero')) {
      gsap.to('#hero-video-wrap', {
        scale: 1.18, yPercent: 12, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });
    }

    /* Generic parallax elements */
    gsap.utils.toArray('[data-parallax]').forEach(el => {
      const depth = parseFloat(el.dataset.parallax) || 0.15;
      gsap.fromTo(el, { yPercent: depth * 60 }, {
        yPercent: -depth * 60, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    });

    /* Section heads: slide + tracking expand, scrubbed */
    gsap.utils.toArray('.reveal-head').forEach(head => {
      const kicker = head.querySelector('.section-kicker');
      if (kicker) {
        gsap.from(kicker, {
          x: -40, opacity: 0, ease: 'none',
          scrollTrigger: { trigger: head, start: 'top 90%', end: 'top 45%', scrub: 1 }
        });
      }
      gsap.fromTo(head.querySelector('h2'),
        { x: -80, opacity: 0, letterSpacing: '0.2em' },
        { x: 0, opacity: 1, letterSpacing: '0em', ease: 'none',
          scrollTrigger: { trigger: head, start: 'top 92%', end: 'top 40%', scrub: 1 } }
      );
    });

    /* Posters (Affiches): each rises/rotates scrubbed across the section */
    gsap.utils.toArray('.poster-card').forEach((card, i) => {
      const dir = i % 2 === 0 ? -1 : 1;
      gsap.fromTo(card,
        { y: 120, opacity: 0, rotateZ: dir * 4 },
        { y: 0, opacity: 1, rotateZ: 0, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top 95%', end: 'top 55%', scrub: 1 } }
      );
      gsap.fromTo(card, { y: 0 }, {
        y: -30 - (i % 3) * 18, ease: 'none',
        scrollTrigger: { trigger: card, start: 'top 55%', end: 'bottom top', scrub: 1.2 }
      });
    });

    /* Galerie tiles: fade + scale up as they enter */
    gsap.utils.toArray('.gallery-tile').forEach((tile) => {
      gsap.fromTo(tile,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: tile, start: 'top 95%', end: 'top 60%', scrub: 1 } }
      );
    });

    /* Projets disks: assemble from centre, scrubbed to scroll */
    const diskCards = gsap.utils.toArray('.disk-card');
    const spread = [
      { x: -160, y: 90, r: -12 },
      { x: -60,  y: 130, r: 8 },
      { x: 60,   y: 130, r: -8 },
      { x: 160,  y: 90, r: 12 },
    ];
    diskCards.forEach((card, i) => {
      const s = spread[i] || { x: 0, y: 100, r: 0 };
      gsap.fromTo(card,
        { x: s.x, y: s.y, rotateZ: s.r, scale: 0.7, opacity: 0 },
        { x: 0, y: 0, rotateZ: 0, scale: 1, opacity: 1, ease: 'none',
          scrollTrigger: {
            trigger: '#projets', start: 'top 75%', end: 'center center', scrub: 1,
            onLeave: () => card.classList.add('floating'),
            onEnterBack: () => card.classList.remove('floating')
          } }
      );
    });
    // bg video subtle parallax
    if (document.getElementById('projets')) {
      gsap.to('#bg-video-2', {
        yPercent: 14, ease: 'none',
        scrollTrigger: { trigger: '#projets', start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    }

    /* Contacts links: scrubbed vertical reveal */
    gsap.from('.reveal-contact', {
      y: 36, opacity: 0, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: '.contacts-row', start: 'top 90%', end: 'top 45%', scrub: 1 }
    });

  } else {
    // No GSAP / reduced motion → make sure everything is visible
    document.querySelectorAll('.reveal, .reveal-contact, .poster-card, .gallery-tile, .disk-card, .reel-tile, .reveal-head h2')
      .forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    document.querySelectorAll('.disk-card').forEach(c => c.classList.add('floating'));
  }

  /* ─── Scroll progress bar + readout ─── */
  const progress = document.getElementById('progress');
  const readout = document.getElementById('scroll-readout');

  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (progress) progress.style.width = (p * 100) + '%';
    if (readout) readout.textContent = String(Math.round(p * 100)).padStart(2, '0') + ' / 100';
  }
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  if (hasGSAP) ScrollTrigger.addEventListener('refresh', updateProgress);

  /* ─── Nav + side-nav: highlight the current page ─── */
  (function markActivePage() {
    let page = location.pathname.split('/').pop();
    if (!page) page = 'index.html';
    document.querySelectorAll('[data-page]').forEach(a => {
      if (a.dataset.page === page) a.classList.add('active');
    });
  })();

  /* ─── Custom cursor ring ─── */
  const ring = document.getElementById('cursor-ring');
  if (ring) {
    let rx = window.innerWidth / 2, ry = window.innerHeight / 2, cx = rx, cy = ry;
    window.addEventListener('mousemove', e => { rx = e.clientX; ry = e.clientY; ring.style.opacity = 1; });
    (function ringLoop() {
      cx += (rx - cx) * 0.18; cy += (ry - cy) * 0.18;
      ring.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(ringLoop);
    })();
    const hotSel = 'a, .poster-card, .disk-card, .gallery-tile, .reel-tile, .video-embed, button';
    document.querySelectorAll(hotSel).forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hot'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hot'));
    });
  }

  /* ─── Projets disk navigation — smooth, cinematic "insert" transition ─── */
  let _navigating = false;
  function insertDiskAndGo(card) {
    const href = card.dataset.href;
    if (_navigating || !href) return; _navigating = true;

    const img = card.querySelector('.disk-inner img');
    const rect = img.getBoundingClientRect();
    if (lenis) lenis.stop();

    // Soft fade-to-black backdrop
    const back = document.createElement('div');
    back.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;z-index:99980;pointer-events:none;transition:opacity .85s cubic-bezier(.16,1,.3,1);';
    document.body.appendChild(back);
    requestAnimationFrame(() => { back.style.opacity = '1'; });

    // Floating clone of the disk
    const clone = img.cloneNode(true);
    clone.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;margin:0;z-index:99985;pointer-events:none;will-change:transform;filter:drop-shadow(0 30px 50px rgba(0,0,0,0.6));`;
    document.body.appendChild(clone);

    const cx = window.innerWidth / 2 - (rect.left + rect.width / 2);
    const cy = window.innerHeight / 2 - (rect.top + rect.height / 2);

    if (window.gsap) {
      gsap.timeline({ onComplete: () => { window.location.href = href; } })
        .to(clone, { x: cx, y: cy - 18, scale: 1.16, rotationY: 9, rotationZ: -2.5, transformPerspective: 1100, duration: 0.7, ease: 'power2.out' })
        .to(clone, { y: cy + window.innerHeight * 0.9, scale: 0.94, rotationY: 0, rotationZ: 0, opacity: 0, duration: 0.85, ease: 'power3.in' }, '+=0.06');
    } else {
      setTimeout(() => { window.location.href = href; }, 950);
    }
  }
  document.querySelectorAll('.disk-card[data-href]').forEach(card => {
    card.addEventListener('click', () => insertDiskAndGo(card));
  });

  /* ─── Video embeds: showreel thumbnail + bg iframe + click-to-play modal ─── */
  (function videoEmbeds() {
    const wraps = document.querySelectorAll('.video-embed[data-youtube]');
    if (!wraps.length) return;
    const overlay = document.getElementById('hero-play-overlay');
    const modal = document.getElementById('video-modal');
    const inner = document.getElementById('video-modal-inner');

    const ytId = (url) => {
      try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
        return u.searchParams.get('v') || u.pathname.split('/').pop();
      } catch (e) { return ''; }
    };

    function openModal(id) {
      if (!modal || !inner || !id) return;
      inner.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" title="Vidéo" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      modal.classList.add('active');
      if (lenis) lenis.stop(); document.body.style.overflow = 'hidden';
    }
    function closeModal() {
      if (!modal) return;
      modal.classList.remove('active');
      if (lenis) lenis.start(); document.body.style.overflow = '';
      setTimeout(() => { if (inner) inner.innerHTML = ''; }, 550);
    }

    wraps.forEach(wrap => {
      const thumb = wrap.querySelector('.video-embed-thumb');
      const bgIframe = wrap.querySelector('.video-embed-iframe');
      const id = ytId(wrap.dataset.youtube);

      if (thumb && id) {
        thumb.src = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
        thumb.addEventListener('error', () => { thumb.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`; }, { once: true });
      }
      if (bgIframe && id) {
        const params = new URLSearchParams({ autoplay: '1', mute: '1', loop: '1', playlist: id,
          controls: '0', modestbranding: '1', rel: '0', showinfo: '0', playsinline: '1', disablekb: '1',
          iv_load_policy: '3', origin: location.origin });
        bgIframe.src = `https://www.youtube.com/embed/${id}?${params.toString()}`;
        bgIframe.addEventListener('load', () => bgIframe.classList.add('loaded'), { once: true });
      }
      if (overlay) {
        wrap.addEventListener('mousemove', e => { overlay.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; });
        wrap.addEventListener('mouseenter', e => { overlay.classList.add('visible'); overlay.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; });
        wrap.addEventListener('mouseleave', () => overlay.classList.remove('visible'));
      }
      wrap.addEventListener('click', () => openModal(id));
    });

    if (modal) {
      modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('active')) closeModal(); });
    }
  })();

  /* ─── Reel popups (Creator page) ───
     Click a .reel-tile: if it has data-video, play the real file cleanly.
     If data-reel points to YouTube, fetch its real thumbnail automatically
     and embed it with YouTube's own clean player (no extra chrome). If
     data-reel points to Instagram, open their embed instead (keeps their
     own UI — unavoidable without a hosted video file). Tiles with neither
     stay inert placeholders. */
  (function reelPopups() {
    const tiles = document.querySelectorAll('.reel-tile[data-video], .reel-tile[data-reel]');
    if (!tiles.length) return;
    const modal = document.getElementById('video-modal');
    const inner = document.getElementById('video-modal-inner');
    if (!modal || !inner) return;

    function isYouTube(url) { return /youtu\.?be/i.test(url || ''); }
    function ytId(url) {
      try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0];
        if (u.pathname.includes('/shorts/')) return u.pathname.split('/shorts/')[1].split('/')[0];
        return u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
      } catch (e) { return ''; }
    }

    // Auto-fill a real cover thumbnail for any tile whose reel is a YouTube link
    tiles.forEach(tile => {
      const reel = tile.dataset.reel;
      if (!reel || !isYouTube(reel) || tile.querySelector('.reel-cover')) return;
      const id = ytId(reel);
      if (!id) return;
      tile.classList.remove('placeholder');
      tile.innerHTML = `
        <img class="reel-cover" src="https://img.youtube.com/vi/${id}/maxresdefault.jpg" alt="" />
        <div class="reel-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>`;
      const cover = tile.querySelector('.reel-cover');
      cover.addEventListener('error', () => { cover.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`; }, { once: true });
    });

    function openWithVideo(src) {
      inner.classList.add('portrait');
      inner.innerHTML = `
        <button class="video-modal-close" aria-label="Fermer">✕</button>
        <div class="video-modal-media"><video src="${src}" controls autoplay playsinline></video></div>`;
      modal.classList.add('active');
      if (lenis) lenis.stop(); document.body.style.overflow = 'hidden';
    }
    function openWithReel(url) {
      inner.classList.add('portrait');
      let mediaHTML;
      if (isYouTube(url)) {
        const id = ytId(url);
        mediaHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Reel"></iframe>`;
      } else {
        const clean = url.split('?')[0].replace(/\/$/, '');
        mediaHTML = `<iframe src="${clean}/embed/captioned/" loading="lazy" allowtransparency="true" frameborder="0" scrolling="no" title="Reel Instagram"></iframe>`;
      }
      inner.innerHTML = `
        <button class="video-modal-close" aria-label="Fermer">✕</button>
        <div class="video-modal-media">${mediaHTML}</div>`;
      modal.classList.add('active');
      if (lenis) lenis.stop(); document.body.style.overflow = 'hidden';
    }
    function close() {
      modal.classList.remove('active');
      if (lenis) lenis.start(); document.body.style.overflow = '';
      setTimeout(() => { inner.innerHTML = ''; inner.classList.remove('portrait'); }, 550);
    }

    tiles.forEach(tile => {
      tile.addEventListener('click', () => {
        const video = tile.dataset.video;
        const reel = tile.dataset.reel;
        if (video) openWithVideo(video);
        else if (reel) openWithReel(reel);
      });
    });
    modal.addEventListener('click', e => {
      if (e.target === modal || e.target.classList.contains('video-modal-close')) close();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('active')) close(); });
  })();

  /* ─── Reel stack (Creator page) — story/Tinder-style card deck ─── */
  (function reelStack() {
    const stack = document.getElementById('reel-stack');
    if (!stack) return;
    const tiles = Array.from(stack.querySelectorAll('.reel-tile'));
    if (!tiles.length) return;
    let order = tiles.slice();
    const dotsWrap = document.getElementById('reel-dots');

    if (dotsWrap) {
      tiles.forEach((_, i) => {
        const d = document.createElement('span');
        d.className = 'dot';
        dotsWrap.appendChild(d);
      });
    }
    const dots = dotsWrap ? Array.from(dotsWrap.children) : [];

    function layout() {
      order.forEach((tile, p) => {
        if (p === 0) {
          tile.style.transform = 'translate(-50%,0) scale(1) rotate(0deg)';
          tile.style.zIndex = 50;
          tile.style.opacity = 1;
          tile.style.pointerEvents = 'auto';
        } else if (p <= 3) {
          const dir = p % 2 === 0 ? 1 : -1;
          const y = p * 14;
          const scale = (1 - p * 0.055).toFixed(3);
          const rot = (dir * p * 3.2).toFixed(1);
          const xOff = dir * p * 4;
          tile.style.transform = `translate(calc(-50% + ${xOff}px), ${y}px) scale(${scale}) rotate(${rot}deg)`;
          tile.style.zIndex = 50 - p;
          tile.style.opacity = (1 - p * 0.22).toFixed(2);
          tile.style.pointerEvents = 'none';
        } else {
          tile.style.transform = 'translate(-50%, 54px) scale(0.78) rotate(0deg)';
          tile.style.zIndex = 0;
          tile.style.opacity = 0;
          tile.style.pointerEvents = 'none';
        }
      });
      if (dots.length) {
        const frontIndex = tiles.indexOf(order[0]);
        dots.forEach((d, i) => d.classList.toggle('active', i === frontIndex));
      }
    }
    function next() { order.push(order.shift()); layout(); }
    function prev() { order.unshift(order.pop()); layout(); }

    const prevBtn = document.getElementById('reel-prev');
    const nextBtn = document.getElementById('reel-next');
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);
    dots.forEach((d, i) => d.addEventListener('click', () => {
      while (tiles.indexOf(order[0]) !== i) next();
    }));

    layout();
  })();

  /* ─── Lightbox (Affiches / Galerie) ─── */
  (function lightbox() {
    const box = document.getElementById('lightbox');
    if (!box) return;
    const img = document.getElementById('lightbox-img');
    const tools = document.getElementById('lb-tools');
    const desc = document.getElementById('lightbox-desc');

    const errMsg = document.getElementById('lightbox-error-msg');
    let clearTimer = null;
    function open(card) {
      if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
      img.classList.remove('load-error');
      if (errMsg) errMsg.classList.remove('visible');
      img.onerror = () => { img.classList.add('load-error'); if (errMsg) errMsg.classList.add('visible'); };
      img.src = card.dataset.src;
      img.alt = card.dataset.title || '';
      if (tools) tools.textContent = card.dataset.tools || '';
      desc.classList.remove('closing');
      box.classList.add('active');
      if (lenis) lenis.stop(); document.body.style.overflow = 'hidden';
    }
    function close() {
      desc.classList.add('closing');
      box.classList.remove('active');
      if (lenis) lenis.start(); document.body.style.overflow = '';
      clearTimer = setTimeout(() => { img.src = ''; desc.classList.remove('closing'); clearTimer = null; }, 550);
    }
    document.querySelectorAll('.poster-card, .gallery-tile').forEach(card => card.addEventListener('click', () => open(card)));
    box.addEventListener('click', e => { if (e.target === box) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('active')) close(); });
  })();

  if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 1200);
});