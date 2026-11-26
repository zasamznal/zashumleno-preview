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

  function validEmail(address) {
    return typeof address === "string" && /^[^\s@?,#]+@[^\s@?,#]+\.[^\s@?,#]+$/.test(address);
  }

  function emailRow(list, label, address) {
    if (validEmail(address)) row(list, label, address, "mailto:" + address);
  }

  // Operator details inside a document text (the privacy policy). The page keeps its printed values
  // until the content arrives; a row whose value was cleared in the cabinet disappears.
  function fillFields(contacts, legal, brand) {
    const number = typeof legal.registrationNumber === "string" ? legal.registrationNumber.trim() : "";
    const email = [legal.email, legal.registryEmail].find(validEmail) || "";
    const phone = (contacts.phone || "").replace(/[^\d+]/g, "");
    const values = {
      brand,
      name: legal.name,
      inn: legal.inn,
      registrationNumber: number,
      registrationLabel: number.length === 13 ? "ОГРН" : "ОГРНИП",
      address: [contacts.address, contacts.entrance].filter(Boolean).join(". "),
      phone: contacts.phone,
      email,
      policyDate: legal.policyDate
    };
    const links = { phone: /^\+?\d{7,15}$/.test(phone) ? "tel:" + phone : "", email: email ? "mailto:" + email : "" };
    const text = key => typeof values[key] === "string" ? values[key].trim() : "";
    for (const element of document.querySelectorAll("[data-legal]")) {
      const key = element.dataset.legal;
      if (!text(key)) continue;
      element.textContent = text(key);
      if (element.matches("a") && links[key]) element.href = links[key];
    }
    for (const element of document.querySelectorAll("[data-legal-row]")) {
      element.hidden = !text(element.dataset.legalRow);
    }
  }

  function display(data) {
    const page = window.StudioPage ? window.StudioPage.normalize(data || {}) : (data || fallback);
    const contacts = page.contacts || fallback.contacts;
    const legal = page.legal || {};
    const brand = typeof page.brand === "string" ? page.brand : page.brand?.name || "Зашумлено";
    document.getElementById("legal-brand").textContent = brand;
    // «ЗАШУМЛЕНО» on the logo reads as a regular name in the browser tab.
    const tabName = brand === brand.toUpperCase() ? brand.charAt(0) + brand.slice(1).toLowerCase() : brand;
    document.title = document.title.replace(/ — [^—]*$/, "") + " — " + tabName;
    if (window.StudioPage) {
      const colors = { accent: "--accent", darkAccent: "--accent-dark", altAccent: "--accent-alt", nightColor: "--night", paperColor: "--paper" };
      for (const [key, variable] of Object.entries(colors)) {
        if (/^#[0-9a-f]{6}$/i.test(page.brand[key] || "")) document.documentElement.style.setProperty(variable, page.brand[key]);
      }
      const logo = window.StudioPage.mediaUrl(page.brand.logo);
      const image = document.querySelector(".custom-brand-mark");
      const custom = Boolean(logo && !/(?:^|\/)(?:v2\/brand|assets\/mark)\.svg$/i.test(logo));
      image.hidden = !custom;
      document.querySelector(".legal-mark").hidden = custom;
      if (custom) image.src = logo;
    }
    fillFields(contacts, legal, brand);
    const info = document.getElementById("studio-info");
    if (info) details(info, contacts, legal, brand);
    const owner = document.getElementById("owner-info");
    if (owner) {
      const ownerFields = owner.querySelector("dl");
      ownerFields.replaceChildren();
      row(ownerFields, "Наименование", legal.siteOwnerName);
      row(ownerFields, "Адрес", legal.siteOwnerAddress);
      emailRow(ownerFields, "Электронная почта", legal.siteOwnerEmail);
      owner.hidden = !ownerFields.children.length;
    }
    const terms = document.getElementById("service-terms");
    if (terms) {
      terms.replaceChildren();
      row(terms, "Оплата", legal.payment);
      row(terms, "Сроки", legal.timing);
      row(terms, "Гарантии", legal.warranty);
      terms.hidden = !terms.children.length;
    }
    const policy = document.getElementById("operator-policy");
    if (policy) {
      const policyText = typeof legal.policyText === "string" ? legal.policyText.trim() : "";
      policy.querySelector("p").textContent = policyText;
      policy.hidden = !policyText;
    }
  }

  // Requisites list of the page «Информация для клиентов».
  function details(info, contacts, legal, brand) {
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
