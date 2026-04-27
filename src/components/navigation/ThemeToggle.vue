<template>
  <div class="themeToggle">
    <v-menu location="bottom end" :close-on-content-click="true">
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          icon
          size="small"
          variant="flat"
          class="themeToggleButton"
          :aria-label="`Theme: ${themeModeLabel}`"
        >
          <v-icon size="18">{{ themeIcon }}</v-icon>
        </v-btn>
      </template>
      <v-list class="themeToggleMenu" density="compact">
        <v-list-item
          v-for="mode in themeOptions"
          :key="mode.value"
          :active="themeMode === mode.value"
          @click="setThemeMode(mode.value)"
        >
          <template #prepend>
            <v-icon size="18">{{ mode.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ mode.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { themeMode, setThemeMode } = useTheme()

const themeOptions = [
  { value: 'light', label: 'Light', icon: 'mdi-white-balance-sunny' },
  { value: 'dark', label: 'Dark', icon: 'mdi-weather-night' },
  { value: 'system', label: 'System', icon: 'mdi-monitor' },
]

const themeModeLabel = computed(() => {
  const option = themeOptions.find((item) => item.value === themeMode.value)
  return option?.label ?? 'System'
})

const themeIcon = computed(() => {
  const option = themeOptions.find((item) => item.value === themeMode.value)
  return option?.icon ?? 'mdi-monitor'
})
</script>

<style scoped>
.themeToggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1200;
}

.themeToggleButton {
  border: 1px solid var(--color-border) !important;
  background: var(--color-surface-elevated) !important;
  color: var(--color-text) !important;
  box-shadow: 0 8px 24px var(--color-shadow) !important;
}

.themeToggleMenu {
  border-radius: 12px !important;
  border: 1px solid var(--color-border-soft) !important;
  background: var(--color-surface-elevated) !important;
}

.themeToggleMenu :deep(.v-list-item-title) {
  color: var(--color-text) !important;
  font-family: var(--font);
  font-size: 0.85rem;
}

.themeToggleMenu :deep(.v-list-item--active) {
  background: var(--color-surface-hover) !important;
}

.themeToggleMenu :deep(.v-icon) {
  color: var(--color-text-muted) !important;
}
</style>
