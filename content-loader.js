// Демоверсия на GitHub Pages: исходные материалы из репозитория и правки демо-кабинета этого браузера.
(() => {
  const clips = {
  "437": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/ab877990-56d3-469b-99f7-611f8a8fb42b.mp4",
  "439": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/c2824904-a76a-43c6-bd41-363cc7ed66be.mp4",
  "446": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/fc3abde5-d5bb-48a5-85ee-bac562421ed0.mp4",
  "449": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/92cc3f69-5e8f-4f0c-8f9b-80ff371d8bb7.mp4",
  "452": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/0d448ce9-d715-4f69-9144-3ff6ff8d095a.mp4"
};
  const playable = works => window.StudioWorks.normalize(works).map(work => {
    const match = /^\/?v2\/media\/works\/(\d+)\.mp4$/.exec(work.video || '');
    return match && clips[match[1]] ? { ...work, video: clips[match[1]] } : work;
  });
  const seed = {
    page: window.StudioPage.normalize(window.STUDIO_PAGE_DEFAULTS),
    prices: window.STUDIO_PRICES,
    zones: window.STUDIO_ZONES,
    works: window.STUDIO_WORKS,
    vehicles: window.STUDIO_VEHICLES,
    materials: window.STUDIO_MATERIALS
  };
  window.STUDIO_SEED = structuredClone(seed);
  const preview = new URL(location.href).searchParams.get('preview') === 'draft';
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('demo-sw.js').catch(() => {});

  function notice(message) {
    const box = document.createElement('aside');
    box.className = 'site-notice';
    box.setAttribute('role', 'status');
    const text = document.createElement('span');
    text.textContent = message;
    const link = document.createElement('a');
    link.href = 'admin/';
    link.textContent = 'В кабинет';
    box.append(text, link);
    document.body.prepend(box);
  }

  async function load() {
    let content = seed;
    if (navigator.serviceWorker?.controller) {
      try {
        const response = await fetch(preview ? 'api/admin/content' : 'api/content', { cache: 'no-store' });
        const result = response.ok ? await response.json() : null;
        const stored = result && (preview ? result.draft : result.content);
        if (stored && Array.isArray(stored.prices) && Array.isArray(stored.zones) && Array.isArray(stored.works)) {
          content = window.StudioContent ? window.StudioContent.upgrade(stored, seed) : stored;
        }
      } catch {}
    }
    window.STUDIO_PRICES = content.prices;
    window.STUDIO_ZONES = content.zones;
    window.STUDIO_WORKS = playable(content.works);
    window.STUDIO_VEHICLES = content.vehicles && typeof content.vehicles === 'object' ? content.vehicles : seed.vehicles;
    window.STUDIO_MATERIALS = Array.isArray(content.materials) ? content.materials : seed.materials;
    window.StudioPage.apply(content.page);
    if (preview) notice('Вы просматриваете черновик демо-кабинета.');
    return true;
  }
  window.STUDIO_READY = load();
})();
