(() => {
  const clips = {
  "437": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/ab877990-56d3-469b-99f7-611f8a8fb42b.mp4",
  "439": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/c2824904-a76a-43c6-bd41-363cc7ed66be.mp4",
  "446": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/fc3abde5-d5bb-48a5-85ee-bac562421ed0.mp4",
  "449": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/92cc3f69-5e8f-4f0c-8f9b-80ff371d8bb7.mp4",
  "452": "https://d2ol7oe51mr4n9.cloudfront.net/user_3MObJjwMaVootSQ51NEV22mnNFL/0d448ce9-d715-4f69-9144-3ff6ff8d095a.mp4"
};
  const works = window.StudioWorks.normalize(window.STUDIO_WORKS).map(work => {
    const match = /^\/?v2\/media\/works\/(\d+)\.mp4$/.exec(work.video || "");
    return match && clips[match[1]] ? {...work, video: clips[match[1]]} : work;
  });
  window.STUDIO_WORKS = works;
  const page = window.StudioPage.normalize(window.STUDIO_PAGE_DEFAULTS);
  window.STUDIO_SEED = structuredClone({page, zones: window.STUDIO_ZONES, prices: window.STUDIO_PRICES, works});
  window.StudioPage.apply(page);
  window.STUDIO_READY = Promise.resolve(true);
})();
