(() => {
  'use strict';

  const labels = { calculator: 'Калькулятор', layers: 'Что внутри (материалы)', prices: 'Прайс', services: 'Услуги', works: 'Наши работы', request: 'Консультация', studio: 'Контакты' };
  let fieldId = 0;

  function el(tag, className, value) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (value != null) item.textContent = value;
    return item;
  }
  function button(label, action, extraClass = '') {
    const control = el('button', 'pe-button ' + extraClass, label);
    control.type = 'button';
    control.addEventListener('click', action);
    return control;
  }
  function card(parent, heading, note) {
    const box = el('section', 'pe-card');
    box.append(el('h2', '', heading));
    if (note) box.append(el('p', 'pe-note', note));
    const grid = el('div', 'pe-grid');
    box.append(grid);
    parent.append(box);
    return grid;
  }

  function field(ctx, parent, target, key, label, options = {}) {
    const id = 'page-field-' + (++fieldId);
    const box = el('div', 'pe-field' + (options.wide ? ' pe-wide' : ''));
    const name = el('label', '', label);
    name.htmlFor = id;
    const control = document.createElement(options.multiline ? 'textarea' : 'input');
    control.id = id;
    if (options.multiline) control.rows = options.rows || 3;
    else control.type = options.type || 'text';
    if (options.hint) control.placeholder = options.hint;
    control.maxLength = options.limit || (options.multiline ? 7000 : 1000);
    if (options.mode) control.inputMode = options.mode;
    control.value = target[key] || '';
    control.addEventListener('input', () => {
      target[key] = control.value;
      ctx.change();
      options.update?.(control.value);
    });
    box.append(name, control);
    if (options.note) {
      const note = el('small', 'pe-note', options.note);
      note.id = id + '-note';
      control.setAttribute('aria-describedby', note.id);
      box.append(note);
    }
    parent.append(box);
    return control;
  }

  function check(ctx, parent, target, key, caption, update) {
    const wrap = el('label', 'pe-check');
    const input = el('input'); input.type = 'checkbox'; input.checked = target[key];
    input.addEventListener('change', () => {
      target[key] = input.checked;
      ctx.change();
      update?.();
    });
    wrap.append(input, caption);
    parent.append(wrap);
  }

  function media(ctx, parent, target, key, title, kind = 'image') {
    const box = el('div', 'pe-media pe-wide');
    const isImage = kind === 'image';
    const preview = el('img', 'pe-preview'); preview.alt = '';
    const previewURL = value => {
      const url = StudioPage.mediaUrl(value);
      preview.hidden = !(isImage && url);
      if (isImage && url) preview.src = new URL(url, window.StudioKit?.siteRoot?.() || new URL('/', location.href)).href;
      else preview.removeAttribute('src');
    };
    const path = field(ctx, box, target, key, title, {
      hint: isImage ? 'Выберите файл или вставьте HTTPS-ссылку на картинку' : 'Выберите файл или укажите HTTPS-ссылку',
      wide: true, limit: 2000, update: previewURL
    });
    const tools = el('div', 'pe-upload');
    const upload = el('input', 'pe-upload-input'); upload.type = 'file';
    upload.id = 'page-upload-' + fieldId;
    upload.accept = isImage ? 'image/jpeg,image/png,image/webp' : kind === 'video' ? 'video/mp4' : 'application/zip,.zip';
    const uploadLabel = el('label', 'pe-button', 'Выбрать файл');
    uploadLabel.htmlFor = upload.id;
    const busy = el('span', 'pe-upload-status');
    busy.setAttribute('role', 'status');
    const summary = isImage ? 'JPG, PNG или WebP' : kind === 'video' ? 'MP4, до 32 МБ' : 'ZIP, до 32 МБ';
    busy.textContent = summary;
    upload.addEventListener('change', async () => {
      if (!upload.files?.[0]) return;
      const file = upload.files[0];
      upload.disabled = true;
      busy.textContent = 'Загружаем «' + file.name + '»…';
      try {
        const url = await ctx.upload(file);
        if (typeof url !== 'string' || !StudioPage.mediaUrl(url)) throw new Error('Сервер вернул некорректную ссылку.');
        path.value = url;
        target[key] = url;
        previewURL(url);
        ctx.change();
        busy.textContent = 'Загружен файл «' + file.name + '».';
      } catch (error) {
        busy.textContent = error.message || 'Не удалось загрузить файл.';
      } finally {
        upload.disabled = false;
        upload.value = '';
      }
    });
    previewURL(target[key]);
    tools.append(upload, uploadLabel, busy);
    box.append(tools);
    if (isImage) box.append(preview);
    parent.append(box);
  }

  function orderControls(ctx, parent, items, index, name, rerender) {
    const tools = el('div', 'pe-order');
    for (const [label, delta] of [['Выше', -1], ['Ниже', 1]]) {
      const next = index + delta;
      const move = button(label, () => {
        [items[index], items[next]] = [items[next], items[index]];
        ctx.change(); rerender(next);
      });
      move.setAttribute('aria-label', name + ' — ' + label.toLowerCase());
      move.disabled = next < 0 || next >= items.length;
      tools.append(move);
    }
    parent.append(tools);
    return tools;
  }

  function disclosure(parent, caption, meta, open) {
    const details = el('details', 'pe-item');
    details.open = open;
    const summary = el('summary');
    summary.append(el('span', 'pe-item-title', caption), el('small', 'pe-item-meta', meta));
    const body = el('div', 'pe-item-body');
    details.append(summary, body);
    parent.append(details);
    return { details, body, summary };
  }

  function home(ctx, page) {
    const { host } = ctx;
    const brand = card(host, 'Шапка сайта', 'Логотип, название и фирменные цвета — в разделе «Цвета и логотип».');
    field(ctx, brand, page.brand, 'telegramLabel', 'Кнопка связи в шапке', { limit: 80 });
    brand.append(button('Открыть «Цвета и логотип»', () => window.StudioAdmin.navigate('palette')));
    const hero = card(host, 'Первый экран');
    field(ctx, hero, page.hero, 'kicker', 'Подпись над заголовком');
    field(ctx, hero, page.hero, 'city', 'Город');
    field(ctx, hero, page.hero, 'title', 'Главный заголовок', { multiline: true, rows: 2, wide: true, limit: 200, note: 'Enter переносит строку.' });
    field(ctx, hero, page.hero, 'description', 'Текст под заголовком', { multiline: true, wide: true });
    field(ctx, hero, page.hero, 'primaryLabel', 'Кнопка перехода к калькулятору');
    field(ctx, hero, page.hero, 'secondaryLabel', 'Кнопка перехода к работам');
    media(ctx, hero, page.hero, 'image', 'Обложка первого экрана');
    const search = card(host, 'Название вкладки и описание для поиска');
    field(ctx, search, page.brand, 'siteTitle', 'Название страницы', { wide: true, limit: 180 });
    field(ctx, search, page.brand, 'description', 'Краткое описание', { multiline: true, wide: true, limit: 500 });
  }

  function sections(ctx, page) {
    const list = el('div', 'pe-stack'); ctx.host.append(list);
    function render(selected) {
      list.replaceChildren();
      page.sections.forEach((item, i) => {
        const name = labels[item.id];
        const { body, details, summary } = disclosure(list, name, item.enabled ? 'Показывается' : 'Скрыт', i === selected);
        const actions = el('div', 'pe-item-actions');
        check(ctx, actions, item, 'enabled', 'Показывать раздел', () => {
          summary.querySelector('small').textContent = item.enabled ? 'Показывается' : 'Скрыт';
        });
        orderControls(ctx, actions, page.sections, i, name, render);
        body.append(actions);
        const grid = el('div', 'pe-grid'); body.append(grid);
        field(ctx, grid, item, 'title', 'Заголовок раздела');
        field(ctx, grid, item, 'kicker', 'Надпись над заголовком');
        field(ctx, grid, item, 'description', 'Описание', { multiline: true, wide: true });
        field(ctx, grid, item, 'navLabel', 'Название в верхнем меню', { wide: true, note: 'Оставьте пустым, чтобы убрать ссылку из меню.' });
        if (item.id === 'prices') {
          media(ctx, grid, page, 'priceArchive', 'Архив прайсов для скачивания', 'archive');
          check(ctx, grid, page, 'hidePriceArchive', 'Скрыть кнопку скачивания архива');
          grid.append(el('p', 'pe-note pe-wide', 'После изменения тарифов загрузите новый ZIP со всеми листами. До замены устаревший исходный архив скрывается.'));
        }
        if (selected === i) details.querySelector('summary').focus({ preventScroll: true });
      });
    }
    render();
  }

  function services(ctx, page) {
    const head = el('div', 'pe-list-head');
    const list = el('div', 'pe-stack');
    ctx.host.append(head, list);
    let focusId = null;
    function render(selected) {
      head.replaceChildren();
      const add = button('Добавить услугу', () => {
        page.services.push({ title: 'Новая услуга', description: '', image: '', alt: '', action: 'Обсудить услугу' });
        ctx.change();
        focusId = page.services.length - 1;
        render(focusId);
      }, 'pe-primary');
      head.append(el('p', 'pe-note', 'Порядок карточек совпадает с порядком на главной странице.'), add);
      list.replaceChildren();
      if (!page.services.length) list.append(el('p', 'pe-note', 'Добавьте первую услугу, чтобы создать карточку на сайте.'));
      page.services.forEach((item, i) => {
        const { body, summary } = disclosure(list, item.title || 'Услуга без названия', 'Карточка услуги', i === selected);
        const grid = el('div', 'pe-grid'); body.append(grid);
        const name = field(ctx, grid, item, 'title', 'Название услуги', { wide: true, limit: 180, update: text => {
          summary.querySelector('span').textContent = text || 'Услуга без названия';
        } });
        field(ctx, grid, item, 'description', 'Описание услуги', { multiline: true, wide: true });
        media(ctx, grid, item, 'image', 'Фото услуги');
        field(ctx, grid, item, 'alt', 'Описание изображения', { note: 'Этот текст прочитает экранный диктор.' });
        field(ctx, grid, item, 'action', 'Надпись на кнопке', { note: 'Оставьте пустым, чтобы скрыть кнопку консультации.' });
        const tools = el('div', 'pe-item-actions');
        orderControls(ctx, tools, page.services, i, item.title, render);
        const remove = button('Удалить карточку', () => {
          const confirm = el('div', 'pe-confirm');
          confirm.append(el('span', '', 'Удалить «' + (item.title || 'Без названия') + '» из черновика?'));
          const yes = button('Удалить', () => {
            page.services.splice(i, 1); ctx.change(); render(Math.min(i, page.services.length - 1));
          }, 'pe-remove');
          const cancel = button('Оставить', () => { confirm.remove(); remove.hidden = false; remove.focus(); });
          confirm.append(yes, cancel); tools.append(confirm); remove.hidden = true; cancel.focus();
        }, 'pe-remove');
        tools.append(button('Дублировать', () => {
          page.services.splice(i + 1, 0, { ...item, title: item.title + ' — копия' });
          ctx.change(); focusId = i + 1; render(i + 1);
        }), remove);
        body.append(tools);
        if (focusId === i) { name.focus(); name.select(); focusId = null; }
      });
    }
    render();
  }

  function contacts(ctx, page) {
    const c = page.contacts;
    const contact = card(ctx.host, 'Связь со студией');
    field(ctx, contact, c, 'phone', 'Телефон студии', { type: 'tel' });
    field(ctx, contact, c, 'telegram', 'Telegram для заявок', { hint: '@имя или https://t.me/имя' });
    field(ctx, contact, c, 'person', 'Кому адресован запрос');
    field(ctx, contact, c, 'role', 'Должность или подпись');
    field(ctx, contact, c, 'telegramChannel', 'Канал портфолио в Telegram');
    field(ctx, contact, c, 'vk', 'Страница ВКонтакте');
    const address = card(ctx.host, 'Адрес и карта');
    field(ctx, address, c, 'shortAddress', 'Короткий адрес');
    field(ctx, address, c, 'address', 'Полный адрес студии', { note: 'Схема проезда нарисована для адреса «Варшавское шоссе, 152А, паркинг −1». При другом адресе на сайте останется только карта.' });
    field(ctx, address, c, 'entrance', 'Как найти вход', { wide: true });
    field(ctx, address, c, 'metro', 'Ближайшее метро', { wide: true, hint: 'Рядом метро «…»' });
    field(ctx, address, c, 'map', 'Ссылка на Яндекс Карты или 2ГИС', { wide: true, note: 'Кнопка «Построить маршрут». Из короткой ссылки Яндекс Карт (yandex.ru/maps/-/…) сайт сам соберёт интерактивную карту.' });
    field(ctx, address, c, 'mapEmbed', 'Код карты для вкладки «Яндекс Карта» (необязательно)', { multiline: true, rows: 3, wide: true, limit: 2000,
      note: 'В Яндекс Картах откройте студию → «Поделиться» → «Виджет с картой» → скопируйте код и вставьте сюда. Пустое поле — карта по ссылке выше.' });
    const route = card(ctx.host, 'Шаги проезда', 'Три шага на анимированной схеме. Фото показывается рядом с текстом, «Время в видео» — момент, с которого откроется видео проезда.');
    page.route.forEach((step, index) => {
      const { body } = disclosure(route, 'Шаг ' + (index + 1) + ': ' + step.title, 'Шаг схемы', index === 0);
      const grid = el('div', 'pe-grid'); body.append(grid);
      field(ctx, grid, step, 'title', 'Название шага', { limit: 30 });
      const time = field(ctx, grid, step, 'time', 'Время в видео, секунд', { mode: 'numeric', limit: 5 });
      time.addEventListener('input', () => {
        const value = Number(time.value.replace(',', '.'));
        step.time = Number.isFinite(value) && value >= 0 ? value : 0;
        ctx.change();
      });
      field(ctx, grid, step, 'text', 'Что делать на этом шаге', { multiline: true, wide: true, limit: 400, note: 'Слова «позвоните в студию» станут ссылкой для звонка.' });
      media(ctx, grid, step, 'image', 'Фото этого места');
    });
    const video = card(ctx.host, 'Видео проезда');
    media(ctx, video, c, 'routeVideo', 'Видео маршрута', 'video');
    media(ctx, video, c, 'routePoster', 'Обложка видео');
    field(ctx, video, c, 'routeCaption', 'Подпись к видео');
    const l = page.legal;
    const legal = card(ctx.host, 'Сведения о предпринимателе или организации', 'Заполняйте по официальным документам. Эти сведения отображаются на странице правовой информации.');
    field(ctx, legal, l, 'roleLabel', 'В каком качестве указан предприниматель', { wide: true });
    field(ctx, legal, l, 'name', 'Полное наименование', { wide: true });
    field(ctx, legal, l, 'inn', 'ИНН', { mode: 'numeric', limit: 12 });
    field(ctx, legal, l, 'registrationNumber', 'ОГРН или ОГРНИП', { mode: 'numeric', limit: 15 });
    field(ctx, legal, l, 'registrationDate', 'Дата государственной регистрации', { hint: 'ДД.ММ.ГГГГ' });
    field(ctx, legal, l, 'registryEmail', 'Электронная почта из реестра', { type: 'email' });
    field(ctx, legal, l, 'registeringAuthority', 'Регистрирующий орган', { wide: true });
    field(ctx, legal, l, 'sourceUrl', 'Ссылка на официальный реестр', { wide: true });
    field(ctx, legal, l, 'legalAddress', 'Адрес исполнителя для публикации', { wide: true });
    field(ctx, legal, l, 'email', 'Электронная почта для обращений', { type: 'email' });
    field(ctx, legal, l, 'hours', 'Режим работы');
    field(ctx, legal, l, 'hoursSourceUrl', 'Ссылка на источник расписания', { wide: true });
    const terms = card(ctx.host, 'Условия оказания услуг');
    for (const [key, label] of [['payment', 'Порядок и способы оплаты'], ['timing', 'Сроки работ'], ['warranty', 'Условия гарантии'], ['policyText', 'Дополнение к политике обработки данных']]) {
      field(ctx, terms, l, key, label, { multiline: true, wide: true, limit: key === 'policyText' ? 15000 : 3000 });
    }
    const owner = card(ctx.host, 'Владелец сайта', 'Заполните, если сайт и услуги принадлежат разным владельцам.');
    field(ctx, owner, l, 'siteOwnerName', 'Наименование владельца', { wide: true });
    field(ctx, owner, l, 'siteOwnerAddress', 'Адрес владельца для публикации', { wide: true });
    field(ctx, owner, l, 'siteOwnerEmail', 'Электронная почта владельца', { type: 'email' });
  }

  for (const [id, name, description, draw, group, order] of [
    ['page-home', 'Обложка и тексты', 'Первый экран: заголовок, текст, кнопки и фото. Описание для поисковиков.', home, 'Оформление', 20],
    ['page-sections', 'Разделы и меню', 'Раскройте раздел, чтобы изменить его текст, положение или видимость.', sections, 'Оформление', 30],
    ['page-services', 'Услуги студии', 'Карточки услуг в разделе под прайсом.', services, 'Фото и работы', 40],
    ['page-contacts', 'Контакты и проезд', 'Телефон и мессенджеры, адрес, шаги проезда, карта и реквизиты.', contacts, 'Контакты', 10]
  ]) {
    StudioAdmin.register({ id, title: name, description, group, order, render(ctx) {
      if (!ctx.data.page) ctx.data.page = StudioPage.normalize({});
      draw(ctx, ctx.data.page);
      return () => StudioPage.validate(ctx.data.page);
    } });
  }
})();
