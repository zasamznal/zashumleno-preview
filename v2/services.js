(() => {
  'use strict';

  function makeNode(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // Cards stay as large as the rows allow: three in a row unless a fourth column saves a row.
  // «wide» is the column count from a small laptop up, «mid» for tablets, «dense» switches to the compact card.
  function layout(count) {
    const wide = count < 4 ? Math.max(1, count) : Math.ceil(count / 3) === Math.ceil(count / 4) ? 3 : 4;
    return { wide, mid: count === 4 ? 2 : Math.max(1, Math.min(3, count)), dense: count > 3 };
  }

  // A service without a photo keeps its place in the grid: sound waves fading out, in the studio colours.
  const placeholder = '<svg viewBox="0 0 120 80" preserveAspectRatio="xMinYMax slice" aria-hidden="true" focusable="false">' +
    [12, 26, 40, 54, 68, 82, 96, 110].map((radius, index) => '<circle cx="0" cy="80" r="' + radius + '" opacity="' + (.62 - index * .075).toFixed(2) + '"/>').join('') + '</svg>';

  function renderService(service, index, requestEnabled, telegram) {
    const card = makeNode('article', 'v2-service');
    const interactive = requestEnabled || telegram;
    const surface = makeNode(interactive ? 'a' : 'div', 'v2-service__surface');
    const mediaUrl = window.StudioPage.mediaUrl(service.image);
    // The request form lists the service under the same trimmed name.
    const name = service.title.trim();

    if (interactive) {
      surface.href = requestEnabled ? '#request' : telegram;
      if (requestEnabled) {
        surface.addEventListener('click', event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          window.dispatchEvent(new CustomEvent('studio:quote', { detail: { service: name } }));
        });
      } else {
        surface.href = window.StudioPage.telegramDraftUrl(telegram, 'Здравствуйте! Хочу обсудить услугу «' + name + '».');
        surface.target = '_blank';
        surface.rel = 'noopener noreferrer';
      }
    }

    const frame = makeNode('div', 'v2-service__photo');
    const blank = () => {
      frame.classList.add('v2-service__photo--empty');
      frame.innerHTML = placeholder;
    };
    if (mediaUrl) {
      const image = makeNode('img');
      image.loading = 'lazy';
      image.decoding = 'async';
      image.alt = service.alt || '';
      image.src = mediaUrl;
      image.addEventListener('error', blank, { once: true });
      frame.append(image);
    } else {
      blank();
    }
    surface.append(frame);

    const info = makeNode('div', 'v2-service__info');
    const title = makeNode('h3', 'v2-service__title', name);
    title.id = 'v2-service-title-' + index;
    info.append(title);
    if (service.description) info.append(makeNode('p', 'v2-service__description', service.description));
    if (interactive) {
      const action = makeNode('span', 'v2-service__action', service.action || 'Обсудить услугу');
      action.id = 'v2-service-action-' + index;
      surface.setAttribute('aria-labelledby', title.id + ' ' + action.id);
      info.append(action);
    }

    surface.append(info);
    card.append(surface);
    return card;
  }

  window.StudioServices = { layout };
  Promise.resolve(window.STUDIO_READY).then(ready => {
    const block = document.querySelector('#services [data-services]');
    const page = window.StudioPage?.current;
    if (!ready || !block || !page) return;
    const visible = page.services.filter(service => service.title.trim());
    const section = block.closest('section');
    if (!visible.length) {
      section.hidden = true;
      return;
    }
    const requestEnabled = Boolean(document.getElementById('request')) &&
      page.sections.some(item => item.id === 'request' && item.enabled);
    const telegram = window.StudioPage.contactUrl('telegram', page.contacts.telegram);
    const grid = layout(visible.length);
    block.dataset.wide = grid.wide;
    block.dataset.mid = grid.mid;
    block.toggleAttribute('data-dense', grid.dense);
    block.replaceChildren(...visible.map((service, index) => {
      const card = renderService(service, index, requestEnabled, telegram);
      card.style.setProperty('--svc-beat', index % grid.wide);
      return card;
    }));

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('v2-service--arrived');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12 });
    for (const card of block.children) observer.observe(card);
  });
})();
