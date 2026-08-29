<template>
  <div class="teacherInsights">
    <div class="scopeRow">
      <v-btn-toggle v-model="scope" mandatory density="comfortable" class="scopeToggle">
        <v-btn value="myClasses" size="small">My classes</v-btn>
        <v-btn value="mySchool" size="small">My school</v-btn>
      </v-btn-toggle>

      <div v-if="scope === 'mySchool' && hasTeacherSchools" class="controlRow">
        <v-select v-if="schoolOptions.length > 1" v-model="selectedSchoolId" :items="schoolOptions"
          item-title="schoolName" item-value="schoolId" label="School" density="compact" hide-details
          variant="outlined" class="controlField" :menu-props="{ contentClass: 'classPerformanceMenu' }"
          @update:model-value="onSchoolOrTermChange" />
        <v-select v-model="year" :items="yearItems" label="Year" density="compact" hide-details variant="outlined"
          class="controlField yearField" :menu-props="{ contentClass: 'classPerformanceMenu' }"
          @update:model-value="onSchoolOrTermChange" />
        <v-select v-model="term" :items="termItems" item-title="title" item-value="value" label="Term"
          density="compact" hide-details variant="outlined" class="controlField termField"
          :menu-props="{ contentClass: 'classPerformanceMenu' }" @update:model-value="onSchoolOrTermChange" />
        <v-btn size="small" icon="mdi-refresh" variant="tonal" :loading="loading" @click="loadInsights" />
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
        <p class="noSchoolTitle">Join a school to compare with colleagues</p>
        <p class="noSchoolText">
          School insights show how your classes compare to other teachers at your school.
        </p>
        <v-btn class="noSchoolBtn" @click="router.push('/GetStarted')">
          Get started with a school invite
        </v-btn>
      </div>
      <template v-else>
        <v-alert v-if="error" type="error" variant="tonal" class="insightsAlert" rounded="lg" closable
          @click:close="clearError">
          {{ error }}
        </v-alert>
        <SchoolInsights :insights="insights" :loading="loading" :classes-by-teacher="classesByTeacher"
          :is-own-class="isOwnClass" :school-averages="schoolAverages" :is-group-view="isGroupView"
          :use-normalized-engagement="useNormalizedEngagement"
          :display-title="displayTitle" :group-context="groupContext" />
      </template>
    </template>

    <p class="tutorialsLink">
      <router-link to="/Onboarding" class="tutorialsAnchor">Tutorials</router-link>
    </p>
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
}

.insightsAlert {
  margin-bottom: 1rem;
}

.scopeRow {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.scopeToggle :deep(.v-btn) {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
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

.noSchoolState {
  text-align: center;
  padding: 2rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
}

.noSchoolTitle {
  font-family: var(--font);
  font-weight: 600;
  font-size: 1.15rem;
  color: var(--white);
  margin: 0 0 0.5rem 0;
}

.noSchoolText {
  font-family: var(--font);
  color: var(--color-text-muted);
  margin: 0 0 1rem 0;
}

.noSchoolBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}

.tutorialsLink {
  margin-top: 2rem;
  text-align: center;
}

.tutorialsAnchor {
  font-family: var(--font);
  color: rgba(0, 168, 232, 0.9);
  text-decoration: none;
  font-weight: 600;
}

.tutorialsAnchor:hover {
  color: var(--freshSky);
  text-decoration: underline;
}
</style>
