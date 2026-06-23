/* ════════════════════════════════════════════════════════════
   Portfolio — Olivier Gibert
   Scroll-driven (scrub) animation engine: GSAP + ScrollTrigger + Lenis
   ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Build hero name characters (for stagger) ─── */
  document.querySelectorAll('#hero-name .ln').forEach(ln => {
    const word = ln.dataset.word || '';
    ln.innerHTML = word.split('').map(c => `<span class="ch">${c}</span>`).join('');
  });

  /* ─── INTRO — smooth dissolve into the page ─── */
  const introEl = document.getElementById('intro-overlay');
  let heroStarted = false;
  function dismissIntro() {
    if (introEl) introEl.classList.add('done');
    if (!heroStarted) { heroStarted = true; startHeroIntro(); }
  }
  // Let the red text breathe, fade the whole overlay out, then remove it.
  setTimeout(() => {
    introEl.classList.add('open');   // triggers opacity+scale dissolve (0.9s)
    startHeroIntro();                // hero animates in behind the fading overlay
    heroStarted = true;
    setTimeout(dismissIntro, 1000);  // remove after the dissolve completes
  }, 950);

  /* ─── LENIS smooth scroll + GSAP wiring ─── */
  const hasGSAP = window.gsap && window.ScrollTrigger;
  let lenis = null;

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ─── HERO entrance (after intro) ─── */
  function startHeroIntro() {
    if (!hasGSAP) return;
    gsap.set('#hero-name .ch', { yPercent: 120 });
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to('#hero-tag', { opacity: 1, y: 0, duration: 0.9, from: { opacity: 0, y: 14 } }, 0)
      .from('#hero-name .ch', { yPercent: 120, duration: 1.1, stagger: 0.04 }, 0.05)
      .to('#hero-name .ch', { yPercent: 0, duration: 1.1, stagger: 0.04 }, 0.05);
  }
  // Ensure tag visible even without GSAP
  if (!hasGSAP) { const t = document.getElementById('hero-tag'); if (t) t.style.opacity = 1; }

  /* ════════════════════════════════════════════════
     SCROLL-DRIVEN ANIMATIONS (scrub → tied to scroll
     position; freeze when scroll stops, resume on scroll)
     ════════════════════════════════════════════════ */
  if (hasGSAP && !reduceMotion) {

    /* Hero parallax + fade as you scroll away */
    gsap.to('#hero-video-wrap', {
      scale: 1.18, yPercent: 12, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 }
    });
    gsap.to('#hero-name', {
      yPercent: -40, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 }
    });
    gsap.to('#hero-tag', {
      yPercent: -120, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: '60% top', scrub: 1 }
    });
    gsap.to('#scroll-cue', {
      opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: '15% top', scrub: true }
    });

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
      gsap.from(head.querySelector('.section-kicker'), {
        x: -40, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: head, start: 'top 90%', end: 'top 45%', scrub: 1 }
      });
      gsap.fromTo(head.querySelector('h2'),
        { x: -80, opacity: 0, letterSpacing: '0.2em' },
        { x: 0, opacity: 1, letterSpacing: '0em', ease: 'none',
          scrollTrigger: { trigger: head, start: 'top 92%', end: 'top 40%', scrub: 1 } }
      );
    });

    /* À propos skill titles: scrubbed stagger */
    gsap.from('.apropos-titles .reveal', {
      y: 40, opacity: 0, ease: 'none', stagger: 0.08,
      scrollTrigger: { trigger: '.apropos-titles', start: 'top 88%', end: 'top 50%', scrub: 1 }
    });

    /* Posters: each rises/rotates scrubbed across the section (parallax depth varies) */
    gsap.utils.toArray('.poster-card').forEach((card, i) => {
      const dir = i % 2 === 0 ? -1 : 1;
      gsap.fromTo(card,
        { y: 120, opacity: 0, rotateZ: dir * 4 },
        { y: 0, opacity: 1, rotateZ: 0, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top 95%', end: 'top 55%', scrub: 1 } }
      );
      // continued slow drift after entering, for living movement
      gsap.fromTo(card, { y: 0 }, {
        y: -30 - (i % 3) * 18, ease: 'none',
        scrollTrigger: { trigger: card, start: 'top 55%', end: 'bottom top', scrub: 1.2 }
      });
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
    gsap.to('#bg-video-2', {
      yPercent: 14, ease: 'none',
      scrollTrigger: { trigger: '#projets', start: 'top bottom', end: 'bottom top', scrub: 1 }
    });

    /* Contacts: scrubbed vertical reveal (no horizontal shift → always left-aligned) */
    gsap.from('.reveal-contact', {
      y: 36, opacity: 0, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: '.contacts-row', start: 'top 90%', end: 'top 45%', scrub: 1 }
    });

  } else {
    // No GSAP / reduced motion → make sure everything is visible
    document.querySelectorAll('.reveal, .reveal-contact, .poster-card, .disk-card, .reveal-head h2, .section-kicker')
      .forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    document.querySelectorAll('.disk-card').forEach(c => c.classList.add('floating'));
  }

  /* ─── Scroll progress bar + readout + side-nav active state ─── */
  const progress = document.getElementById('progress');
  const readout = document.getElementById('scroll-readout');
  const sideLinks = document.querySelectorAll('#side-nav a');
  const sections = [...sideLinks].map(a => document.getElementById(a.dataset.target));

  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    progress.style.width = (p * 100) + '%';
    if (readout) readout.textContent = String(Math.round(p * 100)).padStart(2, '0') + ' / 100';

    // active section
    let activeIdx = 0;
    const mid = window.scrollY + window.innerHeight * 0.4;
    sections.forEach((sec, i) => { if (sec && sec.offsetTop <= mid) activeIdx = i; });
    sideLinks.forEach((a, i) => a.classList.toggle('active', i === activeIdx));
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  /* ─── Smooth anchor scrolling (Lenis-aware) ─── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.3 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ─── Custom cursor ring ─── */
  const ring = document.getElementById('cursor-ring');
  let rx = window.innerWidth / 2, ry = window.innerHeight / 2, cx = rx, cy = ry;
  window.addEventListener('mousemove', e => { rx = e.clientX; ry = e.clientY; ring.style.opacity = 1; });
  (function ringLoop() {
    cx += (rx - cx) * 0.18; cy += (ry - cy) * 0.18;
    ring.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(ringLoop);
  })();
  const hotSel = 'a, .poster-card, .disk-card, .apropos-title-item, button, #hero-video-wrap';
  document.querySelectorAll(hotSel).forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hot'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hot'));
  });

  /* ─── À propos: hover titles → show matching text ─── */
  const aproposTitles = document.querySelectorAll('.apropos-title-item');
  const aproposTexts = document.querySelectorAll('.apropos-text-zone p');
  let firstShown = false;
  aproposTitles.forEach(item => {
    item.addEventListener('mouseenter', () => {
      const key = item.dataset.key;
      aproposTexts.forEach(p => p.classList.toggle('visible', p.dataset.key === key));
    });
    item.addEventListener('mouseleave', () => aproposTexts.forEach(p => p.classList.remove('visible')));
  });
  // Show "profil" by default once section enters view
  const aproposSection = document.getElementById('a-propos');
  if (aproposSection) {
    new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting && !firstShown) {
          firstShown = true;
          aproposTexts.forEach(p => p.classList.toggle('visible', p.dataset.key === 'profil'));
        }
      });
    }, { threshold: 0.4 }).observe(aproposSection);
  }
  // floating idle for apropos image
  const aproposImg = document.querySelector('.apropos-img');
  if (aproposImg && !reduceMotion) {
    setTimeout(() => { aproposImg.style.animation = 'float 6s ease-in-out infinite'; }, 1400);
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
        // 1) lift & bring forward with a subtle, physical tilt
        .to(clone, { x: cx, y: cy - 18, scale: 1.16, rotationY: 9, rotationZ: -2.5, transformPerspective: 1100, duration: 0.7, ease: 'power2.out' })
        // 2) smooth slide down into the slot, easing away
        .to(clone, { y: cy + window.innerHeight * 0.9, scale: 0.94, rotationY: 0, rotationZ: 0, opacity: 0, duration: 0.85, ease: 'power3.in' }, '+=0.06');
    } else {
      setTimeout(() => { window.location.href = href; }, 950);
    }
  }
  document.querySelectorAll('.disk-card[data-href]').forEach(card => {
    card.addEventListener('click', () => insertDiskAndGo(card));
  });

  /* ─── Hero showreel: thumbnail + bg iframe + custom play cursor ─── */
  (function heroVideo() {
    const wrap = document.getElementById('hero-video-wrap');
    const overlay = document.getElementById('hero-play-overlay');
    const thumb = document.getElementById('hero-thumb');
    const bgIframe = document.getElementById('hero-bg-iframe');
    if (!wrap) return;

    const ytId = (url) => {
      try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
        return u.searchParams.get('v') || u.pathname.split('/').pop();
      } catch (e) { return ''; }
    };
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

    // Click → modal player
    const modal = document.getElementById('video-modal');
    const inner = document.getElementById('video-modal-inner');
    const embed = id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
    function open() {
      if (!embed) return;
      inner.innerHTML = `<iframe src="${embed}" title="Showreel" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      modal.classList.add('active');
      if (lenis) lenis.stop(); document.body.style.overflow = 'hidden';
    }
    function close() {
      modal.classList.remove('active');
      if (lenis) lenis.start(); document.body.style.overflow = '';
      setTimeout(() => { inner.innerHTML = ''; }, 550);
    }
    wrap.addEventListener('click', open);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('active')) close(); });
  })();

  /* ─── Lightbox (affiches) ─── */
  (function lightbox() {
    const box = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const title = document.getElementById('lb-title');
    const body = document.getElementById('lb-body');
    const tags = document.getElementById('lb-tags');
    const desc = document.getElementById('lightbox-desc');

    function open(card) {
      img.src = card.dataset.src;
      title.textContent = card.dataset.title;
      body.textContent = card.dataset.desc;
      tags.textContent = card.dataset.tags;
      desc.classList.remove('closing');
      box.classList.add('active');
      if (lenis) lenis.stop(); document.body.style.overflow = 'hidden';
    }
    function close() {
      desc.classList.add('closing');
      box.classList.remove('active');
      if (lenis) lenis.start(); document.body.style.overflow = '';
      setTimeout(() => { img.src = ''; desc.classList.remove('closing'); }, 550);
    }
    document.querySelectorAll('.poster-card').forEach(card => card.addEventListener('click', () => open(card)));
    box.addEventListener('click', e => { if (e.target === box) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('active')) close(); });
  })();

  /* ─── Update intro timing handled above ─── */

  if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 1200);
});
