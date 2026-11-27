(() => {
  'use strict';
  const K = window.StudioKit;
  const fields = [
    ['accent', 'Основной цвет', 'Кнопки и акценты на тёмном фоне. По умолчанию — сиреневый из логотипа.'],
    ['darkAccent', 'Акцент на светлом фоне', 'Ссылки и подписи в светлых блоках. Должен быть заметно темнее основного.'],
    ['altAccent', 'Второй цвет', 'Название студии в шапке и мелкие детали. По умолчанию — голубой из логотипа.'],
    ['sparkColor', 'Яркий акцент', 'Звуковая волна на обложке и метка студии на схеме проезда.'],
    ['nightColor', 'Фон тёмных блоков', 'Шапка, обложка, калькулятор, услуги.'],
    ['paperColor', 'Фон светлых блоков', 'Материалы, работы, прайс, контакты.']
  ];

  function render(ctx) {
    const page = ctx.data.page;
    const brand = page.brand;
    const host = ctx.host;
    const pickers = new Map();
    const local = { ...ctx, change() { ctx.change(); paint(); } };

    const logoCard = K.card(host, 'Логотип', 'Показывается в шапке, подвале и на вкладке браузера. Подойдёт PNG с прозрачным фоном или JPG/WebP. «Как было» вернёт знак студии.');
    K.media(local, logoCard, brand, 'logo', 'Файл логотипа', { removable: false, contain: true, reset: 'assets/mark.svg' });
    K.text(local, logoCard, brand, 'name', 'Название студии', { max: 80 });
    K.text(local, logoCard, brand, 'tagline', 'Подпись под логотипом в подвале', { max: 80, placeholder: 'Создай свою атмосферу' });

    const presetsCard = K.card(host, 'Готовые палитры', 'Нажмите на палитру, чтобы применить её целиком. Потом любой цвет можно поправить ниже.');
    const presets = K.el('div', 'k-presets');
    for (const preset of window.StudioPage.palettes || []) {
      const item = K.el('button', 'k-preset');
      item.type = 'button';
      const dots = K.el('span', 'k-preset-dots');
      for (const key of ['nightColor', 'accent', 'altAccent', 'sparkColor', 'darkAccent', 'paperColor']) {
        const dot = K.el('span');
        dot.style.background = preset.colors[key];
        dots.append(dot);
      }
      item.append(dots, K.el('span', '', preset.title));
      item.addEventListener('click', () => {
        Object.assign(brand, preset.colors);
        for (const [key, control] of pickers) control.update(brand[key]);
        local.change();
        ctx.notify('Палитра «' + preset.title + '» применена к черновику.');
      });
      presets.append(item);
    }
    presetsCard.append(presets);

    const colorsCard = K.card(host, 'Цвета', 'Попросите у дизайнера коды цветов в формате HEX — например, #BCB9D9 — и вставьте их в поля. Или выберите цвет кнопкой слева.');
    const layout = K.el('div', 'k-palette');
    const form = K.el('div', 'k-palette-fields');
    for (const [key, label, note] of fields) pickers.set(key, K.color(local, form, brand, key, label, { note }));
    const preview = K.el('div', 'k-palette-preview');
    preview.innerHTML = `
      <div class="pp-dark"><span class="pp-brand">ЗАШУМЛЕНО</span><strong>Тишина <em>в движении.</em></strong><span class="pp-button">Рассчитать стоимость</span><span class="pp-wave"></span></div>
      <div class="pp-light"><span class="pp-kicker">Материалы студии</span><strong>Что внутри</strong><span class="pp-link">Подробнее в прайсе</span><span class="pp-receipt">Ваша смета · от 33 000 ₽</span></div>`;
    layout.append(form, preview);
    colorsCard.append(layout);
    const warnings = K.el('ul', 'k-warnings');
    warnings.setAttribute('role', 'status');
    colorsCard.append(warnings);

    function paint() {
      const vars = { '--accent': brand.accent, '--accent-dark': brand.darkAccent, '--accent-alt': brand.altAccent,
        '--spark': brand.sparkColor, '--night': brand.nightColor, '--paper': brand.paperColor };
      for (const [name, value] of Object.entries(vars)) if (/^#[0-9a-f]{6}$/i.test(value || '')) preview.style.setProperty(name, value);
      const checks = [
        [brand.accent, brand.nightColor, 4.5, 'Основной цвет плохо читается на тёмном фоне — сделайте его светлее.'],
        [brand.nightColor, brand.accent, 4.5, 'Текст на кнопках плохо виден — основной цвет слишком тёмный.'],
        [brand.darkAccent, brand.paperColor, 4.5, 'Акцент на светлом фоне слишком бледный — сделайте его темнее.'],
        ['#f6f5fa', brand.nightColor, 7, 'Тёмный фон слишком светлый для белого текста.'],
        ['#1a1726', brand.paperColor, 7, 'Светлый фон слишком тёмный для чёрного текста.']
      ];
      warnings.replaceChildren(...checks.filter(([a, b, min]) => /^#[0-9a-f]{6}$/i.test(a) && /^#[0-9a-f]{6}$/i.test(b) && K.contrast(a, b) < min)
        .map(([, , , message]) => K.el('li', '', message)));
      if (!warnings.childElementCount) warnings.append(K.el('li', 'k-ok', 'Цвета хорошо читаются вместе.'));
    }
    paint();
  }

  window.StudioAdmin.register({
    id: 'palette', title: 'Цвета и логотип', group: 'Оформление', order: 10,
    description: 'Фирменные цвета студии, логотип и название. Изменения видны в предпросмотре сразу после сохранения.',
    render
  });
})();
