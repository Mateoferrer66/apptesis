import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'models/*.bin', 'models/*.json'],
      manifest: {
        name: 'Detección de Plagas en Cafetales',
        short_name: 'PlagasCafe',
        description: 'Detección temprana de plagas en cafetales mediante visión por computadora offline.',
        theme_color: '#15803d',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,bin,wasm}'],
        maximumFileSizeToCacheInBytes: 10000000, // 10MB para modelos
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@tensorflow')) return 'tfjs';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor';
            if (id.includes('lucide-react') || id.includes('framer-motion') || id.includes('clsx') || id.includes('tailwind-merge')) return 'ui';
            if (id.includes('dexie')) return 'db';
            return 'modules';
          }
        }
      }
    }
  },
  server: {
    port: 8004,
  },
})
