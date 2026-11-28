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
    // Defaults of the standard trunk kit just before the studio confirmed Soft Wave on the lid trim.
    trunkStandardWithAreas: [
      ['bronze3', 'bronze2', '', ['floor', 'arches'], ['wings', 'lid']],
      ['ranger', '', '', ['floor', 'arches', 'wings']]
    ],
    trunkStandardNote: 'Второй слой — звукоизолятор ComfortMat Ranger с акустической мембраной, 625 ₽ за лист. В примере работ студия также указывает Soft Wave на обшивке крышки.',
    trunkStandardDetail: 'Стандарт — от 18 000 ₽. К вибродемпферам Bronze 3 и Bronze 2 добавляют звукоизолятор Ranger. Вес — 31 кг.',
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

  // Compare the data of each sheet, preserving the order and the owner's placement and notes.
  const untouched = (layers, before) => layers.length === before.length && layers.every((layer, index) => {
    const [material, alt = '', note = '', on, altOn] = before[index];
    return record(layer) && Object.keys(layer).every(key => ['material', 'alt', 'note', 'on', 'altOn'].includes(key)) &&
      layer.material === material && (layer.alt || '') === alt && (layer.note || '') === note &&
      JSON.stringify(layer.on) === JSON.stringify(on) && JSON.stringify(layer.altOn) === JSON.stringify(altOn);
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
        if (zone.id === 'trunk' && Array.isArray(next.details) && base.details?.[1]) {
          next.details = next.details.map(line => line === previous.trunkStandardDetail ? base.details[1] : line);
        }
        return next;
      });
    }
    if (Array.isArray(result.prices)) {
      result.prices = result.prices.map(rate => {
        if (!record(rate)) return rate;
        const base = (seed.prices || []).find(item => item.sheet && item.sheet === rate.sheet) ||
          (seed.prices || []).find(item => item.group === rate.group && item.title === rate.title);
        if (!Array.isArray(base?.layers)) return rate;
        const before = former(previous.layers, rate.sheet) || former(previous.layers, base.sheet);
        const missing = !Array.isArray(rate.layers);
        const oldLayers = !missing && before && untouched(rate.layers, before);
        if (base.sheet === 'sheets/trunk-standard.jpg' && base.layerRevision) {
          if (rate.layerRevision) return missing ? { ...rate, layers: copy(base.layers) } : rate;
          const next = { ...rate, layerRevision: base.layerRevision };
          if (missing || oldLayers || untouched(rate.layers, previous.trunkStandardWithAreas)) next.layers = copy(base.layers);
          if (Array.isArray(rate.notes) && base.notes?.[2]) {
            next.notes = rate.notes.map(line => line === previous.trunkStandardNote ? base.notes[2] : line);
          }
          return next;
        }
        return missing || oldLayers ? { ...rate, layers: copy(base.layers) } : rate;
      });
    }
    return result;
  }

  window.StudioContent = { upgrade };
})();
