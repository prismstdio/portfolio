/* ════════════════════════════════════════════════════════════
   Project detail pages — supplements main.js.
   Reuses: intro/split-title, cursor-ring, progress bar, video-embed
   (YouTube mockups), grain/vignette, data-parallax — all already
   wired generically by main.js. This file only adds what's unique
   to project pages: scroll reveals for info/mockup blocks, the
   simple mockup image lightbox, and the hero scroll fade.
   ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = window.gsap && window.ScrollTrigger;

  if (hasGSAP && !reduceMotion) {

    /* Hero media parallax + fade as the page scrolls away */
    if (document.getElementById('hero')) {
      gsap.to('#hero-media', {
        scale: 1.15, yPercent: 10, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });
      gsap.to('#scroll-cue', {
        opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: '15% top', scrub: true }
      });
    }

    /* Generic entrance for info blocks, mockups, footer bits */
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.fromTo(el, { y: 40, opacity: 0 }, { y: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 60%', scrub: 1 } });
    });

  } else {
    document.querySelectorAll('.reveal').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  /* ─── Simple mockup image lightbox (#mlightbox) ───
     Video mockups (.video-embed[data-youtube]) are already handled by
     main.js's own click handler — this only fires for items that carry
     a data-src (plain image mockups). */
  (function mockupLightbox() {
    const box = document.getElementById('mlightbox');
    if (!box) return;
    const img = document.getElementById('mlightbox-img');

    function open(src, alt) {
      if (!src) return;
      img.src = src; img.alt = alt || '';
      box.classList.add('active');
      if (window.lenis) window.lenis.stop(); document.body.style.overflow = 'hidden';
    }
    function close() {
      box.classList.remove('active');
      if (window.lenis) window.lenis.start(); document.body.style.overflow = '';
      setTimeout(() => { img.src = ''; }, 550);
    }
    document.querySelectorAll('.mockup-item[data-src]').forEach(item => {
      item.addEventListener('click', () => open(item.dataset.src, item.dataset.title));
    });
    box.addEventListener('click', e => { if (e.target === box) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('active')) close(); });
  })();

  if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 1200);
});
