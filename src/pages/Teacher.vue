<template>
  <div class="container teacherPage">
    <div class="teacherShell">
    <TeacherNav />
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
        <div v-if="isPlatformAdmin || hasSchoolAdmin" class="dashLinks">
          <v-btn v-if="isPlatformAdmin" size="small" variant="tonal" class="dashLink"
            @click="navigateTo('/AdminSchools')">
            Manage schools
          </v-btn>
          <v-btn v-if="isPlatformAdmin" size="small" variant="tonal" class="dashLink"
            @click="navigateTo('/AdminDashboard')">
            Admin dashboard
          </v-btn>
          <v-btn v-if="hasSchoolAdmin" size="small" variant="tonal" class="dashLink"
            @click="navigateTo('/SchoolAdminOverview')">
            School dashboard
          </v-btn>
        </div>
        <v-tabs v-model="activeTab" class="teacherTabs" bg-color="transparent" grow>
          <v-tab value="insights" class="teacherTab">Insights</v-tab>
          <v-tab value="profile" class="teacherTab">Profile</v-tab>
        </v-tabs>
        <v-window v-model="activeTab" class="teacherWindow">
          <v-window-item value="insights" class="insightsWindowItem">
            <TeacherInsights class="insightsWindowItemContent" />
          </v-window-item>
          <v-window-item value="profile" class="teacherWindowItem">
            <Profile class="teacherWindowItemContent" :embedded="true" />
          </v-window-item>
        </v-window>
      </div>
    </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useUserProfile } from '@/composables/useUserProfile';
import Profile from '@/pages/Profile.vue';
import TeacherInsights from '@/components/teacher/TeacherInsights.vue';
import TeacherNav from '@/components/navigation/TeacherNav.vue';

const router = useRouter();
const route = useRoute();
const { authReady, isSignedIn } = useAuth();
const { isPlatformAdmin, schoolAdminSchoolIds } = useUserProfile();
const hasSchoolAdmin = computed(() => schoolAdminSchoolIds.value.length > 0);
const activeTab = ref('insights');

function resolveTabFromQuery() {
  const tab = route.query.tab;
  if (tab === 'profile' || tab === 'insights') {
    activeTab.value = tab;
  }
}

onMounted(resolveTabFromQuery);

watch(() => route.query.tab, resolveTabFromQuery);

function navigateTo(path) {
  router.push(path);
}
</script>

<style scoped>
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

.insightsWindowItem {
  padding: 1rem;
  display: flex;
}

.insightsWindowItemContent {
  width: 100%;
}

.teacherPage {
  align-items: stretch;
  justify-content: flex-start !important;
  padding-top: 1rem;
  padding-bottom: 3rem;
}

.teacherShell {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
}

@media (min-width: 768px) {
  .teacherShell {
    padding: 0 1.5rem 3rem;
  }
}

.dashLinks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.dashLink {
  text-transform: none !important;
  font-family: var(--font) !important;
}

.loadingState,
.signedOutState {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.loadingText,
.signedOutMessage {
  font-family: var(--font);
  color: rgba(var(--ink-rgb), 0.85);
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
  border: 1px solid rgba(var(--ink-rgb), 0.18) !important;
}

.teacherContent {
  width: 100%;
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
  color: rgba(var(--ink-rgb), 0.7) !important;
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
</style>
