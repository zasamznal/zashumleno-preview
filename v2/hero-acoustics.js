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
  // Contour of the wheel-well opening on the cover, in coordinates centred on the rear wheel.
  const lineA = 'M-102.5 83.5C-101.2 76.5 -97.2 55.1 -94.5 41.5C-91.9 27.8 -89.4 14.8 -86.6 1.5C-83.7 -11.8 -80.9 -25.1 -77.6 -38.4C-74.3 -51.7 -70.9 -65.0 -66.6 -78.2C-62.3 -91.5 -57.8 -104.7 -51.7 -118.0C-45.6 -131.2 -36.7 -147.7 -29.9 -157.6C-23.2 -167.5 -16.5 -172.6 -11.4 -177.1C-6.2 -181.6 -3.0 -182.8 1.0 -184.7C5.1 -186.6 8.8 -188.5 13.0 -188.5C17.2 -188.5 21.8 -186.6 26.0 -184.7C30.2 -182.8 33.5 -181.7 38.3 -177.2C43.1 -172.7 49.7 -165.8 54.9 -157.7C60.1 -149.5 65.5 -139.7 69.6 -128.2C73.8 -116.6 77.1 -101.8 79.5 -88.5C82.0 -75.3 83.5 -62.1 84.5 -48.8C85.5 -35.6 86.0 -21.5 85.5 -9.1C85.0 3.3 82.9 16.4 81.5 25.6C80.2 34.9 78.2 43.1 77.5 46.5';
  const lineB = 'M-93.2 85.2C-91.9 78.3 -87.9 56.9 -85.2 43.3C-82.6 29.7 -80.1 16.7 -77.3 3.5C-74.5 -9.7 -71.6 -23.0 -68.4 -36.1C-65.1 -49.2 -61.8 -62.3 -57.6 -75.3C-53.4 -88.3 -49.0 -101.1 -43.1 -114.0C-37.2 -126.8 -28.4 -142.9 -22.1 -152.2C-15.8 -161.6 -9.6 -166.0 -5.1 -170.0C-0.6 -173.9 2.0 -174.6 5.0 -176.1C8.0 -177.6 10.2 -179.0 13.0 -179.0C15.8 -179.0 19.0 -177.5 22.1 -176.0C25.3 -174.6 27.7 -174.1 31.8 -170.2C35.9 -166.3 42.1 -160.1 46.9 -152.5C51.7 -145.0 56.8 -135.9 60.7 -125.0C64.6 -114.0 67.8 -99.6 70.2 -86.8C72.6 -74.0 74.1 -61.0 75.0 -48.1C76.0 -35.2 76.5 -21.5 76.0 -9.5C75.5 2.6 73.4 15.3 72.1 24.3C70.8 33.3 68.9 41.3 68.2 44.8';
  const band = 'M-102.5 83.5C-101.2 76.5 -97.2 55.1 -94.5 41.5C-91.9 27.8 -89.4 14.8 -86.6 1.5C-83.7 -11.8 -80.9 -25.1 -77.6 -38.4C-74.3 -51.7 -70.9 -65.0 -66.6 -78.2C-62.3 -91.5 -57.8 -104.7 -51.7 -118.0C-45.6 -131.2 -36.7 -147.7 -29.9 -157.6C-23.2 -167.5 -16.5 -172.6 -11.4 -177.1C-6.2 -181.6 -3.0 -182.8 1.0 -184.7C5.1 -186.6 8.8 -188.5 13.0 -188.5C17.2 -188.5 21.8 -186.6 26.0 -184.7C30.2 -182.8 33.5 -181.7 38.3 -177.2C43.1 -172.7 49.7 -165.8 54.9 -157.7C60.1 -149.5 65.5 -139.7 69.6 -128.2C73.8 -116.6 77.1 -101.8 79.5 -88.5C82.0 -75.3 83.5 -62.1 84.5 -48.8C85.5 -35.6 86.0 -21.5 85.5 -9.1C85.0 3.3 82.9 16.4 81.5 25.6C80.2 34.9 78.2 43.1 77.5 46.5L68.2 44.8C68.9 41.3 70.8 33.3 72.1 24.3C73.4 15.3 75.5 2.6 76.0 -9.5C76.5 -21.5 76.0 -35.2 75.0 -48.1C74.1 -61.0 72.6 -74.0 70.2 -86.8C67.8 -99.6 64.6 -114.0 60.7 -125.0C56.8 -135.9 51.7 -145.0 46.9 -152.5C42.1 -160.1 35.9 -166.3 31.8 -170.2C27.7 -174.1 25.3 -174.6 22.1 -176.0C19.0 -177.5 15.8 -179.0 13.0 -179.0C10.2 -179.0 8.0 -177.6 5.0 -176.1C2.0 -174.6 -0.6 -173.9 -5.1 -170.0C-9.6 -166.0 -15.8 -161.6 -22.1 -152.2C-28.4 -142.9 -37.2 -126.8 -43.1 -114.0C-49.0 -101.1 -53.4 -88.3 -57.6 -75.3C-61.8 -62.3 -65.1 -49.2 -68.4 -36.1C-71.6 -23.0 -74.5 -9.7 -77.3 3.5C-80.1 16.7 -82.6 29.7 -85.2 43.3C-87.9 56.9 -91.9 78.3 -93.2 85.2Z';
  const contact = { x: 4, y: 191 };
  scene.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="zs-lining" gradientUnits="userSpaceOnUse" x1="-100" y1="80" x2="90" y2="-190">
        <stop style="stop-color:color-mix(in srgb,var(--accent) 80%,#fff)"/><stop offset=".55" style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--accent-alt) 50%,var(--accent))"/>
      </linearGradient>
      <radialGradient id="zs-hot"><stop style="stop-color:var(--spark)" stop-opacity=".9"/><stop offset=".45" style="stop-color:var(--spark)" stop-opacity=".3"/><stop offset="1" style="stop-color:var(--spark)" stop-opacity="0"/></radialGradient>
      <radialGradient id="zs-calm"><stop style="stop-color:var(--accent)" stop-opacity=".75"/><stop offset=".5" style="stop-color:var(--accent)" stop-opacity=".22"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity="0"/></radialGradient>
      <mask id="zs-floor" maskUnits="userSpaceOnUse" x="-700" y="-300" width="1400" height="760">
        <rect x="-700" y="-300" width="1400" height="760" fill="#fff"/>
        <ellipse cx="4" cy="6" rx="99" ry="186" fill="#000"/>
      </mask>
      <filter id="zs-glow" x="-40%" y="-20%" width="180%" height="140%"><feGaussianBlur stdDeviation="3.6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <g data-mounted>
      <ellipse data-hot cx="${contact.x}" cy="${contact.y}" rx="96" ry="17" fill="url(#zs-hot)"/>
      <ellipse data-calm cx="${contact.x}" cy="${contact.y}" rx="84" ry="13" fill="url(#zs-calm)"/>
      <g data-floor mask="url(#zs-floor)"></g>
      <g data-lining>
        <path data-band d="${band}" fill="url(#zs-lining)"/>
        <path data-halo d="${lineA}" pathLength="1" class="acoustics-halo"/>
        <path data-layer="b" d="${lineB}" pathLength="1" class="acoustics-layer acoustics-layer-b"/>
        <g filter="url(#zs-glow)"><path data-layer="a" d="${lineA}" pathLength="1" class="acoustics-layer"/><path data-sweep d="${lineA}" pathLength="1" class="acoustics-sweep"/><circle data-head r="4.6"/></g>
      </g>
    </g>
  </svg>`;
  const caption = document.createElement('div');
  caption.className = 'acoustics-caption';
  caption.innerHTML = '<button type="button"><svg viewBox="0 0 20 20" aria-hidden="true"><path/></svg></button><span class="acoustics-meter" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span><span class="acoustics-topic">Шумоизоляция арки</span><span class="acoustics-phase"></span></span>';
  const control = caption.querySelector('button');
  const glyph = control.querySelector('path');
  const phaseLabel = caption.querySelector('.acoustics-phase');
  const bars = [...caption.querySelectorAll('.acoustics-meter i')];
  const svg = scene.querySelector('svg');
  const mount = svg.querySelector('[data-mounted]');
  const hot = svg.querySelector('[data-hot]');
  const calmGlow = svg.querySelector('[data-calm]');
  const fill = svg.querySelector('[data-band]');
  const layerA = svg.querySelector('[data-layer="a"]');
  const layerB = svg.querySelector('[data-layer="b"]');
  const head = svg.querySelector('[data-head]');
  const halo = svg.querySelector('[data-halo]');
  const sweep = svg.querySelector('[data-sweep]');
  const ns = svg.namespaceURI;
  const floor = svg.querySelector('[data-floor]');
  // A ring on the floor: the near half is bright with a soft halo, the far half is fainter and partly hidden by the tyre.
  function ring(className) {
    const group = document.createElementNS(ns, 'g');
    group.setAttribute('class', className);
    const parts = ['far', 'halo', 'near'].map(name => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('class', 'acoustics-ring-' + name);
      group.append(path);
      return path;
    });
    floor.append(group);
    return { group, far: parts[0], halo: parts[1], near: parts[2] };
  }
  // Road noise spreads over the floor from the tyre; once the arch is lined the rings are weak, slow and short.
  const loudRings = [.1, .5, .9, 1.3, 1.7].map(start => ({ start, life: 1.5, reach: 380, amp: 1, width: 2.8, path: ring('acoustics-ring') }));
  const calmRings = [3.35, 3.95, 4.55].map((start, i) => ({ start, life: 1.7, reach: [250, 205, 165][i], amp: [.75, .5, .3][i], width: 2.2, path: ring('acoustics-ring acoustics-ring-calm') }));
  const duration = 6200;
  let elapsed = 0;
  let paused = false;
  let onScreen = false;
  let supported = false;
  let frame = 0;
  let lastTick;
  let lastPaint = -99;
  let length = 0;
  const ease = v => { v = Math.min(1, Math.max(0, v)); return v * v * (3 - 2 * v); };

  function ripple(item, t) {
    const p = (t - item.start) / item.life;
    const { group, far, halo, near } = item.path;
    if (p <= 0 || p >= 1) { group.setAttribute('opacity', '0'); return; }
    const rx = 34 + (item.reach - 34) * (1 - (1 - p) ** 1.8);
    const ry = rx * .24;
    const left = (contact.x - rx).toFixed(1), right = (contact.x + rx).toFixed(1), y = contact.y.toFixed(1);
    const arc = sweep => `M${left} ${y}A${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 ${sweep} ${right} ${y}`;
    far.setAttribute('d', arc(1));
    near.setAttribute('d', arc(0));
    halo.setAttribute('d', arc(0));
    const width = item.width * (1 - .45 * p);
    near.setAttribute('stroke-width', width.toFixed(2));
    far.setAttribute('stroke-width', (width * .6).toFixed(2));
    halo.setAttribute('stroke-width', (width * 4).toFixed(2));
    group.setAttribute('opacity', (item.amp * ease(p / .1) * (1 - p) ** 1.25).toFixed(3));
  }

  function draw(time) {
    const t = time / 1000;
    for (const item of loudRings) ripple(item, t);
    for (const item of calmRings) ripple(item, t);
    // The lining is laid along the opening: the outer layer first, then the inner one.
    const laidA = ease((t - 2) / 1.2);
    const laidB = ease((t - 2.25) / 1.1);
    for (const path of [layerA, halo]) path.setAttribute('stroke-dashoffset', String(1 - laidA));
    layerB.setAttribute('stroke-dashoffset', String(1 - laidB));
    const settle = ease((t - 3.4) / 1.2);
    layerA.setAttribute('opacity', laidA > 0 ? (1 - .3 * settle).toFixed(3) : '0');
    halo.setAttribute('opacity', laidA > 0 ? (1 - .35 * settle).toFixed(3) : '0');
    layerB.setAttribute('opacity', laidB > 0 ? (.85 - .2 * settle).toFixed(3) : '0');
    fill.setAttribute('opacity', (.5 * ease((t - 2.8) / .8) - .12 * settle).toFixed(3));
    // A last pulse runs along the lined arch and fades: the vibration has nowhere to go.
    const run = (t - 3.45) / 1.05;
    sweep.setAttribute('stroke-dashoffset', (.08 - ease(run) * 1.08).toFixed(3));
    sweep.setAttribute('opacity', run > 0 && run < 1 ? Math.min(1, run * 8, (1 - run) * 5).toFixed(3) : '0');
    if (!length) length = layerA.getTotalLength?.() || 0;
    if (length && laidA > 0 && laidA < 1) {
      const point = layerA.getPointAtLength(length * laidA);
      head.setAttribute('cx', point.x.toFixed(1));
      head.setAttribute('cy', point.y.toFixed(1));
      head.setAttribute('opacity', String(Math.min(1, laidA * 6, (1 - laidA) * 6)));
    } else head.setAttribute('opacity', '0');
    const beat = .5 + .5 * Math.sin(t * 9);
    hot.setAttribute('opacity', ((1 - ease((t - 2) / 1.2)) * (.5 + .5 * beat) * ease(t / .3)).toFixed(3));
    calmGlow.setAttribute('opacity', (ease((t - 3) / 1) * (.55 - .25 * ease((t - 5) / 1.2))).toFixed(3));
    const loud = 1 - .8 * ease((t - 2.5) / 2.7);
    bars.forEach((bar, i) => {
      const flutter = time >= duration ? .62 : .55 + .45 * Math.abs(Math.sin(t * (6.5 + i * 2.1) + i * 1.7));
      bar.style.setProperty('--level', Math.max(.14, loud * flutter * (1 - Math.abs(i - 2) * .12)).toFixed(3));
    });
    const label = t < 2.1 ? 'Шум от дороги' : t < 3.7 ? 'Слои гасят вибрации' : 'В салоне тише';
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
