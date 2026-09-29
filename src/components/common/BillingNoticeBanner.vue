<template>
  <div v-if="show" class="billingBanner" :class="bannerClass">
    <div class="bannerContent">
      <v-icon size="20" :color="iconColor">{{ icon }}</v-icon>
      <div class="bannerBody">
        <p class="bannerMessage">{{ message }}</p>
        <p v-if="detail" class="bannerDetail">{{ detail }}</p>
      </div>
    </div>
    <v-btn
      v-if="dismissible"
      icon="mdi-close"
      size="x-small"
      variant="text"
      class="bannerClose"
      @click="dismiss"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (v) => ['notice', 'soft_locked', 'locked'].includes(v),
  },
  schoolName: {
    type: String,
    default: '',
  },
  daysRemaining: {
    type: Number,
    default: 0,
  },
  dismissible: {
    type: Boolean,
    default: false,
  },
})

const dismissed = ref(false)

const show = computed(() => {
  if (props.status === 'locked') return false
  return !dismissed.value
})

const bannerClass = computed(() => `billingBanner--${props.status}`)

const icon = computed(() => {
  if (props.status === 'notice') return 'mdi-alert-outline'
  if (props.status === 'soft_locked') return 'mdi-lock-open-variant-outline'
  return 'mdi-lock'
})

const iconColor = computed(() => {
  if (props.status === 'notice') return 'rgba(247,183,7,0.95)'
  if (props.status === 'soft_locked') return 'rgba(237,108,2,0.95)'
  return 'rgba(197,40,61,0.95)'
})

const message = computed(() => {
  if (props.status === 'notice') {
    return `School billing notice — access may limit after ${props.daysRemaining} days. Ask your school admin.`
  }
  if (props.status === 'soft_locked') {
    return 'School billing — soft lock. You can browse but cannot award points or make changes.'
  }
  return 'School billing — access paused.'
})

const detail = computed(() => {
  if (props.status === 'soft_locked') {
    return 'Contact your school admin to resolve billing and restore full access.'
  }
  return ''
})

function dismiss() {
  if (props.dismissible) {
    dismissed.value = true
    sessionStorage.setItem(`billing-banner-dismissed-${props.status}`, 'true')
  }
}

watch(() => props.status, () => {
  dismissed.value = false
})

onMounted(() => {
  if (props.dismissible) {
    dismissed.value = sessionStorage.getItem(`billing-banner-dismissed-${props.status}`) === 'true'
  }
})
</script>

<style scoped>
.billingBanner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  border-radius: 12px;
  border: 1px solid;
  font-family: var(--font);
  backdrop-filter: blur(14px);
}

.billingBanner--notice {
  background: rgba(247, 183, 7, 0.1);
  border-color: rgba(247, 183, 7, 0.3);
}

.billingBanner--soft_locked {
  background: rgba(237, 108, 2, 0.1);
  border-color: rgba(237, 108, 2, 0.3);
}

.bannerContent {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.bannerBody {
  flex: 1;
  min-width: 0;
}

.bannerMessage {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--white);
  margin: 0 0 0.25rem;
  line-height: 1.4;
}

.bannerDetail {
  font-size: 0.8rem;
  color: rgba(var(--ink-rgb), 0.65);
  margin: 0;
  line-height: 1.4;
}

.bannerClose {
  color: rgba(var(--ink-rgb), 0.5) !important;
  flex-shrink: 0;
}
</style>
