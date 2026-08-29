import {
  isPlatformAdmin,
  schoolAdminSchoolIds,
  memberships,
} from '@/composables/useUserProfile'
import {
  isAnyAdminSetupIncomplete,
  resolvePrimaryAdminSchoolId,
} from '@/composables/useSchoolSetupStatus'

function getTeacherSchools() {
  return memberships.value.filter((m) => m.role === 'teacher')
}

function getSchoolAdminSchools() {
  return memberships.value.filter((m) => m.role === 'schoolAdmin')
}

/**
 * Sync resolver — use when admin setup status is unknown or already checked.
 */
export function resolvePostAuthDestination({ redirectQuery, adminSetupIncomplete = null } = {}) {
  if (typeof redirectQuery === 'string' && redirectQuery.startsWith('/')) {
    return redirectQuery
  }

  const adminIds = schoolAdminSchoolIds.value
  const teachers = getTeacherSchools()
  const platformAdmin = isPlatformAdmin.value

  if (adminIds.length > 0 && adminSetupIncomplete === true) {
    return { path: '/SchoolAdminOnboarding', query: { schoolId: adminIds[0] } }
  }

  if (teachers.length > 0 && adminSetupIncomplete !== true) {
    return '/Classes'
  }

  if (platformAdmin) {
    return '/AdminDashboard'
  }

  if (adminIds.length > 0 && adminSetupIncomplete === false) {
    return '/SchoolAdminOverview'
  }

  if (adminIds.length > 0) {
    return { path: '/SchoolAdminOnboarding', query: { schoolId: adminIds[0] } }
  }

  return '/GetStarted'
}

/** Async resolver — checks admin setup status before deciding destination. */
export async function resolvePostAuthDestinationAsync({ redirectQuery } = {}) {
  if (typeof redirectQuery === 'string' && redirectQuery.startsWith('/')) {
    return redirectQuery
  }

  const adminSchools = getSchoolAdminSchools()
  const teachers = getTeacherSchools()
  const platformAdmin = isPlatformAdmin.value

  if (adminSchools.length > 0) {
    const incomplete = await isAnyAdminSetupIncomplete(adminSchools)
    if (incomplete) {
      const schoolId = await resolvePrimaryAdminSchoolId(adminSchools)
      return { path: '/SchoolAdminOnboarding', query: schoolId ? { schoolId } : {} }
    }
  }

  if (teachers.length > 0) {
    return '/Classes'
  }

  if (platformAdmin) {
    return '/AdminDashboard'
  }

  if (adminSchools.length > 0) {
    return '/SchoolAdminOverview'
  }

  return '/GetStarted'
}

export function hasSchoolMembership() {
  return getTeacherSchools().length > 0 || schoolAdminSchoolIds.value.length > 0
}

export function getTeacherSchoolCount() {
  return getTeacherSchools().length
}
