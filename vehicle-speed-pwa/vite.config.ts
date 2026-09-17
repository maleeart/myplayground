import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: '/speed/',
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Mobile CV Vehicle Speed Estimator',
        short_name: 'SpeedTracker',
        description: 'Real-time Computer Vision Vehicle Speed Estimator using Smartphone Camera',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: '/speed/icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  server: {
    host: true, // Exposes on local network (e.g. 192.168.x.x) for phone access
    port: 5173,
    https: {}, // HTTPS required for navigator.mediaDevices.getUserMedia on mobile
  },
});
