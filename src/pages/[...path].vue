<template>
  <div class="container notFound">
    <v-icon size="56" class="notFoundIcon">mdi-map-marker-question-outline</v-icon>
    <h1 class="title">Page <span class="titleAccent">not found</span></h1>
    <p class="notFoundText">The page <code>{{ route.fullPath }}</code> doesn't exist.</p>
    <v-btn class="notFoundBtn" :to="isSignedIn ? '/' : '/Login'" variant="outlined">
      {{ isSignedIn ? 'Go to my classes' : 'Sign in' }}
    </v-btn>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { isSignedIn } = useAuth()
</script>

<style scoped>
.notFound {
  gap: 1rem;
  text-align: center;
}

.notFoundIcon {
  color: rgba(var(--ink-rgb), 0.45);
}

.notFoundText {
  font-family: var(--font);
  color: rgba(var(--ink-rgb), 0.7);
  word-break: break-all;
}

.notFoundBtn {
  font-family: var(--font) !important;
  text-transform: none !important;
  border-radius: 12px !important;
}
</style>
