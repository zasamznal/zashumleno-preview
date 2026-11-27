(() => {
  'use strict';
  const copy = value => structuredClone(value);
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

  // «Что внутри» as the studio shipped it before doors, floor and boot got several parts and the sheets got their areas.
  // A snapshot keeps these values when the owner never touched them: they are replaced with the current defaults.
  const previous = {
    structure: {
      doors: { base: 'Металл двери', baseText: 'Широкие панели двери вибрируют на ходу и от работы динамика.',
        cover: 'Дверная карта', coverText: 'Обшивка возвращается на место и закрывает слои. Для её стыков можно заказать антискрип.' },
      floor: { base: 'Металл пола', baseText: 'Пол передаёт в салон гул дороги и вибрации от колёс.',
        cover: 'Ковролин', coverText: 'Ковролин и сиденья возвращаются на штатные места.' },
      trunk: { base: 'Металл багажника', baseText: 'Пол багажника и задние арки усиливают гул от задних колёс.',
        cover: 'Обшивка багажника', coverText: 'Пол и боковины багажника закрывают материалы.' }
    },
    // Sheets of a kit by its price sheet: [material, second material, note].
    layers: {
      'sheets/doors-budget.jpg': [['bronze2'], ['bronze2'], ['volna']],
      'sheets/doors-standard.jpg': [['bronze2'], ['bronze2'], ['softwave']],
      'sheets/doors-premium.jpg': [['cobra'], ['integra'], ['cobra'], ['softwave']],
      'sheets/floor-budget.jpg': [['bronze3']],
      'sheets/floor-standard.jpg': [['bronze3'], ['ranger']],
      'sheets/floor-premium.jpg': [['viper'], ['blockshot', 'raptor', 'Blockshot и Raptor — в разных частях пола']],
      'sheets/trunk-budget.jpg': [['bronze3', 'bronze2', 'Bronze 3 — на пол багажника, Bronze 2 — на крышку']],
      'sheets/trunk-standard.jpg': [['bronze3', 'bronze2', 'Bronze 3 — на пол, Bronze 2 — на крышку'], ['ranger']],
      'sheets/trunk-premium.jpg': [['viper', 'cobra', 'Viper и Cobra — в разных частях багажника'],
        ['raptor', 'blockshot', 'Raptor и Blockshot — вторым слоем'], ['softwave', '', 'Soft Wave — на обшивке крышки']]
    },
    // Colours of the sheets before they were matched to the photos of the studio: [colour, print].
    materials: { bronze2: ['#b79b6c', '#5b3b17'], bronze3: ['#a98a5a', '#4d3214'], blockshot: ['#2f6ed8', '#e7efff'],
      raptor: ['#c8a679', '#43301b'], ranger: ['#55555c', '#c4c4cc'] }
  };

  const former = (list, key) => typeof key === 'string' && Object.hasOwn(list, key) ? list[key] : null;

  // Names and texts of the parts: a field equal to the former default follows the current one.
  function renewStructure(structure, before, now) {
    const result = { ...structure };
    for (const [key, value] of Object.entries(before || {})) {
      if (result[key] !== value) continue;
      if (typeof now[key] === 'string') result[key] = now[key]; else delete result[key];
    }
    if (!record(result.parts) && record(now.parts)) result.parts = copy(now.parts);
    return result;
  }

  // A sheet with areas, another material or the owner's own note is no longer the former default.
  const untouched = (layers, before) => layers.length === before.length && layers.every((layer, index) => {
    const [material, alt = '', note = ''] = before[index];
    return record(layer) && Object.keys(layer).every(key => ['material', 'alt', 'note'].includes(key)) &&
      layer.material === material && (layer.alt || '') === alt && (layer.note || '') === note;
  });

  // Snapshots saved before car pricing, the materials section and the parts of «Что внутри» get the studio data they lack.
  // Anything the owner has already set, including an emptied list, stays as it is.
  function upgrade(content, seed) {
    if (!record(content) || !record(seed)) return content;
    const result = { ...content };
    if (!record(result.vehicles) && seed.vehicles) result.vehicles = copy(seed.vehicles);
    if (!Array.isArray(result.materials)) { if (seed.materials) result.materials = copy(seed.materials); }
    else if (Array.isArray(seed.materials)) {
      // Colour and print of a sheet change as a pair: a pair the owner has repainted stays.
      result.materials = result.materials.map(material => {
        const before = record(material) && former(previous.materials, material.id);
        const base = before && seed.materials.find(item => item.id === material.id);
        return base && material.color === before[0] && material.print === before[1] ? { ...material, color: base.color, print: base.print } : material;
      });
    }
    if (Array.isArray(result.zones)) {
      result.zones = result.zones.map(zone => {
        const base = record(zone) && (seed.zones || []).find(item => item.id === zone.id);
        if (!base) return zone;
        const next = { ...zone };
        if (!record(next.structure)) { if (base.structure) next.structure = copy(base.structure); }
        else if (record(base.structure)) next.structure = renewStructure(next.structure, former(previous.structure, zone.id), base.structure);
        if (!Array.isArray(next.gallery) && base.gallery) next.gallery = copy(base.gallery);
        return next;
      });
    }
    if (Array.isArray(result.prices)) {
      result.prices = result.prices.map(rate => {
        if (!record(rate)) return rate;
        const base = (seed.prices || []).find(item => item.sheet && item.sheet === rate.sheet) ||
          (seed.prices || []).find(item => item.group === rate.group && item.title === rate.title);
        if (!Array.isArray(base?.layers)) return rate;
        if (!Array.isArray(rate.layers)) return { ...rate, layers: copy(base.layers) };
        const before = former(previous.layers, rate.sheet) || former(previous.layers, base.sheet);
        return before && untouched(rate.layers, before) ? { ...rate, layers: copy(base.layers) } : rate;
      });
    }
    return result;
  }

  window.StudioContent = { upgrade };
})();
