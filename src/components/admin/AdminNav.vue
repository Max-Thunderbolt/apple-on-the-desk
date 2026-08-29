<template>
  <nav class="adminNav" aria-label="Admin navigation">
    <v-btn
      v-for="item in items"
      :key="item.path"
      size="small"
      variant="text"
      class="adminNavBtn"
      :class="{ 'adminNavBtn--active': isActive(item.path) }"
      :prepend-icon="item.icon"
      @click="router.push(item.path)"
    >
      {{ item.label }}
    </v-btn>
  </nav>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const items = [
  { path: '/AdminDashboard', label: 'Overview', icon: 'mdi-view-dashboard-outline' },
  { path: '/AdminSchools', label: 'Schools', icon: 'mdi-domain' },
  { path: '/AdminSchoolGroups', label: 'School groups', icon: 'mdi-folder-multiple-outline' },
]

function isActive(path) {
  return route.path === path
}
</script>

<style scoped>
.adminNav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 1.25rem;
  padding: 0.35rem;
  border-radius: 14px;
  border: 1px solid rgba(var(--ink-rgb), 0.08);
  background: rgba(var(--ink-rgb), 0.03);
}

.adminNavBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  letter-spacing: 0.01em !important;
  color: rgba(var(--ink-rgb), 0.55) !important;
  border-radius: 10px !important;
}

.adminNavBtn--active {
  color: var(--white) !important;
  background: rgba(0, 168, 232, 0.18) !important;
  border: 1px solid rgba(0, 168, 232, 0.25);
}
</style>
