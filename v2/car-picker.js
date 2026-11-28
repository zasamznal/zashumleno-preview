(() => {
  'use strict';

  const storageKey = 'zs-vehicle';
  let instance = 0;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function stored() {
    try {
      const value = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      return value && typeof value === 'object' ? value : {};
    } catch { return {}; }
  }

  function remember(vehicle) {
    try { sessionStorage.setItem(storageKey, JSON.stringify(vehicle)); } catch { /* Private mode keeps the choice for the page only. */ }
  }

  // The car selector of the calculator: body type, brand with suggestions and an optional model.
  function create({ config, onChange }) {
    const pricing = globalThis.StudioVehicles;
    const shapes = globalThis.StudioCarShapes;
    const id = 'car-' + (++instance);
    const saved = stored();
    const state = {
      body: config.bodies.some(body => body.id === saved.body) ? saved.body : '',
      brand: typeof saved.brand === 'string' ? saved.brand.slice(0, 60) : '',
      model: typeof saved.model === 'string' ? saved.model.slice(0, 60) : ''
    };

    const root = element('div', 'car-picker');
    const head = element('div', 'car-head');
    const title = element('h3', 'est-question', 'Какая у вас машина?');
    title.id = id + '-title';
    head.append(title, element('p', 'car-hint', 'Кузов и марка влияют на площадь обработки и разборку салона — цены пересчитаются сразу.'));

    const bodies = element('div', 'car-bodies');
    bodies.setAttribute('role', 'group');
    bodies.setAttribute('aria-label', 'Тип кузова');
    const bodyButtons = new Map();
    for (const body of config.bodies) {
      const button = element('button', 'car-body');
      button.type = 'button';
      button.dataset.body = body.id;
      if (shapes) button.append(shapes.svg(body.shape));
      button.append(element('span', 'car-body-name', body.title));
      button.addEventListener('click', () => {
        state.body = state.body === body.id ? '' : body.id;
        if (state.body) button.classList.remove('is-drawn'), void button.offsetWidth, button.classList.add('is-drawn');
        commit();
      });
      bodyButtons.set(body.id, button);
      bodies.append(button);
    }

    const fields = element('div', 'car-fields');
    const brandBox = element('div', 'car-field car-brand');
    const brandLabel = element('label', '', 'Марка');
    brandLabel.htmlFor = id + '-brand';
    const brandWrap = element('div', 'car-combo');
    const brand = element('input', 'car-input');
    Object.assign(brand, { id: id + '-brand', type: 'text', autocomplete: 'off', spellcheck: false, maxLength: 60, placeholder: 'Например, Geely или BMW' });
    brand.setAttribute('role', 'combobox');
    brand.setAttribute('aria-autocomplete', 'list');
    brand.setAttribute('aria-expanded', 'false');
    brand.setAttribute('aria-controls', id + '-brands');
    const clear = element('button', 'car-clear');
    clear.type = 'button';
    clear.setAttribute('aria-label', 'Очистить марку');
    clear.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>';
    const toggle = element('button', 'car-list-toggle');
    toggle.type = 'button';
    toggle.tabIndex = -1; // Keyboard users open the list with the arrows in the combobox.
    toggle.setAttribute('aria-label', 'Список марок');
    toggle.setAttribute('aria-haspopup', 'listbox');
    toggle.setAttribute('aria-controls', id + '-brands');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    const list = element('ul', 'car-options');
    list.id = id + '-brands';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Марки автомобилей');
    // Keep the text input as the keyboard focus while navigating the list with the arrows.
    list.tabIndex = -1;
    list.hidden = true;
    brandWrap.append(brand, clear, toggle, list);
    brandBox.append(brandLabel, brandWrap);

    const modelBox = element('div', 'car-field car-model');
    const modelLabel = element('label', '', 'Модель');
    modelLabel.htmlFor = id + '-model';
    modelLabel.append(element('small', '', ' — по желанию'));
    const model = element('input', 'car-input');
    Object.assign(model, { id: id + '-model', type: 'text', autocomplete: 'off', maxLength: 60, placeholder: 'Например, Atlas' });
    modelBox.append(modelLabel, model);
    fields.append(brandBox, modelBox);

    const popular = element('div', 'car-popular');
    popular.setAttribute('role', 'group');
    popular.setAttribute('aria-label', 'Популярные марки');
    const chips = new Map();
    for (const name of config.popular) {
      const chip = element('button', 'car-chip', name);
      chip.type = 'button';
      chip.addEventListener('click', () => {
        const same = pricing.findBrand(config, state.brand)?.name === name;
        state.brand = same ? '' : name;
        brand.value = state.brand;
        closeList();
        commit();
      });
      chips.set(name, chip);
      popular.append(chip);
    }

    const status = element('div', 'car-status');
    const statusText = element('p', 'car-status-text');
    statusText.setAttribute('role', 'status');
    const reset = element('button', 'car-reset', 'Сбросить');
    reset.type = 'button';
    reset.addEventListener('click', () => {
      Object.assign(state, { body: '', brand: '', model: '' });
      brand.value = model.value = '';
      commit();
      bodies.querySelector('button')?.focus({ preventScroll: true });
    });
    status.append(statusText, reset);
    root.append(head, bodies, fields, popular, status);

    let options = [];
    let active = -1;
    function closeList() {
      list.hidden = true;
      brand.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-expanded', 'false');
      brand.removeAttribute('aria-activedescendant');
      active = -1;
    }
    function highlight(index) {
      active = index;
      [...list.children].forEach((item, i) => item.setAttribute('aria-selected', String(i === index)));
      if (index >= 0) {
        brand.setAttribute('aria-activedescendant', list.children[index].id);
        list.children[index].scrollIntoView({ block: 'nearest' });
      } else brand.removeAttribute('aria-activedescendant');
    }
    function openList(query = '') {
      options = pricing.suggest(config, query, Infinity);
      list.replaceChildren(...options.map((option, index) => {
        const item = element('li', 'car-option');
        item.id = id + '-brand-' + index;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');
        item.append(element('span', '', option.name));
        // Keep mouse focus in the input but let touch users scroll the options normally.
        item.addEventListener('mousedown', event => event.preventDefault());
        item.addEventListener('click', () => choose(option.name));
        return item;
      }));
      list.hidden = !options.length;
      brand.setAttribute('aria-expanded', String(!list.hidden));
      toggle.setAttribute('aria-expanded', String(!list.hidden));
      list.scrollTop = 0;
      highlight(-1);
    }
    function choose(name) {
      brand.value = state.brand = name;
      closeList();
      commit();
    }
    brand.addEventListener('focus', () => openList());
    brand.addEventListener('click', () => { if (list.hidden) openList(); });
    toggle.addEventListener('click', () => {
      if (list.hidden) openList();
      else closeList();
    });
    brand.addEventListener('input', () => {
      openList(brand.value);
      state.brand = brand.value.trim();
      commit(true);
    });
    brand.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (list.hidden) openList();
        if (!options.length) return;
        const step = event.key === 'ArrowDown' ? 1 : -1;
        highlight(active < 0 ? (step > 0 ? 0 : options.length - 1) : (active + step + options.length) % options.length);
      } else if (event.key === 'Enter' && !list.hidden && active >= 0) {
        event.preventDefault();
        choose(options[active].name);
      } else if (event.key === 'Escape' && !list.hidden) {
        event.preventDefault();
        closeList();
      } else if (event.key === 'Tab') closeList();
    });
    // A tap can blur the input before the option receives its click. Dismiss on an
    // outside interaction instead, leaving the list in place during a tap or a swipe.
    window.addEventListener('pointerdown', event => {
      if (!list.hidden && !brandWrap.contains(event.target)) closeList();
    }, true);
    brandWrap.addEventListener('focusout', event => {
      if (event.relatedTarget && !brandWrap.contains(event.relatedTarget)) closeList();
    });
    brand.addEventListener('blur', () => {
      const match = pricing.findBrand(config, brand.value);
      if (match) brand.value = match.name;
      state.brand = brand.value.trim();
      commit();
    });
    clear.addEventListener('click', () => {
      brand.value = state.brand = '';
      commit();
      brand.focus();
      openList();
    });
    model.addEventListener('input', () => {
      state.model = model.value.trim();
      commit(true);
    });

    let lastSignature = '';
    function render() {
      const match = state.brand ? pricing.findBrand(config, state.brand) : null;
      for (const [body, button] of bodyButtons) button.setAttribute('aria-pressed', String(body === state.body));
      for (const [name, chip] of chips) chip.setAttribute('aria-pressed', String(match?.name === name));
      clear.hidden = !brand.value;
      const description = pricing.describe(config, state);
      status.hidden = !description;
      if (description) {
        // A brand the price list does not know changes nothing by itself: prices follow the body alone.
        const recalculated = Boolean(state.body || match);
        statusText.replaceChildren(recalculated ? 'Цены пересчитаны для: ' : 'Ваша машина: ', element('strong', '', description));
        if (state.brand && !match) statusText.append(element('span', 'car-unknown', ' Этой марки нет в списке — мастер уточнит цену.'));
      } else statusText.textContent = '';
      root.dataset.selected = String(Boolean(description));
    }
    function commit(quiet = false) {
      remember(state);
      render();
      const signature = JSON.stringify(state);
      if (signature === lastSignature) return;
      lastSignature = signature;
      onChange?.({ ...state }, quiet);
    }

    brand.value = state.brand;
    model.value = state.model;
    render();
    lastSignature = JSON.stringify(state);
    return { element: root, get value() { return { ...state }; }, titleId: title.id };
  }

  globalThis.StudioCarPicker = { create, stored };
})();
