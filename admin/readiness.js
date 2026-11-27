(() => {
  'use strict';

  // «Готовность сайта» on the cabinet home: what is still empty in the draft and what the site shows instead.
  // The block only reads the draft: it saves nothing and never stands in the way of a publication.
  // Set to false to remove the block from the cabinet.
  const enabled = true;
  // Items the studio leaves empty on purpose are remembered in this browser only.
  const storeKey = 'zs-admin-ready-hidden';
  const standardZones = { doors: 'Двери', arches: 'Арки и шины', floor: 'Пол', trunk: 'Багажник', roof: 'Потолок', dashboard: 'Торпедо' };

  const filled = value => typeof value === 'string' && value.trim() !== '';
  // «A», «B», «C» и ещё 2
  function quote(names, limit = 3) {
    const shown = names.slice(0, limit).map(name => '«' + name + '»').join(', ');
    return names.length > limit ? shown + ' и ещё ' + (names.length - limit) : shown;
  }
  const named = (one, many, names) => names.length === 1 ? one + ' ' + quote(names) : many + ': ' + quote(names);

  // The price list on the site decides the same way which sheets and which archive are still current (v2/rates.js).
  const signature = rate => JSON.stringify([rate.group, rate.title, rate.columns, rate.rows, rate.notes]);
  function currentSheet(rate, seed, file) {
    const prior = seed?.find(item => item.sheet && item.sheet === rate.sheet)
      || seed?.find(item => item.title === rate.title && item.group === rate.group);
    const older = prior && signature(prior) !== signature(rate);
    for (const key of ['sheet', 'source']) {
      if (older && rate[key] === prior[key]) continue;
      const path = file(rate[key]);
      if (path) return path;
    }
    return '';
  }
  function archiveFor(prices, seed, page, file) {
    if (page.hidePriceArchive) return '';
    const archive = file(page.priceArchive);
    const defaultArchive = 'sheets/prices.zip';
    if (archive && archive.replace(/^\//, '') !== defaultArchive) return archive;
    const originalFiles = rates => rates.map(rate => JSON.stringify([signature(rate), rate.sheet, rate.source])).sort().join('\n');
    return seed && originalFiles(prices) !== originalFiles(seed) ? '' : defaultArchive;
  }

  // Pairs of colours the palette screen warns about (admin/palette-editor.js): [text, background, least contrast].
  const contrastPairs = brand => [
    [brand.accent, brand.nightColor, 4.5], [brand.darkAccent, brand.paperColor, 4.5],
    ['#f6f5fa', brand.nightColor, 7], ['#1a1726', brand.paperColor, 7]
  ];
  // Every check: id, done, what is missing (title), what the site shows instead (text), the name of the filled item (ready),
  // the place in the cabinet (field) and how to get there (go). Only checks that make sense for the draft are returned.
  function inspect(content, seed = {}) {
    const reader = window.StudioPage;
    const page = content?.page || {};
    const contacts = page.contacts || {};
    const legal = page.legal || {};
    const brand = page.brand || {};
    const file = value => filled(value) ? reader.mediaUrl(value) : '';
    const link = key => Boolean(reader.contactUrl(key, contacts[key]));
    const list = value => Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : [];
    const checks = [];
    const add = (id, done, texts, go, field) => checks.push({ id, done: Boolean(done), ...texts, go, field });

    // Contacts and social networks.
    for (const [id, key, label, title, ready, where, also] of [
      ['youtube', 'youtube', 'YouTube', 'Нет ссылки на YouTube', 'Ссылка на YouTube', 'YouTube', ''],
      ['channel', 'telegramChannel', 'Telegram-канал студии', 'Нет ссылки на Telegram-канал', 'Ссылка на Telegram-канал', 'Telegram-канала',
        ', ссылка «Все работы в Telegram» в разделе работ'],
      ['vk', 'vk', 'Страница ВКонтакте', 'Нет ссылки на страницу ВКонтакте', 'Ссылка на страницу ВКонтакте', 'ВКонтакте', '']
    ]) {
      add(id, link(key), { title, ready, text: 'Плашка ' + where + ' в блоке «Мы в социальных сетях»' + also + ' и ссылка в подвале сайта скрыты.' },
        { section: 'page-contacts', label }, label);
    }
    add('whatsapp', link('whatsapp'), { title: 'Не указан WhatsApp для заявок', ready: 'WhatsApp для заявок',
      text: 'В заявке нет кнопки «Открыть в WhatsApp»: посетитель может написать только в Telegram.' },
    { section: 'page-contacts', label: 'WhatsApp для заявок' }, 'WhatsApp для заявок');
    add('phone', /^\+?\d{7,15}$/.test(String(contacts.phone || '').replace(/[^\d+]/g, '')), { title: 'Не указан телефон студии', ready: 'Телефон студии',
      text: 'В контактах, в блоке заявки и на странице реквизитов нет номера для звонка.' },
    { section: 'page-contacts', label: 'Телефон студии' }, 'Телефон студии');
    add('map', link('map'), { title: 'Нет ссылки на карту', ready: 'Ссылка на карту',
      text: 'На сайте нет кнопки «Построить маршрут», а в подвале — ссылки с адресом студии.' },
    { section: 'page-contacts', label: 'Ссылка на Яндекс Карты или 2ГИС' }, 'Ссылка на Яндекс Карты или 2ГИС');
    add('hours', filled(legal.hours), { title: 'Не указан режим работы', ready: 'Режим работы',
      text: 'Строки «Часы работы» нет в контактах, строки «Режим работы» — на странице реквизитов.' },
    { section: 'page-contacts', label: 'Режим работы' }, 'Режим работы');
    add('route-video', file(contacts.routeVideo), { title: 'Нет видео проезда', ready: 'Видео проезда',
      text: 'В контактах нет карточки «Видео проезда».' }, { section: 'media', media: 'Видео проезда' }, 'Проезд');

    // Requisites.
    const requisites = [['name', 'Полное наименование', 'наименование'], ['inn', 'ИНН', 'ИНН'], ['registrationNumber', 'ОГРН или ОГРНИП', 'ОГРН или ОГРНИП']]
      .filter(([key]) => !filled(legal[key]));
    add('requisites', !requisites.length, { title: 'В реквизитах не заполнено: ' + requisites.map(item => item[2]).join(', '), ready: 'Наименование, ИНН и ОГРН',
      text: 'Этих сведений нет в подвале сайта, на странице реквизитов и в политике обработки данных.' },
    { section: 'page-contacts', label: requisites[0]?.[1] }, 'Сведения о предпринимателе или организации');
    add('legal-address', filled(legal.legalAddress), { title: 'Не указан адрес исполнителя', ready: 'Адрес исполнителя',
      text: 'На странице «Реквизиты и информация» нет строки «Адрес исполнителя».' },
    { section: 'page-contacts', label: 'Адрес исполнителя для публикации' }, 'Адрес исполнителя для публикации');
    const mail = value => typeof value === 'string' && /^[^\s@?,#]+@[^\s@?,#]+\.[^\s@?,#]+$/.test(value);
    add('email', mail(legal.email), { title: 'Нет почты для обращений', ready: 'Почта для обращений',
      text: mail(legal.registryEmail) ? 'На странице реквизитов показана только почта из реестра — она же стоит в политике как адрес для обращений.'
        : 'На странице реквизитов и в политике обработки данных нет электронной почты.' },
    { section: 'page-contacts', label: 'Электронная почта для обращений' }, 'Электронная почта для обращений');
    const terms = [['payment', 'Порядок и способы оплаты', 'оплата', '«Оплата»'], ['timing', 'Сроки работ', 'сроки', '«Сроки»'],
      ['warranty', 'Условия гарантии', 'гарантия', '«Гарантии»']].filter(([key]) => !filled(legal[key]));
    add('terms', !terms.length, { title: 'Не описаны условия: ' + terms.map(item => item[2]).join(', '), ready: 'Оплата, сроки и гарантия',
      text: 'На странице «Реквизиты и информация» нет ' + (terms.length === 1 ? 'строки ' : 'строк ') + terms.map(item => item[3]).join(', ') + '.' },
    { section: 'page-contacts', label: terms[0]?.[1] }, 'Условия оказания услуг');

    // Services.
    const services = list(page.services).filter(service => filled(service.title));
    const position = service => page.services.indexOf(service);
    add('services', services.length, { title: 'В каталоге нет ни одной услуги', ready: 'Услуги в каталоге: ' + services.length,
      text: 'Раздел услуг на сайте скрыт.' }, { section: 'page-services', button: 'Добавить услугу' }, 'Карточки услуг');
    if (services.length) {
      const bare = services.filter(service => !file(service.image));
      add('service-photos', !bare.length, { title: named('Нет фото у услуги', 'Нет фото у услуг', bare.map(service => service.title.trim())),
        ready: 'Фото у каждой услуги', text: 'Вместо фото на карточке стоит заглушка с волнами.' },
      { section: 'page-services', item: position(bare[0]), label: 'Фото услуги' }, 'Фото услуги');
      const silent = services.filter(service => !filled(service.description));
      add('service-texts', !silent.length, { title: named('Нет описания у услуги', 'Нет описания у услуг', silent.map(service => service.title.trim())),
        ready: 'Описание у каждой услуги', text: 'На карточке только название и кнопка.' },
      { section: 'page-services', item: position(silent[0]), label: 'Описание услуги' }, 'Описание услуги');
    }

    // Zones and works.
    const zones = list(content?.zones).filter(zone => filled(zone.title));
    const zoneAt = zone => content.zones.indexOf(zone);
    if (zones.length) {
      const bare = zones.filter(zone => !file(zone.image));
      add('zone-photos', !bare.length, { title: named('Нет фото у зоны', 'Нет фото у зон', bare.map(zone => zone.title.trim())), ready: 'Фото у каждой зоны',
        text: 'В прайсе рядом с описанием зоны нет снимка.' + (bare.some(zone => !standardZones[zone.id])
          ? ' У зоны, добавленной в кабинете, на плитке калькулятора стоит значок вместо фото.' : '') },
      { open: ['zones', 'zones', zoneAt(bare[0])], aria: 'Фото зоны' }, 'Фото зоны');
      const silent = zones.filter(zone => !filled(zone.description));
      add('zone-texts', !silent.length, { title: named('Нет описания у зоны', 'Нет описания у зон', silent.map(zone => zone.title.trim())),
        ready: 'Описание у каждой зоны', text: 'В прайсе под названием зоны нет текста.' },
      { open: ['zones', 'zones', zoneAt(silent[0])], aria: 'Короткое описание' }, 'Короткое описание');
      // «Что внутри» shows the zones whose kits have sheets of known materials (v2/layers.js).
      const materials = new Set(list(content?.materials).filter(item => typeof item.id === 'string' && item.name).map(item => item.id));
      const shown = zones.filter(zone => {
        const group = zone.group || standardZones[zone.id] || zone.title;
        return list(content?.prices).some(rate => (rate.group === group || rate.group === zone.title) &&
          Array.isArray(rate.layers) && rate.layers.some(layer => materials.has(layer?.material)));
      });
      if (shown.length) {
        const empty = shown.filter(zone => !list(zone.gallery).some(photo => file(photo.image)));
        add('zone-galleries', !empty.length, { title: named('Нет фото готовых работ у зоны', 'Нет фото готовых работ у зон', empty.map(zone => zone.title.trim())),
          ready: 'Фото готовых работ у каждой зоны', text: 'Под анимацией «Что внутри» для такой зоны нет блока «Наши работы».' },
        { section: 'media', gallery: empty[0]?.title }, 'Фото готовых работ по зонам');
      }
    }
    const works = list(content?.works).filter(work => filled(work.model) || filled(work.title));
    const workAt = work => content.works.indexOf(work);
    const workName = work => [work.model, work.title].filter(filled).map(part => part.trim()).join(' · ');
    add('works', works.length, { title: 'Нет ни одной работы', ready: 'Работы студии: ' + works.length,
      text: 'В разделе «Машины в работе» на сайте ' + (link('telegramChannel') ? 'остаются только заголовок и ссылка «Все работы в Telegram».' : 'остаётся только заголовок.') },
    { section: 'works', button: 'Добавить работу' }, 'Работы студии');
    if (works.length) {
      const bare = works.filter(work => !file(work.image));
      add('work-photos', !bare.length, { title: named('Нет фото у работы', 'Нет фото у работ', bare.map(workName)), ready: 'Фото у каждой работы',
        text: 'В разделе «Машины в работе» у такого проекта нет миниатюры и обложки ролика.' },
      { open: ['works', 'works', workAt(bare[0])], aria: 'Фотография работы' }, 'Фотография работы');
      const mute = works.filter(work => !file(work.video));
      add('work-videos', !mute.length, { title: named('Нет видео у работы', 'Нет видео у работ', mute.map(workName)), ready: 'Видео у каждой работы',
        text: 'В разделе «Машины в работе» у такого проекта нет кнопки «Смотреть видео».' },
      { open: ['works', 'works', workAt(mute[0])], aria: 'Видео работы' }, 'Видео работы');
    }

    // Price list.
    const prices = list(content?.prices);
    if (prices.length) {
      const rateName = rate => [rate.group, rate.title].filter(filled).join(' · ');
      const loose = prices.filter(rate => !currentSheet(rate, seed.prices, file));
      add('sheets', !loose.length, { title: named('Нет листа прайса у тарифа', 'Нет листа прайса у тарифов', loose.map(rateName)), ready: 'Лист прайса у каждого тарифа',
        text: 'В прайсе у такого тарифа нет ссылки «Оригинал прайса».' },
      { section: 'media', media: loose[0] && loose[0].group + ' · ' + loose[0].title }, 'Оригиналы прайс-листов');
      // The owner may switch the button off: then the archive is not expected.
      if (!page.hidePriceArchive) {
        add('archive', archiveFor(prices, seed.prices, page, file), { title: 'Нет актуального архива прайсов', ready: 'Архив прайсов',
          text: 'Кнопка «Скачать прайс» на сайте скрыта: тарифы или их листы изменились, а новый архив не загружен.' },
        { section: 'media', media: 'Архив всех прайсов (ZIP)' }, 'Оригиналы прайс-листов');
      }
      add('basis', filled(content?.vehicles?.basis), { title: 'Нет пояснения к базовым ценам', ready: 'Пояснение к базовым ценам',
        text: 'Пока посетитель не выбрал машину, в прайсе нет строки о том, для какой машины указаны цены.' },
      { section: 'vehicles', label: 'Пояснение для клиентов' }, 'Пояснение для клиентов');
    }

    // Look of the site.
    add('cover', file(page.hero?.image), { title: 'Нет фото на первом экране', ready: 'Фото первого экрана',
      text: 'Обложка сайта показывается без фотографии.' }, { section: 'media', media: 'Обложка сайта' }, 'Первый экран');
    const hex = value => /^#[0-9a-f]{6}$/i.test(value || '');
    const contrast = window.StudioKit?.contrast;
    if (contrast) {
      add('contrast', !contrastPairs(brand).some(([text, back, least]) => hex(text) && hex(back) && contrast(text, back) < least),
        { title: 'Часть фирменных цветов плохо читается', ready: 'Фирменные цвета читаются',
          text: 'Текст или кнопки на сайте сливаются с фоном. Какой цвет поправить, подсказано под полями цветов.' },
        { section: 'palette', card: 'Цвета' }, 'Цвета');
    }
    return checks;
  }

  // The count of the block: items hidden by the owner are left out. Where the draft and the site differ, an item filled
  // in the draft only waits for a publication, and an item emptied in the draft only is still filled on the site.
  function tally(checks, hidden = new Set(), live = new Map()) {
    const open = checks.filter(check => !check.done && !hidden.has(check.id));
    const skipped = checks.filter(check => !check.done && hidden.has(check.id));
    const done = checks.filter(check => check.done);
    return { open, skipped, done, waiting: done.filter(check => live.get(check.id) === false),
      emptied: open.filter(check => live.get(check.id) === true), total: open.length + done.length };
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function button(label, className, action) {
    const node = el('button', className, label);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  }

  function readHidden() {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) || '[]');
      return new Set(Array.isArray(saved) ? saved.filter(id => typeof id === 'string') : []);
    } catch { return new Set(); }
  }
  function writeHidden(hidden) {
    try { localStorage.setItem(storeKey, JSON.stringify([...hidden])); } catch { /* Private mode: the choice lives until the page is closed. */ }
  }
  // In private mode nothing is stored: the choice is kept for the open cabinet.
  let hidden = null;

  const sectionTitle = id => [...document.querySelectorAll('#section-select option')].find(option => option.value === id)?.textContent || '';
  const sectionOf = go => go.open ? go.open[0] : go.section;

  // The control a check points at, inside the section that has just been drawn.
  function locate(editor, go) {
    const byText = (selector, text) => [...editor.querySelectorAll(selector)].find(node => node.textContent.trim() === text);
    if (go.button) return byText('button', go.button);
    if (go.aria) return [...editor.querySelectorAll('input, textarea')].find(node => node.getAttribute('aria-label') === go.aria);
    if (go.media) return byText('.k-media-info > strong', go.media)?.closest('.k-media')?.querySelector('button');
    if (go.gallery) return byText('.k-gallery-head > strong', go.gallery)?.closest('.k-gallery')?.querySelector('button');
    if (go.card) return byText('.k-card-head > h2', go.card)?.closest('.k-card')?.querySelector('input:not([type=color]), button');
    const scope = Number.isInteger(go.item) ? editor.querySelectorAll('details.pe-item')[go.item] : editor;
    const label = scope && go.label ? [...scope.querySelectorAll('label')].find(node => node.textContent.trim() === go.label) : null;
    return label?.htmlFor ? document.getElementById(label.htmlFor) : null;
  }

  // Opens the section of a check and puts the cursor into its field.
  function reveal(go) {
    const admin = window.StudioAdmin;
    if (go.open && go.open[2] >= 0) admin.open(...go.open); else admin.navigate(sectionOf(go));
    // The cabinet does not leave the screen while a file is being uploaded: the request to open a record is withdrawn.
    if (document.getElementById('section-select')?.value !== sectionOf(go)) {
      if (go.open) admin.takeFocus?.(go.open[1]);
      return;
    }
    const editor = document.getElementById('editor');
    let target = locate(editor, go);
    if (!target) return;
    for (let box = target.closest('details'); box; box = box.parentElement?.closest('details')) box.open = true;
    // A file is easier to choose than to type its address: the cursor goes to the upload button of the field.
    const upload = target.closest('.cat-attachment')?.querySelector('.cat-upload-line button') || target.closest('.pe-media')?.querySelector('.pe-upload-input');
    const spot = upload?.closest('.cat-attachment, .pe-media') || target.closest('.pe-field, .k-field, .k-media, .k-gallery, .cat-field') || target;
    if (upload) target = upload;
    const show = () => {
      if (!target.isConnected) return;
      target.focus({ preventScroll: true });
      spot.scrollIntoView({ block: 'center' });
    };
    show();
    // The field is pointed out until the highlight fades or the cursor leaves it.
    const calm = () => spot.classList.remove('rd-spot');
    spot.classList.add('rd-spot');
    spot.addEventListener('animationend', calm, { once: true });
    // Pictures above the field are still loading and push it down: aim again while the cursor stays in the field.
    const settle = () => { if (document.activeElement === target) spot.scrollIntoView({ block: 'center' }); };
    editor.addEventListener('load', settle, true);
    target.addEventListener('blur', () => { calm(); editor.removeEventListener('load', settle, true); }, { once: true });
  }

  function ring(done, total) {
    const ns = 'http://www.w3.org/2000/svg';
    const box = el('div', 'rd-ring');
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 64 64');
    svg.setAttribute('aria-hidden', 'true');
    const length = 2 * Math.PI * 27;
    for (const [name, share] of [['rd-ring-track', 1], ['rd-ring-fill', total ? done / total : 0]]) {
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('class', name);
      circle.setAttribute('cx', '32');
      circle.setAttribute('cy', '32');
      circle.setAttribute('r', '27');
      circle.setAttribute('stroke-dasharray', (length * share).toFixed(2) + ' ' + length.toFixed(2));
      svg.append(circle);
    }
    box.append(svg, el('strong', '', String(done)), el('span', '', 'из ' + total));
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', 'Заполнено ' + done + ' из ' + total);
    box.dataset.full = String(total > 0 && done === total);
    return box;
  }

  let block = null;
  let expanded = false;
  const shortList = 4;
  function draw(focus) {
    const admin = window.StudioAdmin;
    if (!block?.isConnected || !admin?.content) return;
    hidden ||= readHidden();
    const seed = { prices: window.STUDIO_PRICES };
    const checks = inspect(admin.content, seed);
    const live = admin.published ? new Map(inspect(admin.published, seed).map(check => [check.id, check.done])) : new Map();
    const { open, skipped, done, waiting, emptied, total } = tally(checks, hidden, live);

    const head = el('div', 'rd-head');
    const summary = el('div', 'rd-summary');
    // «Заполнено всё» is said only when nothing is left out: hidden items are still empty on the site.
    const complete = !open.length && !skipped.length;
    const title = el('h2', '', complete ? 'Заполнено всё: ' + total + ' из ' + total : 'Заполнено ' + done.length + ' из ' + total);
    title.id = 'rd-title';
    const lead = open.length ? 'Ниже — что ещё пусто и как это видит посетитель. Публикации это не мешает.'
      : skipped.length ? 'Незаполненные пункты вы скрыли — они в списке ниже.'
        : waiting.length ? 'В черновике пустых мест не осталось.' : 'Пустых мест на сайте не осталось.';
    summary.append(el('p', 'a-eyebrow', 'Готовность сайта'), title, el('p', 'rd-lead', lead));
    if (waiting.length) summary.append(el('p', 'rd-waiting', 'Заполнено в черновике и появится на сайте после публикации: ' + waiting.length + '.'));
    head.append(ring(done.length, total), summary);

    const place = check => [sectionTitle(sectionOf(check.go)), check.field].filter(Boolean).join(' → ');
    const items = el('ul', 'rd-list');
    // A long list starts with its first items, so that the tiles of the home screen stay within reach.
    // An item that is about to get the focus is never left behind the fold.
    const wanted = /data-check="([^"]+)"/.exec(focus || '')?.[1];
    if (open.findIndex(check => check.id === wanted) >= shortList) expanded = true;
    const shown = expanded || open.length <= shortList + 1 ? open : open.slice(0, shortList);
    for (const check of shown) {
      const item = el('li', 'rd-item');
      item.dataset.check = check.id;
      const text = el('div', 'rd-text');
      text.append(el('strong', '', check.title), el('span', '', check.text));
      // Emptied in the draft only: the site keeps the previous value until the next publication.
      if (emptied.includes(check)) text.append(el('em', 'rd-note', 'Пока только в черновике: на сайте так станет после публикации.'));
      text.append(el('small', '', place(check)));
      const go = button('Открыть раздел', 'a-btn a-quiet rd-open', () => reveal(check.go));
      go.setAttribute('aria-label', 'Открыть раздел «' + sectionTitle(sectionOf(check.go)) + '»: ' + check.field);
      const skip = button('Скрыть', 'rd-skip', () => {
        hidden.add(check.id);
        writeHidden(hidden);
        const next = open[open.indexOf(check) + 1] || open[open.indexOf(check) - 1];
        draw(next ? '.rd-list [data-check="' + next.id + '"] .rd-open' : '.rd-skipped summary');
        admin.notify('Пункт скрыт. Вернуть его можно в списке «Скрытые пункты».');
      });
      skip.setAttribute('aria-label', 'Скрыть пункт: ' + check.title);
      const actions = el('div', 'rd-actions');
      actions.append(go, skip);
      const mark = el('span', 'rd-mark');
      mark.setAttribute('aria-hidden', 'true');
      item.append(mark, text, actions);
      items.append(item);
    }

    const parts = [head];
    if (open.length) parts.push(items);
    if (shown.length < open.length) {
      parts.push(button('Показать ещё ' + (open.length - shown.length), 'a-btn a-quiet rd-all', () => {
        expanded = true;
        draw('.rd-list [data-check="' + open[shown.length].id + '"] .rd-open');
      }));
    }
    if (done.length) {
      const box = el('details', 'rd-more rd-done');
      box.open = Boolean(block.querySelector('.rd-done')?.open);
      box.append(el('summary', '', 'Готово: ' + done.length));
      const list = el('ul');
      for (const check of done) {
        const item = el('li', '', check.ready);
        if (live.get(check.id) === false) item.append(el('small', '', 'в черновике, появится на сайте после публикации'));
        list.append(item);
      }
      box.append(list);
      parts.push(box);
    }
    if (skipped.length) {
      const box = el('details', 'rd-more rd-skipped');
      // The list stays open while it is being worked with.
      box.open = Boolean(block.querySelector('.rd-skipped')?.open || focus?.includes('rd-skipped'));
      box.append(el('summary', '', 'Скрытые пункты: ' + skipped.length));
      const list = el('ul');
      for (const check of skipped) {
        const item = el('li');
        item.dataset.check = check.id;
        const back = button('Вернуть', 'rd-skip', () => {
          hidden.delete(check.id);
          writeHidden(hidden);
          draw('.rd-list [data-check="' + check.id + '"] .rd-open');
        });
        back.setAttribute('aria-label', 'Вернуть пункт: ' + check.title);
        item.append(el('span', '', check.title), back);
        list.append(item);
      }
      box.append(list);
      parts.push(box);
    }
    block.replaceChildren(...parts);
    if (focus) block.querySelector(focus)?.focus({ preventScroll: true });
  }

  // Called by the home screen: the block stands right under the status of the site.
  function mount(anchor) {
    if (!enabled || !anchor?.isConnected) return;
    block = el('section', 'rd');
    block.setAttribute('aria-labelledby', 'rd-title');
    anchor.after(block);
    draw();
  }
  // What waited for a publication is on the site now.
  window.addEventListener?.('studio:published', () => draw());

  window.StudioReadiness = { enabled, inspect, tally, mount };
})();
