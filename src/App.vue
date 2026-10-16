<template>
  <v-app>
    <Toaster
      position="top-right"
      :theme="effectiveTheme"
      :duration="3500"
      :visible-toasts="4"
      close-button
      :toast-options="{
        classNames: {
          toast: 'app-toast',
          title: 'app-toast__title',
          description: 'app-toast__description',
          closeButton: 'app-toast__close',
          success: 'app-toast--success',
          error: 'app-toast--error',
          info: 'app-toast--info',
          warning: 'app-toast--warning',
        },
      }"
    />
    <PwaUpdatePrompt />
    <template v-if="authReady">
      <router-view />
    </template>
    <template v-else>
      <div class="loading">
        <div style="height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <v-progress-circular indeterminate color="primary" size="100" width="10" />
        </div>
      </div>
    </template>
  </v-app>
</template>

<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { Toaster, toast } from 'vue-sonner'
import { useAuth } from '@/composables/useAuth'
import { useTheme } from '@/composables/useTheme'
import { fetchUserProfile, clearUserProfile } from '@/composables/useUserProfile'
import { useBillingLockCheck } from '@/composables/useBillingLockCheck'
import { setResponseHandlers } from '@/services/server'
import PwaUpdatePrompt from '@/components/common/PwaUpdatePrompt.vue'

const router = useRouter()
const { authReady, isSignedIn, signOut } = useAuth()
const { effectiveTheme } = useTheme()
const billingLock = useBillingLockCheck()

let handlingUnauthorized = false
setResponseHandlers({
  // Expired or revoked session: sign out and come back here after logging in again
  async onUnauthorized() {
    if (!isSignedIn.value || handlingUnauthorized) return
    handlingUnauthorized = true
    try {
      const redirect = router.currentRoute.value.fullPath
      await signOut()
      toast.info('Your session has expired. Please sign in again.', { id: 'session-expired' })
      await router.replace({ path: '/Login', query: redirect && redirect !== '/Login' ? { redirect } : {} })
    } finally {
      handlingUnauthorized = false
    }
  },
  // 403 { billingStatus, lockReason } from a classroom route
  onBillingLock(data) {
    const label = data.billingStatus === 'locked' ? 'locked' : 'soft lock'
    toast.error(`School billing: ${label}`, { id: 'billing-lock', description: data.lockReason })
    billingLock.refresh()
  },
})

watch(
  [authReady, isSignedIn],
  async ([ready, signed]) => {
    if (!ready) return
    if (signed) {
      try {
        await fetchUserProfile()
      } catch {
        /* ignore */
      }
    } else {
      clearUserProfile()
    }
  },
  { immediate: true }
)
</script>
