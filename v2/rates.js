(() => {
  'use strict';

  const legacyGroups = { doors: 'Двери', arches: 'Арки и шины', floor: 'Пол', trunk: 'Багажник', roof: 'Потолок', dashboard: 'Торпедо' };
  const plurals = new Intl.PluralRules('ru');
  const sheetCount = count => count + ' ' + ({ one: 'лист', few: 'листа', many: 'листов', other: 'листа' }[plurals.select(count)]);
  const rowCount = count => count + ' ' + ({ one: 'позиция', few: 'позиции', many: 'позиций', other: 'позиции' }[plurals.select(count)]);

  function el(tag, name, text) {
    const node = document.createElement(tag);
    if (name) node.className = name;
    if (text != null) node.textContent = text;
    return node;
  }

  function resource(value) {
    if (!value || typeof value !== 'string') return '';
    if (window.StudioPage?.mediaUrl) return window.StudioPage.mediaUrl(value);
    if (/^(?:\/?(?:assets|sheets|media)\/|https:\/\/)/i.test(value) && !/[\\\x00-\x1f]/.test(value)) return value;
    return '';
  }

  function external(text, href, className) {
    const link = el('a', className, text);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }

  function signature(rate) {
    return JSON.stringify([rate.group, rate.title, rate.columns, rate.rows, rate.notes]);
  }

  function sameRates(rates, seed) {
    if (!seed || seed.length !== rates.length) return false;
    const saved = seed.map(signature).sort();
    return rates.map(signature).sort().every((key, index) => key === saved[index]);
  }

  function currentSheet(rate, seed) {
    const prior = seed?.find(item => item.sheet && item.sheet === rate.sheet)
      || seed?.find(item => item.title === rate.title && item.group === rate.group);
    const older = prior && signature(prior) !== signature(rate);
    for (const key of ['sheet', 'source']) {
      if (older && rate[key] === prior[key]) continue;
      const path = resource(rate[key]);
      if (path) return path;
    }
    return '';
  }

  function archiveFor(prices, seed, page) {
    if (page.hidePriceArchive) return '';
    const archive = resource(page.priceArchive);
    const defaultArchive = 'sheets/prices.zip';
    if (archive && archive.replace(/^\//, '') !== defaultArchive) return archive;
    const originalFiles = rates => rates.map(rate => JSON.stringify([signature(rate), rate.sheet, rate.source])).sort().join('\n');
    return seed && originalFiles(prices) !== originalFiles(seed) ? '' : defaultArchive;
  }

  function groupsFor(prices, zones) {
    const groups = zones.map(zone => ({ id: zone.id, name: zone.group || legacyGroups[zone.id] || zone.title, zone, rates: [] }));
    for (const rate of prices) {
      let group = groups.find(item => item.name === rate.group);
      if (!group) {
        group = { id: rate.group === 'Комплексы' ? 'packages' : 'group-' + rate.group, name: rate.group, rates: [] };
        groups.push(group);
      }
      group.rates.push(rate);
    }
    return groups;
  }

  function amountColumns(rate) {
    return rate.columns.flatMap((title, index) => {
      const money = /цен[ауы]|стоимость|сумма|₽|^за\s/iu.test(title) || rate.rows.some(row => /₽|руб\b/iu.test(row[index] || ''));
      return money ? [index] : [];
    });
  }

  function selection(rate, row, indexes) {
    const variant = row[0] || '';
    const serviceParts = [rate.group, rate.title];
    if (variant && !rate.title.startsWith(variant)) serviceParts.push(variant);
    const service = [...new Set(serviceParts)].join(' · ');
    const price = indexes.map(i => {
      const label = rate.columns[i].replace(/^цена\s+/iu, '');
      return indexes.length > 1 || /^за\s/iu.test(label) ? row[i] + ' (' + label.toLowerCase() + ')' : row[i];
    }).filter(Boolean).join(', ');
    return { service, price };
  }

  function ask(detail) {
    const link = el('a', 'rates-inquiry', 'Обсудить');
    link.href = '#request';
    link.setAttribute('aria-label', 'Обсудить — ' + detail.service);
    link.addEventListener('click', () => window.dispatchEvent(new CustomEvent('studio:quote', { detail })));
    return link;
  }

  function rateTable(rate, indexes, canRequest) {
    const wrapper = el('div', 'rates-table-wrap');
    const table = el('table', 'rates-table');
    const head = table.createTHead().insertRow();
    const hasActions = canRequest && rate.rows.length > 1;
    table.setAttribute('aria-label', [rate.group, rate.title].join(' · '));
    for (const label of [...rate.columns, ...(hasActions ? ['Запрос'] : [])]) {
      const column = el('th', '', label);
      column.scope = 'col';
      head.append(column);
    }
    const body = table.createTBody();
    for (const values of rate.rows) {
      const row = body.insertRow();
      rate.columns.forEach((title, i) => {
        const cell = row.insertCell();
        cell.dataset.label = title;
        cell.textContent = values[i] || '—';
        if (indexes.includes(i)) cell.className = 'rates-money';
      });
      if (hasActions) {
        const cell = row.insertCell();
        cell.className = 'rates-row-action';
        cell.append(ask(selection(rate, values, indexes)));
      }
    }
    wrapper.append(table);
    return wrapper;
  }

  function rateCard(rate, seed, canRequest) {
    const indexes = amountColumns(rate);
    const first = rate.rows[0] || [];
    const several = rate.rows.length > 1;
    const details = el('details', 'rates-line');
    const summary = el('summary', 'rates-summary');
    const title = el('span', 'rates-name', rate.title);
    const amountIndex = indexes[0];
    const quote = el('span', 'rates-summary-price', several ? rowCount(rate.rows.length) : first[amountIndex] || 'По запросу');
    if (several) quote.classList.add('rates-count');
    const condition = rate.columns[amountIndex] || '';
    if (!several && /^цена\s+за\s|^за\s/iu.test(condition)) {
      title.append(el('small', '', condition.replace(/^цена\s+/iu, '').toLowerCase()));
    } else if (!several && /в составе комплекса/iu.test(first[0] || '')) {
      title.append(el('small', '', 'В составе комплекса'));
    }
    const mark = el('span', 'rates-plus');
    mark.setAttribute('aria-hidden', 'true');
    summary.append(title, quote, mark);
    details.append(summary);

    const content = el('div', 'rates-detail');
    content.append(rateTable(rate, indexes, canRequest));
    if (rate.notes?.length) {
      const notes = el('ul', 'rates-notes');
      rate.notes.forEach(line => notes.append(el('li', '', line)));
      content.append(notes);
    }
    const actions = el('div', 'rates-actions');
    const sheet = currentSheet(rate, seed);
    if (sheet) actions.append(external('Оригинал прайса', sheet, 'rates-original'));
    if (!several && canRequest && first.length) actions.append(ask(selection(rate, first, indexes)));
    if (actions.childElementCount) content.append(actions);
    details.append(content);
    return details;
  }

  // «Разбивка» of the zone prices by body type for each brand group, computed from the cabinet coefficients.
  const shortTitles = { бюджетный: 'Бюджет', стандартный: 'Стандарт', премиальный: 'Премиум', оптимальный: 'Оптимум', максимальный: 'Максимум', базовый: 'База' };
  function shortTitle(title) {
    const words = String(title || '').replace(/\s+комплект$/i, '').trim();
    return shortTitles[words.toLowerCase()] || words;
  }

  function bodyTable(group) {
    const pricing = window.StudioVehicles;
    const vehicles = window.STUDIO_VEHICLES;
    if (!pricing || !vehicles || !window.StudioEstimate || !group.zone) return null;
    const config = pricing.normalize(vehicles);
    if (!config.bodies.length) return null;
    const engine = window.StudioEstimate.create(window.STUDIO_PRICES || [], window.STUDIO_ZONES || []);
    const zone = engine.zones.find(item => item.id === group.zone.id);
    const choices = (zone?.groups || []).flatMap(item => item.choices)
      .filter(choice => choice.scalable && choice.min != null && !choice.required);
    if (!choices.length) return null;
    const classes = config.classes.length ? config.classes : [{ id: 'all', title: 'Все марки', percent: 0, brands: [] }];
    const format = new Intl.NumberFormat('ru-RU');
    const box = el('section', 'rates-bodies');
    const head = el('div', 'rates-bodies-head');
    const title = el('h4', '', 'Цены по типу кузова');
    title.id = 'rates-bodies-title-' + group.id;
    box.setAttribute('aria-labelledby', title.id);
    const switcher = el('div', 'rates-classes');
    switcher.setAttribute('role', 'group');
    switcher.setAttribute('aria-label', 'Класс марки');
    head.append(title, switcher);
    const scroller = el('div', 'rates-bodies-scroll');
    scroller.tabIndex = 0;
    scroller.setAttribute('aria-label', 'Таблица цен по типу кузова, прокручивается');
    const table = el('table', 'rates-bodies-table');
    const headRow = table.createTHead().insertRow();
    const corner = el('th', '', 'Комплект');
    corner.scope = 'col';
    headRow.append(corner);
    const columns = config.bodies.map(body => {
      const cell = el('th');
      cell.scope = 'col';
      cell.dataset.body = body.id;
      if (window.StudioCarShapes) cell.append(window.StudioCarShapes.svg(body.shape, 'car-shape rates-car'));
      cell.append(el('span', '', body.title));
      headRow.append(cell);
      return cell;
    });
    const body = table.createTBody();
    const cells = choices.map(choice => {
      const row = body.insertRow();
      const name = el('th', '', choice.title);
      name.scope = 'row';
      if (choice.unit) name.append(el('small', '', choice.unit));
      row.append(name);
      return config.bodies.map(item => {
        const cell = row.insertCell();
        cell.dataset.body = item.id;
        return { cell, choice, body: item };
      });
    });
    // На узком экране та же информация показывается «по кузовам»: строка — кузов, столбцы — комплекты.
    const compact = el('table', 'rates-bodies-compact');
    const compactCaption = el('caption', 'rates-sr', 'Цены по типу кузова');
    compact.append(compactCaption);
    const compactHead = compact.createTHead().insertRow();
    const compactCorner = el('th', '', 'Цены от, ₽');
    compactCorner.scope = 'col';
    compactHead.append(compactCorner);
    for (const choice of choices) {
      const cell = el('th', '', shortTitle(choice.title));
      cell.scope = 'col';
      cell.title = choice.title;
      compactHead.append(cell);
    }
    const compactBody = compact.createTBody();
    const compactRows = [];
    const compactCells = config.bodies.map(item => {
      const row = compactBody.insertRow();
      row.dataset.body = item.id;
      compactRows.push(row);
      const name = el('th');
      name.scope = 'row';
      const label = el('span', 'rates-body-name');
      if (window.StudioCarShapes) label.append(window.StudioCarShapes.svg(item.shape, 'car-shape rates-car'));
      label.append(el('span', '', item.title));
      name.append(label);
      row.append(name);
      return choices.map(choice => ({ cell: row.insertCell(), choice, body: item, compact: true }));
    });
    const note = el('p', 'rates-bodies-note');
    scroller.append(table);
    box.append(head, scroller, compact, note);
    let current = classes[0];
    let highlighted = '';
    function paint() {
      for (const row of [...cells, ...compactCells]) {
        for (const { cell, choice, body: item, compact: short } of row) {
          const car = { body: item.id, groupPercent: current.percent };
          const min = pricing.quote(config, car, choice.zoneId, choice.min, choice.exact);
          const max = choice.max == null ? null : pricing.quote(config, car, choice.zoneId, choice.max, choice.exact);
          cell.textContent = short ? format.format(min)
            : (max == null ? 'от ' : '') + format.format(min) + (max != null && max !== min ? '–' + format.format(max) : '');
        }
      }
      for (const button of switcher.children) button.setAttribute('aria-pressed', String(button.dataset.group === current.id));
      const brands = current.brands.slice(0, 6).join(', ') + (current.brands.length > 6 ? ' и другие' : '');
      note.textContent = 'Цены в рублях' + (brands ? ' для марок: ' + brands : '') + '. ' + (config.basis || '');
    }
    function mark(bodyId) {
      highlighted = bodyId || '';
      for (const cell of [...columns, ...cells.flat().map(item => item.cell), ...compactRows]) {
        cell.classList.toggle('is-current', Boolean(highlighted) && cell.dataset.body === highlighted);
      }
    }
    for (const group of classes) {
      const button = el('button', 'rates-class', group.title);
      button.type = 'button';
      button.dataset.group = group.id;
      button.addEventListener('click', () => { current = group; paint(); });
      switcher.append(button);
    }
    function follow(detail) {
      const vehicle = detail?.vehicle;
      const brand = vehicle?.brand ? pricing.findBrand(config, vehicle.brand) : null;
      if (brand) current = classes.find(item => item.id === brand.group.id) || current;
      mark(vehicle?.body);
      paint();
    }
    window.addEventListener('studio:vehicle', event => { if (box.isConnected) follow(event.detail); });
    const saved = window.StudioCarPicker?.stored?.();
    follow({ vehicle: saved });
    switcher.hidden = classes.length < 2;
    return box;
  }

  function groupPanel(group, seed, canRequest) {
    const panel = el('div', 'rates-current');
    const zone = group.zone;
    const intro = el('div', 'rates-intro');
    const copy = el('div', 'rates-intro-text');
    const title = el('h3', '', group.name);
    title.id = 'rates-zone-title';
    copy.append(title);
    if (zone?.description) copy.append(el('p', '', zone.description));
    intro.append(copy);
    const photo = resource(zone?.image);
    if (photo) {
      const image = el('img', 'rates-photo');
      image.src = photo;
      image.alt = 'Обработка автомобиля в мастерской — ' + group.name;
      image.decoding = 'async';
      image.loading = 'lazy';
      intro.append(image);
    }
    panel.append(intro);
    const list = el('div', 'rates-lines');
    group.rates.forEach(rate => list.append(rateCard(rate, seed?.prices, canRequest)));
    if (!group.rates.length) {
      list.append(el('p', 'rates-empty', 'Стоимость для этой зоны уточняется по модели автомобиля.'));
      if (canRequest) list.append(ask({ service: group.name, price: '' }));
    }
    panel.append(list);
    const bodies = bodyTable(group);
    if (bodies) panel.append(bodies);
    const originalZone = seed?.zones?.find(item => item.id === group.id);
    const initialRates = seed?.prices?.filter(rate => rate.group === group.name);
    const unchanged = !seed || sameRates(group.rates, initialRates);
    const showNotes = zone?.details?.length && (unchanged || JSON.stringify(zone.details) !== JSON.stringify(originalZone?.details));
    const source = resource(zone?.source);
    const showSource = source && (unchanged || zone.source !== originalZone?.source);
    if (showNotes || showSource) {
      const more = el('details', 'rates-more');
      more.append(el('summary', '', 'Подробнее об обработке'));
      if (showNotes) {
        const notes = el('ul', 'rates-notes');
        zone.details.forEach(line => notes.append(el('li', '', line)));
        more.append(notes);
      }
      if (showSource) more.append(external('Папка студии', source, 'rates-original'));
      panel.append(more);
    }
    return panel;
  }

  function mount() {
    const root = document.querySelector('[data-rates]');
    if (!root) return;
    const prices = window.STUDIO_PRICES || [];
    const groups = groupsFor(prices, window.STUDIO_ZONES || []);
    const seed = window.STUDIO_SEED;
    const page = window.STUDIO_PAGE || window.StudioPage?.current || {};
    const canRequest = !page.sections?.some(section => section.id === 'request' && !section.enabled);
    if (!groups.length) {
      root.append(el('p', 'rates-empty', 'Студия обновляет каталог услуг.'));
      return;
    }
    const sidebar = el('div', 'rates-sidebar');
    const label = el('p', 'rates-lab', 'Зона автомобиля');
    const list = el('div', 'rates-zones');
    list.setAttribute('role', 'group');
    list.setAttribute('aria-label', label.textContent);
    const selectLabel = el('label', 'rates-pick');
    selectLabel.append(el('span', 'rates-lab', label.textContent));
    const select = el('select', 'rates-select');
    selectLabel.append(select);
    const groupButtons = new Map();
    const output = el('div', 'rates-output');
    output.id = 'rates-details';
    output.setAttribute('role', 'region');
    output.setAttribute('aria-labelledby', 'rates-zone-title');
    const status = el('span', 'rates-sr');
    status.setAttribute('role', 'status');
    let current = null;

    function change(value, updateUrl = false) {
      const key = String(value || '').toLocaleLowerCase('ru');
      const group = groups.find(item => [item.id, item.name].some(v => v.toLocaleLowerCase('ru') === key)) || groups[0];
      if (current !== group) {
        current = group;
        select.value = group.id;
        groupButtons.forEach((button, id) => button.setAttribute('aria-pressed', String(id === group.id)));
        output.replaceChildren(groupPanel(group, seed, canRequest));
        status.textContent = group.name + ', ' + sheetCount(group.rates.length);
      }
      if (updateUrl && location.protocol !== 'file:') {
        const url = new URL(location.href);
        url.searchParams.set('zone', group.id);
        url.hash = 'prices';
        history.replaceState(history.state, '', url);
      }
    }
    groups.forEach(group => {
      const button = el('button', 'rates-zone');
      button.type = 'button';
      button.setAttribute('aria-controls', output.id);
      button.append(el('span', '', group.name));
      const tally = el('small', '', sheetCount(group.rates.length));
      button.append(tally);
      button.addEventListener('click', () => change(group.id, true));
      list.append(button);
      groupButtons.set(group.id, button);
      select.add(new Option(group.name, group.id));
    });
    select.addEventListener('change', () => change(select.value, true));
    sidebar.append(label, list, selectLabel);
    const zip = archiveFor(prices, seed?.prices, page);
    if (zip) {
      const archive = el('a', 'rates-archive');
      archive.href = zip;
      archive.download = 'Зашумлено — прайс.zip';
      if (/^https?:/i.test(zip)) { archive.target = '_blank'; archive.rel = 'noopener noreferrer'; }
      const icon = el('span', 'rates-download-icon');
      icon.setAttribute('aria-hidden', 'true');
      archive.append(icon, el('span', '', 'Скачать прайс'), el('small', '', 'ZIP'));
      sidebar.append(archive);
    }
    root.append(sidebar, output, status);
    const followUrl = () => change(new URL(location.href).searchParams.get('zone'));
    followUrl();
    window.addEventListener('popstate', followUrl);
    window.addEventListener('studio:zone', event => change(event.detail?.zone, true));
    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const link = event.target.closest('a[href]');
      if (!link || link.target === '_blank') return;
      const url = new URL(link.href);
      if (url.origin === location.origin && url.pathname === location.pathname && url.hash === '#prices' && url.searchParams.has('zone')) {
        change(url.searchParams.get('zone'));
      }
    });
  }

  Promise.resolve(window.STUDIO_READY ?? true).then(ready => { if (ready) mount(); });
})();
