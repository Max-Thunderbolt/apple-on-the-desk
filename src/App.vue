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
import { Toaster } from 'vue-sonner'
import { useAuth } from '@/composables/useAuth'
import { useTheme } from '@/composables/useTheme'
import { fetchUserProfile, clearUserProfile } from '@/composables/useUserProfile'
import PwaUpdatePrompt from '@/components/common/PwaUpdatePrompt.vue'

const { authReady, isSignedIn } = useAuth()
const { effectiveTheme } = useTheme()

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
