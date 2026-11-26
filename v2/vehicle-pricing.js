(() => {
  'use strict';

  // Body silhouettes drawn by the calculator. Keep in sync with car-shapes in estimate.js.
  const shapes = ['sedan', 'hatchback', 'liftback', 'wagon', 'crossover', 'suv', 'minivan', 'pickup', 'coupe'];
  const roundings = [1, 10, 50, 100, 500, 1000];
  // Visitors often type a brand in Russian; the canonical names are those of the cabinet list.
  const aliases = {
    'мерседес': 'Mercedes-Benz', 'мерседес бенц': 'Mercedes-Benz', 'мерс': 'Mercedes-Benz', 'mercedes': 'Mercedes-Benz', 'benz': 'Mercedes-Benz',
    'бмв': 'BMW', 'беха': 'BMW', 'ауди': 'Audi', 'лексус': 'Lexus', 'порше': 'Porsche', 'вольво': 'Volvo',
    'ленд ровер': 'Land Rover', 'лэнд ровер': 'Land Rover', 'рендж ровер': 'Land Rover', 'range rover': 'Land Rover',
    'ягуар': 'Jaguar', 'инфинити': 'Infiniti', 'генезис': 'Genesis', 'кадиллак': 'Cadillac', 'линкольн': 'Lincoln',
    'акура': 'Acura', 'тесла': 'Tesla', 'хончи': 'Hongqi', 'хунцы': 'Hongqi', 'хунчи': 'Hongqi', 'лисян': 'Li Auto',
    'лисиан': 'Li Auto', 'li': 'Li Auto', 'lixiang': 'Li Auto', 'зикр': 'Zeekr', 'воя': 'Voyah', 'вояж': 'Voyah',
    'аито': 'Aito', 'аватр': 'Avatr', 'мазерати': 'Maserati', 'бентли': 'Bentley', 'роллс-ройс': 'Rolls-Royce',
    'тойота': 'Toyota', 'мазда': 'Mazda', 'хонда': 'Honda', 'субару': 'Subaru', 'эксид': 'Exeed', 'танк': 'Tank',
    'бид': 'BYD', 'бюд': 'BYD', 'линк': 'Lynk & Co', 'джип': 'Jeep', 'мини': 'Mini', 'санг йонг': 'SsangYong',
    'ссангйонг': 'SsangYong', 'додж': 'Dodge', 'крайслер': 'Chrysler', 'дэнза': 'Denza',
    'лада': 'Lada', 'ваз': 'Lada', 'жигули': 'Lada', 'киа': 'Kia', 'кия': 'Kia', 'хендай': 'Hyundai',
    'хёндай': 'Hyundai', 'хундай': 'Hyundai', 'хюндай': 'Hyundai', 'солярис': 'Solaris', 'рено': 'Renault',
    'шкода': 'Skoda', 'škoda': 'Skoda', 'фольксваген': 'Volkswagen', 'вольксваген': 'Volkswagen', 'vw': 'Volkswagen',
    'ниссан': 'Nissan', 'митсубиси': 'Mitsubishi', 'мицубиси': 'Mitsubishi', 'митсубиши': 'Mitsubishi',
    'сузуки': 'Suzuki', 'шевроле': 'Chevrolet', 'шевролет': 'Chevrolet', 'форд': 'Ford', 'опель': 'Opel',
    'пежо': 'Peugeot', 'ситроен': 'Citroën', 'citroen': 'Citroën', 'чери': 'Chery', 'черри': 'Chery',
    'джили': 'Geely', 'джилли': 'Geely', 'хавал': 'Haval', 'хавейл': 'Haval', 'хавэйл': 'Haval',
    'чанган': 'Changan', 'чанъань': 'Changan', 'омода': 'Omoda', 'джейку': 'Jaecoo', 'джаеку': 'Jaecoo',
    'белджи': 'Belgee', 'тенет': 'Tenet', 'moskvich': 'Москвич', 'джетур': 'Jetour', 'гак': 'GAC', 'фав': 'FAW',
    'грейт вол': 'Great Wall', 'грейт волл': 'Great Wall', 'ливан': 'Livan', 'кайи': 'Kaiyi', 'донгфенг': 'Dongfeng',
    'дунфэн': 'Dongfeng', 'джак': 'JAC', 'баик': 'BAIC', 'датсун': 'Datsun', 'дэу': 'Daewoo', 'дэо': 'Daewoo',
    'равон': 'Ravon', 'uaz': 'УАЗ'
  };

  const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
  const fold = value => clean(value).toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[\s\p{Dash_Punctuation}]+/gu, ' ');
  const percentOf = value => {
    const number = typeof value === 'string' ? Number(value.replace(',', '.').replace(/[^\d.+-]/g, '')) : Number(value);
    return Number.isFinite(number) ? Math.max(-50, Math.min(300, Math.round(number * 10) / 10)) : 0;
  };
  const idOf = (value, fallback) => typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,39}$/i.test(value) ? value : fallback;

  function normalize(config) {
    const source = config && typeof config === 'object' ? config : {};
    const usedBodies = new Set();
    const bodies = [];
    for (const [index, body] of (Array.isArray(source.bodies) ? source.bodies : []).entries()) {
      if (!body || typeof body !== 'object' || !clean(body.title)) continue;
      let id = idOf(body.id, 'body-' + (index + 1));
      while (usedBodies.has(id)) id += '-2';
      usedBodies.add(id);
      const zones = {};
      if (body.zones && typeof body.zones === 'object' && !Array.isArray(body.zones)) {
        for (const [zone, value] of Object.entries(body.zones)) {
          if (/^[\w:.-]{1,80}$/u.test(zone) && value !== '' && value !== null && Number.isFinite(Number(value))) zones[zone] = percentOf(value);
        }
      }
      bodies.push({ id, title: clean(body.title), shape: shapes.includes(body.shape) ? body.shape : 'sedan', percent: percentOf(body.percent), zones });
    }
    const usedClasses = new Set();
    const seenBrands = new Set();
    const classes = [];
    for (const [index, group] of (Array.isArray(source.classes) ? source.classes : []).entries()) {
      if (!group || typeof group !== 'object' || !clean(group.title)) continue;
      let id = idOf(group.id, 'class-' + (index + 1));
      while (usedClasses.has(id)) id += '-2';
      usedClasses.add(id);
      const brands = [];
      for (const name of Array.isArray(group.brands) ? group.brands : []) {
        const brand = clean(name);
        if (!brand || brand.length > 40 || seenBrands.has(fold(brand))) continue;
        seenBrands.add(fold(brand));
        brands.push(brand);
      }
      classes.push({ id, title: clean(group.title), percent: percentOf(group.percent), brands });
    }
    const known = new Map(classes.flatMap(group => group.brands.map(brand => [fold(brand), brand])));
    const popular = [...new Set((Array.isArray(source.popular) ? source.popular : []).map(name => known.get(fold(name))).filter(Boolean))];
    return {
      basis: clean(source.basis),
      rounding: roundings.includes(Number(source.rounding)) ? Number(source.rounding) : 500,
      bodies, classes, popular
    };
  }

  function brandIndex(config) {
    const index = new Map();
    for (const group of config.classes) {
      for (const brand of group.brands) index.set(fold(brand), { name: brand, group });
    }
    for (const [alias, brand] of Object.entries(aliases)) {
      const entry = index.get(fold(brand));
      const aliasKey = fold(alias);
      if (entry && !index.has(aliasKey)) index.set(aliasKey, entry);
    }
    return index;
  }

  function findBrand(config, query) {
    const key = fold(query);
    if (!key) return null;
    return brandIndex(config).get(key) || null;
  }

  // Suggestions for the brand field: names that start with the query come first, aliases count as well.
  function suggest(config, query, limit = 8) {
    const key = fold(query);
    const index = brandIndex(config);
    const scored = new Map();
    for (const [name, entry] of index) {
      let score = -1;
      if (!key) score = config.popular.includes(entry.name) ? 3 : 1;
      else if (name === key) score = 5;
      else if (fold(entry.name).startsWith(key)) score = 4.5;
      else if (name.startsWith(key)) score = 4;
      else if (name.split(/[\s&-]+/).some(part => part.startsWith(key))) score = 3;
      else if (key.length > 2 && name.includes(key)) score = 2;
      if (score < 0) continue;
      const previous = scored.get(entry.name);
      if (!previous || previous.score < score) scored.set(entry.name, { ...entry, score });
    }
    return [...scored.values()]
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ru'))
      .slice(0, limit);
  }

  function bodyPercent(config, bodyId, zoneId) {
    const body = config.bodies.find(item => item.id === bodyId);
    if (!body) return 0;
    return Object.hasOwn(body.zones, zoneId) ? body.zones[zoneId] : body.percent;
  }

  // Brand markup of a car; vehicle.groupPercent picks a brand group directly (the price table does this).
  function brandPercent(config, vehicle) {
    if (typeof vehicle?.groupPercent === 'number' && Number.isFinite(vehicle.groupPercent)) return vehicle.groupPercent;
    const brand = vehicle?.brand ? findBrand(config, vehicle.brand) : null;
    return brand ? brand.group.percent : 0;
  }

  // Price typed in the cabinet for a kit and a body: { base: list price of the kit, prices: { body: price } }.
  function typedPrice(exact, bodyId) {
    const value = Number(exact?.prices?.[bodyId]);
    return bodyId && value > 0 && Number(exact.base) > 0 ? value : 0;
  }

  function factor(config, vehicle, zoneId, exact) {
    const typed = typedPrice(exact, vehicle?.body);
    const body = typed ? typed / exact.base : 1 + bodyPercent(config, vehicle?.body, zoneId) / 100;
    return body * (1 + brandPercent(config, vehicle) / 100);
  }

  // Price of one list value for a car. A price typed for the body is used as typed; the brand markup comes on top.
  function quote(config, vehicle, zoneId, value, exact) {
    if (value == null || !Number.isFinite(value)) return value ?? null;
    const typed = typedPrice(exact, vehicle?.body);
    const brand = 1 + brandPercent(config, vehicle) / 100;
    if (typed && value === exact.base) return adjust(typed, brand, config.rounding);
    return adjust(value, factor(config, vehicle, zoneId, exact), config.rounding);
  }

  function adjust(value, multiplier, rounding) {
    if (value == null || !Number.isFinite(value)) return value ?? null;
    if (Math.abs(multiplier - 1) < 1e-9) return value;
    const step = rounding || 1;
    // Never quote less than the studio price list: round up to the chosen step.
    return Math.ceil((value * multiplier - 1e-6) / step) * step;
  }

  function describe(config, vehicle) {
    const body = config.bodies.find(item => item.id === vehicle?.body);
    const brand = vehicle?.brand ? findBrand(config, vehicle.brand)?.name || clean(vehicle.brand) : '';
    const parts = [[brand, clean(vehicle?.model)].filter(Boolean).join(' '), body ? body.title.toLocaleLowerCase('ru') : ''];
    return parts.filter(Boolean).join(', ');
  }

  globalThis.StudioVehicles = { normalize, findBrand, suggest, factor, quote, typedPrice, brandPercent, adjust, describe, bodyPercent, shapes, aliases };
})();
