// Materials of the studio. Colours and print imitate the real sheets in the section «Что внутри»:
// they are taken from the photos of the studio and the swatches on its price sheets (public/sheets).
// texture: foil — embossed foil, print — sheet with a printed name, felt — fibrous membrane,
// wave — wave-profile foam, eggcrate — cellular foam, membrane — dense film, gloss — mastic.
window.STUDIO_MATERIALS = [
  {
    id: 'bronze2', name: 'ComfortMat Bronze 2', label: 'BRONZE 2', kind: 'damper', texture: 'foil', color: '#d94a0e', print: '#fff1e6',
    text: 'Битумный вибродемпфер. Прикатывается к металлу и уменьшает его резонанс.', note: '350 ₽ за лист'
  },
  {
    id: 'bronze3', name: 'ComfortMat Bronze 3', label: 'BRONZE 3', kind: 'damper', texture: 'foil', color: '#0b84cf', print: '#eaf6ff',
    text: 'Более толстый битумный вибродемпфер для пола и багажника. Тяжелее премиальных аналогов.', note: '460 ₽ за лист'
  },
  {
    id: 'cobra', name: 'ComfortMat Cobra', label: 'COBRA', kind: 'damper', texture: 'print', color: '#1f1d22', print: '#f07a1a',
    text: 'Вибродемпфер с усиленной матовой фольгой и ингибитором коррозии. Прочно держится на металле.', note: '635 ₽ за лист'
  },
  {
    id: 'viper', name: 'ComfortMat Viper', label: 'VIPER', kind: 'damper', texture: 'print', color: '#25221f', print: '#d8283a',
    text: 'Вибродемпфер премиальной серии для пола, арок и моторного щита: усиленная фольга и сильное сцепление с кузовом.', note: '760 ₽ за лист'
  },
  {
    id: 'integra', name: 'ComfortMat Integra Gen.2', label: 'INTEGRA', kind: 'insulator', texture: 'felt', color: '#9a9aa1', print: '#45454d',
    text: 'Звукоизолятор с акустической мембраной. Работает между слоями вибродемпфера и отражает шум улицы.', note: '825 ₽ за лист'
  },
  {
    id: 'blockshot', name: 'ComfortMat Blockshot Gen.2', label: 'BLOCKSHOT', kind: 'insulator', texture: 'print', color: '#1467d6', print: '#dcebff',
    text: 'Звукоизолятор с акустической мембраной для пола, арок и моторного щита.', note: '975 ₽ за лист'
  },
  {
    id: 'raptor', name: 'ComfortMat Raptor', label: 'RAPTOR', kind: 'insulator', texture: 'print', color: '#dc953d', print: '#3f2a12',
    text: 'Звукоизолятор с акустической мембраной. Укладывается вторым слоем на пол и в багажник.', note: '829 ₽ за лист'
  },
  {
    id: 'ranger', name: 'ComfortMat Ranger', label: 'RANGER', kind: 'insulator', texture: 'felt', color: '#87655a', print: '#d9a48f',
    text: 'Звукоизолятор с акустической мембраной. Снижает гул со стороны пола.', note: '625 ₽ за лист'
  },
  {
    id: 'volna', name: 'ComfortMat Volna', label: 'VOLNA', kind: 'absorber', texture: 'wave', color: '#6a6a72', print: '#36363c',
    text: 'Шумопоглотитель с волнистой поверхностью. Глушит звук внутри полостей кузова.', note: '680 ₽ за лист'
  },
  {
    id: 'softwave', name: 'ComfortMat Soft Wave', label: 'SOFT WAVE', kind: 'absorber', texture: 'eggcrate', color: '#55555e', print: '#2c2c33',
    text: 'Мягкий шумопоглотитель с ячеистой структурой. Приглушает уличный шум под обшивкой.', note: '1 270 ₽ за лист'
  },
  {
    id: 'locker', name: 'ComfortMat Locker', label: 'LOCKER', kind: 'membrane', texture: 'membrane', color: '#2a2a2f', print: '#8a8a94',
    text: 'Акустическая мембрана для войлочных подкрылков.', note: '660 ₽ за лист'
  },
  {
    id: 'masterwax', name: 'MasterWax', label: 'MASTERWAX', kind: 'mastic', texture: 'gloss', color: '#17161a', print: '#5d5c66',
    text: 'Антикоррозийная мастика. Закрывает швы и открытые участки арок от воды.', note: ''
  }
];
