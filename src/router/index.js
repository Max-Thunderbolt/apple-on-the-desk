/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'
import { useAuth } from '@/composables/useAuth'
import {
  profileLoaded,
  fetchUserProfile,
  isPlatformAdmin,
  schoolAdminSchoolIds,
} from '@/composables/useUserProfile'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
})

const PUBLIC_PATHS = new Set(['/', '/Login'])

router.beforeEach(async (to) => {
  const { authReady, isSignedIn } = useAuth()
  if (!authReady.value) return true

  if (PUBLIC_PATHS.has(to.path) || to.path.startsWith('/Join/')) return true

  if (!isSignedIn.value) {
    return { path: '/Login', query: { redirect: to.fullPath } }
  }

  if (!profileLoaded.value) {
    try {
      await fetchUserProfile()
    } catch {
      return { path: '/Login', query: { redirect: to.fullPath } }
    }
  }

  if (to.path === '/AdminDashboard' && !isPlatformAdmin.value) {
    return { path: '/' }
  }
  if (to.path === '/SchoolAdminDashboard' && schoolAdminSchoolIds.value.length === 0) {
    return { path: '/' }
  }

  return true
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
