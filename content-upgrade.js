(() => {
  'use strict';
  const copy = value => structuredClone(value);
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

  // Snapshots saved before car pricing and the materials section get the studio data they lack.
  // Anything the owner has already set, including an emptied list, stays as it is.
  function upgrade(content, seed) {
    if (!record(content) || !record(seed)) return content;
    const result = { ...content };
    if (!record(result.vehicles) && seed.vehicles) result.vehicles = copy(seed.vehicles);
    if (!Array.isArray(result.materials) && seed.materials) result.materials = copy(seed.materials);
    if (Array.isArray(result.zones)) {
      result.zones = result.zones.map(zone => {
        const base = record(zone) && (seed.zones || []).find(item => item.id === zone.id);
        if (!base) return zone;
        const next = { ...zone };
        if (!record(next.structure) && base.structure) next.structure = copy(base.structure);
        if (!Array.isArray(next.gallery) && base.gallery) next.gallery = copy(base.gallery);
        return next;
      });
    }
    if (Array.isArray(result.prices)) {
      result.prices = result.prices.map(rate => {
        if (!record(rate) || Array.isArray(rate.layers)) return rate;
        const base = (seed.prices || []).find(item => item.sheet && item.sheet === rate.sheet) ||
          (seed.prices || []).find(item => item.group === rate.group && item.title === rate.title);
        return base?.layers ? { ...rate, layers: copy(base.layers) } : rate;
      });
    }
    return result;
  }

  window.StudioContent = { upgrade };
})();
