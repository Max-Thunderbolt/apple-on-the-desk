<template>
  <div class="lockGate">
    <div class="lockGateCard">
      <img v-if="logoSrc" :src="logoSrc" alt="Apple On The Desk" class="lockGateLogo" />
      <div v-else class="lockGateLogoPlaceholder">
        <v-icon size="64" color="rgba(var(--ink-rgb), 0.3)">mdi-apple</v-icon>
      </div>

      <v-icon size="72" color="rgba(197,40,61,0.8)" class="lockGateIcon">mdi-lock</v-icon>

      <h1 class="lockGateTitle">Access paused</h1>

      <p class="lockGateMessage">
        Your school's billing needs attention. Classroom features are temporarily unavailable.
      </p>

      <div class="lockGateDetails">
        <div class="lockGateDetail">
          <v-icon size="20" color="rgba(var(--ink-rgb), 0.5)">mdi-shield-check-outline</v-icon>
          <span>Your school's data is kept safe</span>
        </div>
        <div class="lockGateDetail">
          <v-icon size="20" color="rgba(var(--ink-rgb), 0.5)">mdi-account-tie-outline</v-icon>
          <span>Contact your school admin to resolve</span>
        </div>
      </div>

      <v-btn
        variant="outlined"
        size="large"
        prepend-icon="mdi-email-outline"
        class="lockGateBtn"
        :href="`mailto:${schoolAdminEmail}`"
      >
        Contact school admin
      </v-btn>

      <p class="lockGateFooter">
        Access will restore automatically when billing is resolved.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  schoolName: {
    type: String,
    default: '',
  },
  schoolAdminEmail: {
    type: String,
    default: '',
  },
  logoSrc: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.lockGate {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(var(--color-bg-rgb), 0.95) 0%, rgba(var(--color-bg-rgb), 0.98) 100%);
  backdrop-filter: blur(20px);
  padding: 1rem;
}

.lockGateCard {
  max-width: 480px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2.5rem 2rem;
  border-radius: 24px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  background: linear-gradient(160deg, rgba(var(--color-bg-rgb), 0.75) 0%, rgba(var(--color-bg-rgb), 0.5) 100%);
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 48px rgba(var(--shadow-rgb), 0.3), inset 0 1px 0 rgba(var(--ink-rgb), 0.06);
}

.lockGateLogo {
  width: 120px;
  height: auto;
  margin-bottom: 1.5rem;
}

.lockGateLogoPlaceholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 80px;
  margin-bottom: 1.5rem;
}

.lockGateIcon {
  margin-bottom: 1.5rem;
  opacity: 0.9;
}

.lockGateTitle {
  font-family: var(--font);
  font-weight: 700;
  font-size: 2rem;
  color: var(--white);
  margin: 0 0 1rem;
  line-height: 1.2;
}

.lockGateMessage {
  font-family: var(--font);
  font-size: 1rem;
  color: rgba(var(--ink-rgb), 0.7);
  margin: 0 0 2rem;
  line-height: 1.5;
  max-width: 360px;
}

.lockGateDetails {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  margin-bottom: 2rem;
  padding: 1.25rem;
  background: rgba(var(--ink-rgb), 0.04);
  border-radius: 12px;
}

.lockGateDetail {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font);
  font-size: 0.9rem;
  color: rgba(var(--ink-rgb), 0.8);
  text-align: left;
}

.lockGateBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(var(--ink-rgb), 0.2) !important;
}

.lockGateFooter {
  font-family: var(--font);
  font-size: 0.8rem;
  color: rgba(var(--ink-rgb), 0.45);
  margin: 0;
  line-height: 1.4;
}
</style>
