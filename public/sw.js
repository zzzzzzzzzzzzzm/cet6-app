const CACHE_NAME = 'cet6-pro-cache-v1';

// 安装时：强制立即接管
self.addEventListener('install', (e) => {
    self.skipWaiting();
    console.log('[Service Worker] 安装并接管完成');
});

// 激活时：清理旧缓存
self.addEventListener('activate', (e) => {
    e.waitUntil(clients.claim());
});

// 拦截请求核心逻辑
self.addEventListener('fetch', (e) => {
    // ⚠️ 登录、同步、拉取单词等 API 请求必须实时联网，绝对不能缓存！
    if (e.request.url.includes('/api/')) return;

    // 其他的静态文件（Babel, React, Tailwind, HTML）全部走缓存优先策略
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            // 如果手机缓存里有这个文件，直接 0.01 秒返回！
            if (cachedResponse) {
                return cachedResponse;
            }
            // 如果没有，再去联网下载，并偷偷存一份进缓存
            return fetch(e.request).then((response) => {
                // 确保只缓存成功的请求
                if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
                    return response;
                }
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseClone);
                });
                return response;
            });
        })
    );
});