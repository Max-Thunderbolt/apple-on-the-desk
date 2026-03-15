import { ref, computed } from 'vue'
import server from '@/services/server'

const config = ref(null)
const progress = ref(null)
const loading = ref(false)
const loaded = ref(false)

export function useOnboarding() {
  async function fetchConfig() {
    const res = await server.getTutorialStructure()
    config.value = res.structure
  }

  async function fetchProgress() {
    const res = await server.getOnboardingProgress()
    progress.value = res.progress
  }

  async function loadOnboarding() {
    if (loaded.value) return
    loading.value = true
    try {
      await Promise.all([fetchConfig(), fetchProgress()])
      loaded.value = true
    } catch (err) {
      console.error('Error loading onboarding:', err)
    } finally {
      loading.value = false
    }
  }

  async function completeField(fieldKey) {
    if (!progress.value) return
    const keys = new Set(progress.value.completedFieldKeys || [])
    keys.add(fieldKey)
    progress.value = {
      ...progress.value,
      completedFieldKeys: [...keys],
    }
    await server.upsertOnboardingProgress({
      completedCategoryKeys: progress.value.completedCategoryKeys,
      completedFieldKeys: progress.value.completedFieldKeys,
      dismissedAt: progress.value.dismissedAt,
    })
  }

  async function uncompleteField(fieldKey) {
    if (!progress.value) return
    const keys = new Set(progress.value.completedFieldKeys || [])
    keys.delete(fieldKey)
    progress.value = {
      ...progress.value,
      completedFieldKeys: [...keys],
    }
    await server.upsertOnboardingProgress({
      completedCategoryKeys: progress.value.completedCategoryKeys,
      completedFieldKeys: progress.value.completedFieldKeys,
      dismissedAt: progress.value.dismissedAt,
    })
  }

  async function completeCategory(categoryKey) {
    if (!progress.value) return
    const keys = new Set(progress.value.completedCategoryKeys || [])
    keys.add(categoryKey)
    progress.value = {
      ...progress.value,
      completedCategoryKeys: [...keys],
    }
    await server.upsertOnboardingProgress({
      completedCategoryKeys: progress.value.completedCategoryKeys,
      completedFieldKeys: progress.value.completedFieldKeys,
      dismissedAt: progress.value.dismissedAt,
    })
  }

  async function dismissOnboarding() {
    if (!progress.value) return
    const now = new Date().toISOString()
    progress.value = { ...progress.value, dismissedAt: now }
    await server.upsertOnboardingProgress({
      completedCategoryKeys: progress.value.completedCategoryKeys,
      completedFieldKeys: progress.value.completedFieldKeys,
      dismissedAt: now,
    })
  }

  function isFieldComplete(fieldKey) {
    return progress.value?.completedFieldKeys?.includes(fieldKey) ?? false
  }

  function isCategoryComplete(categoryKey) {
    return progress.value?.completedCategoryKeys?.includes(categoryKey) ?? false
  }

  const completedFieldCount = computed(() => progress.value?.completedFieldKeys?.length ?? 0)

  const totalFieldCount = computed(() => {
    if (!config.value) return 0
    return config.value.categories.reduce((sum, c) => sum + c.fields.length, 0)
  })

  const needsOnboarding = computed(() => {
    if (!progress.value) return false
    if (progress.value.dismissedAt) return false
    return (progress.value.completedFieldKeys?.length ?? 0) === 0
  })

  function reset() {
    config.value = null
    progress.value = null
    loaded.value = false
  }

  return {
    config,
    progress,
    loading,
    loaded,
    loadOnboarding,
    completeField,
    uncompleteField,
    completeCategory,
    dismissOnboarding,
    isFieldComplete,
    isCategoryComplete,
    completedFieldCount,
    totalFieldCount,
    needsOnboarding,
    reset,
  }
}
