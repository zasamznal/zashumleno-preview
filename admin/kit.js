(() => {
  'use strict';

  // Small building blocks shared by the newer cabinet screens.
  let counter = 0;
  const uid = prefix => (prefix || 'k') + '-' + (++counter);

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function button(label, onClick, variant = '') {
    const node = el('button', 'k-btn ' + variant, label);
    node.type = 'button';
    node.addEventListener('click', onClick);
    return node;
  }

  function card(parent, title, note, className = '') {
    const box = el('section', 'k-card ' + className);
    const head = el('div', 'k-card-head');
    head.append(el('h2', '', title));
    if (note) head.append(el('p', 'k-note', note));
    box.append(head);
    const body = el('div', 'k-card-body');
    box.append(body);
    parent.append(box);
    return body;
  }

  function wrap(parent, label, control, options = {}) {
    const box = el('div', 'k-field' + (options.wide ? ' k-wide' : '') + (options.className ? ' ' + options.className : ''));
    const id = control.id || (control.id = uid('field'));
    const name = el('label', '', label);
    name.htmlFor = id;
    box.append(name);
    if (options.inline) {
      const row = el('div', 'k-inline');
      row.append(control, ...(options.inline || []));
      box.append(row);
    } else box.append(control);
    if (options.note) {
      const note = el('small', 'k-note', options.note);
      note.id = id + '-note';
      control.setAttribute('aria-describedby', note.id);
      box.append(note);
    }
    parent.append(box);
    return box;
  }

  function text(ctx, parent, target, key, label, options = {}) {
    const control = el(options.lines ? 'textarea' : 'input');
    if (options.lines) control.rows = options.lines; else control.type = options.type || 'text';
    control.value = target[key] ?? '';
    if (options.placeholder) control.placeholder = options.placeholder;
    control.maxLength = options.max || (options.lines ? 3000 : 300);
    control.addEventListener('input', () => {
      target[key] = options.parse ? options.parse(control.value) : control.value;
      ctx.change();
      options.onInput?.(control.value);
    });
    wrap(parent, label, control, options);
    return control;
  }

  function number(ctx, parent, target, key, label, options = {}) {
    const control = el('input', 'k-number');
    control.type = 'text';
    control.inputMode = 'decimal';
    control.autocomplete = 'off';
    const empty = options.allowEmpty && (target[key] === undefined || target[key] === null || target[key] === '');
    control.value = empty ? '' : String(target[key] ?? 0).replace('.', ',');
    if (options.placeholder != null) control.placeholder = String(options.placeholder).replace('.', ',');
    const suffix = el('span', 'k-suffix', options.suffix || '');
    control.addEventListener('input', () => {
      const raw = control.value.trim().replace(',', '.').replace(/[^\d.+-]/g, '');
      if (raw === '' && options.allowEmpty) delete target[key];
      else {
        const value = Number(raw);
        if (!Number.isFinite(value)) return;
        const min = options.min ?? -Infinity;
        const max = options.max ?? Infinity;
        target[key] = Math.max(min, Math.min(max, Math.round(value * 10) / 10));
      }
      ctx.change();
      options.onInput?.();
    });
    control.addEventListener('blur', () => {
      if (control.value.trim() === '' && options.allowEmpty) return;
      control.value = String(target[key] ?? 0).replace('.', ',');
    });
    wrap(parent, label, control, { ...options, inline: options.suffix ? [suffix] : undefined });
    return control;
  }

  function select(ctx, parent, target, key, label, choices, options = {}) {
    const control = el('select');
    for (const [value, title] of choices) control.append(new Option(title, value));
    control.value = target[key] ?? choices[0]?.[0] ?? '';
    control.addEventListener('change', () => {
      target[key] = control.value;
      ctx.change();
      options.onInput?.(control.value);
    });
    wrap(parent, label, control, options);
    return control;
  }

  // «#BCB9D9», «BCB9D9» and, when asked, the short «#ABC»; anything else is not a colour.
  function hexColor(text, short = false) {
    let value = String(text ?? '').trim();
    if (/^(?:[0-9a-f]{6}|[0-9a-f]{3})$/i.test(value)) value = '#' + value;
    if (short && /^#[0-9a-f]{3}$/i.test(value)) value = '#' + value.slice(1).replace(/./g, '$&$&');
    return /^#[0-9a-f]{6}$/i.test(value) ? value : '';
  }

  // The same rule as on the server: a file of the site or an https address.
  function validLink(value) {
    if (!value) return true;
    if (typeof value !== 'string' || value.trim() !== value || /[\\\x00-\x1f\x7f]/.test(value) || value.startsWith('//')) return false;
    if (/^\/?(?:assets|sheets|media|v2\/media)\//.test(value)) {
      try {
        const path = decodeURIComponent(value.split(/[?#]/)[0]);
        return !path.includes('\\') && !path.split('/').includes('..');
      } catch { return false; }
    }
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch { return false; }
  }

  function color(ctx, parent, target, key, label, options = {}) {
    const picker = el('input', 'k-color');
    picker.type = 'color';
    const hex = el('input', 'k-hex');
    hex.type = 'text';
    hex.maxLength = 12;
    hex.spellcheck = false;
    hex.autocomplete = 'off';
    hex.setAttribute('aria-label', label + ' — код HEX');
    const problem = el('small', 'k-field-error');
    problem.setAttribute('role', 'status');
    const set = (value, from) => {
      target[key] = value.toLowerCase();
      if (from !== picker) picker.value = value;
      if (from !== hex) hex.value = value.toUpperCase();
      ctx.change();
      options.onInput?.(value);
    };
    picker.value = /^#[0-9a-f]{6}$/i.test(target[key] || '') ? target[key] : '#000000';
    hex.value = (target[key] || '').toUpperCase();
    picker.addEventListener('input', () => set(picker.value, picker));
    hex.addEventListener('input', () => {
      const value = hexColor(hex.value);
      problem.textContent = '';
      if (value) set(value, hex);
    });
    // The three-digit form counts only when the field is left: while typing it is the start of a longer code.
    hex.addEventListener('blur', () => {
      const typed = hex.value.trim();
      const value = hexColor(typed, true);
      if (value && value.toLowerCase() !== target[key]) set(value, hex);
      problem.textContent = typed && !value ? 'Код «' + typed + '» не похож на цвет — оставили прежний. Нужны 6 знаков, например #BCB9D9.' : '';
      hex.value = (target[key] || '').toUpperCase();
    });
    const box = wrap(parent, label, picker, { ...options, inline: [hex] });
    box.classList.add('k-color-field');
    box.append(problem);
    return { picker, hex, update(value) { picker.value = value; hex.value = value.toUpperCase(); problem.textContent = ''; } };
  }

  function check(ctx, parent, target, key, label, options = {}) {
    const box = el('label', 'k-check');
    const input = el('input');
    input.type = 'checkbox';
    input.checked = options.defaultValue !== undefined && target[key] === undefined ? options.defaultValue : Boolean(target[key]);
    input.addEventListener('change', () => {
      target[key] = input.checked;
      ctx.change();
      options.onInput?.(input.checked);
    });
    box.append(input, el('span', '', label));
    if (options.note) box.append(el('small', 'k-note', options.note));
    parent.append(box);
    return input;
  }

  function mediaUrl(value) {
    return window.StudioPage?.mediaUrl(value) || '';
  }

  function acceptsFile(file, accept) {
    const formats = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
      heic: 'image/heic', heif: 'image/heif', mp4: 'video/mp4', pdf: 'application/pdf', zip: 'application/zip' };
    const extension = file.name.split('.').pop().toLowerCase();
    const mime = file.type === 'application/x-zip-compressed' ? 'application/zip' : file.type || formats[extension];
    return accept.split(',').includes(mime);
  }

  // Address of the site's home: files such as «sheets/…» are relative to it (the demo copy lives in a subfolder).
  function siteRoot() {
    return new URL(document.querySelector('.a-top-link')?.getAttribute('href') ?? '/', document.baseURI);
  }

  function previewOf(url, kind) {
    if (!url) {
      const empty = el('span', 'k-media-empty', kind === 'video' ? 'Видео не выбрано' : 'Нет файла');
      return empty;
    }
    const absolute = new URL(url, siteRoot()).href;
    if (kind === 'video') {
      const video = el('video');
      video.src = absolute;
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.controls = true;
      return video;
    }
    if (kind === 'file') {
      let name = new URL(absolute).pathname.split('/').pop() || 'файл';
      try { name = decodeURIComponent(name); } catch { /* A file name may contain a literal percent sign. */ }
      const link = el('a', 'k-file-link');
      link.href = absolute; link.target = '_blank'; link.rel = 'noopener';
      link.title = 'Открыть: ' + name;
      // A price sheet saved as a picture is shown as a thumbnail; PDF and ZIP keep their name.
      if (/\.(?:jpe?g|png|webp)$/i.test(name)) {
        const thumb = el('img');
        thumb.src = absolute;
        thumb.alt = '';
        thumb.loading = 'lazy';
        link.classList.add('k-file-thumb');
        link.append(thumb);
      } else link.textContent = name;
      return link;
    }
    const image = el('img');
    image.src = absolute;
    image.alt = '';
    image.loading = 'lazy';
    return image;
  }

  // A media slot: preview, «Заменить», optional «Убрать» and a field for a direct link.
  function media(ctx, parent, target, key, label, options = {}) {
    const kind = options.kind || 'image';
    const box = el('div', 'k-media' + (options.compact ? ' k-media-compact' : '') + (options.contain ? ' k-media-contain' : ''));
    const preview = el('div', 'k-media-preview');
    const info = el('div', 'k-media-info');
    info.append(el('strong', '', label));
    if (options.note) info.append(el('small', 'k-note', options.note));
    const status = el('small', 'k-media-status');
    status.setAttribute('role', 'status');
    const say = (message, failed = false) => { status.textContent = message; status.dataset.state = failed ? 'error' : ''; };
    const input = el('input', 'k-file');
    input.type = 'file';
    input.tabIndex = -1;
    input.setAttribute('aria-label', 'Файл: ' + label);
    input.accept = kind === 'video' ? 'video/mp4,.mp4' : kind === 'file' ? (options.accept || 'application/pdf,application/zip,image/jpeg,image/png,image/webp')
      : 'image/jpeg,image/png,image/webp,image/heic,image/heif';
    const pick = button(target[key] ? 'Заменить' : 'Загрузить', () => input.click(), 'k-primary');
    const tools = el('div', 'k-media-tools');
    tools.append(pick);
    if (options.removable !== false) {
      tools.append(button('Убрать', () => {
        // The file cannot be put back with one click, so a stray tap must not remove it.
        if (!window.confirm('Убрать файл из поля «' + label + '»? После публикации он пропадёт с сайта.')) return;
        target[key] = '';
        ctx.change();
        draw();
        say('');
        options.onInput?.('');
      }, 'k-ghost'));
    }
    if (options.reset) {
      tools.append(button('Как было', () => {
        target[key] = options.reset;
        ctx.change();
        draw();
        say('');
        options.onInput?.(options.reset);
      }, 'k-ghost'));
    }
    const link = el('details', 'k-media-link');
    link.append(el('summary', '', 'Указать ссылку вручную'));
    const linkInput = el('input');
    linkInput.type = 'text';
    linkInput.placeholder = 'https://… или путь к файлу на сайте';
    linkInput.value = target[key] || '';
    linkInput.addEventListener('change', () => {
      const address = linkInput.value.trim();
      // A wrong address would stop the whole draft from being saved: it is refused here, next to the field.
      if (!validLink(address)) {
        say('Ссылка не подходит: нужен адрес, который начинается с https://, или загрузите файл кнопкой «' + pick.textContent + '».', true);
        linkInput.value = target[key] || '';
        return;
      }
      target[key] = address;
      ctx.change();
      draw();
      say('');
      options.onInput?.(target[key]);
    });
    linkInput.setAttribute('aria-label', label + ' — ссылка');
    link.append(linkInput);
    info.append(tools, status, link);
    box.append(preview, info, input);
    function draw() {
      preview.replaceChildren(previewOf(mediaUrl(target[key]), kind));
      pick.textContent = target[key] ? 'Заменить' : 'Загрузить';
      linkInput.value = target[key] || '';
      const removeButton = tools.querySelector('.k-ghost');
      if (removeButton && options.removable !== false) removeButton.hidden = !target[key];
    }
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!acceptsFile(file, input.accept)) {
        const wanted = kind === 'video' ? 'видео MP4 (ролик MOV с айфона сначала сохраните как MP4)'
          : kind !== 'file' ? 'фото JPG, PNG или WebP'
            : 'файл ' + [['pdf', 'PDF'], ['zip', 'ZIP'], ['jpeg', 'JPG'], ['png', 'PNG'], ['webp', 'WebP']].filter(([type]) => input.accept.includes(type)).map(([, name]) => name).join(', ');
        say('Файл «' + file.name + '» не подходит: сюда можно загрузить только ' + wanted + '.', true);
        input.value = '';
        return;
      }
      pick.disabled = true;
      say('Загружаем «' + file.name + '»…');
      try {
        const url = await ctx.upload(file);
        target[key] = url;
        ctx.change();
        draw();
        say('Готово: файл загружен.');
        options.onInput?.(url);
      } catch (error) {
        say(error.message || 'Не удалось загрузить файл.', true);
      } finally {
        pick.disabled = false;
        input.value = '';
      }
    });
    draw();
    parent.append(box);
    return { element: box, redraw: draw };
  }

  function move(list, from, to) {
    if (to < 0 || to >= list.length) return false;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    return true;
  }

  function contrast(a, b) {
    const lum = hex => {
      const values = hex.replace('#', '').match(/.{2}/g).map(part => parseInt(part, 16) / 255)
        .map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
      return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
    };
    try {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + .05) / (y + .05);
    } catch { return 21; }
  }

  window.StudioKit = { el, button, card, wrap, text, number, select, color, check, media, mediaUrl, acceptsFile, previewOf, siteRoot, move, uid, contrast, hexColor, validLink };
})();
