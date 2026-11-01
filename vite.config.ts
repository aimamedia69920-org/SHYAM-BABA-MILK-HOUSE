import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB limit for rich bundle
        },
        manifest: {
          id: '/',
          name: 'SHYAM BABA MILK HOUSE',
          short_name: 'ShyamMilk',
          description: 'Real-Time Dairy Milk Delivery Management System with Daily Tracking & Online Payments',
          theme_color: '#1e3a8a',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__AI_LOGO__45b1c9ed.jpeg',
              sizes: '192x192',
              type: 'image/jpeg',
              purpose: 'any',
            },
            {
              src: '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__AI_LOGO__45b1c9ed.jpeg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
