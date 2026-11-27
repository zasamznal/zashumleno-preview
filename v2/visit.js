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

  // The only timetable the site reads: one interval for every day — «Ежедневно 11:00–20:00», «Ежедневно с 11 до 20».
  // Days of the week, a break, a second interval or «по записи» stay plain text: nothing is guessed, no status is shown.
  function dailyHours(text) {
    const plain = String(text || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ')
      .replace(/\(? ?(?:время московское|московское время|по московскому времени|по москве|мск|msk) ?\)?/, ' ')
      .replace(/без (?:выходных|перерыва|перерывов|обеда)(?: и (?:выходных|перерыва|перерывов|обеда))?/, ' ');
    const time = '(\\d{1,2})(?:[:.](\\d{2}))?';
    const match = new RegExp('^[ ,.;:]*ежедневно[ ,.;:—–−-]*(?:с )?' + time + ' ?(?:[—–−-]|до) ?' + time + '(?: ?час(?:а|ов)?)?[ ,.;]*$').exec(plain);
    if (!match) return null;
    const [h1, m1, h2, m2] = match.slice(1).map(part => Number(part || 0));
    const from = h1 * 60 + m1;
    const to = h2 * 60 + m2;
    // 24:00 is a closing time only; an interval that starts and ends at the same minute says nothing.
    if (m1 > 59 || m2 > 59 || from >= 1440 || to > 1440 || from === to) return null;
    const clock = (hour, minute) => String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
    return { from, to, opens: clock(h1, m1), closes: clock(h2, m2) };
  }

  // The studio keeps Moscow time whatever the visitor's own clock shows.
  let moscowClock;
  function moscowMinutes(date) {
    try {
      moscowClock ||= new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
      const parts = moscowClock.formatToParts(date);
      const part = type => Number(parts.find(item => item.type === type).value);
      return part('hour') % 24 * 60 + part('minute');
    } catch {
      // No time zone data: Moscow has been UTC+3 all year round since 2014.
      return (date.getUTCHours() * 60 + date.getUTCMinutes() + 180) % 1440;
    }
  }

  // The state by the timetable at a moment: open till the closing time, or closed till the next opening.
  // Holidays are unknown to the site, so this is what the timetable says and nothing more.
  function openStatus(text, now = new Date()) {
    const hours = dailyHours(text);
    if (!hours || typeof now?.getTime !== 'function' || Number.isNaN(now.getTime())) return null;
    const minute = moscowMinutes(now);
    const to = hours.to || 1440;
    const night = to < hours.from;
    const open = night ? minute >= hours.from || minute < to : minute >= hours.from && minute < to;
    return { open, allDay: hours.from === 0 && to === 1440, time: open ? hours.closes : hours.opens, tomorrow: !open && !night && minute >= to };
  }

  // [state, detail]. «мск» is added for a visitor whose own clock differs from the studio's.
  function statusWords(status, abroad = false) {
    const time = status.time + (abroad ? ' мск' : '');
    return status.open ? ['Сейчас открыто', status.allDay ? 'круглосуточно' : 'до ' + time]
      : ['Сейчас закрыто', 'откроемся ' + (status.tomorrow ? 'завтра ' : '') + 'в ' + time];
  }

  const statusNote = 'По расписанию студии, время московское. В праздничные дни часы работы могут отличаться — уточните в студии.';

  // «Сейчас открыто · до 20:00» under the working hours. The words carry the state, the dot only repeats it.
  function openBadge(reader) {
    const box = element('span', 'visit-open');
    box.dataset.openStatus = '';
    box.title = statusNote;
    const dot = element('span', 'visit-open-dot');
    dot.setAttribute('aria-hidden', 'true');
    const words = element('span', 'visit-open-words');
    const state = element('strong');
    const detail = element('span');
    words.append(state, ' ', detail);
    box.append(dot, words, element('span', 'visually-hidden', ' — ' + statusNote.charAt(0).toLowerCase() + statusNote.slice(1)));

    let timer = 0;
    function refresh() {
      const now = new Date();
      const page = reader.current;
      const status = page.contacts.openStatus === false ? null : openStatus(page.legal.hours, now);
      box.hidden = !status;
      if (!status) return;
      const [name, note] = statusWords(status, now.getHours() * 60 + now.getMinutes() !== moscowMinutes(now));
      if (state.textContent !== name) state.textContent = name;
      if (detail.textContent !== note) detail.textContent = note;
      box.dataset.state = status.open ? 'open' : 'closed';
    }
    // Once a minute while the tab is visible; a hidden tab catches up when the visitor returns.
    function tick() {
      clearTimeout(timer);
      refresh();
      if (!document.hidden) timer = setTimeout(tick, 60000 - Date.now() % 60000 + 300);
    }
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('pageshow', tick);
    tick();
    return box;
  }

  // Places where the studio posts its works. Every link says what a visitor finds there.
  const social = [
    { key: 'telegramChannel', name: 'Telegram-канал', about: 'новости и работы',
      glyph: 'M20.7 3.8 3.4 10.5c-1.2.5-1.2 1.2-.2 1.5l4.4 1.4 1.6 4.9c.2.6.4.8.8.8.3 0 .6-.1.9-.4l2.2-2.1 4.4 3.2c.8.5 1.3.2 1.5-.8l2.9-14c.2-1-.2-1.6-1.2-1.2ZM9 13.1l9.6-6.3c.4-.3.7-.1.4.2l-7.9 7.2-.4 2.7L9 13.1Z' },
    { key: 'youtube', name: 'YouTube', about: 'короткие видео',
      glyph: 'M5.5 5h13A3.5 3.5 0 0 1 22 8.5v7a3.5 3.5 0 0 1-3.5 3.5h-13A3.5 3.5 0 0 1 2 15.5v-7A3.5 3.5 0 0 1 5.5 5Zm4.3 3.9v6.2l5.6-3.1-5.6-3.1Z' },
    { key: 'vk', name: 'ВКонтакте', about: 'видео работ', mark: 'VK' }
  ];

  function socialLinks(reader, contacts) {
    const links = social.map(item => ({ ...item, url: reader.contactUrl(item.key, contacts[item.key]) })).filter(item => item.url);
    if (!links.length) return null;
    const box = element('div', 'visit-social');
    const title = element('h3', 'visit-social-title', 'Мы в социальных сетях');
    title.id = 'visit-social-title';
    const list = element('ul', 'visit-social-list');
    list.setAttribute('aria-labelledby', title.id);
    list.dataset.links = links.length;
    for (const item of links) {
      const link = anchor('', item.url, 'visit-social-link');
      const icon = element('span', 'visit-social-icon', item.mark);
      icon.setAttribute('aria-hidden', 'true');
      if (item.glyph) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        const path = document.createElementNS(svg.namespaceURI, 'path');
        path.setAttribute('d', item.glyph);
        svg.append(path);
        icon.append(svg);
      }
      const text = element('span', 'visit-social-text');
      text.append(element('strong', '', item.name), element('span', '', item.about));
      link.append(icon, text);
      const row = element('li');
      row.append(link);
      list.append(row);
    }
    box.append(title, list);
    return box;
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
    let requestedStart = 0;
    function seekToStart() {
      const end = Number.isFinite(video.duration) ? Math.max(0, video.duration - .5) : requestedStart;
      try {
        video.currentTime = Math.min(requestedStart, end);
      } catch { /* A non-seekable source can still play from its current position. */ }
    }
    function open(time, from) {
      origin = from || button;
      requestedStart = Number.isFinite(time) ? Math.max(0, time) : 0;
      if (!video.hasAttribute('src')) video.src = videoUrl;
      if (typeof dialog.showModal !== 'function') {
        fileLink.click();
        return;
      }
      if (!dialog.open) dialog.showModal();
      document.documentElement.classList.add('visit-dialog-open');
      if (video.readyState >= 1) seekToStart();
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
      if (dialog.open) seekToStart();
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
      return row.lastElementChild;
    };
    if (legal.hours) {
      const hours = element('span', '', legal.hours);
      hours.dataset.hours = '';
      const cell = makeRow('Часы работы', hours);
      if (contacts.openStatus !== false) cell.append(openBadge(reader));
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
    const follow = socialLinks(reader, contacts);
    if (follow) info.append(follow);
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

  window.StudioVisit = { dailyHours, openStatus, statusWords };
  mount();
})();
