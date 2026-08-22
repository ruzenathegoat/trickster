import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/sanctum': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy, page-specific vendors into their own chunks so they
        // only download on the routes that use them.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('highcharts')) return 'vendor-charts';
            if (id.includes('framer-motion') || id.includes('gsap')) return 'vendor-motion';
            if (id.includes('@dnd-kit')) return 'vendor-dnd';
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
          }
        },
      },
    },
  },
})
