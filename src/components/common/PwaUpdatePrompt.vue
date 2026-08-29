<template>
  <v-snackbar v-model="show" location="top" :timeout="-1" color="primary" rounded="lg">
    <span class="updateText">A new version is ready.</span>
    <template #actions>
      <v-btn variant="flat" color="surface" class="updateBtn" @click="applyUpdate">Refresh</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { computed } from 'vue';
import { usePwaUpdate } from '@/composables/usePwaUpdate';

const { needRefresh, applyUpdate } = usePwaUpdate();
const show = computed({
  get: () => needRefresh.value,
  set: (v) => {
    if (!v) needRefresh.value = false;
  },
});
</script>

<style scoped>
.updateText {
  font-family: var(--font);
  font-weight: 600;
}

.updateBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}
</style>
