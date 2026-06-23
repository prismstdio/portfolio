/* ════════════════════════════════════════════════════════════
   Portfolio — shared project-page engine (GSAP + ScrollTrigger + Lenis)
   ════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* INTRO — smooth dissolve */
  const introEl = document.getElementById('intro-overlay');
  function dismissIntro(){ if (introEl) introEl.classList.add('done'); }
  if (introEl) setTimeout(() => { introEl.classList.add('open'); setTimeout(dismissIntro, 1000); }, 950);

  const hasGSAP = window.gsap && window.ScrollTrigger;
  let lenis = null;
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* SCROLL-DRIVEN (scrub) animations */
  if (hasGSAP && !reduceMotion) {
    if (document.getElementById('hero-media'))
      gsap.to('#hero-media', { scale: 1.18, yPercent: 12, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 } });
    if (document.querySelector('.hero-header'))
      gsap.to('.hero-header', { yPercent: -30, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 } });
    if (document.getElementById('scroll-cue'))
      gsap.to('#scroll-cue', { opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: '15% top', scrub: true } });

    gsap.utils.toArray('[data-parallax]').forEach(el => {
      const depth = parseFloat(el.dataset.parallax) || 0.12;
      gsap.fromTo(el, { yPercent: depth * 50, rotateZ: -3 }, { yPercent: -depth * 50, rotateZ: 3, ease: 'none',
        scrollTrigger: { trigger: '#infos', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    });

    if (document.querySelector('.infos-content .reveal'))
      gsap.from('.infos-content .reveal', { y: 40, opacity: 0, ease: 'none', stagger: 0.12,
        scrollTrigger: { trigger: '.infos-content', start: 'top 80%', end: 'top 30%', scrub: 1 } });

    gsap.utils.toArray('.gallery-head').forEach(head => {
      const k = head.querySelector('.section-kicker'), h = head.querySelector('.section-title');
      if (k) gsap.from(k, { x: -40, opacity: 0, ease: 'none', scrollTrigger: { trigger: head, start: 'top 90%', end: 'top 45%', scrub: 1 } });
      if (h) gsap.fromTo(h, { x: -80, opacity: 0, letterSpacing: '0.2em' },
        { x: 0, opacity: 1, letterSpacing: '0em', ease: 'none', scrollTrigger: { trigger: head, start: 'top 92%', end: 'top 40%', scrub: 1 } });
    });

    gsap.utils.toArray('.gallery-grid .reveal').forEach(item => {
      gsap.fromTo(item, { y: 90, opacity: 0 }, { y: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: item, start: 'top 95%', end: 'top 60%', scrub: 1 } });
    });

    if (document.querySelector('#proj-footer .reveal'))
      gsap.from('#proj-footer .reveal', { y: 36, opacity: 0, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: '#proj-footer', start: 'top 90%', end: 'top 50%', scrub: 1 } });

    setTimeout(() => ScrollTrigger.refresh(), 1200);
  } else {
    document.querySelectorAll('.reveal, .gallery-head .section-title, .gallery-head .section-kicker')
      .forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  /* Disk idle float */
  const disk = document.querySelector('.infos-disk-wrap img');
  if (disk && !reduceMotion) setTimeout(() => { disk.style.animation = 'float 6s ease-in-out infinite'; }, 1400);

  /* Progress bar + readout */
  const progress = document.getElementById('progress');
  const readout = document.getElementById('scroll-readout');
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (progress) progress.style.width = (p * 100) + '%';
    if (readout) readout.textContent = String(Math.round(p * 100)).padStart(2, '0') + ' / 100';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  /* Custom cursor ring */
  const ring = document.getElementById('cursor-ring');
  if (ring) {
    let rx = innerWidth/2, ry = innerHeight/2, cx = rx, cy = ry;
    window.addEventListener('mousemove', e => { rx = e.clientX; ry = e.clientY; ring.style.opacity = 1; });
    (function loop(){ cx += (rx-cx)*0.18; cy += (ry-cy)*0.18; ring.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); })();
    document.querySelectorAll('a, .mockup-item').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hot'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hot'));
    });
  }

  /* Image lightbox */
  const mlightbox = document.getElementById('mlightbox');
  const mlbImg = mlightbox ? document.getElementById('mlightbox-img') : null;
  function closeMlightbox(){ mlightbox.classList.remove('active'); if(lenis) lenis.start(); document.body.style.overflow=''; setTimeout(()=>{ mlbImg.src=''; }, 500); }
  if (mlightbox) {
    document.querySelectorAll('.mockup-item[data-src]').forEach(item => {
      item.addEventListener('click', () => { mlbImg.src = item.dataset.src; mlightbox.classList.add('active'); if(lenis) lenis.stop(); document.body.style.overflow = 'hidden'; });
    });
    mlightbox.addEventListener('click', e => { if (e.target === mlightbox) closeMlightbox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && mlightbox.classList.contains('active')) closeMlightbox(); });
  }

  /* Mockup video overlay (same as index hero showreel) */
  const ytId = (url) => { try { const u = new URL(url); return u.hostname.includes('youtu.be') ? u.pathname.slice(1) : (u.searchParams.get('v') || u.pathname.split('/').pop()); } catch(e){ return ''; } };
  const playCursor = document.getElementById('play-cursor');
  const vModal = document.getElementById('video-modal');
  const vInner = vModal ? document.getElementById('video-modal-inner') : null;
  function openVideoModal(id){ if(!id||!vModal) return; vInner.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" title="Vidéo" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`; vModal.classList.add('active'); if(lenis) lenis.stop(); document.body.style.overflow='hidden'; }
  function closeVideoModal(){ if(!vModal) return; vModal.classList.remove('active'); if(lenis) lenis.start(); document.body.style.overflow=''; setTimeout(()=>{ vInner.innerHTML=''; }, 550); }
  if (vModal) {
    vModal.addEventListener('click', e => { if (e.target === vModal) closeVideoModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && vModal.classList.contains('active')) closeVideoModal(); });
  }
  document.querySelectorAll('.mockup-video').forEach(wrap => {
    const id = ytId(wrap.dataset.youtube);
    if (id) {
      const f = document.createElement('iframe');
      const p = new URLSearchParams({ autoplay:'1', mute:'1', loop:'1', playlist:id, controls:'0', modestbranding:'1', rel:'0', showinfo:'0', playsinline:'1', disablekb:'1', iv_load_policy:'3', origin: location.origin });
      f.src = `https://www.youtube.com/embed/${id}?${p.toString()}`; f.allow = 'autoplay; encrypted-media'; f.setAttribute('frameborder','0');
      wrap.appendChild(f);
    }
    if (playCursor) {
      wrap.addEventListener('mousemove', e => { playCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; });
      wrap.addEventListener('mouseenter', e => { playCursor.classList.add('visible'); playCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; if (ring) ring.style.opacity = 0; });
      wrap.addEventListener('mouseleave', () => { playCursor.classList.remove('visible'); });
    }
    wrap.addEventListener('click', () => openVideoModal(id));
  });
});
