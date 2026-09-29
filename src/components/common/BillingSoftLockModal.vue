<template>
  <v-dialog v-model="show" max-width="520" persistent>
    <v-card class="softLockModal">
      <div class="modalHeader">
        <v-icon size="48" color="rgba(237,108,2,0.9)">mdi-lock-open-variant</v-icon>
      </div>

      <v-card-title class="modalTitle">School billing — soft lock active</v-card-title>

      <v-card-text class="modalText">
        <p class="modalMessage">
          Your school's billing needs attention. You can view classes and data, but you cannot:
        </p>

        <ul class="modalList">
          <li>Award or modify points</li>
          <li>Make shop purchases</li>
          <li>Invite new students</li>
          <li>Change class or shop settings</li>
        </ul>

        <div class="modalInfoBox">
          <v-icon size="20" color="rgba(var(--ink-rgb), 0.6)">mdi-information-outline</v-icon>
          <p>
            <strong>Your data is safe.</strong> Contact your school admin to resolve billing and restore full access.
          </p>
        </div>
      </v-card-text>

      <v-card-actions class="modalActions">
        <v-spacer />
        <v-btn variant="text" @click="dismiss">Understood</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

function dismiss() {
  show.value = false
}
</script>

<style scoped>
.softLockModal {
  font-family: var(--font);
}

.modalHeader {
  display: flex;
  justify-content: center;
  padding: 1.5rem 1.5rem 0;
}

.modalTitle {
  font-weight: 600;
  font-size: 1.2rem;
  text-align: center;
  padding: 0.5rem 1.5rem;
}

.modalText {
  padding: 1rem 1.5rem;
  font-size: 0.9rem;
  line-height: 1.6;
}

.modalMessage {
  margin: 0 0 1rem;
  color: rgba(var(--ink-rgb), 0.75);
}

.modalList {
  margin: 0 0 1.25rem;
  padding-left: 1.5rem;
  color: rgba(var(--ink-rgb), 0.7);
}

.modalList li {
  margin-bottom: 0.4rem;
}

.modalInfoBox {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem;
  background: rgba(var(--ink-rgb), 0.04);
  border-radius: 10px;
  border: 1px solid rgba(var(--ink-rgb), 0.08);
}

.modalInfoBox p {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.75);
  line-height: 1.5;
}

.modalActions {
  padding: 0 1rem 1rem;
}
</style>
