import { ref, computed } from 'vue'
import server from '@/services/server'

export const profileLoaded = ref(false)
export const user = ref(null)
export const memberships = ref([])
export const isPlatformAdmin = ref(false)
export const schoolAdminSchoolIds = ref([])

export function applyUserProfilePayload(data) {
  if (!data || data.success === false) return
  user.value = data.user ?? null
  memberships.value = data.memberships ?? []
  isPlatformAdmin.value = !!data.isPlatformAdmin
  schoolAdminSchoolIds.value = data.schoolAdminSchoolIds ?? []
  profileLoaded.value = true
}

export async function fetchUserProfile() {
  const data = await server.getUser()
  applyUserProfilePayload(data)
  return data
}

export function clearUserProfile() {
  user.value = null
  memberships.value = []
  isPlatformAdmin.value = false
  schoolAdminSchoolIds.value = []
  profileLoaded.value = false
}

export function useUserProfile() {
  const schoolAdminSchools = computed(() =>
    memberships.value.filter((m) => m.role === 'schoolAdmin')
  )
  const teacherSchools = computed(() =>
    memberships.value.filter((m) => m.role === 'teacher')
  )

  return {
    profileLoaded,
    user,
    memberships,
    isPlatformAdmin,
    schoolAdminSchoolIds,
    schoolAdminSchools,
    teacherSchools,
    applyUserProfilePayload,
    fetchUserProfile,
    clearUserProfile,
  }
}
