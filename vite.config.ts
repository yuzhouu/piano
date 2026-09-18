import { defineConfig } from 'vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: '小小钢琴家', short_name: '小小钢琴家', lang: 'zh-CN',
        description: '给好奇的小手指，一个自由演奏的音乐空间。',
        theme_color: '#285548', background_color: '#faf9f5',
        display: 'standalone', start_url: '/', scope: '/',
        icons: [
          { src: '/icons/piano-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/piano-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        navigateFallback: '/index.html',
      },
    }),
  ],
})

export default config
