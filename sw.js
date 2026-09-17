// Bump this version string whenever you update index.html, styles, or content,
// so returning visitors get the fresh copy instead of a stale cached one.
var CACHE_NAME = "israel-prep-v1";

var CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./images/bg.jpg",
  "./images/icon-192.png",
  "./images/icon-512.png",
  "./images/icon-maskable-512.png",
  "./images/apple-touch-icon.png",
  "./images/favicon-32.png"
];

// Question images are optional at deploy time (the user adds them later),
// so each one is cached independently — a missing file never blocks install.
var OPTIONAL_ASSETS = [];
for (var i = 1; i <= 10; i++) {
  OPTIONAL_ASSETS.push("./images/Qs/" + i + ".jpg");
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      var corePromise = cache.addAll(CORE_ASSETS);
      var optionalPromises = OPTIONAL_ASSETS.map(function (url) {
        return cache.add(url).catch(function () {
          // Image not uploaded yet — safe to ignore.
        });
      });
      return Promise.all([corePromise].concat(optionalPromises));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
            .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;

      return fetch(request).then(function (response) {
        if (response && response.ok && response.type === "basic") {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(function () {
        if (request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
