import { computed, ref } from 'vue'
import vuetify from '@/plugins/vuetify'

const THEME_STORAGE_KEY = 'apple-on-the-desk-theme'
const VALID_MODES = ['light', 'dark', 'system']

const themeMode = ref('system')
const effectiveTheme = ref('dark')

let initialized = false
let mediaQuery = null

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function getSystemTheme() {
  if (!isBrowser()) return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyVuetifyTheme(themeName) {
  if (!vuetify?.theme) return
  if (typeof vuetify.theme.change === 'function') {
    vuetify.theme.change(themeName)
    return
  }
  if (vuetify.theme.global?.name?.value != null) {
    vuetify.theme.global.name.value = themeName
  }
}

function applyEffectiveTheme(themeName) {
  effectiveTheme.value = themeName
  if (!isBrowser()) return
  document.documentElement.setAttribute('data-theme', themeName)
  applyVuetifyTheme(themeName)
}

function resolveAndApplyTheme() {
  const resolved = themeMode.value === 'system' ? getSystemTheme() : themeMode.value
  applyEffectiveTheme(resolved)
}

function readStoredThemeMode() {
  if (!isBrowser()) return 'system'
  try {
    const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY)
    return VALID_MODES.includes(storedMode) ? storedMode : 'system'
  } catch {
    return 'system'
  }
}

function writeStoredThemeMode(mode) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    /* ignore storage errors */
  }
}

function ensureSystemListener() {
  if (!isBrowser() || mediaQuery) return
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemThemeChange = () => {
    if (themeMode.value === 'system') {
      resolveAndApplyTheme()
    }
  }
  mediaQuery.addEventListener('change', handleSystemThemeChange)
}

export function initTheme() {
  if (initialized) return
  themeMode.value = readStoredThemeMode()
  resolveAndApplyTheme()
  ensureSystemListener()
  initialized = true
}

export function useTheme() {
  const setThemeMode = (mode) => {
    if (!VALID_MODES.includes(mode)) return
    themeMode.value = mode
    writeStoredThemeMode(mode)
    resolveAndApplyTheme()
  }

  return {
    themeMode: computed(() => themeMode.value),
    effectiveTheme: computed(() => effectiveTheme.value),
    setThemeMode,
    availableThemeModes: VALID_MODES,
  }
}
