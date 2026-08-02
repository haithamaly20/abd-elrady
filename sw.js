// ═══════════════════════════════════════════════════════════════
// Service Worker - شقة عبد الراضي
// الهدف الوحيد لهذا الملف: تخزين "هيكل" التطبيق (index.html + الأيقونات)
// مؤقتاً حتى يفتح كتطبيق مثبَّت بسرعة وبدون شاشة بيضاء لحظة الفتح.
// هام جداً: لا يتدخل هذا الملف إطلاقاً في طلبات المزامنة مع Google Sheets
// ولا في تحميل مكتبات CDN (html2canvas / xlsx / FontAwesome / الخطوط) —
// هذه الطلبات تُترك تماماً لتذهب للشبكة كالمعتاد حتى لا تنكسر ميزة
// المزامنة اللحظية أو تصدير Excel/الصورة.
// ═══════════════════════════════════════════════════════════════
const CACHE_NAME = 'abdulradi-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // لا نتدخل إلا في طلبات GET من نفس الأصل (نفس الموقع على GitHub Pages)
  // أي طلب لأي نطاق آخر (Google Apps Script، CDN، الخطوط...) يُترك للشبكة مباشرة
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (res && res.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone());
        }
        return res;
      } catch (err) {
        const cached = await caches.match(req);
        if (cached) return cached;
        throw err;
      }
    })()
  );
});
