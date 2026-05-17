const CACHE_NAME = 'cet6-pro-cache-v2';

// 安装时：强制立即接管，并把网页骨架死死锁在手机硬盘里
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(['/', '/index.html']);
        })
    );
    console.log('[Service Worker] 安装并接管完成');
});

// 激活时：清理旧缓存
self.addEventListener('activate', (e) => {
    e.waitUntil(clients.claim());
});

// 拦截请求核心逻辑：提速钥匙
self.addEventListener('fetch', (e) => {
    // 1. API 接口必须走网络，绝不缓存！
    if (e.request.url.includes('/api/')) return;

    // 2. 其他静态文件走缓存优先策略
    e.respondWith(
        caches.match(e.request, { ignoreSearch: true }).then((cachedResponse) => {
            // 只要保险箱里有，直接 0.01 秒返回！
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // 如果没匹配上，但你是在访问网页，强行给你本地的 index.html
            if (e.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
            
            // 3. 其他没缓存的资源，去网络拿并悄悄存一份进缓存
            return fetch(e.request).then((response) => {
                if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
                    return response;
                }
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseClone);
                });
                return response;
            }).catch(() => {});
        })
    );
});