(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.getElementById('top');
  const progress = document.getElementById('reading-progress');
  const played = new WeakSet();
  const running = new Map();
  let frame = 0;

  function finish(element) {
    const entry = running.get(element);
    if (!entry) return;
    window.clearTimeout(entry.timeout);
    element.classList.remove(entry.className);
    running.delete(element);
  }

  function playOnce(element, className, duration) {
    if (!element || played.has(element)) return;
    played.add(element);
    if (reduced.matches || document.hidden || element.matches(':focus-within')) return;
    element.classList.add(className);
    const timeout = window.setTimeout(() => finish(element), duration);
    running.set(element, { className, timeout });
  }

  // Hash links take visitors directly to a section, without replaying the cover.
  if (hero && (!location.hash || location.hash === '#top') && window.scrollY < 24) {
    playOnce(hero, 'motion-cover-coming', 1400);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue;
        observer.unobserve(target);
        if (target.matches('.section-intro')) {
          playOnce(target, 'motion-intro-entering', 600);
        } else if (target.matches('[data-cases]')) {
          playOnce(target, 'motion-gallery-entering', 640);
        } else {
          playOnce(target, 'motion-picture-entering', 960);
        }
      }
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0.03 });

    function watchPublicSections() {
      const main = document.querySelector('main');
      if (!main) return;
      for (const heading of main.querySelectorAll('.section-intro')) {
        if (!heading.closest('#calculator, #layers')) observer.observe(heading);
      }
      const gallery = main.querySelector('#works [data-cases]');
      if (gallery) observer.observe(gallery);
      const services = main.querySelector('#services [data-services]');
      if (!services) return;
      function watchPictures() {
        services.querySelectorAll('img').forEach((image, index) => {
          if (played.has(image)) return;
          image.style.setProperty('--motion-beat', (index % 3) * 65 + 'ms');
          observer.observe(image);
        });
      }
      watchPictures();
      new MutationObserver(watchPictures).observe(services, { childList: true, subtree: true });
    }
    Promise.resolve(window.STUDIO_READY).then(ok => {
      if (ok !== false) watchPublicSections();
    }).catch(() => {});
  }

  // Interacting with a card always takes priority over its entrance.
  function stopAtInteraction(event) {
    for (const element of running.keys()) {
      if (element.contains(event.target)) finish(element);
    }
  }
  document.addEventListener('focusin', stopAtInteraction);
  document.addEventListener('pointerdown', stopAtInteraction, { passive: true });

  function updateProgress() {
    frame = 0;
    if (!progress || reduced.matches || document.hidden) return;
    const page = document.scrollingElement;
    if (!page) return;
    const distance = page.scrollHeight - page.clientHeight;
    const fraction = distance > 0 ? Math.max(0, Math.min(1, page.scrollTop / distance)) : 0;
    progress.style.setProperty('--reading-fraction', fraction.toFixed(4));
  }

  function queueProgress() {
    if (progress && !frame && !reduced.matches && !document.hidden) {
      frame = window.requestAnimationFrame(updateProgress);
    }
  }

  if (progress) {
    window.addEventListener('scroll', queueProgress, { passive: true });
    window.addEventListener('resize', queueProgress, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(queueProgress).observe(document.body);
    queueProgress();
  }
  function syncMotion() {
    if (document.hidden || reduced.matches) {
      for (const element of running.keys()) finish(element);
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    } else {
      queueProgress();
    }
  }
  document.addEventListener('visibilitychange', syncMotion);
  reduced.addEventListener('change', syncMotion);
})();
