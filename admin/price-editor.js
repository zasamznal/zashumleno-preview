(() => {
  'use strict';

  // «Цены»: the zones of the car as photo tiles, the kits of a zone as cards with the price written large.
  // A click on a price opens it for typing; prices for each body type can be typed too.
  const K = window.StudioKit;
  const el = K.el;
  const originalGroups = { doors: 'Двери', arches: 'Арки и шины', floor: 'Пол', trunk: 'Багажник', roof: 'Потолок', dashboard: 'Торпедо' };
  const compact = value => String(value ?? '').trim().replace(/\s+/g, ' ');
  const key = value => compact(value).toLocaleLowerCase('ru');
  const rub = value => String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const nbsp = text => String(text).replace(/ (?=\d)|(?<=\d) (?=₽)/g, '\u00a0');
  const typedNumber = (text, maximum = 999999999) => {
    const digits = String(text ?? '').trim().replace(/(?:₽|руб\.?)$/i, '').replace(/\s/g, '');
    if (!/^\d+$/.test(digits)) return null;
    const value = Number(digits);
    return value > 0 && value <= maximum ? value : null;
  };
  const modes = [['from', 'от'], ['fixed', 'ровно'], ['range', 'от … до'], ['ask', 'по запросу'], ['text', 'свой текст']];
  const storageKey = 'zs-admin-price-zone';

  function readPrice(text) {
    const value = compact(text);
    const parsed = window.StudioEstimate.parsePrice(value);
    if (parsed.min == null) {
      return { mode: !value || /^по\s+(?:запросу|согласованию)\.?$/i.test(value) ? 'ask' : 'text', min: null, max: null, text: value };
    }
    if (parsed.max == null) return { mode: 'from', min: parsed.min, max: null, text: value };
    if (parsed.max === parsed.min) return { mode: 'fixed', min: parsed.min, max: parsed.min, text: value };
    return { mode: 'range', min: parsed.min, max: parsed.max, text: value };
  }

  function writePrice(state) {
    if (state.mode === 'ask') return 'По запросу';
    if (state.mode === 'text') return compact(state.text) || 'По запросу';
    if (state.mode === 'from') return 'от ' + rub(state.min) + ' ₽';
    if (state.mode === 'fixed') return rub(state.min) + ' ₽';
    return rub(state.min) + '–' + rub(state.max) + ' ₽';
  }

  function priceColumns(rate) {
    const found = window.StudioEstimate.priceColumns(rate);
    return found.length ? found : [rate.columns.length - 1];
  }

  // Same grouping as the calculator: a zone collects the tariffs whose group is its name.
  function zoneList(data) {
    const list = (data.zones || []).filter(zone => zone && zone.id).map(zone => {
      const group = compact(zone.group || originalGroups[zone.id] || zone.title);
      return { id: zone.id, title: compact(zone.title) || group, group, image: zone.image || '', aliases: new Set([group, zone.title, zone.id].map(key)), rates: [] };
    });
    const extra = new Map();
    (data.prices || []).forEach((rate, index) => {
      if (!rate || typeof rate !== 'object') return;
      const owner = list.find(zone => zone.aliases.has(key(rate.group)));
      if (owner) { owner.rates.push(index); return; }
      const name = compact(rate.group) || 'Другое';
      if (!extra.has(key(name))) extra.set(key(name), { id: 'extra:' + key(name), title: name, group: name, image: '', aliases: new Set([key(name)]), rates: [] });
      extra.get(key(name)).rates.push(index);
    });
    return [...list, ...extra.values()];
  }

  function zoneImage(zone) {
    let source = zone.image;
    if (originalGroups[zone.id] && (!source || source === 'assets/zone-' + zone.id + '.webp')) source = 'v2/media/zone-' + zone.id + '.webp';
    if (!source) return '';
    try { return new URL(K.mediaUrl(source) || source, K.siteRoot()).href; } catch { return ''; }
  }

  function render(ctx) {
    const data = ctx.data;
    const pricing = window.StudioVehicles;
    const config = pricing && data.vehicles ? pricing.normalize(data.vehicles) : null;
    const root = el('div', 'pz');
    ctx.host.append(root);
    const zones = zoneList(data);
    let active = zones.find(zone => zone.id === sessionStorage.getItem(storageKey)) || zones[0];
    // What the calculator does for each tariff when the cabinet has not said otherwise.
    let defaults = new Map();
    let kinds = new Map();
    function computeDefaults() {
      defaults = new Map();
      kinds = new Map();
      try {
        const engine = window.StudioEstimate.create(data.prices.map(rate => {
          const { carDependent, ...rest } = rate;
          return rest;
        }), data.zones);
        for (const zone of engine.zones) for (const group of zone.groups) for (const choice of group.choices) {
          const index = Number(choice.id.split('-')[1]);
          if (!defaults.has(index)) defaults.set(index, choice.scalable);
          if (!kinds.has(index)) kinds.set(index, choice.kind);
        }
      } catch { /* The cards still work: every tariff counts as car-dependent. */ }
    }
    computeDefaults();
    const scalable = (rate, index) => typeof rate.carDependent === 'boolean' ? rate.carDependent : defaults.get(index) ?? true;
    // «от …» on a zone tile: the cheapest kit, not an extra such as one door or one wheel-arch liner.
    const zonePrice = zone => {
      const kits = zone.rates.filter(index => kinds.get(index) === 'package');
      const chosen = kits.length ? kits : zone.rates.slice(0, 1);
      const values = chosen.map(index => readPrice(data.prices[index].rows[0]?.[priceColumns(data.prices[index])[0]]).min).filter(value => value != null);
      return values.length ? Math.min(...values) : null;
    };

    // Zone tiles.
    const tiles = el('div', 'pz-zones');
    tiles.setAttribute('role', 'group');
    tiles.setAttribute('aria-label', 'Зона машины');
    const tileViews = new Map();
    function drawTiles() {
      tileViews.clear();
      tiles.replaceChildren(...zones.map(zone => {
        const tile = el('button', 'pz-zone');
        tile.type = 'button';
        tile.setAttribute('aria-pressed', String(zone === active));
        const picture = el('span', 'pz-zone-picture');
        const url = zoneImage(zone);
        if (url) {
          const image = el('img');
          image.src = url;
          image.alt = '';
          image.loading = 'lazy';
          picture.append(image);
        } else picture.append(window.StudioArt.illustration('zones', 'pz-zone-art'));
        const check = el('span', 'pz-zone-check');
        check.setAttribute('aria-hidden', 'true');
        const name = el('strong', 'pz-zone-name', zone.title);
        const from = zonePrice(zone);
        const count = zone.rates.length;
        const meta = el('span', 'pz-zone-meta', count ? plural(count, ['комплект', 'комплекта', 'комплектов']) + (from != null ? ' · ' + nbsp('от ' + rub(from) + ' ₽') : '') : 'пока нет цен');
        tile.append(picture, check, name, meta);
        tile.addEventListener('click', () => {
          active = zone;
          sessionStorage.setItem(storageKey, zone.id);
          drawTiles();
          drawZone();
          // The tiles are drawn again: the keyboard focus stays on the chosen zone.
          tileViews.get(zone)?.tile.focus({ preventScroll: true });
          panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        });
        tileViews.set(zone, { tile, meta });
        return tile;
      }));
    }
    function refreshTile(zone) {
      const view = tileViews.get(zone);
      if (!view) return;
      const from = zonePrice(zone);
      view.meta.textContent = zone.rates.length ? plural(zone.rates.length, ['комплект', 'комплекта', 'комплектов']) + (from != null ? ' · ' + nbsp('от ' + rub(from) + ' ₽') : '') : 'пока нет цен';
    }

    const panel = el('section', 'pz-panel');
    panel.setAttribute('aria-live', 'off');

    function drawZone() {
      panel.replaceChildren();
      if (!active) {
        panel.append(el('p', 'k-empty', 'Зон пока нет. Добавьте зону в разделе «Зоны: фото и описание».'));
        return;
      }
      const head = el('div', 'pz-panel-head');
      const title = el('h2', '', active.title);
      const hint = el('p', 'pz-panel-hint', 'Нажмите на цену, сотрите и впишите новую — черновик сохранится сам.');
      const text = el('div');
      text.append(title, hint);
      head.append(text);
      if (!active.id.startsWith('extra:')) {
        const zoneLink = K.button('Фото и описание зоны', () => window.StudioAdmin.navigate('zones'), 'k-quiet pz-zone-link');
        head.append(zoneLink);
      }
      panel.append(head);
      const list = el('div', 'pz-kits');
      for (const index of active.rates) list.append(kitCard(index));
      if (!active.rates.length) list.append(el('p', 'k-empty', 'В этой зоне пока нет комплектов.'));
      panel.append(list);
      const add = el('button', 'pz-add');
      add.type = 'button';
      const plus = el('span', 'pz-add-icon');
      plus.append(window.StudioArt.stepIcon('plus'));
      add.append(plus, el('span', '', 'Добавить комплект в «' + active.title + '»'));
      add.addEventListener('click', () => {
        data.prices.push({
          title: 'Новый комплект', group: active.group, columns: ['Комплект', 'Стоимость'],
          rows: [['Новый комплект', 'от 10 000 ₽']], notes: []
        });
        active.rates.push(data.prices.length - 1);
        ctx.change();
        computeDefaults();
        refreshTile(active);
        drawZone();
        const cards = panel.querySelectorAll('.pz-kit');
        const last = cards[cards.length - 1];
        last?.scrollIntoView({ block: 'center' });
        last?.querySelector('.pz-kit-title')?.select();
      });
      panel.append(add);
    }

    function changed(card, rate, index, options = {}) {
      if (options.price && (rate.sheet || rate.source)) {
        rate.sheet = '';
        rate.source = '';
        card.querySelector('.pz-sheet-note').hidden = false;
      }
      if (options.price && data.page?.priceArchive) data.page.priceArchive = '';
      ctx.change();
      markUnpublished(card, rate, index);
      if (options.tiles) refreshTile(active);
    }

    // The mark follows the kit itself: a copy or a removal above it shifts the places, not the kits.
    let publishedList = null;
    let publishedKits = new Set();
    function markUnpublished(card, rate) {
      const list = window.StudioAdmin.published?.prices || [];
      if (list !== publishedList) {
        publishedList = list;
        publishedKits = new Set(list.map(item => JSON.stringify(item)));
      }
      card.querySelector('.pz-badge').hidden = publishedKits.has(JSON.stringify(rate));
    }

    function kitCard(index) {
      const rate = data.prices[index];
      const columns = priceColumns(rate);
      const card = el('article', 'pz-kit');
      card.dataset.index = String(index);

      // Head: a miniature of the material stack, the name, a «not published» badge.
      const head = el('header', 'pz-kit-head');
      head.append(stack(rate));
      let titleBefore = rate.title || '';
      let bodies = null;
      const titleBox = el('div', 'pz-kit-name');
      const titleInput = el('input', 'pz-kit-title');
      titleInput.value = rate.title || '';
      titleInput.maxLength = 120;
      titleInput.setAttribute('aria-label', 'Название комплекта');
      titleInput.addEventListener('input', () => {
        rate.title = titleInput.value;
        if (rate.rows.length === 1 && key(rate.rows[0][0]) === key(titleBefore)) rate.rows[0][0] = titleInput.value;
        titleBefore = titleInput.value;
        changed(card, rate, index, { price: true });
      });
      const pencil = el('span', 'pz-pencil');
      pencil.append(window.StudioArt.stepIcon('type'));
      pencil.setAttribute('aria-hidden', 'true');
      const meta = el('p', 'pz-kit-meta', kitFacts(rate, columns, scalable(rate, index)));
      titleBox.append(titleInput, pencil, meta);
      const badge = el('span', 'pz-badge', 'Не опубликовано');
      head.append(titleBox, badge);
      card.append(head);

      const sheetNote = el('p', 'pz-sheet-note', 'Фото старого прайс-листа отвязано от этого комплекта: на нём прежняя цена. Новое фото можно загрузить в «Таблица и прайс-лист».');
      sheetNote.hidden = true;

      // Prices: one big field for a kit, a small table for tariffs with several rows or columns.
      const prices = el('div', 'pz-prices');
      const simple = rate.rows.length === 1 && columns.length === 1;
      let mainControl = null;
      rate.rows.forEach((row, rowIndex) => {
        const line = el('div', 'pz-price-row');
        if (!simple && rate.rows.length > 1) {
          const name = el('input', 'pz-row-name');
          name.value = row[0] || '';
          name.maxLength = 160;
          name.setAttribute('aria-label', 'Название строки ' + (rowIndex + 1));
          name.addEventListener('input', () => { row[0] = name.value; changed(card, rate, index, { price: true }); });
          line.append(name);
        }
        for (const column of columns) {
          const label = simple ? 'Цена' : compact(rate.columns[column]) || 'Цена';
          const control = priceControl(row, column, label, simple, () => {
            changed(card, rate, index, { price: true, tiles: rowIndex === 0 });
            if (rowIndex === 0 && column === columns[0]) bodies?.refresh();
            meta.textContent = kitFacts(rate, columns, scalable(rate, index));
          });
          if (rowIndex === 0 && column === columns[0]) mainControl = control;
          line.append(control.box);
        }
        prices.append(line);
      });
      card.append(prices, sheetNote);

      // Car dependence and prices for each body type.
      if (config && config.bodies.length) {
        const dependence = el('label', 'pz-switch');
        const toggle = el('input');
        toggle.type = 'checkbox';
        toggle.checked = scalable(rate, index);
        const track = el('span', 'pz-switch-track');
        track.setAttribute('aria-hidden', 'true');
        const words = el('span', 'pz-switch-text');
        words.append(el('strong', '', 'Цена зависит от машины'), el('small', '', 'Выключите, если цена одна для любой машины — например, за материалы.'));
        dependence.append(toggle, track, words);
        card.append(dependence);
        bodies = bodyPrices(card, rate, index, columns, () => mainControl);
        card.append(bodies.box);
        bodies.box.hidden = !toggle.checked;
        toggle.addEventListener('change', () => {
          rate.carDependent = toggle.checked;
          bodies.box.hidden = !toggle.checked;
          meta.textContent = kitFacts(rate, columns, toggle.checked);
          bodies.refresh();
          changed(card, rate, index);
        });
      }

      // Everything else: description, weights, order, the full table, copy and removal.
      const more = el('details', 'pz-more');
      const summary = el('summary', '', 'Описание, вес и другие настройки');
      more.append(summary);
      const moreBody = el('div', 'pz-more-body');
      const notes = el('textarea', 'pz-notes');
      notes.rows = 3;
      notes.value = (rate.notes || []).join('\n');
      notes.maxLength = 3000;
      notes.addEventListener('input', () => {
        rate.notes = notes.value.split('\n').map(compact).filter(Boolean);
        changed(card, rate, index, { price: true });
      });
      K.wrap(moreBody, 'Описание и состав — клиент видит его под ценой (каждый пункт с новой строки)', notes, { wide: true });
      const facts = el('div', 'pz-facts');
      rate.columns.forEach((heading, column) => {
        if (column === 0 || columns.includes(column)) return;
        rate.rows.forEach((row, rowIndex) => {
          const input = el('input');
          input.value = row[column] || '';
          input.maxLength = 120;
          input.addEventListener('input', () => {
            row[column] = input.value;
            meta.textContent = kitFacts(rate, columns, scalable(rate, index));
            changed(card, rate, index, { price: true });
          });
          K.wrap(facts, compact(heading) + (rate.rows.length > 1 ? ' — ' + compact(row[0]) : ''), input);
        });
      });
      if (simple) {
        const rowName = el('input');
        rowName.value = rate.rows[0][0] || '';
        rowName.maxLength = 160;
        rowName.addEventListener('input', () => { rate.rows[0][0] = rowName.value; changed(card, rate, index, { price: true }); });
        K.wrap(facts, 'Строка в таблице прайса', rowName, { note: 'Так комплект подписан в таблице раздела «Прайс» на сайте.' });
      }
      if (facts.childElementCount) moreBody.append(facts);
      const actions = el('div', 'pz-actions');
      const position = active.rates.indexOf(index);
      const up = K.button('↑ Выше', () => swap(position, position - 1), 'k-quiet');
      up.disabled = position <= 0;
      const down = K.button('↓ Ниже', () => swap(position, position + 1), 'k-quiet');
      down.disabled = position >= active.rates.length - 1;
      const table = K.button('Таблица и прайс-лист', () => window.StudioAdmin.open('price-table', 'prices', index), 'k-quiet');
      const copy = K.button('Скопировать', () => {
        const duplicate = structuredClone(rate);
        duplicate.title = (rate.title || 'Комплект') + ' (копия)';
        duplicate.sheet = '';
        duplicate.source = '';
        data.prices.splice(index + 1, 0, duplicate);
        rebuild();
        ctx.notify('Комплект скопирован. Поменяйте название и цену.');
      }, 'k-quiet');
      const remove = K.button('Удалить', () => {
        if (!window.confirm('Удалить комплект «' + (rate.title || 'без названия') + '»? После публикации он пропадёт с сайта.')) return;
        data.prices.splice(index, 1);
        rebuild();
        ctx.notify('Комплект удалён из черновика.');
      }, 'k-quiet pz-danger');
      actions.append(up, down, table, copy, remove);
      moreBody.append(actions);
      more.append(moreBody);
      card.append(more);
      markUnpublished(card, rate, index);
      return card;
    }

    function swap(from, to) {
      if (to < 0 || to >= active.rates.length) return;
      const a = active.rates[from];
      const b = active.rates[to];
      [data.prices[a], data.prices[b]] = [data.prices[b], data.prices[a]];
      rebuild();
      panel.querySelectorAll('.pz-kit')[to]?.scrollIntoView({ block: 'center' });
    }

    // Indices of the tariffs change after a copy, a removal or a move: start again from the data.
    function rebuild() {
      ctx.change();
      const id = active?.id;
      const fresh = zoneList(data);
      zones.splice(0, zones.length, ...fresh);
      active = zones.find(zone => zone.id === id) || zones[0];
      computeDefaults();
      drawTiles();
      drawZone();
    }

    // One price: «от / ровно / от … до / по запросу», the number written large, the text the site will show.
    function priceControl(row, column, label, large, onChange) {
      const state = readPrice(row[column]);
      const box = el('div', 'pz-price' + (large ? ' pz-price-large' : ''));
      const id = K.uid('price');
      const name = el('label', 'pz-price-label', label);
      name.htmlFor = id;
      const line = el('div', 'pz-price-line');
      const mode = el('select', 'pz-mode');
      mode.setAttribute('aria-label', label + ': как показывать цену');
      for (const [value, text] of modes) mode.append(new Option(text, value));
      mode.value = state.mode;
      const min = el('input', 'pz-number');
      min.id = id;
      min.inputMode = 'numeric';
      min.autocomplete = 'off';
      const dash = el('span', 'pz-dash', '–');
      const max = el('input', 'pz-number');
      max.inputMode = 'numeric';
      max.autocomplete = 'off';
      max.setAttribute('aria-label', label + ': до');
      const ruble = el('span', 'pz-rub', '₽');
      const free = el('input', 'pz-free');
      free.maxLength = 80;
      free.setAttribute('aria-label', label + ': текст цены');
      const site = el('small', 'pz-site');
      const error = el('small', 'pz-error');
      error.id = id + '-error';
      for (const input of [min, max, free]) input.setAttribute('aria-describedby', error.id);
      line.append(mode, min, dash, max, ruble, free);
      box.append(name, line, site, error);
      function flag(message) {
        error.textContent = message;
        box.classList.toggle('is-invalid', Boolean(message));
        for (const input of [min, max, free]) {
          if (message) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
        }
      }

      function show() {
        const numbers = state.mode === 'from' || state.mode === 'fixed' || state.mode === 'range';
        min.hidden = !numbers;
        ruble.hidden = !numbers;
        dash.hidden = max.hidden = state.mode !== 'range';
        free.hidden = state.mode !== 'text';
        if (document.activeElement !== min && !box.classList.contains('is-invalid')) min.value = state.min != null ? rub(state.min) : '';
        if (document.activeElement !== max && !box.classList.contains('is-invalid')) max.value = state.max != null && state.mode === 'range' ? rub(state.max) : '';
        if (document.activeElement !== free) free.value = state.mode === 'text' ? state.text : '';
        site.textContent = 'На сайте: ' + String(row[column] ?? '').replace(/ /g, ' ');
      }
      function commit() {
        flag('');
        if ((state.mode === 'from' || state.mode === 'fixed' || state.mode === 'range') && !(state.min > 0)) {
          flag('Впишите целую цену от 1 до 999 999 999 ₽.');
          return;
        }
        if (state.mode === 'range' && !(state.max > state.min)) {
          flag('Вторая цена должна быть больше первой.');
          return;
        }
        if (state.mode === 'text' && !compact(state.text)) {
          flag('Впишите текст, например «1 500 ₽ за шт.»');
          return;
        }
        const text = writePrice(state);
        if (text === row[column]) { show(); return; }
        row[column] = text;
        show();
        onChange();
      }
      mode.addEventListener('change', () => {
        const next = mode.value;
        if (next === 'range' && state.min != null && (state.max == null || state.max <= state.min)) state.max = Math.max(Math.round(state.min * 1.25 / 500) * 500, state.min + 500);
        if ((next === 'from' || next === 'fixed') && state.min == null) state.min = null;
        if (next === 'text' && !state.text) state.text = writePrice(state.min != null ? state : { mode: 'ask' });
        state.mode = next;
        if (next !== 'range') state.max = next === 'fixed' ? state.min : null;
        show();
        commit();
        (next === 'text' ? free : min).focus();
      });
      min.addEventListener('input', () => {
        state.min = typedNumber(min.value);
        if (state.mode === 'fixed') state.max = state.min;
        commit();
      });
      max.addEventListener('input', () => { state.max = typedNumber(max.value); commit(); });
      free.addEventListener('input', () => { state.text = free.value; commit(); });
      for (const input of [min, max]) {
        input.addEventListener('focus', () => input.select());
        input.addEventListener('blur', show);
      }
      show();
      return { box, get value() { return state.mode === 'ask' || state.mode === 'text' ? readPrice(row[column]).min : state.min; } };
    }

    // Prices for each body type: grey numbers come from the markups, a typed number is used exactly.
    function bodyPrices(card, rate, index, columns, main) {
      const box = el('div', 'pz-bodies');
      const head = el('div', 'pz-bodies-head');
      head.append(el('strong', '', 'Цена для каждого кузова'),
        el('span', '', 'Серым — посчитано по наценке. Впишите своё число, чтобы цена была точной.'));
      const grid = el('div', 'pz-body-grid');
      const zoneId = active.id;
      const cells = config.bodies.map(body => {
        const cell = el('div', 'pz-body');
        const id = K.uid('body');
        const label = el('label', 'pz-body-label');
        label.htmlFor = id;
        if (window.StudioCarShapes) label.append(window.StudioCarShapes.svg(body.shape, 'car-shape pz-car'));
        label.append(el('span', 'pz-body-name', body.title));
        const field = el('span', 'pz-body-field');
        const input = el('input', 'pz-body-input');
        input.id = id;
        input.inputMode = 'numeric';
        input.autocomplete = 'off';
        field.append(input, el('span', 'pz-rub', '₽'));
        const state = el('span', 'pz-body-state');
        const error = el('small', 'pz-error');
        error.id = id + '-error';
        input.setAttribute('aria-describedby', error.id);
        const reset = el('button', 'pz-body-reset', 'Как по наценке');
        reset.type = 'button';
        reset.addEventListener('click', () => {
          if (rate.bodyPrices) delete rate.bodyPrices[body.id];
          if (rate.bodyPrices && !Object.keys(rate.bodyPrices).length) delete rate.bodyPrices;
          error.textContent = '';
          input.removeAttribute('aria-invalid');
          input.value = '';
          refresh();
          changed(card, rate, index);
        });
        input.addEventListener('focus', () => { if (!input.value) input.value = input.placeholder; input.select(); });
        input.addEventListener('input', () => {
          const value = typedNumber(input.value, 100000000);
          if (input.value.trim() && value == null) {
            error.textContent = 'Впишите целую цену от 1 до 100 000 000 ₽ или очистите поле.';
            input.setAttribute('aria-invalid', 'true');
            return;
          }
          error.textContent = '';
          input.removeAttribute('aria-invalid');
          if (value == null) {
            if (rate.bodyPrices) delete rate.bodyPrices[body.id];
            if (rate.bodyPrices && !Object.keys(rate.bodyPrices).length) delete rate.bodyPrices;
          } else {
            rate.bodyPrices = { ...(rate.bodyPrices || {}), [body.id]: value };
          }
          paint(cellView);
          changed(card, rate, index);
        });
        input.addEventListener('blur', () => paint(cellView, true));
        cell.append(label, field, state, reset, error);
        const cellView = { body, cell, input, state, reset };
        return cellView;
      });
      grid.append(...cells.map(item => item.cell));
      const brands = el('p', 'pz-brands');
      const groups = config.classes.filter(group => group.percent);
      brands.append(document.createTextNode(groups.length
        ? 'Для марок ' + groups.map(group => '«' + group.title + '» +' + String(group.percent).replace('.', ',') + '%').join(', ') + ' цена посчитается от этих чисел сама. '
        : 'Наценка за марку сейчас не задана. '));
      const link = el('button', 'pz-link', 'Изменить наценки');
      link.type = 'button';
      link.addEventListener('click', () => window.StudioAdmin.navigate('vehicles'));
      brands.append(link);
      box.append(head, grid, brands);

      function base() {
        const value = main()?.value;
        return value > 0 ? value : null;
      }
      function automatic(body) {
        const value = base();
        return value == null ? null : pricing.quote(config, { body: body.id, groupPercent: 0 }, zoneId, value, null);
      }
      function paint(view, formatted) {
        const auto = automatic(view.body);
        const typed = Number(rate.bodyPrices?.[view.body.id]) || 0;
        view.input.placeholder = auto != null ? rub(auto) : '—';
        if (!view.input.hasAttribute('aria-invalid') && (formatted || document.activeElement !== view.input)) view.input.value = typed ? rub(typed) : '';
        view.cell.dataset.typed = String(Boolean(typed));
        const percent = pricing.bodyPercent(config, view.body.id, zoneId);
        view.state.textContent = typed ? 'вписано вручную' : percent ? 'наценка ' + (percent > 0 ? '+' : '') + String(percent).replace('.', ',') + '%' : 'как в прайсе';
        view.reset.hidden = !typed;
      }
      function refresh() {
        const value = base();
        box.classList.toggle('is-disabled', value == null);
        for (const view of cells) {
          view.input.disabled = value == null;
          paint(view);
        }
      }
      refresh();
      return { box, refresh };
    }

    // After «Опубликовать» the «Не опубликовано» marks go away without redrawing the screen.
    const onPublished = () => {
      if (!root.isConnected) { window.removeEventListener('studio:published', onPublished); return; }
      for (const card of root.querySelectorAll('.pz-kit')) {
        const index = Number(card.dataset.index);
        if (data.prices[index]) markUnpublished(card, data.prices[index], index);
      }
    };
    window.addEventListener('studio:published', onPublished);

    root.append(tiles, panel);
    drawTiles();
    drawZone();
    return () => [...root.querySelectorAll('.pz-error')].find(error => error.textContent && !error.closest('[hidden]'))?.textContent || check(data);
  }

  // Name of the materials of a kit as coloured stripes, metal at the bottom.
  function stack(rate) {
    const box = el('span', 'pz-stack');
    box.setAttribute('aria-hidden', 'true');
    const materials = new Map((window.StudioAdmin.content?.materials || []).map(item => [item.id, item]));
    const layers = Array.isArray(rate.layers) ? rate.layers : [];
    const stripes = [{ color: '#c8cbd3', name: 'Металл' }, ...layers.map(layer => materials.get(layer.material) || { color: '#8e8ba3', name: '' })];
    box.title = stripes.map(item => item.name).filter(Boolean).join(' → ');
    for (const item of stripes.reverse()) {
      const stripe = el('i');
      stripe.style.background = item.color || '#8e8ba3';
      box.append(stripe);
    }
    if (!layers.length) box.classList.add('is-empty');
    return box;
  }

  function kitFacts(rate, columns, carDependent) {
    const parts = [];
    const layers = Array.isArray(rate.layers) ? rate.layers.length : 0;
    if (layers) parts.push(plural(layers, ['слой', 'слоя', 'слоёв']) + ' материала');
    rate.columns.forEach((heading, column) => {
      if (column === 0 || columns.includes(column)) return;
      const value = compact(rate.rows[0]?.[column]);
      if (value && /вес/i.test(heading)) parts.push(compact(heading).toLowerCase() + ' ' + value);
    });
    parts.push(carDependent ? 'цена для седана массовой марки' : 'цена одна для любой машины');
    const text = parts.join(' · ').replace(/(\d) (кг)/g, '$1\u00a0$2');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function plural(count, words) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    const word = mod10 === 1 && mod100 !== 11 ? words[0] : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? words[1] : words[2];
    return count + ' ' + word;
  }

  function check(data) {
    for (const rate of data.prices || []) {
      if (!rate || !Array.isArray(rate.rows) || !Array.isArray(rate.columns)) continue;
      if (!compact(rate.title)) return 'Цены: у каждого комплекта должно быть название.';
      for (const column of priceColumns(rate)) {
        for (const row of rate.rows) {
          if (!compact(row[column])) return 'Цены: впишите цену для «' + rate.title + '».';
        }
      }
      for (const value of Object.values(rate.bodyPrices || {})) {
        if (!Number.isSafeInteger(value) || value <= 0 || value > 100000000) return 'Цены: цена для кузова в «' + rate.title + '» должна быть целым числом рублей.';
      }
    }
    return '';
  }

  window.StudioAdmin.register({
    id: 'prices', title: 'Цены', group: 'Цены', order: 10,
    description: 'Стоимость комплектов для каждой зоны машины. Нажмите на цену и впишите новую — калькулятор и прайс на сайте пересчитаются.',
    validateData: check, render
  });
})();
