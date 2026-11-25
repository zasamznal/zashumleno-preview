(() => {
  const fallback = {
    contacts: {
      phone: "+7 910 005-77-05",
      address: "Москва, Варшавское шоссе, 152А",
      entrance: "Подземный паркинг, этаж −1",
      telegram: "https://t.me/Zashumleno"
    },
    legal: {}
  };

  function row(list, label, value, href) {
    if (typeof value !== "string" || !value.trim()) return;
    const group = document.createElement("div");
    const term = document.createElement("dt");
    const definition = document.createElement("dd");
    term.textContent = label;
    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = value.trim();
      definition.append(link);
    } else {
      definition.textContent = value.trim();
    }
    group.append(term, definition);
    list.append(group);
  }

  function emailRow(list, label, address) {
    const valid = typeof address === "string" && /^[^\s@?,#]+@[^\s@?,#]+\.[^\s@?,#]+$/.test(address);
    if (valid) row(list, label, address, "mailto:" + address);
  }

  function display(data) {
    const page = window.StudioPage ? window.StudioPage.normalize(data || {}) : (data || fallback);
    const contacts = page.contacts || fallback.contacts;
    const legal = page.legal || {};
    const brand = typeof page.brand === "string" ? page.brand : page.brand?.name || "Зашумлено";
    document.getElementById("legal-brand").textContent = brand;
    document.title = "Информация для клиентов — " + brand;
    if (window.StudioPage) {
      const logo = window.StudioPage.mediaUrl(page.brand.logo);
      const image = document.querySelector(".custom-brand-mark");
      const custom = Boolean(logo && !/(?:^|\/)(?:v2\/brand|assets\/mark)\.svg$/i.test(logo));
      image.hidden = !custom;
      document.querySelector(".legal-mark").hidden = custom;
      if (custom) image.src = logo;
    }
    const info = document.getElementById("studio-info");
    info.replaceChildren();
    row(info, "Студия", brand);
    row(info, legal.roleLabel || "Предприниматель или организация", legal.name);
    row(info, "ИНН", legal.inn);
    row(info, legal.registrationNumber?.length === 15 ? "ОГРНИП" : "ОГРН", legal.registrationNumber);
    row(info, "Дата регистрации", legal.registrationDate);
    row(info, "Регистрирующий орган", legal.registeringAuthority);
    row(info, "Адрес исполнителя", legal.legalAddress);
    row(info, "Адрес мастерской", [contacts.address, contacts.entrance].filter(Boolean).join(". "));
    row(info, "Режим работы", legal.hours);
    const phone = (contacts.phone || "").replace(/[^\d+]/g, "");
    row(info, "Телефон студии", contacts.phone, /^\+?\d{7,15}$/.test(phone) ? "tel:" + phone : "");
    emailRow(info, "Электронная почта", legal.email);
    emailRow(info, "Электронная почта в государственном реестре", legal.registryEmail);
    function verifiedLink(label, text, value, allowedHosts) {
      if (!value) return;
      try {
        const url = new URL(value, location.href);
        if (url.protocol !== "https:" && !(url.origin === location.origin && url.pathname.startsWith(new URL("assets/", document.baseURI).pathname))) return;
        if (url.username || url.password) return;
        if (allowedHosts.includes(url.hostname) || (url.origin === location.origin && url.pathname.startsWith(new URL("assets/", document.baseURI).pathname))) {
          row(info, label, text, url.href);
        }
      } catch { /* Other directly confirmed fields remain visible. */ }
    }
    verifiedLink("Проверка регистрации", "Сведения ФНС России", legal.sourceUrl, ["egrul.nalog.ru", "pb.nalog.ru", "www.nalog.gov.ru"]);
    verifiedLink("Источник режима работы", "Карточка мастерской", legal.hoursSourceUrl, ["yandex.ru", "yandex.com", "2gis.ru"]);
    const chat = window.StudioPage ? window.StudioPage.contactUrl("telegram", contacts.telegram) : fallback.contacts.telegram;
    if (chat) row(info, "Telegram студии", chat, chat);
    const owner = document.getElementById("owner-info");
    const ownerFields = owner.querySelector("dl");
    ownerFields.replaceChildren();
    row(ownerFields, "Наименование", legal.siteOwnerName);
    row(ownerFields, "Адрес", legal.siteOwnerAddress);
    emailRow(ownerFields, "Электронная почта", legal.siteOwnerEmail);
    owner.hidden = !ownerFields.children.length;
    const terms = document.getElementById("service-terms");
    terms.replaceChildren();
    row(terms, "Оплата", legal.payment);
    row(terms, "Сроки", legal.timing);
    row(terms, "Гарантии", legal.warranty);
    terms.hidden = !terms.children.length;
    const policy = document.getElementById("operator-policy");
    const policyText = typeof legal.policyText === "string" ? legal.policyText.trim() : "";
    policy.querySelector("p").textContent = policyText;
    policy.hidden = !policyText;
  }

  const contents = [...document.querySelectorAll(".legal-nav a")];
  const sections = contents.map(link => document.querySelector(link.hash));
  function updateContents() {
    const threshold = window.innerHeight * .24;
    let active = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top > threshold) break;
      active = section;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3) {
      active = sections[sections.length - 1];
    }
    for (const link of contents) {
      if (link.hash === "#" + active.id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }
  const observer = new IntersectionObserver(updateContents, { rootMargin: "-24% 0px -70% 0px" });
  sections.forEach(section => observer.observe(section));
  updateContents();
  display();
})();
