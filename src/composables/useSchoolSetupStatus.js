import { ref } from 'vue'
import server from '@/services/server'

const statusCache = new Map()

export function computeSetupStatus(teachers = []) {
  const teacherCount = teachers.length
  const hasActiveTeachers = teachers.some((t) => (t.classCount ?? 0) > 0)
  return {
    teacherCount,
    hasActiveTeachers,
    isSetupComplete: teacherCount > 0 && hasActiveTeachers,
  }
}

export async function loadSchoolSetupStatus(schoolId) {
  if (!schoolId) {
    return { teacherCount: 0, hasActiveTeachers: false, isSetupComplete: false, teachers: [] }
  }
  if (statusCache.has(schoolId)) {
    return statusCache.get(schoolId)
  }
  try {
    const dash = await server.getSchoolDashboard(schoolId)
    const teachers = dash.teachers || []
    const status = { ...computeSetupStatus(teachers), teachers }
    statusCache.set(schoolId, status)
    return status
  } catch {
    const fallback = { teacherCount: 0, hasActiveTeachers: false, isSetupComplete: false, teachers: [] }
    statusCache.set(schoolId, fallback)
    return fallback
  }
}

export function clearSchoolSetupStatusCache(schoolId) {
  if (schoolId) statusCache.delete(schoolId)
  else statusCache.clear()
}

export function useSchoolSetupStatus() {
  const loading = ref(false)
  const teacherCount = ref(0)
  const hasActiveTeachers = ref(false)
  const isSetupComplete = ref(false)
  const teachers = ref([])

  async function load(schoolId) {
    loading.value = true
    try {
      const status = await loadSchoolSetupStatus(schoolId)
      teacherCount.value = status.teacherCount
      hasActiveTeachers.value = status.hasActiveTeachers
      isSetupComplete.value = status.isSetupComplete
      teachers.value = status.teachers
      return status
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    teacherCount,
    hasActiveTeachers,
    isSetupComplete,
    teachers,
    load,
  }
}

/** First incomplete school admin school, or first school if all complete. */
export async function resolvePrimaryAdminSchoolId(schoolAdminSchools) {
  const schools = schoolAdminSchools || []
  if (!schools.length) return null

  for (const school of schools) {
    const status = await loadSchoolSetupStatus(school.schoolId)
    if (!status.isSetupComplete) return school.schoolId
  }
  return schools[0].schoolId
}

export async function isAnyAdminSetupIncomplete(schoolAdminSchools) {
  const schools = schoolAdminSchools || []
  for (const school of schools) {
    const status = await loadSchoolSetupStatus(school.schoolId)
    if (!status.isSetupComplete) return true
  }
  return false
}

export async function isAdminSetupComplete(schoolId) {
  const status = await loadSchoolSetupStatus(schoolId)
  return status.isSetupComplete
}
