(() => {
  'use strict';
  // Side views of the body types, 120×48, ground at y = 44. Each shape: body outline, glass and wheels.
  const car = (body, glass, wheels) => ({ body, glass, wheels });
  const sedanWheels = [[30, 36, 8], [90, 36, 8]];
  const tallWheels = [[30, 35.5, 8.5], [90, 35.5, 8.5]];
  const shapes = {
    sedan: car('M8 36L6 31Q6 27 12 26L36 23.5Q42 22.5 48 16Q51 13.5 56 13.5L74 13.5Q79 13.5 84 17L92 23L108 24Q113 24.5 114 28L114 33Q114 36 110 36L98 36A8 8 0 0 0 82 36L38 36A8 8 0 0 0 22 36Z',
      'M46.5 22.5Q50.5 16.2 56.5 15.6L63 15.6L63 22.3ZM65 15.6L73.5 15.6Q77.5 15.8 81.2 18.8L85.6 22.4L65 22.4Z', sedanWheels),
    hatchback: car('M8 36L6 31Q6 27 12 26L36 23.5Q42 22.5 48 16Q51 13.5 56 13.5L86 13.5Q92 14 96 19L101 25Q103 28 103 31L103 33Q103 36 99 36L96 36A8 8 0 0 0 80 36L38 36A8 8 0 0 0 22 36Z',
      'M46.5 22.5Q50.5 16.2 56.5 15.6L65 15.6L65 22.3ZM67 15.6L85.5 15.6Q90.5 16 93.7 20.2L95.8 22.6L67 22.6Z', [[30, 36, 8], [88, 36, 8]]),
    liftback: car('M8 36L6 31Q6 27 12 26L36 23.5Q42 22.5 48 16Q51 13.5 56 13.5L72 13.5Q80 14 88 18.5L108 25Q113 26 114 29L114 33Q114 36 110 36L98 36A8 8 0 0 0 82 36L38 36A8 8 0 0 0 22 36Z',
      'M46.5 22.5Q50.5 16.2 56.5 15.6L63 15.6L63 22.3ZM65 15.6L71.8 15.6Q78.6 16.1 85.5 19.8L91.5 22.8L65 22.6Z', sedanWheels),
    wagon: car('M8 36L6 31Q6 27 12 26L36 23.5Q42 22.5 48 16Q51 13.5 56 13.5L102 13.5Q107 14 110 18L113 25Q114 28 114 31L114 33Q114 36 110 36L98 36A8 8 0 0 0 82 36L38 36A8 8 0 0 0 22 36Z',
      'M46.5 22.5Q50.5 16.2 56.5 15.6L63 15.6L63 22.3ZM65 15.6L83 15.6L83 22.4L65 22.4ZM85 15.6L101.2 15.6Q105.2 16 107.4 19.3L109.4 22.6L85 22.6Z', sedanWheels),
    crossover: car('M7 34L5 28Q5 23 11 22L34 19.5Q40 18.5 46 11Q49 8.5 55 8.5L98 8.5Q104 9 107 14L111 22Q113 25 113 29L113 31Q113 34 109 34L99.5 34A9.5 9.5 0 0 0 80.5 34L39.5 34A9.5 9.5 0 0 0 20.5 34Z',
      'M44.2 18.8Q48.8 11.6 55.2 10.7L64 10.7L64 18.7ZM66 10.7L84 10.7L84 18.8L66 18.8ZM86 10.7L97.4 10.7Q102 11.1 104.4 15.2L106.4 18.8L86 18.8Z', tallWheels),
    suv: car('M7 34L5 24Q5 20 9 19.5L30 18Q34 17.5 38 10L41 6Q42 5 45 5L104 5Q108 5 110 9L112 16Q113 20 113 24L113 31Q113 34 110 34L100 34A10 10 0 0 0 80 34L40 34A10 10 0 0 0 20 34Z',
      'M37.2 16.8L41.6 8.6Q42.6 7.2 45 7.2L62 7.2L62 16.8ZM64 7.2L84 7.2L84 16.8L64 16.8ZM86 7.2L103 7.2Q106.4 7.2 107.6 10.4L109.6 16.8L86 16.8Z', [[30, 35, 9], [90, 35, 9]]),
    minivan: car('M8 35L6 29Q6 25 11 24L24 22.5Q30 21.5 36 12Q39 7.5 46 7L104 7Q110 7.5 112 12L114 22Q115 26 115 30L115 32Q115 35 111 35L98 35A8.5 8.5 0 0 0 81 35L39 35A8.5 8.5 0 0 0 22 35Z',
      'M34.6 19.6Q39.4 10.4 46.4 9.2L60 9.2L60 19.6ZM62 9.2L82 9.2L82 19.6L62 19.6ZM84 9.2L103.6 9.2Q108.4 9.6 109.6 13.2L111.2 19.6L84 19.6Z', [[30.5, 35.5, 8.5], [89.5, 35.5, 8.5]]),
    pickup: car('M7 34L5 25Q5 21 9 20.5L30 18.6Q34 18 38 11L41 7Q42 6 45 6L70 6Q73 6 74 9L76 20L113 20Q115 20 115 23L115 31Q115 34 112 34L100 34A10 10 0 0 0 80 34L40 34A10 10 0 0 0 20 34Z',
      'M37.4 17.4L41.8 9.4Q42.8 8.2 45 8.2L56 8.2L56 17.4ZM58 8.2L69.6 8.2Q71.6 8.4 72 10.4L73.4 17.4L58 17.4Z', [[30, 35, 9], [90, 35, 9]]),
    coupe: car('M8 36L6 31Q6 27 12 26L38 23.5Q46 22 54 15.5Q58 13 64 13L74 13Q82 13.5 90 18.5L108 24.5Q113 25.5 114 29L114 33Q114 36 110 36L98 36A8 8 0 0 0 82 36L38 36A8 8 0 0 0 22 36Z',
      'M51.5 22.2Q56.6 16.4 63.4 15.2L73.8 15.2Q80.8 15.7 87.2 19.6L91.4 22.6Z', sedanWheels)
  };

  function svg(shape, className = 'car-shape') {
    const data = shapes[shape] || shapes.sedan;
    const ns = 'http://www.w3.org/2000/svg';
    const root = document.createElementNS(ns, 'svg');
    root.setAttribute('viewBox', '0 0 120 48');
    root.setAttribute('class', className);
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('focusable', 'false');
    const add = (tag, attrs) => {
      const el = document.createElementNS(ns, tag);
      for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
      root.append(el);
      return el;
    };
    add('path', { d: 'M2 44.5H118', class: 'car-ground' });
    add('path', { d: data.body, class: 'car-hull', pathLength: '1' });
    add('path', { d: data.glass, class: 'car-glass' });
    for (const [cx, cy, r] of data.wheels) {
      add('circle', { cx, cy, r, class: 'car-wheel' });
      add('circle', { cx, cy, r: r * 0.42, class: 'car-hub' });
    }
    return root;
  }

  globalThis.StudioCarShapes = { svg, names: Object.keys(shapes) };
})();
