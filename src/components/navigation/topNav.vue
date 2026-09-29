<template>
  <div class="topNavContainer">
    <v-app-bar app elevation="0" class="topAppBar">
      <div class="topNavContent">
        <div class="leftColumn">
          <router-link to="/" class="logoLink">
            <img src="@/assets/apple-icon.svg" alt="Apple On The Desk" class="logo" />
          </router-link>

          <nav class="primaryNav" aria-label="Primary navigation">
            <template v-if="showDashboardsMenu">
              <v-menu offset-y>
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="small"
                    variant="text"
                    class="navBtn"
                    :class="{ 'navBtn--active': isDashboardsActive }"
                    append-icon="mdi-chevron-down"
                  >
                    Dashboards
                  </v-btn>
                </template>
                <v-list class="dashboardMenu">
                  <v-list-item
                    v-for="item in dashboardItems"
                    :key="item.path"
                    @click="navigate(item.path, item.query)"
                  >
                    <template #prepend>
                      <v-icon size="18">{{ item.icon }}</v-icon>
                    </template>
                    <v-list-item-title>{{ item.label }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>

            <v-btn
              v-for="item in leftNavItems"
              :key="item.key"
              size="small"
              variant="text"
              class="navBtn"
              :class="{ 'navBtn--active': isActive(item) }"
              :prepend-icon="item.icon"
              @click="navigate(item.path, item.query)"
            >
              {{ item.label }}
            </v-btn>
          </nav>
        </div>

        <div class="middleColumn">
          <template v-if="contextInfo">
            <v-chip
              v-if="contextInfo.type === 'school'"
              size="small"
              variant="tonal"
              class="contextChip"
              :prepend-icon="contextInfo.icon"
            >
              {{ contextInfo.label }}
            </v-chip>
            <div v-else-if="contextInfo.type === 'class'" class="classContext">
              <span class="contextLabel">{{ contextInfo.label }}</span>
              <div v-if="contextInfo.showShortcuts" class="classShortcuts">
                <v-btn
                  size="x-small"
                  variant="text"
                  class="shortcutBtn"
                  @click="navigate(`/Class/${contextInfo.classId}?tab=shop`)"
                >
                  Shop
                </v-btn>
                <span class="shortcutSep">·</span>
                <v-btn
                  size="x-small"
                  variant="text"
                  class="shortcutBtn"
                  @click="navigate(`/Class/${contextInfo.classId}?tab=timer`)"
                >
                  Timer
                </v-btn>
                <span class="shortcutSep">·</span>
                <v-btn
                  size="x-small"
                  variant="text"
                  class="shortcutBtn"
                  @click="navigate(`/Class/${contextInfo.classId}?tab=groups`)"
                >
                  Groups
                </v-btn>
              </div>
            </div>
          </template>
        </div>

        <div class="rightColumn">
          <v-menu offset-y location="bottom end">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                size="small"
                variant="text"
                class="profileBtn"
                :class="{ 'profileBtn--active': isProfileActive }"
              >
                <v-avatar size="28" color="rgba(0, 168, 232, 0.4)" class="profileAvatar">
                  <span class="avatarText">{{ avatarLetter }}</span>
                </v-avatar>
                <span class="profileName">{{ displayName }}</span>
                <v-icon size="18">mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list class="profileMenu">
              <v-list-item @click="navigate('/Profile')">
                <template #prepend>
                  <v-icon size="18">mdi-account-outline</v-icon>
                </template>
                <v-list-item-title>Profile</v-list-item-title>
              </v-list-item>
              <v-list-item @click="handleSignOut">
                <template #prepend>
                  <v-icon size="18">mdi-logout</v-icon>
                </template>
                <v-list-item-title>Sign out</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </v-app-bar>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useUserProfile } from '@/composables/useUserProfile'
import { useActiveClass } from '@/composables/useActiveClass'
import { toast } from 'vue-sonner'

const router = useRouter()
const route = useRoute()
const { user, signOut } = useAuth()
const { isPlatformAdmin, teacherSchools, schoolAdminSchools } = useUserProfile()
const { activeClassId, activeClassName } = useActiveClass()

