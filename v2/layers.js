(() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const kinds = {
    base: 'Кузов', damper: 'Вибродемпфер', insulator: 'Звукоизолятор', absorber: 'Шумопоглотитель',
    membrane: 'Акустическая мембрана', mastic: 'Мастика', antisqueak: 'Антискрип', other: 'Материал', cover: 'Обшивка'
  };
  const originalGroups = { doors: 'Двери', arches: 'Арки и шины', floor: 'Пол', trunk: 'Багажник', roof: 'Потолок', dashboard: 'Торпедо' };
  const kindHints = {
    damper: 'гасит вибрации металла', insulator: 'отражает шум', absorber: 'поглощает шум',
    membrane: 'не пропускает шум', mastic: 'защищает от воды и коррозии'
  };

  // Panels of each zone in a 400×300 box. view — the 3D angle of the stack, badge — where numbers sit.
  const shapes = {
    door: {
      view: 'rotateX(6deg) rotateY(-32deg)', badge: [9, 10], fan: 'side',
      outline: 'M34 112L34 64Q34 42 58 40L300 30Q338 28 352 50L374 148Q380 188 364 220L334 268Q322 284 298 284L72 284Q38 284 34 252Z',
      holes: 'M120 98Q120 80 140 80L262 76Q284 76 288 98L294 160Q296 186 272 188L146 190Q122 190 120 166ZM86 222a34 34 0 1 0 68 0a34 34 0 1 0-68 0ZM312 108a15 15 0 1 0 30 0a15 15 0 1 0-30 0ZM226 244a11 11 0 1 0 22 0a11 11 0 1 0-22 0Z',
      ribs: 'M50 70Q60 58 80 57L300 47M60 260L300 262M352 72L366 150',
      seams: 'M130 34L132 284M226 31L229 284M300 30L304 284',
      cover: 'door'
    },
    floor: {
      view: 'rotateX(57deg) rotateZ(-31deg)', badge: [97, 82], fan: 'up',
      outline: 'M46 72Q46 44 74 44L300 40Q334 40 340 70L344 104Q368 108 368 134L368 166Q368 192 344 196L340 232Q334 262 300 260L74 256Q46 256 46 228Z',
      holes: 'M98 92a6 6 0 1 0 12 0a6 6 0 1 0-12 0ZM98 208a6 6 0 1 0 12 0a6 6 0 1 0-12 0ZM290 92a6 6 0 1 0 12 0a6 6 0 1 0-12 0Z',
      ribs: 'M46 136L368 136M46 164L368 164M168 46L168 254M248 44L248 258',
      seams: 'M128 44L128 256M208 42L208 258M288 40L290 260M46 150L368 150',
      cover: 'carpet'
    },
    roof: {
      view: 'rotateX(57deg) rotateZ(-31deg)', badge: [97, 84], fan: 'up',
      outline: 'M70 60Q70 40 92 40L310 40Q334 40 336 62L344 238Q344 262 320 262L84 262Q60 262 62 238Z',
      holes: '',
      ribs: 'M66 102L340 102M64 152L342 152M63 204L343 204',
      seams: 'M160 40L160 262M250 40L252 262',
      cover: 'headliner'
    },
    trunk: {
      view: 'rotateX(57deg) rotateZ(-31deg)', badge: [97, 84], fan: 'up',
      outline: 'M58 58L342 58L342 108Q304 110 304 150Q304 190 342 192L342 252L58 252L58 192Q96 190 96 150Q96 110 58 108Z',
      holes: '',
      ribs: 'M58 230L342 230M58 80L342 80',
      seams: 'M156 58L156 252M244 58L244 252',
      well: [200, 150, 62],
      cover: 'trunk'
    },
    arch: {
      view: 'rotateX(8deg) rotateY(-30deg)', badge: [16, 72], fan: 'side', spread: 60, box: [0, 58],
      outline: 'M44 268A156 156 0 0 1 356 268L312 268A112 112 0 0 0 88 268Z',
      holes: '',
      ribs: 'M66 268A134 134 0 0 1 334 268',
      seams: 'M200 112L200 156M108 158L140 186M292 158L260 186',
      cover: 'liner'
    },
    dashboard: {
      view: 'rotateX(12deg) rotateY(-30deg)', badge: [8, 30], fan: 'side',
      outline: 'M30 96Q200 46 370 96L370 230Q362 262 330 262L252 262L234 224L166 224L148 262L70 262Q38 262 30 230Z',
      holes: 'M98 168a18 18 0 1 0 36 0a18 18 0 1 0-36 0ZM270 196a9 9 0 1 0 18 0a9 9 0 1 0-18 0ZM312 196a9 9 0 1 0 18 0a9 9 0 1 0-18 0Z',
      ribs: 'M40 128Q200 86 360 128M40 200L360 200',
      seams: 'M140 70L140 262M260 70L262 262',
      cover: 'panel'
    }
  };

  const covers = {
    door: { color: '#2b2930', grain: '#ffffff', grainOpacity: .05 },
    carpet: { color: '#2e2d34', grain: '#ffffff', grainOpacity: .09 },
    headliner: { color: '#c7c4cc', grain: '#000000', grainOpacity: .08 },
    trunk: { color: '#2a2930', grain: '#ffffff', grainOpacity: .08 },
    liner: { color: '#1d1c21', grain: '#ffffff', grainOpacity: .04 },
    panel: { color: '#25242a', grain: '#ffffff', grainOpacity: .05 }
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function svg(tag, attrs = {}, parent) {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    parent?.append(node);
    return node;
  }
  function seeded(seed) {
    let state = seed >>> 0 || 1;
    return () => (state = (state * 1664525 + 1013904223) >>> 0) / 4294967296;
  }
  const colorOk = value => /^#[0-9a-f]{6}$/i.test(value || '');
  const safeId = value => String(value).replace(/[^\w-]/g, '_');

  // Textures are SVG patterns. They are built once per material and shared by all layers.
  function buildDefs(defs, materials) {
    svg('linearGradient', { id: 'ly-metal', x1: 0, y1: 0, x2: 1, y2: 1 }, defs).append(
      svg('stop', { offset: 0, 'stop-color': '#7b8090' }), svg('stop', { offset: .45, 'stop-color': '#cdd1db' }),
      svg('stop', { offset: .7, 'stop-color': '#9196a3' }), svg('stop', { offset: 1, 'stop-color': '#6c7080' }));
    const brushed = svg('pattern', { id: 'ly-brushed', width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-12)' }, defs);
    svg('path', { d: 'M0 2H8M0 6H8', stroke: '#ffffff', 'stroke-opacity': .13, 'stroke-width': .7 }, brushed);
    svg('linearGradient', { id: 'ly-sheen', x1: 0, y1: 0, x2: 1, y2: 0.6 }, defs).append(
      svg('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': 0 }), svg('stop', { offset: .48, 'stop-color': '#ffffff', 'stop-opacity': .22 }),
      svg('stop', { offset: .56, 'stop-color': '#ffffff', 'stop-opacity': 0 }), svg('stop', { offset: 1, 'stop-color': '#ffffff', 'stop-opacity': .08 }));
    for (const [name, cover] of Object.entries(covers)) speckle(defs, 'ly-cover-' + name, cover.color, cover.grain, cover.grainOpacity, name.length * 97);
    const perforation = svg('pattern', { id: 'ly-perforation', width: 6, height: 6, patternUnits: 'userSpaceOnUse' }, defs);
    svg('circle', { cx: 3, cy: 3, r: 1.1, fill: '#0c0b0e' }, perforation);
    for (const material of materials) materialPattern(defs, material);
  }

  function speckle(defs, id, color, grain, opacity, seed) {
    const pattern = svg('pattern', { id, width: 36, height: 36, patternUnits: 'userSpaceOnUse' }, defs);
    svg('rect', { width: 36, height: 36, fill: color }, pattern);
    const random = seeded(seed);
    for (let i = 0; i < 46; i++) {
      svg('circle', { cx: (random() * 36).toFixed(1), cy: (random() * 36).toFixed(1), r: (.35 + random() * .7).toFixed(2),
        fill: grain, 'fill-opacity': (opacity * (.4 + random())).toFixed(3) }, pattern);
    }
  }

  function materialPattern(defs, material) {
    const id = 'ly-mat-' + safeId(material.id);
    const color = colorOk(material.color) ? material.color : '#77757f';
    const print = colorOk(material.print) ? material.print : '#2a2930';
    const texture = material.texture || 'print';
    let pattern;
    if (texture === 'foil') {
      pattern = svg('pattern', { id, width: 14, height: 14, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
      svg('rect', { width: 14, height: 14, fill: color }, pattern);
      svg('path', { d: 'M0 7H14M7 0V14', stroke: '#ffffff', 'stroke-opacity': .32, 'stroke-width': 1 }, pattern);
      svg('path', { d: 'M0 8H14M8 0V14', stroke: '#000000', 'stroke-opacity': .16, 'stroke-width': .8 }, pattern);
    } else if (texture === 'wave') {
      pattern = svg('pattern', { id, width: 32, height: 14, patternUnits: 'userSpaceOnUse' }, defs);
      svg('rect', { width: 32, height: 14, fill: color }, pattern);
      svg('path', { d: 'M0 9Q8 1 16 9T32 9', fill: 'none', stroke: '#ffffff', 'stroke-opacity': .22, 'stroke-width': 2.4 }, pattern);
      svg('path', { d: 'M0 11Q8 3 16 11T32 11', fill: 'none', stroke: '#000000', 'stroke-opacity': .28, 'stroke-width': 2 }, pattern);
    } else if (texture === 'eggcrate') {
      const bump = svg('radialGradient', { id: id + '-bump', cx: .42, cy: .38, r: .62 }, defs);
      bump.append(svg('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': .32 }), svg('stop', { offset: .55, 'stop-color': '#ffffff', 'stop-opacity': .05 }),
        svg('stop', { offset: 1, 'stop-color': '#000000', 'stop-opacity': .32 }));
      pattern = svg('pattern', { id, width: 18, height: 18, patternUnits: 'userSpaceOnUse' }, defs);
      svg('rect', { width: 18, height: 18, fill: color }, pattern);
      svg('circle', { cx: 9, cy: 9, r: 7.2, fill: 'url(#' + id + '-bump)' }, pattern);
      for (const [x, y] of [[0, 0], [18, 0], [0, 18], [18, 18]]) svg('circle', { cx: x, cy: y, r: 3.4, fill: '#000000', 'fill-opacity': .25 }, pattern);
    } else if (texture === 'membrane') {
      pattern = svg('pattern', { id, width: 7, height: 7, patternUnits: 'userSpaceOnUse' }, defs);
      svg('rect', { width: 7, height: 7, fill: color }, pattern);
      svg('circle', { cx: 3.5, cy: 3.5, r: .9, fill: print, 'fill-opacity': .45 }, pattern);
    } else if (texture === 'gloss') {
      pattern = svg('pattern', { id, width: 40, height: 40, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-30)' }, defs);
      svg('rect', { width: 40, height: 40, fill: color }, pattern);
      svg('path', { d: 'M0 12H40M0 31H40', stroke: '#ffffff', 'stroke-opacity': .09, 'stroke-width': 5 }, pattern);
    } else if (texture === 'felt') {
      speckle(defs, id + '-base', color, '#ffffff', .16, material.id.length * 131);
      pattern = svg('pattern', { id, width: 36, height: 36, patternUnits: 'userSpaceOnUse' }, defs);
      svg('rect', { width: 36, height: 36, fill: 'url(#' + id + '-base)' }, pattern);
      const random = seeded(material.id.length * 17);
      for (let i = 0; i < 14; i++) {
        svg('circle', { cx: (random() * 36).toFixed(1), cy: (random() * 36).toFixed(1), r: .8, fill: '#000000', 'fill-opacity': .22 }, pattern);
      }
    } else {
      pattern = svg('pattern', { id, width: 10, height: 10, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(35)' }, defs);
      svg('rect', { width: 10, height: 10, fill: color }, pattern);
      svg('path', { d: 'M0 5H10', stroke: '#ffffff', 'stroke-opacity': .06, 'stroke-width': 1 }, pattern);
    }
    // The printed name of the sheet, as on the real material.
    const label = String(material.label || material.name || '').toUpperCase().slice(0, 14);
    const printOpacity = { print: .95, foil: .5, felt: .55, membrane: .3, wave: 0, eggcrate: 0, gloss: 0 }[texture] ?? .6;
    if (label && printOpacity) {
      const text = svg('pattern', { id: id + '-print', width: 168, height: 76, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-16)' }, defs);
      for (const [x, y] of [[6, 26], [90, 64]]) {
        const node = svg('text', { x, y, fill: print, 'fill-opacity': printOpacity, 'font-size': 15, 'font-weight': 800,
          'font-family': 'Roboto, Arial, sans-serif', 'letter-spacing': .6 }, text);
        node.textContent = label;
      }
      if (texture === 'print') {
        for (const [x, y] of [[70, 20], [154, 58]]) svg('circle', { cx: x, cy: y, r: 7, fill: 'none', stroke: print, 'stroke-opacity': .8, 'stroke-width': 1.6 }, text);
      }
    }
  }

  function layerArt(shape, layer, index, total) {
    const root = svg('svg', { viewBox: '0 0 400 300', class: 'ly-art', 'aria-hidden': 'true', focusable: 'false' });
    const inset = 1 - index * 0.012;
    const group = svg('g', { transform: 'translate(200 150) scale(' + inset.toFixed(3) + ') translate(-200 -150)' }, root);
    const outline = shape.outline;
    // Edge of the sheet gives the layer some thickness when the stack is opened.
    svg('path', { d: outline, transform: 'translate(2.5 3.5)', fill: '#000000', 'fill-opacity': .55 }, group);
    if (layer.type === 'base') {
      const metal = shape.holes ? outline + shape.holes : outline;
      svg('path', { d: metal, 'fill-rule': 'evenodd', fill: 'url(#ly-metal)' }, group);
      svg('path', { d: metal, 'fill-rule': 'evenodd', fill: 'url(#ly-brushed)' }, group);
      if (shape.well) {
        const [cx, cy, r] = shape.well;
        svg('circle', { cx, cy, r, fill: '#000000', 'fill-opacity': .18, stroke: '#ffffff', 'stroke-opacity': .35, 'stroke-width': 2 }, group);
      }
      if (shape.ribs) svg('path', { d: shape.ribs, fill: 'none', stroke: '#ffffff', 'stroke-opacity': .45, 'stroke-width': 3, 'stroke-linecap': 'round' }, group);
      if (shape.ribs) svg('path', { d: shape.ribs, transform: 'translate(0 3)', fill: 'none', stroke: '#000000', 'stroke-opacity': .18, 'stroke-width': 2, 'stroke-linecap': 'round' }, group);
      svg('path', { d: metal, 'fill-rule': 'evenodd', fill: 'none', stroke: '#e8eaf0', 'stroke-opacity': .7, 'stroke-width': 1.5 }, group);
    } else if (layer.type === 'cover') {
      coverArt(group, shape);
    } else {
      const id = 'ly-mat-' + safeId(layer.material.id);
      svg('path', { d: outline, fill: 'url(#' + id + ')' }, group);
      if (document.getElementById(id + '-print')) svg('path', { d: outline, fill: 'url(#' + id + '-print)' }, group);
      if (layer.alt) {
        // Two materials of one layer: the second covers its own part of the zone.
        const clip = svg('clipPath', { id: 'ly-alt-' + index + '-' + total + '-' + safeId(layer.alt.id) }, group);
        svg('rect', { x: 200, y: 0, width: 220, height: 300 }, clip);
        const alt = svg('g', { 'clip-path': 'url(#' + clip.id + ')' }, group);
        const altId = 'ly-mat-' + safeId(layer.alt.id);
        svg('path', { d: outline, fill: 'url(#' + altId + ')' }, alt);
        if (document.getElementById(altId + '-print')) svg('path', { d: outline, fill: 'url(#' + altId + '-print)' }, alt);
        const seam = svg('clipPath', { id: clip.id + '-seam' }, group);
        svg('path', { d: outline }, seam);
        svg('path', { d: 'M200 0V300', stroke: '#000000', 'stroke-opacity': .45, 'stroke-width': 2, 'stroke-dasharray': '7 5', 'clip-path': 'url(#' + seam.id + ')' }, group);
      }
      if (['damper', 'insulator', 'membrane'].includes(layer.material.kind) && shape.seams) {
        svg('path', { d: shape.seams, fill: 'none', stroke: '#000000', 'stroke-opacity': .32, 'stroke-width': 1.4 }, group);
        svg('path', { d: shape.seams, transform: 'translate(1.4 0)', fill: 'none', stroke: '#ffffff', 'stroke-opacity': .14, 'stroke-width': 1 }, group);
      }
      if (layer.material.kind === 'damper' || layer.material.texture === 'gloss') svg('path', { d: outline, fill: 'url(#ly-sheen)' }, group);
      svg('path', { d: outline, fill: 'none', stroke: '#ffffff', 'stroke-opacity': .25, 'stroke-width': 1.2 }, group);
    }
    return root;
  }

  function coverArt(group, shape) {
    const outline = shape.outline;
    svg('path', { d: outline, fill: 'url(#ly-cover-' + shape.cover + ')' }, group);
    const line = (d, attrs = {}) => svg('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-opacity': .16, 'stroke-width': 2, ...attrs }, group);
    if (shape.cover === 'door') {
      svg('path', { d: 'M36 66Q36 46 58 44L300 34Q336 32 348 54L354 78L40 92Z', fill: '#1b1a1f' }, group);
      svg('path', { d: 'M168 146Q168 136 180 136L330 128Q346 128 348 142L350 152Q350 162 336 163L182 170Q168 171 168 160Z', fill: '#39373f' }, group);
      line('M180 158L336 150', { 'stroke-dasharray': '4 4', 'stroke-opacity': .28, 'stroke-width': 1 });
      svg('rect', { x: 104, y: 100, width: 52, height: 16, rx: 8, fill: '#a7a9b4' }, group);
      svg('circle', { cx: 120, cy: 222, r: 36, fill: '#1a191e', stroke: '#4a4852', 'stroke-width': 3 }, group);
      svg('circle', { cx: 120, cy: 222, r: 31, fill: 'url(#ly-perforation)' }, group);
      svg('path', { d: 'M178 238L320 232Q330 232 328 244L322 262Q320 270 310 270L188 272Q178 272 178 262Z', fill: '#1b1a1f' }, group);
    } else if (shape.cover === 'carpet') {
      svg('path', { d: 'M46 136L368 136L368 164L46 164Z', fill: '#ffffff', 'fill-opacity': .06 }, group);
      for (const [x, y] of [[120, 96], [210, 96], [120, 204], [210, 204], [286, 96], [286, 204]]) svg('rect', { x, y, width: 34, height: 6, rx: 3, fill: '#111015' }, group);
    } else if (shape.cover === 'headliner') {
      svg('rect', { x: 170, y: 58, width: 64, height: 34, rx: 6, fill: '#ffffff', 'fill-opacity': .55, stroke: '#000000', 'stroke-opacity': .12 }, group);
      svg('rect', { x: 92, y: 52, width: 62, height: 26, rx: 10, fill: '#000000', 'fill-opacity': .08 }, group);
      svg('rect', { x: 250, y: 52, width: 62, height: 26, rx: 10, fill: '#000000', 'fill-opacity': .08 }, group);
      line('M80 236L326 236', { stroke: '#000000', 'stroke-opacity': .1 });
    } else if (shape.cover === 'trunk') {
      svg('rect', { x: 132, y: 96, width: 136, height: 108, rx: 12, fill: 'none', stroke: '#000000', 'stroke-opacity': .45, 'stroke-width': 2 }, group);
      for (const [x, y] of [[74, 72], [326, 72], [74, 238], [326, 238]]) svg('circle', { cx: x, cy: y, r: 5, fill: '#9c9ea8' }, group);
    } else if (shape.cover === 'liner') {
      for (let r = 120; r <= 150; r += 7) line('M' + (200 - r) + ' 268A' + r + ' ' + r + ' 0 0 1 ' + (200 + r) + ' 268', { 'stroke-opacity': .12, 'stroke-width': 2.4 });
    } else if (shape.cover === 'panel') {
      svg('path', { d: 'M74 130Q74 116 88 116L156 114Q170 114 170 128L170 168Q170 180 156 180L88 182Q74 182 74 168Z', fill: '#121116' }, group);
      svg('circle', { cx: 104, cy: 148, r: 18, fill: 'none', stroke: '#7e7b88', 'stroke-width': 2 }, group);
      svg('circle', { cx: 142, cy: 148, r: 18, fill: 'none', stroke: '#7e7b88', 'stroke-width': 2 }, group);
      svg('rect', { x: 196, y: 108, width: 104, height: 62, rx: 6, fill: '#0f0e13', stroke: '#3a3842', 'stroke-width': 2 }, group);
      svg('rect', { x: 206, y: 118, width: 84, height: 42, rx: 3, fill: 'var(--accent, #bcb9d9)', 'fill-opacity': .18 }, group);
      for (const x of [44, 318]) svg('rect', { x, y: 112, width: 38, height: 22, rx: 6, fill: '#121116' }, group);
      line('M190 200L346 200L346 236L196 236Z', { 'stroke-opacity': .1 });
    }
    svg('path', { d: outline, fill: 'none', stroke: '#ffffff', 'stroke-opacity': .18, 'stroke-width': 1.4 }, group);
  }

  function shortTitle(rate) {
    const title = String(rate.title || '').trim();
    if (/металл.*арок/i.test(title)) return 'Металл арок';
    if (/подкрыл/i.test(title)) return 'Подкрылки';
    return title.replace(/\s+комплект$/i, '').replace(/^шумоизоляция\s+/i, '') || title;
  }

  function weightOf(rate) {
    const index = (rate.columns || []).findIndex(column => /^(?:общий\s+)?вес/i.test(column) || /вес материалов/i.test(column));
    const value = index >= 0 ? rate.rows?.[0]?.[index] : '';
    if (value) return value;
    const note = (rate.notes || []).join(' ').match(/вес(?: материалов)?\s*[—-]\s*([\d,.–-]+\s*кг)/i);
    return note ? note[1] : '';
  }

  function mount() {
    const host = document.querySelector('#layers [data-layers]');
    if (!host) return;
    const page = window.StudioPage?.current;
    const settings = page?.sections?.find(section => section.id === 'layers');
    if (settings?.enabled === false) return;
    const materials = (Array.isArray(window.STUDIO_MATERIALS) ? window.STUDIO_MATERIALS : [])
      .filter(item => item && typeof item.id === 'string' && item.name);
    const byId = new Map(materials.map(item => [item.id, item]));
    const zones = (window.STUDIO_ZONES || []).map(zone => {
      const group = zone.group || originalGroups[zone.id] || zone.title;
      const rates = (window.STUDIO_PRICES || []).filter(rate => (rate.group === group || rate.group === zone.title) &&
        Array.isArray(rate.layers) && rate.layers.some(layer => byId.has(layer?.material)));
      return { zone, rates, shape: shapes[zone.structure?.shape] || shapes.door };
    }).filter(item => item.rates.length);
    const section = host.closest('section');
    if (!zones.length) { section.hidden = true; return; }

    const heading = el('header', 'ly-heading');
    const kicker = el('p', 'ly-kicker', settings?.kicker || 'Материалы студии');
    const title = el('h2', 'ly-title', settings?.title || 'Что внутри');
    title.id = 'ly-title';
    section.setAttribute('aria-labelledby', title.id);
    heading.append(kicker, title);
    if (settings?.description) heading.append(el('p', 'ly-intro', settings.description));

    const zoneTabs = el('div', 'ly-zones');
    zoneTabs.setAttribute('role', 'group');
    zoneTabs.setAttribute('aria-label', 'Зона автомобиля');
    const body = el('div', 'ly-body');
    const stageBox = el('div', 'ly-stage-box');
    const packages = el('div', 'ly-packages');
    packages.setAttribute('role', 'group');
    packages.setAttribute('aria-label', 'Комплект');
    const stage = el('div', 'ly-stage');
    stage.setAttribute('aria-hidden', 'true');
    const scene = el('div', 'ly-scene');
    stage.append(scene);
    const defsHost = svg('svg', { class: 'ly-defs', width: 0, height: 0, 'aria-hidden': 'true', focusable: 'false' });
    buildDefs(svg('defs', {}, defsHost), materials);
    const controls = el('div', 'ly-controls');
    const toggle = el('button', 'ly-toggle');
    toggle.type = 'button';
    const hint = el('span', 'ly-hint', 'Нажмите на слой в списке или на схеме');
    controls.append(toggle, hint);
    stageBox.append(packages, stage, controls);

    const side = el('div', 'ly-side');
    const listTitle = el('p', 'ly-list-title');
    const list = el('ol', 'ly-list');
    const summary = el('div', 'ly-summary');
    side.append(listTitle, list, summary);
    body.append(stageBox, side);

    const galleryBox = el('section', 'ly-gallery');
    const galleryHead = el('div', 'ly-gallery-head');
    const galleryTitle = el('h3', 'ly-gallery-title');
    galleryTitle.id = 'ly-gallery-title';
    galleryBox.setAttribute('aria-labelledby', galleryTitle.id);
    const galleryNote = el('p', 'ly-gallery-note', 'Фото из мастерской студии');
    galleryHead.append(galleryTitle, galleryNote);
    const strip = el('div', 'ly-strip');
    galleryBox.append(galleryHead, strip);
    const live = el('p', 'ly-sr');
    live.setAttribute('role', 'status');
    host.replaceChildren(heading, zoneTabs, body, galleryBox, live, defsHost);

    const dialog = lightbox();
    host.append(dialog.element);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const compact = matchMedia('(max-width: 34rem)');
    let current = zones[0];
    let packageZone;
    let rate = current.rates[0];
    let layers = [];
    let active = -1;
    let open = true;
    let seen = false;
    let timers = [];
    let vehicle = window.StudioCarPicker?.stored?.() || {};
    const engine = window.StudioEstimate?.create(window.STUDIO_PRICES || [], window.STUDIO_ZONES || [], window.STUDIO_VEHICLES);

    const zoneButtons = zones.map(item => {
      const button = el('button', 'ly-zone', item.zone.title);
      button.type = 'button';
      button.addEventListener('click', () => { if (current !== item) { current = item; rate = item.rates[0]; render(true); } });
      zoneTabs.append(button);
      return button;
    });

    function stackOf(selected) {
      const structure = current.zone.structure || {};
      const stack = [{ type: 'base', title: structure.base || 'Металл кузова', kind: 'base', text: structure.baseText || 'Металл кузова — основа, на которую укладывают слои.' }];
      for (const item of selected.layers || []) {
        const material = byId.get(item?.material);
        if (!material) continue;
        const alt = byId.get(item.alt);
        stack.push({ type: 'material', material, alt, kind: material.kind, note: item.note || '',
          title: alt ? shortName(material) + ' + ' + shortName(alt) : shortName(material) });
      }
      stack.push({ type: 'cover', title: structure.cover || 'Обшивка', kind: 'cover', text: structure.coverText || 'Штатная обшивка закрывает материалы.' });
      return stack;
    }
    function shortName(material) { return String(material.name).replace(/^comfortmat\s+/i, ''); }

    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function buildScene(animate) {
      clearTimers();
      // On narrow screens every stack opens upwards: a sideways fan would make the sheets too small.
      const fan = compact.matches ? 'up' : current.shape.fan;
      const view = fan === current.shape.fan ? current.shape.view : 'rotateX(55deg) rotateZ(-28deg)';
      const badge = fan === current.shape.fan ? current.shape.badge : [97, 84];
      scene.style.setProperty('--ly-view', view);
      scene.style.setProperty('--ly-billboard', invert(view));
      scene.dataset.shape = current.zone.structure?.shape || 'door';
      scene.dataset.fan = fan;
      // The fan always fits the stage: fewer sheets spread wider, and a sideways fan is centred.
      const steps = Math.max(1, layers.length - 1);
      scene.style.left = scene.style.right = '';
      if (fan === 'up') {
        scene.style.setProperty('--dx', '0%');
        scene.style.setProperty('--dz', (compact.matches ? Math.min(46, 180 / steps) : Math.min(60, 270 / steps)).toFixed(1) + 'px');
      } else {
        const dx = Math.min(24, (current.shape.spread || 104) / steps);
        const [, width] = current.shape.box || [3, 46];
        const extent = width * (1 + steps * dx / 100);
        const left = Math.max(0, Math.min(100 - extent, 49 - extent / 2));
        scene.style.setProperty('--dx', dx.toFixed(1) + '%');
        scene.style.setProperty('--dz', '22px');
        scene.style.left = left.toFixed(1) + '%';
        scene.style.right = (100 - left - width).toFixed(1) + '%';
      }
      scene.replaceChildren(...layers.map((layer, index) => {
        const node = el('div', 'ly-layer');
        node.style.setProperty('--i', index);
        node.style.setProperty('--n', layers.length);
        node.dataset.type = layer.type;
        node.append(layerArt(current.shape, layer, index, layers.length));
        const number = el('span', 'ly-badge', String(index + 1));
        number.style.left = badge[0] + '%';
        number.style.top = badge[1] + '%';
        node.append(number);
        node.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') focusLayer(index, false); });
        node.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') focusLayer(-1, false); });
        node.addEventListener('click', () => focusLayer(active === index ? -1 : index, true));
        return node;
      }));
      const still = reduced.matches || !animate;
      stage.dataset.phase = still ? (open ? 'open' : 'closed') : 'fly';
      if (still) return;
      // Sheets are laid on the metal one after another, then the stack opens up.
      void scene.offsetWidth;
      timers.push(setTimeout(() => { stage.dataset.phase = 'closed'; }, 40));
      timers.push(setTimeout(() => { stage.dataset.phase = open ? 'open' : 'closed'; }, 520 + layers.length * 150));
    }

    function invert(view) {
      return view.split(/\s+(?=rotate)/).reverse().map(step => step.replace(/(-?[\d.]+)deg/, (_, n) => (-Number(n)) + 'deg')).join(' ');
    }

    function renderList() {
      listTitle.textContent = 'Слои — от металла к обшивке';
      // The same sheet laid twice (two layers of Bronze 2, for example) is named as the second layer.
      const repeats = new Map();
      list.replaceChildren(...layers.map((layer, index) => {
        const key = layer.type === 'material' ? layer.material?.id || layer.title : '';
        const repeat = key ? (repeats.get(key) || 0) + 1 : 0;
        if (key) repeats.set(key, repeat);
        const item = el('li', 'ly-item');
        const button = el('button', 'ly-item-button');
        button.type = 'button';
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', 'ly-panel-' + index);
        const number = el('span', 'ly-num', String(index + 1));
        number.setAttribute('aria-hidden', 'true');
        const name = el('span', 'ly-item-name', layer.title);
        if (repeat > 1) name.append(el('span', 'ly-item-repeat', ' · ' + (['', '', 'второй', 'третий', 'четвёртый'][repeat] || 'ещё один') + ' слой'));
        const tag = el('span', 'ly-tag', kinds[layer.kind] || kinds.other);
        tag.dataset.kind = layer.kind;
        button.append(number, name, tag);
        const panel = el('div', 'ly-panel');
        panel.id = 'ly-panel-' + index;
        panel.hidden = true;
        if (layer.type === 'material') {
          const parts = [layer.material, layer.alt].filter(Boolean);
          for (const part of parts) {
            const line = el('p');
            if (parts.length > 1) line.append(el('strong', '', shortName(part) + '. '));
            line.append(part.text || '');
            panel.append(line);
          }
          const meta = [kindHints[layer.kind], ...parts.map(part => part.note && (parts.length > 1 ? shortName(part) + ' — ' : '') + part.note)].filter(Boolean);
          if (layer.note) panel.append(el('p', 'ly-note', layer.note));
          if (meta.length) panel.append(el('p', 'ly-meta', meta.join(' · ')));
        } else panel.append(el('p', '', layer.text));
        button.addEventListener('click', () => focusLayer(active === index ? -1 : index, true));
        button.addEventListener('mouseenter', () => scene.dataset.peek = String(index));
        button.addEventListener('mouseleave', () => delete scene.dataset.peek);
        item.append(button, panel);
        return item;
      }));
    }

    function focusLayer(index, fromClick) {
      active = index;
      [...scene.children].forEach((node, i) => node.classList.toggle('is-active', i === index));
      scene.classList.toggle('has-active', index >= 0);
      [...list.children].forEach((item, i) => {
        const selected = i === index;
        item.classList.toggle('is-active', selected);
        item.querySelector('button').setAttribute('aria-expanded', String(selected));
        item.querySelector('.ly-panel').hidden = !selected;
      });
      if (fromClick && index >= 0 && !open) setOpen(true);
    }

    function setOpen(value) {
      open = value;
      stage.dataset.phase = open ? 'open' : 'closed';
      toggle.textContent = open ? 'Собрать слои' : 'Разобрать слои';
      toggle.setAttribute('aria-pressed', String(!open));
    }

    function renderSummary() {
      summary.replaceChildren();
      const facts = el('dl', 'ly-facts');
      const fact = (label, value) => {
        if (!value) return;
        const row = el('div');
        row.append(el('dt', '', label), el('dd', '', value));
        facts.append(row);
      };
      const materialsCount = layers.filter(layer => layer.type === 'material').length;
      fact('Слоёв материала', String(materialsCount));
      fact('Вес материалов', weightOf(rate));
      let price = '';
      let choice;
      if (engine) {
        engine.setVehicle(vehicle);
        const zone = engine.zones.find(item => item.id === current.zone.id);
        const all = zone?.groups.flatMap(group => group.choices) || [];
        // The calculator numbers its options by the position of the tariff in the price list; titles may differ
        // («Шумоизоляция металла наружных арок» is the tariff, «Обработка металла…» its row).
        const index = (window.STUDIO_PRICES || []).indexOf(rate);
        const wanted = String(rate.title).toLocaleLowerCase('ru');
        choice = (index >= 0 && all.find(item => item.id.startsWith('estimate-' + index + '-'))) ||
          all.find(item => item.title.toLocaleLowerCase('ru') === wanted || item.rowTitle.toLocaleLowerCase('ru') === wanted);
        if (choice) price = engine.price(choice.id)?.priceText || '';
      }
      const car = engine?.describeVehicle();
      fact(car ? 'Стоимость для: ' + car : 'Стоимость', price);
      summary.append(facts);
      const actions = el('div', 'ly-actions');
      const calculator = document.getElementById('calculator');
      if (choice && calculator && !calculator.hidden) {
        const add = el('button', 'ly-add', 'Добавить в смету');
        add.type = 'button';
        add.addEventListener('click', () => window.dispatchEvent(new CustomEvent('studio:estimate-select', {
          detail: { zone: current.zone.id, title: choice.title, id: choice.id }
        })));
        actions.append(add);
      }
      const prices = document.getElementById('prices');
      if (prices && !prices.hidden) {
        const link = el('a', 'ly-more', 'Подробнее в прайсе');
        const url = new URL(location.href);
        url.searchParams.set('zone', current.zone.id);
        url.hash = 'prices';
        link.href = url.href;
        link.addEventListener('click', event => {
          if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          window.dispatchEvent(new CustomEvent('studio:zone', { detail: { zone: current.zone.id } }));
          prices.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
        });
        actions.append(link);
      }
      if (actions.childElementCount) summary.append(actions);
    }

    function renderGallery() {
      const photos = (Array.isArray(current.zone.gallery) ? current.zone.gallery : [])
        .map(photo => ({ ...photo, url: window.StudioPage?.mediaUrl(photo?.image) || '' }))
        .filter(photo => photo.url);
      galleryBox.hidden = !photos.length;
      galleryTitle.textContent = 'Наши работы: ' + current.zone.title.toLocaleLowerCase('ru');
      strip.replaceChildren(...photos.map((photo, index) => {
        const button = el('button', 'ly-photo');
        button.type = 'button';
        button.setAttribute('aria-label', 'Открыть фото: ' + (photo.caption || current.zone.title));
        const image = el('img');
        image.src = photo.url;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        image.addEventListener('error', () => button.remove(), { once: true });
        button.append(image);
        if (photo.caption) button.append(el('span', 'ly-photo-caption', photo.caption));
        button.addEventListener('click', () => dialog.open(photos, index, button));
        return button;
      }));
    }

    function render(animate) {
      zoneButtons.forEach((button, index) => button.setAttribute('aria-pressed', String(zones[index] === current)));
      if (packageZone !== current) {
        packages.replaceChildren(...current.rates.map(item => {
          const button = el('button', 'ly-package', shortTitle(item));
          button.type = 'button';
          button.title = item.title;
          button.addEventListener('click', () => { if (rate !== item) { rate = item; render(true); } });
          return button;
        }));
        packageZone = current;
      }
      [...packages.children].forEach((button, index) => button.setAttribute('aria-pressed', String(current.rates[index] === rate)));
      packages.hidden = current.rates.length < 2;
      layers = stackOf(rate);
      active = -1;
      renderList();
      buildScene(animate && seen);
      focusLayer(-1, false);
      renderSummary();
      renderGallery();
      live.textContent = current.zone.title + ', ' + rate.title + ': ' + layers.map(layer => layer.title).join(', ') + '.';
    }

    toggle.addEventListener('click', () => setOpen(!open));
    window.addEventListener('studio:vehicle', event => { vehicle = event.detail?.vehicle || {}; renderSummary(); });
    setOpen(true);
    render(false);
    if ('IntersectionObserver' in window && !reduced.matches) {
      stage.dataset.phase = 'fly';
      const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        seen = true;
        buildScene(true);
      }, { threshold: .35 });
      observer.observe(stage);
    } else seen = true;
    reduced.addEventListener('change', () => buildScene(false));
    compact.addEventListener('change', () => { buildScene(false); focusLayer(active, false); });
  }

  function lightbox() {
    const dialog = el('dialog', 'ly-lightbox');
    dialog.setAttribute('aria-label', 'Фото работы');
    const figure = el('figure', 'ly-lightbox-figure');
    const image = el('img');
    image.alt = '';
    const caption = el('figcaption');
    figure.append(image, caption);
    const close = el('button', 'ly-lightbox-close', 'Закрыть');
    close.type = 'button';
    const prev = el('button', 'ly-lightbox-nav ly-prev');
    const next = el('button', 'ly-lightbox-nav ly-next');
    prev.type = next.type = 'button';
    prev.setAttribute('aria-label', 'Предыдущее фото');
    next.setAttribute('aria-label', 'Следующее фото');
    const counter = el('span', 'ly-lightbox-count');
    dialog.append(close, figure, prev, next, counter);
    let photos = [];
    let index = 0;
    let origin = null;
    function show(i) {
      index = (i + photos.length) % photos.length;
      image.src = photos[index].url;
      image.alt = photos[index].caption || 'Фото работы студии';
      caption.textContent = photos[index].caption || '';
      counter.textContent = (index + 1) + ' / ' + photos.length;
      prev.hidden = next.hidden = counter.hidden = photos.length < 2;
    }
    close.addEventListener('click', () => dialog.close());
    prev.addEventListener('click', () => show(index - 1));
    next.addEventListener('click', () => show(index + 1));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') show(index - 1);
      if (event.key === 'ArrowRight') show(index + 1);
    });
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('ly-lightbox-open');
      origin?.focus({ preventScroll: true });
    });
    return {
      element: dialog,
      open(list, start, button) {
        photos = list;
        origin = button;
        show(start);
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
          document.documentElement.classList.add('ly-lightbox-open');
        } else window.open(photos[start].url, '_blank', 'noopener');
      }
    };
  }

  // The cabinet draws the same sheets in its material and layer editors.
  window.StudioLayerArt = { shapes, kinds, buildDefs, layerArt, textures: ['foil', 'print', 'felt', 'wave', 'eggcrate', 'membrane', 'gloss'] };
  Promise.resolve(window.STUDIO_READY ?? true).then(ready => { if (ready) mount(); });
})();
