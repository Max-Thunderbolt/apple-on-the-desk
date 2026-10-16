import { ref, computed, watch } from 'vue'
import Server from '@/services/server'
import { memberships, isPlatformAdmin } from './useUserProfile'

/**
 * Teacher-side billing lock state, shared app-wide (mounted once in layouts/default.vue).
 *
 * Reads GET /schools/:id/billing-status (teachers allowed) for every school the user teaches at.
 * Mirrors the API's rule for user-wide classroom routes: classroom access is only paused when
 * every one of the teacher's schools is locked; the banner shows the most severe status.
 */

const DAY_MS = 24 * 60 * 60 * 1000
const MODAL_KEY = 'aotd:soft-lock-modal-shown'
const SEVERITY = { trial: 0, invoiced: 0, paid: 0, notice: 1, soft_locked: 2, locked: 3 }

const statuses = ref([]) // [{ schoolId, schoolName, status, pilot, noticeStartedAt, softLockAt, lockedAt }]
const loading = ref(false)
const showModal = ref(false)
let inFlight = null

const teacherSchoolIds = computed(() =>
  [...new Set(memberships.value.filter((m) => m.role === 'teacher').map((m) => m.schoolId))].filter(Boolean),
)

const applies = computed(() => !isPlatformAdmin.value && teacherSchoolIds.value.length > 0)

/** The most severe school status (drives the banner) */
const primary = computed(() => {
  if (!applies.value || !statuses.value.length) return null
  return [...statuses.value].sort((a, b) => (SEVERITY[b.status] ?? 0) - (SEVERITY[a.status] ?? 0))[0]
})

const isSoftLocked = computed(() => primary.value?.status === 'soft_locked')

/** Hard-lock gate: only when every teacher school is locked */
const blockAccess = computed(
  () => applies.value && statuses.value.length > 0 && statuses.value.every((s) => s.status === 'locked'),
)

const showBanner = computed(() => ['notice', 'soft_locked'].includes(primary.value?.status))

const canWrite = computed(() => !['soft_locked', 'locked'].includes(primary.value?.status))

const daysRemaining = computed(() => {
  const at = primary.value?.softLockAt
  if (!at) return 0
  return Math.max(0, Math.ceil((at - Date.now()) / DAY_MS))
})

function readModalShownAt() {
  try {
    return Number(localStorage.getItem(MODAL_KEY)) || 0
  } catch {
    return 0
  }
}

function writeModalShownAt(ts) {
  try {
    localStorage.setItem(MODAL_KEY, String(ts))
  } catch {
    /* storage unavailable: the modal may show again, which is harmless */
  }
}

function maybeShowSoftLockModal() {
  if (!isSoftLocked.value) return
  const now = Date.now()
  if (now - readModalShownAt() > DAY_MS) {
    showModal.value = true
    writeModalShownAt(now)
  }
}

async function refresh() {
  if (!applies.value) {
    statuses.value = []
    return
  }
  if (inFlight) return inFlight
  loading.value = true
  inFlight = Promise.all(
    teacherSchoolIds.value.map((id) => Server.getSchoolBillingLockStatus(id).catch(() => null)),
  )
    .then((results) => {
      statuses.value = results.filter(Boolean)
      maybeShowSoftLockModal()
    })
    .finally(() => {
      loading.value = false
      inFlight = null
    })
  return inFlight
}

watch(teacherSchoolIds, (ids, prev) => {
  if (ids.join() !== (prev || []).join()) refresh()
})

export function useBillingLockCheck() {
  function dismissModal() {
    showModal.value = false
  }

  function checkWriteAction() {
    if (canWrite.value) return { allowed: true }
    return {
      allowed: false,
      reason: isSoftLocked.value
        ? 'School billing: soft lock. Contact your school admin to restore access.'
        : 'School billing: access paused. Contact your school admin.',
    }
  }

  return {
    billingStatus: primary,
    statuses,
    loading,
    isSoftLocked,
    isHardLocked: blockAccess,
    showBanner,
    blockAccess,
    canWrite,
    daysRemaining,
    showModal,
    dismissModal,
    checkBillingStatus: refresh,
    refresh,
    checkWriteAction,
  }
}
