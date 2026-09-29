import { ref, computed } from 'vue'
import Server from '@/services/server'

const billingCache = ref(new Map())

export function useBillingStatus() {
  const loading = ref(false)
  const error = ref(null)

  async function fetchBillingStatus(schoolId, forceRefresh = false) {
    if (!schoolId) {
      error.value = 'No school ID provided'
      return null
    }

    if (!forceRefresh && billingCache.value.has(schoolId)) {
      return billingCache.value.get(schoolId)
    }

    loading.value = true
    error.value = null

    try {
      const data = await Server.getSchoolBillingStatus(schoolId)
      billingCache.value.set(schoolId, data)
      return data
    } catch (e) {
      error.value = e.response?.data?.message || e.message || 'Failed to load billing status'
      return null
    } finally {
      loading.value = false
    }
  }

  function clearCache(schoolId = null) {
    if (schoolId) {
      billingCache.value.delete(schoolId)
    } else {
      billingCache.value.clear()
    }
  }

  function getBillingStatus(schoolId) {
    return billingCache.value.get(schoolId) || null
  }

  function isLocked(status) {
    return status === 'soft_locked' || status === 'locked'
  }

  function canWriteData(status) {
    return !['soft_locked', 'locked'].includes(status)
  }

  function shouldShowBanner(status) {
    return ['notice', 'soft_locked'].includes(status)
  }

  function shouldBlockAccess(status) {
    return status === 'locked'
  }

  return {
    loading,
    error,
    fetchBillingStatus,
    clearCache,
    getBillingStatus,
    isLocked,
    canWriteData,
    shouldShowBanner,
    shouldBlockAccess,
  }
}
