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
          <v-tab value="settings" class="teacherTab">School</v-tab>
          <v-tab value="Onboarding" class="teacherTab">Tutorials</v-tab>
        </v-tabs>
        <v-window v-model="activeTab" class="teacherWindow">
          <v-window-item value="profile" class="teacherWindowItem">
            <Profile class="teacherWindowItemContent" :embedded="true" />
          </v-window-item>
          <v-window-item value="performance" class="performanceWindowItem">
            <ClassPerformance class="performanceWindowItemContent" />
          </v-window-item>
          <v-window-item value="school" class="teacherWindowItem">
            <!-- <School /> -->
          </v-window-item>
          <v-window-item value="Onboarding" class="onboardingWindowItem">
            <Onboarding :isChild="true" class="onboardingWindowItemContent" />
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
import Onboarding from '@/pages/Onboarding.vue';

const router = useRouter();
const { authReady, isSignedIn } = useAuth();
const activeTab = ref('profile');

function navigateTo(path) {
  router.push(path);
}
</script>

<style scoped>
@import '../styles/style.css';

.teacherWindowItem {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.teacherWindowItemContent {
  width: 100%;
  max-width: 420px;
}

.teacherPage {
  justify-content: flex-start !important;
  padding-top: 1rem;
}

.performanceWindowItem {
  padding: 1rem;
  display: flex;
}

.performanceWindowItemContent {
  width: 100%;
  /* max-width: 420px; */
}

.performancePage {
  width: 100%;
  height: 100%;
}

.loadingState,
.signedOutState {
  display: flex;
  flex-direction: row;
  align-items: center;
  /* gap: 1rem;
  padding: 2rem; */
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
  border-radius: 16px 16px 0 0 !important;
  border: 1px solid var(--freshSky) !important;
}

.teacherTabs :deep(.v-tab:hover) {
  color: white !important;
  opacity: 1 !important;
  border-radius: 8px 8px 0 0 !important;
  background-color: rgba(var(--freshSky-rgb), 0.1) !important;
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
  border-radius: 0 0 16px 16px;
  border: 1px solid var(--freshSky);
  margin-bottom: 1rem;
  background-color: rgba(var(--freshSky-rgb), 0.1);
}

.onboardingWindowItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.comingSoonText {
  font-family: var(--font);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--white);
}

.comingSoon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
