<template>
  <nav class="saNav" aria-label="School admin navigation">
    <v-btn
      v-for="item in items"
      :key="item.path"
      size="small"
      variant="text"
      class="saNavBtn"
      :class="{ 'saNavBtn--active': isActive(item.path) }"
      :prepend-icon="item.icon"
      @click="go(item.path)"
    >
      {{ item.label }}
    </v-btn>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserProfile } from '@/composables/useUserProfile'

const router = useRouter()
const route = useRoute()
const { teacherSchools } = useUserProfile()

const items = computed(() => {
  const nav = [
    { path: '/SchoolAdminOnboarding', label: 'Teachers', icon: 'mdi-account-plus-outline' },
    { path: '/SchoolAdminDashboard', label: 'Dashboard', icon: 'mdi-google-classroom' },
    { path: '/SchoolAdminOverview', label: 'Overview', icon: 'mdi-view-dashboard-outline' },
  ]
  if (teacherSchools.value.length > 0) {
    nav.push({ path: '/Classes', label: 'My classes', icon: 'mdi-book-open-variant' })
  }
  return nav
})

function isActive(path) {
  return route.path === path
}

function go(path) {
  if (path === '/Classes') {
    router.push('/Classes')
    return
  }
  const schoolId = route.query.schoolId
  if (schoolId && path !== '/SchoolAdminOverview') {
    router.push({ path, query: { schoolId } })
    return
  }
  router.push(path)
}
</script>

<style scoped>
.saNav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 1.25rem;
  padding: 0.35rem;
  border-radius: 14px;
  border: 1px solid rgba(var(--ink-rgb), 0.08);
  background: rgba(var(--ink-rgb), 0.03);
}

.saNavBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  letter-spacing: 0.01em !important;
  color: rgba(var(--ink-rgb), 0.55) !important;
  border-radius: 10px !important;
}

.saNavBtn--active {
  color: var(--white) !important;
  background: rgba(26, 147, 111, 0.18) !important;
  border: 1px solid rgba(26, 147, 111, 0.25);
}
</style>
