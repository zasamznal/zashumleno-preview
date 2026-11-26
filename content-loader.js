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
  async function connectDemo() {
    const workers = navigator.serviceWorker;
    if (!workers) return false;
    const existing = workers.getRegistration().catch(() => null);
    workers.register('demo-sw.js').catch(() => {});
    if (workers.controller) return true;
    const active = (await existing)?.active;
    if (!active) return Boolean(workers.controller);
    // A hard reload can bypass an installed worker. Let it reclaim this tab before reading saved changes.
    return new Promise(resolve => {
      const finish = () => {
        clearTimeout(timeout);
        workers.removeEventListener('controllerchange', finish);
        resolve(Boolean(workers.controller));
      };
      const timeout = setTimeout(finish, 2500);
      workers.addEventListener('controllerchange', finish);
      if (workers.controller) finish();
      else {
        try { active.postMessage('claim'); } catch { finish(); }
      }
    });
  }

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
    const connected = await connectDemo();
    if (preview || connected) {
      try {
        if (!connected) throw new Error('demo_unavailable');
        const response = await fetch(preview ? 'api/admin/content' : 'api/content', { cache: 'no-store' });
        if (!response.ok) throw new Error('content_unavailable');
        const result = await response.json();
        const stored = preview ? result.draft : result.content;
        if (stored) {
          if (![stored.prices, stored.zones, stored.works].every(Array.isArray)) throw new Error('invalid_content');
          content = window.StudioContent ? window.StudioContent.upgrade(stored, seed) : stored;
        }
      } catch {
        if (preview) {
          notice('Не удалось открыть черновик. Проверьте вход в демо-кабинет.');
          document.querySelector('main').hidden = true;
          return false;
        }
      }
    }
    window.STUDIO_PRICES = content.prices;
    window.STUDIO_ZONES = content.zones;
    window.STUDIO_WORKS = playable(content.works);
    window.STUDIO_VEHICLES = content.vehicles && typeof content.vehicles === 'object' ? content.vehicles : seed.vehicles;
    window.STUDIO_MATERIALS = Array.isArray(content.materials) ? content.materials : seed.materials;
    window.StudioPage.apply(content.page);
    if (preview) {
      for (const link of document.querySelectorAll('footer a[href="legal.html"], footer a[href="privacy.html"]')) {
        const url = new URL(link.href);
        url.searchParams.set('preview', 'draft');
        link.href = url.href;
      }
      notice('Вы просматриваете черновик демо-кабинета.');
    }
    return true;
  }
  window.STUDIO_READY = load();
})();
