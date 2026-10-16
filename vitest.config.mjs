import Vue from '@vitejs/plugin-vue'
import Vuetify from 'vite-plugin-vuetify'
import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [Vue(), Vuetify({ autoImport: true })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
      'vue-router/auto-routes': fileURLToPath(new URL('tests/stubs/autoRoutes.js', import.meta.url)),
      'virtual:generated-layouts': fileURLToPath(new URL('tests/stubs/layouts.js', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.spec.js'],
    server: { deps: { inline: ['vuetify'] } },
  },
})
