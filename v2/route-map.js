(() => {
  'use strict';

  // The scheme follows the studio's arrival video: the road with ТЦ «Сомбреро» on the right, the gate under
  // «Автомойка · Детейлинг» with the green «Въезд» light, the ramp to level −1, the doors, the barrier and the row
  // of boxes with the studio as the last one on the left. Proportions are schematic, landmarks and their order are real.
  const diamonds = ['#7b4fd6', '#e0388f', '#d8343b', '#2f7fe0', '#f3f1f7', '#7b4fd6', '#e0388f', '#2f7fe0', '#d8343b', '#f3f1f7',
    '#7b4fd6', '#e0388f', '#d8343b', '#2f7fe0', '#f3f1f7', '#7b4fd6', '#e0388f', '#2f7fe0', '#d8343b', '#f3f1f7', '#7b4fd6', '#e0388f'];
  // Traffic keeps to the right: lane centres on Варшавское шоссе (two lanes each way) and in the aisle of level −1.
  const lane = { west: 128.5, westFast: 141.3, eastFast: 155.5, east: 167.8, aisleIn: 273, aisleOut: 247 };
  const arrow = (x, y, angle, turn = '') => `<g transform="translate(${x} ${y}) rotate(${angle})" class="rm-arrow"><path d="M-9 0H6"/>${turn}<path d="M9 0L4-3.4V3.4Z" class="rm-arrow-head"/></g>`;
  // A straight-and-right arrow: the branch turns to the driver's right (+y in the arrow's own frame).
  const turnRight = '<path d="M-2 0Q3 0 3 5.5"/><path d="M3 9L.2 4.6H5.8Z" class="rm-arrow-head"/>';
  const scheme = `
    <svg class="route-drawing" viewBox="0 0 600 404" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="rm-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 4H8" class="rm-hatch-line"/></pattern>
        <pattern id="rm-concrete" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="5" r=".7" class="rm-dot"/><circle cx="9" cy="10" r=".5" class="rm-dot"/></pattern>
        <pattern id="rm-shutter" width="10" height="5" patternUnits="userSpaceOnUse"><path d="M0 4.5H10" class="rm-shutter-line"/></pattern>
        <pattern id="rm-checker" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#f4f4f6"/><rect width="3" height="3" fill="#18171c"/><rect x="3" y="3" width="3" height="3" fill="#18171c"/></pattern>
        <linearGradient id="rm-ramp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="rm-ramp-top"/><stop offset="1" class="rm-ramp-bottom"/></linearGradient>
        <g id="rm-car"><rect x="-7" y="-12" width="14" height="24" rx="4.5" class="rm-parked"/><path d="M-5-6h10l-1 4h-8zM-5 6h10l-1-3h-8z" class="rm-parked-glass"/></g>
        <path id="route-above-path" d="M612 ${lane.west}H292C262 ${lane.west} 236 124 236 106V90"/>
        <path id="route-below-path" d="M-12 229C60 229 78 ${lane.aisleIn} 132 ${lane.aisleIn}H484C512 ${lane.aisleIn} 524 263 524 246V222"/>
      </defs>

      <rect width="600" height="178" class="rm-ground"/>
      <path d="M0 0H178V64Q150 76 112 74L0 82Z" class="rm-green"/>
      <path d="M0 96H182V118H0Z" class="rm-green"/>
      <g class="rm-trees">
        <circle cx="22" cy="28" r="10"/><circle cx="58" cy="18" r="12"/><circle cx="96" cy="34" r="11"/><circle cx="136" cy="22" r="10"/><circle cx="40" cy="58" r="9"/>
        <circle cx="16" cy="107" r="8"/><circle cx="52" cy="108" r="8"/><circle cx="88" cy="107" r="8"/><circle cx="124" cy="108" r="8"/><circle cx="160" cy="107" r="8"/>
      </g>
      <rect x="-10" y="122" width="620" height="52" class="rm-road"/>
      <path d="M-10 122H610M-10 174H610" class="rm-curb"/>
      <path d="M-10 147.2H610M-10 149.4H610" class="rm-median"/>
      <path d="M-10 135H112M164 135H610M-10 161H112M164 161H610" class="rm-lane"/>
      <g class="rm-zebra"><path d="M120 125V145M128 125V145M136 125V145M144 125V145M152 125V145M160 125V145M120 151V171M128 151V171M136 151V171M144 151V171M152 151V171M160 151V171"/></g>
      <path d="M168 123.5V146.5M112 150V172.5" class="rm-stop-line"/>
      <g class="rm-arrows">
        ${arrow(352, lane.west, 180, turnRight)}${arrow(470, lane.westFast, 180)}${arrow(220, lane.westFast, 180)}
        ${arrow(258, lane.eastFast, 0)}${arrow(420, lane.east, 0)}${arrow(60, lane.east, 0)}
      </g>
      <g class="rm-traffic" data-traffic>
        <use href="#rm-car" data-lane="${lane.westFast}" data-dir="-1" data-at="470"/>
        <use href="#rm-car" data-lane="${lane.eastFast}" data-dir="1" data-at="300"/>
        <use href="#rm-car" data-lane="${lane.east}" data-dir="1" data-at="40"/>
        <use href="#rm-car" data-lane="${lane.east}" data-dir="1" data-at="440"/>
      </g>
      <g class="rm-road-tag"><rect x="494" y="${lane.east - 6.5}" width="100" height="13" rx="3"/><text x="544" y="${lane.east + 4.3}" text-anchor="middle" class="rm-road-name">Варшавское ш.</text></g>
      <path d="M186 98H600V122H186Z" class="rm-lot"/>
      <path d="M210 122V98" class="rm-lot-edge"/>
      <g class="rm-lot-marks"><path d="M300 100V112M326 100V112M352 100V112M378 100V112M404 100V112M430 100V112M456 100V112M482 100V112M508 100V112"/></g>
      <g class="rm-parked-row"><use href="#rm-car" transform="translate(313 106) rotate(90) scale(.78)"/><use href="#rm-car" transform="translate(365 106) rotate(90) scale(.78)"/><use href="#rm-car" transform="translate(443 106) rotate(90) scale(.78)"/><use href="#rm-car" transform="translate(495 106) rotate(90) scale(.78)"/></g>
      <path d="M282 8H566Q590 8 590 32V84H282Q252 84 252 46Q252 8 282 8Z" class="rm-roof"/>
      <path d="M282 14H564Q584 14 584 34V78H282Q258 78 258 46Q258 14 282 14Z" fill="url(#rm-hatch)" class="rm-roof-texture"/>
      <path d="M252 46Q252 84 282 84H590V98H282Q252 96 252 64Z" class="rm-facade"/>
      <g class="rm-diamonds">${diamonds.map((color, i) => `<rect x="${290 + i * 13}" y="87" width="6.4" height="6.4" transform="rotate(45 ${293.2 + i * 13} 90.2)" fill="${color}"/>`).join('')}</g>
      <path d="M594 30l10 8-10 8 10 8-10 8 10 8" class="rm-stairs"/>
      <text x="384" y="52" class="rm-place">ТЦ «Сомбреро»</text>
      <rect x="186" y="54" width="68" height="44" rx="2" class="rm-block"/>
      <rect x="191" y="78" width="25" height="20" class="rm-gate"/><rect x="222" y="78" width="27" height="20" class="rm-gate"/>
      <rect x="196" y="72" width="12" height="3.4" rx="1" class="rm-exit-light"/><rect x="226" y="72" width="18" height="3.4" rx="1" class="rm-entry-light"/>
      <path d="M229 112l6.5-7 6.5 7" class="rm-entry-chevron"/><path d="M197 104l6.5 7 6.5-7" class="rm-exit-chevron"/>
      <text x="220" y="66" text-anchor="middle" class="rm-block-label">Автомойка · Детейлинг</text>
      <g class="rm-callout"><path d="M164 72L224 74" /><rect x="118" y="63" width="46" height="18" rx="3"/><text x="141" y="76" text-anchor="middle">Въезд</text></g>
      <use href="#route-above-path" class="route-base"/>
      <use href="#route-above-path" class="route-trace route-trace-above" pathLength="100"/>
      <circle cx="600" cy="${lane.west}" r="4.5" class="route-start"/>

      <rect y="178" width="600" height="226" class="rm-underground"/>
      <rect y="178" width="600" height="226" fill="url(#rm-concrete)"/>
      <path d="M0 178H600" class="rm-level-line"/>
      <g class="rm-pipes"><path d="M150 184H600M150 188H600"/></g>
      <path d="M-2 190C62 190 76 234 132 234V286C70 286 56 242 -2 242Z" fill="url(#rm-ramp)" class="rm-ramp"/>
      <path d="M-2 216C66 216 76 260 132 260" class="rm-ramp-line"/>
      <path d="M16 225l6 4-6 4M36 228l6 4.6-6.4 3.4M56 238l5 5.4-7 2.6M74 252l3 6.4-7.4 1.6" class="rm-chevrons"/>
      <rect x="132" y="234" width="430" height="52" class="rm-aisle"/>
      <path d="M137 260H560" class="rm-aisle-line"/>
      <path d="M560 234H600V404H560Z" class="rm-aisle"/>
      <path d="M580 290V404" class="rm-aisle-line"/>
      <g class="rm-boxes-north">
        <rect x="214" y="208" width="54" height="26"/><rect x="270" y="208" width="54" height="26"/><rect x="326" y="208" width="54" height="26"/><rect x="382" y="208" width="54" height="26"/><rect x="438" y="208" width="54" height="26"/>
      </g>
      <g class="rm-boxes-south">
        <rect x="214" y="286" width="54" height="34"/><rect x="270" y="286" width="54" height="34"/><rect x="326" y="286" width="54" height="34"/><rect x="382" y="286" width="54" height="34"/><rect x="438" y="286" width="54" height="34"/><rect x="494" y="286" width="54" height="34"/>
      </g>
      <g class="rm-shutters"><path d="M218 230H264M274 230H320M330 230H376M386 230H432M442 230H488M218 290H264M274 290H320M330 290H376M386 290H432M442 290H488M498 290H544"/></g>
      <g class="rm-columns"><rect x="266" y="230" width="8" height="8"/><rect x="322" y="230" width="8" height="8"/><rect x="378" y="230" width="8" height="8"/><rect x="434" y="230" width="8" height="8"/><rect x="490" y="230" width="8" height="8"/>
        <rect x="266" y="282" width="8" height="8"/><rect x="322" y="282" width="8" height="8"/><rect x="378" y="282" width="8" height="8"/><rect x="434" y="282" width="8" height="8"/><rect x="490" y="282" width="8" height="8"/></g>
      <g class="rm-arrows rm-arrows-dark">
        ${arrow(300, lane.aisleIn, 0)}${arrow(420, lane.aisleIn, 0)}
        ${arrow(360, lane.aisleOut, 180)}${arrow(240, lane.aisleOut, 180)}
      </g>
      <path d="M178 262V284" class="rm-stop-line"/>
      <g class="rm-parked-below"><use href="#rm-car" transform="translate(353 304)" class="rm-taxi"/><use href="#rm-car" transform="translate(465 222) scale(.8)"/></g>
      <g class="rm-studio">
        <rect x="494" y="204" width="60" height="30" class="rm-studio-box"/>
        <rect x="500" y="211" width="48" height="23" fill="url(#rm-shutter)" class="rm-studio-shutter"/>
        <rect x="498" y="207" width="11" height="17" rx="1" class="rm-banner"/>
        <path d="M500 219l2-6 2 3 2-5 2 8" class="rm-banner-skyline"/>
        <g class="rm-pin"><path d="M566 198c-5 0-8.5 3.7-8.5 8.5 0 6 8.5 13 8.5 13s8.5-7 8.5-13c0-4.8-3.5-8.5-8.5-8.5Z"/><circle cx="566" cy="206.5" r="3"/></g>
      </g>
      <g class="rm-doors"><rect x="132" y="236" width="5" height="48"/><rect x="136" y="226" width="22" height="9" fill="url(#rm-checker)" class="rm-flag"/></g>
      <g class="rm-labels">
        <g class="rm-level-label"><rect x="14" y="350" width="108" height="25" rx="3"/><text x="23" y="368">Паркинг −1</text></g>
        <text x="40" y="306" class="rm-annotation">Спуск</text>
        <text x="150" y="342" class="rm-annotation">Шлагбаум</text><path d="M178 332l10-36" class="rm-pointer"/>
        <text x="482" y="202" text-anchor="end" class="rm-annotation rm-strong">Бокс студии</text>
      </g>
      <use href="#route-below-path" class="route-base route-base-dark"/>
      <use href="#route-below-path" class="route-trace route-trace-below" pathLength="100"/>
      <g class="rm-exit-boom"><path d="M196 236V258" class="rm-boom-shadow"/><path d="M196 236V258" class="rm-boom"/><path d="M196 236V258" class="rm-boom-stripes"/><rect x="191" y="228" width="10" height="9" rx="1.5" class="rm-boom-post"/></g>
      <g class="route-boom"><path d="M190 286V262" class="rm-boom-shadow"/><path d="M190 286V262" class="rm-boom"/><path d="M190 286V262" class="rm-boom-stripes"/></g>
      <rect x="185" y="284" width="10" height="9" rx="1.5" class="rm-boom-post"/>
      <g class="rm-call"><circle cx="210" cy="304" r="9"/><path d="M206.5 300.5c.6 2.8 2.6 5 5.4 6.3l1.6-1.6c.3-.3.7-.3 1 0l1.7 1.3c.4.3.4.8.1 1.1l-1 1.2c-.6.6-1.5.8-2.3.5-4-1.5-7-4.6-8.4-8.6-.3-.8-.1-1.7.5-2.3l1.2-1c.3-.3.8-.3 1.1.1l1.3 1.7c.3.3.3.7 0 1z"/></g>
      <g class="route-vehicle" transform="translate(600 ${lane.west})">
        <ellipse cx="0" cy="1" rx="17" ry="10" class="rv-shadow"/>
        <g class="rv-wheels"><rect x="-9" y="-8" width="6" height="3" rx="1"/><rect x="4" y="-8" width="5" height="3" rx="1"/><rect x="-9" y="5" width="6" height="3" rx="1"/><rect x="4" y="5" width="5" height="3" rx="1"/></g>
        <rect x="-13.5" y="-6.6" width="27" height="13.2" rx="4.8" class="rv-body"/>
        <path d="m-7-4.7 11-.3 3.4 2.1v5.2L4 5l-11-.3-2-2v-5.4Z" class="rv-roof"/><path d="m2-4.6 3.9 1.9v5.4L2 4.7zm-7 .2-2 1.5v5.8l2 1.4" class="rv-glass"/>
        <path d="M11-4v2m0 4v2" class="rv-lights"/>
        <path d="M-13.2-4.6v2.4M-13.2 2.2v2.4" class="rv-brake"/>
        <g class="rv-signal" data-side="left"><circle cx="10.5" cy="-6.4" r="1.9"/><circle cx="-11.5" cy="-6.4" r="1.9"/></g>
        <g class="rv-signal" data-side="right"><circle cx="10.5" cy="6.4" r="1.9"/><circle cx="-11.5" cy="6.4" r="1.9"/></g>
      </g>
    </svg>`;

  // Stage timing of the animation, in seconds. parked — the moment shown when a step is opened by hand.
  const timing = [
    { start: 0, end: 5.3, parked: 4.9 },
    { start: 5.3, end: 10.6, parked: 9.2 },
    { start: 10.6, end: 16.4, parked: 16.4 }
  ];

  const canonical = value => String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9]/gi, '');
  function fits(contacts) {
    const address = canonical(contacts.address).replace(/^г(?:ород)?москва|^москва/, '');
    const entrance = canonical(contacts.entrance);
    return /^варшавское(?:шоссе|ш)(?:дом|д)?152[аa]$/.test(address)
      && /паркинг/.test(entrance) && /(?:этаж1|1этаж)/.test(entrance)
      && /[−–-]\s*1|минус\s*(?:1|перв)/i.test(contacts.entrance || '');
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // options.steps — texts and photos of the steps; options.video(time) — opens the arrival video at a moment.
  function create(contacts, options = {}) {
    const page = window.StudioPage;
    const widget = page?.mapWidget?.(contacts) || '';
    const drawn = fits(contacts);
    if (!drawn && !widget) return null;
    const steps = (Array.isArray(options.steps) ? options.steps : []).slice(0, 3);
    const card = element('section', 'route-card');
    card.setAttribute('aria-labelledby', 'route-heading');
    const header = element('div', 'route-header');
    const heading = element('h3', 'route-heading-text', drawn ? 'Как доехать' : 'Карта');
    heading.id = 'route-heading';
    const tabs = element('div', 'route-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-labelledby', heading.id);
    const toggle = element('button', 'route-toggle');
    toggle.type = 'button';
    header.append(heading, tabs, toggle);
    card.append(header);

    const panels = [];
    function tab(id, label, panel) {
      const button = element('button', 'route-tab', label);
      button.type = 'button';
      button.id = 'route-tab-' + id;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', button.id);
      tabs.append(button);
      panels.push({ id, button, panel });
      button.addEventListener('click', () => show(id));
      button.addEventListener('keydown', event => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        const index = panels.findIndex(item => item.id === id);
        const next = panels[(index + (event.key === 'ArrowRight' ? 1 : panels.length - 1)) % panels.length];
        show(next.id);
        next.button.focus();
      });
    }

    let schemePanel = null;
    if (drawn) {
      schemePanel = element('div', 'route-panel route-scheme');
      schemePanel.id = 'route-scheme';
      schemePanel.innerHTML = scheme;
      card.append(schemePanel);
      tab('scheme', 'Схема', schemePanel);
    }
    let mapPanel = null;
    if (widget) {
      mapPanel = element('div', 'route-panel route-map');
      mapPanel.id = 'route-map';
      mapPanel.hidden = Boolean(drawn);
      card.append(mapPanel);
      tab('map', 'Яндекс Карта', mapPanel);
    }
    tabs.hidden = panels.length < 2;

    function loadMap() {
      if (!mapPanel || mapPanel.childElementCount) return;
      const frame = element('iframe', 'route-frame');
      frame.src = widget;
      frame.title = 'Студия на Яндекс Картах';
      frame.loading = 'lazy';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      const link = page?.contactUrl?.('map', contacts.map);
      mapPanel.append(frame);
      if (link) {
        const open = element('a', 'route-map-link', 'Открыть в Яндекс Картах');
        open.href = link;
        open.target = '_blank';
        open.rel = 'noopener noreferrer';
        mapPanel.append(open);
      }
    }

    let activeTab = panels[0].id;
    function show(id) {
      activeTab = id;
      for (const item of panels) {
        const selected = item.id === id;
        item.button.setAttribute('aria-selected', String(selected));
        item.button.tabIndex = selected ? 0 : -1;
        item.panel.hidden = !selected;
      }
      if (id === 'map') loadMap();
      if (drawn) updatePlayback();
    }

    if (!drawn) {
      toggle.hidden = true;
      show('map');
      return card;
    }

    const directions = element('div', 'route-directions');
    const stagesBox = element('div', 'route-stages');
    stagesBox.setAttribute('role', 'group');
    stagesBox.setAttribute('aria-label', 'Этапы проезда');
    const instruction = element('div', 'route-instruction');
    const copy = element('p', 'route-copy');
    copy.id = 'route-step-copy';
    copy.setAttribute('aria-live', 'polite');
    const photo = element('button', 'route-photo');
    photo.type = 'button';
    const photoImage = element('img');
    photoImage.alt = '';
    photoImage.loading = 'lazy';
    photoImage.decoding = 'async';
    const photoLabel = element('span', 'route-photo-label');
    photo.append(photoImage, photoLabel);
    instruction.append(copy, photo);
    directions.append(stagesBox, instruction);
    card.append(directions);

    const buttons = timing.map((stage, index) => {
      const button = element('button');
      button.type = 'button';
      const number = element('span', '', String(index + 1));
      number.setAttribute('aria-hidden', 'true');
      button.append(number, steps[index]?.title || ['Въезд', 'Шлагбаум', 'Бокс'][index]);
      button.setAttribute('aria-controls', copy.id);
      stagesBox.append(button);
      return button;
    });
    const phone = element('a', 'route-phone', 'позвоните в студию');
    const number = String(contacts.phone || '').replace(/[^\d+]/g, '');
    if (/^\+?\d{7,15}$/.test(number)) phone.href = 'tel:' + number;

    const paths = ['above', 'below'].map(name => {
      const path = card.querySelector('#route-' + name + '-path');
      const trace = card.querySelector('.route-trace-' + name);
      const length = path.getTotalLength();
      trace.setAttribute('stroke-dasharray', String(length));
      return { path, length, trace };
    });
    const vehicle = card.querySelector('.route-vehicle');
    const signals = { left: card.querySelector('.rv-signal[data-side="left"]'), right: card.querySelector('.rv-signal[data-side="right"]') };
    const brake = card.querySelector('.rv-brake');
    const traffic = [...card.querySelectorAll('[data-traffic] use')].map(car => ({
      car, lane: Number(car.dataset.lane), dir: Number(car.dataset.dir), at: Number(car.dataset.at)
    }));
    const boom = card.querySelector('.route-boom');
    const call = card.querySelector('.rm-call');
    const studio = card.querySelector('.rm-studio');
    const lessMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const total = timing.at(-1).end;
    // Where the car stops: its nose at the stop line in front of the barrier.
    const gate = (() => {
      let low = 0, high = paths[1].length;
      for (let i = 0; i < 24; i++) {
        const middle = (low + high) / 2;
        if (paths[1].path.getPointAtLength(middle).x < 178 - 14) low = middle; else high = middle;
      }
      return low / paths[1].length;
    })();
    const clamp = value => Math.max(0, Math.min(1, value));
    const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
    let second = 0, selected = -1, raf = 0, previous = 0;
    let wantsPlay = !lessMotion.matches, inView = false;

    function paint(time) {
      second = Math.min(total, Math.max(0, time));
      const stage = second < timing[1].start ? 0 : second < timing[2].start ? 1 : 2;
      const street = ease(second / 4.9);
      const inside = stage < 2 ? gate * ease((second - 5.4) / 3.6) : gate + (1 - gate) * ease((second - 10.7) / 5.4);
      [street, inside].forEach((progress, i) => {
        paths[i].trace.setAttribute('stroke-dashoffset', String((1 - progress) * paths[i].length));
      });
      const activePath = paths[stage === 0 ? 0 : 1];
      const at = activePath.length * (stage === 0 ? street : inside);
      const point = activePath.path.getPointAtLength(at);
      const before = activePath.path.getPointAtLength(Math.max(0, at - 1));
      const after = activePath.path.getPointAtLength(Math.min(activePath.length, at + 1));
      const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
      vehicle.setAttribute('transform', 'translate(' + point.x.toFixed(2) + ' ' + point.y.toFixed(2) + ') rotate(' + angle.toFixed(1) + ')');
      // Indicators before each turn and brake lights at the stops, like a careful driver.
      const blink = Math.floor(second * 3.2) % 2 === 0;
      const turningRight = stage === 0 && point.x < 430 && second < 4.75;
      const turningLeft = stage === 2 && point.x > 380 && second < total - .3;
      signals.right.classList.toggle('is-on', turningRight && blink);
      signals.left.classList.toggle('is-on', turningLeft && blink);
      brake.classList.toggle('is-on', (stage === 0 && second > 3.7) || (stage === 1 && second > 7.6) || (stage === 2 && second < 10.95) || second > total - .5);
      for (const item of traffic) {
        const x = ((item.at + item.dir * 17 * second) % 680 + 680) % 680 - 40;
        item.car.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + item.lane + ') rotate(' + (item.dir > 0 ? 90 : -90) + ') scale(.92)');
      }
      // The car fades at the gate and appears again on the ramp.
      const fade = stage === 0 ? 1 - clamp((second - 4.7) / .5) : clamp((second - 5.3) / .4);
      vehicle.setAttribute('opacity', fade.toFixed(2));
      boom.setAttribute('transform', 'rotate(' + (clamp((second - 9.4) / .9) * 84).toFixed(1) + ' 190 286)');
      call.classList.toggle('is-ringing', second > 8.4 && second < 10.4);
      studio.classList.toggle('is-here', second >= total - .4);
      if (stage !== selected) {
        selected = stage;
        buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(stage === i)));
        describe(stage);
      }
    }

    function describe(stage) {
      const step = steps[stage] || {};
      const text = step.text || '';
      if (phone.hasAttribute('href') && text.includes(phone.textContent)) {
        const [beforePhone, ...rest] = text.split(phone.textContent);
        copy.replaceChildren(beforePhone, phone, rest.join(phone.textContent));
      } else copy.textContent = text;
      const image = page?.mediaUrl?.(step.image) || '';
      photo.hidden = !image;
      if (image) {
        photoImage.src = image;
        const withVideo = typeof options.video === 'function';
        photo.disabled = !withVideo;
        photoLabel.textContent = withVideo ? 'Этот момент в видео' : 'Как выглядит на месте';
        photo.setAttribute('aria-label', (withVideo ? 'Смотреть в видео: ' : 'Фото: ') + (step.title || ''));
      }
    }
    photo.addEventListener('click', () => {
      const step = steps[Math.max(0, selected)];
      if (typeof options.video === 'function') {
        wantsPlay = false;
        updatePlayback();
        options.video(Number(step?.time) || 0);
      }
    });

    function updatePlayback() {
      cancelAnimationFrame(raf);
      previous = 0;
      const label = second >= total ? 'Повторить' : wantsPlay ? 'Пауза' : second > 0 ? 'Продолжить' : 'Показать';
      toggle.dataset.state = wantsPlay ? 'pause' : second >= total ? 'replay' : 'play';
      toggle.textContent = label;
      toggle.setAttribute('aria-label', label + ' — анимация маршрута');
      toggle.hidden = lessMotion.matches || activeTab !== 'scheme';
      if (wantsPlay && inView && activeTab === 'scheme' && !document.hidden && !lessMotion.matches) raf = requestAnimationFrame(tick);
    }
    function tick(now) {
      if (previous) paint(second + (now - previous) / 1000);
      previous = now;
      if (second >= total) { wantsPlay = false; updatePlayback(); }
      else raf = requestAnimationFrame(tick);
    }
    buttons.forEach((button, i) => button.addEventListener('click', () => {
      wantsPlay = false;
      if (activeTab !== 'scheme') show('scheme');
      paint(timing[i].parked);
      updatePlayback();
    }));
    toggle.addEventListener('click', () => {
      if (second >= total) paint(0);
      wantsPlay = !wantsPlay;
      updatePlayback();
    });
    lessMotion.addEventListener('change', () => {
      wantsPlay = false; paint(timing[Math.max(0, selected)].parked); updatePlayback();
    });
    document.addEventListener('visibilitychange', updatePlayback);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting; updatePlayback();
      }, { threshold: .22 }).observe(card);
    } else { inView = true; }
    show('scheme');
    paint(lessMotion.matches ? timing[0].parked : 0);
    updatePlayback();
    return card;
  }
  window.StudioArrivalMap = { create, fits };
})();
