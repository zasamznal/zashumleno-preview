(() => {
  'use strict';

  const defaults = {
    designVersion: 3,
    brand: {
      name: 'ЗАШУМЛЕНО', logo: 'assets/mark.svg', siteTitle: 'Зашумлено — шумоизоляция и автозвук в Москве',
      description: 'Московская автостудия «Зашумлено». Подробный прайс шумоизоляции по зонам, примеры работ с автомобилями и консультация Никиты.',
      telegramLabel: 'Написать в Telegram', accent: '#70e3dd', darkAccent: '#006c67'
    },
    hero: {
      kicker: 'Автомобильная студия', city: 'Москва', title: 'Тишина\nв движении.',
      description: 'Шумоизоляция, автозвук и дооснащение. Подберите работы для своей машины и узнайте стоимость по прайсу студии.',
      image: 'v2/media/hero-coupe-teal.webp', primaryLabel: 'Рассчитать стоимость', secondaryLabel: 'Смотреть работы'
    },
    sections: [
      { id: 'calculator', enabled: true, kicker: 'Калькулятор', title: 'Рассчитайте шумоизоляцию', description: 'Выберите зону и комплект. Стоимость выбранных работ появится в смете.', navLabel: 'Калькулятор' },
      { id: 'layers', enabled: true, kicker: 'Материалы', title: 'Что внутри двери', description: 'Посмотрите, какую задачу решает каждый слой между металлом кузова и обшивкой.', navLabel: '' },
      { id: 'works', enabled: true, kicker: 'Проекты студии', title: 'Машины в работе', description: '', navLabel: 'Работы' },
      { id: 'prices', enabled: true, kicker: 'Стоимость работ', title: 'Прайс по зонам', description: 'Сравните комплекты по цене, материалам и весу. Все условия и оригинальные листы студии собраны здесь.', navLabel: 'Прайс' },
      { id: 'services', enabled: true, kicker: 'Услуги студии', title: 'Звук, салон и кузов', description: 'Стоимость зависит от модели автомобиля и комплектации.', navLabel: '' },
      { id: 'request', enabled: true, kicker: 'Связь со студией', title: 'Обсудим вашу машину', description: 'Укажите модель и интересующие работы. Никита поможет подобрать комплект и согласовать дату.', navLabel: '' },
      { id: 'studio', enabled: true, kicker: 'Контакты', title: 'Приезжайте в студию', description: '', navLabel: 'Контакты' }
    ],
    services: [
      { title: 'Автозвук', description: 'Замена динамиков и установка усилителей. Подбор компонентов под вашу аудиосистему.', image: 'v2/media/service-audio.webp', alt: 'Перфорированная решётка дверного динамика', action: 'Обсудить автозвук' },
      { title: 'Оснащение салона', description: 'Контурная подсветка, доводчики дверей, видеорегистраторы и камеры заднего вида.', image: 'v2/media/service-interior.webp', alt: 'Контурная подсветка дверной карты', action: 'Подобрать оснащение' },
      { title: 'Кузов и стёкла', description: 'Полиуретановая бронеплёнка, полировка и керамика. Тонировка и атермальная плёнка.', image: 'v2/media/service-film.webp', alt: 'Нанесение защитной плёнки на крыло автомобиля', action: 'Обсудить покрытие' }
    ],
    contacts: {
      phone: '+7 910 005-77-05', telegram: 'https://t.me/Zashumleno', telegramChannel: 'https://t.me/ZaShumlenoAvto',
      vk: 'https://vk.com/arkanin', map: 'https://yandex.ru/maps/-/CPvAZGoj',
      address: 'Москва, Варшавское шоссе, 152А', entrance: 'Подземный паркинг, этаж −1.', shortAddress: 'Варшавское шоссе, 152А',
      person: 'Никита', role: 'руководитель студии', routeVideo: 'assets/studio-film.mp4', routePoster: 'assets/studio-film.webp',
      routeCaption: 'Видео проезда'
    },
    priceArchive: '', hidePriceArchive: false,
    legal: {
      name: 'ИП Шабалин Никита Ильич', roleLabel: 'Предприниматель — руководитель студии', inn: '773715440908',
      registrationNumber: '324710000077721', registrationDate: '02.12.2024',
      registeringAuthority: 'Управление Федеральной налоговой службы по Тульской области', legalAddress: '', email: '',
      registryEmail: 'arkanin5x5@gmail.com', sourceUrl: 'https://egrul.nalog.ru/index.html', hours: 'Ежедневно 11:00–20:00, московское время',
      hoursSourceUrl: 'https://yandex.ru/maps/org/zashumleno/61005116584/',
      payment: '', timing: '', warranty: '', policyText: '', siteOwnerName: '', siteOwnerAddress: '', siteOwnerEmail: ''
    }
  };
  const keys = defaults.sections.map(section => section.id);
  const serviceTemplate = { title: '', description: '', image: '', alt: '', action: '' };

  function fields(value, template) {
    const record = {};
    for (const [key, fallback] of Object.entries(template)) {
      record[key] = typeof value?.[key] === typeof fallback ? value[key] : fallback;
    }
    return record;
  }

  function mediaUrl(value) {
    const path = typeof value === 'string' ? value.trim() : '';
    if (!path || /[\\\u0000-\u001f\u007f]/.test(path)) return '';
    if (/^\/?(?:assets|media|sheets|v2\/media)\/[\w./%~+() -]+$/i.test(path) && !/(?:^|\/)(?:\.|%2e){1,2}(?:\/|$)|%(?:2f|5c|00)/i.test(path)) return path.replace(/^\//, '');
    try {
      const url = new URL(path);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  }

  function contactUrl(type, value) {
    let address = typeof value === 'string' ? value.trim() : '';
    if (!address || /[\\\u0000-\u001f\u007f]/.test(address)) return '';
    if ((type === 'telegram' || type === 'telegramChannel') && /^@?[a-z][a-z\d_]{3,31}$/i.test(address)) {
      address = 'https://t.me/' + address.replace(/^@/, '');
    }
    try {
      const url = new URL(address);
      if (url.protocol !== 'https:' || url.username || url.password || url.port) return '';
      if (type === 'telegram' || type === 'telegramChannel') {
        if (!['t.me', 'telegram.me'].includes(url.hostname) || !/^\/[a-z][a-z\d_]{3,31}\/?$/i.test(url.pathname)) return '';
        return 'https://t.me/' + url.pathname.split('/')[1];
      }
      const hosts = type === 'vk' ? ['vk.com', 'vk.ru', 'www.vk.com', 'www.vk.ru'] :
        ['yandex.ru', 'yandex.com', 'maps.yandex.ru', 'yandex.by', 'yandex.kz', '2gis.ru', 'go.2gis.com', 'yandex.eu'];
      return hosts.includes(url.hostname) ? url.href : '';
    } catch { return ''; }
  }

  function phoneHref(value) {
    const raw = value.trim();
    if (!/^\+?[\d ()−–.-]+$/.test(raw)) return '';
    const number = raw.replace(/[^\d+]/g, '');
    return /^\+?\d{7,15}$/.test(number) ? 'tel:' + number : '';
  }

  // These exact v1 defaults were written into saved CMS snapshots. Custom values stay intact.
  const previous = {
    "brand": {
      "logo": "assets/mark.svg",
      "accent": "#70e3dd",
      "darkAccent": "#006c67"
    },
    "hero": {
      "kicker": "Автостудия",
      "title": "ТИШЕ ДОРОГА.\nЧИЩЕ ЗВУК.",
      "description": "Шумоизоляция, автозвук и дооснащение автомобиля. Выберите зону и сравните стоимость работ в нашем прайсе.",
      "image": "assets/studio-hero.webp",
      "secondaryLabel": "Весь прайс"
    },
    "services": [
      "assets/speaker.webp",
      "assets/ambient.webp",
      "assets/bodywork.webp"
    ],
    "sections": {
      "calculator": {
        "kicker": "Калькулятор шумоизоляции",
        "title": "Соберите свой комплект.",
        "description": "Выберите зоны на схеме автомобиля. Добавляйте работы в смету и сравнивайте комплекты по прайсу студии."
      },
      "prices": {
        "kicker": "Шумоизоляция",
        "title": "Прайс студии.",
        "description": "Сравните стоимость и состав комплектов. Раскройте тариф, чтобы посмотреть материалы, вес и условия работы."
      },
      "services": {
        "kicker": "Услуги",
        "title": "Ещё для вашего авто.",
        "description": "Стоимость этих работ зависит от машины и комплектации. Выберите направление, чтобы обсудить его с Никитой.",
        "navLabel": "Услуги"
      },
      "works": {
        "kicker": "Из мастерской",
        "title": "Наши работы.",
        "navLabel": "Наши работы"
      },
      "request": {
        "kicker": "Консультация",
        "title": "Что за машина?",
        "description": "Укажите модель и выберите работу. Никита уточнит комплектацию, стоимость и свободные даты в Telegram."
      },
      "studio": {
        "title": "Заехать в студию."
      }
    }
  };
  const legacyOrder = ['calculator', 'prices', 'services', 'works', 'request', 'studio'];
  function migrateRecord(value, legacy, current) {
    const result = { ...value };
    for (const [key, before] of Object.entries(legacy || {})) {
      if (result[key] === before) result[key] = current[key];
    }
    return result;
  }

  function readPage(value) {
    if (!value || value.designVersion >= defaults.designVersion) return value || {};
    if (value.designVersion === 2) {
      return {
        ...value,
        brand: migrateRecord(value.brand, { logo: '', accent: '#e1372c', darkAccent: '#a71f18' }, defaults.brand),
        hero: migrateRecord(value.hero, { image: 'v2/media/hero-coupe.webp' }, defaults.hero)
      };
    }
    const page = { ...value, brand: migrateRecord(value.brand, previous.brand, defaults.brand),
      hero: migrateRecord(value.hero, previous.hero, defaults.hero) };
    if (Array.isArray(value.services)) page.services = value.services.map(item => {
      const i = previous.services.indexOf(item?.image);
      return i >= 0 ? { ...item, image: defaults.services[i].image } : item;
    });
    if (Array.isArray(value.sections)) {
      const oldOrder = value.sections.map(s => s?.id).join(',');
      page.sections = value.sections.filter(s => keys.includes(s?.id)).map(s => {
        const base = defaults.sections.find(section => section.id === s.id);
        return migrateRecord(s, previous.sections[s.id], base);
      });
      if (oldOrder === legacyOrder.join(',')) {
        const byId = new Map(page.sections.map(s => [s.id,s]));
        page.sections = defaults.sections.map(s => byId.get(s.id) || s);
      } else if (!page.sections.some(s => s.id === 'layers')) {
        const index = page.sections.findIndex(s => s.id === 'calculator');
        page.sections.splice(index + 1, 0, defaults.sections.find(s => s.id === 'layers'));
      }
    }
    return page;
  }

  function normalize(input = {}) {
    const value = readPage(input);
    const result = {
      designVersion: defaults.designVersion,
      brand: fields(value?.brand, defaults.brand), hero: fields(value?.hero, defaults.hero),
      contacts: fields(value?.contacts, defaults.contacts), legal: fields(value?.legal, defaults.legal),
      priceArchive: typeof value?.priceArchive === 'string' ? value.priceArchive : '',
      hidePriceArchive: value?.hidePriceArchive === true
    };
    const known = new Set();
    result.sections = [];
    for (const item of [...(Array.isArray(value?.sections) ? value.sections : []), ...defaults.sections]) {
      if (!keys.includes(item?.id) || known.has(item.id)) continue;
      known.add(item.id);
      result.sections.push(fields(item, defaults.sections.find(section => section.id === item.id)));
    }
    result.services = (Array.isArray(value?.services) ? value.services : defaults.services)
      .filter(service => service && typeof service === 'object')
      .map(service => fields(service, serviceTemplate));
    return result;
  }

  function validate(value) {
    const page = normalize(value);
    if (!page.brand.name.trim() || !page.hero.title.trim()) return 'Укажите название студии и заголовок обложки.';
    for (const color of [page.brand.accent, page.brand.darkAccent]) {
      if (!/^#[0-9a-f]{6}$/i.test(color)) return 'Выберите оба фирменных цвета.';
    }
    for (const [key, label] of [['telegram', 'Telegram для заявок'], ['telegramChannel', 'канал Telegram'], ['vk', 'ВКонтакте'], ['map', 'карты']]) {
      if ((page.contacts[key] || key === 'telegram') && !contactUrl(key, page.contacts[key])) return 'Проверьте ссылку в поле «' + label + '».';
    }
    if (page.contacts.phone && !phoneHref(page.contacts.phone)) return 'Проверьте номер телефона.';
    if (page.sections.some(section => section.enabled && !section.title.trim())) return 'У каждого видимого раздела должен быть заголовок.';
    if (page.services.some(service => !service.title.trim())) return 'Укажите название каждой услуги.';
    const media = [page.brand.logo, page.hero.image, page.contacts.routeVideo, page.contacts.routePoster, page.priceArchive, ...page.services.map(service => service.image)];
    if (media.some(url => url && !mediaUrl(url))) return 'Проверьте адрес файла в настройках изображения или видео.';
    for (const field of ['email', 'siteOwnerEmail', 'registryEmail']) {
      if (page.legal[field] && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(page.legal[field])) return 'Проверьте электронную почту в реквизитах.';
    }
    if (page.legal.inn && !/^(?:\d{10}|\d{12})$/.test(page.legal.inn)) return 'ИНН должен содержать 10 или 12 цифр.';
    if (page.legal.registrationNumber && !/^(?:\d{13}|\d{15})$/.test(page.legal.registrationNumber)) return 'ОГРН содержит 13 цифр, ОГРНИП — 15.';
    return '';
  }

  function setText(element, value) {
    if (!element || element.textContent === value) return;
    element.textContent = value;
  }

  function setLink(element, url) {
    if (url) element.setAttribute('href', url);
    else element.removeAttribute('href');
    element.hidden = !url;
  }

  function apply(value, doc = document) {
    const page = normalize(value);
    api.current = page;
    window.STUDIO_PAGE = page;
    const main = doc.querySelector('main#main');
    if (!main) return page;
    const { brand, hero, contacts, legal } = page;
    const each = (selector, change, parent = doc) => parent.querySelectorAll(selector).forEach(change);
    const copy = (selector, value, parent) => each(selector, el => setText(el, value), parent);
    const applyLink = (selector, url) => each(selector, el => setLink(el, url));
    const enabled = new Set(page.sections.filter(s => s.enabled).map(s => s.id));

    if (brand.siteTitle.trim()) doc.title = brand.siteTitle;
    doc.querySelector('meta[name="description"]')?.setAttribute('content', brand.description);
    for (const [setting, css] of [['accent', '--accent'], ['darkAccent', '--accent-dark']]) {
      const color = brand[setting];
      if (/^#[a-f0-9]{6}$/i.test(color)) doc.documentElement.style.setProperty(css, color);
    }
    copy('[data-brand-name]', brand.name);
    const logo = mediaUrl(brand.logo);
    const customLogo = logo && logo !== defaults.brand.logo;
    each('[data-brand]', mark => {
      mark.setAttribute('aria-label', brand.name + ' — в начало');
      each('[data-brand-mark]', el => { el.hidden = Boolean(customLogo); }, mark);
      each('[data-custom-logo]', img => {
        img.hidden = !customLogo;
        if (customLogo) img.src = logo; else img.removeAttribute('src');
      }, mark);
    });
    const icon = doc.querySelector('link[rel="icon"]');
    if (icon) {
      if (!icon.dataset.originalIcon) icon.dataset.originalIcon = icon.getAttribute('href') || '';
      icon.setAttribute('href', logo || icon.dataset.originalIcon);
      if (logo) icon.removeAttribute('type');
    }
    const heading = doc.querySelector('[data-hero-title]');
    if (heading) {
      const lines = hero.title.split(/\r?\n/);
      const children = [];
      lines.forEach((line, index) => {
        if (index) children.push(doc.createElement('br'));
        const span = doc.createElement('span');
        span.className = 'hero-line';
        span.textContent = line;
        children.push(span);
      });
      heading.replaceChildren(...children);
    }
    copy('[data-hero-kicker]', hero.kicker);
    copy('[data-hero-city]', hero.city);
    copy('[data-hero-desc]', hero.description);
    const picture = mediaUrl(hero.image);
    each('[data-hero-image]', img => {
      img.hidden = !picture;
      if (picture) img.setAttribute('src', picture);
      else img.removeAttribute('src');
    });
    each('[data-mobile-hero]', el => {
      const mobile = picture === defaults.hero.image ? 'v2/media/hero-mobile-teal.webp' : picture;
      if (mobile) el.setAttribute('srcset', mobile);
      else el.removeAttribute('srcset');
    });
    for (const [selector, dest, label] of [['[data-primary]', 'calculator', hero.primaryLabel], ['[data-secondary]', 'works', hero.secondaryLabel]]) {
      each(selector, el => {
        setLink(el, enabled.has(dest) && label ? '#' + dest : '');
        setText(el.querySelector('[data-hero-button-label]') || el, label);
      });
    }
    const pages = [];
    for (const section of page.sections) {
      const el = doc.getElementById(section.id);
      if (!el || !main.contains(el)) continue;
      pages.push(el);
      el.hidden = !section.enabled;
      copy('[data-section-kicker]', section.kicker, el);
      copy('[data-section-title]', section.title, el);
      copy('[data-section-desc]', section.description, el);
    }
    // Avoid detaching already mounted interactive sections if their order is current.
    const present = [...main.children].filter(el => pages.includes(el));
    if (pages.some((el, index) => el !== present[index])) pages.forEach(el => main.append(el));
    each('[data-nav]', nav => {
      const items = page.sections.filter(s => s.enabled && s.navLabel.trim());
      nav.replaceChildren(...items.map(section => {
        const link = doc.createElement('a');
        link.textContent = section.navLabel;
        link.href = '#' + section.id;
        return link;
      }));
    });
    for (const id of keys) doc.documentElement.classList.toggle('cms-hide-' + id, !enabled.has(id));
    const ruleId = 'studio-visibility-rules';
    let rules = doc.getElementById(ruleId);
    if (!rules) {
      rules = doc.createElement('style');
      rules.id = ruleId;
      rules.textContent = keys.map(id => '.cms-hide-' + id + ' a[href="#' + id + '"]{display:none!important}').join('\n');
      doc.head.append(rules);
    }
    applyLink('[data-telegram]', contactUrl('telegram', contacts.telegram));
    copy('[data-telegram-label]', brand.telegramLabel);
    applyLink('[data-channel]', contactUrl('telegramChannel', contacts.telegramChannel));
    applyLink('[data-map]', contactUrl('map', contacts.map));
    applyLink('[data-vk]', contactUrl('vk', contacts.vk));
    each('[data-phone]', el => {
      const tel = phoneHref(contacts.phone);
      if (el.matches('a')) setLink(el, tel);
      setText(el.querySelector('[data-phone-label]') || el, contacts.phone);
    });
    copy('[data-address]', contacts.address);
    copy('[data-short-address]', contacts.shortAddress);
    copy('[data-entrance]', contacts.entrance);
    copy('[data-hours]', legal.hours);
    copy('[data-person]', contacts.person);
    copy('[data-role]', contacts.role);
    copy('[data-route-caption]', contacts.routeCaption);
    const route = mediaUrl(contacts.routeVideo);
    const poster = mediaUrl(contacts.routePoster);
    each('[data-route-video]', el => {
      if (!el.matches('video')) return;
      el.hidden = !route;
      if (route) el.setAttribute('src', route); else el.removeAttribute('src');
      if (poster) el.setAttribute('poster', poster); else el.removeAttribute('poster');
      el.setAttribute('aria-label', contacts.routeCaption || 'Видео проезда');
    });
    each('img[data-route-poster]', el => {
      el.hidden = !poster;
      if (poster) el.setAttribute('src', poster); else el.removeAttribute('src');
    });
    return page;
  }

  const api = { normalize, validate, mediaUrl, contactUrl, apply, current: normalize(defaults) };
  window.STUDIO_PAGE_DEFAULTS = defaults;
  window.StudioPage = api;
})();
