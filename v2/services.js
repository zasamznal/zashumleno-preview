(() => {
  'use strict';

  function makeNode(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function renderService(service, index, requestEnabled, telegram) {
    const card = makeNode('article', 'v2-service');
    const interactive = requestEnabled || telegram;
    const surface = makeNode(interactive ? 'a' : 'div', 'v2-service__surface');
    const mediaUrl = window.StudioPage.mediaUrl(service.image);

    if (interactive) {
      surface.href = requestEnabled ? '#request' : telegram;
      if (requestEnabled) {
        surface.addEventListener('click', event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          window.dispatchEvent(new CustomEvent('studio:quote', { detail: { service: service.title } }));
        });
      } else {
        surface.href = window.StudioPage.telegramDraftUrl(telegram, 'Здравствуйте! Хочу обсудить услугу «' + service.title + '».');
        surface.target = '_blank';
        surface.rel = 'noopener noreferrer';
      }
    }

    if (mediaUrl) {
      const frame = makeNode('div', 'v2-service__photo');
      const image = makeNode('img');
      image.loading = 'lazy';
      image.decoding = 'async';
      image.alt = service.alt || '';
      image.src = mediaUrl;
      image.addEventListener('error', () => {
        frame.remove();
        card.classList.add('v2-service--text');
      }, { once: true });
      frame.append(image);
      surface.append(frame);
    } else {
      card.classList.add('v2-service--text');
    }

    const info = makeNode('div', 'v2-service__info');
    const title = makeNode('h3', 'v2-service__title', service.title);
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
    block.replaceChildren(...visible.map((service, index) => renderService(service, index, requestEnabled, telegram)));

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
