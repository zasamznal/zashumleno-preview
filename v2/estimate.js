(() => {
  "use strict";

  const picturedZones = new Set(["doors", "arches", "floor", "trunk", "roof", "dashboard"]);

  const controlPaths = {
    receipt: '<path d="M6 3h12v18l-3-1.8-3 1.8-3-1.8L6 21V3Zm3 5h6m-6 4h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12 4.3 4.3L19 7"/>',
    close: '<path d="m7 7 10 10M17 7 7 17"/>',
    chevron: '<path d="m7 10 5 5 5-5"/>'
  };

  function svgIcon(markup, viewBox, strokeWidth) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", strokeWidth);
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = markup;
    return svg;
  }

  function icon(name) {
    return svgIcon(controlPaths[name], "0 0 24 24", "1.5");
  }

  function zonePicture(zoneId, configuredImage) {
    const frame = element("span", "est-zone-picture");
    frame.setAttribute("aria-hidden", "true");

    const showPlaceholder = () => {
      frame.replaceChildren(svgIcon(
        '<path d="m4 10 14-6 14 6-14 6-14-6Zm0 6 14 6 14-6m-28 6 14 6 14-6"/>',
        "0 0 36 32", "1.5"
      ));
    };
    let source = window.StudioPage?.mediaUrl(configuredImage) || "";
    if (picturedZones.has(zoneId) && (!source || source === "assets/zone-" + zoneId + ".webp")) {
      source = "v2/media/zone-" + zoneId + ".webp";
    }
    if (source) {
      const image = element("img", "est-zone-photo");
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", showPlaceholder, {once:true});
      image.src = source;
      frame.append(image);
    } else {
      showPlaceholder();
    }
    return frame;
  }

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
  }

  function button(className) {
    const el = element("button", className);
    el.type = "button";
    return el;
  }

  function plural(count) {
    const rule = new Intl.PluralRules("ru").select(count);
    return count + " " + ({ one: "работа", few: "работы", many: "работ", other: "работы" })[rule];
  }

  async function mount() {
    const host = document.querySelector("[data-estimate]");
    if (!host || !(await (window.STUDIO_READY ?? true))) return;
    const config = window.StudioPage?.current?.sections?.find(section => section.id === "calculator");
    if (config?.enabled === false) return;
    const engine = window.StudioEstimate?.create(window.STUDIO_PRICES || [], window.STUDIO_ZONES || [], window.STUDIO_VEHICLES);
    const zones = engine?.zones.filter(zone => zone.groups.some(group => group.choices.length)) || [];
    host.innerHTML = `
      <header class="est-intro">
        <div><span class="est-eyebrow">Калькулятор</span><h2 id="estimate-title"></h2></div>
        <p class="est-intro-copy"></p>
      </header>
      <div class="est-layout">
        <div class="est-builder">
          <div class="est-block est-car"></div>
          <div class="est-block">
            <h3 class="est-question">Что обработать?</h3>
            <div class="est-zones" aria-label="Зоны обработки" role="group"></div>
          </div>
          <div class="est-block est-packages">
            <div class="est-work-head"><h3 class="est-question">Выберите комплект</h3>
              <label class="est-work-select"><span>Вид работы</span><select aria-label="Вид работы"></select></label>
            </div>
            <div class="est-choices" aria-label="Добавить вариант в смету" role="group"></div>
            <details class="est-details"><summary>Материалы и условия</summary><div class="est-details-content"></div></details>
          </div>
        </div>
        <aside class="est-receipt" aria-labelledby="estimate-cart-title" id="estimate-cart">
          <div class="est-receipt-head"><h3 id="estimate-cart-title">Ваша смета</h3><span class="est-receipt-icon"></span></div>
          <p class="est-vehicle" hidden></p>
          <p class="est-empty">Выберите зону и нажмите на стоимость комплекта. Здесь появятся выбранные работы.</p>
          <ul class="est-items"></ul>
          <div class="est-total">
            <div class="est-total-heading"><span>Предварительный итог</span><span class="est-count"></span></div>
            <strong class="est-total-amount" aria-hidden="true">0 ₽</strong><span class="est-sr est-readable-total">0 ₽</span>
            <p class="est-condition" hidden></p>
            <button class="est-request" type="button" disabled>Запросить расчёт</button>
          </div>
        </aside>
      </div>
      <p class="est-sr est-announcement" role="status" aria-live="polite" aria-atomic="true"></p>`;
    const get = selector => host.querySelector(selector);
    get(".est-eyebrow").textContent = config?.kicker ?? "Калькулятор";
    const oldHeading = config?.title?.trim();
    get("#estimate-title").textContent = oldHeading && !/^соберите свой комплект\.?$/iu.test(oldHeading)
      ? oldHeading : "Рассчитайте шумоизоляцию";
    const oldDescription = config?.description?.trim();
    get(".est-intro-copy").textContent = oldDescription && !/на схеме автомобиля/i.test(oldDescription)
      ? oldDescription : "Сравните комплекты для вашей машины. Нажмите на подходящий вариант, чтобы добавить его в смету.";
    if (!zones.length) {
      get(".est-layout").replaceChildren(element("p", "est-unavailable", "Студия обновляет тарифы. Стоимость можно уточнить в разделе консультации."));
      return;
    }

    const zoneNav = get(".est-zones");
    const choiceList = get(".est-choices");
    const cartList = get(".est-items");
    const groupSelect = get(".est-work-select select");
    const zoneButtons = new Map();
    const choiceButtons = new Map();
    const chosenGroup = new Map();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const totalNode = get(".est-total-amount");
    let activeZone = zones[0];
    let activeGroup = activeZone.groups[0];
    let previousMin = 0;
    let frame = 0;
    let summary = engine.summarize();
    const amountFrames = new WeakMap();
    const carHost = get(".est-car");
    if (engine.vehicles?.bodies.length && window.StudioCarPicker && window.StudioVehicles) {
      const picker = window.StudioCarPicker.create({
        config: engine.vehicles,
        onChange(vehicle, quiet) {
          engine.setVehicle(vehicle);
          refreshPrices(!quiet);
        }
      });
      carHost.append(picker.element);
      engine.setVehicle(picker.value);
    } else carHost.remove();
    get(".est-receipt-icon").append(icon("receipt"));
    get(".est-work-select").append(icon("chevron"));
    get(".est-details summary").append(icon("chevron"));
    // On a phone the receipt sits below the kits: a slim bar keeps the running total in sight.
    const receipt = get(".est-receipt");
    const dock = element("div", "est-dock");
    dock.hidden = true;
    const dockText = element("span", "est-dock-text");
    const dockCount = element("span", "est-dock-count");
    const dockAmount = element("strong", "est-dock-amount");
    dockText.append(dockCount, dockAmount);
    const dockButton = button("est-dock-button");
    dockButton.textContent = "К смете";
    dockButton.addEventListener("click", () => receipt.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "center" }));
    dock.append(dockText, dockButton);
    receipt.after(dock);
    const phone = window.matchMedia("(max-width: 44rem)");
    let receiptInView = false;
    let calculatorInView = false;
    function syncDock() {
      dock.hidden = !(phone.matches && calculatorInView && !receiptInView && summary.lines.length);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => { receiptInView = entry.isIntersecting; syncDock(); }).observe(receipt);
      // Only while the calculator itself fills the middle of the screen.
      new IntersectionObserver(([entry]) => { calculatorInView = entry.isIntersecting; syncDock(); }, { rootMargin: "-25% 0px -35% 0px" }).observe(get(".est-layout"));
    }
    phone.addEventListener?.("change", syncDock);

    function displayTotal(animate) {
      cancelAnimationFrame(frame);
      const previous = previousMin;
      previousMin = summary.min;
      get(".est-readable-total").textContent = summary.totalText;
      const finalText = summary.totalText;
      if (!animate || reduced.matches || !Number.isFinite(previous) || !Number.isFinite(summary.min)
          || previous === summary.min || summary.partial || summary.max !== null && summary.max !== summary.min) {
        totalNode.textContent = finalText;
        return;
      }
      const goal = summary.min;
      const start = performance.now();
      const tick = now => {
        const t = Math.min(1, (now - start) / 310);
        const value = Math.round(previous + (goal - previous) * (1 - (1 - t) ** 3));
        totalNode.textContent = t < 1 ? engine.money(value, summary.max === null ? null : value) : finalText;
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    // Prices of the cards roll to the new value when the car changes.
    function setAmount(node, text, animate) {
      cancelAnimationFrame(amountFrames.get(node) || 0);
      const before = node.textContent;
      const pattern = /^(\D*?)(\d[\d\s\u00a0\u202f]*)(\D*)$/u;
      const from = before.match(pattern);
      const to = text.match(pattern);
      if (!animate || reduced.matches || !from || !to || from[1] !== to[1] || from[3] !== to[3]) {
        node.textContent = text;
        return;
      }
      const start = Number(from[2].replace(/\D/g, ""));
      const goal = Number(to[2].replace(/\D/g, ""));
      if (start === goal) { node.textContent = text; return; }
      const begin = performance.now();
      const format = new Intl.NumberFormat("ru-RU");
      const tick = now => {
        const t = Math.min(1, (now - begin) / 420);
        const value = Math.round(start + (goal - start) * (1 - (1 - t) ** 3));
        node.textContent = t < 1 ? to[1] + format.format(value) + to[3] : text;
        if (t < 1) amountFrames.set(node, requestAnimationFrame(tick));
      };
      amountFrames.set(node, requestAnimationFrame(tick));
    }

    function refreshPrices(announce) {
      for (const view of choiceButtons.values()) {
        const price = engine.price(view.choice.id);
        setAmount(view.value, price.priceText, announce);
        view.btn.dataset.adjusted = String(price.adjusted);
      }
      updateCart();
      const car = engine.describeVehicle();
      window.dispatchEvent(new CustomEvent("studio:vehicle", { detail: { vehicle: engine.vehicle, description: car } }));
      if (announce) get(".est-announcement").textContent = car ? "Цены пересчитаны для: " + car + "." : "Показаны базовые цены прайса.";
    }

    function syncChoices() {
      for (const [choiceId, view] of choiceButtons) {
        const selected = engine.selection.get(view.choice.groupId) === choiceId;
        view.btn.setAttribute("aria-pressed", String(selected));
        view.action.replaceChildren(icon(selected ? "check" : "plus"));
        view.btn.setAttribute("aria-label", (selected ? "Убрать из сметы: " : "Добавить в смету: ")
          + view.choice.title + ", " + (engine.price(view.choice.id)?.priceText || view.choice.priceText));
      }
      for (const [zoneId, view] of zoneButtons) {
        const hasItems = summary.lines.some(line => line.zoneId === zoneId);
        view.btn.dataset.inEstimate = String(hasItems);
        view.mark.hidden = !hasItems;
      }
    }

    function updateCart(message) {
      const previousIds = new Set(summary.lines.map(line => line.choiceId));
      summary = engine.summarize();
      const rows = summary.lines.map((line, index) => {
        const el = element("li", "est-line");
        if (message && !previousIds.has(line.choiceId)) el.classList.add("est-line-enter");
        const info = element("div", "est-line-info");
        info.append(element("span", "est-line-name", line.title), element("span", "est-line-price", line.priceText));
        if (line.condition) info.append(element("span", "est-line-note", line.condition));
        const remove = button("est-remove");
        remove.setAttribute("aria-label", "Убрать из сметы: " + line.title);
        remove.append(icon("close"));
        remove.addEventListener("click", () => {
          engine.remove(line.groupId);
          updateCart("Убрано: " + line.title);
          const next = cartList.querySelectorAll(".est-remove");
          (next[Math.min(index, next.length - 1)] || choiceList.querySelector("button") || zoneNav.querySelector("button"))?.focus({preventScroll:true});
        });
        el.append(info, remove);
        return el;
      });
      cartList.replaceChildren(...rows);
      const empty = !summary.lines.length;
      const vehicleLine = get(".est-vehicle");
      vehicleLine.hidden = !summary.vehicle;
      vehicleLine.replaceChildren("Для: ", element("strong", "", summary.vehicle || ""));
      get(".est-empty").hidden = !empty;
      cartList.hidden = empty;
      const counter = get(".est-count");
      counter.textContent = empty ? "" : plural(summary.lines.length);
      const hint = get(".est-condition");
      hint.textContent = summary.pendingCount ? "Стоимость уточнит студия." : "";
      if (summary.partial) hint.textContent = "Для части работ стоимость уточнит студия.";
      get(".est-total-heading span").textContent = summary.min === null ? "Итого" : "Предварительный итог";
      hint.hidden = !hint.textContent;
      const request = get(".est-request");
      request.disabled = empty;
      const requestSection = document.getElementById("request");
      request.hidden = !requestSection || requestSection.hidden;
      displayTotal(Boolean(message));
      dockCount.textContent = plural(summary.lines.length);
      dockAmount.textContent = summary.totalText;
      syncDock();
      syncChoices();
      refreshRules();
      if (message) get(".est-announcement").textContent = message + ". Итого: " + summary.totalText;
    }

    function renderChoices() {
      choiceButtons.clear();
      const details = get(".est-details-content");
      details.replaceChildren();
      const cards = activeGroup.choices.map(choice => {
        const btn = button("est-option");
        const top = element("span", "est-option-top");
        const action = element("span", "est-option-action");
        top.append(element("span", "est-option-name", choice.title), action);
        const weight = choice.facts?.find(fact => fact.value && /вес/iu.test(fact.label));
        const layers = [choice.rowTitle, choice.description].filter(Boolean).join(" ")
          .match(/(?:^|[\s,(])((?:\d{1,2}|один|два|три|четыре|пять|шесть)\s+сло(?:й|я|ёв|ев))(?=$|[\s,.)])/iu)?.[1];
        const meta = [layers, weight && weight.label + " " + weight.value].filter(Boolean).join(" · ");
        const price = engine.price(choice.id);
        const value = element("span", "est-option-amount", price.priceText);
        btn.dataset.adjusted = String(price.adjusted);
        btn.append(top);
        if (meta) btn.append(element("span", "est-option-facts", meta));
        btn.append(value);
        if (choice.unit && !choice.title.toLowerCase().includes(choice.unit.toLowerCase())
            && !choice.priceText.toLowerCase().includes(choice.unit.toLowerCase())) {
          btn.append(element("span", "est-option-unit", choice.unit));
        }
        const note = engine.evaluate(choice.id)?.condition;
        if (note) btn.append(element("span", "est-option-rule", note));
        btn.addEventListener("click", () => {
          const selected = engine.selection.get(choice.groupId) === choice.id;
          if (selected) engine.remove(choice.groupId);
          else engine.add(choice.id);
          updateCart((selected ? "Убрано: " : "Добавлено: ") + choice.title);
        });
        choiceButtons.set(choice.id, {btn, choice, action, value});
        const factSheet = element("div", "est-detail");
        factSheet.append(element("strong", "", choice.title));
        const notes = choice.notes?.length ? choice.notes : [choice.description].filter(Boolean);
        notes.forEach(note => factSheet.append(element("p", "", note)));
        if (choice.facts?.length) {
          factSheet.append(element("p", "est-detail-facts", choice.facts.map(fact => fact.label + " — " + fact.value).join(" · ")));
        }
        details.append(factSheet);
        return btn;
      });
      const prices = document.getElementById("prices");
      if (prices && !prices.hidden) {
        const url = new URL(location.href);
        url.searchParams.set("zone", activeZone.id);
        url.hash = "prices";
        const link = element("a", "est-catalog-link", "Открыть прайс по этой зоне");
        link.href = url.href;
        link.addEventListener("click", event => {
          if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          window.dispatchEvent(new CustomEvent("studio:zone", { detail: { zone: activeZone.id } }));
          location.hash = "prices";
          prices.scrollIntoView();
        });
        details.append(link);
      }
      choiceList.replaceChildren(...cards);
      choiceList.dataset.count = String(cards.length);
      get(".est-details").open = false;
      syncChoices();
    }

    function refreshRules() {
      for (const view of choiceButtons.values()) {
        let rule = view.btn.querySelector(".est-option-rule");
        const text = engine.evaluate(view.choice.id)?.condition;
        if (!text) { rule?.remove(); continue; }
        if (!rule) { rule = element("span", "est-option-rule"); view.btn.append(rule); }
        rule.textContent = text;
      }
    }

    function selectGroup(id) {
      activeGroup = activeZone.groups.find(group => group.id === id) || activeZone.groups[0];
      chosenGroup.set(activeZone.id, activeGroup.id);
      groupSelect.value = activeGroup.id;
      renderChoices();
    }

    function selectZone(zone) {
      activeZone = zone;
      for (const [id, view] of zoneButtons) view.btn.setAttribute("aria-pressed", String(id === zone.id));
      const groups = zone.groups.filter(group => group.choices.length);
      groupSelect.replaceChildren(...groups.map(group => new Option(group.title, group.id)));
      get(".est-work-select").hidden = groups.length < 2;
      selectGroup(chosenGroup.get(zone.id) || groups[0].id);
    }

    const zoneImages = new Map((window.STUDIO_ZONES || []).filter(zone => zone?.id).map(zone => [zone.id, zone.image]));
    for (const zone of zones) {
      const btn = button("est-zone");
      const mark = element("span", "est-zone-mark");
      mark.setAttribute("aria-hidden", "true");
      mark.hidden = true;
      mark.append(icon("check"));
      btn.append(zonePicture(zone.id, zoneImages.get(zone.id)), element("span", "est-zone-label", zone.title), mark);
      btn.addEventListener("click", () => selectZone(zone));
      zoneButtons.set(zone.id, {btn, mark});
      zoneNav.append(btn);
    }
    groupSelect.addEventListener("change", () => selectGroup(groupSelect.value));
    // Other sections (materials, price list) can put a package into the estimate.
    window.addEventListener("studio:estimate-select", event => {
      const zone = zones.find(item => item.id === event.detail?.zone);
      if (!zone) return;
      const wanted = String(event.detail?.title || "").toLocaleLowerCase("ru");
      const group = zone.groups.find(item => item.choices.some(choice => choice.title.toLocaleLowerCase("ru") === wanted)) || zone.groups[0];
      const choice = group.choices.find(item => item.title.toLocaleLowerCase("ru") === wanted) || group.choices[0];
      selectZone(zone);
      selectGroup(group.id);
      if (engine.selection.get(choice.groupId) !== choice.id) {
        engine.add(choice.id);
        updateCart("Добавлено: " + choice.title);
      }
      document.getElementById("calculator")?.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
    });
    get(".est-request").addEventListener("click", () => {
      if (!summary.lines.length) return;
      window.dispatchEvent(new CustomEvent("studio:quote", {detail: summary.quote}));
      location.hash = "request";
      document.querySelector("#request input:not([type=hidden]), #request textarea")?.focus({preventScroll:true});
    });
    selectZone(activeZone);
    updateCart();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, {once:true});
  else mount();
})();
