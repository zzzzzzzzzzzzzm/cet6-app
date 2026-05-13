// 这是一个基础的 Service Worker，用来满足 PWA 的安装条件
self.addEventListener('install', (e) => {
    console.log('[Service Worker] 安装成功，准备好变成 App 啦！');
});

self.addEventListener('fetch', (e) => {
    // 暂时留空，以后可以升级在这里做离线缓存，断网也能背单词
});