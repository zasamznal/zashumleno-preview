// Демо-сервер для GitHub Pages: черновики, публикации и загруженные файлы кабинета хранятся только в этом браузере.
const clips = {
  "437": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/ab877990-56d3-469b-99f7-611f8a8fb42b.mp4",
  "439": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/c2824904-a76a-43c6-bd41-363cc7ed66be.mp4",
  "446": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/fc3abde5-d5bb-48a5-85ee-bac562421ed0.mp4",
  "449": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/92cc3f69-5e8f-4f0c-8f9b-80ff371d8bb7.mp4",
  "452": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/0d448ce9-d715-4f69-9144-3ff6ff8d095a.mp4"
};
const base = new URL(self.registration.scope).pathname;
const routes = {
  '/api/content': 'GET', '/api/admin/session': 'GET', '/api/admin/login': 'POST', '/api/admin/logout': 'POST',
  '/api/admin/content': 'GET', '/api/admin/draft': 'PUT', '/api/admin/publish': 'POST', '/api/admin/media': 'POST'
};
const types = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4',
  'application/pdf': 'pdf', 'application/zip': 'zip', 'application/x-zip-compressed': 'zip'
};
const empty = { draft: null, published: null, revision: 0, publishedRevision: 0, updatedAt: null };
let opening = null;
let queue = Promise.resolve();

function database() {
  opening ||= new Promise((resolve, reject) => {
    const request = indexedDB.open('zashumleno-demo', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('state');
      request.result.createObjectStore('media');
    };
    request.onsuccess = () => {
      const db = request.result;
      // «Сбросить демо» удаляет базу из вкладки: отпускаем соединение, чтобы удаление не ждало.
      db.onversionchange = () => { db.close(); opening = null; };
      resolve(db);
    };
    request.onerror = () => { opening = null; reject(request.error); };
  });
  return opening;
}

async function read(store, key) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function write(store, key, value) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite');
    transaction.objectStore(store).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

function serial(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

async function state() {
  return { ...empty, ...(await read('state', 'content')) };
}

async function upload(request) {
  const raw = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!types[raw]) return json({ error: 'Выберите JPG, PNG, WebP, PDF, ZIP или MP4.', code: 'unsupported_file' }, 415);
  const type = raw === 'application/x-zip-compressed' ? 'application/zip' : raw;
  const blob = await request.blob();
  const limit = type === 'video/mp4' || type === 'application/zip' ? 32 * 1024 * 1024 : 5 * 1024 * 1024;
  if (blob.size > limit) return json({ error: 'Файл слишком большой.', code: 'file_too_large' }, 413);
  const key = crypto.randomUUID() + '.' + types[type];
  await write('media', key, { type, blob });
  return json({ url: '/media/' + key }, 201);
}

async function api(request, path) {
  const method = routes[path];
  if (!method) return json({ error: 'Адрес не найден.', code: 'not_found' }, 404);
  if (method !== request.method) return json({ error: 'Метод не поддерживается.' }, 405);
  if (path === '/api/content') {
    const current = await state();
    return json({ content: current.published, revision: current.publishedRevision });
  }
  if (path === '/api/admin/session') return json({ authenticated: Boolean(await read('state', 'auth')) });
  if (path === '/api/admin/login') {
    const body = await request.json().catch(() => ({}));
    if (!String(body.password || '').trim()) return json({ error: 'Введите любой пароль — это демо.', code: 'wrong_password' }, 401);
    await write('state', 'auth', true);
    return json({ authenticated: true });
  }
  if (path === '/api/admin/logout') {
    await write('state', 'auth', false);
    return json({ authenticated: false });
  }
  if (!await read('state', 'auth')) return json({ error: 'Войдите в панель управления.', code: 'authentication_required' }, 401);
  const current = await state();
  if (path === '/api/admin/content') {
    const { draft, revision, publishedRevision, updatedAt } = current;
    return json({ draft, revision, publishedRevision, updatedAt });
  }
  if (path === '/api/admin/media') return upload(request);
  const data = await request.json().catch(() => null);
  if (!data || !Number.isSafeInteger(data.revision) || data.revision < 0) {
    return json({ error: 'Укажите текущую версию документа.', code: 'revision_required' }, 400);
  }
  const conflict = () => json({ error: 'Содержимое изменилось в другой вкладке. Загрузите свежую версию перед сохранением.', code: 'revision_conflict' }, 409);
  if (data.revision !== current.revision) return conflict();
  if (path === '/api/admin/publish') {
    if (!current.draft) return conflict();
    current.published = current.draft;
    current.revision += 1;
    current.publishedRevision = current.revision;
  } else {
    const content = data.content;
    if (!content || typeof content.page !== 'object' || !Array.isArray(content.prices) || !Array.isArray(content.zones) || !Array.isArray(content.works)) {
      return json({ error: 'Нужен полный снимок сайта, включая страницу, прайс, зоны и работы.', code: 'content_invalid' }, 422);
    }
    current.draft = content;
    current.revision += 1;
  }
  current.updatedAt = new Date().toISOString();
  await write('state', 'content', current);
  return json({ revision: current.revision, publishedRevision: current.publishedRevision, updatedAt: current.updatedAt });
}

async function media(key) {
  const item = await read('media', decodeURIComponent(key)).catch(() => null);
  if (!item) return new Response('Файл не найден', { status: 404 });
  return new Response(item.blob, { headers: { 'content-type': item.type, 'cache-control': 'no-store' } });
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => { if (event.data === 'claim') event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(base)) return;
  const path = '/' + url.pathname.slice(base.length);
  if (path.startsWith('/api/')) {
    event.respondWith(serial(() => api(event.request, path)).catch(() =>
      json({ error: 'Демо-хранилище браузера недоступно.', code: 'storage_error' }, 503)));
  } else if (path.startsWith('/media/')) {
    event.respondWith(media(path.slice('/media/'.length)));
  } else {
    const clip = /^\/v2\/media\/works\/(\d+)\.mp4$/.exec(path);
    if (clip && clips[clip[1]]) event.respondWith(Response.redirect(clips[clip[1]], 302));
  }
});
