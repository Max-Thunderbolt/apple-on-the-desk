import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBillingStatus } from './useBillingStatus'
import { useUserProfile } from './useUserProfile'

/**
 * Composable for teacher views to check billing lock status
 * and prevent write operations when soft/hard locked.
 */
export function useBillingLockCheck() {
  const route = useRoute()
  const { teacherSchools } = useUserProfile()
  const { fetchBillingStatus, canWriteData, shouldShowBanner, shouldBlockAccess } = useBillingStatus()

  const billingStatus = ref(null)
  const loading = ref(false)
  const showModal = ref(false)
  const modalDismissed = ref(false)

  const schoolId = computed(() => {
    if (teacherSchools.value.length === 0) return null
    return teacherSchools.value[0].schoolId
  })

  const isLocked = computed(() => {
    if (!billingStatus.value) return false
    return billingStatus.value.status === 'soft_locked' || billingStatus.value.status === 'locked'
  })

  const isSoftLocked = computed(() => {
    return billingStatus.value?.status === 'soft_locked'
  })

  const isHardLocked = computed(() => {
    return billingStatus.value?.status === 'locked'
  })

  const showBanner = computed(() => {
    if (!billingStatus.value) return false
    return shouldShowBanner(billingStatus.value.status)
  })

  const blockAccess = computed(() => {
    if (!billingStatus.value) return false
    return shouldBlockAccess(billingStatus.value.status)
  })

  const canWrite = computed(() => {
    if (!billingStatus.value) return true
    return canWriteData(billingStatus.value.status)
  })

  const daysRemaining = computed(() => {
    if (!billingStatus.value?.softLockDate) return 0
    const now = new Date()
    const lockDate = new Date(billingStatus.value.softLockDate)
    const diff = lockDate - now
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })

  async function checkBillingStatus() {
    if (!schoolId.value) return

    loading.value = true
    try {
      billingStatus.value = await fetchBillingStatus(schoolId.value)

      if (isSoftLocked.value && !modalDismissed.value) {
        const lastShown = sessionStorage.getItem('soft-lock-modal-shown')
        const now = Date.now()
        if (!lastShown || now - parseInt(lastShown) > 86400000) {
          showModal.value = true
          sessionStorage.setItem('soft-lock-modal-shown', now.toString())
        }
      }
    } finally {
      loading.value = false
    }
  }

  function dismissModal() {
    showModal.value = false
    modalDismissed.value = true
  }

  function checkWriteAction(actionName = 'this action') {
    if (!canWrite.value) {
      return {
        allowed: false,
        reason: isSoftLocked.value
          ? `School billing — soft lock. Contact your school admin to restore access.`
          : `School billing — access paused. Contact your school admin.`,
      }
    }
    return { allowed: true }
  }

  watch(schoolId, () => {
    if (schoolId.value) {
      checkBillingStatus()
    }
  })

  onMounted(() => {
    if (schoolId.value) {
      checkBillingStatus()
    }
  })

  return {
    billingStatus,
    loading,
    isLocked,
    isSoftLocked,
    isHardLocked,
    showBanner,
    blockAccess,
    canWrite,
    daysRemaining,
    showModal,
    dismissModal,
    checkBillingStatus,
    checkWriteAction,
  }
}
