(() => {
  'use strict';

  const hero = document.querySelector('#top');
  const photo = hero?.querySelector('[data-hero-image]');
  if (!photo || hero.querySelector('.acoustics-demo')) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  // The overlay is drawn for the composition of the studio cover (both colour versions share it).
  const covers = ['lilac', 'teal'].map(tone => [
    new URL('v2/media/hero-coupe-' + tone + '.webp', document.baseURI).href,
    new URL('v2/media/hero-mobile-' + tone + '.webp', document.baseURI).href
  ]);
  const scene = document.createElement('div');
  scene.className = 'acoustics-demo';
  scene.setAttribute('aria-hidden', 'true');
  const arch = 'M-109 92C-101 25-84-111-49-159C-28-188-2-203 28-184C75-150 90-64 90 45';
  const section = arch + 'C96-25 90-151 46-196C13-231-26-221-60-183C-91-144-110-37-113 68Z';
  scene.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="zs-cut-metal" x1="0" y1="0" x2=".96" y2=".33" gradientUnits="objectBoundingBox">
        <stop style="stop-color:color-mix(in srgb,var(--accent) 34%,#24222f)"/><stop offset=".32" style="stop-color:color-mix(in srgb,var(--accent) 78%,#fff)"/><stop offset=".6" style="stop-color:color-mix(in srgb,var(--accent) 45%,#2b2839)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--accent) 28%,#1d1b27)"/>
      </linearGradient>
      <pattern id="zs-cut-foil" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(21)">
        <path d="M0 0H7M0 3.5H7" style="stroke:color-mix(in srgb,var(--accent) 30%,#fff)" stroke-opacity=".65" stroke-width=".9"/>
        <path d="M0 0V7" style="stroke:color-mix(in srgb,var(--accent) 22%,#16141e)" stroke-width="1.35"/>
      </pattern>
      <linearGradient id="zs-road-light" gradientUnits="userSpaceOnUse" x1="-503" y1="0" x2="-8" y2="0">
        <stop style="stop-color:var(--spark)" stop-opacity="0"/><stop offset=".17" style="stop-color:var(--spark)" stop-opacity=".66"/><stop offset=".76" style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--accent) 45%,#fff)" stop-opacity=".8"/>
      </linearGradient>
      <radialGradient id="zs-road-glow"><stop style="stop-color:color-mix(in srgb,var(--accent) 60%,#fff)" stop-opacity=".68"/><stop offset=".36" style="stop-color:var(--accent)" stop-opacity=".3"/><stop offset="1" style="stop-color:var(--accent-dark)" stop-opacity="0"/></radialGradient>
    </defs>
    <g data-mounted>
      <g data-road></g>
      <ellipse data-contact cx="-2" cy="181" rx="84" ry="12" fill="url(#zs-road-glow)"/>
      <g data-fronts></g>
      <g data-section>
        <g data-foil>
          <path d="${section}" fill="url(#zs-cut-metal)" style="stroke:color-mix(in srgb,var(--accent) 25%,#15131d)" stroke-width="2.4"/>
          <path d="${section}" fill="url(#zs-cut-foil)" opacity=".78"/>
          <path d="M-107 62C-99-23-83-116-49-163C-24-198 2-207 30-190C64-164 81-104 88-58" class="acoustics-seam"/>
        </g>
        <g data-damper>
          <path d="${arch}" fill="none" style="stroke:color-mix(in srgb,var(--accent) 22%,#14121c)" stroke-width="10"/>
          <path d="${arch}" fill="none" style="stroke:color-mix(in srgb,var(--accent) 70%,#3d3a52)" stroke-width="4.8" stroke-dasharray="1 3" opacity=".8"/>
        </g>
        <path d="${arch}" fill="none" style="stroke:var(--accent)" stroke-width="2.7"/>
      </g>
      <g data-cabin fill="none" style="stroke:color-mix(in srgb,var(--accent) 55%,#fff)" stroke-linecap="round"><path d="M-18-228q14-9 25-5" stroke-width="2.6"/><path d="M-22-244q10-7 17-3" stroke-width="1.7"/><path d="M-27-258q5-3 9-2" stroke-width="1.2"/></g>
      <path data-energy d="${arch}" pathLength="1" fill="none" style="stroke:color-mix(in srgb,var(--spark) 30%,#fff)" stroke-width="5" stroke-linecap="round"/>
    </g>
  </svg>`;
  const caption = document.createElement('div');
  caption.className = 'acoustics-caption';
  caption.innerHTML = '<button type="button"><svg viewBox="0 0 20 20" aria-hidden="true"><path/></svg></button><span><span class="acoustics-topic">Шумоизоляция арки</span><span class="acoustics-phase"></span></span>';
  const control = caption.querySelector('button');
  const glyph = control.querySelector('path');
  const phaseLabel = caption.querySelector('.acoustics-phase');
  const svg = scene.querySelector('svg');
  const mount = svg.querySelector('[data-mounted]');
  const cutaway = svg.querySelector('[data-section]');
  const foil = svg.querySelector('[data-foil]');
  const damper = svg.querySelector('[data-damper]');
  const cabin = svg.querySelector('[data-cabin]');
  const glow = svg.querySelector('[data-contact]');
  const runner = svg.querySelector('[data-energy]');
  const ns = svg.namespaceURI;
  function curve(group, className) {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('class', className);
    group.append(path);
    return path;
  }
  const road = Array.from({ length: 6 }, () => curve(svg.querySelector('[data-road]'), 'acoustics-road-line'));
  const fronts = Array.from({ length: 3 }, () => curve(svg.querySelector('[data-fronts]'), 'acoustics-front'));
  const duration = 5600;
  let elapsed = 0;
  let paused = false;
  let onScreen = false;
  let supported = false;
  let frame = 0;
  let lastTick;
  let lastPaint = -99;
  const ease = v => { v = Math.min(1, Math.max(0, v)); return v * v * (3 - 2 * v); };

  function draw(time) {
    const t = time / 1000;
    // A packet of pressure travels across the ground and excites the tyre.
    const roadFade = .23 + .77 * (1 - ease((t - 2.7) / 1.15));
    const pulse = (.5 - .5 * Math.cos(t * 4.5));
    road.forEach((p, row) => {
      const points = [];
      for (let n = 0; n <= 90; n++) {
        const u = n / 90;
        const envelope = Math.sin(u * Math.PI) ** .8 * Math.exp(-((u - (.12 + t * .33)) ** 2) / .10);
        const offset = (row - 2.5) * (7.6 - 5.9 * u);
        const x = -503 + u * 491;
        const y = 242 - 61 * u + offset - envelope * (17 + row * 1.9) * Math.sin(u * 38 - t * 8 + row * .39);
        points.push((n ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1));
      }
      p.setAttribute('d', points.join(''));
      p.setAttribute('stroke-width', row === 2 || row === 3 ? 1.95 : 1.15);
      p.setAttribute('opacity', String(roadFade * (.59 + .09 * Math.cos(row))));
    });
    glow.setAttribute('opacity', String(.25 + .68 * pulse * roadFade));
    // Broken wave fronts rise from the contact patch and attenuate in the lining.
    fronts.forEach((p, i) => {
      const progress = ((Math.max(0, t - .45) * .43 + i / 3) % 1);
      const x = -12 - 65 * Math.sin(progress * Math.PI * .92);
      const y = 166 - 338 * progress;
      const span = 15 + 20 * Math.sin(progress * Math.PI);
      p.setAttribute('d', `M${x - span} ${y + 3}q${span} ${-15 + 7 * progress} ${span * 2} -1`);
      p.setAttribute('opacity', String(ease(t / .8) * Math.sin(progress * Math.PI) * .83 * (1 - ease((t - 3.85) / 1.5))));
    });
    const reveal = .18 + .76 * ease((t - .78) / 1.1) - .39 * ease((t - 4.45) / 1.1);
    cutaway.setAttribute('opacity', String(reveal));
    // The cutaway opens for the passing pulse, then both layers seat against the body.
    const lifted = ease((t - .65) / .95) * (1 - ease((t - 2.2) / 1.25));
    foil.setAttribute('transform', `translate(${-12 * lifted} ${-22 * lifted})`);
    damper.setAttribute('transform', `translate(${-4 * lifted} ${-7 * lifted})`);
    const residual = ease((t - 2.75) / .5) * (1 - ease((t - 3.65) / .95));
    cabin.setAttribute('opacity', String(residual * .74));
    cabin.setAttribute('transform', `translate(${-4 * residual} ${-10 * residual})`);
    const travel = ease((t - 1.1) / 3.3);
    runner.setAttribute('stroke-dasharray', '.17 1.2');
    runner.setAttribute('stroke-dashoffset', String(.18 - travel));
    runner.setAttribute('opacity', String(.91 * ease(t - .9) * (1 - ease((t - 3.7) / .9))));
    const label = t < 1.6 ? 'Шум от дороги' : t < 3.95 ? 'Слои гасят вибрации' : 'Колебания затихают';
    if (phaseLabel.textContent !== label) phaseLabel.textContent = label;
  }

  function syncControl() {
    const ended = elapsed >= duration;
    const label = ended ? 'Повторить анимацию шумоизоляции арки' : paused ? 'Продолжить анимацию' : 'Приостановить анимацию';
    control.setAttribute('aria-label', label);
    control.title = label;
    glyph.setAttribute('d', ended ? 'M4 8a6.5 6.5 0 1 1-.2 3.4M4 3.5V8h4.5' : paused ? 'm6.5 4.7 8 5.3-8 5.3Z' : 'M7 4.5v11M13 4.5v11');
    control.hidden = still.matches;
  }
  function tick(now) {
    frame = 0;
    if (lastTick !== undefined) elapsed = Math.min(duration, elapsed + now - lastTick);
    lastTick = now;
    if (now - lastPaint >= 32 || elapsed === duration) {
      draw(elapsed);
      lastPaint = now;
    }
    if (elapsed < duration) frame = requestAnimationFrame(tick);
    else syncControl();
  }
  function playback() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTick = undefined;
    if (still.matches) draw(duration);
    else if (supported && onScreen && !paused && !document.hidden && elapsed < duration) frame = requestAnimationFrame(tick);
    syncControl();
  }
  function layout() {
    const source = photo.currentSrc || photo.src;
    const pair = covers.find(urls => urls.includes(source));
    supported = !photo.hidden && Boolean(pair);
    scene.hidden = caption.hidden = !supported;
    if (!supported) { playback(); return; }
    const portrait = source === pair[1];
    const [w, h] = portrait ? [1122, 1402] : [1922, 818];
    const scale = Math.max(hero.clientWidth / w, hero.clientHeight / h);
    const [left, top] = getComputedStyle(photo).objectPosition.split(' ').map(parseFloat);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    Object.assign(svg.style, {
      width: (w * scale) + 'px', height: (h * scale) + 'px',
      left: (hero.clientWidth - w * scale) * left / 100 + 'px',
      top: (hero.clientHeight - h * scale) * top / 100 + 'px'
    });
    mount.setAttribute('transform', portrait ? 'translate(790 1040) scale(.91 .923)' : 'translate(1510 509)');
    draw(still.matches ? duration : elapsed);
    playback();
  }
  control.addEventListener('click', () => {
    if (elapsed >= duration) { elapsed = 0; paused = false; }
    else paused = !paused;
    playback();
  });
  hero.append(scene, caption);
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; playback(); }).observe(hero);
  new ResizeObserver(layout).observe(hero);
  new MutationObserver(layout).observe(photo, { attributes: true, attributeFilter: ['src', 'hidden'] });
  photo.addEventListener('load', layout);
  still.addEventListener('change', () => { draw(still.matches ? duration : elapsed); playback(); });
  document.addEventListener('visibilitychange', playback);
  layout();
})();
