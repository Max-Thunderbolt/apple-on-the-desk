<template>
  <span class="billingStatusChip" :class="chipClass">
    <v-icon v-if="showIcon" size="14">{{ chipIcon }}</v-icon>
    <span>{{ chipLabel }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (v) => ['trial', 'invoiced', 'paid', 'notice', 'soft_locked', 'locked'].includes(v),
  },
  pilot: {
    type: Boolean,
    default: false,
  },
  showIcon: {
    type: Boolean,
    default: true,
  },
})

const chipClass = computed(() => {
  const base = `billingStatusChip--${props.status}`
  return props.pilot ? [base, 'billingStatusChip--pilot'] : base
})

const chipLabel = computed(() => {
  const labels = {
    trial: 'Trial',
    invoiced: 'Invoiced',
    paid: 'Paid',
    notice: 'Notice',
    soft_locked: 'Soft lock',
    locked: 'Locked',
  }
  return props.pilot ? 'Pilot' : labels[props.status]
})

const chipIcon = computed(() => {
  const icons = {
    trial: 'mdi-flask-outline',
    invoiced: 'mdi-file-document-outline',
    paid: 'mdi-check-circle',
    notice: 'mdi-alert-outline',
    soft_locked: 'mdi-lock-open-variant-outline',
    locked: 'mdi-lock',
  }
  return props.pilot ? 'mdi-crown-outline' : icons[props.status]
})
</script>

<style scoped>
.billingStatusChip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-family: var(--font);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  border: 1px solid;
  white-space: nowrap;
}

.billingStatusChip--trial {
  color: rgba(0, 168, 232, 0.9);
  background: rgba(0, 168, 232, 0.08);
  border-color: rgba(0, 168, 232, 0.25);
}

.billingStatusChip--invoiced {
  color: rgba(0, 120, 232, 0.9);
  background: rgba(0, 120, 232, 0.08);
  border-color: rgba(0, 120, 232, 0.25);
}

.billingStatusChip--paid {
  color: rgba(26, 147, 111, 0.95);
  background: rgba(26, 147, 111, 0.08);
  border-color: rgba(26, 147, 111, 0.3);
}

.billingStatusChip--notice {
  color: rgba(247, 183, 7, 0.95);
  background: rgba(247, 183, 7, 0.08);
  border-color: rgba(247, 183, 7, 0.3);
}

.billingStatusChip--soft_locked {
  color: rgba(237, 108, 2, 0.95);
  background: rgba(237, 108, 2, 0.08);
  border-color: rgba(237, 108, 2, 0.3);
}

.billingStatusChip--locked {
  color: rgba(197, 40, 61, 0.95);
  background: rgba(197, 40, 61, 0.08);
  border-color: rgba(197, 40, 61, 0.3);
}

.billingStatusChip--pilot {
  color: rgba(168, 51, 185, 0.95);
  background: rgba(168, 51, 185, 0.08);
  border-color: rgba(168, 51, 185, 0.3);
}
</style>
