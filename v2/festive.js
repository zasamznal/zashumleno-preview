// New Year mode: the switch in the header turns on snow, a garland and a few festive details.
// The visitor's choice is kept in the browser. The cabinet («Обложка и тексты» → «Новогодний режим») decides whether
// the switch is shown at all, whether only in the season, and whether the mode is on until the visitor chooses.
(() => {
  'use strict';

  // false removes the switch and the mode whatever the cabinet says.
  const enabled = true;
  const CHOICE = 'zashumleno:festive';      // the visitor's own choice: 'on' | 'off'
  const SITE = 'zashumleno:festive-site';   // the cabinet settings seen last, so the next visit starts without waiting for them
  const HINT = 'zashumleno:festive-hint';   // the one-time hint under the switch has been shown

  // The season of the switch: 15 November – 31 January.
  function inSeason(date = new Date()) {
    const month = date.getMonth();
    return month === 11 || month === 0 || (month === 10 && date.getDate() >= 15);
  }

  // A plain greeting, no offers: before the holiday and in January. Outside these months the mode is decoration only.
  function greeting(date = new Date()) {
    const month = date.getMonth();
    return month === 10 || month === 11 ? 'С наступающим Новым годом!' : month === 0 ? 'С Новым годом!' : '';
  }

  // The three cabinet settings; a snapshot saved before they existed gets the defaults.
  function settingsOf(brand) {
    return { button: brand?.festiveButton !== false, seasonal: brand?.festiveSeasonal !== false, on: brand?.festiveOn === true };
  }
  const pack = settings => [settings.button, settings.seasonal, settings.on].map(Number).join('');
  function unpack(text) {
    return /^[01]{3}$/.test(text || '') ? { button: text[0] === '1', seasonal: text[1] === '1', on: text[2] === '1' } : null;
  }

  // available — the switch is shown; active — the mode is on. The visitor's choice wins over the cabinet default.
  function resolve(settings, choice, date = new Date()) {
    const available = Boolean(settings?.button && (!settings.seasonal || inSeason(date)));
    return { available, active: available && (choice === 'on' || (choice !== 'off' && settings.on)) };
  }

  // Snow stays light: a phone gets about two dozen flakes, a wide screen under a hundred.
  const flakeCount = (width, height) => Math.round(Math.min(96, Math.max(16, width * height / 14000)));

  // depth: 0 — far, small and slow; 1 — near. Near flakes are drawn as small crystals.
  function makeFlake(width, height, random = Math.random, fromTop = false) {
    const depth = random();
    return {
      x: random() * width, y: fromTop ? -8 : random() * height, r: .9 + depth * 2.1, speed: 16 + depth * 36,
      sway: 5 + random() * 15, phase: random() * 6.283, turn: random() * 3.14, alpha: .34 + depth * .56, crystal: depth > .86
    };
  }
  function stepFlake(flake, dt, time, width, height, random = Math.random) {
    flake.y += flake.speed * dt;
    flake.x += Math.cos(flake.phase + time * .6) * flake.sway * dt;
    if (flake.y - flake.r * 3 > height) Object.assign(flake, makeFlake(width, height, random, true));
    if (flake.x < -10) flake.x += width + 20;
    else if (flake.x > width + 10) flake.x -= width + 20;
    return flake;
  }

  // «#rrggbb», «rgb(…)», «rgba(…)» and «color(srgb …)» → [r, g, b, a] with channels 0…255.
  function parseColor(text) {
    const value = String(text || '').trim();
    const hex = /^#([\da-f]{6})$/i.exec(value);
    if (hex) return [0, 2, 4].map(at => parseInt(hex[1].slice(at, at + 2), 16)).concat(1);
    const numbers = (value.match(/-?\d*\.?\d+(?:e-?\d+)?%?/g) || []).map(part => part.endsWith('%') ? parseFloat(part) / 100 : parseFloat(part));
    if (/^rgba?\(/.test(value) && numbers.length >= 3) return [numbers[0], numbers[1], numbers[2], numbers[3] ?? 1];
    if (/^color\(srgb /.test(value) && numbers.length >= 3) return [numbers[0] * 255, numbers[1] * 255, numbers[2] * 255, numbers[3] ?? 1];
    return null;
  }
  const isLight = color => Boolean(color) && color[0] * .2126 + color[1] * .7152 + color[2] * .0722 > 140;
  const mix = (a, b, share) => a.slice(0, 3).map((channel, index) => Math.round(channel * share + b[index] * (1 - share)));

  // The hat sits on the roof of the car in the studio mark. Its place is given in the pixels of the mark picture (194 × 176),
  // so it stays on the roof at any size of the mark. box — [left, top, width, height] of the picture's element; the picture
  // is fitted inside the element (object-fit: contain).
  const HAT = { mark: [194, 176], box: [60, 36, 92, 64] };
  function hatSeat([left, top, width, height]) {
    const scale = Math.min(width / HAT.mark[0], height / HAT.mark[1]);
    const [x, y] = [left + (width - HAT.mark[0] * scale) / 2, top + (height - HAT.mark[1] * scale) / 2];
    return { left: x + HAT.box[0] * scale, top: y + HAT.box[1] * scale, width: HAT.box[2] * scale, height: HAT.box[3] * scale };
  }

  window.StudioFestive = { enabled, inSeason, greeting, settingsOf, pack, unpack, resolve, flakeCount, makeFlake, stepFlake, parseColor, isLight, hatSeat };
  // Tests read the model without a page.
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const toggle = document.querySelector('[data-festive-toggle]');
  const head = document.querySelector('.site-head');
  if (!toggle || !head) return;
  if (!enabled) { toggle.hidden = true; root.classList.add('festive-none'); return; }

  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const preview = new URLSearchParams(location.search).get('preview') === 'draft';
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  // Without storage (private mode, a blocked site) the choice lives until the page is closed.
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* nothing to keep it in */ } };
  const ownChoice = value => value === 'on' || value === 'off' ? value : null;
  let choice = ownChoice(read(CHOICE));
  let settings = null;
  let active = false;
  let decor = null;
  let noteTimer = 0;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // The bubble under the switch: the one-time hint and the greeting on a phone.
  const note = element('span', 'festive-note');
  note.setAttribute('aria-hidden', 'true');
  toggle.append(note);
  const announcer = element('p', 'visually-hidden');
  announcer.setAttribute('role', 'status');
  head.append(announcer);
  function showNote(text, time) {
    clearTimeout(noteTimer);
    note.textContent = text;
    note.classList.add('is-shown');
    toggle.classList.add('has-note');
    noteTimer = setTimeout(hideNote, time);
  }
  function hideNote() {
    clearTimeout(noteTimer);
    note.classList.remove('is-shown');
    toggle.classList.remove('has-note', 'is-calling');
  }

  // ---- Snow -------------------------------------------------------------------------------------------------------
  function createSnow(canvas) {
    const context = canvas.getContext('2d');
    let flakes = [];
    let width = 0, height = 0, frame = 0, last = 0, clock = 0, measured = -1e9, activity = 0;
    let bands = [];
    let fills = new Map(), filled = -1e9;
    let tones = { dark: '#fff', light: '#8c85c2' };
    let running = false, asleep = false, stale = false, skip = false;
    // A touch screen gets every second frame: slow flakes look the same, the phone works half as much.
    const coarse = matchMedia('(pointer: coarse)');

    function size() {
      const nextWidth = canvas.clientWidth, nextHeight = canvas.clientHeight;
      if (!nextWidth || !nextHeight) return;
      // Sharp on a phone, lighter on a large dense screen: the canvas stays within about 2.4 million pixels.
      const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1, Math.sqrt(2.4e6 / (nextWidth * nextHeight))));
      width = nextWidth; height = nextHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = flakeCount(width, height);
      while (flakes.length < count) flakes.push(makeFlake(width, height));
      flakes.length = count;
    }

    // Where the page is light and where it is dark: a flake takes a tone that is seen on its background.
    // The bands are kept in page coordinates, so scrolling needs no new measurement; the colours are read again
    // every two seconds (the cabinet palette arrives after the page).
    function measure(now) {
      measured = now;
      stale = false;
      const blocks = document.querySelectorAll('.site-head, main > section, .footer');
      if (now - filled > 2000) {
        filled = now;
        const style = getComputedStyle(root);
        const accent = parseColor(style.getPropertyValue('--accent')) || [188, 185, 217, 1];
        const deep = parseColor(style.getPropertyValue('--accent-dark')) || [82, 70, 166, 1];
        const paper = isLight(parseColor(style.getPropertyValue('--paper')) || [241, 239, 248, 1]);
        tones = { dark: 'rgb(' + mix([255, 255, 255], accent, .88) + ')', light: 'rgb(' + mix(deep, accent, .5) + ')' };
        fills = new Map([[root, paper]]);
        for (const block of blocks) {
          const fill = parseColor(getComputedStyle(block).backgroundColor);
          fills.set(block, fill && fill[3] > .5 ? isLight(fill) : paper);
        }
      }
      bands = [];
      const scrolled = window.scrollY;
      for (const block of blocks) {
        const box = block.getBoundingClientRect();
        if (box.height) bands.push([box.top + scrolled, box.bottom + scrolled, fills.get(block) ?? fills.get(root)]);
      }
      bands.fallback = fills.get(root);
    }
    const lightAt = y => { for (const band of bands) if (y >= band[0] && y < band[1]) return band[2]; return bands.fallback; };

    function draw(now) {
      frame = 0;
      if (!running) return;
      // Nobody has touched the page for two minutes: the snow fades out and waits for the visitor.
      if (now - activity > 120000) { sleep(); return; }
      frame = requestAnimationFrame(draw);
      skip = coarse.matches && !skip;
      if (skip) return;
      const dt = Math.min(.08, (now - last) / 1000 || 0);
      last = now;
      clock += dt;
      if (stale || now - measured > 700) measure(now);
      const scrolled = window.scrollY;
      context.clearRect(0, 0, width, height);
      for (const flake of flakes) {
        stepFlake(flake, dt, clock, width, height);
        const light = lightAt(flake.y + scrolled);
        context.globalAlpha = flake.alpha * (light ? .62 : 1);
        if (flake.crystal) {
          const arm = flake.r * 2.1;
          context.strokeStyle = light ? tones.light : tones.dark;
          context.lineWidth = 1.1;
          context.beginPath();
          for (let index = 0; index < 3; index++) {
            const angle = flake.turn + clock * .25 + index * 1.0472;
            const dx = Math.cos(angle) * arm, dy = Math.sin(angle) * arm;
            context.moveTo(flake.x - dx, flake.y - dy);
            context.lineTo(flake.x + dx, flake.y + dy);
          }
          context.stroke();
        } else {
          context.fillStyle = light ? tones.light : tones.dark;
          context.beginPath();
          context.arc(flake.x, flake.y, flake.r, 0, 6.2832);
          context.fill();
        }
      }
    }

    function wake() {
      activity = performance.now();
      if (!asleep) return;
      asleep = false;
      canvas.classList.remove('is-asleep');
      play();
    }
    function sleep() {
      asleep = true;
      canvas.classList.add('is-asleep');
    }
    function play() {
      if (!running || asleep || document.hidden || frame) return;
      last = performance.now();
      frame = requestAnimationFrame(draw);
    }
    function halt() {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    let resizeTimer = 0;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { size(); stale = true; }, 160); };
    const onVisibility = () => { if (document.hidden) halt(); else play(); };
    const events = ['scroll', 'pointermove', 'pointerdown', 'keydown', 'touchstart'];

    return {
      start() {
        if (running || !context) return;
        running = true; asleep = false;
        canvas.classList.remove('is-asleep');
        activity = performance.now();
        size();
        for (const name of events) window.addEventListener(name, wake, { passive: true });
        window.addEventListener('resize', onResize);
        document.addEventListener('visibilitychange', onVisibility);
        play();
      },
      stop() {
        if (!running) return;
        running = false;
        halt();
        for (const name of events) window.removeEventListener(name, wake);
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onVisibility);
        context.clearRect(0, 0, width, height);
      },
      // For the checks of the working copy: how many flakes fall and whether a frame is scheduled.
      state: () => ({ flakes: flakes.length, running, asleep, scheduled: Boolean(frame), width, height })
    };
  }

  // ---- Decoration -------------------------------------------------------------------------------------------------
  // The hat for the car of the studio mark in the header. A logo uploaded in the cabinet has no car to wear it: no hat then.
  function buildHat() {
    const link = document.querySelector('.site-head .wordmark');
    const mark = link?.querySelector('[data-brand-mark]');
    if (!mark) return null;
    const hat = element('span', 'festive-hat');
    hat.setAttribute('aria-hidden', 'true');
    hat.innerHTML = '<svg viewBox="0 0 92 64" focusable="false">' +
      '<path class="festive-hat-cap" d="M13.5 50C13 33 21.5 16 37 8.5c10.5-5 23-2.5 30.5 5.5 6 6.5 9.5 15 11 24.5-5.5-7-13-10-19-8.5-4.5 1.5-4.5 9.5-1 20Z"/>' +
      '<path class="festive-hat-fold" d="M29 43c.5-11 5.5-20.5 14.5-25.5"/>' +
      '<rect class="festive-hat-fur" x="8" y="46.5" width="57" height="13" rx="6.5"/>' +
      '<circle class="festive-hat-fur" cx="80.5" cy="41" r="7.5"/></svg>';
    link.append(hat);
    const seat = () => {
      const worn = !mark.hidden && mark.offsetWidth > 0;
      if (hat.hidden === worn) hat.hidden = !worn;
      if (!worn) return;
      const place = hatSeat([mark.offsetLeft, mark.offsetTop, mark.offsetWidth, mark.offsetHeight]);
      for (const side of ['left', 'top', 'width', 'height']) hat.style[side] = place[side].toFixed(2) + 'px';
    };
    seat();
    mark.addEventListener('load', seat);
    if (typeof ResizeObserver === 'function') new ResizeObserver(seat).observe(link);
    if (typeof MutationObserver === 'function') new MutationObserver(seat).observe(mark, { attributes: true, attributeFilter: ['hidden'] });
    return hat;
  }

  function build() {
    const garland = element('div', 'festive-garland');
    garland.setAttribute('aria-hidden', 'true');
    garland.append(element('i'), element('i'));
    const tag = element('span', 'festive-tag');
    tag.setAttribute('aria-hidden', 'true');
    // First in the header: the dropdown menu of a phone opens over the garland, not under it.
    head.prepend(garland, tag);
    const canvas = element('canvas', 'festive-snow');
    canvas.setAttribute('aria-hidden', 'true');
    document.body.append(canvas);
    return { garland, tag, hat: buildHat(), snow: createSnow(canvas) };
  }

  function setActive(next, byVisitor) {
    if (next === active && decor) return;
    active = next;
    if (active && !decor) decor = build();
    toggle.setAttribute('aria-pressed', String(active));
    toggle.dataset.tip = active ? 'Выключить новогодний режим' : 'Включить новогодний режим';
    if (!decor) return;
    const words = greeting();
    decor.tag.textContent = words;
    decor.tag.hidden = !words;
    // The class goes on a frame later than the new elements, so they fade in instead of popping up.
    if (active) requestAnimationFrame(() => root.classList.toggle('festive', active));
    else root.classList.remove('festive');
    if (active && !calm.matches) decor.snow.start(); else decor.snow.stop();
    if (!byVisitor) return;
    announcer.textContent = active ? 'Новогодний режим включён.' + (words ? ' ' + words : '') : 'Новогодний режим выключен.';
    // On a phone the greeting tag has no room under the header: the bubble under the switch says it once.
    if (active && words && matchMedia('(max-width: 680px)').matches) showNote(words, 4200);
  }

  function sync() {
    const state = resolve(settings, choice);
    toggle.hidden = !state.available;
    root.classList.toggle('festive-none', !state.available);
    root.classList.toggle('festive-ready', state.available);
    if (!state.available) hideNote();
    setActive(state.active, false);
    return state;
  }

  toggle.addEventListener('click', () => {
    choice = active ? 'off' : 'on';
    write(CHOICE, choice);
    write(HINT, '1');
    hideNote();
    setActive(!active, true);
  });
  // Another tab of the site has switched the mode: this one follows.
  window.addEventListener('storage', event => {
    if (event.key !== CHOICE || !settings) return;
    choice = ownChoice(event.newValue);
    sync();
  });
  calm.addEventListener('change', () => {
    if (!decor || !active) return;
    if (calm.matches) decor.snow.stop(); else decor.snow.start();
  });

  // A returning visitor gets the switch and the mode at once, from the settings seen last time.
  const cached = preview ? null : unpack(read(SITE));
  if (cached) { settings = cached; sync(); }
  // A first visit out of season: by the defaults of the site there is no switch, so its place closes without waiting.
  else if (!resolve(settingsOf(window.STUDIO_PAGE_DEFAULTS?.brand), choice).available) { toggle.hidden = true; root.classList.add('festive-none'); }
  Promise.resolve(window.STUDIO_READY).then(() => {
    settings = settingsOf(window.StudioPage?.current?.brand);
    if (!preview) write(SITE, pack(settings));
    const state = sync();
    // Once per browser: a short hint for a visitor who has not tried the switch yet.
    if (!state.available || state.active || choice || read(HINT)) return;
    setTimeout(() => {
      if (active || choice || toggle.hidden) return;
      write(HINT, '1');
      toggle.classList.add('is-calling');
      showNote('Включите новогодний режим', 9000);
    }, 2200);
  });

  window.StudioFestive.state = () => ({ available: !toggle.hidden, active, choice, settings, snow: decor?.snow.state() || null });
})();
