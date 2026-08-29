<template>
  <div />
</template>

<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { resolvePostAuthDestinationAsync } from '@/composables/usePostAuthDestination'
import { INFO_SITE_URL } from '@/config/siteUrls'

const router = useRouter()
const { authReady, isSignedIn } = useAuth()

watch(
  [authReady, isSignedIn],
  async ([ready, signed]) => {
    if (!ready) return
    if (!signed) {
      window.location.replace(INFO_SITE_URL)
      return
    }
    const dest = await resolvePostAuthDestinationAsync({})
    if (typeof dest === 'string') {
      router.replace(dest)
    } else {
      router.replace(dest)
    }
  },
  { immediate: true }
)
</script>
