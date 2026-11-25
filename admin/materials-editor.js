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
    let redrawStacks = () => {};
    const local = { ...ctx, change() { ctx.change(); } };
    const redrawArt = () => { ensureDefs(materials); swatchesRedraw(); redrawStacks(); };
    let swatchesRedraw = () => {};

    const intro = K.card(host, 'Как устроен раздел «Что внутри»', null, 'k-explain');
    intro.append(K.el('p', '', 'Для каждого комплекта задаётся стопка слоёв: от металла кузова к обшивке. Сайт рисует эти слои цветом и фактурой материала и показывает анимацию сборки. Здесь вы меняете материалы, их порядок и описание.'));

    // Stacks per tariff.
    const stacks = K.card(host, 'Слои в комплектах', 'Выберите зону. Порядок — от металла к обшивке: первым идёт слой, который клеят на металл.');
    const zoneSelect = K.el('select');
    for (const zone of data.zones || []) zoneSelect.append(new Option(zone.title, zone.id));
    K.wrap(stacks, 'Зона', zoneSelect);
    const stackHost = K.el('div', 'k-stacks');
    stacks.append(stackHost);
    zoneSelect.addEventListener('change', () => redrawStacks());

    redrawStacks = () => {
      const zone = (data.zones || []).find(item => item.id === zoneSelect.value);
      stackHost.replaceChildren();
      if (!zone) return;
      const rates = (data.prices || []).filter(rate => rate.group === groupOf(zone));
      if (!rates.length) { stackHost.append(K.el('p', 'k-empty', 'В этой зоне пока нет тарифов. Добавьте их в разделе «Прайс».')); return; }
      for (const rate of rates) {
        const box = K.el('div', 'k-stack');
        const head = K.el('div', 'k-stack-head');
        head.append(K.el('h3', '', rate.title));
        const enabled = Array.isArray(rate.layers);
        const toggle = K.el('label', 'k-check');
        const input = K.el('input');
        input.type = 'checkbox';
        input.checked = enabled;
        input.addEventListener('change', () => {
          if (input.checked) rate.layers = rate.layers && Array.isArray(rate.layers) ? rate.layers : [{ material: materials[0]?.id || '' }];
          else delete rate.layers;
          local.change();
          redrawStacks();
        });
        toggle.append(input, K.el('span', '', 'Показывать в «Что внутри»'));
        head.append(toggle);
        box.append(head);
        if (enabled) {
          const list = K.el('ol', 'k-layer-list');
          const structure = zone.structure || {};
          const baseItem = K.el('li', 'k-layer k-layer-fixed');
          baseItem.append(K.el('span', 'k-layer-name', structure.base || 'Металл кузова'), K.el('small', 'k-note', 'основа'));
          list.append(baseItem);
          rate.layers.forEach((layer, index) => {
            const item = K.el('li', 'k-layer');
            const material = materials.find(m => m.id === layer.material);
            item.append(swatch(material, 'roof'));
            const fields = K.el('div', 'k-layer-fields');
            const options = materials.map(m => [m.id, m.name]);
            K.select(local, fields, layer, 'material', 'Материал', options, { onInput: () => redrawStacks() });
            const alt = K.select(local, fields, layer, 'alt', 'Второй материал (в другой части зоны)', [['', '— нет —'], ...options], { onInput: value => { if (!value) delete layer.alt; redrawStacks(); } });
            if (!layer.alt) alt.value = '';
            K.text(local, fields, layer, 'note', 'Пояснение', { placeholder: 'Например: Bronze 3 — на пол, Bronze 2 — на крышку', wide: true });
            const tools = K.el('div', 'k-row-tools');
            tools.append(
              K.button('↑', () => { if (K.move(rate.layers, index, index - 1)) { local.change(); redrawStacks(); } }, 'k-icon'),
              K.button('↓', () => { if (K.move(rate.layers, index, index + 1)) { local.change(); redrawStacks(); } }, 'k-icon'),
              K.button('Убрать слой', () => { rate.layers.splice(index, 1); local.change(); redrawStacks(); }, 'k-danger'));
            tools.children[0].disabled = index === 0;
            tools.children[1].disabled = index === rate.layers.length - 1;
            tools.children[0].setAttribute('aria-label', 'Слой ' + (index + 1) + ' — выше');
            tools.children[1].setAttribute('aria-label', 'Слой ' + (index + 1) + ' — ниже');
            item.append(fields, tools);
            list.append(item);
          });
          const coverItem = K.el('li', 'k-layer k-layer-fixed');
          coverItem.append(K.el('span', 'k-layer-name', structure.cover || 'Обшивка'), K.el('small', 'k-note', 'закрывает слои'));
          list.append(coverItem);
          box.append(list, K.button('Добавить слой', () => {
            rate.layers.push({ material: materials[0]?.id || '' });
            local.change();
            redrawStacks();
          }, 'k-add'));
        }
        stackHost.append(box);
      }
    };

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
        const live = { ...local, change() { local.change(); title.firstChild.textContent = material.name; redrawArt(); } };
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
          if (used.length) { ctx.notify('Материал используется в тарифах: ' + used.join(', ') + '. Сначала уберите его из слоёв.'); return; }
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

    // Zone structure: the drawing, the first and the last layer.
    const zonesBox = K.card(host, 'Начало и конец стопки по зонам', 'Металл и обшивка не зависят от комплекта. Здесь их названия и тексты.');
    for (const zone of data.zones || []) {
      zone.structure = zone.structure && typeof zone.structure === 'object' ? zone.structure : { shape: 'door' };
      const item = K.el('details', 'k-zone-structure');
      item.append(K.el('summary', '', zone.title));
      const fields = K.el('div', 'k-grid');
      K.select(local, fields, zone.structure, 'shape', 'Рисунок детали', shapeNames, { onInput: () => redrawStacks() });
      K.text(local, fields, zone.structure, 'base', 'Первый слой (основа)', { placeholder: 'Металл двери', onInput: () => redrawStacks() });
      K.text(local, fields, zone.structure, 'baseText', 'Текст про основу', { lines: 2, wide: true });
      K.text(local, fields, zone.structure, 'cover', 'Последний слой (обшивка)', { placeholder: 'Дверная карта', onInput: () => redrawStacks() });
      K.text(local, fields, zone.structure, 'coverText', 'Текст про обшивку', { lines: 2, wide: true });
      item.append(fields);
      zonesBox.append(item);
    }

    ensureDefs(materials);
    drawMaterials();
    redrawStacks();
    return () => check(data);
  }

  function check(data) {
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
    description: 'Материалы студии и порядок слоёв в каждом комплекте для анимации «Что внутри».',
    validateData: check, render
  });
})();
