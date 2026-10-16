/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'
import { useAuth, waitForAuthReady } from '@/composables/useAuth'
import {
  profileLoaded,
  fetchUserProfile,
  isPlatformAdmin,
  schoolAdminSchoolIds,
  memberships,
} from '@/composables/useUserProfile'
import { resolvePostAuthDestinationAsync, hasSchoolMembership } from '@/composables/usePostAuthDestination'
import { isAdminSetupComplete, resolvePrimaryAdminSchoolId } from '@/composables/useSchoolSetupStatus'
import { safeRedirect } from '@/utils/safeRedirect'

function getTeacherSchools() {
  return memberships.value.filter((m) => m.role === 'teacher')
}

function getSchoolAdminSchools() {
  return memberships.value.filter((m) => m.role === 'schoolAdmin')
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
})

const PUBLIC_PATHS = new Set(['/', '/Login'])

const SCHOOL_ADMIN_PATHS = new Set([
  '/SchoolAdminOverview',
  '/SchoolAdminDashboard',
  '/SchoolAdminOnboarding',
  '/SchoolAdminStudents',
  '/SchoolAdminBilling',
])

function isTeacherRoute(path) {
  return path === '/Classes' || path === '/AddClass' || path.startsWith('/Class/') || path === '/MySchool'
}

async function getResolverDestination(excludeRedirect = false) {
  return resolvePostAuthDestinationAsync({ redirectQuery: excludeRedirect ? null : undefined })
}

router.beforeEach(async (to) => {
  const { isSignedIn } = useAuth()
  // The first navigation happens before Firebase reports the auth state: wait for it,
  // otherwise protected pages render for signed-out visitors.
  await waitForAuthReady()

  // Handle /Teacher redirect to /MySchool
  if (to.path === '/Teacher') {
    if (to.query.tab === 'profile') {
      return '/Profile'
    }
    return { path: '/MySchool', query: to.query.tab === 'insights' ? {} : to.query }
  }

  // Signed out: the app root and any unknown path show the login form (no bounce to the marketing site)
  if (to.path === '/' && !isSignedIn.value) {
    return { path: '/Login' }
  }

  if (PUBLIC_PATHS.has(to.path) || to.path.startsWith('/Join/')) {
    if ((to.path === '/' || to.path === '/Login') && isSignedIn.value) {
      if (!profileLoaded.value) {
        try {
          await fetchUserProfile()
        } catch {
          return true
        }
      }
      return safeRedirect(to.query.redirect) || (await getResolverDestination(true))
    }
    return true
  }

  // Unknown routes render the 404 page for everyone
  if (to.name === '/[...path]') return true

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

  // Solo users: block teacher routes
  if (isTeacherRoute(to.path) && getTeacherSchools().length === 0 && !isPlatformAdmin.value) {
    if (schoolAdminSchoolIds.value.length > 0) {
      const schoolId =
        (typeof to.query.schoolId === 'string' ? to.query.schoolId : null) ||
        schoolAdminSchoolIds.value[0]
      const complete = await isAdminSetupComplete(schoolId)
      return complete
        ? '/SchoolAdminOverview'
        : { path: '/SchoolAdminOnboarding', query: { schoolId } }
    }
    return '/GetStarted'
  }

  // GetStarted only for users without school membership
  if (to.path === '/GetStarted' && hasSchoolMembership()) {
    const dest = await getResolverDestination(true)
    return dest
  }

  if ((to.path === '/AdminDashboard' || to.path === '/AdminSchools' || to.path === '/AdminSchoolGroups') && !isPlatformAdmin.value) {
    const dest = await getResolverDestination(true)
    return dest
  }

  if (SCHOOL_ADMIN_PATHS.has(to.path) && schoolAdminSchoolIds.value.length === 0) {
    const dest = await getResolverDestination(true)
    return dest
  }

  // Gate Overview when admin setup incomplete
  if (to.path === '/SchoolAdminOverview' && schoolAdminSchoolIds.value.length > 0) {
    const querySchoolId = typeof to.query.schoolId === 'string' ? to.query.schoolId : null
    const schoolId =
      querySchoolId ||
      (await resolvePrimaryAdminSchoolId(getSchoolAdminSchools())) ||
      schoolAdminSchoolIds.value[0]
    const complete = await isAdminSetupComplete(schoolId)
    if (!complete) {
      return { path: '/SchoolAdminOnboarding', query: { schoolId } }
    }
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
