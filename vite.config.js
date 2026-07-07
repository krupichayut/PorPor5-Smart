import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
              priority: 40
            },
            {
              name: 'vendor-firebase',
              test: /node_modules[\\/](@firebase|firebase)[\\/]/,
              priority: 30
            },
            {
              name: 'vendor-charts',
              test: /node_modules[\\/](recharts|d3-|victory-vendor|decimal\.js-light)[\\/]/,
              priority: 20
            },
            {
              name: 'vendor-ui',
              test: /node_modules[\\/](lucide-react|@paper-design)[\\/]/,
              priority: 10
            }
          ]
        }
      }
    }
  }
})
