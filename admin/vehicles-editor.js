(() => {
  'use strict';
  const K = window.StudioKit;
  const shapeNames = {
    sedan: 'Седан', hatchback: 'Хэтчбек', liftback: 'Лифтбек', wagon: 'Универсал', crossover: 'Кроссовер', suv: 'Внедорожник',
    minivan: 'Минивэн', pickup: 'Пикап', coupe: 'Купе'
  };
  const roundings = [[1, '1 ₽ — без округления'], [10, '10 ₽'], [50, '50 ₽'], [100, '100 ₽'], [500, '500 ₽'], [1000, '1 000 ₽']];
  const format = new Intl.NumberFormat('ru-RU');
  const splitBrands = value => [...new Set(String(value || '').split(/[\n,;]+/).map(item => item.trim()).filter(Boolean))];

  function render(ctx) {
    const data = ctx.data;
    if (!data.vehicles || typeof data.vehicles !== 'object') data.vehicles = structuredClone(window.STUDIO_VEHICLES || { bodies: [], classes: [] });
    const v = data.vehicles;
    v.bodies = Array.isArray(v.bodies) ? v.bodies : [];
    v.classes = Array.isArray(v.classes) ? v.classes : [];
    v.popular = Array.isArray(v.popular) ? v.popular : [];
    const pricing = window.StudioVehicles;
    const local = { ...ctx, change() { ctx.change(); refresh(); } };
    const host = ctx.host;
    const zones = (data.zones || []).filter(zone => zone?.id && zone.title);

    // How it works, with a live example.
    const how = K.card(host, 'Как считается цена', null, 'k-explain');
    const formula = K.el('p', 'k-formula');
    const example = K.el('p', 'k-example');
    how.append(formula, example);
    const grid = K.el('div', 'k-grid');
    how.append(grid);
    const rounding = K.el('select');
    for (const [value, title] of roundings) rounding.append(new Option(title, String(value)));
    rounding.value = String(v.rounding || 500);
    rounding.addEventListener('change', () => { v.rounding = Number(rounding.value); local.change(); });
    K.wrap(grid, 'Округлять цену вверх до', rounding, { note: 'Цена для клиента никогда не будет ниже прайса.' });
    K.text(local, grid, v, 'basis', 'Пояснение для клиентов', { lines: 2, wide: true, note: 'Показывается в прайсе под описанием зоны, пока посетитель не выбрал машину. Пустое поле убирает строку.' });

    // Body types.
    const bodiesBox = K.card(host, 'Типы кузова', 'Наценка добавляется к цене из прайса. Для отдельной зоны можно задать свою — например, багажник универсала больше, чем у седана.');
    const bodyList = K.el('div', 'k-rows');
    bodiesBox.append(bodyList, K.button('Добавить тип кузова', () => {
      let n = v.bodies.length + 1;
      while (v.bodies.some(body => body.id === 'body-' + n)) n++;
      v.bodies.push({ id: 'body-' + n, title: 'Новый кузов', shape: 'minivan', percent: 20, zones: {} });
      local.change();
      drawBodies(v.bodies.length - 1);
    }, 'k-add'));

    function drawBodies(focusIndex) {
      bodyList.replaceChildren();
      v.bodies.forEach((body, index) => {
        body.zones = body.zones && typeof body.zones === 'object' ? body.zones : {};
        const row = K.el('div', 'k-row k-body-row');
        const art = K.el('div', 'k-body-art');
        const drawArt = () => art.replaceChildren(window.StudioCarShapes ? window.StudioCarShapes.svg(body.shape) : K.el('span', '', body.title));
        drawArt();
        const fields = K.el('div', 'k-row-fields');
        const name = K.text(local, fields, body, 'title', 'Название', { max: 40 });
        K.select(local, fields, body, 'shape', 'Силуэт', Object.entries(shapeNames), { onInput: drawArt });
        K.number(local, fields, body, 'percent', 'Наценка для всех зон', { suffix: '%', min: -50, max: 300 });
        const perZone = K.el('details', 'k-zones');
        const overrides = Object.keys(body.zones).length;
        perZone.append(K.el('summary', '', 'Своя наценка по зонам' + (overrides ? ' · ' + overrides : '')));
        const zoneGrid = K.el('div', 'k-grid k-grid-small');
        for (const zone of zones) {
          K.number(local, zoneGrid, body.zones, zone.id, zone.title, { suffix: '%', min: -50, max: 300, allowEmpty: true, placeholder: body.percent,
            onInput: () => { perZone.querySelector('summary').textContent = 'Своя наценка по зонам' + (Object.keys(body.zones).length ? ' · ' + Object.keys(body.zones).length : ''); } });
        }
        perZone.append(zoneGrid, K.el('small', 'k-note', 'Пустое поле — действует общая наценка кузова.'));
        fields.append(perZone);
        const tools = K.el('div', 'k-row-tools');
        tools.append(
          K.button('↑', () => { if (K.move(v.bodies, index, index - 1)) { local.change(); drawBodies(index - 1); } }, 'k-icon'),
          K.button('↓', () => { if (K.move(v.bodies, index, index + 1)) { local.change(); drawBodies(index + 1); } }, 'k-icon'),
          K.button('Удалить', () => {
            if (!window.confirm('Удалить тип кузова «' + body.title + '»?')) return;
            v.bodies.splice(index, 1); local.change(); drawBodies();
          }, 'k-danger'));
        tools.children[0].setAttribute('aria-label', 'Поднять «' + body.title + '»');
        tools.children[1].setAttribute('aria-label', 'Опустить «' + body.title + '»');
        tools.children[0].disabled = index === 0;
        tools.children[1].disabled = index === v.bodies.length - 1;
        row.append(art, fields, tools);
        bodyList.append(row);
        if (index === focusIndex) name.focus();
      });
      if (!v.bodies.length) bodyList.append(K.el('p', 'k-empty', 'Нет типов кузова — калькулятор покажет базовые цены без выбора машины.'));
    }

    // Brand groups.
    const groupsBox = K.card(host, 'Марки автомобилей', 'Марки собраны в группы с общей наценкой. Чтобы изменить цену для марки, перенесите её в другую группу или создайте группу из одной марки. Марки, которых нет в списке, считаются по базовой цене — калькулятор подскажет клиенту, что стоимость уточнит мастер.');
    const groupList = K.el('div', 'k-groups');
    groupsBox.append(groupList, K.button('Добавить группу марок', () => {
      let n = v.classes.length + 1;
      while (v.classes.some(group => group.id === 'class-' + n)) n++;
      v.classes.push({ id: 'class-' + n, title: 'Новая группа', percent: 10, brands: [] });
      local.change();
      drawGroups(v.classes.length - 1);
    }, 'k-add'));
    const popularBox = K.el('div', 'k-popular');
    groupsBox.append(popularBox);

    function drawGroups(focusIndex) {
      groupList.replaceChildren();
      v.classes.forEach((group, index) => {
        group.brands = Array.isArray(group.brands) ? group.brands : [];
        const box = K.el('div', 'k-group');
        const head = K.el('div', 'k-group-head');
        const name = K.text(local, head, group, 'title', 'Название группы', { max: 40 });
        K.number(local, head, group, 'percent', 'Наценка', { suffix: '%', min: -50, max: 300 });
        box.append(head);
        const count = K.el('small', 'k-note');
        const brands = K.el('textarea', 'k-brands');
        brands.rows = 4;
        brands.value = group.brands.join(', ');
        const recount = () => { count.textContent = 'Марок в группе: ' + group.brands.length + '. Пишите через запятую или с новой строки.'; };
        brands.addEventListener('input', () => { group.brands = splitBrands(brands.value); recount(); local.change(); });
        brands.addEventListener('blur', () => { brands.value = group.brands.join(', '); });
        K.wrap(box, 'Марки', brands, { wide: true });
        box.append(count);
        recount();
        const tools = K.el('div', 'k-row-tools');
        tools.append(K.button('Удалить группу', () => {
          if (!window.confirm('Удалить группу «' + group.title + '»? Её марки будут считаться по базовой цене.')) return;
          v.classes.splice(index, 1); local.change(); drawGroups();
        }, 'k-danger'));
        box.append(tools);
        groupList.append(box);
        if (index === focusIndex) name.focus();
      });
      drawPopular();
    }

    function drawPopular() {
      popularBox.replaceChildren();
      const input = K.el('input');
      input.type = 'text';
      input.value = v.popular.join(', ');
      input.addEventListener('input', () => { v.popular = splitBrands(input.value); local.change(); });
      K.wrap(popularBox, 'Кнопки популярных марок в калькуляторе', input, { wide: true, note: 'Через запятую. Марка должна быть в одной из групп выше.' });
    }

    // Live check of the resulting prices.
    const checkBox = K.card(host, 'Проверка цен', 'Так цены увидят клиенты. Таблица пересчитывается при каждом изменении.');
    const controls = K.el('div', 'k-grid');
    const zoneSelect = K.el('select');
    for (const zone of zones) zoneSelect.append(new Option(zone.title, zone.id));
    const groupSelect = K.el('select');
    K.wrap(controls, 'Зона', zoneSelect);
    K.wrap(controls, 'Группа марок', groupSelect);
    const tableHost = K.el('div', 'k-table-scroll');
    checkBox.append(controls, tableHost);
    zoneSelect.addEventListener('change', refresh);
    groupSelect.addEventListener('change', refresh);

    function refresh() {
      if (!pricing) return;
      const config = pricing.normalize(v);
      const step = config.rounding;
      formula.textContent = 'Цена для клиента = цена из прайса × (1 + наценка кузова) × (1 + наценка марки), округление вверх до ' + format.format(step) + ' ₽.';
      const body = config.bodies.find(item => item.percent > 0) || config.bodies[0];
      const group = config.classes.find(item => item.percent > 0) || config.classes[0];
      if (body && group) {
        const base = 22000;
        const factor = (1 + pricing.bodyPercent(config, body.id, 'doors') / 100) * (1 + group.percent / 100);
        example.textContent = 'Пример: комплект дверей за ' + format.format(base) + ' ₽ для кузова «' + body.title + '» (' + signed(pricing.bodyPercent(config, body.id, 'doors')) +
          ') и марки из группы «' + group.title + '» (' + signed(group.percent) + ') — ' + format.format(pricing.adjust(base, factor, step)) + ' ₽.';
      } else example.textContent = '';
      const previousGroup = groupSelect.value;
      groupSelect.replaceChildren(...config.classes.map(item => new Option(item.title + ' (' + signed(item.percent) + ')', item.id)));
      if (config.classes.some(item => item.id === previousGroup)) groupSelect.value = previousGroup;
      const selectedGroup = config.classes.find(item => item.id === groupSelect.value) || { percent: 0 };
      const engine = window.StudioEstimate?.create(data.prices || [], data.zones || []);
      const zone = engine?.zones.find(item => item.id === zoneSelect.value);
      const choices = (zone?.groups || []).flatMap(item => item.choices).filter(choice => choice.min != null);
      if (!choices.length || !config.bodies.length) {
        tableHost.replaceChildren(K.el('p', 'k-empty', 'Для этой зоны нет тарифов с ценой.'));
        return;
      }
      const typedNote = choices.some(choice => config.bodies.some(item => pricing.typedPrice(choice.exact, item.id)))
        ? K.el('p', 'k-note', 'Цены с точкой вписаны вручную в разделе «Цены» — наценка за кузов к ним не применяется.') : null;
      const table = K.el('table', 'k-table');
      const head = table.createTHead().insertRow();
      head.append(K.el('th', '', 'Тариф'), ...config.bodies.map(item => K.el('th', '', item.title)));
      const tbody = table.createTBody();
      for (const choice of choices) {
        const row = tbody.insertRow();
        const title = K.el('th', '', choice.title);
        if (!choice.scalable) title.append(K.el('small', '', 'цена не зависит от машины'));
        row.append(title);
        for (const item of config.bodies) {
          const car = { body: item.id, groupPercent: selectedGroup.percent };
          const quote = value => choice.scalable ? pricing.quote(config, car, choice.zoneId, value, choice.exact) : value;
          const min = quote(choice.min);
          const max = choice.max == null ? null : quote(choice.max);
          const cell = row.insertCell();
          cell.textContent = (max == null ? 'от ' : '') + format.format(min) + (max != null && max !== min ? '–' + format.format(max) : '') + ' ₽';
          // A price typed in «Цены» for this body is marked: it does not follow the body markup.
          if (choice.scalable && pricing.typedPrice(choice.exact, item.id)) {
            cell.classList.add('k-typed');
            cell.title = 'Цена вписана вручную в разделе «Цены»';
          }
        }
      }
      tableHost.replaceChildren(...[typedNote, table].filter(Boolean));
    }
    const signed = value => (value > 0 ? '+' : '') + String(value).replace('.', ',') + '%';

    drawBodies();
    drawGroups();
    refresh();
    return () => check(data);
  }

  function check(data) {
    const v = data.vehicles;
    if (!v) return '';
    if ((v.bodies || []).some(body => !String(body.title || '').trim())) return 'Наценки за машину: укажите название каждого типа кузова.';
    if ((v.classes || []).some(group => !String(group.title || '').trim())) return 'Наценки за машину: назовите каждую группу марок.';
    return '';
  }

  window.StudioAdmin.register({
    id: 'vehicles', title: 'Наценки за машину', group: 'Цены', order: 20,
    description: 'Насколько дороже работа для большой машины или премиальной марки. Точную цену для кузова можно вписать в разделе «Цены».',
    validateData: check, render
  });
})();