const hasTeacherRole = computed(() => teacherSchools.value.length > 0)
const hasSchoolAdminRole = computed(() => schoolAdminSchools.value.length > 0)

const avatarLetter = computed(() => {
  const u = user.value
  if (u?.displayName) return u.displayName.charAt(0).toUpperCase()
  if (u?.email) return u.email.charAt(0).toUpperCase()
  return '?'
})

const displayName = computed(() => {
  const u = user.value
  if (u?.displayName) {
    const parts = u.displayName.split(' ')
    return parts[0]
  }
  if (u?.email) {
    return u.email.split('@')[0]
  }
  return 'User'
})

const showDashboardsMenu = computed(() => {
  return isPlatformAdmin.value || hasSchoolAdminRole.value
})

const dashboardItems = computed(() => {
  const items = []
  
  if (isPlatformAdmin.value) {
    items.push({
      path: '/AdminDashboard',
      label: 'Platform overview',
      icon: 'mdi-view-dashboard-outline',
    })
  }
  
  if (hasSchoolAdminRole.value) {
    items.push({
      path: '/SchoolAdminOverview',
      label: 'School overview',
      icon: 'mdi-view-dashboard-outline',
    })
    items.push({
      path: '/SchoolAdminDashboard',
      label: 'Classroom dashboard',
      icon: 'mdi-google-classroom',
    })
  }
  
  return items
})

const leftNavItems = computed(() => {
  const items = []
  
  if (hasSchoolAdminRole.value) {
    items.push({
      key: 'teachers',
      path: '/SchoolAdminOnboarding',
      label: 'Teachers',
      icon: 'mdi-account-plus-outline',
      match: (p) => p === '/SchoolAdminOnboarding',
    })
    items.push({
      key: 'students',
      path: '/SchoolAdminStudents',
      label: 'Students',
      icon: 'mdi-account-group-outline',
      match: (p) => p === '/SchoolAdminStudents',
    })
    items.push({
      key: 'billing',
      path: '/SchoolAdminBilling',
      label: 'Billing',
      icon: 'mdi-receipt-text-outline',
      match: (p) => p === '/SchoolAdminBilling',
    })
  }
  
  if (isPlatformAdmin.value) {
    items.push({
      key: 'schools',
      path: '/AdminSchools',
      label: 'Schools',
      icon: 'mdi-domain',
      match: (p) => p === '/AdminSchools',
    })
    items.push({
      key: 'school-groups',
      path: '/AdminSchoolGroups',
      label: 'School groups',
      icon: 'mdi-folder-multiple-outline',
      match: (p) => p === '/AdminSchoolGroups',
    })
  }
  
  if (hasTeacherRole.value) {
    items.push({
      key: 'my-classes',
      path: '/Classes',
      label: 'My Classes',
      icon: 'mdi-google-classroom',
      match: (p) => p === '/Classes' || p === '/AddClass' || p.startsWith('/Class/'),
    })
    items.push({
      key: 'my-school',
      path: '/MySchool',
      label: 'My School',
      icon: 'mdi-domain',
      match: (p) => p === '/MySchool' || p === '/Teacher',
    })
    items.push({
      key: 'tutorials',
      path: '/Onboarding',
      label: 'Tutorials',
      icon: 'mdi-school-outline',
      match: (p) => p === '/Onboarding',
    })
  }
  
  return items
})

const isDashboardsActive = computed(() => {
  const dashboardPaths = dashboardItems.value.map(item => item.path)
  return dashboardPaths.some(path => route.path === path)
})

const isProfileActive = computed(() => {
  return route.path === '/Profile'
})

const contextInfo = computed(() => {
  if (route.path.startsWith('/Class/') && activeClassId.value && activeClassName.value) {
    return {
      type: 'class',
      label: activeClassName.value,
      classId: activeClassId.value,
      showShortcuts: true,
    }
  }
  
  if (hasSchoolAdminRole.value && route.query.schoolId) {
    const school = schoolAdminSchools.value.find(s => s.schoolId === route.query.schoolId)
    if (school && route.path.startsWith('/SchoolAdmin')) {
      return {
        type: 'school',
        label: school.schoolName,
        icon: 'mdi-domain',
      }
    }
  }
  
  return null
})

