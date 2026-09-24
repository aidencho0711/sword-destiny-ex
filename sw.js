/* Sword Destiny - ex : 오프라인 캐시
   파일을 수정하면 CACHE 버전을 올려야 사용자 기기에 새 버전이 반영됩니다. */
const CACHE = "sworddestiny-v50";
const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./css/game.css",
  "./js/00-config.js",
  "./js/13-cloud.js",
  "./js/14-trade.js",
  "./js/01-data-rarity.js",
  "./js/02-data-swords.js",
  "./js/03-data-economy.js",
  "./js/04-state.js",
  "./js/05-sword-svg.js",
  "./js/06-audio.js",
  "./js/07-roll.js",
  "./js/08-cutscenes.js",
  "./js/09-render.js",
  "./js/12-armory.js",
  "./js/10-events.js",
  "./js/11-boot.js",
  "./icon.svg", "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 문서는 네트워크 우선(새 버전 확인), 나머지는 캐시 우선 */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
