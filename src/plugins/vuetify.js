/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com
 */

import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          background: '#00171f',
          surface: '#08212a',
          'surface-bright': '#10303b',
          'surface-light': '#0d2b35',
          'surface-variant': '#0d2b35',
          'on-background': '#ffffff',
          'on-surface': '#ffffff',
          'on-surface-variant': '#cad3d8',
          primary: '#00a8e8',
          'on-primary': '#ffffff',
          secondary: '#1a936f',
          'on-secondary': '#ffffff',
          accent: '#a833b9',
          'on-accent': '#ffffff',
          error: '#c5283d',
          'on-error': '#ffffff',
          info: '#00a8e8',
          'on-info': '#ffffff',
          success: '#1a936f',
          'on-success': '#ffffff',
          warning: '#f7b707',
          'on-warning': '#1a1408',
        },
        variables: {
          'border-color': '#ffffff',
          'border-opacity': 0.16,
          'high-emphasis-opacity': 1,
          'medium-emphasis-opacity': 0.72,
          'disabled-opacity': 0.4,
          'theme-overlay-multiplier': 1,
          'theme-on-surface-variant': '#cad3d8',
        },
      },
      light: {
        dark: false,
        colors: {
          background: '#f7fafc',
          surface: '#ffffff',
          'surface-bright': '#ffffff',
          'surface-light': '#f1f5f9',
          'surface-variant': '#eef2f6',
          'on-background': '#0d2530',
          'on-surface': '#0d2530',
          'on-surface-variant': '#3f5560',
          primary: '#0078a6',
          'on-primary': '#ffffff',
          secondary: '#137a55',
          'on-secondary': '#ffffff',
          accent: '#8a1ea0',
          'on-accent': '#ffffff',
          error: '#b52236',
          'on-error': '#ffffff',
          info: '#0078a6',
          'on-info': '#ffffff',
          success: '#137a55',
          'on-success': '#ffffff',
          warning: '#b07b04',
          'on-warning': '#ffffff',
        },
        variables: {
          'border-color': '#0d2530',
          'border-opacity': 0.18,
          'high-emphasis-opacity': 1,
          'medium-emphasis-opacity': 0.74,
          'disabled-opacity': 0.4,
          'theme-overlay-multiplier': 1,
          'theme-on-surface-variant': '#3f5560',
        },
      },
    },
  },
})

export default vuetify
