(() => {
  'use strict';

  // «Карта машины» — a side view of a car in the receipt of the calculator. A zone with a line in the estimate is filled,
  // the open zone is outlined, a click opens a zone the way its tile does. Under the drawing — a kit of one level for
  // every zone that has it. Whatever the block says comes from the price list: titles of the zones and of the kits,
  // the count of the estimate. All its wording lives here. Set enabled to false to remove the block from the calculator.
  const carMap = {
    enabled: true,
    label: 'Схема автомобиля: зоны обработки',
    inEstimate: 'в смете',
    count: (chosen, all) => 'В смете ' + chosen + ' из ' + all + ' ' + (new Intl.PluralRules('ru').select(all) === 'one' ? 'зоны' : 'зон'),
    whole: 'Вся машина сразу',
    hint: 'Один уровень — во все зоны, где он есть.',
    everywhere: 'Есть в каждой зоне.',
    // Under the pressed level: where there is no such kit. The longer wording is read aloud after a press.
    missing: titles => titles.length === 1 ? 'Нет в зоне «' + titles[0] + '».' : 'Нет в зонах: ' + titles.join(', ') + '.',
    missingAloud: titles => titles.length === 1 ? 'Такого комплекта нет в зоне «' + titles[0] + '»'
      : 'Такого комплекта нет в зонах: ' + titles.join(', '),
    added: 'Добавлено',
    removed: 'Убрано',
    clear: 'Очистить смету',
    cleared: 'Смета очищена'
  };

  // The drawing, 320×104: the car looks to the left, the ground is at y = 97.5, the wheels stand at x = 67 and x = 247.
  // These lines are built by scripts/car-drawing.mjs: change the car there and run it, do not edit the paths by hand.
  // The body is one smooth line. A zone is one or two closed shapes that lie between the lines of the car: the roof, the boot
  // and the sill are painted up to the body line, the doors and the roof — up to the windows, and a narrow gap parts two
  // zones. «hit» is a wider unseen shape that takes the pointer where the drawn one is thin or small.
  const HULL = 'M44.2 86L21.5 85.4C16.6 85.3 13.6 83.2 13.1 79L12.2 67C11.8 62 13.8 58.2 17.6 56.8 41 48.9 75 43.7 101 41.5 104.2 41.2 106.3 40 108 38.4 117.5 29.5 128 21.2 137.5 16.4 145 12.6 156 11.2 170 11 190 10.8 207 12.8 222 17.5 240 23.2 256 30.5 268.5 36.6 271.5 38.1 275 38.6 279 38.9L297 40.3C301.3 40.6 304.3 42.9 304.8 47L305.6 63C306 70 305.8 77.5 303.6 81.5 302 84.4 299.3 85.4 295.5 85.4L269.8 86A24.5 24.5 0 1 0 224.2 86L89.8 86A24.5 24.5 0 1 0 44.2 86Z';
  const GLASS = 'M131 43.6L131 39.6C131 39.1 130.9 38.6 130.7 38 130 35.6 127.7 33.9 124.8 32.7 130.6 29.2 136.4 26.5 141.3 24 147.5 20.8 156.6 19.7 170.1 19.5 172.2 19.5 174.3 19.5 176.4 19.5L176.4 42.3ZM179.6 42.2L179.6 19.6C194.8 20 207.6 21.9 219.5 25.6 222.7 26.6 225.9 27.8 229 29.1L229 40.8ZM231.4 40.7L231.4 30.1C236.9 32.5 242 35.1 246.9 37.6Q251.5 40.1 248.1 40.2Z';
  // Lamps, door handles, a line of the bumper, the steering wheel on its column.
  const DETAILS = 'M14.6 62.8C19.6 59.6 25.6 56.6 32 54.5L30.2 58.3C24.6 59.8 18.8 62.4 14.2 65.8ZM303.5 46.3C299 44.5 293 43.7 286.6 43.5L287.6 46.8C293.6 47 299.6 48.2 304.2 50.8ZM163.5 46.4h8M215.2 44.9h8M13.8 77.6H35.5M133.5 32.5C134.3 32.2 135.7 34.1 136.6 36.7 137.6 39.3 137.7 41.6 136.9 41.9 136.1 42.2 134.7 40.3 133.8 37.7 132.8 35.1 132.7 32.8 133.5 32.5ZM129.4 38.8L134 38.3';
  // The bulkhead behind the front wheel and the top of the dashboard under the windscreen.
  const DASH = 'M114.6 73.5L97.6 73.5A30.8 30.8 0 0 0 90.6 57.2C89.1 55.3 91.9 47.2 92.7 43.8Q93.1 42.3 95.6 42C97.5 41.8 99.3 41.6 101 41.5 104.2 41.2 106.3 40 108 38.4 110.2 36.4 112.4 34.3 114.7 32.4 121.1 33 127.8 34.6 129 38.6 129.8 41 128.2 42 125.4 42L119.4 42.2C117.6 42.2 116.4 43.5 116.4 45.5L116.4 71.7C116.4 72.7 115.6 73.5 114.6 73.5Z';
  const WHEELS = [[67, 77], [247, 77]];
  const TYRE = 20.5;
  const RIM = 11.5;
  const ring = x => 'M' + (x - 27.6) + ' 86A29 29 0 1 1 ' + (x + 27.6) + ' 86L' + (x + 22.8) + ' 86A24.5 24.5 0 1 0 ' + (x - 22.8) + ' 86Z';
  const disc = (x, r) => 'M' + (x - r) + ' 77a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0a' + r + ' ' + r + ' 0 1 0-' + 2 * r + ' 0Z';
  // Five spokes from the centre of a wheel to its rim, the first one looks up.
  const spokes = (x, y) => [[0, -11.5], [10.9, -3.6], [6.8, 9.3], [-6.8, 9.3], [-10.9, -3.6]].map(([dx, dy]) => 'M' + x + ' ' + y + 'l' + dx + ' ' + dy).join('');
  const SHAPES = {
    roof: {
      paths: ['M132.9 19C134.4 18 136 17.2 137.5 16.4 145 12.6 156 11.2 170 11 190 10.8 207 12.8 222 17.5 225.8 18.7 229.6 20 233.2 21.3L230.2 29.6C226.7 28.1 223.2 26.8 219.4 25.6 205.2 21.1 189.5 19.3 170.1 19.5 156.6 19.7 147.5 20.8 141.3 24 139.9 24.7 138.5 25.4 136.9 26.2Z'],
      hit: 'M128.8 12.1C130.4 11.1 132.2 10.1 133.9 9.3 142.6 4.8 155.4 3.2 169.9 3 190.4 2.8 208.7 4.9 224.4 9.9 228.3 11.1 232.2 12.5 236 13.8L230.2 29.6C226.7 28.1 223.2 26.8 219.4 25.6 205.2 21.1 189.5 19.3 170.1 19.5 156.6 19.7 147.5 20.8 141.3 24 139.9 24.7 138.5 25.4 136.9 26.2Z'
    },
    // The pointer also takes the corner of the window with the steering wheel.
    dashboard: { paths: [DASH], hit: DASH + 'M112 34L139.5 30.5V43.4L118 43.9Z' },
    doors: {
      paths: ['M119.8 44L175.5 42.3Q177.1 42.3 177.1 43.9L177.1 71.9Q177.1 73.5 175.5 73.5L119.8 73.5Q118.2 73.5 118.2 71.9L118.2 45.6Q118.2 44 119.8 44Z',
        'M180.5 42.2L228.6 40.8Q230.2 40.7 230.2 42.3C230.2 47.3 228.6 51.8 225.2 55.2A30.8 30.8 0 0 0 216.4 73.5L180.5 73.5Q178.9 73.5 178.9 71.9L178.9 43.8Q178.9 42.2 180.5 42.2Z']
    },
    floor: { paths: ['M97.8 75.3L216.2 75.3A30.8 30.8 0 0 0 217.5 86L96.5 86A30.8 30.8 0 0 0 97.8 75.3Z'], hit: 'M96.8 74.5H217.2V97H96.8Z' },
    trunk: { paths: ['M262.4 50.3L263.8 34.3C265.4 35.1 267 35.9 268.5 36.6 271.5 38.1 275 38.6 279 38.9L297 40.3C301.3 40.6 304.3 42.9 304.8 47L305.6 63C305.8 67.2 305.9 71.7 305.4 75.4L277.8 75.4A30.8 30.8 0 0 0 262.4 50.3Z'] },
    arches: { paths: WHEELS.map(([x]) => ring(x)), tyres: true, hit: WHEELS.map(([x]) => disc(x, 29.5)).join('') }
  };

  const NS = 'http://www.w3.org/2000/svg';
  const same = value => String(value ?? '').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('ru');
  const brief = title => title.replace(/\s+комплект$/iu, '').trim() || title;

  // Kits of one level are packages with the same title in different zones. A title met in a single zone is not a level
  // for the whole car. The levels stand as the kits stand in their zones: the one that is never below the first comes first.
  // «missing» — zones of the calculator without such a kit.
  function levels(zones) {
    const found = new Map();
    for (const zone of Array.isArray(zones) ? zones : []) {
      const kits = (zone?.groups || []).flatMap(group => group.choices || []).filter(choice => choice.kind === 'package' && choice.title);
      for (const [place, choice] of kits.entries()) {
        const key = same(choice.title);
        if (!found.has(key)) found.set(key, { key, title: String(choice.title).trim(), place: 0, picks: [] });
        const level = found.get(key);
        if (level.picks.some(pick => pick.zoneId === zone.id)) continue;
        level.place = Math.max(level.place, place);
        level.picks.push({ zoneId: zone.id, zoneTitle: zone.title, groupId: choice.groupId, choiceId: choice.id });
      }
    }
    const list = [...found.values()].filter(level => level.picks.length > 1).sort((a, b) => a.place - b.place);
    const names = list.map(level => brief(level.title));
    return list.map((level, index) => ({
      ...level,
      // The short name stands on the button unless two levels would share it.
      short: names.indexOf(names[index]) === names.lastIndexOf(names[index]) ? names[index] : level.title,
      missing: zones.filter(zone => !level.picks.some(pick => pick.zoneId === zone.id)).map(zone => zone.title)
    }));
  }

  // A level is on when every zone that has such a kit holds it in the estimate.
  const levelOn = (level, selection) => level.picks.every(pick => selection.get(pick.groupId) === pick.choiceId);

  // Puts the kit of the level into every zone that has it; a second press takes these kits out again.
  // A zone without such a kit keeps what the visitor has chosen there.
  function toggleLevel(engine, level) {
    const on = levelOn(level, engine.selection);
    for (const pick of level.picks) {
      if (on) engine.remove(pick.groupId);
      else engine.add(pick.choiceId);
    }
    return !on;
  }

  const noteOf = level => level ? (level.missing.length ? carMap.missing(level.missing) : carMap.everywhere) : carMap.hint;

  // zones — the zones of the calculator (those of its tiles), engine — its estimate, open(zone) — opens a zone as a tile does,
  // apply(message) — redraws the estimate after the block changed it. Returns null when there is nothing to draw.
  function create({ zones, engine, open, apply } = {}) {
    if (!carMap.enabled || !Array.isArray(zones) || !engine) return null;
    const byId = new Map(zones.filter(zone => zone?.id && zone.title).map(zone => [zone.id, zone]));
    // A zone of the owner with an id the drawing does not know is not on it; with fewer than two known zones there is no map.
    if (Object.keys(SHAPES).filter(id => byId.has(id)).length < 2) return null;

    const node = (tag, className, text) => {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (text != null) el.textContent = text;
      return el;
    };
    const draw = (tag, attrs, ...children) => {
      const el = document.createElementNS(NS, tag);
      for (const [name, value] of Object.entries(attrs || {})) el.setAttribute(name, value);
      el.append(...children);
      return el;
    };

    const element = node('div', 'car-map');
    const kits = levels([...byId.values()]);
    const groups = new Map();
    const levelButtons = new Map();
    let lines = [];
    let active = '';
    let pointed = '';
    let focused = '';
    let preview = null;
    let known = new Set();

    const decor = draw('g', { 'aria-hidden': 'true', class: 'cm-decor' },
      draw('path', { class: 'cm-ground', d: 'M4 97.5H316' }),
      draw('path', { class: 'cm-hull', d: HULL }),
      draw('path', { class: 'cm-glass', d: GLASS }));
    const hatch = draw('pattern', { id: 'car-map-hatch', width: '5', height: '5', patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
      draw('path', { class: 'cm-hatch', d: 'M0 0V5' }));
    const car = draw('svg', { class: 'cm-car', viewBox: '0 0 320 104', role: 'group', 'aria-label': carMap.label }, draw('defs', {}, hatch), decor);
    // The zones stand in the order of the tiles, so the keyboard walks them the same way; parts that are no zones lie beneath.
    for (const id of [...Object.keys(SHAPES).filter(id => !byId.has(id)), ...[...byId.keys()].filter(id => SHAPES[id])]) {
      const shape = SHAPES[id];
      const zone = byId.get(id);
      const group = draw('g', { class: 'cm-zone', 'data-zone': id },
        ...shape.paths.map(d => draw('path', { class: 'cm-shape', d })),
        ...(shape.tyres ? WHEELS.map(([cx, cy]) => draw('circle', { class: 'cm-tyre', cx, cy, r: TYRE })) : []),
        draw('path', { class: 'cm-hit', d: shape.hit || shape.paths.join('') }));
      car.append(group);
      // A zone the calculator does not offer stays on the drawing as a part of the car, nothing more.
      if (!zone) {
        group.classList.add('is-off');
        group.setAttribute('aria-hidden', 'true');
        continue;
      }
      group.setAttribute('role', 'button');
      group.setAttribute('tabindex', '0');
      group.addEventListener('click', () => open?.(zone));
      group.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        open?.(zone);
      });
      group.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { pointed = id; paint(); } });
      group.addEventListener('pointerleave', () => { if (pointed === id) { pointed = ''; paint(); } });
      group.addEventListener('focus', () => { focused = id; paint(); });
      group.addEventListener('blur', () => { if (focused === id) { focused = ''; paint(); } });
      groups.set(id, group);
    }
    // Over the zones: the small things of the car, its body line and the rims — a painted zone never hides them.
    car.append(draw('g', { 'aria-hidden': 'true', class: 'cm-decor' },
      draw('path', { class: 'cm-details', d: DETAILS }),
      draw('path', { class: 'cm-outline', d: HULL }),
      ...WHEELS.flatMap(([cx, cy]) => [draw('circle', { class: 'cm-rim', cx, cy, r: RIM }),
        draw('path', { class: 'cm-spokes', d: spokes(cx, cy) }), draw('circle', { class: 'cm-hub', cx, cy, r: '2.8' })])));

    const view = node('div', 'cm-view');
    const caption = node('p', 'cm-caption');
    const zoneName = node('span', 'cm-zone-name');
    const zoneState = node('span', 'cm-zone-state');
    const count = node('span', 'cm-count');
    const zoneLine = node('span', 'cm-zone-line');
    zoneLine.append(zoneName, zoneState);
    caption.append(zoneLine, count);

    const whole = node('div', 'cm-whole');
    const head = node('div', 'cm-whole-head');
    const title = node('span', 'cm-whole-title', carMap.whole);
    title.id = 'car-map-whole';
    title.hidden = !kits.length;
    const clear = node('button', 'cm-clear', carMap.clear);
    clear.type = 'button';
    clear.addEventListener('click', () => {
      engine.clear();
      apply?.(carMap.cleared);
      (levelButtons.values().next().value || groups.values().next().value)?.focus?.({ preventScroll: true });
    });
    head.append(title, clear);
    whole.append(head);
    const note = node('div', 'cm-note');
    const noteText = node('p', 'cm-note-text');
    noteText.id = 'car-map-note';
    if (kits.length) {
      const row = node('div', 'cm-levels');
      row.setAttribute('role', 'group');
      row.setAttribute('aria-labelledby', title.id);
      for (const level of kits) {
        const btn = node('button', 'cm-level', level.short);
        btn.type = 'button';
        btn.setAttribute('aria-label', carMap.whole + ': ' + level.title);
        btn.setAttribute('aria-describedby', noteText.id);
        btn.addEventListener('click', () => {
          const added = toggleLevel(engine, level);
          const where = level.picks.map(pick => pick.zoneTitle).join(', ');
          const rest = added && level.missing.length ? '. ' + carMap.missingAloud(level.missing) : '';
          apply?.((added ? carMap.added : carMap.removed) + ': ' + level.title + ' — ' + where + rest);
        });
        const show = () => { preview = level; paint(); };
        const hide = () => { if (preview === level) { preview = null; paint(); } };
        btn.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') show(); });
        btn.addEventListener('pointerleave', hide);
        btn.addEventListener('focus', () => { if (btn.matches?.(':focus-visible')) show(); });
        btn.addEventListener('blur', hide);
        levelButtons.set(level, btn);
        row.append(btn);
      }
      // Every possible note lies unseen in the cell of the visible one: the tallest keeps the height, nothing below moves.
      note.append(noteText, ...[null, ...kits].map(level => {
        const sizer = node('span', 'cm-note-sizer', noteOf(level));
        sizer.setAttribute('aria-hidden', 'true');
        return sizer;
      }));
      whole.append(row, note);
    }
    view.append(car, caption);
    element.append(view, whole);

    function paint() {
      const chosen = new Set(lines.map(line => line.zoneId).filter(id => byId.has(id)));
      const shown = pointed || focused || active;
      const on = kits.find(level => levelOn(level, engine.selection)) || null;
      const level = preview || on;
      for (const [id, group] of groups) {
        const zone = byId.get(id);
        group.classList.toggle('is-in', chosen.has(id));
        // A zone that has just come into the estimate fills with a short pulse.
        group.classList.toggle('is-new', chosen.has(id) && !known.has(id));
        group.classList.toggle('is-shown', id === shown);
        group.classList.toggle('is-pick', Boolean(preview) && preview.picks.some(pick => pick.zoneId === id));
        group.classList.toggle('is-miss', Boolean(preview) && !preview.picks.some(pick => pick.zoneId === id));
        group.setAttribute('aria-pressed', String(id === active));
        group.setAttribute('aria-label', zone.title + (chosen.has(id) ? ', ' + carMap.inEstimate : ''));
      }
      known = chosen;
      const zone = byId.get(shown);
      zoneName.textContent = zone?.title || '';
      zoneState.textContent = zone && chosen.has(zone.id) ? ' · ' + carMap.inEstimate : '';
      count.textContent = carMap.count(chosen.size, byId.size);
      for (const [item, btn] of levelButtons) btn.setAttribute('aria-pressed', String(item === on));
      noteText.textContent = noteOf(level);
      note.dataset.level = String(Boolean(level));
      note.dataset.on = String(Boolean(on));
      // The button keeps its place while hidden, so the heading beside it never moves.
      clear.style.visibility = lines.length ? '' : 'hidden';
    }

    // In a tall estimate the list of works scrolls inside the receipt: a shade marks the edge that hides more of it.
    let list = null;
    const shade = () => {
      if (!list) return;
      list.classList.toggle('is-cut-top', list.scrollTop > 1);
      list.classList.toggle('is-cut-bottom', list.scrollTop + list.clientHeight < list.scrollHeight - 1);
    };

    return {
      element,
      // lines — the lines of the estimate, activeId — the zone whose kits are open now.
      sync(nextLines, activeId) {
        const before = lines.length;
        lines = Array.isArray(nextLines) ? nextLines : [];
        active = activeId || '';
        const receipt = element.parentElement;
        receipt?.classList.add('has-car-map');
        paint();
        if (!list && (list = receipt?.querySelector?.('.est-items') || null)) {
          list.addEventListener('scroll', shade, { passive: true });
          window.addEventListener('resize', shade, { passive: true });
        }
        // A new line comes into sight.
        if (list && lines.length > before && list.scrollHeight > list.clientHeight) list.scrollTop = list.scrollHeight;
        shade();
      }
    };
  }

  window.StudioCarMap = { config: carMap, zones: Object.keys(SHAPES), levels, levelOn, toggleLevel, create };
})();
