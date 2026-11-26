(() => {
  "use strict";

  function mount() {
    const host = document.querySelector("#request [data-quote]");
    if (!host || host.querySelector("form")) return;

    const page = window.StudioPage.current;
    const telegram = window.StudioPage.contactUrl("telegram", page.contacts.telegram);
    host.innerHTML = `
      <form class="zq-form" aria-label="Запрос расчёта" autocomplete="off">
        <div class="zq-field">
          <label for="zq-car">Марка и модель автомобиля</label>
          <input id="zq-car" type="text" placeholder="Например, Mitsubishi Pajero" list="zq-cars" maxlength="120" required>
          <datalist id="zq-cars"></datalist>
        </div>
        <div class="zq-field">
          <label for="zq-service">Что хотите сделать?</label>
          <div class="zq-select"><select id="zq-service"><option value="">Подобрать решение со студией</option></select></div>
        </div>
        <div class="zq-estimate" hidden>
          <div class="zq-estimate-head"><strong>Ваш выбор</strong><button type="button" class="zq-reset">Сбросить</button></div>
          <p class="zq-lines"></p><p class="zq-sum" hidden></p>
        </div>
        <button type="submit" class="zq-send"><svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path fill="currentColor" d="M21.4 3.2 18 20.5c-.1.8-.7 1.1-1.4.6l-5.1-3.8-2.5 2.5c-.3.3-.5.5-.9.5l.4-5.3L18.2 6c.4-.4-.1-.6-.5-.3L5.7 13.3l-5-1.6c-.9-.3-.9-1 .2-1.4L20 3c.8-.3 1.6.2 1.4.2Z"/></svg>Открыть в Telegram</button>
        <p class="zq-note">В Telegram откроется черновик сообщения. Вы сможете изменить его перед отправкой.</p>
        <div class="zq-links"><button type="button" class="zq-copy">Скопировать запрос</button><a class="zq-policy" href="privacy.html#request-form">Обработка персональных данных</a></div>
        <p class="zq-status" role="status"></p>
        <textarea class="zq-manual" aria-label="Текст запроса для копирования" rows="5" readonly hidden></textarea>
      </form>`;
    const form = host.querySelector("form");
    const car = form.querySelector("#zq-car");
    const service = form.querySelector("#zq-service");
    const selection = form.querySelector(".zq-estimate");
    const selectedLines = form.querySelector(".zq-lines");
    const sum = form.querySelector(".zq-sum");
    const note = form.querySelector(".zq-note");
    const copy = form.querySelector(".zq-copy");
    const status = form.querySelector(".zq-status");
    const manual = form.querySelector(".zq-manual");
    const send = form.querySelector(".zq-send");
    let estimate = "";
    let price = "";
    let body = "";

    if (!telegram) {
      send.hidden = true;
      note.textContent = "Скопируйте запрос для консультации со студией.";
    }
    const cars = [...new Set((window.STUDIO_WORKS || []).map(work => work.model).filter(Boolean))];
    const carList = form.querySelector("#zq-cars");
    cars.forEach(name => carList.append(new Option(name, name)));
    if (cars.length) car.placeholder = "Например, " + cars[0];

    function addOptions(label, options) {
      const titles = [...new Set(options.filter(Boolean))];
      if (!titles.length) return;
      const group = document.createElement("optgroup");
      group.label = label;
      titles.forEach(title => group.append(new Option(title, title)));
      service.append(group);
    }
    addOptions("Шумоизоляция", (window.STUDIO_ZONES || []).map(zone => zone.title && "Шумоизоляция — " + zone.title));
    addOptions("Другие услуги", (page.services || []).map(item => item.title));

    function clearFeedback() {
      status.textContent = "";
      manual.hidden = true;
      manual.value = "";
    }
    function clearEstimate() {
      price = "";
      estimate = "";
      body = "";
      selection.hidden = true;
      selectedLines.textContent = "";
      sum.textContent = "";
      sum.hidden = true;
      service.querySelector("option[data-transfer]")?.remove();
      clearFeedback();
    }
    function compose() {
      car.setCustomValidity(car.value.trim() ? "" : "Укажите марку и модель автомобиля.");
      if (!form.reportValidity()) return "";
      const greeting = page.contacts.person ? page.contacts.person + ", здравствуйте!" : "Здравствуйте!";
      // One line about the car: the model from the field plus the body type chosen in the calculator.
      const model = car.value.trim();
      const withBody = body && !model.toLocaleLowerCase("ru").includes(body.toLocaleLowerCase("ru")) ? model + ", " + body : model;
      const lines = [greeting + " Подскажите стоимость и сроки работ.", "Автомобиль — " + withBody + "."];
      if (service.value) lines.push("Выбранная услуга — " + service.value + ".");
      else lines.push("Помогите подобрать решение для моей машины.");
      const works = estimate.replace(/^Автомобиль — .*(?:\n|$)/u, "").trim();
      if (works) lines.push("", works);
      if (price) lines.push("Предварительная стоимость — " + price + ".");
      return lines.join("\n");
    }
    car.addEventListener("input", () => {
      car.setCustomValidity("");
      clearFeedback();
    });
    service.addEventListener("change", clearEstimate);
    form.querySelector(".zq-reset").addEventListener("click", () => {
      clearEstimate();
      service.value = "";
      service.focus({ preventScroll: true });
    });
    form.addEventListener("submit", event => {
      event.preventDefault();
      const text = compose();
      if (telegram && text) window.open(window.StudioPage.telegramDraftUrl(telegram, text), "_blank", "noopener,noreferrer");
    });
    copy.addEventListener("click", async () => {
      const text = compose();
      if (!text) return;
      clearFeedback();
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = "Запрос скопирован.";
      } catch {
        manual.value = text;
        manual.hidden = false;
        manual.focus({ preventScroll: true });
        manual.select();
        status.textContent = "Текст выделен. Нажмите «Копировать» в меню браузера.";
      }
    });
    window.addEventListener("studio:quote", ({ detail = {} }) => {
      if (typeof detail.model === "string" && detail.model.trim()) {
        car.value = detail.model.trim();
        car.setCustomValidity("");
      }
      if (typeof detail.service === "string" && detail.service.trim()) {
        clearEstimate();
        const title = detail.service.trim();
        if (![...service.options].some(option => option.value === title)) {
          const option = new Option(title, title);
          option.dataset.transfer = "";
          service.add(option);
        }
        service.value = title;
        price = String(detail.price ?? "").trim();
        estimate = typeof detail.estimate === "string" ? detail.estimate.trim() : "";
        body = typeof detail.body === "string" ? detail.body.trim().toLocaleLowerCase("ru") : "";
        selection.hidden = false;
        selectedLines.textContent = estimate || title;
        sum.textContent = price ? "Предварительно — " + price : "";
        sum.hidden = !price;
      }
      clearFeedback();
    });
  }
  Promise.resolve(window.STUDIO_READY ?? true).then(ready => { if (ready) mount(); });
})();
