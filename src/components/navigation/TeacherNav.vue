<template>
  <nav class="teacherNav" aria-label="Teacher navigation">
    <v-btn
      v-for="item in items"
      :key="item.key"
      size="small"
      variant="text"
      class="teacherNavBtn"
      :class="{ 'teacherNavBtn--active': isActive(item) }"
      :prepend-icon="item.icon"
      @click="navigate(item)"
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
  {
    key: 'classes',
    path: '/Classes',
    label: 'Classes',
    icon: 'mdi-google-classroom',
    match: (p) => p === '/Classes' || p.startsWith('/Class/') || p === '/AddClass',
  },
  {
    key: 'insights',
    path: '/Teacher',
    query: { tab: 'insights' },
    label: 'Insights',
    icon: 'mdi-chart-line',
    match: (p) => p === '/Teacher',
  },
  {
    key: 'onboarding',
    path: '/Onboarding',
    label: 'Tutorials',
    icon: 'mdi-school-outline',
    match: (p) => p === '/Onboarding',
  },
]

function isActive(item) {
  return item.match(route.path)
}

function navigate(item) {
  if (item.query) {
    router.push({ path: item.path, query: item.query })
  } else {
    router.push(item.path)
  }
}
</script>

<style scoped>
.teacherNav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;
  margin-bottom: 1.25rem;
  padding: 0.35rem;
  border-radius: 14px;
  border: 1px solid rgba(var(--ink-rgb), 0.08);
  background: rgba(var(--ink-rgb), 0.03);
}

.teacherNavBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  letter-spacing: 0.01em !important;
  color: rgba(var(--ink-rgb), 0.55) !important;
  border-radius: 10px !important;
}

.teacherNavBtn--active {
  color: var(--white) !important;
  background: rgba(26, 147, 111, 0.18) !important;
  border: 1px solid rgba(26, 147, 111, 0.25);
}
</style>
