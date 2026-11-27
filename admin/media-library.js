(() => {
  'use strict';
  const K = window.StudioKit;

  function group(host, title, note) {
    const body = K.card(host, title, note, 'k-media-group');
    const grid = K.el('div', 'k-media-grid');
    body.append(grid);
    return grid;
  }

  // A list of photos with captions: add several at once, reorder, remove.
  function gallery(ctx, parent, owner, label) {
    owner.gallery = Array.isArray(owner.gallery) ? owner.gallery : [];
    const box = K.el('div', 'k-gallery');
    const head = K.el('div', 'k-gallery-head');
    head.append(K.el('strong', '', label));
    const input = K.el('input', 'k-file');
    input.type = 'file';
    input.tabIndex = -1;
    input.setAttribute('aria-label', 'Фото: ' + label);
    input.multiple = true;
    input.accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
    const add = K.button('Добавить фото', () => input.click(), 'k-primary');
    const status = K.el('small', 'k-media-status');
    status.setAttribute('role', 'status');
    const say = (message, failed = false) => { status.textContent = message; status.dataset.state = failed ? 'error' : ''; };
    head.append(add, status, input);
    const list = K.el('div', 'k-gallery-list');
    box.append(head, list);
    function draw() {
      list.replaceChildren();
      owner.gallery.forEach((photo, index) => {
        const item = K.el('div', 'k-gallery-item');
        const preview = K.el('div', 'k-gallery-preview');
        preview.append(K.previewOf(K.mediaUrl(photo.image), 'image'));
        const caption = K.el('textarea');
        caption.rows = 2;
        caption.value = photo.caption || '';
        caption.placeholder = 'Подпись к фото';
        caption.maxLength = 160;
        caption.setAttribute('aria-label', 'Подпись к фото ' + (index + 1));
        caption.addEventListener('input', () => { photo.caption = caption.value; ctx.change(); });
        const tools = K.el('div', 'k-row-tools');
        const left = K.button('←', () => { if (K.move(owner.gallery, index, index - 1)) { ctx.change(); draw(); } }, 'k-icon');
        const right = K.button('→', () => { if (K.move(owner.gallery, index, index + 1)) { ctx.change(); draw(); } }, 'k-icon');
        left.setAttribute('aria-label', 'Фото ' + (index + 1) + ' — раньше');
        right.setAttribute('aria-label', 'Фото ' + (index + 1) + ' — позже');
        left.disabled = index === 0;
        right.disabled = index === owner.gallery.length - 1;
        tools.append(left, right, K.button('Удалить', () => {
          // The photo and its caption cannot be put back with one click.
          if (!window.confirm('Удалить это фото из галереи «' + label + '»?')) return;
          owner.gallery.splice(index, 1);
          ctx.change();
          draw();
          const next = list.querySelectorAll('.k-gallery-item .k-danger')[Math.min(index, owner.gallery.length - 1)];
          (next || add).focus();
        }, 'k-danger'));
        item.append(preview, caption, tools);
        list.append(item);
      });
      if (!owner.gallery.length) list.append(K.el('p', 'k-empty', 'Фото пока нет. Добавьте снимки готовой работы — они появятся под анимацией.'));
    }
    input.addEventListener('change', async () => {
      const files = [...(input.files || [])];
      input.value = '';
      const unsupported = files.find(file => !K.acceptsFile(file, input.accept));
      if (unsupported) {
        say('Для галереи нужно фото JPG, PNG или WebP. Файл «' + unsupported.name + '» не подходит — ничего не загружено.', true);
        return;
      }
      add.disabled = true;
      let done = 0;
      // One bad photo must not stop the rest: they are loaded and the failures are named at the end.
      const failed = [];
      for (const [position, file] of files.entries()) {
        say('Загружаем ' + (position + 1) + ' из ' + files.length + '…');
        try {
          const url = await ctx.upload(file);
          owner.gallery.push({ image: url, caption: '' });
          ctx.change();
          done++;
          draw();
        } catch (error) {
          failed.push('«' + file.name + '» — ' + (error.message || 'не удалось загрузить'));
          // Without a connection or a session the other files would fail the same way.
          if (error.status === 0 || error.status === 401) {
            if (files.length - position > 1) failed.push('остальные файлы (' + (files.length - position - 1) + ') не загружались');
            break;
          }
        }
      }
      say((done ? 'Добавлено фото: ' + done + '. Допишите подписи. ' : '') + (failed.length ? 'Не загружено: ' + failed.join('; ') : ''), failed.length > 0);
      add.disabled = false;
    });
    draw();
    parent.append(box);
  }

  function render(ctx) {
    const data = ctx.data;
    const page = data.page;
    const host = ctx.host;
    const tip = K.card(host, 'Как заменить фото или видео', null, 'k-explain');
    tip.append(K.el('p', '', 'Нажмите «Заменить» и выберите файл с компьютера или телефона. Большие фото сайт уменьшит сам. Видео — в формате MP4 до 32 МБ. После загрузки проверьте предпросмотр и нажмите «Опубликовать».'));

    const cover = group(host, 'Первый экран');
    K.media(ctx, cover, page.hero, 'image', 'Обложка сайта', { removable: false, reset: window.STUDIO_PAGE_DEFAULTS?.hero?.image,
      note: 'Широкое фото, лучше 1920 px по ширине. На телефоне показывается та же картинка.' });
    K.media(ctx, cover, page.brand, 'logo', 'Логотип', { removable: false, contain: true, reset: 'assets/mark.svg' });

    const zonesGrid = group(host, 'Фото зон', 'Показываются в прайсе. В калькуляторе вместо стандартного фото — оформленная картинка; загрузите своё фото, и оно появится и там.');
    for (const zone of data.zones || []) K.media(ctx, zonesGrid, zone, 'image', zone.title, { compact: true });

    const galleries = K.card(host, 'Фото готовых работ по зонам', 'Эти фото видны под анимацией «Что внутри» и открываются на весь экран.');
    for (const zone of data.zones || []) gallery(ctx, galleries, zone, zone.title);

    const worksGrid = group(host, 'Работы студии', 'Фото — обложка карточки, видео открывается по кнопке «Смотреть видео». Подписи и описание — в разделе «Работы студии».');
    for (const work of data.works || []) {
      const name = [work.model, work.title].filter(Boolean).join(' — ');
      K.media(ctx, worksGrid, work, 'image', name + ': фото', { compact: true });
      K.media(ctx, worksGrid, work, 'video', name + ': видео', { compact: true, kind: 'video' });
    }

    const servicesGrid = group(host, 'Услуги');
    for (const service of page.services || []) K.media(ctx, servicesGrid, service, 'image', service.title || 'Услуга', { compact: true });

    const routeGrid = group(host, 'Проезд', 'Видео проезда и фото шагов на схеме.');
    K.media(ctx, routeGrid, page.contacts, 'routeVideo', 'Видео проезда', { kind: 'video', compact: true, reset: 'assets/studio-film.mp4' });
    K.media(ctx, routeGrid, page.contacts, 'routePoster', 'Обложка видео проезда', { compact: true });
    (page.route || []).forEach((step, index) => K.media(ctx, routeGrid, step, 'image', 'Шаг ' + (index + 1) + ': ' + step.title, { compact: true }));

    const sheets = group(host, 'Оригиналы прайс-листов', 'Ссылка «Оригинал прайса» в каждом тарифе. Можно загрузить JPG, PNG, WebP или PDF.');
    for (const rate of data.prices || []) {
      K.media(ctx, sheets, rate, 'sheet', rate.group + ' · ' + rate.title, { compact: true, kind: 'file', accept: 'application/pdf,image/jpeg,image/png,image/webp' });
    }
    K.media(ctx, sheets, page, 'priceArchive', 'Архив всех прайсов (ZIP)', { compact: true, kind: 'file', accept: 'application/zip,.zip' });
  }

  window.StudioAdmin.register({
    id: 'media', title: 'Фото и видео', group: 'Фото и работы', order: 10,
    description: 'Все фото и видео сайта в одном месте: обложка, зоны, работы, услуги, проезд и прайс-листы.',
    render
  });
})();
