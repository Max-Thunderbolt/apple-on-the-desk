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
          <header class="teacherHeader">
            <div class="teacherHeaderLeft">
              <h1 class="teacherTitle">
                Teacher <span class="titleAccent">hub</span>
              </h1>
              <p class="teacherSubtitle">
                Compare class performance, review effort, and manage your profile.
              </p>
            </div>
            <div v-if="isPlatformAdmin || hasSchoolAdmin" class="dashLinks">
              <v-btn
                v-if="isPlatformAdmin"
                size="small"
                variant="tonal"
                class="dashLink"
                @click="navigateTo('/AdminSchools')"
              >
                Manage schools
              </v-btn>
              <v-btn
                v-if="isPlatformAdmin"
                size="small"
                variant="tonal"
                class="dashLink"
                @click="navigateTo('/AdminDashboard')"
              >
                Admin dashboard
              </v-btn>
              <v-btn
                v-if="hasSchoolAdmin"
                size="small"
                variant="tonal"
                class="dashLink"
                @click="navigateTo('/SchoolAdminOverview')"
              >
                School dashboard
              </v-btn>
            </div>
          </header>

          <v-tabs v-model="activeTab" class="teacherTabs" bg-color="transparent" density="comfortable">
            <v-tab value="insights" class="teacherTab">
              <v-icon start size="18">mdi-chart-box-outline</v-icon>
              Insights
            </v-tab>
            <v-tab value="profile" class="teacherTab">
              <v-icon start size="18">mdi-account-outline</v-icon>
              Profile
            </v-tab>
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
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

@media (min-width: 768px) {
  .teacherShell {
    padding: 0 1.5rem 3rem;
  }
}

.teacherContent {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.teacherHeader {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.teacherHeaderLeft {
  min-width: 0;
  flex: 1;
}

.teacherTitle {
  font-family: var(--font);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--white);
  margin: 0 0 0.35rem;
}

.teacherSubtitle {
  font-family: var(--font);
  font-size: 0.95rem;
  color: rgba(var(--ink-rgb), 0.7);
  margin: 0;
  max-width: 36rem;
  line-height: 1.45;
}

.dashLinks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.dashLink {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}

.loadingState,
.signedOutState {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
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
  background: linear-gradient(
    135deg,
    rgba(0, 168, 232, 0.55) 0%,
    rgba(0, 168, 232, 0.35) 50%,
    rgba(0, 168, 232, 0.45) 100%
  ) !important;
  color: var(--white) !important;
  border: 1px solid rgba(var(--ink-rgb), 0.18) !important;
}

.teacherTabs {
  margin-bottom: 0;
}

.teacherTabs :deep(.v-slide-group__content) {
  gap: 0.35rem;
}

.teacherTabs :deep(.v-tab) {
  font-family: var(--font);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.02em;
  border-radius: 12px 12px 0 0 !important;
  min-height: 44px;
  opacity: 1;
}

.teacherTab {
  color: rgba(var(--ink-rgb), 0.65) !important;
}

.teacherTabs :deep(.v-tab:hover) {
  color: var(--white) !important;
  background: rgba(var(--freshSky-rgb), 0.08) !important;
}

.teacherTabs :deep(.v-tab--selected) {
  color: var(--white) !important;
  background: rgba(var(--freshSky-rgb), 0.12) !important;
}

.teacherTabs :deep(.v-tabs-slider) {
  background-color: var(--freshSky);
  height: 3px !important;
}

.teacherWindow {
  border-radius: 0 16px 16px 16px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  background: rgba(var(--ink-rgb), 0.03);
  margin-bottom: 1rem;
  overflow: hidden;
}

.insightsWindowItem {
  padding: 1.25rem 1rem 1.5rem;
}

@media (min-width: 768px) {
  .insightsWindowItem {
    padding: 1.5rem 1.25rem 1.75rem;
  }
}

.insightsWindowItemContent {
  width: 100%;
}

.teacherWindowItem {
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.teacherWindowItemContent {
  width: 100%;
  max-width: 420px;
}
</style>
