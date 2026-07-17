// ============================================
// Service Worker - Bidiya Training Hub
// Version 3.0 - Firebase Firestore
// ============================================

const CACHE_NAME = 'bth-v3';
const BASE_PATH = '/';

// الملفات التي سيتم تخزينها مؤقتاً
const ASSETS = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'dashboard.html',
    BASE_PATH + 'workshops.html',
    BASE_PATH + 'register.html',
    BASE_PATH + 'reports.html',
    BASE_PATH + 'employee.html',
    BASE_PATH + 'about.html',
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'favicon.ico',
    // CSS
    BASE_PATH + 'assets/css/style.css',
    BASE_PATH + 'assets/css/dark-mode.css',
    // JS
    BASE_PATH + 'js/i18n.js',
    BASE_PATH + 'js/main.js',
    BASE_PATH + 'js/dashboard.js',
    BASE_PATH + 'js/workshops.js',
    BASE_PATH + 'js/register.js',
    BASE_PATH + 'js/reports.js',
    BASE_PATH + 'js/employee.js',
    BASE_PATH + 'js/config.js',
    BASE_PATH + 'js/db-firestore.js',
    // Firebase
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js',
    // Fonts & Libraries
    'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// ============================================
// Installation
// ============================================
self.addEventListener('install', function(event) {
    console.log('📦 SW: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(ASSETS);
            })
            .then(function() {
                return self.skipWaiting();
            })
    );
});

// ============================================
// Activation
// ============================================
self.addEventListener('activate', function(event) {
    console.log('✅ SW: Activated');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(name) {
                    return name !== CACHE_NAME;
                }).map(function(name) {
                    return caches.delete(name);
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// ============================================
// Fetch Strategy: Cache First with Network Fallback
// ============================================
self.addEventListener('fetch', function(event) {
    const request = event.request;

    // نسمح لطلبات Firebase بالمرور مباشرة
    if (request.url.includes('firebase') || 
        request.url.includes('googleapis.com') ||
        request.url.includes('gstatic.com')) {
        event.respondWith(fetch(request));
        return;
    }

    event.respondWith(
        caches.match(request)
            .then(function(cached) {
                if (cached) {
                    return cached;
                }
                return fetch(request).then(function(response) {
                    // تخزين الملفات الجديدة في الكاش
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(request, clone);
                        });
                    }
                    return response;
                }).catch(function() {
                    // صفحة الخطأ إذا كان التطبيق غير متصل
                    if (request.mode === 'navigate') {
                        return caches.match(BASE_PATH + 'index.html');
                    }
                });
            })
    );
});

console.log('✅ Service Worker v3.0 loaded (Firestore)');