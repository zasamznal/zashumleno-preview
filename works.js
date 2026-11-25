(() => {
  const originals = [
    {
      "model": "Mitsubishi Pajero",
      "title": "Замена штатных динамиков",
      "description": "Мастера сняли штатные динамики, подключили новую акустику и установили её в двери.",
      "url": "https://t.me/ZaShumlenoAvto/452",
      "image": "assets/work-pajero-audio.webp"
    },
    {
      "model": "Mazda CX-5",
      "title": "Шумоизоляция дверей",
      "description": "На внутренние поверхности дверей уложили материалы комплекта «Премиум». В ролике видны слои под обшивкой.",
      "url": "https://t.me/ZaShumlenoAvto/439",
      "image": "assets/work-mazda-doors.webp"
    },
    {
      "model": "Geely Atlas",
      "title": "Шумоизоляция салона",
      "description": "Салон разобрали для обработки капсулы по программе «Премиум». Студия показала двери, пол и зону багажника.",
      "url": "https://t.me/ZaShumlenoAvto/446",
      "image": "assets/work-geely-cabin.webp"
    },
    {
      "model": "Volkswagen Passat B6",
      "title": "Установка передней акустики",
      "description": "Для передних динамиков протянули новую проводку. В этом проекте провода проложили во все двери.",
      "url": "https://t.me/ZaShumlenoAvto/437",
      "image": "assets/work-passat-audio.webp"
    },
    {
      "model": "Mitsubishi Pajero",
      "title": "Тонировка задней полусферы",
      "description": "Студия показала раскрой плёнки, её нанесение и вид задних стёкол после тонировки.",
      "url": "https://t.me/ZaShumlenoAvto/449",
      "image": "assets/work-pajero-film.webp"
    }
  ];

  // The original post identifies the project even after the owner edits its title or reorders the gallery.
  const mediaByPost = new Map(originals.map(work => {
    const postId = new URL(work.url).pathname.split('/').pop();
    const path = 'v2/media/works/' + postId;
    return [work.url, { previousImage: work.image, image: path + '.webp', video: path + '.mp4' }];
  }));

  function normalize(works) {
    return works.map(work => {
      const media = mediaByPost.get(work?.url);
      if (!media || Object.hasOwn(work, 'video')) return work;
      return {
        ...work,
        image: work.image === media.previousImage ? media.image : work.image,
        video: media.video
      };
    });
  }

  window.StudioWorks = { normalize };
  window.STUDIO_WORKS = normalize(originals);
})();
