(() => {
  'use strict';

  const sections = new Map();
  // Order of the menu groups. Sections register themselves with one of these names.
  const groupOrder = ['Цены', 'Фото и работы', 'Оформление', 'Контакты'];
  window.StudioAdmin = {
    register(section) {
      if (!section.id || sections.has(section.id) || typeof section.render !== 'function') {
        throw new Error('Некорректный раздел кабинета');
      }
      sections.set(section.id, section);
    },
    get content() { return content; },
    get published() { return published; },
    navigate: id => navigate(id),
    notify: message => notify(message),
    // Opens a section on a particular record: StudioAdmin.open('price-table', 'prices', 3).
    open(id, kind, index) { focusRequest = { kind, index }; navigate(id); },
    takeFocus(kind) {
      const request = focusRequest;
      focusRequest = null;
      return request && request.kind === kind ? request.index : null;
    }
  };
  let focusRequest = null;
  let quietSave = false;

  const byId = (id) => document.getElementById(id);
  const clone = (value) => structuredClone(value);
  let content = null;
  let published = null;
  let saved = '';
  let revision = 0;
  let publishedRevision = 0;
  let active = 'overview';
  let validate = null;
  let busy = false;
  let dirty = false;
  let conflict = false;
  let uploads = 0;
  let toastTimer;
  let autosaveTimer;
  let savedAt = null;
  let invalidMessage = '';

  function node(name, className, text) {
    const el = document.createElement(name);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  const iconPaths = {
    overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    prices: 'M3 12.5V5a2 2 0 0 1 2-2h7.5L21 11.5 12.5 20z M8 8.01V8',
    'price-table': 'M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h4',
    vehicles: 'M3 15l2-6h14l2 6v3H3z M6 18v2 M18 18v2 M7 13h.01 M17 13h.01',
    zones: 'M8 3h8l2 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z M6 9h12 M6 15h12',
    media: 'M3 5h18v14H3z M3 15l5-5 4 4 3-3 6 6 M15 9h.01',
    works: 'M3 6h5l2-3h4l2 3h5v14H3z M16 13a4 4 0 1 1-8 0 4 4 0 1 1 8 0',
    materials: 'M4 7l8-4 8 4-8 4z M4 12l8 4 8-4 M4 17l8 4 8-4',
    palette: 'M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-.8-.6-1.2-.6-2 0-.9.7-1.5 1.6-1.5H17a4 4 0 0 0 4-4c0-5-4-9-9-9z M7.5 11h.01 M10 7h.01 M14.5 7h.01',
    'page-home': 'M3 11l9-8 9 8 M6 9v12h12V9 M10 21v-7h4v7',
    'page-sections': 'M4 4h16v4H4z M4 11h16v4H4z M4 18h16v3H4z',
    'page-services': 'M4 8h16v13H4z M8 8V4h8v4 M4 13h16',
    'page-contacts': 'M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'
  };

  function icon(id) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    const path = document.createElementNS(ns, 'path');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'a-grid-icon');
    path.setAttribute('d', iconPaths[id] || iconPaths['page-sections']);
    svg.append(path);
    return svg;
  }

  function notify(message) {
    const toast = byId('toast');
    clearTimeout(toastTimer);
    toast.textContent = String(message);
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
  }

  function banner(message, reload = false) {
    const box = byId('banner');
    box.hidden = !message;
    box.querySelector('p').textContent = message || '';
    byId('reload-snapshot').hidden = !reload;
  }

  class ApiError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }

  async function api(path, method = 'GET', payload, file = false) {
    const options = { method, credentials: 'same-origin', cache: 'no-store' };
    if (payload !== undefined) {
      options.headers = { 'Content-Type': file ? payload.type : 'application/json' };
      options.body = file ? payload : JSON.stringify(payload);
    }
    let response;
    try { response = await fetch('api/admin/' + path, options); }
    catch { throw new ApiError(0, 'Соединение прервалось. Проверьте интернет и повторите действие.'); }
    const result = await response.json().catch(() => null);
    if (!response.ok || !result) {
      const defaults = {
        401: 'Войдите в кабинет ещё раз.', 403: 'Браузер не подтвердил доступ к кабинету.',
        409: 'В другом окне уже сохранена более свежая версия.',
        413: 'Размер файла или данных превышает допустимый.',
        429: 'Слишком много попыток. Попробуйте войти через 15 минут.',
        503: 'Кабинет пока не подключён к серверу. Обратитесь к администратору сайта.'
      };
      const error = result?.error;
      const message = typeof error === 'string' && /[А-Яа-яЁё]/.test(error) ? error : defaults[response.status];
      throw new ApiError(response.status, message || 'Сервер кабинета не ответил. Повторите попытку.');
    }
    return result;
  }

  function seed() {
    if (!window.StudioPage || !Array.isArray(window.STUDIO_PRICES) ||
      !Array.isArray(window.STUDIO_ZONES) || !Array.isArray(window.STUDIO_WORKS)) {
      throw new Error('Не удалось загрузить начальные материалы сайта. Обновите страницу.');
    }
    return {
      page: window.StudioPage.normalize(clone(window.STUDIO_PAGE_DEFAULTS)),
      prices: clone(window.STUDIO_PRICES), zones: clone(window.STUDIO_ZONES), works: clone(window.STUDIO_WORKS),
      vehicles: clone(window.STUDIO_VEHICLES || { bodies: [], classes: [] }), materials: clone(window.STUDIO_MATERIALS || [])
    };
  }

  function prepare(value) {
    const base = seed();
    const result = window.StudioContent ? window.StudioContent.upgrade(clone(value || base), base) : clone(value || base);
    result.page = window.StudioPage.normalize(result.page);
    result.works = window.StudioWorks.normalize(result.works);
    return result;
  }

  function changed() {
    dirty = JSON.stringify(content) !== saved;
    syncActions();
    clearTimeout(autosaveTimer);
    if (dirty) autosaveTimer = setTimeout(autosave, 1400);
  }

  function timeLabel(date) {
    return date ? date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
  }

  function syncActions() {
    const locked = busy || uploads > 0 || conflict;
    const unpublished = dirty || revision !== publishedRevision;
    byId('publish').disabled = locked || !unpublished;
    byId('save').hidden = !dirty;
    byId('save').disabled = locked;
    byId('editor').inert = busy && !quietSave;
    byId('logout').disabled = busy || uploads > 0;
    const state = byId('save-state');
    state.dataset.state = invalidMessage ? 'invalid' : dirty ? 'dirty' : unpublished ? 'draft' : 'saved';
    state.textContent = busy ? 'Сохраняем черновик…' : uploads ? 'Загружаем файл…' :
      conflict ? 'Найдены изменения в другом окне.' : invalidMessage ? 'Черновик не сохранён: ' + invalidMessage :
        dirty ? 'Изменения сохранятся автоматически…' :
          unpublished ? 'Черновик сохранён' + (savedAt ? ' в ' + timeLabel(savedAt) : '') + '. Клиенты увидят изменения после публикации.' :
            'На сайте опубликована текущая версия.';
    byId('publish-count').textContent = unpublished && published ? String(changeList().length || '') : '';
  }

  function showLogin(message = '') {
    if (previewOpen()) togglePreview(false);
    byId('app').hidden = true;
    byId('logout').hidden = true;
    byId('entry').hidden = false;
    byId('login-error').textContent = message;
    byId('login-error').hidden = !message;
    if (message) byId('password').focus();
  }

  function showApp() {
    byId('entry').hidden = true;
    byId('app').hidden = false;
    byId('logout').hidden = false;
    byId('password').value = '';
    byId('show-password').setAttribute('aria-pressed', 'false');
    byId('show-password').textContent = 'Показать';
    byId('show-password').setAttribute('aria-label', 'Показать пароль');
    byId('password').type = 'password';
    syncActions();
  }

  function handleError(error) {
    if (error.status === 401) {
      showLogin('Время сеанса истекло. Введите пароль, чтобы продолжить работу.');
      return;
    }
    if (error.status === 409) {
      conflict = true;
      banner('В другом окне уже обновили сайт. Ваши правки остаются на экране. Скопируйте нужные значения и загрузите свежую версию.', true);
    } else { banner(error.message); }
    notify(error.message);
    syncActions();
  }

  async function loadPublished() {
    try {
      const response = await fetch('api/content', { credentials: 'same-origin', cache: 'no-store' });
      const result = response.ok ? await response.json() : null;
      published = prepare(result?.content || null);
    } catch { published = prepare(null); }
  }

  async function loadContent() {
    const response = await api('content');
    content = prepare(response.draft);
    saved = JSON.stringify(content);
    revision = response.revision;
    publishedRevision = response.publishedRevision;
    savedAt = response.updatedAt ? new Date(response.updatedAt) : null;
    dirty = false;
    conflict = false;
    invalidMessage = '';
    banner('');
    await loadPublished();
    showApp();
    navigate(location.hash.slice(1), false, false);
  }

  // Photos straight from a phone are reduced in the browser: long side up to 2400 px, WebP or JPEG.
  async function prepareImage(file) {
    const type = file.type || '';
    if (!/^image\/(?:jpeg|png|webp|heic|heif)$/i.test(type) && !/\.(?:heic|heif)$/i.test(file.name || '')) return file;
    const smallEnough = file.size <= 1.4 * 1024 * 1024 && !/hei[cf]/i.test(type + file.name);
    let bitmap;
    try { bitmap = await createImageBitmap(file); }
    catch {
      if (/hei[cf]/i.test(type + file.name)) throw new Error('Этот браузер не открывает HEIC. Сохраните фото как JPG и загрузите снова.');
      return file;
    }
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && smallEnough) { bitmap.close?.(); return file; }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const encode = mime => new Promise(resolve => canvas.toBlob(resolve, mime, .86));
    let blob = await encode('image/webp');
    if (!blob || blob.type !== 'image/webp') blob = await encode(type === 'image/png' ? 'image/png' : 'image/jpeg');
    if (!blob || (blob.size >= file.size && scale === 1 && !/hei[cf]/i.test(type + file.name))) return file;
    const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
    return new File([blob], String(file.name || 'photo').replace(/\.[^.]+$/, '') + '.' + extension, { type: blob.type });
  }

  async function upload(original) {
    let file = original;
    const extension = String(file.name || '').split('.').pop().toLowerCase();
    const known = { jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', png: 'image/png', pdf: 'application/pdf', zip: 'application/zip', mp4: 'video/mp4' };
    uploads++;
    syncActions();
    try {
      if (/^image\//.test(file.type) || /\.(?:jpe?g|png|webp|heic|heif)$/i.test(file.name || '')) file = await prepareImage(file);
      const mime = file.type === 'application/x-zip-compressed' ? 'application/zip' : file.type || known[extension];
      if (!Object.values(known).includes(mime)) throw new Error('Выберите JPG, PNG, WebP, PDF, ZIP или MP4.');
      const limit = ['application/zip', 'video/mp4'].includes(mime) ? 32 : 5;
      if (file.size > limit * 1024 * 1024) {
        throw new Error(mime === 'video/mp4'
          ? 'Видео больше 32 МБ. Сократите ролик или сохраните его в меньшем качестве (720p) и загрузите снова.'
          : 'Файл больше ' + limit + ' МБ. Выберите файл поменьше.');
      }
      return (await api('media', 'POST', file.slice(0, file.size, mime), true)).url;
    } catch (error) {
      if (error instanceof ApiError) handleError(error);
      throw error;
    } finally { uploads--; syncActions(); }
  }

  function findProblem() {
    const localMessage = typeof validate === 'function' && validate();
    let message = localMessage || window.StudioPage.validate(content.page);
    let where = active;
    if (!message) {
      for (const section of sections.values()) {
        if (typeof section.validateData !== 'function') continue;
        message = section.validateData(content);
        if (message) { where = section.id; break; }
      }
    }
    return typeof message === 'string' && message ? { message, where } : null;
  }

  function checkEditor() {
    const problem = findProblem();
    if (!problem) return true;
    if (active !== problem.where && sections.has(problem.where)) navigate(problem.where);
    banner(problem.message);
    notify(problem.message);
    return false;
  }

  async function storeDraft() {
    if (!dirty) return;
    const snapshot = clone(content);
    const response = await api('draft', 'PUT', { content: snapshot, revision });
    revision = response.revision;
    publishedRevision = response.publishedRevision;
    saved = JSON.stringify(snapshot);
    savedAt = new Date();
    dirty = JSON.stringify(content) !== saved;
    refreshPreview();
  }

  // Drafts are saved on their own a moment after the last change.
  async function autosave() {
    if (!content || !dirty) return;
    if (busy || uploads || conflict) { autosaveTimer = setTimeout(autosave, 1500); return; }
    const problem = findProblem();
    invalidMessage = problem ? problem.message : '';
    if (problem) { syncActions(); return; }
    // A background save must not take the field away from someone who is typing.
    busy = true;
    quietSave = true;
    syncActions();
    try { await storeDraft(); }
    catch (error) { handleError(error); }
    finally { busy = false; quietSave = false; syncActions(); }
  }

  async function perform(kind) {
    clearTimeout(autosaveTimer);
    if (busy || conflict || uploads || !checkEditor()) return false;
    invalidMessage = '';
    busy = true;
    syncActions();
    banner('');
    try {
      await storeDraft();
      if (kind === 'publish' && revision !== publishedRevision) {
        const response = await api('publish', 'POST', { revision });
        revision = response.revision;
        publishedRevision = response.publishedRevision;
        published = clone(content);
        window.dispatchEvent(new CustomEvent('studio:published'));
        notify('Готово! Изменения опубликованы на сайте.');
      } else if (kind === 'save') { notify('Черновик сохранён.'); }
      return true;
    } catch (error) { handleError(error); return false; }
    finally { busy = false; syncActions(); }
  }

  // A readable list of what differs from the published site.
  function changeList() {
    if (!content || !published) return [];
    const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
    const list = [];
    const page = content.page, before = published.page;
    const colorKeys = window.StudioPage.colorKeys || ['accent', 'darkAccent'];
    if (!same(colorKeys.map(key => page.brand[key]), colorKeys.map(key => before.brand[key]))) list.push(['palette', 'Фирменные цвета']);
    const brandRest = key => Object.fromEntries(Object.entries(key.brand).filter(([name]) => !colorKeys.includes(name)));
    if (!same(brandRest(page), brandRest(before)) || !same(page.hero, before.hero)) list.push(['page-home', 'Обложка, название и логотип']);
    if (!same(page.sections, before.sections)) list.push(['page-sections', 'Разделы и меню']);
    if (!same(page.services, before.services)) list.push(['page-services', 'Услуги студии']);
    if (!same(page.contacts, before.contacts) || !same(page.route, before.route) || !same(page.legal, before.legal)) list.push(['page-contacts', 'Контакты, проезд и реквизиты']);
    if (!same(page.priceArchive, before.priceArchive) || !same(page.hidePriceArchive, before.hidePriceArchive)) list.push(['page-sections', 'Архив прайса']);
    const strip = rates => (rates || []).map(rate => ({ ...rate, layers: undefined }));
    if (!same(strip(content.prices), strip(published.prices))) list.push(['prices', 'Цены']);
    if (!same((content.prices || []).map(rate => rate.layers), (published.prices || []).map(rate => rate.layers)) ||
      !same(content.materials, published.materials)) list.push(['materials', 'Материалы и слои']);
    if (!same(content.zones, published.zones)) list.push(['zones', 'Зоны и фото работ по зонам']);
    if (!same(content.works, published.works)) list.push(['works', 'Работы студии']);
    if (!same(content.vehicles, published.vehicles)) list.push(['vehicles', 'Цены по автомобилю']);
    return list;
  }

  async function discardChanges() {
    if (!published) return;
    if (!window.confirm('Вернуть всё как на сайте сейчас? Неопубликованные изменения черновика будут удалены.')) return;
    content = clone(published);
    invalidMessage = '';
    changed();
    navigate(active, false, false);
    notify('Черновик возвращён к опубликованной версии.');
  }

  // Side preview: the draft as visitors will see it, reloaded after each save.
  function previewOpen() { return document.documentElement.classList.contains('a-preview-open'); }
  function refreshPreview() {
    const frame = byId('preview-frame');
    if (!previewOpen() || !frame) return;
    try {
      const y = frame.contentWindow?.scrollY || 0;
      frame.addEventListener('load', () => { try { frame.contentWindow.scrollTo(0, y); } catch { /* Cross-origin is impossible here. */ } }, { once: true });
      frame.contentWindow.location.reload();
    } catch { frame.src = './?preview=draft'; }
  }
  async function togglePreview(force) {
    const open = typeof force === 'boolean' ? force : !previewOpen();
    if (open && dirty && !await perform('preview')) return;
    document.documentElement.classList.toggle('a-preview-open', open);
    byId('preview-pane').hidden = !open;
    byId('preview').setAttribute('aria-expanded', String(open));
    const frame = byId('preview-frame');
    if (open) frame.src = byId('preview').href;
    else frame.removeAttribute('src');
  }

  function navigationButton(id, className, label) {
    const button = node('button', className);
    button.type = 'button';
    button.dataset.screen = id;
    button.append(icon(id), document.createTextNode(label));
    button.addEventListener('click', () => navigate(id));
    return button;
  }

  function orderedGroups() {
    const names = [...new Set([...sections.values()].map(section => section.group || 'Редактор'))];
    return names.sort((a, b) => (groupOrder.indexOf(a) + 1 || 99) - (groupOrder.indexOf(b) + 1 || 99));
  }

  function buildNav() {
    const nav = byId('navigation');
    const select = byId('section-select');
    nav.replaceChildren(navigationButton('overview', 'a-nav-button', 'Главная'));
    select.replaceChildren(new Option('Главная', 'overview'));
    for (const group of orderedGroups()) {
      nav.append(node('p', 'a-nav-group', group));
      const options = node('optgroup');
      options.label = group;
      const items = [...sections.values()].filter(section => (section.group || 'Редактор') === group)
        .sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
      for (const section of items) {
        const option = new Option(section.title, section.id);
        if (section.hidden) option.hidden = true;
        else nav.append(navigationButton(section.id, 'a-nav-button', section.title));
        options.append(option);
      }
      select.append(options);
    }
  }

  // Home screen tiles: the picture of the section, what it is for in plain words.
  const tasks = [
    ['prices', 'Цены', 'Поменять стоимость комплектов — для любой зоны и любого кузова.'],
    ['media', 'Фото и видео', 'Заменить картинку или ролик в любом месте сайта.'],
    ['works', 'Работы студии', 'Добавить готовую машину с фото и видео.'],
    ['vehicles', 'Наценки за машину', 'Насколько дороже кроссовер, внедорожник или премиум-марка.'],
    ['materials', 'Материалы и слои', 'Какие листы показывает анимация «Что внутри».'],
    ['page-home', 'Обложка и тексты', 'Главный заголовок и фото первого экрана.'],
    ['palette', 'Цвета и логотип', 'Фирменные цвета и логотип студии.'],
    ['page-contacts', 'Контакты и проезд', 'Телефон, адрес, карта и шаги проезда.']
  ];

  function renderHome(host) {
    const dashboard = node('div', 'a-home');
    const status = node('section', 'a-status');
    const list = changeList();
    const unpublished = dirty || revision !== publishedRevision;
    const statusText = node('div', 'a-status-text');
    statusText.append(node('h2', '', unpublished ? 'Есть неопубликованные изменения' : 'Сайт в актуальном состоянии'),
      node('p', '', unpublished ? 'Черновик сохраняется сам. Проверьте его в предпросмотре и нажмите «Опубликовать», чтобы клиенты увидели изменения.'
        : 'Всё, что вы видите в кабинете, уже на сайте. Начните с любого раздела ниже.'));
    status.dataset.state = unpublished ? 'draft' : 'live';
    status.append(statusText);
    if (list.length) {
      const changes = node('ul', 'a-status-changes');
      for (const [id, title] of list) {
        const item = node('li');
        const link = node('button', 'a-link', title);
        link.type = 'button';
        link.addEventListener('click', () => navigate(id));
        item.append(link);
        changes.append(item);
      }
      status.append(changes);
    }
    const actions = node('div', 'a-status-actions');
    const open = node('a', 'a-btn a-quiet', 'Открыть сайт');
    // The header link knows where the site is (the demo copy lives in a subfolder).
    open.href = document.querySelector('.a-top-link')?.href || '/'; open.target = '_blank'; open.rel = 'noopener';
    actions.append(open);
    if (unpublished && published) {
      const reset = node('button', 'a-btn a-quiet', 'Вернуть как на сайте');
      reset.type = 'button';
      reset.addEventListener('click', discardChanges);
      actions.append(reset);
    }
    status.append(actions);
    const ask = node('h2', 'a-tiles-title', 'Что хотите изменить?');
    const grid = node('div', 'a-tiles');
    for (const [id, title, text] of tasks) {
      if (!sections.has(id)) continue;
      const card = node('button', 'a-tile');
      card.type = 'button';
      card.dataset.screen = id;
      const art = window.StudioArt ? window.StudioArt.illustration(id, 'a-tile-art') : node('span', 'a-tile-art');
      const go = node('span', 'a-tile-go', 'Открыть');
      card.append(art, node('strong', '', title), node('span', 'a-tile-text', text), go);
      card.addEventListener('click', () => navigate(id));
      grid.append(card);
    }
    const help = node('section', 'a-help a-howto');
    help.append(node('h2', '', 'Как изменить сайт — три шага'));
    const steps = node('ol', 'a-howto-steps');
    for (const [picture, title, text] of [
      ['type', 'Измените', 'Откройте раздел и впишите новое. Черновик сохранится сам через секунду.'],
      ['eye', 'Проверьте', 'Кнопка «Предпросмотр» покажет сайт с вашими правками. Клиенты его пока не видят.'],
      ['publish', 'Опубликуйте', 'Нажмите «Опубликовать» внизу. Передумали — «Вернуть как на сайте».']]) {
      const item = node('li');
      const mark = node('span', 'a-howto-icon');
      if (window.StudioArt) mark.append(window.StudioArt.stepIcon(picture));
      item.append(mark, node('strong', '', title), node('span', '', text));
      steps.append(item);
    }
    help.append(steps);
    dashboard.append(status, ask, grid, help);
    host.replaceChildren(dashboard);
  }

  // Long texts are easier to edit when the box grows with them instead of scrolling inside a small field.
  function fitTextarea(area) {
    if (!(area instanceof HTMLTextAreaElement) || !area.isConnected || area.closest('[hidden]')) return;
    area.style.height = 'auto';
    const border = area.offsetHeight - area.clientHeight;
    area.style.height = Math.min(area.scrollHeight + border, Math.max(320, innerHeight * .6)) + 'px';
  }
  const textareaWatch = new MutationObserver(records => {
    for (const record of records) for (const added of record.addedNodes) {
      if (added.nodeType !== 1) continue;
      if (added.matches('textarea')) requestAnimationFrame(() => fitTextarea(added));
      for (const area of added.querySelectorAll?.('textarea') || []) requestAnimationFrame(() => fitTextarea(area));
    }
  });
  document.addEventListener('input', event => { if (event.target instanceof HTMLTextAreaElement) fitTextarea(event.target); });
  document.addEventListener('toggle', event => {
    if (event.target instanceof HTMLDetailsElement && event.target.open) event.target.querySelectorAll('textarea').forEach(fitTextarea);
  }, true);

  // The picture, the steps and the map of the site above each section. It can be folded away.
  function showGuide(id) {
    const host = byId('guide');
    if (!host) return;
    host.replaceChildren();
    const siteRoot = document.querySelector('.a-top-link')?.href || location.origin + '/';
    const guide = id !== 'overview' && window.StudioArt?.guide(id, siteRoot);
    if (!guide) return;
    let folded = false;
    try { folded = localStorage.getItem('zs-admin-guide') === 'folded'; } catch { /* Private mode keeps it open. */ }
    const toggle = node('button', 'k-guide-toggle');
    toggle.type = 'button';
    const draw = () => {
      host.replaceChildren(...(folded ? [toggle] : [guide, toggle]));
      toggle.textContent = folded ? 'Показать подсказку' : 'Скрыть подсказку';
      toggle.setAttribute('aria-expanded', String(!folded));
      host.dataset.folded = String(folded);
    };
    toggle.addEventListener('click', () => {
      folded = !folded;
      try { localStorage.setItem('zs-admin-guide', folded ? 'folded' : 'open'); } catch { /* Not remembered. */ }
      draw();
    });
    draw();
  }

  function navigate(id, push = true, focus = true) {
    if (!content || busy || uploads) { byId('section-select').value = active; return; }
    const next = sections.has(id) ? id : 'overview';
    active = next;
    validate = null;
    const section = sections.get(next);
    byId('section-select').value = next;
    for (const button of byId('navigation').querySelectorAll('button')) {
      if (button.dataset.screen === next) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
    byId('screen-title').textContent = section?.title || 'Кабинет студии';
    byId('screen-group').textContent = section?.group || 'Главная';
    byId('screen-description').textContent = section?.description || 'Что хотите обновить сегодня?';
    showGuide(next);
    if (!conflict) banner('');
    const host = byId('editor');
    host.replaceChildren();
    if (section) {
      validate = section.render({ host, data: content, change: changed, notify, upload, published, navigate });
    } else { renderHome(host); }
    if (push && location.hash !== '#' + next) history.pushState(null, '', new URL('#' + next, location.href));
    if (focus) { byId('screen-title').focus({ preventScroll: true }); window.scrollTo(0, 0); }
  }

  async function boot() {
    textareaWatch.observe(byId('editor'), { childList: true, subtree: true });
    buildNav();
    const loginButton = byId('login-form').querySelector('button[type=submit]');
    loginButton.disabled = true;
    byId('section-select').addEventListener('change', event => navigate(event.target.value));
    window.addEventListener('popstate', () => navigate(location.hash.slice(1), false));
    window.addEventListener('beforeunload', event => {
      if (!dirty && !uploads) return;
      event.preventDefault(); event.returnValue = '';
    });
    byId('show-password').addEventListener('click', event => {
      const visible = byId('password').type === 'password';
      byId('password').type = visible ? 'text' : 'password';
      event.currentTarget.setAttribute('aria-pressed', String(visible));
      event.currentTarget.setAttribute('aria-label', visible ? 'Скрыть пароль' : 'Показать пароль');
      event.currentTarget.textContent = visible ? 'Скрыть' : 'Показать';
    });
    byId('login-form').addEventListener('submit', async event => {
      event.preventDefault();
      const submit = event.currentTarget.querySelector('button[type=submit]');
      submit.disabled = true;
      try {
        await api('login', 'POST', { password: byId('password').value });
        if (content && dirty) { showApp(); notify('Сеанс восстановлен. Ваши изменения сохранены в форме.'); changed(); }
        else await loadContent();
      } catch (error) { showLogin(error.status === 401 ? 'Пароль не подошёл. Проверьте раскладку и попробуйте ещё раз.' : error.message); }
      finally { submit.disabled = false; }
    });
    byId('logout').addEventListener('click', async () => {
      if (dirty && !window.confirm('Выйти и потерять несохранённые изменения?')) return;
      try {
        await api('logout', 'POST', {});
        content = null; dirty = false; saved = ''; validate = null; conflict = false;
        byId('editor').replaceChildren();
        togglePreview(false);
        showLogin(); byId('password').focus();
      } catch (error) { handleError(error); }
    });
    byId('save').addEventListener('click', () => perform('save'));
    const dialog = byId('publish-dialog');
    byId('publish').addEventListener('click', () => {
      if (!checkEditor()) return;
      const list = byId('publish-list');
      const changes = changeList();
      list.replaceChildren(...changes.map(([, title]) => node('li', '', title)));
      list.hidden = !changes.length;
      dialog.returnValue = 'cancel';
      dialog.showModal();
    });
    dialog.addEventListener('close', () => { if (dialog.returnValue === 'publish') perform('publish'); });
    byId('reload-snapshot').addEventListener('click', async () => {
      if (dirty && !window.confirm('Загрузить свежую версию? Несохранённые изменения в этом окне будут заменены.')) return;
      try { await loadContent(); } catch (error) { handleError(error); }
    });
    byId('preview').addEventListener('click', async event => {
      if (busy || conflict || uploads) { event.preventDefault(); return; }
      // Wide screens show the draft next to the editor, phones open it in a new tab.
      if (matchMedia('(min-width: 80rem)').matches) {
        event.preventDefault();
        await togglePreview();
        return;
      }
      if (!dirty) return;
      event.preventDefault();
      if (!checkEditor()) return;
      const tab = window.open('about:blank', '_blank');
      if (tab) { tab.opener = null; tab.document.title = 'Предпросмотр'; tab.document.body.textContent = 'Сохраняем черновик…'; }
      if (await perform('preview')) {
        if (tab) tab.location.replace(byId('preview').href);
        else notify('Черновик сохранён. Нажмите «Предпросмотр», чтобы открыть его.');
      } else if (tab) tab.close();
    });
    byId('preview-close').addEventListener('click', () => togglePreview(false));
    byId('preview-reload').addEventListener('click', refreshPreview);
    try {
      const session = await api('session');
      if (session.authenticated) await loadContent();
      else showLogin();
    } catch (error) { showLogin(error.message); }
    finally { loginButton.disabled = false; }
  }

  document.addEventListener('DOMContentLoaded', boot, { once: true });
})();
