(() => {
  'use strict';

  function block(tag, className, value = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value) element.textContent = value;
    return element;
  }

  function fileLink(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    return window.StudioPage.mediaUrl(value);
  }

  function setNewTab(link, url) {
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  function mount() {
    const host = document.querySelector('[data-cases]');
    if (!host) return;
    const works = (Array.isArray(window.STUDIO_WORKS) ? window.STUDIO_WORKS : [])
      .filter(work => work && (work.model || work.title));
    if (!works.length) {
      host.replaceChildren();
      return;
    }
    const plural = new Intl.PluralRules('ru').select(works.length);
    const unit = {one: 'работа', few: 'работы'}[plural] || 'работ';
    const layout = block('div', 'case-gallery');
    const preview = block('figure', 'case-project');
    preview.id = 'case-project-panel';
    const media = block('div', 'case-project-media');
    const caption = block('figcaption', 'case-project-caption');
    const model = block('h3', 'case-project-model');
    const service = block('p', 'case-project-service');
    const description = block('p', 'case-project-description');
    const links = block('div', 'case-project-links');
    const original = block('a', 'case-source', 'Публикация студии');
    const request = block('a', 'case-quote', 'Обсудить похожую работу');
    request.href = '#request';
    links.append(request, original);
    caption.append(model, service, description, links);
    preview.append(media, caption);

    const catalogue = block('div', 'case-catalogue');
    const catalogueHead = block('div', 'case-catalogue-head');
    catalogueHead.append(block('span', '', 'Выберите проект'), block('span', 'case-count', works.length + ' ' + unit));
    const tabs = block('div', 'case-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Примеры работ по автомобилям');
    tabs.setAttribute('aria-orientation', 'vertical');
    preview.setAttribute('role', 'tabpanel');
    preview.tabIndex = 0;
    const choices = [];
    const mobile = block('div', 'case-mobile');
    const select = block('select', 'case-select');
    select.setAttribute('aria-label', 'Выберите работу студии');
    const picker = block('div', 'case-picker');
    picker.append(select);
    const paging = block('div', 'case-paging');
    const previous = block('button', 'case-prev', 'Назад');
    const page = block('span', 'case-page');
    const next = block('button', 'case-next', 'Далее');
    previous.type = next.type = 'button';
    previous.setAttribute('aria-label', 'Предыдущая работа');
    next.setAttribute('aria-label', 'Следующая работа');
    paging.append(previous, page, next);
    mobile.append(picker, paging);
    catalogue.append(catalogueHead, tabs);
    layout.append(mobile, catalogue, preview);
    host.replaceChildren(layout);

    let selected = 0;
    let activeVideo;
    let touchStart;
    for (const [index, work] of works.entries()) {
      const tab = block('button', 'case-tab');
      tab.id = 'case-select-' + index;
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', preview.id);
      const source = fileLink(work.image);
      if (source) {
        const thumb = block('img', 'case-thumb');
        thumb.src = source;
        thumb.loading = 'lazy';
        thumb.decoding = 'async';
        thumb.alt = '';
        thumb.addEventListener('error', () => thumb.remove(), {once: true});
        tab.append(thumb);
      }
      const label = block('span', 'case-tab-title');
      label.append(block('strong', '', work.model || work.title));
      if (work.title && work.model) label.append(block('span', '', work.title));
      tab.append(label);
      tab.addEventListener('click', () => show(index));
      tabs.append(tab);
      choices.push(tab);
      select.append(new Option([work.model, work.title].filter(Boolean).join(' · '), String(index)));
    }

    function clearMedia() {
      if (activeVideo) {
        const player = activeVideo;
        activeVideo = null;
        player.pause();
        player.removeAttribute('src');
        player.load();
      }
      media.replaceChildren();
      media.classList.remove('case-playing');
    }

    function renderMedia(work) {
      clearMedia();
      const image = fileLink(work.image);
      const movie = fileLink(work.video);
      const name = [work.model, work.title].filter(Boolean).join(' — ');
      media.hidden = !image && !movie;
      preview.classList.toggle('case-portrait', Boolean(movie));
      media.style.removeProperty('--case-ratio');
      preview.style.removeProperty('--case-proportion');
      function aspect(width, height) {
        if (!width || !height) return;
        preview.classList.toggle('case-portrait', height > width);
        media.style.setProperty('--case-ratio', width + ' / ' + height);
        preview.style.setProperty('--case-proportion', String(width / height));
      }
      if (image) {
        const photo = block('img', 'case-photo');
        photo.alt = name;
        photo.decoding = 'async';
        photo.loading = 'lazy';
        photo.addEventListener('load', () => {
          if (media.contains(photo) && !activeVideo) aspect(photo.naturalWidth, photo.naturalHeight);
        }, {once: true});
        photo.addEventListener('error', () => {
          if (!media.contains(photo)) return;
          photo.remove();
          media.hidden = !movie;
        }, {once: true});
        photo.src = image;
        media.append(photo);
      }
      if (!movie) return;
      const play = block('button', 'case-play');
      play.type = 'button';
      play.setAttribute('aria-label', 'Смотреть видео — ' + name);
      const label = block('span', 'case-play-label');
      const triangle = block('span', 'case-play-icon');
      triangle.setAttribute('aria-hidden', 'true');
      label.append(triangle, 'Смотреть видео');
      play.append(label);
      media.append(play);
      play.addEventListener('click', () => {
        if (activeVideo) return;
        const player = block('video', 'case-player');
        activeVideo = player;
        player.controls = true;
        player.playsInline = true;
        player.preload = 'metadata';
        player.tabIndex = 0;
        player.setAttribute('aria-label', name);
        if (image) player.poster = image;
        player.addEventListener('loadedmetadata', () => {
          if (activeVideo === player) aspect(player.videoWidth, player.videoHeight);
        }, {once: true});
        player.addEventListener('error', () => {
          if (activeVideo !== player) return;
          clearMedia();
          const notice = block('p', 'case-media-error', 'Не удалось загрузить видео.');
          notice.setAttribute('role', 'status');
          const url = fileLink(work.url);
          if (url) {
            const source = block('a', '', 'Открыть оригинал');
            setNewTab(source, url);
            notice.append(' ', source);
          }
          const retry = block('button', 'case-retry', 'Повторить');
          retry.type = 'button';
          retry.addEventListener('click', () => {
            renderMedia(work);
            media.querySelector('.case-play').click();
          });
          notice.append(retry);
          media.append(notice);
          retry.focus({preventScroll: true});
        }, {once: true});
        media.classList.add('case-playing');
        media.replaceChildren(player);
        player.src = movie;
        player.focus({preventScroll: true});
        player.play().catch(() => { /* Native controls remain available if playback requires a second gesture. */ });
      });
    }

    function show(index) {
      if (index < 0 || index >= works.length) return;
      selected = index;
      const work = works[index];
      renderMedia(work);
      model.textContent = work.model || work.title;
      service.hidden = !work.model || !work.title;
      service.textContent = work.title || '';
      description.hidden = !work.description;
      description.textContent = work.description || '';
      const url = fileLink(work.url);
      original.hidden = !url;
      if (url) setNewTab(original, url);
      else original.removeAttribute('href');
      const form = document.getElementById('request');
      request.hidden = !form || form.hidden;
      choices.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === selected));
        tab.tabIndex = i === selected ? 0 : -1;
      });
      preview.setAttribute('aria-labelledby', choices[index].id);
      select.value = String(index);
      page.textContent = (index + 1) + ' / ' + works.length;
      previous.disabled = index === 0;
      next.disabled = index === works.length - 1;
      mobile.hidden = works.length < 2;
    }

    tabs.addEventListener('keydown', event => {
      const target = {
        ArrowDown: (selected + 1) % works.length,
        ArrowUp: (selected - 1 + works.length) % works.length,
        Home: 0,
        End: works.length - 1
      }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      show(target);
      choices[target].focus();
    });
    previous.addEventListener('click', () => show(selected - 1));
    next.addEventListener('click', () => show(selected + 1));
    select.addEventListener('change', () => show(Number(select.value)));
    media.addEventListener('pointerdown', event => {
      if (!activeVideo && event.pointerType === 'touch' && event.isPrimary) {
        touchStart = {x: event.clientX, y: event.clientY};
      }
    });
    media.addEventListener('pointercancel', () => { touchStart = null; });
    media.addEventListener('pointerup', event => {
      if (!touchStart || event.pointerType !== 'touch') return;
      const dx = event.clientX - touchStart.x;
      const dy = event.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        show(selected + (dx < 0 ? 1 : -1));
      }
    });
    request.addEventListener('click', () => {
      const work = works[selected];
      window.dispatchEvent(new CustomEvent('studio:quote', {
        detail: {model: work.model || '', service: work.title || work.model}
      }));
    });
    show(0);
  }

  Promise.resolve(window.STUDIO_READY ?? true).then(ready => { if (ready) mount(); });
})();
