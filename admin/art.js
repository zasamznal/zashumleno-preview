(() => {
  'use strict';

  // Pictures of the cabinet: one illustration per section, a small map of the site that shows which block a section
  // changes, and pictured steps. Colours are the studio palette, so the cabinet looks like the site it edits.
  const C = {
    ink: '#2c2850', night: '#13111c', violet: '#5246a6', lilac: '#bcb9d9', soft: '#ebe8f7', paper: '#f7f6fc',
    blue: '#0a97c7', pink: '#d81b7a', white: '#ffffff', grey: '#9a97ad', bronze: '#c9a46a', metal: '#cfd2da', dark: '#3b3850'
  };
  const line = `fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
  const blob = (x = 100, y = 68, w = 82, h = 54) =>
    `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="${C.soft}"/>`;
  const spark = (x, y, s = 1, color = C.blue) =>
    `<path d="M${x} ${y - 6 * s}v${12 * s}M${x - 6 * s} ${y}h${12 * s}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`;
  // A side view of a car, scaled into a box; used by several pictures.
  const car = (x, y, w, fill = C.white, glass = C.lilac) => {
    const k = w / 120;
    const p = (dx, dy) => (x + dx * k).toFixed(1) + ' ' + (y + dy * k).toFixed(1);
    return `<path d="M${p(6, 30)}C${p(6, 22)} ${p(12, 19)} ${p(22, 18)}L${p(36, 16)}L${p(52, 4)}C${p(56, 1)} ${p(60, 0)} ${p(66, 0)}L${p(86, 0)}C${p(92, 0)} ${p(96, 3)} ${p(100, 7)}L${p(108, 16)}C${p(115, 17)} ${p(118, 21)} ${p(118, 28)}L${p(118, 34)}C${p(118, 37)} ${p(116, 38)} ${p(113, 38)}L${p(9, 38)}C${p(7, 38)} ${p(6, 36)} ${p(6, 34)}Z" fill="${fill}" stroke="${C.ink}" stroke-width="${Math.max(2, 3 * k).toFixed(1)}" stroke-linejoin="round"/>
      <path d="M${p(42, 16)}L${p(55, 6)}C${p(58, 4)} ${p(61, 3.5)} ${p(65, 3.5)}L${p(74, 3.5)}L${p(74, 16)}ZM${p(79, 16)}L${p(79, 3.5)}L${p(86, 3.5)}C${p(90, 3.5)} ${p(93, 5)} ${p(96, 8)}L${p(102, 16)}Z" fill="${glass}" stroke="${C.ink}" stroke-width="${Math.max(1.5, 2 * k).toFixed(1)}" stroke-linejoin="round"/>
      <circle cx="${p(30, 38).split(' ')[0]}" cy="${p(30, 38).split(' ')[1]}" r="${(10 * k).toFixed(1)}" fill="${C.ink}"/><circle cx="${p(30, 38).split(' ')[0]}" cy="${p(30, 38).split(' ')[1]}" r="${(4 * k).toFixed(1)}" fill="${C.lilac}"/>
      <circle cx="${p(92, 38).split(' ')[0]}" cy="${p(92, 38).split(' ')[1]}" r="${(10 * k).toFixed(1)}" fill="${C.ink}"/><circle cx="${p(92, 38).split(' ')[0]}" cy="${p(92, 38).split(' ')[1]}" r="${(4 * k).toFixed(1)}" fill="${C.lilac}"/>`;
  };

  const pictures = {
    // A price tag being written with a pencil.
    prices: `${blob()}
      <g transform="rotate(-14 96 66)">
        <path d="M52 40h74a10 10 0 0 1 10 10v34a10 10 0 0 1-10 10H52L34 67Z" fill="${C.white}" ${line.replace('fill="none" ', '')}/>
        <circle cx="50" cy="67" r="5" fill="${C.soft}" stroke="${C.ink}" stroke-width="3"/>
        <text x="96" y="76" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="${C.violet}">₽</text>
        <path d="M116 56h10M116 66h10M116 76h6" stroke="${C.lilac}" stroke-width="4" stroke-linecap="round"/>
      </g>
      <g transform="rotate(42 152 74)">
        <rect x="140" y="30" width="20" height="64" rx="4" fill="${C.pink}" stroke="${C.ink}" stroke-width="3"/>
        <path d="M140 94l10 18 10-18Z" fill="${C.lilac}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M146 106l4 6 4-6" fill="${C.ink}"/>
        <path d="M140 42h20" stroke="${C.ink}" stroke-width="3"/>
      </g>
      ${spark(34, 28)}${spark(170, 112, .8, C.pink)}`,

    // Cars from small to big with a markup badge.
    vehicles: `${blob()}
      ${car(18, 70, 52, C.white)}${car(70, 58, 64, C.lilac, C.white)}${car(124, 44, 70, C.violet, C.lilac)}
      <path d="M28 104h150" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="172" cy="26" r="16" fill="${C.pink}" stroke="${C.ink}" stroke-width="3"/>
      <text x="172" y="32" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="800" fill="${C.white}">%</text>
      <path d="M40 46l18-14 6 8 16-16" ${line}/><path d="M72 24h8v8" ${line}/>`,

    // Photos and a video card.
    media: `${blob()}
      <g transform="rotate(-9 80 64)"><rect x="34" y="30" width="86" height="64" rx="6" fill="${C.lilac}" stroke="${C.ink}" stroke-width="3"/></g>
      <rect x="62" y="38" width="90" height="66" rx="6" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>
      <rect x="70" y="46" width="74" height="44" rx="3" fill="${C.soft}"/>
      <path d="M70 90l22-24 14 14 10-10 28 20Z" fill="${C.violet}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="128" cy="58" r="6" fill="${C.pink}"/>
      <rect x="132" y="80" width="46" height="34" rx="6" fill="${C.ink}"/>
      <path d="M150 89v16l13-8Z" fill="${C.white}"/>
      ${spark(30, 104, .9)}`,

    // A finished car in a photo card with a check mark.
    works: `${blob()}
      <rect x="36" y="22" width="128" height="88" rx="8" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>
      <rect x="44" y="30" width="112" height="56" rx="4" fill="${C.soft}"/>
      ${car(52, 44, 96, C.lilac, C.white)}
      <path d="M48 96h56M48 103h34" stroke="${C.lilac}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="160" cy="28" r="15" fill="${C.blue}" stroke="${C.ink}" stroke-width="3"/>
      <path d="M153 28l5 5 9-10" fill="none" stroke="${C.white}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${spark(28, 36, .8, C.pink)}`,

    // Sheets of material laid one over another, like the «What's inside» stack.
    materials: `${blob()}
      ${[[C.dark, 84], [C.blue, 68], [C.bronze, 52], [C.metal, 36]].map(([color, y], i) =>
        `<path d="M46 ${y + 18}L100 ${y}L156 ${y + 18}L102 ${y + 36}Z" fill="${color}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>` +
        (i === 1 ? `<path d="M74 ${y + 18}l26-8M88 ${y + 22}l26-8" stroke="${C.white}" stroke-width="2" stroke-linecap="round" opacity=".7"/>` : '')
      ).join('')}
      <path d="M164 46h18M164 62h12M164 78h18M164 94h12" stroke="${C.violet}" stroke-width="4" stroke-linecap="round"/>
      ${spark(30, 40, .9, C.pink)}`,

    // Speaker, ambient light and protection: the studio's other services.
    'page-services': `${blob()}
      <circle cx="58" cy="66" r="30" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>
      <circle cx="58" cy="66" r="17" fill="${C.lilac}" stroke="${C.ink}" stroke-width="3"/><circle cx="58" cy="66" r="6" fill="${C.ink}"/>
      <path d="M98 44q22 22 0 44" fill="none" stroke="${C.pink}" stroke-width="4" stroke-linecap="round"/>
      <path d="M110 36q32 30 0 60" fill="none" stroke="${C.violet}" stroke-width="4" stroke-linecap="round"/>
      <path d="M150 34l24 9v20c0 16-10 26-24 31-14-5-24-15-24-31V43Z" fill="${C.blue}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M140 64l7 7 13-14" fill="none" stroke="${C.white}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`,

    // A painter's palette in the studio colours.
    palette: `${blob()}
      <path d="M100 26c-36 0-62 22-62 48 0 18 14 30 30 26 10-2 10-12 18-14 10-2 14 8 26 8 26 0 50-14 50-34 0-20-26-34-62-34Z" fill="${C.white}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="70" cy="58" r="9" fill="${C.lilac}" stroke="${C.ink}" stroke-width="2.5"/>
      <circle cx="96" cy="46" r="9" fill="${C.violet}" stroke="${C.ink}" stroke-width="2.5"/>
      <circle cx="126" cy="50" r="9" fill="${C.blue}" stroke="${C.ink}" stroke-width="2.5"/>
      <circle cx="146" cy="68" r="9" fill="${C.pink}" stroke="${C.ink}" stroke-width="2.5"/>
      <g transform="rotate(-38 150 104)"><rect x="128" y="98" width="52" height="10" rx="5" fill="${C.ink}"/><path d="M180 98c10 0 16 3 16 5s-6 5-16 5Z" fill="${C.pink}" stroke="${C.ink}" stroke-width="2.5"/></g>
      ${spark(36, 30, .9)}`,

    // The first screen of the site: a big headline and the car.
    'page-home': `${blob()}
      <rect x="28" y="24" width="144" height="88" rx="8" fill="${C.night}" stroke="${C.ink}" stroke-width="3"/>
      <path d="M28 36h144" stroke="${C.dark}" stroke-width="3"/>
      <circle cx="38" cy="30" r="2.5" fill="${C.pink}"/><circle cx="46" cy="30" r="2.5" fill="${C.lilac}"/><circle cx="54" cy="30" r="2.5" fill="${C.blue}"/>
      <path d="M40 54h40" stroke="${C.white}" stroke-width="8" stroke-linecap="round"/>
      <path d="M40 68h52" stroke="${C.lilac}" stroke-width="8" stroke-linecap="round"/>
      <path d="M40 82h44M40 88h30" stroke="${C.grey}" stroke-width="3" stroke-linecap="round"/>
      <rect x="40" y="96" width="30" height="9" rx="4.5" fill="${C.lilac}"/>
      ${car(94, 62, 74, '#d9d8e2', C.dark)}
      <circle cx="170" cy="26" r="15" fill="${C.pink}" stroke="${C.ink}" stroke-width="3"/>
      <text x="170" y="31.5" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="800" fill="${C.white}">Aa</text>`,

    // A list of blocks with switches.
    'page-sections': `${blob()}
      <rect x="40" y="20" width="120" height="96" rx="8" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>
      ${[[36, true], [58, true], [80, false], [102, true]].map(([y, on]) => `
        <path d="M54 ${y}h50" stroke="${on ? C.ink : C.grey}" stroke-width="4" stroke-linecap="round"/>
        <rect x="118" y="${y - 7}" width="28" height="14" rx="7" fill="${on ? C.violet : C.soft}" stroke="${C.ink}" stroke-width="2"/>
        <circle cx="${on ? 139 : 125}" cy="${y}" r="5" fill="${C.white}" stroke="${C.ink}" stroke-width="2"/>`).join('')}
      ${spark(172, 30, .9, C.pink)}`,

    // A folded map with a pin and a phone.
    'page-contacts': `${blob()}
      <path d="M30 34l40-12 50 12 46-12v76l-46 12-50-12-40 12Z" fill="${C.white}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M70 22v76M120 34v76" stroke="${C.ink}" stroke-width="2.5"/>
      <path d="M36 80q30-6 48-24t50-8 30-10" fill="none" stroke="${C.lilac}" stroke-width="6" stroke-linecap="round"/>
      <path d="M36 80q30-6 48-24t50-8 30-10" fill="none" stroke="${C.white}" stroke-width="1.5" stroke-dasharray="4 4"/>
      <path d="M106 66c-11 0-18-8-18-18 0-12 18-30 18-30s18 18 18 30c0 10-7 18-18 18Z" transform="translate(0 -4)" fill="${C.pink}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="106" cy="44" r="6" fill="${C.white}" stroke="${C.ink}" stroke-width="2.5"/>
      <rect x="150" y="62" width="34" height="50" rx="6" fill="${C.violet}" stroke="${C.ink}" stroke-width="3"/>
      <rect x="155" y="69" width="24" height="32" rx="2" fill="${C.lilac}"/><circle cx="167" cy="106" r="2.5" fill="${C.white}"/>`,

    // Top view of a car with a highlighted zone.
    zones: `${blob()}
      <rect x="36" y="38" width="128" height="60" rx="26" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>
      <path d="M72 42v52M126 42v52" stroke="${C.ink}" stroke-width="2.5"/>
      <rect x="74" y="44" width="50" height="22" rx="4" fill="${C.lilac}" stroke="${C.violet}" stroke-width="2.5"/>
      <rect x="74" y="70" width="50" height="22" rx="4" fill="${C.soft}" stroke="${C.grey}" stroke-width="2" stroke-dasharray="4 3"/>
      <path d="M48 46q-6 22 0 44M152 46q6 22 0 44" fill="none" stroke="${C.blue}" stroke-width="3" stroke-linecap="round"/>
      <rect x="46" y="28" width="22" height="10" rx="4" fill="${C.ink}"/><rect x="132" y="28" width="22" height="10" rx="4" fill="${C.ink}"/>
      <rect x="46" y="98" width="22" height="10" rx="4" fill="${C.ink}"/><rect x="132" y="98" width="22" height="10" rx="4" fill="${C.ink}"/>
      <circle cx="99" cy="55" r="12" fill="${C.pink}" stroke="${C.ink}" stroke-width="2.5"/><path d="M93 55l4 4 8-8" fill="none" stroke="${C.white}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,

    // A price list page with a table.
    'price-table': `${blob()}
      <path d="M52 18h76l22 22v76H52Z" fill="${C.white}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M128 18v22h22" fill="${C.soft}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>
      ${[52, 68, 84, 100].map(y => `<path d="M62 ${y}h44" stroke="${C.lilac}" stroke-width="5" stroke-linecap="round"/><path d="M116 ${y}h22" stroke="${C.violet}" stroke-width="5" stroke-linecap="round"/>`).join('')}
      <text x="76" y="40" font-family="Arial, sans-serif" font-size="14" font-weight="800" fill="${C.ink}">ПРАЙС</text>
      <circle cx="160" cy="96" r="16" fill="${C.pink}" stroke="${C.ink}" stroke-width="3"/>
      <text x="160" y="102" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="800" fill="${C.white}">₽</text>`
  };

  function illustration(name, className = 'k-art') {
    const markup = pictures[name] || pictures.prices;
    const holder = document.createElement('span');
    holder.className = className;
    holder.innerHTML = `<svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${markup}</svg>`;
    return holder;
  }

  // Small line icons for pictured steps.
  const stepPaths = {
    tap: 'M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a5.5 5.5 0 0 1-5.5 5.5h-.8a5 5 0 0 1-4-2l-2.6-3.6a1.4 1.4 0 0 1 2.2-1.7L9 14',
    type: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
    publish: 'M12 16V4m0 0L7 9m5-5 5 5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4',
    photo: 'M4 6h16v13H4zM4 15l5-5 4 4 2-2 5 4M15 9.5a1 1 0 1 0 0-.01',
    toggle: 'M8 7h8a5 5 0 0 1 0 10H8A5 5 0 0 1 8 7zM16 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    palette: 'M12 3a9 9 0 0 0 0 18c1 0 1.6-.8 1.6-1.6 0-.9-.6-1.2-.6-2 0-.9.7-1.4 1.6-1.4H17a4 4 0 0 0 4-4c0-5-4-9-9-9zM7.5 11.5h.01M10 7.5h.01M14 7.5h.01M16.5 11h.01',
    eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    car: 'M3 15v-3l2-4h9l4 4h2a1 1 0 0 1 1 1v2M3 15h2m4 0h6m4 0h2M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    order: 'M8 4v16m0 0-3-3m3 3 3-3M16 20V4m0 0-3 3m3-3 3 3',
    plus: 'M12 5v14M5 12h14'
  };

  function stepIcon(name) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', stepPaths[name] || stepPaths.tap);
    svg.append(path);
    return svg;
  }

  // The site from top to bottom. A section of the cabinet highlights the blocks it changes.
  const blocks = [
    { id: 'header', title: 'Шапка', h: 6, dark: true },
    { id: 'cover', title: 'Обложка', h: 30, dark: true },
    { id: 'calculator', title: 'Калькулятор', h: 22, dark: true },
    { id: 'layers', title: '«Что внутри»', h: 20 },
    { id: 'works', title: 'Работы', h: 14 },
    { id: 'prices', title: 'Прайс', h: 16 },
    { id: 'services', title: 'Услуги', h: 12, dark: true },
    { id: 'request', title: 'Заявка', h: 10, dark: true },
    { id: 'contacts', title: 'Контакты и проезд', h: 14 },
    { id: 'footer', title: 'Подвал', h: 6, dark: true }
  ];
  const anchors = { cover: '#top', calculator: '#calculator', layers: '#layers', works: '#works', prices: '#prices', services: '#services', request: '#request', contacts: '#studio' };

  function siteMap(ids) {
    const all = ids.includes('*');
    const lit = new Set(all ? blocks.map(block => block.id) : ids);
    let y = 2;
    const rects = blocks.map(block => {
      const on = lit.has(block.id);
      const top = y;
      y += block.h + 1.5;
      const fill = block.dark ? C.night : C.paper;
      const ink = block.dark ? '#4b4766' : C.lilac;
      const lines = block.h > 8 ? `<path d="M8 ${top + 4}h${block.h > 18 ? 18 : 12}M8 ${top + 7.5}h${block.h > 18 ? 26 : 20}" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>` : '';
      const extra = block.id === 'cover' ? `<path d="M30 ${top + 22}c4-5 9-7 16-7h6l5 4c3 0 5 2 5 4v2H30Z" fill="#8f8ca3"/>` :
        block.id === 'calculator' ? `<rect x="8" y="${top + 11}" width="10" height="7" rx="1" fill="#4b4766"/><rect x="21" y="${top + 11}" width="10" height="7" rx="1" fill="#4b4766"/><rect x="44" y="${top + 4}" width="16" height="14" rx="1.5" fill="${C.lilac}"/>` :
        block.id === 'layers' ? `<rect x="34" y="${top + 3}" width="26" height="14" rx="1.5" fill="${C.night}"/>` :
        block.id === 'prices' ? `<path d="M8 ${top + 11}h44M8 ${top + 14}h44" stroke="${C.lilac}" stroke-width="1.2"/>` :
        block.id === 'contacts' ? `<rect x="36" y="${top + 2.5}" width="24" height="10" rx="1.5" fill="${C.night}"/>` : '';
      return `<g class="${on ? 'is-lit' : ''}" opacity="${on ? 1 : .38}"><rect x="2" y="${top}" width="64" height="${block.h}" rx="2" fill="${fill}"/>${lines}${extra}
        ${on ? `<rect x="2" y="${top}" width="64" height="${block.h}" rx="2" fill="none" stroke="${C.pink}" stroke-width="2"/>` : ''}</g>`;
    }).join('');
    const box = document.createElement('span');
    box.className = 'k-sitemap';
    box.innerHTML = `<svg viewBox="0 0 68 ${y + 1}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><rect x=".5" y=".5" width="67" height="${y}" rx="3" fill="#fff" stroke="${C.lilac}"/>${rects}</svg>`;
    return box;
  }

  function mapTitles(ids) {
    if (ids.includes('*')) return 'Весь сайт';
    return blocks.filter(block => ids.includes(block.id)).map(block => block.title).join(' · ');
  }

  // What each cabinet section changes and how: picture, three steps, blocks of the site.
  const guides = {
    prices: { art: 'prices', map: ['calculator', 'layers', 'prices'],
      steps: [['tap', 'Выберите зону машины'], ['type', 'Нажмите на цену и впишите новую'], ['publish', 'Нажмите «Опубликовать»']] },
    vehicles: { art: 'vehicles', map: ['calculator', 'prices'],
      steps: [['car', 'Найдите тип кузова или группу марок'], ['type', 'Впишите наценку в процентах'], ['publish', 'Проверьте таблицу внизу и опубликуйте']] },
    zones: { art: 'zones', map: ['calculator', 'prices'],
      steps: [['tap', 'Выберите зону'], ['type', 'Измените название, описание или фото'], ['publish', 'Нажмите «Опубликовать»']] },
    'price-table': { art: 'price-table', map: ['prices'],
      steps: [['tap', 'Выберите тариф'], ['type', 'Измените таблицу или загрузите фото прайс-листа'], ['publish', 'Нажмите «Опубликовать»']] },
    media: { art: 'media', map: ['cover', 'calculator', 'layers', 'works', 'services', 'contacts'],
      steps: [['photo', 'Найдите фото или видео'], ['tap', 'Нажмите «Заменить» и выберите файл'], ['publish', 'Нажмите «Опубликовать»']] },
    works: { art: 'works', map: ['works'],
      steps: [['plus', 'Выберите работу или добавьте новую'], ['type', 'Впишите машину, что сделали, добавьте фото'], ['publish', 'Нажмите «Опубликовать»']] },
    materials: { art: 'materials', map: ['layers'],
      steps: [['tap', 'Выберите зону и комплект'], ['order', 'Поменяйте материал или порядок слоёв'], ['publish', 'Нажмите «Опубликовать»']] },
    'page-services': { art: 'page-services', map: ['services'],
      steps: [['tap', 'Выберите услугу'], ['type', 'Измените текст или фото'], ['publish', 'Нажмите «Опубликовать»']] },
    palette: { art: 'palette', map: ['*'],
      steps: [['palette', 'Выберите готовую палитру или вставьте коды'], ['eye', 'Посмотрите на сайт в предпросмотре'], ['publish', 'Нажмите «Опубликовать»']] },
    'page-home': { art: 'page-home', map: ['cover'],
      steps: [['type', 'Измените заголовок и текст'], ['photo', 'Замените фото обложки'], ['publish', 'Нажмите «Опубликовать»']] },
    'page-sections': { art: 'page-sections', map: ['header', 'calculator', 'layers', 'works', 'prices', 'services', 'contacts'],
      steps: [['toggle', 'Включите или скройте раздел'], ['type', 'Измените название и порядок'], ['publish', 'Нажмите «Опубликовать»']] },
    'page-contacts': { art: 'page-contacts', map: ['request', 'contacts', 'footer'],
      steps: [['type', 'Измените телефон, адрес или ссылки'], ['photo', 'Обновите фото шагов проезда'], ['publish', 'Нажмите «Опубликовать»']] }
  };

  // The guide band shown above a section: picture, pictured steps and the map of the site.
  function guide(id, siteRoot) {
    const data = guides[id];
    if (!data) return null;
    const box = document.createElement('section');
    box.className = 'k-guide';
    box.setAttribute('aria-label', 'Подсказка');
    const picture = illustration(data.art, 'k-guide-art');
    const steps = document.createElement('ol');
    steps.className = 'k-guide-steps';
    data.steps.forEach(([icon, text]) => {
      const item = document.createElement('li');
      const mark = document.createElement('span');
      mark.className = 'k-guide-icon';
      mark.append(stepIcon(icon));
      const label = document.createElement('span');
      label.textContent = text;
      item.append(mark, label);
      steps.append(item);
    });
    const where = document.createElement('a');
    where.className = 'k-guide-map';
    const first = data.map.find(block => anchors[block]) || 'cover';
    where.href = new URL(anchors[first] || '', siteRoot || location.href).href;
    where.target = '_blank';
    where.rel = 'noopener';
    where.title = 'Открыть это место на сайте';
    const caption = document.createElement('span');
    caption.className = 'k-guide-map-caption';
    const small = document.createElement('small');
    small.textContent = 'Меняет на сайте';
    const strong = document.createElement('strong');
    strong.textContent = mapTitles(data.map);
    caption.append(small, strong);
    where.append(siteMap(data.map), caption);
    box.append(picture, steps, where);
    return box;
  }

  window.StudioArt = { illustration, stepIcon, siteMap, guide, guides, pictures: Object.keys(pictures) };
})();
