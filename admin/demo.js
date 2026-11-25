// Демо-кабинет на GitHub Pages: подключает демо-сервер браузера и показывает, что правки остаются только здесь.
(() => {
  const root = document.documentElement;
  const unsupported = () => {
    root.style.visibility = '';
    document.addEventListener('DOMContentLoaded', () => {
      const note = document.createElement('p');
      note.className = 'a-demo-warning';
      note.textContent = 'Демо-кабинет не запустился в этом браузере. Откройте ссылку в обычном окне Chrome, Safari, Edge или Firefox.';
      document.body.prepend(note);
    });
  };
  if (!('serviceWorker' in navigator) || !('indexedDB' in window)) return unsupported();
  const reload = () => location.reload();
  if (!navigator.serviceWorker.controller) {
    root.style.visibility = 'hidden';
    navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
    setTimeout(unsupported, 8000);
  }
  navigator.serviceWorker.register(new URL('demo-sw.js', document.baseURI)).then(registration => {
    if (navigator.serviceWorker.controller) return;
    // После жёсткой перезагрузки страница открывается без демо-сервера: просим его взять вкладку снова.
    navigator.serviceWorker.ready.then(ready => ready.active?.postMessage('claim'));
    registration.update?.();
  }).catch(unsupported);

  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.createElement('aside');
    bar.className = 'a-demo-bar';
    bar.setAttribute('aria-label', 'Демо-режим');
    const text = document.createElement('span');
    text.textContent = 'Демо-кабинет: правки, фото и публикации сохраняются только в этом браузере.';
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.textContent = 'Сбросить демо';
    reset.addEventListener('click', () => {
      if (!confirm('Удалить все правки и загруженные файлы демо-кабинета в этом браузере?')) return;
      const request = indexedDB.deleteDatabase('zashumleno-demo');
      request.onsuccess = request.onerror = request.onblocked = () => setTimeout(reload, 150);
    });
    bar.append(text, reset);
    document.body.prepend(bar);
    const style = document.createElement('style');
    style.textContent = [
      '.a-demo-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: .35rem 1rem; padding: .45rem 1rem;',
      '  background: #2c2850; color: #f1eff8; font-size: .84rem; line-height: 1.35; text-align: center; }',
      '.a-demo-bar button { min-height: 2rem; padding: .2rem .8rem; border: 1px solid #bcb9d9; border-radius: 2rem; background: transparent; color: #f1eff8; font: inherit; font-weight: 600; cursor: pointer; }',
      '.a-demo-bar button:hover { background: #bcb9d9; color: #13111c; }',
      '.a-demo-note { margin: 0 0 1rem; padding: .7rem .85rem; border-radius: .45rem; background: #ecebf6; color: #2c2850; font-size: .9rem; line-height: 1.4; }',
      '.a-demo-warning { margin: 0; padding: 1rem; background: #fff3cd; color: #5a4300; font-weight: 600; text-align: center; }',
      '@media (max-width: 40rem) { .a-demo-bar { font-size: .78rem; } }'
    ].join('\n');
    document.head.append(style);
  });
})();
