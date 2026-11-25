(() => {
  'use strict';

  // Both levels are schematic. The landmarks and their order come from the studio's arrival video.
  const floorplan = `
    <svg class="route-drawing" viewBox="0 0 560 315" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="route-roof" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7 7 0" stroke="#a1b3a3" stroke-width=".7"/></pattern>
        <pattern id="route-concrete" width="11" height="11" patternUnits="userSpaceOnUse"><circle cx="3" cy="5" r=".65" fill="#57615a"/></pattern>
        <pattern id="route-parking" width="19" height="9" patternUnits="userSpaceOnUse"><path d="m0 9 9-9" stroke="#5d7167" stroke-width="1"/></pattern>
        <g id="route-parked"><rect x="-6" y="-13" width="12" height="26" rx="4" fill="#50645d" stroke="#95a59b" stroke-width=".8"/><path d="m-4-7 8 0-1 4h-6zM-4 7h8l-1-3h-6z" fill="#263a35"/></g>
        <path id="route-above-path" d="M13 94 98 94Q116 94 128 86L159 65Q171 56 183 56H203"/>
        <path id="route-below-path" d="M37 241H394Q408 241 417 234L431 224"/>
      </defs>
      <rect width="560" height="137" fill="#dce4d8"/>
      <path d="M0 13h100l-9 30-35 20H0zM466 110h94v27h-113z" fill="#b4cbb4"/>
      <path d="M0 18h76M0 24h71M0 30h64" stroke="#a2baa3" fill="none"/>
      <path d="M-15 94H100Q115 94 130 85l33-23q12-7 33-7h63" fill="none" stroke="#b2baad" stroke-width="46"/>
      <path d="M-15 94H100Q115 94 130 85l33-23q12-7 33-7h63" fill="none" stroke="#f4f2e8" stroke-width="41"/>
      <path d="M-10 82h92M-10 106h95" stroke="#c9cbbd" stroke-width="1" stroke-dasharray="12 8"/>
      <path d="M-15 136h126l52-22 56-8 40 3M7 59l92-4 44-39" stroke="#becbbb" stroke-width="1.3" fill="none"/>
      <path d="m220-5 306 0 34 18v82l-63 11-64-11H279l-45-9-24-20V9z" fill="#aeb9a7"/>
      <path d="m219-9 307 0 34 18v81l-63 11-64-11H280l-46-9-24-20V4z" fill="#c8d4c2" stroke="#8b9b89" stroke-width="1.4"/>
      <path d="m230-3 290 0 32 15v72l-54 9-65-11H281l-43-8-21-18V8z" fill="url(#route-roof)" stroke="#a4b09e"/>
      <rect x="254" y="30" width="195" height="36" rx="4" fill="#d7e1d1"/>
      <text x="269" y="54" class="route-place">ТЦ «Сомбреро»</text>
      <g fill="#c0ccb9" stroke="#a1af9a" stroke-width="1.2"><path d="M466 13h54l9 6h-63z"/><rect x="466" y="19" width="63" height="11"/><path d="M472 23h46m-46 3h46"/></g>
      <path d="M209 42v26l-9-3V45z" fill="#46534b"/><path d="m201 46 8-3v21l-8 2z" fill="#152f2a"/>
      <g fill="#576e62"><path d="m238 70 5-5 6 7-5 4zm12 4 5-6 6 7-5 4zm12 3 5-6 6 7-5 4z"/></g>
      <text x="153" y="29" class="route-annotation">Въезд</text>
      <path d="m189 31 11 9" fill="none" stroke="#5a7060"/>
      <g class="route-road-label"><rect x="16" y="8" width="67" height="24" rx="3"/><text x="25" y="25">Улица</text></g>
      <text x="21" y="127" class="route-address">Варшавское ш., 152А</text>
      <use href="#route-above-path" fill="none" stroke="#559d88" stroke-width="5" stroke-linecap="round"/>
      <use href="#route-above-path" class="route-trace route-trace-above" pathLength="100" fill="none" stroke="#007461" stroke-width="5" stroke-linecap="round"/>
      <circle cx="13" cy="94" r="4.5" fill="#007461" stroke="#fbfff8" stroke-width="2"/>
      <path d="M0 137h560v178H0z" fill="#24352f"/>
      <path d="M0 137h560v178H0z" fill="url(#route-concrete)"/>
      <path d="M0 137h560" stroke="#101f19" stroke-width="3"/>
      <path d="M0 206h560v66H0z" fill="#344840"/>
      <path d="M0 207h560m-560 64h560" fill="none" stroke="#65776a" stroke-width="2"/>
      <path d="M0 244h560" fill="none" stroke="#7f9385" stroke-width="1" stroke-dasharray="12 13"/>
      <g fill="none" stroke="#7e9484" stroke-width="1.25">
        <path d="M175 168v36h133v-36m-105 0v36m27-36v36m27-36v36m26-36v36"/>
        <path d="M251 311v-36h137v36m-109 0v-36m27 36v-36m27 36v-36m27 36v-36"/>
      </g>
      <use href="#route-parked" transform="translate(216 186)"/><use href="#route-parked" transform="translate(270 186)"/>
      <use href="#route-parked" transform="translate(292 293)"/><use href="#route-parked" transform="translate(347 293)"/>
      <path d="M0 211h63l9 9-13 13H0" fill="url(#route-parking)"/>
      <g fill="#a7b5a4" stroke="#394a3e"><path d="M162 198h8v11h-8zM318 198h8v11h-8zM237 269h8v11h-8zM394 269h8v11h-8z"/></g>
      <g class="route-road-label route-level-label"><rect x="16" y="147" width="111" height="25" rx="3"/><text x="25" y="165">Паркинг −1</text></g>
      <g><path d="M403 151h123v58h-18v-6h-82v6h-23z" fill="#496d5d" stroke="#91b6a0" stroke-width="1.4"/>
        <path d="M412 156h105v39H412z" fill="#2e5546"/><path d="M420 202h83" stroke="#bfe8d6" stroke-width="3"/>
        <text x="465" y="181" text-anchor="middle" class="route-garage-label">Бокс студии</text>
        <path d="m431 223 11-12" stroke="#b1d7be" stroke-width="1.6" stroke-dasharray="3 3"/>
      </g>
      <text x="95" y="298" class="route-underground-label">Шлагбаум</text><path d="m148 284 7-20" fill="none" stroke="#b1c6b7"/>
      <use href="#route-below-path" fill="none" stroke="#628e7d" stroke-width="5" stroke-linecap="round"/>
      <use href="#route-below-path" class="route-trace route-trace-below" pathLength="100" fill="none" stroke="#7ce7d2" stroke-width="5" stroke-linecap="round"/>
      <circle cx="431" cy="224" r="6" fill="#8df4db" stroke="#162e25" stroke-width="2.5"/>
      <g class="route-boom"><path d="M158 261v-39" stroke="#132720" stroke-width="7"/><path d="M158 261v-39" stroke="#e9e9ce" stroke-width="4"/><path d="M158 261v-39" stroke="#a5523d" stroke-width="4" stroke-dasharray="6 6"/></g>
      <circle cx="158" cy="261" r="4.5" fill="#e7c88c" stroke="#23352b" stroke-width="2"/>
      <g class="route-vehicle" transform="translate(18 94)">
        <ellipse cx="0" cy="1" rx="17" ry="10" fill="#203d34" opacity=".22"/>
        <g fill="#162b25"><rect x="-9" y="-8" width="6" height="3" rx="1"/><rect x="4" y="-8" width="5" height="3" rx="1"/><rect x="-9" y="5" width="6" height="3" rx="1"/><rect x="4" y="5" width="5" height="3" rx="1"/></g>
        <rect x="-13.5" y="-6.6" width="27" height="13.2" rx="4.8" fill="#faffec" stroke="#0b4034" stroke-width="1.5"/>
        <path d="m-7-4.7 11-.3 3.4 2.1v5.2L4 5l-11-.3-2-2v-5.4Z" fill="#187566"/><path d="m2-4.6 3.9 1.9v5.4L2 4.7zm-7 .2-2 1.5v5.8l2 1.4" fill="#123a33"/>
        <path d="M11-4v2m0 4v2" stroke="#e9ca84" stroke-width="1.3"/>
      </g>
    </svg>`;

  const stages = [
    { title: 'Въезд', start: 0, end: 5.3, parked: 4.9, text: 'У ТЦ «Сомбреро» заезжайте под зелёную вывеску «Въезд» и спускайтесь на этаж −1.' },
    { title: 'Шлагбаум', start: 5.3, end: 10.1, parked: 8.8, text: 'Проезжайте прямо через двери. У шлагбаума остановитесь и позвоните в студию, чтобы вам открыли.' },
    { title: 'Бокс', start: 10.1, end: 17, parked: 17, text: 'За шлагбаумом езжайте прямо до поворота. Крайний бокс слева — студия.' }
  ];

  const canonical = value => String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9]/gi, '');
  function fits(contacts) {
    const address = canonical(contacts.address).replace(/^г(?:ород)?москва|^москва/, '');
    const entrance = canonical(contacts.entrance);
    return /^варшавское(?:шоссе|ш)(?:дом|д)?152[аa]$/.test(address)
      && /паркинг/.test(entrance) && /(?:этаж1|1этаж)/.test(entrance)
      && /[−–-]\s*1|минус\s*(?:1|перв)/i.test(contacts.entrance || '');
  }

  function create(contacts) {
    if (!fits(contacts)) return null;
    const card = document.createElement('section');
    card.className = 'route-card';
    card.setAttribute('aria-labelledby', 'route-heading');
    card.innerHTML = `
      <div class="route-header"><h3 id="route-heading">Схема проезда</h3><button type="button" class="route-toggle"></button></div>
      ${floorplan}
      <div class="route-directions"><div class="route-stages" role="group" aria-label="Этапы проезда"></div>
      <div class="route-instruction"><p></p></div></div>`;
    const buttons = stages.map((stage, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = '<span aria-hidden="true">' + (index + 1) + '</span>' + stage.title;
      btn.setAttribute('aria-controls', 'route-step-copy');
      card.querySelector('.route-stages').append(btn);
      return btn;
    });
    const copy = card.querySelector('.route-instruction p');
    copy.id = 'route-step-copy';
    const phone = document.createElement('a');
    phone.className = 'route-phone';
    phone.textContent = 'позвоните в студию';
    const number = String(contacts.phone || '').replace(/[^\d+]/g, '');
    if (/^\+?\d{7,15}$/.test(number)) phone.href = 'tel:' + number;

    const paths = ['above', 'below'].map(name => {
      const path = card.querySelector('#route-' + name + '-path');
      const trace = card.querySelector('.route-trace-' + name);
      const length = path.getTotalLength();
      trace.setAttribute('stroke-dasharray', String(length));
      return { path, length, trace };
    });
    const vehicle = card.querySelector('.route-vehicle');
    const boom = card.querySelector('.route-boom');
    const toggle = card.querySelector('.route-toggle');
    const lessMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const total = stages.at(-1).end;
    const gate = (142 - 37) / paths[1].length;
    const clamp = value => Math.max(0, Math.min(1, value));
    let second = 0, selected = -1, raf = 0, previous = 0;
    let wantsPlay = !lessMotion.matches, inView = false;

    function paint(time) {
      second = Math.min(total, Math.max(0, time));
      const stage = second < stages[1].start ? 0 : second < stages[2].start ? 1 : 2;
      const ground = clamp(second / 4.75);
      const inside = stage < 2 ? gate * clamp((second - 5.3) / 2.8)
        : gate + (1 - gate) * clamp((second - 10.15) / 6.1);
      [ground, inside].forEach((progress, i) => {
        paths[i].trace.setAttribute('stroke-dashoffset', String((1 - progress) * paths[i].length));
      });
      const activePath = paths[stage === 0 ? 0 : 1];
      const at = activePath.length * (stage === 0 ? ground : inside);
      const point = activePath.path.getPointAtLength(at);
      const before = activePath.path.getPointAtLength(Math.max(0, at - 1));
      const after = activePath.path.getPointAtLength(Math.min(activePath.length, at + 1));
      const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
      vehicle.setAttribute('transform', 'translate(' + point.x + ' ' + point.y + ') rotate(' + angle + ')');
      boom.setAttribute('transform', 'rotate(' + (clamp((second - 9.3) / .8) * 84) + ' 158 261)');
      if (stage !== selected) {
        selected = stage;
        buttons.forEach((btn, i) => btn.setAttribute('aria-pressed', String(stage === i)));
        copy.textContent = stages[stage].text;
        if (stage === 1 && phone.hasAttribute('href')) {
          const [beforePhone, afterPhone] = stages[stage].text.split(phone.textContent);
          copy.replaceChildren(beforePhone, phone, afterPhone);
        }
      }
    }

    function updatePlayback() {
      cancelAnimationFrame(raf);
      previous = 0;
      const label = second >= total ? 'Повторить' : wantsPlay ? 'Пауза' : second > 0 ? 'Продолжить' : 'Показать';
      toggle.dataset.state = wantsPlay ? 'pause' : second >= total ? 'replay' : 'play';
      toggle.textContent = label;
      toggle.setAttribute('aria-label', label + ' — анимация маршрута');
      toggle.hidden = lessMotion.matches;
      if (wantsPlay && inView && !document.hidden && !lessMotion.matches) raf = requestAnimationFrame(tick);
    }
    function tick(now) {
      if (previous) paint(second + (now - previous) / 1000);
      previous = now;
      if (second >= total) { wantsPlay = false; updatePlayback(); }
      else raf = requestAnimationFrame(tick);
    }
    buttons.forEach((btn, i) => btn.addEventListener('click', () => {
      wantsPlay = false; paint(stages[i].parked); updatePlayback();
    }));
    toggle.addEventListener('click', () => {
      if (second >= total) paint(0);
      wantsPlay = !wantsPlay;
      updatePlayback();
    });
    lessMotion.addEventListener('change', () => {
      wantsPlay = false; paint(stages[Math.max(0, selected)].parked); updatePlayback();
    });
    document.addEventListener('visibilitychange', updatePlayback);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting; updatePlayback();
      }, { threshold: .22 }).observe(card);
    } else { inView = true; }
    paint(lessMotion.matches ? stages[0].parked : 0);
    updatePlayback();
    return card;
  }
  window.StudioArrivalMap = { create };
})();
