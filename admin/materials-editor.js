(() => {
  'use strict';
  const K = window.StudioKit;
  const originalGroups = { doors: 'Двери', arches: 'Арки и шины', floor: 'Пол', trunk: 'Багажник', roof: 'Потолок', dashboard: 'Торпедо' };
  const groupOf = zone => zone.group || originalGroups[zone.id] || zone.title;
  const kindNames = [['damper', 'Вибродемпфер'], ['insulator', 'Звукоизолятор'], ['absorber', 'Шумопоглотитель'], ['membrane', 'Акустическая мембрана'],
    ['mastic', 'Мастика'], ['antisqueak', 'Антискрип'], ['other', 'Другое']];
  const textureNames = [['print', 'Лист с надписью'], ['foil', 'Фольга с тиснением'], ['felt', 'Войлок'], ['wave', 'Волнистый поролон'],
    ['eggcrate', 'Ячеистый поролон'], ['membrane', 'Плотная плёнка'], ['gloss', 'Глянцевая мастика']];
  const shapeNames = [['door', 'Дверь'], ['floor', 'Пол'], ['roof', 'Потолок'], ['trunk', 'Багажник'], ['arch', 'Арка'], ['dashboard', 'Торпедо']];
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const shortName = material => String(material?.name || '').replace(/^comfortmat\s+/i, '');
  const capital = text => text.charAt(0).toLocaleUpperCase('ru') + text.slice(1);

  // The same reading of the data as on the site: the drawing of a zone, its kits and the known materials.
  const shapeOf = zone => window.StudioLayerArt.shapes[zone.structure?.shape] || window.StudioLayerArt.shapes.door;
  const ratesOf = (data, zone) => (data.prices || []).filter(rate => record(rate) && (rate.group === groupOf(zone) || rate.group === zone.title));
  const materialsOf = data => new Map((data.materials || []).filter(item => item && typeof item.id === 'string').map(item => [item.id, item]));
  const explicit = layer => 'on' in layer || 'altOn' in layer;
  const samePlace = (a, b) => String(a.on) === String(b.on) && String(a.altOn) === String(b.altOn);
  const sameAreas = (a, b) => String([...a.on].sort()) === String([...b.on].sort()) && String([...a.altOn].sort()) === String([...b.altOn].sort());

  // Where every sheet of a kit lies now and where the site alone would put it: Map(sheet → { on, altOn, auto: { on, altOn } }).
  function places(shape, layers, byId) {
    const result = new Map();
    if (!shape.parts || !Array.isArray(layers)) return result;
    const read = list => window.StudioLayerArt.plan(shape, {}, list, byId).filter(item => item.type === 'material')
      .map(sheet => ({ source: sheet.source, on: [...sheet.spots[0].areas], altOn: sheet.alt ? [...(sheet.spots[1]?.areas || [])] : [] }));
    const auto = read(layers.map(layer => record(layer) ? { material: layer.material, alt: layer.alt } : layer));
    read(layers).forEach((place, index) => result.set(place.source, { on: place.on, altOn: place.altOn, auto: auto[index] }));
    return result;
  }

  function pin(layer, place) {
    layer.on = [...place.on];
    if (place.altOn.length) layer.altOn = [...place.altOn]; else delete layer.altOn;
  }

  // A second material is never left without a place: it gets the usual split of the site,
  // otherwise a free area next to the first material, otherwise a share of the first material.
  function settle(shape, layers, byId) {
    let changed = false;
    for (const [layer, place] of places(shape, layers, byId)) {
      if (!byId.has(layer.alt) || place.altOn.length) continue;
      if (place.auto.altOn.length) { delete layer.on; delete layer.altOn; }
      else {
        const free = Object.keys(shape.areas).filter(id => !place.on.includes(id));
        const near = shape.areas[place.on[0]].part;
        const area = free.find(id => shape.areas[id].part === near) || free[0];
        if (area) pin(layer, { on: place.on, altOn: [area] });
        else if (place.on.length > 1) pin(layer, { on: place.on.slice(0, -1), altOn: place.on.slice(-1) });
        else continue;
      }
      changed = true;
    }
    return changed;
  }

  // After an edit of one sheet the others stay where the screen showed them (before — places() taken before the edit),
  // even if the site alone would now move them. The sheets are then stored in the order of the screen,
  // so that nothing depends on an order the owner cannot see.
  function steady(shape, rate, byId, before, edited) {
    const hold = (shown, free) => {
      for (const [layer, now] of places(shape, rate.layers, byId)) {
        const was = shown.get(layer);
        if (layer !== free && was && !samePlace(was, now)) pin(layer, was);
      }
    };
    hold(before, edited);
    settle(shape, rate.layers, byId);
    const now = edited && places(shape, rate.layers, byId).get(edited);
    if (now && explicit(edited)) pin(edited, now);
    if (!shape.parts) return;
    const shown = places(shape, rate.layers, byId);
    const order = window.StudioLayerArt.plan(shape, {}, rate.layers, byId).filter(item => item.type === 'material').map(item => item.source);
    rate.layers = [...order, ...rate.layers.filter(layer => !order.includes(layer))];
    hold(shown);
  }

  // A tick gives an area to a material of the sheet (owner: 'on' or 'altOn'), the other material gives it up.
  // Returns the reason when the tick is refused: no material may lose its last area.
  function retick(shape, layer, place, owner, id, checked, names) {
    const other = owner === 'on' ? 'altOn' : 'on';
    const next = { on: new Set(place.on), altOn: new Set(place.altOn) };
    if (checked) {
      if (next[other].has(id)) {
        if (next[other].size < 2) return 'Это единственный участок материала «' + names[other] + '». Сначала отметьте для него другой участок.';
        next[other].delete(id);
      }
      next[owner].add(id);
    } else {
      if (next[owner].size < 2) {
        return names.altOn ? 'У материала «' + names[owner] + '» должен остаться хотя бы один участок.'
          : 'Слой должен клеиться хотя бы на один участок. Лишний слой убирает кнопка «Убрать слой».';
      }
      next[owner].delete(id);
    }
    const order = Object.keys(shape.areas);
    pin(layer, { on: order.filter(area => next.on.has(area)), altOn: order.filter(area => next.altOn.has(area)) });
    return '';
  }

  // Without the second material the first one takes over its areas.
  function single(shape, layer, place) {
    delete layer.alt;
    if (place && 'on' in layer) layer.on = Object.keys(shape.areas).filter(id => place.on.includes(id) || place.altOn.includes(id));
    delete layer.altOn;
  }

  // Areas a drawing does not have are dropped without a question: the site ignores them, and the owner cannot see or fix them.
  // One area never belongs to both materials of a sheet. Returns true when something was corrected.
  function tidy(data) {
    if (!window.StudioLayerArt) return false;
    const byId = materialsOf(data);
    let changed = false;
    const put = (layer, key, list) => {
      const before = layer[key];
      if (!list.length) { if (!(key in layer)) return; delete layer[key]; }
      else if (Array.isArray(before) && String(before) === String(list)) return;
      else layer[key] = list;
      changed = true;
    };
    for (const zone of data.zones || []) {
      if (!record(zone)) continue;
      const shape = shapeOf(zone);
      const known = value => [...new Set((Array.isArray(value) ? value : [value])
        .filter(id => typeof id === 'string' && shape.areas && Object.hasOwn(shape.areas, id)))];
      for (const rate of ratesOf(data, zone)) {
        if (!Array.isArray(rate.layers)) continue;
        for (const layer of rate.layers) {
          if (!record(layer)) continue;
          const on = known(layer.on);
          put(layer, 'on', on);
          put(layer, 'altOn', byId.has(layer.alt) ? known(layer.altOn).filter(id => !on.includes(id)) : []);
        }
        if (shape.parts && settle(shape, rate.layers, byId)) changed = true;
      }
    }
    return changed;
  }

  let defsRoot = null;
  function ensureDefs(materials) {
    const art = window.StudioLayerArt;
    if (!art) return false;
    if (!defsRoot) {
      defsRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      defsRoot.setAttribute('class', 'k-defs');
      defsRoot.setAttribute('aria-hidden', 'true');
      document.body.append(defsRoot);
    }
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    art.buildDefs(defs, materials.filter(item => item?.id));
    defsRoot.replaceChildren(defs);
    return true;
  }

  function swatch(material, shape = 'roof') {
    const art = window.StudioLayerArt;
    const box = K.el('div', 'k-swatch');
    if (!art || !material?.id) return box;
    box.append(art.layerArt(art.shapes[shape] || art.shapes.roof, { type: 'material', material, kind: material.kind }, 0, 1));
    return box;
  }

  function render(ctx) {
    const data = ctx.data;
    if (!Array.isArray(data.materials)) data.materials = structuredClone(window.STUDIO_MATERIALS || []);
    const materials = data.materials;
    const host = ctx.host;
    const art = window.StudioLayerArt;
    let redrawStacks = () => {};
    const local = { ...ctx, change() { ctx.change(); } };
    const redrawArt = () => { ensureDefs(materials); swatchesRedraw(); redrawStacks(); };
    let swatchesRedraw = () => {};
    let openPart = () => {};
    const corrected = tidy(data);
    if (corrected) ctx.change();

    const intro = K.card(host, 'Как устроен раздел «Что внутри»', null, 'k-explain');
    intro.append(K.el('p', '', 'У каждой зоны есть рисунок: детали кузова, обшивка и участки, на которые клеят материалы. Комплект — это слои материалов и отметки, куда каждый из них клеится. Сайт рисует слой цветом и фактурой материала на его участках и собирает стопку от металла к салону.'),
      K.el('p', '', 'Здесь вы меняете материалы, слои комплектов, их места и названия деталей. Новый контур детали или участок по вашему эскизу дорисует разработчик.'));

    // Stacks per tariff.
    const stacks = K.card(host, 'Слои в комплектах', 'Выберите зону. Список повторяет стопку на сайте: деталь кузова, слои на ней — и так до обшивки. Стрелки меняют порядок слоёв на одной детали, а на другую деталь слой переносят галочки «Куда клеится».');
    const zoneSelect = K.el('select');
    for (const zone of data.zones || []) zoneSelect.append(new Option(zone.title, zone.id));
    K.wrap(stacks, 'Зона', zoneSelect);
    if (corrected) {
      const notice = K.el('p', 'k-note k-stack-notice', 'Места некоторых слоёв не подходили к рисунку зоны — сайт подобрал их заново. Проверьте галочки «Куда клеится».');
      notice.setAttribute('role', 'status');
      stacks.append(notice);
    }
    const stackHost = K.el('div', 'k-stacks');
    stacks.append(stackHost);
    zoneSelect.addEventListener('change', () => redrawStacks());
    // Sheets of a kit switched off by mistake come back with the tick until the page is left.
    const shelved = new WeakMap();

    redrawStacks = focus => {
      const zone = (data.zones || []).find(item => item.id === zoneSelect.value);
      stackHost.replaceChildren();
      if (!zone) return;
      const rates = ratesOf(data, zone);
      if (!rates.length) { stackHost.append(K.el('p', 'k-empty', 'В этой зоне пока нет тарифов. Добавьте их в разделе «Прайс».')); return; }
      if (!art) { stackHost.append(K.el('p', 'k-empty', 'Рисунки слоёв не загрузились. Обновите страницу.')); return; }
      const byId = materialsOf(data);
      for (const rate of rates) stackHost.append(stackBox(zone, shapeOf(zone), rate, byId));
      const target = focus && stackHost.querySelector('[data-key="' + focus + '"]');
      if (target) (target.disabled ? target.parentElement.querySelector('button:not(:disabled)') : target)?.focus();
    };

    function stackBox(zone, shape, rate, byId) {
      const box = K.el('div', 'k-stack');
      const head = K.el('div', 'k-stack-head');
      head.append(K.el('h3', '', rate.title));
      const shown = Array.isArray(rate.layers) && rate.layers.length > 0;
      const toggle = K.el('label', 'k-check');
      const input = K.el('input');
      input.type = 'checkbox';
      input.checked = shown;
      input.addEventListener('change', () => {
        // An emptied list is the owner's choice. Without the field the kit would get the studio sheets back on the next load.
        if (input.checked) rate.layers = shelved.get(rate) || [{ material: materials[0]?.id || '' }];
        else { if (shown) shelved.set(rate, rate.layers); rate.layers = []; }
        tidy(data);
        local.change();
        redrawStacks();
      });
      toggle.append(input, K.el('span', '', 'Показывать в «Что внутри»'));
      head.append(toggle);
      box.append(head);
      if (!shown) return box;

      const stack = art.plan(shape, zone.structure, rate.layers, byId);
      const sheets = stack.filter(item => item.type === 'material');
      const spots = places(shape, rate.layers, byId);
      const key = (layer, role) => data.prices.indexOf(rate) + '-' + rate.layers.indexOf(layer) + '-' + role;
      const options = materials.map(m => [m.id, m.name]);
      const keep = (edited, target, role) => {
        steady(shape, rate, byId, spots, edited);
        local.change();
        redrawStacks(role && key(target, role));
      };

      const list = K.el('ol', 'k-layer-list');
      // A part of the body and the sheets glued to it stand in one box, as they are one group of the opened stack.
      let group = null;
      let groupId;
      for (const item of stack) {
        const id = item.type === 'material' ? item.host : item.part;
        if (id && id !== groupId) {
          const box = K.el('li', 'k-layer-group');
          group = K.el('ol', 'k-layer-set');
          box.append(group);
          list.append(box);
          groupId = id;
        }
        if (item.type !== 'material') {
          const row = K.el('li', 'k-layer k-layer-fixed');
          row.dataset.type = item.type;
          const glued = sheets.some(sheet => sheet.host && sheet.host === item.part);
          const rename = K.button('Название и текст', () => openPart(zone, item), 'k-ghost');
          rename.setAttribute('aria-label', item.title + ' — изменить название и текст');
          row.append(K.el('span', 'k-layer-name', item.title), K.el('small', 'k-note', item.type === 'cover'
            ? glued ? 'обшивка — слои выше клеят на её обратную сторону' : 'обшивка, закрывает слои'
            : glued ? 'деталь кузова — на неё клеят слои ниже' : 'деталь кузова'), rename);
          (group || list).append(row);
          continue;
        }
        const layer = item.source;
        const row = K.el('li', 'k-layer');
        const samples = K.el('div', 'k-swatches');
        samples.append(swatch(item.material, 'roof'));
        if (item.alt) samples.append(swatch(item.alt, 'roof'));
        const fields = K.el('div', 'k-layer-fields');
        const material = K.select(local, fields, layer, 'material', 'Материал', options, { onInput: () => keep(layer, layer, 'material') });
        material.dataset.key = key(layer, 'material');
        const alt = K.select(local, fields, layer, 'alt', 'Второй материал (в другой части зоны)', [['', '— нет —'], ...options], { onInput: value => {
          if (!value) single(shape, layer, spots.get(layer));
          keep(layer, layer, 'alt');
        } });
        if (!layer.alt) alt.value = '';
        alt.dataset.key = key(layer, 'alt');
        const place = spots.get(layer);
        if (place) fields.append(whereBox(shape, layer, item, place, key, keep));
        K.text(local, fields, layer, 'note', 'Пояснение', { wide: true, onInput: value => { if (!value) { delete layer.note; local.change(); } },
          placeholder: place ? 'Необязательно: место слоя сайт подпишет сам' : 'Например: Bronze 2 — на пластиковые подкрылки, Locker — на войлочные' });
        const tools = K.el('div', 'k-row-tools');
        const mates = sheets.filter(other => (other.host || '') === (item.host || ''));
        const at = mates.indexOf(item);
        const swap = other => {
          const a = rate.layers.indexOf(layer);
          const b = rate.layers.indexOf(other.source);
          [rate.layers[a], rate.layers[b]] = [rate.layers[b], rate.layers[a]];
        };
        if (mates.length > 1) {
          const up = K.button('↑', () => { swap(mates[at - 1]); keep(null, layer, 'up'); }, 'k-icon');
          const down = K.button('↓', () => { swap(mates[at + 1]); keep(null, layer, 'down'); }, 'k-icon');
          up.disabled = at === 0;
          down.disabled = at === mates.length - 1;
          up.dataset.key = key(layer, 'up');
          down.dataset.key = key(layer, 'down');
          up.setAttribute('aria-label', item.title + ' — выше, ближе к детали кузова');
          down.setAttribute('aria-label', item.title + ' — ниже, ближе к обшивке');
          up.title = down.title = 'Порядок слоёв на одной детали';
          tools.append(up, down);
        }
        const remove = K.button('Убрать слой', () => { rate.layers.splice(rate.layers.indexOf(layer), 1); keep(null, null, 'add'); }, 'k-danger');
        remove.setAttribute('aria-label', item.title + ' — убрать слой');
        tools.append(remove);
        row.append(samples, fields, tools);
        (group || list).append(row);
      }
      // A sheet whose material is gone is not drawn by the site; it stays here until it gets a material or is removed.
      for (const layer of rate.layers) {
        if (!record(layer) || sheets.some(sheet => sheet.source === layer)) continue;
        const row = K.el('li', 'k-layer k-layer-lost');
        const fields = K.el('div', 'k-layer-fields');
        K.select(local, fields, layer, 'material', 'Материал', options, { onInput: () => keep(layer, layer, 'material'),
          note: 'Материал не найден. Выберите другой или уберите слой.' }).value = '';
        const tools = K.el('div', 'k-row-tools');
        tools.append(K.button('Убрать слой', () => { rate.layers.splice(rate.layers.indexOf(layer), 1); keep(null, null, 'add'); }, 'k-danger'));
        row.append(K.el('div', 'k-swatches'), fields, tools);
        list.append(row);
      }
      const add = K.button('Добавить слой', () => {
        const layer = { material: materials[0]?.id || '' };
        rate.layers.push(layer);
        keep(layer, layer, 'material');
      }, 'k-add');
      add.dataset.key = key(null, 'add');
      box.append(list, add);
      return box;
    }

    // Ticks of the areas a sheet is glued to, one row per material of the sheet.
    function whereBox(shape, layer, sheet, place, key, keep) {
      const box = K.el('fieldset', 'k-where');
      box.append(K.el('legend', '', 'Куда клеится'));
      const names = { on: shortName(sheet.material), altOn: sheet.alt ? shortName(sheet.alt) : '' };
      const hint = K.el('p', 'k-where-hint');
      hint.setAttribute('role', 'status');
      for (const owner of names.altOn ? ['on', 'altOn'] : ['on']) {
        const row = K.el('div', 'k-where-row');
        row.setAttribute('role', 'group');
        row.setAttribute('aria-label', 'Куда клеится ' + names[owner]);
        if (names.altOn) {
          const name = K.el('span', 'k-where-name', names[owner]);
          const dot = K.el('i');
          const color = (owner === 'on' ? sheet.material : sheet.alt).color;
          if (/^#[0-9a-f]{6}$/i.test(color || '')) dot.style.background = color;
          name.prepend(dot);
          box.append(name);
        }
        for (const [id, area] of Object.entries(shape.areas)) {
          const label = K.el('label', 'k-check');
          const input = K.el('input');
          input.type = 'checkbox';
          input.checked = place[owner].includes(id);
          input.dataset.key = key(layer, owner + '-' + id);
          input.addEventListener('change', () => {
            const refusal = retick(shape, layer, place, owner, id, input.checked, names);
            if (refusal) { input.checked = !input.checked; hint.textContent = refusal; }
            else keep(layer, layer, owner + '-' + id);
          });
          label.append(input, K.el('span', '', capital(area.name)));
          row.append(label);
        }
        box.append(row);
      }
      const site = (sheet.where || []).map(spot => (sheet.where.length > 1 ? shortName(spot.material) + ' — ' : '') + spot.text).join('; ');
      if (site) box.append(K.el('p', 'k-note k-where-site', 'Подпись на сайте: ' + site + '.'));
      if (names.altOn) box.append(K.el('p', 'k-note', 'Участок бывает только у одного из двух материалов: отметьте его у другого — и он перейдёт.'));
      if (!explicit(layer)) box.append(K.el('p', 'k-note', 'Место подобрал сайт — по типу материала. Отметьте участки сами, чтобы закрепить их за слоем.'));
      else if (!sameAreas(place, place.auto) && (!names.altOn || place.auto.altOn.length)) {
        const reset = K.button('Вернуть, как подберёт сайт', () => { delete layer.on; delete layer.altOn; keep(layer, layer, 'material'); }, 'k-ghost');
        reset.dataset.key = key(layer, 'auto');
        box.append(reset);
      }
      box.append(hint);
      return box;
    }

    // Materials catalogue.
    const catalogue = K.card(host, 'Материалы', 'Цвет и надпись повторяют настоящий лист — так клиент узнаёт материал на фото работ.');
    const list = K.el('div', 'k-materials');
    catalogue.append(list, K.button('Добавить материал', () => {
      let n = materials.length + 1;
      while (materials.some(item => item.id === 'material-' + n)) n++;
      materials.push({ id: 'material-' + n, name: 'Новый материал', label: 'NEW', kind: 'damper', texture: 'print', color: '#3a3842', print: '#bcb9d9', text: '', note: '' });
      local.change();
      drawMaterials(materials.length - 1);
    }, 'k-add'));

    function usage(id) {
      return (data.prices || []).filter(rate => (rate.layers || []).some(layer => layer.material === id || layer.alt === id)).map(rate => rate.group + ' · ' + rate.title);
    }

    function drawMaterials(focusIndex) {
      list.replaceChildren();
      const swatches = [];
      materials.forEach((material, index) => {
        const item = K.el('details', 'k-material');
        item.open = index === focusIndex;
        const summary = K.el('summary');
        const preview = swatch(material, 'door');
        swatches.push(() => preview.replaceChildren(...swatch(material, 'door').childNodes));
        const title = K.el('span', 'k-material-title');
        title.append(K.el('strong', '', material.name), K.el('small', '', (kindNames.find(([id]) => id === material.kind)?.[1] || 'Материал') + (material.note ? ' · ' + material.note : '')));
        summary.append(preview, title);
        item.append(summary);
        const fields = K.el('div', 'k-grid');
        // The purpose of a material moves the sheets whose place the site picks itself.
        const live = { ...local, change() { tidy(data); local.change(); title.firstChild.textContent = material.name; redrawArt(); } };
        const name = K.text(live, fields, material, 'name', 'Название', { max: 60 });
        K.text(live, fields, material, 'label', 'Надпись на листе', { max: 14, note: 'Короткое слово, как печатают на материале.' });
        K.select(live, fields, material, 'kind', 'Назначение', kindNames);
        K.select(live, fields, material, 'texture', 'Фактура', textureNames);
        K.color(live, fields, material, 'color', 'Цвет листа');
        K.color(live, fields, material, 'print', 'Цвет надписи');
        K.text(live, fields, material, 'text', 'Описание для клиента', { lines: 2, wide: true, max: 400 });
        K.text(live, fields, material, 'note', 'Цена или примечание', { placeholder: 'Например: 635 ₽ за лист' });
        const tools = K.el('div', 'k-row-tools');
        tools.append(K.button('Удалить материал', () => {
          const used = usage(material.id);
          if (used.length) { ctx.notify('Материал используется в тарифах: ' + used.join(', ') + '. Сначала уберите его из слоёв.', true); return; }
          if (!window.confirm('Удалить материал «' + material.name + '»?')) return;
          materials.splice(index, 1);
          local.change();
          ensureDefs(materials);
          drawMaterials();
          redrawStacks();
        }, 'k-danger'));
        item.append(fields, tools);
        list.append(item);
        if (index === focusIndex) name.focus();
      });
      swatchesRedraw = () => swatches.forEach(draw => draw());
    }

    // Zone structure: the drawing and the words about each of its parts.
    const zonesBox = K.card(host, 'Детали кузова и обшивка по зонам', 'Детали не зависят от комплекта. Выберите рисунок зоны и задайте, как называется каждая деталь и что о ней сказано на сайте. Пустое поле — сайт покажет текст, который виден в нём серым.');
    const partFields = new Map();
    for (const zone of data.zones || []) {
      if (!record(zone)) continue;
      zone.structure = record(zone.structure) ? zone.structure : { shape: 'door' };
      const structure = zone.structure;
      const item = K.el('details', 'k-zone-structure');
      item.append(K.el('summary', '', zone.title));
      const top = K.el('div', 'k-grid');
      const select = K.el('select');
      for (const [value, title] of shapeNames) select.append(new Option(title, value));
      const current = () => shapeNames.some(([value]) => value === structure.shape) ? structure.shape : 'door';
      select.value = current();
      const status = K.el('p', 'k-note k-zone-status');
      status.setAttribute('role', 'status');
      const partsHost = K.el('div', 'k-parts');
      // Texts of a part other than the first sheet of metal and the trim live under the name of the part.
      const extra = id => ({
        get title() { return structure.parts?.[id]?.title; },
        set title(value) { own(id).title = value; },
        get text() { return structure.parts?.[id]?.text; },
        set text(value) { own(id).text = value; }
      });
      const own = id => {
        if (!record(structure.parts)) structure.parts = {};
        return record(structure.parts[id]) ? structure.parts[id] : (structure.parts[id] = {});
      };
      const drawParts = () => {
        partsHost.replaceChildren();
        if (!art) return;
        const shape = shapeOf(zone);
        // An empty kit of an empty zone: the parts of the drawing with the names and texts the site uses by default.
        const parts = art.plan(shape, {}, [], new Map());
        const first = parts.find(part => part.type === 'base');
        for (const part of parts) {
          const box = K.el('fieldset', 'k-part');
          const kind = part.type === 'cover' ? 'Обшивка' : 'Деталь кузова';
          box.append(K.el('legend', '', shape.parts ? kind + ': ' + part.title.toLocaleLowerCase('ru') : kind));
          const [target, title, text] = part.type === 'cover' ? [structure, 'cover', 'coverText']
            : part === first ? [structure, 'base', 'baseText'] : [extra(part.part), 'title', 'text'];
          const name = K.text(local, box, target, title, 'Название', { placeholder: part.title, onInput: () => redrawStacks() });
          K.text(local, box, target, text, 'Текст', { lines: 3, placeholder: part.text });
          partFields.set(zone.id + '/' + (part.part || part.type), () => {
            item.open = true;
            name.scrollIntoView({ block: 'center' });
            name.focus({ preventScroll: true });
          });
          partsHost.append(box);
        }
      };
      select.addEventListener('change', () => {
        const pinned = ratesOf(data, zone).flatMap(rate => Array.isArray(rate.layers) ? rate.layers : []).filter(layer => record(layer) && explicit(layer));
        if (pinned.length && !window.confirm('Сменить рисунок зоны «' + zone.title + '»? У нового рисунка другие участки, поэтому места слоёв в комплектах этой зоны сбросятся: сайт подберёт их заново по типу материала.')) {
          select.value = current();
          return;
        }
        structure.shape = select.value;
        for (const layer of pinned) { delete layer.on; delete layer.altOn; }
        tidy(data);
        local.change();
        status.textContent = pinned.length ? 'Рисунок изменён, места слоёв сайт подобрал заново. Проверьте их выше, в блоке «Слои в комплектах».' : '';
        drawParts();
        redrawStacks();
      });
      K.wrap(top, 'Рисунок детали', select, { note: 'Готовые рисунки. Новый контур, участок или деталь по эскизу добавляет разработчик.' });
      drawParts();
      item.append(top, status, partsHost);
      zonesBox.append(item);
    }
    openPart = (zone, part) => partFields.get(zone.id + '/' + (part.part || part.type))?.();

    ensureDefs(materials);
    drawMaterials();
    redrawStacks();
    return () => check(data);
  }

  function check(data) {
    tidy(data);
    for (const material of data.materials || []) {
      if (!String(material.name || '').trim()) return 'Материалы: у каждого материала должно быть название.';
    }
    const ids = new Set((data.materials || []).map(material => material.id));
    for (const rate of data.prices || []) {
      for (const layer of rate.layers || []) {
        if (!ids.has(layer.material)) return 'Материалы: в тарифе «' + rate.title + '» выберите материал для каждого слоя.';
      }
    }
    return '';
  }

  window.StudioAdmin.register({
    id: 'materials', title: 'Материалы и слои', group: 'Фото и работы', order: 30,
    description: 'Материалы студии, слои каждого комплекта и места, куда их клеят, — для схем «Что внутри».',
    validateData: check, render,
    // The rules of the edits are plain functions over the data: the tests run them without a page.
    model: { places, steady, retick, single, tidy }
  });
})();
