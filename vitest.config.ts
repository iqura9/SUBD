import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom', // Use jsdom for testing React components
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html']
    }
  },
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer/src')
    }
  }
})