function isActive(item) {
  return item.match(route.path)
}

function navigate(path, query = null) {
  const schoolId = route.query.schoolId
  
  if (path.startsWith('/SchoolAdmin') && schoolId && path !== '/SchoolAdminOverview') {
    router.push({ path, query: { schoolId, ...query } })
  } else if (query) {
    router.push({ path, query })
  } else {
    router.push(path)
  }
}

async function handleSignOut() {
  try {
    await signOut()
    toast.success('Signed out')
    router.push('/Login')
  } catch (err) {
    toast.error(err?.message || 'Sign out failed')
  }
}
</script>

<style scoped>
.topAppBar {
  background: rgba(var(--ink-rgb), 0.06) !important;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.12) !important;
  backdrop-filter: blur(20px);
}

.topNavContent {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 1rem;
  gap: 1.5rem;
}

.leftColumn {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.logoLink {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.logo {
  width: 32px;
  height: 32px;
}

.primaryNav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.navBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  letter-spacing: 0.01em !important;
  color: rgba(var(--ink-rgb), 0.7) !important;
  border-radius: 10px !important;
  transition: all 0.2s ease;
}

.navBtn:hover {
  color: var(--white) !important;
  background: rgba(var(--ink-rgb), 0.08) !important;
}

.navBtn--active {
  color: var(--white) !important;
  background: rgba(26, 147, 111, 0.18) !important;
  border: 1px solid rgba(26, 147, 111, 0.25);
}

.dashboardMenu,
.profileMenu {
  background: var(--inkBlack) !important;
  border: 1px solid rgba(var(--ink-rgb), 0.15);
  border-radius: 12px;
  padding: 0.5rem;
}

.dashboardMenu :deep(.v-list-item),
.profileMenu :deep(.v-list-item) {
  border-radius: 8px !important;
  font-family: var(--font) !important;
  min-height: 40px !important;
}

.dashboardMenu :deep(.v-list-item:hover),
.profileMenu :deep(.v-list-item:hover) {
  background: rgba(var(--ink-rgb), 0.08) !important;
}

.middleColumn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.contextChip {
  font-family: var(--font) !important;
  font-weight: 600 !important;
}

.classContext {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.contextLabel {
  font-family: var(--font);
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--white);
}

.classShortcuts {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.shortcutBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  font-size: 0.85rem !important;
  color: rgba(var(--ink-rgb), 0.65) !important;
  min-width: auto !important;
  padding: 0 0.5rem !important;
  height: 28px !important;
}

.shortcutBtn:hover {
  color: var(--white) !important;
  background: rgba(var(--ink-rgb), 0.08) !important;
}

.shortcutSep {
  color: rgba(var(--ink-rgb), 0.4);
  font-weight: 600;
}

.rightColumn {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}

.profileBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  color: rgba(var(--ink-rgb), 0.7) !important;
  border-radius: 24px !important;
  padding: 0.25rem 0.75rem 0.25rem 0.25rem !important;
  gap: 0.5rem !important;
}

.profileBtn:hover {
  color: var(--white) !important;
  background: rgba(var(--ink-rgb), 0.08) !important;
}

.profileBtn--active {
  color: var(--white) !important;
  background: rgba(0, 168, 232, 0.15) !important;
}

.profileAvatar {
  flex-shrink: 0;
}

.avatarText {
  font-family: var(--font);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--white);
}

.profileName {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .topNavContent {
    gap: 0.75rem;
  }
  
  .leftColumn {
    gap: 0.5rem;
  }
  
  .primaryNav {
    gap: 0.1rem;
  }
  
  .navBtn {
    font-size: 0.8rem !important;
    padding: 0 0.5rem !important;
  }
  
  .profileName {
    display: none;
  }
  
  .classShortcuts {
    display: none;
  }
}
</style>