<template>
  <v-app>
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
import { fetchUserProfile, clearUserProfile } from '@/composables/useUserProfile'

const { authReady, isSignedIn } = useAuth()

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
