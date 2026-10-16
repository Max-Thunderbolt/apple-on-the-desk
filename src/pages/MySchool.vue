<template>
  <div class="container mySchoolPage">
    <div class="mySchoolShell">
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

        <div v-else class="mySchoolContent">
          <header class="mySchoolHeader">
            <div class="mySchoolHeaderLeft">
              <h1 class="mySchoolTitle">
                My <span class="titleAccent">School</span>
              </h1>
              <p class="mySchoolSubtitle">
                Compare your classes with colleagues and review school-wide performance.
              </p>
            </div>
          </header>

          <TeacherInsights class="insightsContent" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import TeacherInsights from '@/components/teacher/TeacherInsights.vue';

const router = useRouter();
const { authReady, isSignedIn } = useAuth();

function navigateTo(path) {
  router.push(path);
}
</script>

<style scoped>
.mySchoolPage {
  align-items: stretch;
  justify-content: flex-start !important;
  padding-top: 1rem;
  padding-bottom: 3rem;
}

.mySchoolShell {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

@media (min-width: 768px) {
  .mySchoolShell {
    padding: 0 1.5rem 3rem;
  }
}

.mySchoolContent {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.mySchoolHeader {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.mySchoolHeaderLeft {
  min-width: 0;
  flex: 1;
}

.mySchoolTitle {
  font-family: var(--font);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--white);
  margin: 0 0 0.35rem;
}

.titleAccent {
  background: linear-gradient(135deg, rgba(26, 147, 111, 0.9) 0%, rgba(0, 168, 232, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.mySchoolSubtitle {
  font-family: var(--font);
  font-size: 0.95rem;
  color: rgba(var(--ink-rgb), 0.7);
  margin: 0;
  max-width: 36rem;
  line-height: 1.45;
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

.insightsContent {
  width: 100%;
  padding: 1.25rem 1rem 1.5rem;
  border-radius: 16px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  background: rgba(var(--ink-rgb), 0.03);
}

@media (min-width: 768px) {
  .insightsContent {
    padding: 1.5rem 1.25rem 1.75rem;
  }
}
</style>
