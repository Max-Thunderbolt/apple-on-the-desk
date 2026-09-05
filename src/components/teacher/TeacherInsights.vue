<template>
  <div class="teacherInsights">
    <div class="insightsToolbar">
      <v-btn-toggle v-model="scope" mandatory density="comfortable" class="scopeToggle" divided>
        <v-btn value="myClasses" size="small" prepend-icon="mdi-google-classroom">
          My classes
        </v-btn>
        <v-btn value="mySchool" size="small" prepend-icon="mdi-domain">
          My school
        </v-btn>
      </v-btn-toggle>

      <div v-if="scope === 'mySchool' && hasTeacherSchools" class="controlRow">
        <v-select
          v-if="schoolOptions.length > 1"
          v-model="selectedSchoolId"
          :items="schoolOptions"
          item-title="schoolName"
          item-value="schoolId"
          label="School"
          density="compact"
          hide-details
          variant="outlined"
          class="controlField glassField"
          :menu-props="{ contentClass: 'classPerformanceMenu' }"
          @update:model-value="onSchoolOrTermChange"
        />
        <v-select
          v-model="year"
          :items="yearItems"
          label="Year"
          density="compact"
          hide-details
          variant="outlined"
          class="controlField yearField glassField"
          :menu-props="{ contentClass: 'classPerformanceMenu' }"
          @update:model-value="onSchoolOrTermChange"
        />
        <v-select
          v-model="term"
          :items="termItems"
          item-title="title"
          item-value="value"
          label="Term"
          density="compact"
          hide-details
          variant="outlined"
          class="controlField termField glassField"
          :menu-props="{ contentClass: 'classPerformanceMenu' }"
          @update:model-value="onSchoolOrTermChange"
        />
        <v-btn
          size="small"
          icon="mdi-refresh"
          variant="tonal"
          class="refreshBtn"
          :loading="loading"
          aria-label="Refresh insights"
          @click="loadInsights"
        />
      </div>
    </div>

    <MyClassInsights
      v-if="scope === 'myClasses'"
      :school-averages="schoolAveragesForMyClasses"
      :use-normalized-engagement="useNormalizedEngagement"
      :peer-class-scores="peerClassScoreMap"
    />

    <template v-else-if="scope === 'mySchool'">
      <div v-if="!hasTeacherSchools" class="noSchoolState">
        <v-icon size="48" class="noSchoolIcon">mdi-school-outline</v-icon>
        <h3 class="noSchoolTitle">Join a school to compare with colleagues</h3>
        <p class="noSchoolText">
          School insights show how your classes compare to other teachers at your school.
        </p>
        <v-btn class="noSchoolBtn" @click="router.push('/GetStarted')">
          Get started with a school invite
        </v-btn>
      </div>
      <template v-else>
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="insightsAlert"
          rounded="lg"
          closable
          @click:close="clearError"
        >
          {{ error }}
        </v-alert>
        <SchoolInsights
          :insights="insights"
          :loading="loading"
          :classes-by-teacher="classesByTeacher"
          :is-own-class="isOwnClass"
          :school-averages="schoolAverages"
          :is-group-view="isGroupView"
          :use-normalized-engagement="useNormalizedEngagement"
          :display-title="displayTitle"
          :group-context="groupContext"
        />
      </template>
    </template>

    <div class="insightsFooter">
      <router-link to="/Onboarding" class="tutorialsAnchor">
        <v-icon size="16">mdi-school-outline</v-icon>
        Tutorials
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserProfile } from '@/composables/useUserProfile';
import { useTeacherSchoolInsights } from '@/composables/useTeacherSchoolInsights';
import MyClassInsights from '@/components/teacher/MyClassInsights.vue';
import SchoolInsights from '@/components/teacher/SchoolInsights.vue';

const router = useRouter();
const { teacherSchools } = useUserProfile();

const scope = ref('myClasses');

const {
  selectedSchoolId,
  year,
  term,
  insights,
  groupContext,
  isGroupView,
  useNormalizedEngagement,
  displayTitle,
  loading,
  error,
  schoolOptions,
  classesByTeacher,
  isOwnClass,
  schoolAverages,
  loadInsights,
  initSchoolSelection,
} = useTeacherSchoolInsights();

const hasTeacherSchools = computed(() => teacherSchools.value.length > 0);

const currentYear = new Date().getFullYear();
const yearItems = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

const termItems = [
  { title: 'All terms', value: null },
  { title: 'T1 · Jan–Apr', value: 1 },
  { title: 'T2 · May–Aug', value: 2 },
  { title: 'T3 · Sep–Dec', value: 3 },
];

const schoolAveragesForMyClasses = computed(() => {
  if (!hasTeacherSchools.value) return null;
  if (insights.value && selectedSchoolId.value) return schoolAverages.value;
  return null;
});

const peerClassScoreMap = computed(() => {
  const map = new Map();
  for (const c of insights.value?.classes || []) {
    if (c.id) map.set(c.id, c);
  }
  return map;
});

function onSchoolOrTermChange() {
  loadInsights();
}

function clearError() {
  error.value = '';
}

watch(scope, async (newScope) => {
  if (newScope === 'mySchool' && hasTeacherSchools.value) {
    initSchoolSelection();
    if (selectedSchoolId.value) {
      await loadInsights();
    }
  }
});

onMounted(async () => {
  if (hasTeacherSchools.value) {
    initSchoolSelection();
    await loadInsights();
  }
});
</script>

<style scoped>
.teacherInsights {
  width: 100%;
  font-family: var(--font);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.insightsToolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: 16px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  background: rgba(var(--ink-rgb), 0.04);
}

.scopeToggle {
  flex-wrap: wrap;
}

.scopeToggle :deep(.v-btn) {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  letter-spacing: 0.01em;
}

.controlRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.controlField {
  min-width: 140px;
  max-width: 200px;
}

.yearField {
  max-width: 100px;
}

.termField {
  max-width: 160px;
}

.glassField :deep(.v-field) {
  background: rgba(var(--ink-rgb), 0.04);
  border-radius: 12px;
}

.refreshBtn {
  border-radius: 10px !important;
}

.insightsAlert {
  margin: 0;
}

.noSchoolState {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.65rem;
  padding: 2.75rem 1.5rem;
  border-radius: 20px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  background: rgba(var(--ink-rgb), 0.04);
}

.noSchoolIcon {
  color: rgba(var(--freshSky-rgb), 0.75);
  margin-bottom: 0.15rem;
}

.noSchoolTitle {
  font-family: var(--font);
  font-weight: 600;
  font-size: 1.25rem;
  color: var(--white);
  margin: 0;
}

.noSchoolText {
  font-family: var(--font);
  color: rgba(var(--ink-rgb), 0.65);
  margin: 0;
  max-width: 28rem;
  line-height: 1.45;
}

.noSchoolBtn {
  margin-top: 0.35rem;
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}

.insightsFooter {
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
}

.tutorialsAnchor {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font);
  color: rgba(var(--freshSky-rgb), 0.95);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(var(--freshSky-rgb), 0.28);
  background: rgba(var(--freshSky-rgb), 0.08);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.tutorialsAnchor:hover {
  background: rgba(var(--freshSky-rgb), 0.14);
  border-color: rgba(var(--freshSky-rgb), 0.45);
}
</style>
