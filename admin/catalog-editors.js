(() => {
  "use strict";

  const labels = {
    prices: { title: "Прайс", add: "Добавить тариф", single: "Тариф", search: "Поиск по тарифам" },
    zones: { title: "Зоны работ", add: "Добавить зону", single: "Зона", search: "Поиск по зонам" },
    works: { title: "Работы студии", add: "Добавить работу", single: "Работа", search: "Поиск по модели или услуге" }
  };
  const originalGroups = { doors: "Двери", arches: "Арки и шины", floor: "Пол", trunk: "Багажник", roof: "Потолок", dashboard: "Торпедо" };
  const groupOf = zone => zone.group || originalGroups[zone.id] || zone.title;
  const uniqueId = () => "zone-" + crypto.randomUUID().slice(0, 12);
  const itemName = (kind, item) => kind === "works" ? [item.model, item.title].filter(Boolean).join(" · ") : item.title;

  function node(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text != null) result.textContent = text;
    return result;
  }

  function action(text, onClick, variant = "") {
    const button = node("button", "cat-btn " + variant, text);
    button.type = "button";
    button.addEventListener("click", onClick);
    return button;
  }

  function field(label, value, onInput, options = {}) {
    const wrap = node("label", "cat-field");
    wrap.append(node("span", "", label));
    const input = node(options.lines ? "textarea" : "input");
    input.setAttribute("aria-label", label);
    if (options.lines) input.rows = options.lines;
    else input.type = "text";
    input.value = value || "";
    if (options.placeholder) input.placeholder = options.placeholder;
    if (options.max) input.maxLength = options.max;
    input.addEventListener(options.commit ? "change" : "input", () => onInput(input.value));
    wrap.append(input);
    return wrap;
  }

  function confirmRemove(container, message, confirmAction) {
    const dialog = node("dialog", "cat-dialog");
    const prompt = node("p", "", message);
    dialog.setAttribute("aria-label", message);
    const controls = node("div", "cat-actions");
    controls.append(action("Отмена", () => dialog.close()), action("Удалить", () => {
      dialog.close();
      confirmAction();
    }, "cat-danger"));
    dialog.append(prompt, controls);
    container.append(dialog);
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    dialog.showModal();
    controls.firstChild.focus();
  }

  function shift(array, source, target) {
    if (target < 0 || target >= array.length) return;
    [array[source], array[target]] = [array[target], array[source]];
  }

  function moveButton(direction, disabled, callback, noun) {
    const title = (direction < 0 ? "Поднять " : "Опустить ") + noun;
    const button = action(direction < 0 ? "↑" : "↓", callback, "cat-move");
    button.title = title;
    button.setAttribute("aria-label", title);
    button.disabled = disabled;
    return button;
  }

  function blank(kind, data) {
    if (kind === "prices") return {
      title: "Новый тариф", group: data.zones.length ? groupOf(data.zones[0]) : "Услуги",
      columns: ["Услуга", "Стоимость"], rows: [["Новая услуга", "По запросу"]], notes: [], source: "", sheet: ""
    };
    if (kind === "zones") {
      let name = "Новая зона";
      for (let i = 2; data.zones.some(zone => groupOf(zone) === name); i++) name = "Новая зона " + i;
      return { id: uniqueId(), title: name, group: name, description: "", details: [], source: "", image: "" };
    }
    return { model: "Модель автомобиля", title: "Новая работа", description: "", url: "", image: "", video: "" };
  }

  function check(kind, items) {
    for (const [index, item] of items.entries()) {
      const prefix = labels[kind].single + " «" + (itemName(kind, item) || String(index + 1)) + "». ";
      if (!item.title.trim()) return prefix + "Укажите название.";
      if (kind === "works" && !item.model.trim()) return prefix + "Укажите модель автомобиля.";
      if (kind === "works" && item.video && !window.StudioPage.mediaUrl(item.video)) {
        return prefix + "Проверьте адрес видео или выберите MP4 с компьютера.";
      }
      if (kind === "prices") {
        if (!item.group.trim()) return prefix + "Выберите зону.";
        if (!item.columns.length || item.columns.some(value => !value.trim())) return prefix + "Назовите каждый столбец.";
        if (!item.rows.length || item.rows.some(row => row.length !== item.columns.length || row.some(value => !value.trim()))) {
          return prefix + "Заполните ячейки таблицы. Для цены по запросу укажите «По запросу».";
        }
      }
    }
  }

  function renderCatalog(ctx, kind) {
    const items = ctx.data[kind];
    const config = labels[kind];
    const root = node("div", "cat-editor");
    const pendingUploads = new Set();
    ctx.host.append(root);
    let query = "";
    let selectedGroup = "";
    let openRecord;

    function invalidateArchive() {
      if (kind === "prices" && ctx.data.page?.priceArchive) ctx.data.page.priceArchive = "";
    }

    function changePrice(item) {
      invalidateArchive();
      if (item.sheet || item.source) {
        item.sheet = "";
        item.source = "";
        root.querySelectorAll("[data-original-input]").forEach(input => { input.value = ""; });
        root.querySelector(".cat-media-preview")?.replaceChildren();
        const status = root.querySelector(".cat-file-status");
        if (status) status.textContent = "Старый прайс-лист отвязан. После редактирования можно прикрепить обновлённый файл.";
      }
      ctx.change();
    }

    function redrawList(focusItem) {
      openRecord = null;
      root.replaceChildren();
      const controls = node("div", "cat-toolbar");
      const search = field(config.search, query, value => { query = value; renderRows(); }, { placeholder: config.search });
      search.classList.add("cat-search");
      controls.append(search);
      if (kind === "prices") {
        const label = node("label", "cat-field cat-select");
        label.append(node("span", "", "Зона"));
        const select = node("select");
        select.setAttribute("aria-label", "Зона");
        select.append(new Option("Все зоны", ""));
        for (const group of new Set(items.map(item => item.group))) select.append(new Option(group, group));
        if (!Array.from(select.options).some(option => option.value === selectedGroup)) selectedGroup = "";
        select.value = selectedGroup;
        select.onchange = () => { selectedGroup = select.value; renderRows(); };
        label.append(select);
        controls.append(label);
      }
      controls.append(action(config.add, () => {
        const fresh = blank(kind, ctx.data);
        if (kind === "prices" && selectedGroup) fresh.group = selectedGroup;
        items.push(fresh);
        invalidateArchive();
        ctx.change();
        edit(fresh, true);
      }, "cat-primary"));
      const summary = node("p", "cat-count");
      summary.setAttribute("role", "status");
      const list = node("div", "cat-list");
      root.append(controls, summary, list);
      function renderRows() {
        list.replaceChildren();
        const q = query.trim().toLocaleLowerCase("ru");
        const filtered = items.filter(item => (!selectedGroup || item.group === selectedGroup) &&
          [item.title, item.model, item.group, item.description].some(value => String(value || "").toLocaleLowerCase("ru").includes(q)));
        summary.textContent = "Показано " + filtered.length + " из " + items.length;
        for (const item of filtered) {
          const row = node("div", "cat-list-row");
          const info = node("div", "cat-list-info");
          const name = itemName(kind, item) || config.single;
          const enter = action(name, () => edit(item, true), "cat-name");
          info.append(enter);
          const money = item.rows?.[0]?.find(value => /₽|руб/i.test(value));
          const sub = kind === "prices" ? [item.group, money].filter(Boolean).join(" · ") :
            kind === "zones" ? "Тарифов в зоне: " + ctx.data.prices.filter(rate => rate.group === groupOf(item)).length : item.description;
          if (sub) info.append(node("span", "cat-list-detail", sub));
          const tools = node("div", "cat-actions");
          const peers = kind === "prices" ? items.filter(rate => rate.group === item.group) : items;
          const pos = peers.indexOf(item);
          const move = delta => {
            shift(items, items.indexOf(item), items.indexOf(peers[pos + delta]));
            ctx.change();
            redrawList(item);
          };
          tools.append(moveButton(-1, pos === 0, () => move(-1), name), moveButton(1, pos === peers.length - 1, () => move(1), name));
          row.append(info, tools);
          list.append(row);
          if (item === focusItem) enter.focus();
        }
        if (!filtered.length) list.append(node("p", "cat-empty", items.length ? "Ничего не найдено. Измените поиск или фильтр." : "Раздел пуст. Добавьте первую запись."));
      }
      renderRows();
    }

    function edit(item, focus) {
      openRecord = item;
      root.replaceChildren();
      const head = node("div", "cat-panel-head");
      head.append(action("К списку", () => redrawList(item)), node("h3", "", itemName(kind, item) || config.single));
      const fields = node("div", "cat-fields");
      function property(label, key, options = {}) {
        return field(label, item[key], value => {
          if (item[key] === value) return;
          item[key] = value;
          if (kind === "prices" && !["sheet", "source"].includes(key)) changePrice(item);
          else ctx.change();
          if (key === "title" || key === "model") head.lastChild.textContent = itemName(kind, item);
        }, options);
      }
      function listProperty(label, key) {
        const input = field(label, (item[key] || []).join("\n"), value => {
          item[key] = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
          if (kind === "prices") changePrice(item); else ctx.change();
        }, { lines: 4 });
        input.append(node("small", "", "Каждый пункт с новой строки."));
        return input;
      }
      function attachment(label, key, format = "image") {
        const pdfAllowed = format === "sheet";
        const video = format === "video";
        const limit = video ? 32 : 5;
        const box = node("div", "cat-attachment");
        const linkField = property(label, key, { placeholder: video ? "Загрузите MP4 или укажите прямую HTTPS-ссылку на видео" : "Выберите файл или вставьте ссылку" });
        const linkInput = linkField.querySelector("input");
        if (kind === "prices") linkInput.dataset.originalInput = "";
        box.append(linkField);
        const preview = node("div", "cat-media-preview");
        function renderPreview() {
          preview.replaceChildren();
          if (!item[key] || (video && !window.StudioPage.mediaUrl(item[key]))) return;
          let link;
          try { link = new URL(item[key], window.StudioKit?.siteRoot?.() || new URL("/", location.href)); } catch { return; }
          if (!["https:", "http:"].includes(link.protocol)) return;
          if (pdfAllowed) {
            const open = node("a", "cat-preview-link", "Посмотреть прикреплённый лист");
            open.href = link.href;
            open.target = "_blank";
            open.rel = "noopener noreferrer";
            preview.append(open);
          } else if (video) {
            const player = node("video");
            player.controls = true;
            player.playsInline = true;
            player.preload = "none";
            player.setAttribute("aria-label", "Предпросмотр видео работы");
            player.src = link.href;
            preview.append(player);
          } else {
            const image = node("img");
            image.alt = "Прикреплённое фото";
            image.referrerPolicy = "no-referrer";
            image.src = link.href;
            preview.append(image);
          }
        }
        linkInput.addEventListener("change", renderPreview);
        renderPreview();
        box.append(preview);
        if (!ctx.upload) return box;
        const file = node("input", "cat-file-input");
        file.type = "file";
        file.accept = video ? "video/mp4,.mp4" : "image/jpeg,image/png,image/webp" + (pdfAllowed ? ",application/pdf" : "");
        const upload = action("Выбрать файл", () => file.click());
        const choice = node("div", "cat-upload-line");
        const formats = video ? "MP4" : pdfAllowed ? "JPG, PNG, WebP или PDF" : "JPG, PNG или WebP";
        const help = node("small", "", formats + " · до " + limit + " МБ");
        help.setAttribute("role", "status");
        file.onchange = async () => {
          const target = file.files[0];
          if (!target) return;
          if (target.size > limit * 1024 * 1024) { help.textContent = "Файл больше " + limit + " МБ."; return; }
          if (video && (target.type ? target.type !== "video/mp4" : !/\.mp4$/i.test(target.name))) {
            help.textContent = "Выберите видео в формате MP4.";
            return;
          }
          upload.disabled = true;
          help.textContent = "Загружаем…";
          pendingUploads.add(file);
          try {
            const path = await ctx.upload(target);
            if (!items.includes(item)) return;
            item[key] = path;
            linkInput.value = path;
            renderPreview();
            ctx.change();
            help.textContent = "Файл загружен.";
          } catch (error) {
            help.textContent = error.message || "Не удалось загрузить файл.";
          } finally {
            pendingUploads.delete(file);
            file.value = "";
            upload.disabled = false;
          }
        };
        choice.append(file, upload, help);
        box.append(choice);
        return box;
      }
      if (kind === "prices") {
        fields.append(property("Название тарифа", "title"));
        const area = node("label", "cat-field");
        area.append(node("span", "", "Зона работ"));
        const select = node("select");
        select.setAttribute("aria-label", "Зона работ");
        const names = new Set([...ctx.data.zones.map(groupOf), ...items.map(rate => rate.group), item.group]);
        for (const name of names) if (name) select.append(new Option(name, name));
        select.value = item.group;
        select.onchange = () => { item.group = select.value; changePrice(item); };
        area.append(select);
        fields.append(area, tableEditor(item, () => changePrice(item), root), listProperty("Материалы и условия", "notes"));
        // Car pricing: tyre kits and per-door options keep a fixed price by default.
        const carBox = node("label", "cat-check");
        const carInput = node("input");
        carInput.type = "checkbox";
        const rateIndex = ctx.data.prices.indexOf(item);
        const engine = window.StudioEstimate?.create(ctx.data.prices, ctx.data.zones);
        const sample = engine?.zones.flatMap(zone => zone.groups.flatMap(group => group.choices))
          .find(choice => choice.id.startsWith("estimate-" + rateIndex + "-"));
        carInput.checked = typeof item.carDependent === "boolean" ? item.carDependent : sample ? sample.scalable : true;
        carInput.addEventListener("change", () => { item.carDependent = carInput.checked; ctx.change(); });
        carBox.append(carInput, node("span", "", "Цена зависит от машины"),
          node("small", "", "Калькулятор добавит наценку за кузов и марку из раздела «Цены по автомобилю». Снимите галочку для фиксированных цен — например, наборов для шин."));
        fields.append(carBox);
        if (Array.isArray(item.layers)) {
          const layersNote = node("p", "cat-file-status", "Слои материалов этого комплекта настраиваются в разделе «Материалы и слои».");
          const go = action("Открыть «Материалы и слои»", () => window.StudioAdmin.navigate("materials"));
          fields.append(layersNote, go);
        }
        const source = property("Ссылка на папку с оригиналом", "source");
        source.querySelector("input").dataset.originalInput = "";
        const note = node("p", "cat-file-status", "При изменении тарифа старый лист отвязывается. Прикрепите новую версию после правок.");
        note.setAttribute("role", "status");
        fields.append(note, attachment("Оригинальный прайс-лист", "sheet", "sheet"), source);
      } else if (kind === "zones") {
        fields.append(property("Название зоны", "title"));
        const groupField = field("Название группы в прайсе", groupOf(item), value => {
          const previous = groupOf(item);
          const next = value.trim();
          if (!next || ctx.data.zones.some(zone => zone !== item && groupOf(zone) === next)) {
            groupField.querySelector("input").value = previous;
            ctx.notify("Укажите отдельное название группы.");
            return;
          }
          item.group = next;
          ctx.data.prices.filter(rate => rate.group === previous).forEach(rate => { rate.group = next; });
          ctx.change();
        }, { commit: true });
        groupField.append(node("small", "", "Это название показывается на кнопке фильтра. Привязанные тарифы перейдут в переименованную группу."));
        fields.append(groupField, property("Короткое описание", "description", { lines: 3 }), listProperty("Подробности зоны", "details"),
          attachment("Фото зоны", "image"), property("Ссылка на материалы студии", "source"));
        const galleryCount = Array.isArray(item.gallery) ? item.gallery.length : 0;
        fields.append(node("p", "cat-file-status", "Фото готовых работ этой зоны: " + galleryCount + ". Добавить или заменить их можно в разделе «Фото и видео»."),
          action("Открыть «Фото и видео»", () => window.StudioAdmin.navigate("media")));
      } else {
        fields.append(property("Марка и модель", "model"), property("Какая работа выполнена", "title"),
          property("Описание работы", "description", { lines: 4 }), attachment("Фотография работы", "image"),
          attachment("Видео работы", "video", "video"),
          property("Ссылка на публикацию", "url", { placeholder: "https://t.me/…" }));
      }
      const bottom = node("div", "cat-panel-actions");
      bottom.append(action("Дублировать", () => {
        const copy = structuredClone(item);
        copy.title += " (копия)";
        if (kind === "zones") {
          copy.id = uniqueId();
          let next = groupOf(item) + " (копия)";
          for (let i = 2; items.some(zone => groupOf(zone) === next); i++) next = groupOf(item) + " (копия " + i + ")";
          copy.group = next;
        }
        if (kind === "prices") { copy.sheet = ""; copy.source = ""; }
        items.splice(items.indexOf(item) + 1, 0, copy);
        invalidateArchive();
        ctx.change();
        edit(copy, true);
      }));
      bottom.append(action("Удалить", () => {
        if (kind === "zones" && ctx.data.prices.some(rate => rate.group === groupOf(item))) {
          ctx.notify("Эта зона используется в прайсе. Перенесите её тарифы в другую зону или удалите их.");
          return;
        }
        confirmRemove(root, "Удалить «" + itemName(kind, item) + "» из черновика?", () => {
          items.splice(items.indexOf(item), 1);
          invalidateArchive();
          ctx.change();
          redrawList();
        });
      }, "cat-danger"));
      root.append(head, fields, bottom);
      if (focus) head.firstChild.focus();
    }

    redrawList();
    return () => {
      if (openRecord && pendingUploads.size) return "Дождитесь окончания загрузки файла.";
      return check(kind, items);
    };
  }

  function tableEditor(item, change, container) {
    const section = node("section", "cat-table");
    function refresh() {
      section.replaceChildren();
      section.append(node("h4", "", "Таблица цен"));
      const headings = node("details", "cat-columns");
      headings.append(node("summary", "", "Столбцы таблицы"));
      const inputs = node("div", "cat-fields");
      item.columns.forEach((name, index) => {
        const row = node("div", "cat-column");
        const label = field("Название столбца " + (index + 1), name, value => {
          item.columns[index] = value;
          section.querySelectorAll('[data-column="' + index + '"]').forEach(span => {
            span.textContent = value;
            span.nextElementSibling.setAttribute("aria-label", value);
          });
          change();
        });
        const remove = action("Убрать", () => confirmRemove(container, "Удалить столбец «" + name + "» и его значения?", () => {
          item.columns.splice(index, 1);
          item.rows.forEach(row => row.splice(index, 1));
          change();
          refresh();
          section.querySelector("details").open = true;
        }), "cat-danger");
        remove.disabled = item.columns.length <= 1;
        row.append(label, remove);
        inputs.append(row);
      });
      const addCol = action("Добавить столбец", () => {
        item.columns.push("Новый столбец");
        item.rows.forEach(row => row.push("—"));
        change();
        refresh();
        const detail = section.querySelector("details");
        detail.open = true;
        const inputs = detail.querySelectorAll("input");
        inputs[inputs.length - 1].select();
      });
      headings.append(inputs, addCol);
      section.append(headings);
      item.rows.forEach((row, rowIndex) => {
        const card = node("fieldset", "cat-rate-row");
        card.append(node("legend", "", "Строка " + (rowIndex + 1)));
        const grid = node("div", "cat-value-grid");
        item.columns.forEach((name, index) => {
          const label = field(name, row[index], value => { row[index] = value; change(); });
          label.firstChild.dataset.column = index;
          grid.append(label);
        });
        const buttons = node("div", "cat-actions");
        function move(delta) {
          shift(item.rows, rowIndex, rowIndex + delta);
          change();
          refresh();
        }
        const remove = action("Удалить строку", () => confirmRemove(container, "Удалить строку " + (rowIndex + 1) + "?", () => {
          item.rows.splice(rowIndex, 1);
          change();
          refresh();
        }), "cat-danger");
        remove.disabled = item.rows.length <= 1;
        buttons.append(moveButton(-1, rowIndex === 0, () => move(-1), "строку"), moveButton(1, rowIndex === item.rows.length - 1, () => move(1), "строку"), remove);
        card.append(grid, buttons);
        section.append(card);
      });
      section.append(action("Добавить строку", () => {
        item.rows.push(item.columns.map(() => ""));
        change();
        refresh();
        const all = section.querySelectorAll("fieldset");
        all[all.length - 1].querySelector("input").focus();
      }));
    }
    refresh();
    return section;
  }

  const placement = { prices: ["Цены", 10], zones: ["Цены", 30], works: ["Фото и работы", 20] };
  for (const kind of Object.keys(labels)) window.StudioAdmin.register({
    id: kind, title: labels[kind].title, group: placement[kind][0], order: placement[kind][1],
    description: {
      prices: "Комплекты, стоимость, состав работ и оригиналы прайс-листов. Цены указаны для седана массовой марки.",
      zones: "Группы в прайсе, фотографии и описания зон автомобиля.",
      works: "Автомобили, фотографии и видео готовых работ студии."
    }[kind],
    validateData: data => check(kind, data[kind]),
    render: ctx => renderCatalog(ctx, kind)
  });
})();
