/*
 * Vite: compila la app React a dist/ y genera el service worker (PWA).
 * Igual que FoxTrips: la pagina se pide primero a la red (cabeceras CSP siempre frescas)
 * y las fotos y fuentes se sirven desde cache.
 */
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const MONTH = 30 * 24 * 60 * 60;

/* "vite preview" usa la misma Content-Security-Policy que Netlify (netlify.toml) */
function netlifyCsp() {
  const match = readFileSync(new URL('./netlify.toml', import.meta.url), 'utf8').match(/Content-Security-Policy = "([^"]+)"/);
  return match ? match[1].replace('; upgrade-insecure-requests', '') : '';
}

export default defineConfig({
  /* '/' en Netlify; el workflow de GitHub Pages compila con BASE_PATH=/foxmind/ */
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      includeAssets: ['favicon-48.png', 'logo-foxmind.png', 'logo-foxmind-crema.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'manifest.webmanifest'],
      workbox: {
        navigateFallback: null,
        globPatterns: ['**/*.{js,css,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'foxflow-paginas', networkTimeoutSeconds: 4, expiration: { maxEntries: 5 } }
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: { cacheName: 'foxflow-fuentes', expiration: { maxEntries: 30, maxAgeSeconds: 12 * MONTH } }
          },
          {
            urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === 'image',
            handler: 'CacheFirst',
            options: { cacheName: 'foxflow-fotos', expiration: { maxEntries: 200, maxAgeSeconds: MONTH } }
          }
        ]
      }
    })
  ],
  preview: { headers: { 'Content-Security-Policy': netlifyCsp() } },
  build: { outDir: 'dist', sourcemap: false }
});
