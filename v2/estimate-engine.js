(() => {
  'use strict';

  const originalGroups = new Map(Object.entries({
    doors: 'Двери', arches: 'Арки и шины', floor: 'Пол',
    trunk: 'Багажник', roof: 'Потолок', dashboard: 'Торпедо'
  }));
  const format = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
  const digits = '(?:\\d{1,3}(?: \\d{3})+|\\d+)(?:[,.]\\d{1,2})?';
  const currency = '(?:₽|руб(?:лей|ля|ль|\\.)?|р\\.)?';
  const exact = new RegExp('^(от )?(' + digits + ') *' + currency + '$', 'iu');
  const range = new RegExp('^(?:от )?(' + digits + ') *' + currency +
    ' *(?:[–—-]|до) *(' + digits + ') *' + currency + '$', 'iu');
  const compact = value => String(value ?? '').trim().replace(/\s+/gu, ' ');
  const key = value => compact(value).toLocaleLowerCase('ru');
  const join = parts => [...new Set(parts.filter(Boolean))].join(' · ');

  function parsePrice(value) {
    const normalized = compact(value);
    const decimal = input => Number(input.replace(/ /g, '').replace(',', '.'));
    const valid = number => Number.isSafeInteger(Math.round(number * 100));
    const span = normalized.match(range);
    if (span) {
      const min = decimal(span[1]);
      const max = decimal(span[2]);
      if (valid(max) && min <= max) return { min, max };
    }
    const one = normalized.match(exact);
    if (one && valid(decimal(one[2]))) {
      const min = decimal(one[2]);
      return { min, max: one[1] ? null : min };
    }
    return { min: null, max: null };
  }

  function money(min, max) {
    if (min == null) return 'По запросу';
    if (max == null) return 'от ' + format.format(min) + ' ₽';
    if (min !== max) return format.format(min) + '–' + format.format(max) + ' ₽';
    return format.format(min) + ' ₽';
  }

  function priceColumns(rate) {
    return rate.columns.map((heading, i) => {
      const text = compact(heading);
      const marked = /цен[ауы]|стоимость|сумма|₽|^за\s/iu.test(text);
      const inRow = i > 0 && rate.rows.some(row =>
        Array.isArray(row) && /₽|руб(?:\.|лей|ля|ль)?(?:\s|$)|по запросу|по согласованию|договорн/iu.test(String(row[i])));
      return marked || inRow ? i : -1;
    }).filter(i => i >= 0);
  }

  function conditionalText(text) {
    return /при заказе|в составе комплекса|вместе с (?:обработкой|шумоизоляцией)|только (?:с |при |для )|(?:цена|стоимость|тариф) (?:зависит|зависят|уточняется|согласуется|действует при)|по согласованию|уточняется индивидуально/iu.test(text);
  }

  function classify(zoneId, rate, rowName) {
    const title = key(rate.title);
    const sheet = key(rate.sheet);
    if (zoneId === 'arches') {
      if (/подкрыл/.test(title) || sheet.endsWith('/arches-extras.jpg')) return 'liner';
      if (/металл.*арок/.test(title) || sheet.endsWith('/arches-metal.jpg')) return 'metal';
      if (/шумоизоляц.*шин/.test(title) || sheet.endsWith('/tire-insulation.jpg')) {
        if (/^(?:набор|комплект)/iu.test(rowName)) return 'tyre-material';
        if (/^установк/iu.test(rowName)) return 'tyre-work';
        if (/шиномонтаж/iu.test(rowName)) return 'tyre-fitting';
      }
    }
    if (zoneId === 'doors' && (/дополнительн/.test(title) || sheet.endsWith('/doors-extras.jpg'))) return 'door-option';
    if (/комплект|пакет/iu.test(title) || /\/(doors|floor|trunk|roof)-(budget|standard|premium)\.jpg$/.test(sheet)) return 'package';
    return 'custom';
  }

  function grouping(kind, rate, rowName, rateIndex, rowIndex) {
    switch (kind) {
      case 'package': return ['packages', 'Комплекты'];
      case 'metal': return ['metal', 'Металл наружных арок'];
      case 'liner': return ['liners', 'Подкрылки'];
      case 'tyre-material': return ['tyre-material', 'Материалы для шин'];
      case 'tyre-work': return ['tyre-work', 'Установка на шины'];
      case 'tyre-fitting': return ['tyre-fitting', 'Шиномонтаж'];
      case 'door-option': return ['door-' + rateIndex + '-' + rowIndex, rowName];
      default:
        if (rate.rows.length > 1 && /услуга|работа|операция/iu.test(rate.columns[0])) {
          return ['service-' + rateIndex + '-' + rowIndex, rowName];
        }
        return ['rate-' + rateIndex, compact(rate.title)];
    }
  }

  function requirement(kind, zone, rowName, wording) {
    if (kind === 'liner') {
      if (/отдельно|только обработка|без.*металл/iu.test(rowName)) return 'no-metal';
      if (/вместе|в составе|с обработкой|при.*металл/iu.test(rowName)) return 'metal';
      return 'verify';
    }
    if (zone === 'roof' && /комплекс/iu.test(wording)) return 'roof-complex';
    return conditionalText(wording) ? 'verify' : '';
  }

  // Prices typed in the cabinet for each body. They belong to the main price of the tariff (first row);
  // other rows and columns of the same tariff change in the same proportion.
  function typedPrices(rate, column) {
    const prices = {};
    if (rate.bodyPrices && typeof rate.bodyPrices === 'object' && !Array.isArray(rate.bodyPrices)) {
      for (const [body, value] of Object.entries(rate.bodyPrices)) {
        if (/^[a-z0-9][a-z0-9_-]{0,39}$/i.test(body) && Number.isFinite(value) && value > 0) prices[body] = value;
      }
    }
    if (!Object.keys(prices).length || column < 0) return null;
    const base = parsePrice(compact(rate.rows[0]?.[column])).min;
    return base > 0 ? { base, prices } : null;
  }

  function catalog(prices, configuredZones) {
    const zones = [];
    const byName = new Map();
    const groupById = new Map();
    const choices = new Map();
    for (const data of configuredZones || []) {
      if (!data?.id || !data.title) continue;
      const title = compact(data.group || originalGroups.get(data.id) || data.title);
      const zone = { id: data.id, title, groups: [] };
      zones.push(zone);
      for (const alias of [title, data.title, data.id]) byName.set(key(alias), zone);
    }
    for (const [rateIndex, rate] of (prices || []).entries()) {
      if (!rate?.group || !Array.isArray(rate.columns) || !Array.isArray(rate.rows)) continue;
      const name = compact(rate.group);
      let zone = byName.get(key(name));
      if (!zone) {
        zone = { id: 'extra:' + name, title: name, groups: [] };
        zones.push(zone);
        byName.set(key(name), zone);
      }
      const columns = priceColumns(rate);
      const notes = Array.isArray(rate.notes) ? rate.notes.map(compact).filter(Boolean) : [];
      const isAmbiguous = columns.length > 1 && !columns.every(i => /за\s/iu.test(rate.columns[i]));
      const shownColumns = isAmbiguous || !columns.length ? [-1] : columns;
      const exact = typedPrices(rate, shownColumns[0]);
      for (const [rowIndex, row] of rate.rows.entries()) {
        if (!Array.isArray(row) || !row.length) continue;
        const rowName = compact(row[0]) || compact(rate.title);
        const kind = classify(zone.id, rate, rowName);
        const [localId, groupTitle] = grouping(kind, rate, rowName, rateIndex, rowIndex);
        const groupId = zone.id + '/' + localId;
        if (!groupById.has(groupId)) {
          const group = { id: groupId, title: groupTitle, choices: [] };
          groupById.set(groupId, group);
          zone.groups.push(group);
        }
        for (const column of shownColumns) {
          const priceText = compact(row[column]) || 'По запросу';
          const unit = compact(rate.columns[column]).match(/(?:^|\s)(за\s+.+)$/iu)?.[1] || '';
          let title = rowName;
          if (kind === 'package') title = rate.rows.length === 1 ? compact(rate.title) : join([compact(rate.title), rowName]);
          else if (kind === 'door-option') title = unit || rowName;
          else if (columns.length > 1 && !isAmbiguous) title = join([rowName, unit]);
          const facts = rate.columns.flatMap((heading, index) => {
            const label = compact(heading);
            const value = compact(row[index]);
            if (index === 0 || !value || (!isAmbiguous && columns.includes(index))) return [];
            return [{ label, value }];
          });
          const id = 'estimate-' + rateIndex + '-' + rowIndex + '-' + column;
          const description = kind === 'door-option'
            ? notes.find(note => key(note).includes(key(rowName).split(' ')[0])) || ''
            : notes[0] || '';
          // Tyre kits, tyre fitting and per-door options cost the same for any car; the cabinet can override it.
          const scalable = typeof rate.carDependent === 'boolean' ? rate.carDependent
            : !['tyre-material', 'tyre-fitting', 'tyre-work', 'door-option'].includes(kind);
          const choice = {
            id, zoneId: zone.id, groupId, title, rowTitle: rowName, priceText, unit, description, facts, scalable, exact,
            notes: kind === 'door-option' ? [description].filter(Boolean) : notes,
            sheet: compact(rate.sheet), source: compact(rate.source), kind,
            fullTitle: join([zone.title, kind === 'package' ? '' : groupTitle, title]),
            required: requirement(kind, zone.id, rowName, [rate.title, rowName, ...notes].join(' ')),
            ...parsePrice(priceText)
          };
          if (isAmbiguous) choice.description = facts.map(fact => fact.label + ' — ' + fact.value).join('. ');
          choices.set(id, choice);
          groupById.get(groupId).choices.push(choice);
        }
      }
    }
    return { zones: zones.filter(zone => zone.groups.length), choices };
  }

  function create(prices, zones, vehicles) {
    const data = catalog(prices, zones);
    const selection = new Map();
    const chosen = () => Array.from(selection.values(), id => data.choices.get(id)).filter(Boolean);
    const pricing = globalThis.StudioVehicles;
    const config = pricing && vehicles ? pricing.normalize(vehicles) : null;
    let vehicle = { body: '', brand: '', model: '' };

    // The price of a choice for the selected car. Without a car the price list values stay untouched.
    function priced(choice) {
      const unchanged = { min: choice.min, max: choice.max, priceText: choice.priceText, adjusted: false, factor: 1 };
      if (!config || !choice.scalable || choice.min == null) return unchanged;
      const min = pricing.quote(config, vehicle, choice.zoneId, choice.min, choice.exact);
      const max = choice.max == null ? null : pricing.quote(config, vehicle, choice.zoneId, choice.max, choice.exact);
      if (min === choice.min && max === choice.max) return unchanged;
      return { min, max, priceText: money(min, max), adjusted: true, factor: min / choice.min };
    }

    function evaluate(id) {
      const choice = data.choices.get(id);
      if (!choice) return null;
      const price = priced(choice);
      const selected = chosen();
      const hasMetal = selected.some(row => row.zoneId === choice.zoneId && row.kind === 'metal');
      let condition = '';
      if (choice.required === 'roof-complex') {
        condition = 'Цена ' + price.priceText + ' действует в составе комплекса. Отдельную обработку и состав комплекса согласует студия.';
      } else if (choice.required === 'metal' && !hasMetal) {
        condition = 'Цена ' + price.priceText + ' действует вместе с обработкой металла наружных арок.';
      } else if (choice.required === 'no-metal' && hasMetal) {
        condition = 'Для совместной обработки выберите тариф подкрылков вместе с металлом арок.';
      } else if (choice.required === 'verify') {
        condition = 'Условия тарифа ' + price.priceText + ' нужно согласовать со студией.';
      }
      if (condition) return { min: null, max: null, priceText: 'Уточнить', condition, adjusted: price.adjusted };
      if (choice.min == null) {
        condition = choice.kind === 'tyre-fitting' ? 'Стоимость зависит от диаметра колёс.' : 'Стоимость уточнит студия.';
      } else if (choice.kind === 'tyre-work' && !selected.some(row => row.kind === 'tyre-material')) {
        condition = 'Указана стоимость работы. Материалы покупаются отдельно или предоставляются владельцем.';
      } else if (choice.kind === 'tyre-material' && !selected.some(row => row.kind === 'tyre-work')) {
        condition = 'Указана стоимость материалов. Установка оплачивается отдельно.';
      }
      return { min: price.min, max: price.max, priceText: price.priceText, condition, adjusted: price.adjusted };
    }

    function summarize() {
      const lines = chosen().map(choice => {
        const line = evaluate(choice.id);
        if (choice.unit && !key(choice.fullTitle).includes(key(choice.unit))) {
          line.priceText += ' · ' + choice.unit;
        }
        return { groupId: choice.groupId, choiceId: choice.id, zoneId: choice.zoneId, title: choice.fullTitle, ...line };
      });
      const known = lines.filter(line => line.min !== null);
      const pendingCount = lines.length - known.length;
      const sum = field => known.reduce((minor, line) => minor + Math.round(line[field] * 100), 0) / 100;
      const min = lines.length && !known.length ? null : sum('min');
      const max = min == null || known.some(line => line.max == null) ? null : sum('max');
      const totalText = money(min, max);
      const partial = pendingCount > 0 && known.length > 0;
      const car = describeVehicle();
      const quote = {
        service: 'Расчёт шумоизоляции',
        workTitles: lines.map(line => line.title),
        price: totalText + (partial ? ' по рассчитанным позициям. Остальные работы — по запросу.' : ''),
        estimate: [car ? 'Автомобиль — ' + car + '.' : '',
          ...lines.map(line => line.title + ' — ' + line.priceText + (line.condition ? '. ' + line.condition : ''))].filter(Boolean).join('\n'),
        vehicle: car,
        body: config?.bodies.find(item => item.id === vehicle.body)?.title || '',
        model: [vehicle.brand && (pricing?.findBrand(config || { classes: [] }, vehicle.brand)?.name || vehicle.brand), vehicle.model].filter(Boolean).join(' ')
      };
      return { lines, min, max, partial, pendingCount, totalText, quote, vehicle: car };
    }

    function describeVehicle() {
      return config ? pricing.describe(config, vehicle) : '';
    }

    return {
      zones: data.zones, selection, evaluate, summarize, money, vehicles: config,
      get vehicle() { return { ...vehicle }; },
      setVehicle(next = {}) {
        const text = value => typeof value === 'string' ? value.trim().slice(0, 60) : '';
        const body = config?.bodies.some(item => item.id === next.body) ? next.body : '';
        vehicle = { body, brand: text(next.brand), model: text(next.model) };
      },
      describeVehicle,
      price(id) {
        const choice = data.choices.get(id);
        return choice ? priced(choice) : null;
      },
      add(id) {
        const choice = data.choices.get(id);
        if (choice) selection.set(choice.groupId, id);
      },
      remove(id) { selection.delete(id); },
      clear() { selection.clear(); }
    };
  }

  globalThis.StudioEstimate = { create, parsePrice, money, priceColumns };
})();
