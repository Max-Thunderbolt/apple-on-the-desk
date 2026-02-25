<template>
  <v-breadcrumbs density="compact"
    :items="[{ title: 'Home', to: '/' }, { title: 'Classes', to: '/classes' }, { title: 'Teacher', to: '/Teacher' }]"
    class="breadcrumbs">
    <template v-slot:divider>
      <v-icon>mdi-chevron-right</v-icon>
    </template>
  </v-breadcrumbs>
  <div class="container teacherPage">
    <div v-if="!authReady" class="loadingState">
      <v-progress-circular indeterminate color="primary" size="64" width="6" />
      <span class="loadingText">Loading...</span>
    </div>
    <template v-else>
      <div v-if="!isSignedIn" class="signedOutState">
        <p class="signedOutMessage">You are not signed in.</p>
        <v-btn class="submitButton" @click="navigateTo('/Login')">
          Sign in or create account
        </v-btn>
      </div>
      <div v-else class="teacherContent">
        <div class="title">
          <span class="titleAccent">Teacher</span>
        </div>
        <v-tabs v-model="activeTab" class="teacherTabs" bg-color="transparent" grow>
          <v-tab value="profile" class="teacherTab">Profile</v-tab>
          <v-tab value="performance" class="teacherTab">Class Performance</v-tab>
        </v-tabs>
        <v-window v-model="activeTab" class="teacherWindow">
          <v-window-item value="profile">
            <Profile :embedded="true" />
          </v-window-item>
          <v-window-item value="performance">
            <ClassPerformance />
          </v-window-item>
        </v-window>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import Profile from '@/pages/Profile.vue';
import ClassPerformance from '@/components/ClassPerformance.vue';

const router = useRouter();
const { authReady, isSignedIn } = useAuth();
const activeTab = ref('profile');

function navigateTo(path) {
  router.push(path);
}
</script>

<style scoped>
@import '../styles/style.css';

.teacherPage {
  justify-content: flex-start !important;
  padding-top: 1rem;
}

/* .breadcrumbs {
  margin-bottom: 1rem;
}

.breadcrumbs :deep(.v-breadcrumbs-item) {
  font-family: var(--font);
  color: var(--white) !important;
  opacity: 1 !important;
}

.breadcrumbs :deep(.v-breadcrumbs-item--disabled) {
  color: var(--white) !important;
  opacity: 1 !important;
} */

.loadingState,
.signedOutState {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.loadingText,
.signedOutMessage {
  font-family: var(--font);
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.submitButton {
  font-family: var(--font) !important;
  font-weight: 600 !important;
  text-transform: none !important;
  border-radius: 16px !important;
  background: linear-gradient(135deg,
      rgba(0, 168, 232, 0.55) 0%,
      rgba(0, 168, 232, 0.35) 50%,
      rgba(0, 168, 232, 0.45) 100%) !important;
  color: var(--white) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
}

.teacherContent {
  width: 100%;
  max-width: 900px;
}

.teacherTabs :deep(.v-tab) {
  font-family: var(--font);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.02em;
}

.teacherTab {
  color: rgba(255, 255, 255, 0.7) !important;
}

.teacherTabs :deep(.v-tab--selected) {
  color: var(--white) !important;
}

.teacherTabs :deep(.v-tabs-slider) {
  background-color: var(--freshSky);
}

.teacherWindow {
  margin-top: 1rem;
}
</style>
