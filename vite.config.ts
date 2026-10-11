import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png'],
      manifest: {
        id: './',
        name: 'HSK Việt Nam – Học từ vựng tiếng Trung',
        short_name: 'HSK Việt Nam',
        description: 'Ứng dụng học từ vựng HSK dành cho người Việt: từ vựng, Hán-Việt, phát âm, phân biệt chữ, mind map, quiz và ôn tập cách quãng.',
        theme_color: '#b91c1c',
        background_color: '#f8fafc',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        start_url: './',
        scope: './',
        lang: 'vi',
        dir: 'ltr',
        orientation: 'any',
        categories: ['education', 'productivity'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: [
          { name: 'Từ vựng', short_name: 'Từ vựng', description: 'Mở danh sách từ vựng HSK', url: './?tab=vocabulary', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Ôn tập', short_name: 'Ôn tập', description: 'Mở quiz ôn tập', url: './?tab=quiz', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'hsk-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ]
});
