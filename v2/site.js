(() => {
  const head = document.querySelector('.site-head');
  if (!head) return;
  const button = head.querySelector('.menu-toggle');
  const nav = head.querySelector('[data-nav]');
  function menu(open) {
    head.classList.toggle('menu-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }
  button.addEventListener('click', () => menu(!head.classList.contains('menu-open')));
  nav.addEventListener('click', event => { if (event.target.closest('a')) menu(false); });
  document.addEventListener('pointerdown', event => { if (!head.contains(event.target)) menu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && head.classList.contains('menu-open')) { menu(false); button.focus(); }
  });
  matchMedia('(max-width: 58rem)').addEventListener('change', () => menu(false));

  // A direct section link can scroll before the CMS has inserted the gallery and calculator.
  const initialHash = location.hash;
  const target = document.getElementById(initialHash.slice(1));
  if (!target?.matches('main > section') || performance.getEntriesByType('navigation')[0]?.type === 'back_forward') return;
  const interaction = new AbortController();
  for (const event of ['pointerdown', 'keydown', 'wheel', 'touchstart', 'hashchange', 'pagehide']) {
    window.addEventListener(event, () => interaction.abort(), { passive: true, signal: interaction.signal });
  }
  const loaded = document.readyState === 'complete' ? Promise.resolve() :
    new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
  Promise.all([window.STUDIO_READY, loaded, document.fonts?.ready]).then(([ready]) => {
    requestAnimationFrame(() => {
      if (ready !== false && !interaction.signal.aborted && location.hash === initialHash && !target.hidden) {
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
      interaction.abort();
    });
  });
})();
