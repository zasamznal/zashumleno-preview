(() => {
  'use strict';

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function anchor(label, href, className) {
    const el = element('a', className, label);
    el.href = href;
    if (href.startsWith('https:')) {
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    }
    return el;
  }

  function filmCard(videoUrl, posterUrl, caption) {
    const button = element('button', 'visit-film');
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'visit-film-dialog');
    button.setAttribute('aria-label', 'Смотреть видео — ' + caption);
    if (posterUrl) {
      const img = element('img', 'visit-still');
      img.src = posterUrl;
      img.alt = '';
      img.loading = 'lazy';
      button.append(img);
    }
    const bottom = element('span', 'visit-film-caption');
    const play = element('span', 'visit-play');
    play.setAttribute('aria-hidden', 'true');
    const time = element('span', 'visit-time');
    if (videoUrl.replace(/^\//, '') === 'assets/studio-film.mp4') time.textContent = '0:42';
    bottom.append(play, element('span', 'visit-film-title', caption), time);
    button.append(bottom);

    const dialog = element('dialog', 'visit-dialog');
    dialog.id = 'visit-film-dialog';
    dialog.setAttribute('aria-labelledby', 'visit-film-title');
    const top = element('div', 'visit-dialog-top');
    const title = element('h3', '', caption);
    title.id = 'visit-film-title';
    const close = element('button', 'visit-close', 'Закрыть');
    close.type = 'button';
    close.autofocus = true;
    top.append(title, close);

    const video = element('video', 'visit-player');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'none';
    video.dataset.routeVideo = '';
    video.setAttribute('aria-label', caption);
    if (posterUrl) video.poster = posterUrl;
    const fileLink = anchor('Открыть видео отдельным файлом', videoUrl, 'visit-video-file');
    fileLink.target = '_blank';
    fileLink.rel = 'noopener noreferrer';
    fileLink.hidden = true;
    dialog.append(top, video, fileLink);

    let origin = button;
    function open(time, from) {
      origin = from || button;
      if (!video.hasAttribute('src')) video.src = videoUrl;
      if (typeof dialog.showModal !== 'function') {
        fileLink.click();
        return;
      }
      if (!dialog.open) dialog.showModal();
      document.documentElement.classList.add('visit-dialog-open');
      const start = Number(time);
      if (Number.isFinite(start) && start > 0) {
        // The arrival steps open the video at their own moment.
        const seek = () => { try { video.currentTime = Math.min(start, (video.duration || start + 1) - .5); } catch { /* Seeking is optional. */ } };
        if (video.readyState >= 1) seek(); else video.addEventListener('loadedmetadata', seek, { once: true });
      }
      video.play().catch(() => {
        if (video.error) fileLink.hidden = false;
      });
    }
    button.addEventListener('click', () => open(0, button));
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      video.pause();
      document.documentElement.classList.remove('visit-dialog-open');
      if (origin?.isConnected) origin.focus({ preventScroll: true });
    });
    video.addEventListener('error', () => { fileLink.hidden = false; });
    video.addEventListener('loadedmetadata', () => {
      fileLink.hidden = true;
      if (!Number.isFinite(video.duration)) return;
      const seconds = Math.round(video.duration);
      time.textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    });
    return { button, dialog, play: open };
  }

  async function mount() {
    if (!await window.STUDIO_READY) return;
    const host = document.querySelector('#studio [data-visit]');
    const reader = window.StudioPage;
    if (!host || !reader?.current) return;
    const { sections, contacts, legal } = reader.current;
    const section = sections.find(item => item.id === 'studio');
    if (!section || !section.enabled) return;

    const info = element('div', 'visit-info');
    if (section.kicker) info.append(element('p', 'visit-kicker', section.kicker));
    const heading = element('h2', 'visit-title', section.title);
    heading.id = 'visit-heading';
    host.closest('section').setAttribute('aria-labelledby', heading.id);
    info.append(heading);
    if (section.description) info.append(element('p', 'visit-desc', section.description));

    const address = element('address', 'visit-address');
    if (contacts.address) {
      const street = element('strong', '', contacts.address);
      street.dataset.address = '';
      address.append(street);
    }
    if (contacts.entrance) {
      const hint = element('span', '', contacts.entrance);
      hint.dataset.entrance = '';
      address.append(hint);
    }
    if (contacts.metro) {
      const metro = element('span', 'visit-metro', contacts.metro);
      metro.dataset.metro = '';
      address.append(metro);
    }
    if (address.children.length) info.append(address);

    const details = element('dl', 'visit-details');
    const makeRow = (label, value) => {
      const row = element('div');
      row.append(element('dt', '', label), element('dd'));
      row.lastElementChild.append(value);
      details.append(row);
    };
    if (legal.hours) {
      const hours = element('span', '', legal.hours);
      hours.dataset.hours = '';
      makeRow('Часы работы', hours);
    }
    const tel = (contacts.phone || '').replace(/[^\d+]/g, '');
    if (/^\+?\d{7,15}$/.test(tel)) {
      const phone = anchor(contacts.phone, 'tel:' + tel, 'visit-phone');
      phone.dataset.phone = '';
      makeRow('Телефон', phone);
    }
    if (details.childElementCount) info.append(details);

    const actions = element('div', 'visit-actions');
    const map = reader.contactUrl('map', contacts.map);
    const telegram = reader.contactUrl('telegram', contacts.telegram);
    if (map) {
      const mapLink = anchor('Построить маршрут', map, 'visit-map');
      mapLink.dataset.map = '';
      actions.append(mapLink);
    }
    if (telegram) actions.append(anchor('Написать в Telegram', telegram, 'visit-chat'));
    if (actions.childElementCount) info.append(actions);
    host.replaceChildren(info);

    const videoUrl = reader.mediaUrl(contacts.routeVideo);
    const film = videoUrl ? filmCard(videoUrl, reader.mediaUrl(contacts.routePoster), contacts.routeCaption || 'Видео проезда') : null;
    const routeMap = window.StudioArrivalMap?.create(contacts, {
      steps: reader.current.route,
      video: film ? time => film.play(time, document.activeElement) : null
    });
    const media = routeMap ? element('div', 'visit-route') : host;
    if (routeMap) {
      media.append(routeMap);
      host.append(media);
    }
    if (film) {
      media.append(film.button);
      host.append(film.dialog);
    }
  }

  mount();
})();
