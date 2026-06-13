import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Code splitting by route — reduces initial bundle significantly
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts':   ['recharts'],
          'vendor-motion':   ['framer-motion'],
          'vendor-icons':    ['lucide-react'],
          'vendor-axios':    ['axios'],
          // Page chunks
          'pages-landing':   [
            './src/pages/LandingPage.jsx',
            './src/pages/PricingPage.jsx',
            './src/pages/AboutPage.jsx',
            './src/pages/ResourcesPage.jsx',
          ],
          'pages-auth':      [
            './src/pages/SignInPage.jsx',
            './src/pages/OnboardingPage.jsx',
          ],
          'pages-dashboard': [
            './src/pages/DashboardPage.jsx',
            './src/pages/DashboardOverview.jsx',
          ],
          'pages-features':  [
            './src/pages/ProductsPage.jsx',
            './src/pages/AIActionsPage.jsx',
            './src/pages/EmailsPage.jsx',
            './src/pages/RevenueImpactPage.jsx',
            './src/pages/SettingsPage.jsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    minify: 'esbuild',
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
