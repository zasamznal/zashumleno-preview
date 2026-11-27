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

  // ── Door ─────────────────────────────────────────────────────────────────────────────────────────────
  // Seen from the cabin. The outer skin with stiffening beams is the far part, the inner panel with service openings the near one.
  // The opened stack steps aside along the beams, so they stay in sight between the pieces of the first damper: «doorSpread»
  // places the sheets, the door block of layers.css sets the direction of the step, and the angles of «view» are chosen so that
  // the depth of the stack is seen along the beams too (tan(rotateX) = −slope · sin(rotateY)).
  const DOOR = 'M34 112L34 64Q34 42 58 40L300 30Q338 28 352 50L374 148Q380 188 364 220L334 268Q322 284 298 284L72 284Q38 284 34 252Z';
  // Where the sheets lie: the edge of the part stays in sight around them.
  const DOOR_FIELD = 'M47 112L47 68Q47 54 61 53L299 43Q330 42 339 57L361 151Q366 184 353 211L324 259Q316 271 297 271L74 271Q48 271 47 248Z';
  const DOOR_BEAMS = 'M110 14L396 174M14 107L346 293';
  const DOOR_SPEAKER = 'M74 220a34 34 0 1 0 68 0a34 34 0 1 0-68 0Z';
  const DOOR_OPENINGS = 'M80 74L170 69Q184 68 187 81L196 122Q199 135 187 141L152 157Q143 161 132 160L82 156Q68 155 68 142L68 86Q68 75 80 74Z' +
    'M236 96L302 92Q316 91 318 104L322 150Q323 164 310 165L242 169Q228 170 227 157L224 110Q223 97 236 96Z' +
    'M260 206L324 203Q336 203 334 215L329 250Q327 262 316 262L264 264Q252 264 252 252L252 216Q252 206 260 206Z';
  const DOOR_HOLES = 'M208 58a6 6 0 1 0 12 0a6 6 0 1 0-12 0ZM51 182a5 5 0 1 0 10 0a5 5 0 1 0-10 0ZM334 190a6 6 0 1 0 12 0a6 6 0 1 0-12 0ZM196 184a5 5 0 1 0 10 0a5 5 0 1 0-10 0Z';
  const DOOR_STAMPS = 'M96 56L300 47M62 269L196 271M347 70L365 150';
  const DOOR_SEAMS = 'M130 38L131 284M226 34L228 284M300 31L303 283';
  const DOOR_FIELD_SEAMS = 'M130 51L131 271M226 47L228 271M300 43L303 270';
  const DOOR_PANEL_SEAMS = 'M178 49L180 271M272 45L275 271';
  // The speaker stays open in the damper of the inner panel and in the absorber on the back of the door card.
  const DOOR_PANEL_SHEET = DOOR_FIELD + 'M66 220a42 42 0 1 0 84 0a42 42 0 1 0-84 0Z';
  const DOOR_CARD_BACK = DOOR_FIELD + 'M78 220a30 30 0 1 0 60 0a30 30 0 1 0-60 0Z';
  // The opened fan is always this long, so every kit takes the same room and steps aside at the same angle.
  const DOOR_FAN = 6;
  // Every step of the opened door also goes down by this share of its step aside: the slope of the beams. The same number is --dy in the door block of layers.css.
  const DOOR_DROP = .7467;

  // ── Floor ────────────────────────────────────────────────────────────────────────────────────────────
  // Seen from above, the front of the car on the right, the cut towards the boot on the left. The platform under the rear seat
  // is a step above the main floor, the rear arches bulge at its sides and go on into the boot.
  const FLOOR_MAIN = 'M126 43L300 40Q334 40 340 70L344 104Q368 108 368 134L368 166Q368 192 344 196L340 232Q334 262 300 260L126 257Z';
  const FLOOR_SEAT = 'M126 43L104 43Q104 90 64 90L44 90L44 210L64 210Q104 210 104 257L126 257Z';
  const FLOOR_HATCH = [68, 120, 12, 20];
  // The arches reach a little under the platform, so they grow out of it.
  const FLOOR_ARCH_FAR = 'M44 43L110 43Q110 96 66 96L44 96Z';
  const FLOOR_ARCH_NEAR = 'M44 257L110 257Q110 204 66 204L44 204Z';
  const FLOOR_CUSHION = 'M130 51Q130 44 123 44L105 44Q104 91 64 91L52 91Q45 91 45 98L45 202Q45 209 52 209L64 209Q104 209 105 256L123 256Q130 256 130 249Z';
  const FLOOR_STAMPS = 'M126 136L368 136M126 164L368 164M196 44L196 256M268 42L268 258';
  const FLOOR_SEAT_STAMPS = 'M114 60L114 240M92 108L92 192';
  const FLOOR_SEAMS = 'M206 42L206 258M288 40L288 260M126 150L368 150';
  const FLOOR_SEAT_SEAMS = 'M44 114L126 114M44 186L126 186';
  const FLOOR_CUSHION_SEAMS = 'M45 114L120 114M45 186L120 186M120 44L120 256';
  const FLOOR_SEAT_LIFT = [6, -10];
  const FLOOR_ARCH_LIFT = [11, -18];
  const FLOOR_CUSHION_LIFT = [10, -16];

  // ── Boot ─────────────────────────────────────────────────────────────────────────────────────────────
  // Seen from above, the rear of the car at the bottom. The rear wings are unfolded to the sides as two petals,
  // the lid lies apart in front of the floor pan: its sheets rise beside the pan and never hide the spare wheel well.
  const trunkBox = (x, y, w, h, r) => 'M' + (x + r) + ' ' + y + 'h' + (w - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r + 'v' + (h - 2 * r) +
    'a' + r + ' ' + r + ' 0 0 1 ' + -r + ' ' + r + 'h' + (2 * r - w) + 'a' + r + ' ' + r + ' 0 0 1 ' + -r + ' ' + -r + 'v' + (2 * r - h) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + -r + 'Z';
  const TRUNK_FLOOR = 'M88 26L312 26Q322 26 322 36L322 46Q288 48 288 82Q288 116 322 118L322 186Q322 196 312 196L88 196Q78 196 78 186L78 118Q112 116 112 82Q112 48 78 46L78 36Q78 26 88 26Z';
  const TRUNK_WELL = 'M152 128a48 48 0 1 0 96 0a48 48 0 1 0-96 0Z';
  const TRUNK_WELL_DROP = [-5, 8];
  const TRUNK_ARCH_L = 'M72 44L78 44Q114 46 114 82Q114 118 78 120L72 120Z';
  const TRUNK_ARCH_R = 'M328 44L322 44Q286 46 286 82Q286 118 322 120L328 120Z';
  const TRUNK_WING_L = 'M68 28C56 46 22 76 22 111C22 146 56 176 68 194Z';
  const TRUNK_WING_R = 'M332 28C344 46 378 76 378 111C378 146 344 176 332 194Z';
  const TRUNK_LID = trunkBox(172, 240, 168, 54, 12);
  const TRUNK_LID_WINDOWS = [[181, 70], [261, 70]];
  const TRUNK_LID_HOLES = TRUNK_LID_WINDOWS.map(([x, w]) => trunkBox(x, 249, w, 36, 6)).join('');
  const TRUNK_LID_PADS = TRUNK_LID_WINDOWS.map(([x, w]) => trunkBox(x + 2, 251, w - 4, 32, 5)).join('');
  const TRUNK_LID_BACK = trunkBox(176, 244, 160, 46, 9);
  const TRUNK_LID_CLIPS = [[186, 251], [256, 251], [326, 251], [186, 283], [326, 283]];
  const TRUNK_STAMPS = 'M96 186L304 186M124 38L276 38';
  const TRUNK_SEAMS = 'M138 26L138 196M262 26L262 196';
  const TRUNK_ARCH_LIFT = [8, -13];

  // Panels of each zone in a 400×300 box. view — the 3D angle of the stack, badge — where numbers sit.
  //
  // A zone with several parts of the body describes them in «parts» (from the street or the metal to the cabin), the surfaces
  // the sheets are glued to in «areas» and the drawing of every part in «draw». A sheet of a kit names its areas in «on»
  // (prices.js); «place» puts the sheets of a kit that does not name them. outline, holes, ribs and seams draw a plain
  // sheet of the zone: the cabinet uses them for material swatches.
  //
  //   parts: [{ id, type: 'base' | 'cover', title, text, whole }]   whole — words for a sheet that covers every area of the part
  //   areas: { id: { part, name, where, over, at: [x, y], pieces } } at — where the name of the material sits on the drawing
  //   piece: { d, order, evenodd, cut, cutWidth, c, lift, seams, emboss, dome, detail(group, material) }
  //     order — far pieces first; cut — bands the sheet leaves open; c — centre the upper sheet shrinks to;
  //     lift — [dx, dy] of a raised piece, drawn as a block seen from the side of the stack; emboss — openings under the sheet.
  //     print: false — a piece too small for the repeated print goes without it (its «detail» may write the name once).
  const shapes = {
    door: {
      view: 'rotateX(-9.8deg) rotateY(18deg)', badge: [11, 17], fan: 'side', spread: 61, box: [3, 41], positions: doorSpread, drop: DOOR_DROP,
      outline: DOOR, holes: DOOR_OPENINGS + DOOR_SPEAKER, ribs: DOOR_STAMPS, seams: DOOR_SEAMS, cover: 'door',
      parts: [
        { id: 'outer', type: 'base', title: 'Наружный лист двери',
          text: 'Дальний от салона металл двери с рёбрами жёсткости. Первый вибродемпфер клеят изнутри двери — на свободные участки между рёбрами.' },
        { id: 'inner', type: 'base', title: 'Внутренняя панель двери',
          text: 'Металл с технологическими отверстиями под динамик и механизмы двери. Второй слой вибродемпфера закрывает отверстия — открытым остаётся только динамик.' },
        { id: 'card', type: 'cover', title: 'Дверная карта',
          text: 'Обшивка двери со стороны салона. Шумопоглотитель приклеен к её обратной стороне; карту ставят на место, и она закрывает все слои. Обработка самой карты вибродемпфером и антискрипом — отдельная услуга.' }
      ],
      areas: {
        outer: { part: 'outer', name: 'наружный лист, между рёбрами', where: 'на наружный лист двери, между рёбрами жёсткости', over: 'в той же полости двери', at: [78, 100],
          pieces: [{ d: DOOR_FIELD, cut: DOOR_BEAMS, cutWidth: 34, c: [204, 140], seams: DOOR_FIELD_SEAMS }] },
        inner: { part: 'inner', name: 'внутренняя панель', where: 'на внутреннюю панель — закрывает технологические отверстия', over: 'на внутренней панели', at: [215, 72],
          pieces: [{ d: DOOR_PANEL_SHEET, evenodd: true, emboss: DOOR_OPENINGS, c: [204, 160], seams: DOOR_PANEL_SEAMS }] },
        card: { part: 'card', name: 'обратная сторона дверной карты', where: 'на обратную сторону дверной карты', over: 'на обратной стороне дверной карты', at: [215, 72],
          pieces: [{ d: DOOR_CARD_BACK, evenodd: true, c: [204, 160] }] }
      },
      place: placeDoor, draw: doorPart
    },
    floor: {
      view: 'rotateX(57deg) rotateZ(-31deg)', badge: [97, 82], fan: 'up',
      outline: 'M46 72Q46 44 74 44L300 40Q334 40 340 70L344 104Q368 108 368 134L368 166Q368 192 344 196L340 232Q334 262 300 260L74 256Q46 256 46 228Z',
      holes: 'M98 92a6 6 0 1 0 12 0a6 6 0 1 0-12 0ZM98 208a6 6 0 1 0 12 0a6 6 0 1 0-12 0ZM290 92a6 6 0 1 0 12 0a6 6 0 1 0-12 0Z',
      ribs: 'M46 136L368 136M46 164L368 164M168 46L168 254M248 44L248 258',
      seams: 'M128 44L128 256M208 42L208 258M288 40L290 260M46 150L368 150',
      cover: 'carpet',
      parts: [
        { id: 'metal', type: 'base', title: 'Металл пола', whole: 'на весь пол: основной пол, площадку под задним диваном и задние арки',
          text: 'Основной пол, приподнятая площадка под задним диваном и задние арки со стороны салона передают гул дороги и вибрации от колёс.' },
        { id: 'carpet', type: 'cover', title: 'Ковролин', text: 'Ковролин, подушка заднего дивана и обшивка арок возвращаются на место и закрывают материалы.' }
      ],
      // at — a point of the drawing, so the lift of a raised piece is already in it.
      areas: {
        main: { part: 'metal', name: 'основной пол', where: 'на основной пол', over: 'на основном полу', at: [240, 222],
          pieces: [{ d: FLOOR_MAIN, order: 0, seams: FLOOR_SEAMS, detail: floorStep }] },
        seat: { part: 'metal', name: 'площадка под задним диваном', where: 'на площадку под задним диваном', over: 'на площадке под задним диваном', at: [66, 172],
          pieces: [{ d: FLOOR_SEAT, order: 2, lift: FLOOR_SEAT_LIFT, seams: FLOOR_SEAT_SEAMS, detail: floorHatch }] },
        arches: { part: 'metal', name: 'задние арки', where: 'на задние арки со стороны салона', over: 'на задних арках', at: [84, 232],
          pieces: [
            { d: FLOOR_ARCH_FAR, order: 1, lift: FLOOR_ARCH_LIFT, mound: [44, 64, 78], face: [44, 43, 44, 96], print: [22, -20] },
            { d: FLOOR_ARCH_NEAR, order: 3, lift: FLOOR_ARCH_LIFT, mound: [44, 236, 78], face: [44, 204, 44, 257], print: [-14, 6] }
          ] }
      },
      place: placeFloor, draw: floorPart
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
      view: 'rotateX(57deg) rotateZ(-31deg)', badge: [92, 97], fan: 'up',
      outline: 'M58 58L342 58L342 108Q304 110 304 150Q304 190 342 192L342 252L58 252L58 192Q96 190 96 150Q96 110 58 108Z',
      holes: '',
      ribs: 'M58 230L342 230M58 80L342 80',
      seams: 'M156 58L156 252M244 58L244 252',
      well: [200, 150, 62],
      cover: 'trunk',
      parts: [
        { id: 'metal', type: 'base', title: 'Металл багажника', whole: 'на весь металл: пол с нишей, арки, крылья и крышку',
          text: 'Пол с нишей запасного колеса, задние арки, задние крылья и крышка багажника усиливают гул от задних колёс. На схеме крылья развёрнуты в стороны, крышка лежит рядом.' },
        { id: 'trim', type: 'cover', title: 'Обшивка багажника', text: 'Настил пола, боковые обшивки и обшивка крышки возвращаются на место и закрывают материалы.' }
      ],
      areas: {
        floor: { part: 'metal', name: 'пол с нишей', where: 'на пол багажника с нишей запасного колеса', over: 'на полу с нишей', at: [118, 164],
          pieces: [{ d: TRUNK_FLOOR, order: 1, seams: TRUNK_SEAMS, detail: trunkWell }] },
        arches: { part: 'metal', name: 'задние арки', where: 'на задние арки со стороны багажника', over: 'на задних арках', at: [100, 70],
          pieces: [{ d: TRUNK_ARCH_R, order: 2, lift: TRUNK_ARCH_LIFT, dome: true, print: false, detail: trunkPrint([305, 82, 90, 10]) },
            { d: TRUNK_ARCH_L, order: 3, lift: TRUNK_ARCH_LIFT, dome: true, print: false, detail: trunkPrint([95, 82, 90, 10]) }] },
        wings: { part: 'metal', name: 'задние крылья', where: 'на задние крылья изнутри багажника', over: 'на задних крыльях', at: [46, 111],
          pieces: [{ d: TRUNK_WING_R, order: 0, print: false, detail: trunkPrint([354, 111, 90, 13]) }, { d: TRUNK_WING_L, order: 4, print: false, detail: trunkPrint([46, 111, 90, 13]) }] },
        lid: { part: 'metal', name: 'металл крышки', where: 'на металл крышки багажника, в окна её каркаса', over: 'на металле крышки', at: [256, 267],
          pieces: [{ d: TRUNK_LID_PADS, order: 5, print: false, detail: trunkPrint([216, 267, 0, 11], [296, 267, 0, 11]) }] },
        lidTrim: { part: 'trim', name: 'обратная сторона обшивки крышки', where: 'на обратную сторону обшивки крышки', over: 'на обшивке крышки', at: [256, 267], badge: [76, 106],
          pieces: [{ d: TRUNK_LID_BACK, order: 5, detail: trunkClips }] }
      },
      place: placeTrunk, draw: trunkPart
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
    // Light on a raised round part of the body: a wheel arch.
    svg('radialGradient', { id: 'ly-dome', cx: .42, cy: .34, r: .75 }, defs).append(
      svg('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': .3 }), svg('stop', { offset: .5, 'stop-color': '#ffffff', 'stop-opacity': 0 }),
      svg('stop', { offset: 1, 'stop-color': '#000000', 'stop-opacity': .34 }));
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

  // ── Drawing tools shared by the parts of the body and the sheets ────────────────────────────────────────
  let serial = 0;
  const uid = prefix => prefix + (++serial).toString(36);
  const WALL = '#4b4f5d';
  function darken(color, share = .5) {
    if (!colorOk(color)) return '#1c1b20';
    return '#' + [1, 3, 5].map(at => Math.round(parseInt(color.slice(at, at + 2), 16) * share).toString(16).padStart(2, '0')).join('');
  }
  const rule = evenodd => evenodd ? { 'fill-rule': 'evenodd' } : {};
  // Edge of a sheet or a panel: gives it some thickness when the stack is opened.
  const thickness = (group, d, evenodd) => svg('path', { d, ...rule(evenodd), transform: 'translate(2.5 3.5)', fill: '#000000', 'fill-opacity': .55 }, group);
  function metal(group, d, evenodd) {
    svg('path', { d, ...rule(evenodd), fill: 'url(#ly-metal)' }, group);
    svg('path', { d, ...rule(evenodd), fill: 'url(#ly-brushed)' }, group);
  }
  const edge = (group, d, evenodd) => svg('path', { d, ...rule(evenodd), fill: 'none', stroke: '#e8eaf0', 'stroke-opacity': .7, 'stroke-width': 1.5 }, group);
  // A line pressed into the metal.
  function stamp(group, d) {
    svg('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-opacity': .45, 'stroke-width': 3, 'stroke-linecap': 'round' }, group);
    svg('path', { d, transform: 'translate(0 3)', fill: 'none', stroke: '#000000', 'stroke-opacity': .18, 'stroke-width': 2, 'stroke-linecap': 'round' }, group);
  }
  // A raised piece is a block: «paint(target, true)» draws a slice of its side, «paint(target, false)» its top.
  // The shift of the top follows the angle of the opened stack, so the side faces the viewer.
  function raised(group, lift, paint) {
    if (!lift) { paint(group, false); return; }
    const [dx, dy] = lift;
    const slices = Math.max(2, Math.round(Math.hypot(dx, dy) / 1.5));
    for (let i = 0; i < slices; i++) paint(svg('g', { transform: 'translate(' + (dx * i / slices).toFixed(2) + ' ' + (dy * i / slices).toFixed(2) + ')' }, group), true);
    paint(svg('g', { transform: 'translate(' + dx + ' ' + dy + ')' }, group), false);
  }
  // A part of the body made of metal: flat or raised.
  function metalPiece(group, piece, extra) {
    if (piece.mound) { mound(group, piece, ['#e8eaf0', .7, 1.5], WALL, (target, d) => { metal(target, d); extra?.(target); }); return; }
    raised(group, piece.lift, (target, side) => {
      if (side) { svg('path', { d: piece.d, ...rule(piece.evenodd), fill: WALL }, target); return; }
      if (!piece.lift) thickness(target, piece.d, piece.evenodd);
      metal(target, piece.d, piece.evenodd);
      if (piece.dome) svg('path', { d: piece.d, fill: 'url(#ly-dome)' }, target);
      extra?.(target);
      edge(target, piece.d, piece.evenodd);
    });
  }
  // Trim over a piece of the body: carpet, plastic or upholstery.
  function trimPiece(group, piece, fill, extra) {
    if (piece.mound) { mound(group, piece, ['#ffffff', .18, 1.4], '#131217', (target, d) => { svg('path', { d, fill }, target); extra?.(target); }); return; }
    raised(group, piece.lift, (target, side) => {
      if (side) { svg('path', { d: piece.d, ...rule(piece.evenodd), fill: '#131217' }, target); return; }
      if (!piece.lift) thickness(target, piece.d, piece.evenodd);
      svg('path', { d: piece.d, ...rule(piece.evenodd), fill }, target);
      if (piece.dome) svg('path', { d: piece.d, fill: 'url(#ly-dome)', 'fill-opacity': .6 }, target);
      extra?.(target);
      svg('path', { d: piece.d, ...rule(piece.evenodd), fill: 'none', stroke: '#ffffff', 'stroke-opacity': .18, 'stroke-width': 1.4 }, target);
    });
  }
  // A sheet of material on one piece of an area. level — how many sheets already lie there: the upper one is a little smaller.
  function sheetPiece(group, piece, material, level) {
    let host = group;
    if (level && piece.c) {
      const [x, y] = piece.c;
      host = svg('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + (1 - level * .035).toFixed(3) + ') translate(' + -x + ' ' + -y + ')' }, group);
    }
    let mask = '';
    if (piece.cut) {
      const node = svg('mask', { id: uid('ly-cut-'), maskUnits: 'userSpaceOnUse', x: -20, y: -20, width: 440, height: 340 }, host);
      svg('rect', { x: -20, y: -20, width: 440, height: 340, fill: '#ffffff' }, node);
      svg('path', { d: piece.cut, fill: 'none', stroke: '#000000', 'stroke-width': (piece.cutWidth || 22) + level * 6 }, node);
      mask = 'url(#' + node.id + ')';
    }
    const id = 'ly-mat-' + safeId(material.id);
    const fill = (target, attrs) => svg('path', { d: piece.d, ...rule(piece.evenodd), ...attrs }, target);
    if (piece.mound) {
      mound(host, piece, ['#ffffff', .25, 1.2], darken(material.color), (target, d, moved) => {
        svg('path', { d, fill: 'url(#' + id + ')' }, target);
        if (document.getElementById(id + '-print')) svg('path', { ...moved, fill: 'url(#' + id + '-print)' }, target);
        if (material.kind === 'damper' || material.texture === 'gloss') svg('path', { d, fill: 'url(#ly-sheen)' }, target);
        piece.detail?.(target, material);
      });
      return;
    }
    raised(host, piece.lift, (target, side) => {
      const box = mask ? svg('g', { mask }, target) : target;
      if (side) { fill(box, { fill: darken(material.color) }); return; }
      if (!piece.lift) thickness(box, piece.d, piece.evenodd);
      fill(box, { fill: 'url(#' + id + ')' });
      if (piece.print !== false && document.getElementById(id + '-print')) fill(box, { fill: 'url(#' + id + '-print)' });
      if (piece.emboss) svg('path', { d: piece.emboss, fill: '#000000', 'fill-opacity': .16, stroke: '#ffffff', 'stroke-opacity': .16, 'stroke-width': 1.2 }, box);
      if (piece.seams && ['damper', 'insulator', 'membrane'].includes(material.kind)) {
        svg('path', { d: piece.seams, fill: 'none', stroke: '#000000', 'stroke-opacity': .32, 'stroke-width': 1.4 }, box);
        svg('path', { d: piece.seams, transform: 'translate(1.4 0)', fill: 'none', stroke: '#ffffff', 'stroke-opacity': .14, 'stroke-width': 1 }, box);
      }
      if (piece.dome) fill(box, { fill: 'url(#ly-dome)' });
      if (material.kind === 'damper' || material.texture === 'gloss') fill(box, { fill: 'url(#ly-sheen)' });
      piece.detail?.(box, material);
      fill(box, { fill: 'none', stroke: '#ffffff', 'stroke-opacity': .25, 'stroke-width': 1.2 });
    });
  }

  // ── Door: parts ──────────────────────────────────────────────────────────────────────────────────────
  function doorPart(group, part) {
    if (part === 'card') { coverArt(group, shapes.door); return; }
    if (part === 'outer') {
      thickness(group, DOOR);
      metal(group, DOOR);
      // Stiffening beams of the outer skin: the damper is glued between them.
      const clip = svg('clipPath', { id: uid('ly-clip-') }, group);
      svg('path', { d: DOOR }, clip);
      const beams = svg('g', { 'clip-path': 'url(#' + clip.id + ')', fill: 'none' }, group);
      svg('path', { d: DOOR_BEAMS, transform: 'translate(-2 3.6)', stroke: '#000000', 'stroke-opacity': .34, 'stroke-width': 16 }, beams);
      svg('path', { d: DOOR_BEAMS, stroke: '#c3c7d2', 'stroke-width': 14 }, beams);
      svg('path', { d: DOOR_BEAMS, transform: 'translate(1.5 -2.6)', stroke: '#f3f4f8', 'stroke-width': 6 }, beams);
      svg('path', { d: DOOR_BEAMS, transform: 'translate(-2.6 4.6)', stroke: '#6f7483', 'stroke-width': 2.4 }, beams);
      edge(group, DOOR);
      return;
    }
    const panel = DOOR + DOOR_OPENINGS + DOOR_SPEAKER + DOOR_HOLES;
    thickness(group, panel, true);
    metal(group, panel, true);
    stamp(group, DOOR_STAMPS);
    edge(group, panel, true);
  }

  // Places of the sheets in the opened stack of the door («positions» of the shape, used instead of the common «spread»):
  // a part of the body keeps its sheets close and the three assemblies stand apart; the panel with openings shows more
  // of itself from under its damper. Places are counted from the outer skin. Sideways the layout opens the stack from its
  // middle («spread» of the shape is a half of the fan), so the closed door stays in the centre of the stage.
  function doorSpread(stack) {
    const group = layer => layer.host || layer.part;
    let position = 0;
    const places = stack.map((layer, index) => {
      const before = stack[index - 1];
      if (before) position += group(layer) !== group(before) ? 1.8 : before.part === 'inner' ? 1.3 : .7;
      return position;
    });
    return places.map(place => place * DOOR_FAN / (position || 1));
  }

  // ── Floor: parts ─────────────────────────────────────────────────────────────────────────────────────
  // A bulge, such as a wheel arch. «mound: [x, y, r]» of a piece is its peak and the reach of the light on it: the footprint
  // shrinks towards the peak while it rises by «lift», and the outline of all its levels is the bulge as it is seen in the stack.
  // The footprint has to be convex and written with M, L, Q and Z. «face: [x0, y0, x1, y1]» is the edge where the bulge is cut
  // flat, «print: [dx, dy]» moves the printed name of a sheet so that it falls on the bulge.
  // rim — [colour, opacity, width] of the outline, wall — the colour of the cut, paint(target, d, moved) fills the surface.
  function mound(group, piece, rim, wall, paint) {
    const [px, py, reach = 80] = piece.mound;
    const [dx, dy] = piece.lift || [0, 0];
    const foot = [];
    piece.d.replace(/([MLQ])([^MLQZ]+)/g, (_, command, text) => {
      const [x1, y1, x2, y2] = text.trim().split(/[\s,]+/).map(Number);
      if (command !== 'Q') { foot.push([x1, y1]); return; }
      const [x0, y0] = foot.at(-1);
      for (let t = .125; t <= 1; t += .125) foot.push([(1 - t) ** 2 * x0 + 2 * t * (1 - t) * x1 + t * t * x2, (1 - t) ** 2 * y0 + 2 * t * (1 - t) * y1 + t * t * y2]);
    });
    const levels = Array.from({ length: 40 }, (_, i) => [Math.sin(i / 26), Math.cos(i / 26)]);
    const raise = ([rise, size], [x, y]) => [px + (x - px) * size + dx * rise, py + (y - py) * size + dy * rise];
    // All the levels together are convex, so their outline is the hull of their points.
    const points = levels.flatMap(level => foot.map(point => raise(level, point))).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const turn = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half = list => list.reduce((hull, point) => {
      while (hull.length > 1 && turn(hull.at(-2), hull.at(-1), point) <= 0) hull.pop();
      hull.push(point);
      return hull;
    }, []).slice(0, -1);
    const path = (list, ox = 0, oy = 0) => 'M' + list.map(([x, y]) => (x - ox).toFixed(1) + ' ' + (y - oy).toFixed(1)).join('L');
    const hull = [...half(points), ...half(points.reverse())];
    const d = path(hull) + 'Z';
    const [mx, my] = piece.print || [0, 0];
    paint(group, d, { d: path(hull, mx, my) + 'Z', transform: 'translate(' + mx + ' ' + my + ')' });
    const light = svg('radialGradient', { id: uid('ly-light-'), gradientUnits: 'userSpaceOnUse', cx: px + dx * .9, cy: py + dy * .9, r: reach }, group);
    light.append(svg('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': .34 }), svg('stop', { offset: .4, 'stop-color': '#ffffff', 'stop-opacity': 0 }),
      svg('stop', { offset: 1, 'stop-color': '#000000', 'stop-opacity': .42 }));
    const line = { fill: 'none', stroke: rim[0], 'stroke-opacity': rim[1], 'stroke-width': rim[2], 'stroke-linejoin': 'round' };
    svg('path', { d, fill: 'url(#' + light.id + ')' }, group);
    svg('path', { d, ...line }, group);
    if (!piece.face) return;
    const [x0, y0, x1, y1] = piece.face;
    const cut = path([...levels.map(level => raise(level, [x0, y0])), ...levels.map(level => raise(level, [x1, y1])).reverse()]);
    svg('path', { d: cut + 'Z', fill: wall }, group);
    svg('path', { d: cut, ...line }, group);
  }
  // The floor behind the step lies in its shade. from — where the top of the step ends on the drawing.
  function floorShade(group, from, depth = .45) {
    const shade = svg('linearGradient', { id: uid('ly-shade-'), gradientUnits: 'userSpaceOnUse', x1: from, y1: 0, x2: from + 24, y2: 0 }, group);
    shade.append(svg('stop', { offset: 0, 'stop-color': '#000000', 'stop-opacity': depth }), svg('stop', { offset: 1, 'stop-color': '#000000', 'stop-opacity': 0 }));
    svg('path', { d: 'M126 43.5H' + (from + 24) + 'V256.5H126Z', fill: 'url(#' + shade.id + ')' }, group);
  }
  function floorStep(group) { floorShade(group, 132); }
  // The service hatch of the platform. The sheets are cut around it, so it shows on every one of them.
  function floorHatch(group) {
    const [cx, cy, rx, ry] = FLOOR_HATCH;
    svg('ellipse', { cx, cy, rx, ry, fill: 'url(#ly-metal)', stroke: '#2b2d36', 'stroke-width': 1.8 }, group);
    svg('ellipse', { cx, cy, rx: rx * .6, ry: ry * .6, fill: '#000000', 'fill-opacity': .1, stroke: '#ffffff', 'stroke-opacity': .7, 'stroke-width': 1.2 }, group);
  }
  function floorPart(group, part) {
    const { main, seat, arches } = shapes.floor.areas;
    const [far, near] = arches.pieces;
    if (part === 'metal') {
      metalPiece(group, main.pieces[0], target => {
        for (const [x, y] of [[158, 84], [158, 216], [316, 84]]) svg('circle', { cx: x, cy: y, r: 6, fill: '#0c0b0e', 'fill-opacity': .7 }, target);
        stamp(target, FLOOR_STAMPS);
        floorShade(target, 132, .6);
      });
      metalPiece(group, far);
      metalPiece(group, seat.pieces[0], target => { stamp(target, FLOOR_SEAT_STAMPS); floorHatch(target); });
      metalPiece(group, near);
      return;
    }
    trimPiece(group, main.pieces[0], 'url(#ly-cover-carpet)', target => {
      svg('path', { d: 'M126 136L368 136L368 164L126 164Z', fill: '#ffffff', 'fill-opacity': .06 }, target);
      for (const [x, y] of [[166, 96], [246, 96], [166, 204], [246, 204], [312, 96], [312, 204]]) svg('rect', { x, y, width: 34, height: 6, rx: 3, fill: '#111015' }, target);
      floorShade(target, 140);
    });
    trimPiece(group, far, '#26252b');
    // The rear seat cushion returns to its platform: three seats and a roll along the front edge.
    trimPiece(group, { d: FLOOR_CUSHION, lift: FLOOR_CUSHION_LIFT }, '#45434e', target => {
      const clip = svg('clipPath', { id: uid('ly-clip-') }, target);
      svg('path', { d: FLOOR_CUSHION }, clip);
      const soft = svg('radialGradient', { id: uid('ly-soft-'), cx: .42, cy: .36, r: .75 }, target);
      soft.append(svg('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': .28 }), svg('stop', { offset: .5, 'stop-color': '#ffffff', 'stop-opacity': 0 }),
        svg('stop', { offset: 1, 'stop-color': '#000000', 'stop-opacity': .36 }));
      const pads = svg('g', { 'clip-path': 'url(#' + clip.id + ')' }, target);
      for (const [x, y, width, height] of [[45, 44, 75, 70], [45, 114, 75, 72], [45, 186, 75, 70], [120, 44, 10, 212]]) svg('rect', { x, y, width, height, fill: 'url(#' + soft.id + ')' }, pads);
      svg('path', { d: FLOOR_CUSHION_SEAMS, fill: 'none', stroke: '#000000', 'stroke-opacity': .6, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, pads);
      svg('path', { d: FLOOR_CUSHION_SEAMS, transform: 'translate(1.4 -1.4)', fill: 'none', stroke: '#ffffff', 'stroke-opacity': .12, 'stroke-width': 1 }, pads);
      // Seat belt buckles between the seats.
      for (const y of [109, 181]) {
        svg('rect', { x: 47, y, width: 9, height: 10, rx: 2, fill: '#141318', stroke: '#ffffff', 'stroke-opacity': .2, 'stroke-width': .8 }, target);
        svg('rect', { x: 49, y: y + 2.5, width: 4, height: 5, rx: 1, fill: '#d8283a' }, target);
      }
    });
    trimPiece(group, near, '#26252b');
  }

  // ── Boot: parts ──────────────────────────────────────────────────────────────────────────────────────
  // A recess seen from the side of the opened stack: its far wall, then its bottom, which lies lower than the surface around it.
  function trunkRecess(group, d, drop, wall, bottom) {
    const clip = svg('clipPath', { id: uid('ly-clip-') }, group);
    svg('path', { d }, clip);
    const box = svg('g', { 'clip-path': 'url(#' + clip.id + ')' }, group);
    svg('path', { d, fill: wall }, box);
    const floor = svg('g', { transform: 'translate(' + drop.join(' ') + ')' }, box);
    bottom(floor);
    svg('path', { d, fill: 'none', stroke: '#000000', 'stroke-opacity': .45, 'stroke-width': 1.4 }, floor);
    svg('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-opacity': .5, 'stroke-width': 1.4 }, group);
  }
  // A small piece carries the name of its material once, along the piece: the repeated print of a full sheet would be cut to shreds.
  // places: [x, y, angle, size]. The words and the colour are those of the print of the material.
  function trunkPrint(...places) {
    return (group, material) => {
      const print = document.getElementById('ly-mat-' + safeId(material.id) + '-print')?.querySelector('text');
      if (!print) return;
      for (const [x, y, angle, size] of places) {
        svg('text', { x, y, dy: '.35em', transform: 'rotate(' + angle + ' ' + x + ' ' + y + ')', 'text-anchor': 'middle',
          fill: print.getAttribute('fill'), 'fill-opacity': print.getAttribute('fill-opacity'), 'font-size': size, 'font-weight': 800,
          'font-family': 'Roboto, Arial, sans-serif', 'letter-spacing': .5 }, group).textContent = print.textContent;
      }
    };
  }
  // The spare wheel well stays visible on every sheet pressed into it.
  function trunkWell(group, material) {
    const id = 'ly-mat-' + safeId(material.id);
    trunkRecess(group, TRUNK_WELL, TRUNK_WELL_DROP, darken(material.color, .5), bottom => {
      svg('path', { d: TRUNK_WELL, fill: 'url(#' + id + ')' }, bottom);
      if (document.getElementById(id + '-print')) svg('path', { d: TRUNK_WELL, fill: 'url(#' + id + '-print)' }, bottom);
      svg('path', { d: TRUNK_WELL, fill: '#000000', 'fill-opacity': .14 }, bottom);
    });
  }
  // The clips of the lid trim stay free: the absorber is glued around them, to the back of the trim.
  function trunkClips(group) {
    for (const [x, y] of TRUNK_LID_CLIPS) {
      svg('circle', { cx: x, cy: y, r: 3.4, fill: '#17161b' }, group);
      svg('circle', { cx: x, cy: y, r: 2, fill: '#e6e7ee' }, group);
    }
  }
  function trunkPart(group, part) {
    const { floor, arches, wings } = shapes.trunk.areas;
    const [archFar, archNear] = arches.pieces;
    const [wingFar, wingNear] = wings.pieces;
    const lid = { d: TRUNK_LID };
    if (part === 'metal') {
      const wing = target => {
        stamp(target, 'M58 56C46 72 35 92 35 111C35 130 46 150 58 166');
        for (const y of [88, 134]) svg('circle', { cx: 51, cy: y, r: 3.6, fill: '#0c0b0e', 'fill-opacity': .6 }, target);
      };
      // The right wing mirrors the left one.
      metalPiece(group, wingFar, target => wing(svg('g', { transform: 'matrix(-1 0 0 1 400 0)' }, target)));
      metalPiece(group, floor.pieces[0], target => {
        stamp(target, TRUNK_STAMPS);
        trunkRecess(target, TRUNK_WELL, TRUNK_WELL_DROP, WALL, bottom => {
          metal(bottom, TRUNK_WELL);
          svg('path', { d: TRUNK_WELL, fill: '#000000', 'fill-opacity': .16 }, bottom);
          svg('circle', { cx: 200, cy: 128, r: 30, fill: 'none', stroke: '#ffffff', 'stroke-opacity': .3, 'stroke-width': 2 }, bottom);
          // The drain plug in the middle of the well.
          svg('circle', { cx: 200, cy: 128, r: 6.5, fill: '#23252d', stroke: '#ffffff', 'stroke-opacity': .45, 'stroke-width': 1 }, bottom);
        });
      });
      metalPiece(group, archFar);
      metalPiece(group, archNear);
      metalPiece(group, wingNear, wing);
      // The lid: the windows of its inner frame open to the outer skin, where the damper goes.
      metalPiece(group, lid, target => {
        trunkRecess(target, TRUNK_LID_HOLES, [-2, 3], '#2c2e37', bottom => {
          svg('path', { d: TRUNK_LID_HOLES, fill: '#868b99' }, bottom);
          svg('path', { d: TRUNK_LID_HOLES, fill: 'url(#ly-brushed)' }, bottom);
        });
        // The lock.
        svg('rect', { x: 249, y: 287, width: 14, height: 5, rx: 2, fill: '#23252d' }, target);
      });
      return;
    }
    const carpet = 'url(#ly-cover-trunk)';
    trimPiece(group, wingFar, carpet);
    trimPiece(group, floor.pieces[0], carpet, target => {
      // The false floor: a board over the spare wheel well with a pull loop at the rear edge.
      svg('path', { d: trunkBox(124, 36, 152, 150, 10), fill: '#ffffff', 'fill-opacity': .035, stroke: '#000000', 'stroke-opacity': .5, 'stroke-width': 1.6 }, target);
      svg('rect', { x: 184, y: 168, width: 32, height: 8, rx: 4, fill: '#121116', stroke: '#ffffff', 'stroke-opacity': .16, 'stroke-width': 1 }, target);
    });
    trimPiece(group, archFar, carpet);
    trimPiece(group, archNear, carpet);
    trimPiece(group, wingNear, carpet);
    // The lid trim: a moulded panel with a pull handle and clips along the edge.
    trimPiece(group, lid, '#25242a', target => {
      svg('rect', { x: 232, y: 273, width: 48, height: 10, rx: 5, fill: '#0f0e12', stroke: '#ffffff', 'stroke-opacity': .14, 'stroke-width': 1 }, target);
      for (const [x, y] of TRUNK_LID_CLIPS) svg('circle', { cx: x, cy: y, r: 2.4, fill: '#000000', 'fill-opacity': .5 }, target);
    });
  }

  function layerArt(shape, layer, index, total) {
    const root = svg('svg', { viewBox: '0 0 400 300', class: 'ly-art', 'aria-hidden': 'true', focusable: 'false' });
    if (shape.parts && layer.part) {
      shape.draw(svg('g', {}, root), layer.part);
      return root;
    }
    if (shape.parts && layer.spots) {
      // Every material of the sheet lies on its own areas; far pieces are drawn first.
      const pieces = layer.spots.flatMap(spot => spot.areas.flatMap(id => shape.areas[id].pieces.map(piece => ({ piece, spot }))));
      pieces.sort((a, b) => (a.piece.order || 0) - (b.piece.order || 0));
      const group = svg('g', {}, root);
      for (const { piece, spot } of pieces) sheetPiece(group, piece, spot.material, spot.level || 0);
      return root;
    }
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
      for (const [x, y] of [[288, 136.4], [303, 135.6], [318, 134.8]]) svg('rect', { x, y, width: 10, height: 6, rx: 2, fill: '#5d5b66' }, group);
      svg('rect', { x: 104, y: 100, width: 52, height: 16, rx: 8, fill: '#a7a9b4' }, group);
      svg('circle', { cx: 108, cy: 220, r: 36, fill: '#1a191e', stroke: '#4a4852', 'stroke-width': 3 }, group);
      svg('circle', { cx: 108, cy: 220, r: 31, fill: 'url(#ly-perforation)' }, group);
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

  const shortName = material => String(material.name).replace(/^comfortmat\s+/i, '');
  const listed = words => words.length > 1 ? words.slice(0, -1).join(', ') + ' и ' + words.at(-1) : words[0] || '';

  // Where the sheets go when a kit does not name their areas: the usual order of work in the studio.
  // Each function gets [{ kind, alt, altKind }] and returns [{ on, altOn }] for the same sheets.
  function placeDoor(sheets) {
    // The first damper is glued inside the door to the outer skin, an insulator follows the damper below it,
    // the next damper closes the openings of the inner panel, an absorber sits on the back of the door card.
    let dampers = 0;
    let last = 'outer';
    return sheets.map(({ kind }) => {
      if (kind === 'damper') last = dampers++ ? 'inner' : 'outer';
      else if (kind === 'absorber' || kind === 'antisqueak') last = 'card';
      return { on: [last] };
    });
  }
  function placeFloor(sheets) {
    // One material covers the whole floor; of two, the second lies on the platform under the rear seat.
    return sheets.map(({ alt }) => alt ? { on: ['main', 'arches'], altOn: ['seat'] } : { on: ['main', 'seat', 'arches'] });
  }
  function placeTrunk(sheets) {
    // Dampers: the heavier on the floor and the arches, the lighter on the wings and the lid. Insulators: the floor and the wings,
    // the second on the arches. An absorber is glued to the back of the lid trim.
    return sheets.map(({ kind, alt }) => {
      if (kind === 'absorber') return { on: ['lidTrim'], altOn: [] };
      if (kind === 'damper') return alt ? { on: ['floor', 'arches'], altOn: ['wings', 'lid'] } : { on: ['floor', 'arches', 'wings', 'lid'] };
      return alt ? { on: ['floor', 'wings'], altOn: ['arches'] } : { on: ['floor', 'arches', 'wings'] };
    });
  }

  // The stack of a kit from the street (or the metal) to the cabin: parts of the body and the sheets glued to them.
  // structure — the zone settings from the cabinet, list — «layers» of the tariff, byId — materials by id.
  function plan(shape, structure, list, byId) {
    structure = structure && typeof structure === 'object' ? structure : {};
    const sheets = [];
    for (const item of Array.isArray(list) ? list : []) {
      const material = byId.get(item?.material);
      if (!material) continue;
      const alt = byId.get(item.alt);
      sheets.push({ type: 'material', material, alt, kind: material.kind, note: item.note || '', source: item,
        title: alt ? shortName(material) + ' + ' + shortName(alt) : shortName(material) });
    }
    if (!shape.parts) {
      return [
        { type: 'base', kind: 'base', title: structure.base || 'Металл кузова', text: structure.baseText || 'Металл кузова — основа, на которую укладывают слои.' },
        ...sheets,
        { type: 'cover', kind: 'cover', title: structure.cover || 'Обшивка', text: structure.coverText || 'Штатная обшивка закрывает материалы.' }
      ];
    }
    const guess = shape.place(sheets.map(sheet => ({ kind: sheet.material.kind, alt: Boolean(sheet.alt), altKind: sheet.alt?.kind })));
    const known = value => (Array.isArray(value) ? value : [value]).filter(id => typeof id === 'string' && Object.hasOwn(shape.areas, id));
    const laid = new Map();
    sheets.forEach((sheet, index) => {
      const on = known(sheet.source.on);
      const altOn = known(sheet.source.altOn);
      const spots = [{ material: sheet.material, areas: on.length ? on : guess[index].on }];
      if (sheet.alt) spots.push({ material: sheet.alt, areas: (altOn.length ? altOn : guess[index].altOn || []).filter(id => !spots[0].areas.includes(id)) });
      sheet.spots = spots.filter(spot => spot.areas.length);
      sheet.host = shape.areas[sheet.spots[0].areas[0]].part;
      const part = shape.parts.find(item => item.id === sheet.host);
      sheet.hostType = part.type;
      // Words for the list: where each material of the sheet lies.
      sheet.where = sheet.spots.map(spot => {
        const areas = spot.areas.map(id => shape.areas[id]);
        const below = [...new Set(spot.areas.map(id => laid.get(id) || ''))];
        const whole = areas.every(area => area.part === part.id) &&
          Object.values(shape.areas).filter(area => area.part === part.id).length === areas.length;
        spot.level = Math.max(0, ...spot.areas.map(id => laid.get(id + ':count') || 0));
        let text;
        if (sheet.spots.length > 1) text = listed(areas.map(area => area.name));
        else if (below.length === 1 && below[0]) {
          text = 'поверх ' + below[0] + (areas.length === 1 ? (areas[0].over ? ', ' + areas[0].over : '') : whole ? ', по всей площади' : ': ' + listed(areas.map(area => area.name)));
        } else if (areas.length === 1) text = areas[0].where;
        else text = whole && part.whole ? part.whole : listed(areas.map(area => area.name));
        return { material: spot.material, text };
      });
      for (const spot of sheet.spots) {
        for (const id of spot.areas) {
          laid.set(id, shortName(spot.material));
          laid.set(id + ':count', (laid.get(id + ':count') || 0) + 1);
        }
      }
    });
    const stack = [];
    const firstBase = shape.parts.find(part => part.type === 'base');
    for (const part of shape.parts) {
      const custom = structure.parts?.[part.id];
      const own = part.type === 'cover' ? [structure.cover, structure.coverText] : part === firstBase ? [structure.base, structure.baseText] : [custom?.title, custom?.text];
      const item = { type: part.type, kind: part.type, part: part.id, title: own[0] || part.title, text: own[1] || part.text };
      const glued = sheets.filter(sheet => sheet.host === part.id);
      if (part.type === 'cover') stack.push(...glued, item); else stack.push(item, ...glued);
    }
    return stack;
  }

  // Distance between the sheets of an opened stack. A sheet stays close to the part it is glued to,
  // parts of the body stand apart, and a sheet glued to the back of the trim keeps to the trim.
  function spread(stack) {
    let position = 0;
    return stack.map((layer, index) => {
      const before = stack[index - 1];
      if (before) {
        const group = item => item.host || item.part;
        if (!group(layer) || !group(before)) position += 1;
        else if (group(layer) !== group(before)) position += 1.75;
        else position += layer.type === 'cover' || layer.hostType === 'cover' ? .75 : 1;
      }
      return position;
    });
  }

  // ── The opened stack on the screen ───────────────────────────────────────────────────────────────────
  // The drawing keeps 4:3 inside the box of a sheet. A point of the 400×300 field in percent of a box width × height.
  function fieldToBox([x, y], width, height) {
    const ratio = width > 0 && height > 0 ? width / height * 3 / 4 : 1;
    const [w, h] = ratio > 1 ? [1 / ratio, 1] : [1, ratio];
    return [(1 - w) * 50 + x / 4 * w, (1 - h) * 50 + y / 3 * h];
  }
  // Rotations of a view in the order CSS applies them to a point: 'rotateX(57deg) rotateZ(-31deg)' turns around Z, then X.
  const turnsOf = view => [...String(view).matchAll(/rotate([XYZ])\(\s*(-?[\d.]+)deg\s*\)/g)].reverse()
    .map(([, axis, angle]) => [axis, Math.cos(angle * Math.PI / 180), Math.sin(angle * Math.PI / 180)]);
  function turn(turns, [x, y, z]) {
    for (const [axis, cos, sin] of turns) {
      if (axis === 'X') [y, z] = [y * cos - z * sin, y * sin + z * cos];
      else if (axis === 'Y') [x, z] = [x * cos + z * sin, z * cos - x * sin];
      else [x, y] = [x * cos - y * sin, x * sin + y * cos];
    }
    return [x, y, z];
  }
  // Where a point of a sheet lands on the stage: [x, y, scale].
  // frame: { box: [left, top, width, height] of the scene, eye: [x, y, distance] of the perspective, turns }
  // point — px from the corner of the box; shift — [x, y, z] of the sheet in the stack; toward — px to the viewer.
  function project(frame, [px, py], [sx, sy, sz] = [0, 0, 0], toward = 0) {
    const [left, top, width, height] = frame.box;
    const [x, y, z] = turn(frame.turns, [px + sx - width / 2, py + sy - height / 2, sz]);
    const [ex, ey, distance] = frame.eye;
    const scale = distance / (distance - z - toward);
    return [ex + (left + width / 2 + x - ex) * scale, ey + (top + height / 2 + y - ey) * scale, scale];
  }
  // Where a sheet stands in the opened stack. step: [dx, dz, mid, dy] — px per place sideways and towards the viewer, the
  // place that stays where the scene box is (a sideways fan opens both ways from its middle) and px per place down (the door). NEAR px between neighbours
  // repeat the rule of layers.css.
  const NEAR = 5;
  const shiftOf = ([dx, dz, mid = 0, dy = 0], place, index) => [(place - mid) * dx, (place - mid) * dy, (place - mid) * dz + index * NEAR];
  // Screen box of the opened stack. sheets: [{ rect: [x0, y0, x1, y1] px in the scene box, p: place in the stack, i }].
  function extent(frame, sheets, step) {
    const box = [Infinity, Infinity, -Infinity, -Infinity];
    sheets.forEach(({ rect: [x0, y0, x1, y1], p, i }, index) => {
      for (const corner of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
        const [x, y] = project(frame, corner, shiftOf(step, p, i ?? index));
        box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y);
      }
    });
    return box;
  }
  // The widest fan that stays inside «room» [left, top, right, bottom] of the stage: a share (least…1) of the step stepOf(1).
  // A sideways fan is centred in the room: its scene box moves. A fan that opens upwards only has to stay under the top
  // of the room. Returns { share, frame, box, fits }.
  function fitFan(frame, sheets, stepOf, room, side, least = .3) {
    const lay = share => {
      const step = stepOf(share);
      let placed = frame;
      let box = extent(placed, sheets, step);
      for (let pass = 0; side && pass < 4; pass++) {
        const [left, top, ...size] = placed.box;
        placed = { ...placed, box: [left + (room[0] + room[2] - box[0] - box[2]) / 2, top + (room[1] + room[3] - box[1] - box[3]) / 2, ...size] };
        box = extent(placed, sheets, step);
      }
      const fits = box[1] >= room[1] && (!side || (box[0] >= room[0] && box[2] <= room[2] && box[3] <= room[3]));
      return { share, frame: placed, box, fits };
    };
    let best = lay(1);
    if (best.fits) return best;
    best = lay(least);
    for (let low = least, high = 1, pass = 0; best.fits && pass < 10; pass++) {
      const next = lay((low + high) / 2);
      if (next.fits) { low = next.share; best = next; } else high = next.share;
    }
    return best;
  }
  // Is a point inside a sheet on the screen? quad — four corners of the sheet in order: the projection keeps it convex.
  function within(quad, [x, y]) {
    let sign = 0;
    return quad.every(([ax, ay], index) => {
      const [bx, by] = quad[(index + 1) % quad.length];
      const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
      if (!cross) return true;
      if (sign && Math.sign(cross) !== sign) return false;
      sign = Math.sign(cross);
      return true;
    });
  }
  // Labels pushed apart on the stage. boxes: [{ at: [x, y] of the centre, size: [w, h], fixed }]; a fixed box (a number) stays,
  // every other box takes the free place nearest to its own — at its point or right above, below or beside a box placed
  // before it — and stays inside «room» [left, top, right, bottom]. With no free place it takes the one that covers the least.
  // Returns the shift [x, y] of every box.
  function settle(boxes, room, gap = 4) {
    const placed = [];
    return boxes.map(({ at: [cx, cy], size: [w, h], fixed }) => {
      let spot = [cx, cy];
      if (!fixed) {
        const covered = ([x, y]) => placed.reduce((sum, other) => sum +
          Math.max(0, (other.w + w) / 2 + gap - Math.abs(other.x - x)) * Math.max(0, (other.h + h) / 2 + gap - Math.abs(other.y - y)), 0);
        const rank = ([x, y]) => covered([x, y]) * 1e3 + Math.hypot(x - cx, y - cy);
        spot = [[cx, cy], ...placed.flatMap(other => {
          const [aside, apart] = [(other.w + w) / 2 + gap, (other.h + h) / 2 + gap];
          return [[cx, other.y - apart], [cx, other.y + apart], [other.x - aside, cy], [other.x + aside, cy]];
        })].map(([x, y]) => [Math.max(room[0] + w / 2, Math.min(room[2] - w / 2, x)), Math.max(room[1] + h / 2, Math.min(room[3] - h / 2, y))])
          .reduce((best, next) => rank(next) < rank(best) ? next : best);
      }
      placed.push({ x: spot[0], y: spot[1], w, h });
      return [spot[0] - cx, spot[1] - cy];
    });
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
    let places = [];
    let labels = [];
    let quads = [];
    let tallest = { p: 0, i: 0 };
    let view = '';
    let active = -1;
    let peek = -1;
    let peekTimer = 0;
    let waitTimer = 0;
    let seats = [];
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

    const stackOf = selected => plan(current.shape, current.zone.structure, selected.layers, byId);

    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    // The colour of a sheet next to its name: the print of the sheet shows in the middle, so two dark sheets differ.
    function swatch(material) {
      const dot = el('i', 'ly-swatch');
      if (colorOk(material.color)) dot.style.setProperty('--ly-ink', material.color);
      const printed = { print: true, foil: true, felt: true, membrane: true }[material.texture || 'print'];
      if (printed && colorOk(material.print)) { dot.style.setProperty('--ly-print', material.print); dot.dataset.print = ''; }
      return dot;
    }

    // Names of the materials on the drawing: one for a plain sheet, one on every area for a sheet of two materials.
    // «at» of an area is a point of the drawing as it is seen: the lift of a raised piece is already in it.
    function labelsOf(layer) {
      if (!layer.spots || !current.shape.areas) return [];
      return layer.spots.flatMap(spot => (layer.spots.length > 1 ? spot.areas : spot.areas.slice(0, 1)).map(id => {
        const at = current.shape.areas[id].at;
        if (!Array.isArray(at)) return null;
        const node = el('span', 'ly-label');
        node.append(swatch(spot.material), shortName(spot.material));
        return { node, at };
      })).filter(Boolean);
    }

    function buildScene(animate) {
      clearTimers();
      // On narrow screens every stack opens upwards: a sideways fan would make the sheets too small.
      const fan = compact.matches ? 'up' : current.shape.fan;
      const own = fan === current.shape.fan;
      view = own ? current.shape.view : 'rotateX(55deg) rotateZ(-28deg)';
      const badge = own ? current.shape.badge : [97, 84];
      scene.style.setProperty('--ly-view', view);
      scene.style.setProperty('--ly-billboard', invert(view));
      scene.dataset.shape = current.zone.structure?.shape || 'door';
      scene.dataset.fan = fan;
      // The door keeps the places of its own: three assemblies stand apart («positions» of the shape).
      places = current.shape.positions?.(layers) || spread(layers);
      labels = layers.map(labelsOf);
      scene.replaceChildren(...layers.map((layer, index) => {
        const node = el('div', 'ly-layer');
        node.style.setProperty('--i', index);
        node.style.setProperty('--p', places[index].toFixed(2));
        node.style.setProperty('--n', layers.length);
        node.dataset.type = layer.type;
        // A sheet glued to a single area may keep its number on that area.
        const areas = layer.spots?.flatMap(spot => spot.areas) || [];
        const spot = own && areas.length === 1 && current.shape.areas[areas[0]].badge;
        const [x, y] = Array.isArray(spot) ? spot : badge;
        const number = el('span', 'ly-badge', String(index + 1));
        if (Array.isArray(spot)) number.dataset.area = areas[0];
        number.style.left = x + '%';
        number.style.top = y + '%';
        node.append(layerArt(current.shape, layer, index, layers.length), number, ...labels[index].map(label => label.node));
        return node;
      }));
      layout();
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

    // Everything that depends on the size of the stage: the step of the fan, the height of the stage for a long stack,
    // names and numbers on the drawing. The fan always fits the stage: fewer sheets spread wider.
    function layout() {
      const side = scene.dataset.fan !== 'up';
      const steps = Math.max(1, places.at(-1));
      const nodes = [...scene.children];
      const numbers = nodes.map(node => node.querySelector('.ly-badge'));
      stage.style.aspectRatio = stage.style.perspective = '';
      scene.style.setProperty('--ly-x', '0px');
      scene.style.setProperty('--ly-y', '0px');
      // The fan as it was drawn before the stage could be measured; zones drawn as plain sheets keep it while it fits.
      const budget = current.shape.spread || (current.shape.parts ? 0 : 104);
      const [, share] = current.shape.box || [3, 46];
      // A sideways fan of body parts opens both ways from its middle: collected, the stack stands in the middle of the stage.
      const mid = side && current.shape.parts ? places.at(-1) / 2 : 0;
      // Places on one side of that middle: «spread» of such a shape is a half of its fan.
      const span = steps - mid;
      let dx = side ? Math.min(24, budget ? budget / span : 24) : 0;
      let dz = side ? 22 : compact.matches ? 46 : 60;
      // The door also steps down along its beams: a share of the step aside.
      const drop = side ? current.shape.drop || 0 : 0;
      scene.style.setProperty('--mid', mid.toFixed(3));
      const reach = share * (1 + span * dx / 100);
      const left = Math.max(0, Math.min(100 - reach, 49 - reach / 2));
      scene.style.left = side ? left.toFixed(1) + '%' : '';
      scene.style.right = side ? (100 - left - share).toFixed(1) + '%' : '';
      scene.style.top = scene.style.bottom = '';
      const frameOf = () => {
        const style = getComputedStyle(stage);
        const [x, y] = style.perspectiveOrigin.split(' ').map(parseFloat);
        return { box: [scene.offsetLeft, scene.offsetTop, scene.offsetWidth, scene.offsetHeight], eye: [x, y, parseFloat(style.perspective) || 1500], turns: turnsOf(view) };
      };
      let frame = frameOf();
      const [width, height] = frame.box.slice(2);
      const measured = width > 0 && height > 0 && nodes.length > 0;
      let arts = [];
      const at = point => { const [x, y] = fieldToBox(point, width, height); return [x * width / 100, y * height / 100]; };
      const spot = number => [parseFloat(number.style.left) * width / 100, parseFloat(number.style.top) * height / 100];
      if (measured) {
        const edge = numbers[0].offsetWidth / 2 + 2;
        const room = [edge, 8, stage.offsetWidth - edge, stage.offsetHeight - 4];
        // What a sheet takes in the scene box: its drawing and its number.
        const sheets = nodes.map((node, index) => {
          let art = null;
          try { art = node.querySelector('.ly-art > g')?.getBBox(); } catch { /* not rendered yet */ }
          const [x0, y0] = at(art?.width ? [art.x, art.y] : [0, 0]);
          const [x1, y1] = at(art?.width ? [art.x + art.width, art.y + art.height] : [400, 300]);
          const [x, y] = spot(numbers[index]);
          return { p: places[index], art: [x0, y0, x1, y1], rect: [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)] };
        });
        arts = sheets.map(sheet => sheet.art);
        let origin = frame.box;
        if (side) {
          const step = part => [dx * width / 100 * part, dz, mid, dx * drop * height / 100 * part];
          // A deep fan is seen from farther away, or its far sheets would look much smaller than the near ones.
          const eye = Math.max(frame.eye[2], turn(frame.turns, shiftOf([step(1)[0], dz], places.at(-1), nodes.length - 1))[2] * 5);
          if (eye > frame.eye[2]) { frame.eye[2] = eye; stage.style.perspective = eye.toFixed(0) + 'px'; }
          const box = extent(frame, sheets, step(1));
          if (current.shape.parts || box[0] < room[0] || box[1] < room[1] || box[2] > room[2] || box[3] > room[3]) {
            const wide = fitFan(frame, sheets, step, room, true);
            dx *= wide.share;
            frame = wide.frame;
          }
        } else {
          // A long stack gets a taller stage; the sheets keep their size and stand on its bottom.
          // Every kit of the zone opens in the same stage: the tallest of them decides.
          const base = stage.offsetHeight;
          const rect = sheets[0].rect;
          for (let pass = 0, grow = 0; pass < 4; pass++) {
            const top = extent(frameOf(), [{ p: 0, i: 0, rect }, { ...tallest, rect }], [0, compact.matches ? 40 : 52])[1];
            if (top >= room[1] - .5) break;
            grow = Math.round(Math.min(stage.offsetWidth * (compact.matches ? .55 : .2), grow + room[1] - top));
            stage.style.aspectRatio = stage.offsetWidth + ' / ' + (base + grow);
            scene.style.top = frame.box[1] + grow + 'px';
            scene.style.bottom = base - frame.box[1] - height + 'px';
          }
          frame = frameOf();
          room[3] = stage.offsetHeight - 4;
          origin = frame.box;
          dz *= fitFan(frame, sheets, part => [0, dz * part], room, false).share;
          // Upper sheets come closer and grow: the stack moves aside if their numbers reach the edge of the stage.
          const box = extent(frame, sheets, [0, dz]);
          const aside = box[2] > room[2] ? Math.max(room[2] - box[2], Math.min(0, room[0] - box[0])) : box[0] < room[0] ? Math.min(room[0] - box[0], Math.max(0, room[2] - box[2])) : 0;
          frame = { ...frame, box: [origin[0] + aside, ...origin.slice(1)] };
        }
        scene.style.setProperty('--ly-x', (frame.box[0] - origin[0]).toFixed(1) + 'px');
        scene.style.setProperty('--ly-y', (frame.box[1] - origin[1]).toFixed(1) + 'px');
      }
      scene.style.setProperty('--dx', dx.toFixed(2) + '%');
      scene.style.setProperty('--dz', dz.toFixed(1) + 'px');
      quads = [];
      seats = [];
      if (!measured) return;
      // Names and numbers face the viewer while their sheet leans away: --clear brings a mark standing on the drawing
      // in front of its own sheet. A sheet glued to the back of the trim shows through it: --pop brings its marks in front
      // of the trim, and «drift» takes them back to their place, or the perspective would move them aside.
      const [leanX, leanY, leanZ] = turn(frame.turns, [0, 0, 1]).map(Math.abs);
      const lean = Math.max(.3, leanZ);
      const room = [6, 6, stage.offsetWidth - 6, stage.offsetHeight - 6];
      const mark = (node, point, shift, pop, onSheet) => {
        const clear = onSheet ? (leanX * node.offsetWidth + leanY * node.offsetHeight) / 2 / lean + 3 : 0;
        node.style.setProperty('--clear', clear.toFixed(1) + 'px');
        const [x, y] = project(frame, point, shift, clear);
        const [nearX, nearY, scale] = project(frame, point, shift, clear + pop);
        return { node, at: [x, y], drift: [nearX - x, nearY - y], scale, size: [node.offsetWidth * scale, node.offsetHeight * scale] };
      };
      const shifts = nodes.map((node, index) => shiftOf([dx * width / 100, dz, mid, dx * drop * height / 100], places[index], index));
      const pops = nodes.map((node, index) => {
        const cover = layers[index].hostType === 'cover' ? layers.findIndex(layer => layer.part === layers[index].host) : -1;
        return cover > index ? ((places[cover] - places[index]) * dz + (cover - index) * NEAR) / lean + 10 : 0;
      });
      const stamps = numbers.map((number, index) => ({ ...mark(number, spot(number), shifts[index], pops[index], Boolean(number.dataset.area)), fixed: true }));
      // Numbers of sheets that stand close would overlap: such a number steps aside, towards the middle of the stage.
      // A zone may lay the numbers its own way (the door keeps them on the corners of its sheets): those stay as they are.
      const still = numbers[0].style.transition;
      numbers[0].style.transition = 'none';
      const seen = shift => { numbers[0].style.setProperty('--sx', shift); return getComputedStyle(numbers[0]).transform; };
      const loose = seen('0px') !== seen('40px');
      seen('0px');
      numbers[0].style.transition = still;
      stamps.forEach((stamp, index) => {
        const touch = (other, axis) => Math.abs(other.at[axis] - stamp.at[axis]) < (other.size[axis] + stamp.size[axis]) / 2 + 1;
        const hit = loose && stamps.slice(0, index).find(other => touch(other, 0) && touch(other, 1));
        const axis = hit && Math.abs(hit.at[0] - stamp.at[0]) > Math.abs(hit.at[1] - stamp.at[1]) ? 1 : 0;
        const move = hit ? (stamp.at[axis] > [stage.offsetWidth, stage.offsetHeight][axis] / 2 ? -1 : 1) * (stamp.size[axis] + 3) : 0;
        stamp.at = stamp.at.map((value, order) => order === axis ? value + move : value);
        stamp.node.style.setProperty('--sx', (axis ? 0 : move / stamp.scale).toFixed(1) + 'px');
        stamp.node.style.setProperty('--sy', (axis ? move / stamp.scale : 0).toFixed(1) + 'px');
      });
      seats = stamps.map(stamp => stamp.at);
      nodes.forEach((node, index) => {
        node.style.setProperty('--pop', pops[index].toFixed(1) + 'px');
        // Where the sheet is on the screen: the pointer stays with the shown sheet while it is over it.
        const [x0, y0, x1, y1] = arts[index];
        quads.push([[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(corner => project(frame, corner, shifts[index]).slice(0, 2)));
        // Names keep clear of every number of the stack and of each other.
        const names = labels[index].map(label => {
          const point = at(label.at);
          label.node.style.left = (point[0] / width * 100).toFixed(2) + '%';
          label.node.style.top = (point[1] / height * 100).toFixed(2) + '%';
          return mark(label.node, point, shifts[index], pops[index], true);
        });
        const boxes = [stamps[index], ...stamps.filter((stamp, order) => order !== index), ...names];
        settle(boxes, room).forEach(([x, y], order) => {
          const box = boxes[order];
          if (box.fixed && box !== stamps[index]) return;
          box.node.style.setProperty('--nx', ((x - box.drift[0]) / box.scale).toFixed(1) + 'px');
          box.node.style.setProperty('--ny', ((y - box.drift[1]) / box.scale).toFixed(1) + 'px');
        });
      });
    }

    // What a screen reader hears about a layer: its kind and where every material of it lies.
    function spoken(layer) {
      const kind = (kinds[layer.kind] || kinds.other).toLocaleLowerCase('ru');
      if (!layer.where?.length) return layer.title + ' — ' + kind + '.';
      return layer.title + ' — ' + kind + ': ' + layer.where.map(spot => (layer.where.length > 1 ? shortName(spot.material) + ' — ' : '') + spot.text).join('; ') + '.';
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
        item.dataset.type = layer.type;
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
        if (layer.where?.length) {
          // Where the sheet is glued: one line per material of the sheet.
          const where = el('span', 'ly-item-where');
          for (const spot of layer.where) {
            const line = el('span', 'ly-where');
            if (layer.where.length > 1) {
              line.classList.add('is-named');
              line.append(swatch(spot.material), el('b', '', shortName(spot.material)), ' — ');
            }
            line.append(spot.text);
            where.append(line);
          }
          button.append(where);
        }
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
        button.addEventListener('click', () => pin(active === index ? -1 : index));
        button.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') peekAt(index); });
        button.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') peekAt(-1); });
        item.append(button, panel);
        return item;
      }));
    }

    // The drawing shows the layer under the mouse, or else the one chosen by a click.
    // It stays lit with the part it is glued to; sheets below dim, everything laid above turns into a ghost.
    function show() {
      const shown = peek >= 0 ? peek : active;
      const host = layers[shown]?.host;
      [...scene.children].forEach((node, index) => {
        node.classList.toggle('is-active', index === shown);
        node.classList.toggle('is-host', Boolean(host) && layers[index].part === host);
        node.classList.toggle('is-above', shown >= 0 && index > shown);
        // The number of a sheet laid above would hang over the shown sheet: it hides while the sheet below is looked at.
        node.classList.toggle('is-over', open && shown >= 0 && index > shown && Boolean(quads[shown] && seats[index]) && within(quads[shown], seats[index]));
      });
      scene.classList.toggle('has-active', shown >= 0);
      [...list.children].forEach((item, index) => {
        item.classList.toggle('is-peek', index === shown && index !== active);
        item.classList.toggle('is-host', Boolean(host) && layers[index].part === host);
      });
    }

    // A click chooses a layer: its text opens in the list, a collected stack opens up.
    function pin(index) {
      active = index;
      [...list.children].forEach((item, i) => {
        const selected = i === index;
        item.classList.toggle('is-active', selected);
        item.querySelector('button').setAttribute('aria-expanded', String(selected));
        item.querySelector('.ly-panel').hidden = !selected;
      });
      if (index >= 0 && !open) setOpen(true);
      show();
    }

    // The mouse only looks at a layer. Leaving waits a moment, so crossing from sheet to sheet does not blink.
    function peekAt(index) {
      if (index >= 0) {
        clearTimeout(peekTimer);
        peekTimer = 0;
        if (peek !== index) { peek = index; show(); }
      } else if (peek >= 0 && !peekTimer) peekTimer = setTimeout(() => { peekTimer = 0; peek = -1; show(); }, 90);
    }

    // The sheet drawn under the pointer. The sheets do not move when one is chosen, so the answer depends on the place alone.
    const under = event => [...scene.children].indexOf(event.target.closest?.('.ly-layer'));

    // The mouse looks at the sheet under it. While it is still over the shown sheet — over an opening in it or between
    // its pieces — a sheet seen there takes the pointer only when the mouse stops on it: crossing an opening changes nothing.
    function look(event) {
      const index = under(event);
      const shown = peek >= 0 ? peek : active;
      const box = stage.getBoundingClientRect();
      const inside = open && shown >= 0 && index < shown && quads[shown] && within(quads[shown], [event.clientX - box.left, event.clientY - box.top]);
      clearTimeout(waitTimer);
      if (!inside) peekAt(index);
      else if (index >= 0) waitTimer = setTimeout(() => peekAt(index), 260);
    }

    function setOpen(value) {
      open = value;
      stage.dataset.phase = open ? 'open' : 'closed';
      toggle.textContent = open ? 'Собрать слои' : 'Разобрать слои';
      toggle.setAttribute('aria-pressed', String(!open));
      show();
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
      const kits = current.rates.map(item => spread(stackOf(item)));
      tallest = { p: Math.max(...kits.map(list => list.at(-1))), i: Math.max(...kits.map(list => list.length)) - 1 };
      clearTimeout(peekTimer);
      clearTimeout(waitTimer);
      peekTimer = 0;
      active = peek = -1;
      renderList();
      buildScene(animate && seen);
      show();
      renderSummary();
      renderGallery();
      live.textContent = current.zone.title + ', ' + rate.title + '. ' + layers.map((layer, index) => (index + 1) + '. ' + spoken(layer)).join(' ');
    }

    toggle.addEventListener('click', () => setOpen(!open));
    stage.addEventListener('pointermove', event => { if (event.pointerType === 'mouse') look(event); });
    stage.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'mouse') return;
      clearTimeout(waitTimer);
      peekAt(-1);
    });
    // A click chooses the sheet under the pointer; a click on the chosen sheet or past the sheets lets it go.
    stage.addEventListener('click', event => {
      const index = under(event);
      pin(index >= 0 && index !== active ? index : -1);
    });
    list.addEventListener('keydown', event => { if (event.key === 'Escape' && active >= 0) pin(-1); });
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
        show();
      }, { threshold: .35 });
      observer.observe(stage);
    } else seen = true;
    reduced.addEventListener('change', () => { buildScene(false); show(); });
    compact.addEventListener('change', () => { buildScene(false); show(); });
    // The stage changes its width with the window: the fan and the names follow.
    if ('ResizeObserver' in window) {
      let known = stage.offsetWidth;
      new ResizeObserver(() => {
        if (stage.offsetWidth === known) return;
        known = stage.offsetWidth;
        layout();
      }).observe(stage);
    }
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
  window.StudioLayerArt = { shapes, kinds, buildDefs, layerArt, plan, spread, fieldToBox, turnsOf, project, extent, fitFan, within, settle, textures: ['foil', 'print', 'felt', 'wave', 'eggcrate', 'membrane', 'gloss'] };
  Promise.resolve(window.STUDIO_READY ?? true).then(ready => { if (ready) mount(); });
})();
