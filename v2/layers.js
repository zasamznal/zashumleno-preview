(() => {
  'use strict';

  const materials = [
    {
      name: 'Металл',
      text: 'Под обшивкой находится металлический каркас. Его широкие панели могут вибрировать на ходу и при работе динамика.',
      x: 16, y: 46
    },
    {
      name: 'Вибродемпфер',
      text: 'Плотный лист прикатывают к металлу. Он гасит колебания панели, поэтому она меньше резонирует.',
      x: 31, y: 53
    },
    {
      name: 'Шумопоглотитель',
      text: 'Мягкий пористый материал размещают под обшивкой. Его структура поглощает часть звука внутри двери.',
      x: 47, y: 53
    },
    {
      name: 'Обшивка',
      text: 'Внутренняя дверная карта закрывает обработанные поверхности. Для её стыков можно отдельно заказать антискрип.',
      x: 74, y: 66
    }
  ];

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function mount() {
    const host = document.querySelector('#layers [data-layers]');
    if (!host) return;
    const page = window.StudioPage?.current;
    const settings = page?.sections?.find(section => section.id === 'layers');
    if (settings?.enabled === false) return;

    const heading = element('header', 'layer-story-heading');
    if (settings?.kicker) heading.append(element('p', 'layer-story-kicker', settings.kicker));
    const title = element('h2', 'layer-story-title', settings?.title || 'Что внутри двери');
    title.id = 'layer-story-title';
    heading.append(title);
    if (settings?.description) heading.append(element('p', 'layer-story-intro', settings.description));
    host.closest('section').setAttribute('aria-labelledby', title.id);

    const body = element('div', 'layer-story-body');
    const scene = element('div', 'layer-story-scene');
    const art = element('div', 'layer-story-art');
    const image = element('img', 'layer-story-image');
    image.src = 'v2/media/door-layers.webp';
    image.alt = 'Разнесённые части двери: металл, фольгированный лист, пористый материал и внутренняя обшивка.';
    image.loading = 'lazy';
    image.decoding = 'async';
    const pointer = element('span', 'layer-story-pointer');
    pointer.setAttribute('aria-hidden', 'true');
    art.append(image, pointer);
    scene.append(art);

    const controls = element('div', 'layer-story-controls');
    const rows = materials.map((part, index) => {
      const item = element('div', 'layer-story-item');
      const button = element('button', 'layer-story-trigger', part.name);
      button.type = 'button';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', 'layer-story-panel-' + index);
      const icon = element('span', 'layer-story-plus');
      icon.setAttribute('aria-hidden', 'true');
      button.append(icon);
      const panel = element('div', 'layer-story-panel');
      panel.id = 'layer-story-panel-' + index;
      panel.hidden = true;
      panel.append(element('p', '', part.text));
      button.addEventListener('click', () => select(active === index ? -1 : index, true));
      item.append(button, panel);
      controls.append(item);
      return { item, button, panel };
    });

    const door = (window.STUDIO_ZONES || []).find(zone => zone.id === 'doors');
    const ratesEnabled = page?.sections?.find(section => section.id === 'prices')?.enabled !== false;
    if (ratesEnabled && door) {
      const link = element('a', 'layer-story-rates', 'Сравнить комплекты для дверей');
      const url = new URL(location.href);
      url.searchParams.set('zone', door.id);
      url.hash = 'prices';
      link.href = url.toString();
      controls.append(link);
    }

    let active = -1;
    function select(index, engaged) {
      active = index;
      rows.forEach(({ item, button, panel }, row) => {
        const selected = row === index;
        button.setAttribute('aria-expanded', String(selected));
        panel.hidden = !selected;
        item.classList.toggle('is-active', selected);
      });
      if (index >= 0) {
        art.style.setProperty('--layer-x', materials[index].x + '%');
        art.style.setProperty('--layer-y', materials[index].y + '%');
      }
      scene.classList.toggle('is-focused', engaged && index >= 0);
    }

    select(0, false);
    body.append(scene, controls);
    host.replaceChildren(heading, body);
  }

  Promise.resolve(window.STUDIO_READY ?? true).then(ready => { if (ready) mount(); });
})();
