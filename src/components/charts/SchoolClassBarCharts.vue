<template>
  <section class="chartsRow">
    <div class="chartPanel">
      <h2 class="chartTitle">
        <v-icon size="20" class="chartTitleIcon">mdi-chart-bar</v-icon>
        Students per class
      </h2>
      <div class="chartWrap">
        <Bar v-if="studentsPerClassData" :data="studentsPerClassData" :options="barOptions" />
        <div v-else class="chartEmpty">No class data</div>
      </div>
    </div>
    <div class="chartPanel">
      <h2 class="chartTitle">
        <v-icon size="20" class="chartTitleIcon chartTitleIcon--gold">mdi-star-four-points</v-icon>
        {{ useNormalizedEngagement ? 'Class engagement rank' : 'Class experience (XP)' }}
      </h2>
      <div class="chartWrap">
        <Bar v-if="classXPData" :data="classXPData" :options="xpBarOptions" />
        <div v-else class="chartEmpty">{{ useNormalizedEngagement ? 'No engagement data' : 'No XP data' }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { toRef } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { useSchoolClassCharts } from '@/composables/useSchoolClassCharts';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const props = defineProps({
  classes: { type: Array, default: () => [] },
  useNormalizedEngagement: { type: Boolean, default: false },
});

const classesRef = toRef(props, 'classes');
const useNormalizedRef = toRef(props, 'useNormalizedEngagement');
const {
  studentsPerClassData,
  classXPData,
  barOptions,
  xpBarOptions,
} = useSchoolClassCharts(classesRef, useNormalizedRef);
</script>

<style scoped>
.chartsRow {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

@media (min-width: 900px) {
  .chartsRow {
    grid-template-columns: 1fr 1fr;
  }
}

.chartPanel {
  padding: 1.25rem;
  border-radius: 18px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: linear-gradient(160deg, rgba(var(--color-bg-rgb), 0.65) 0%, rgba(var(--color-bg-rgb), 0.4) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 28px rgba(var(--shadow-rgb), 0.2), inset 0 1px 0 rgba(var(--ink-rgb), 0.04);
}

.chartTitle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--white);
  margin: 0 0 1rem;
}

.chartTitleIcon {
  opacity: 0.7;
  color: var(--freshSky);
}

.chartTitleIcon--gold {
  color: rgba(247, 183, 7, 0.9);
}

.chartWrap {
  position: relative;
  height: 220px;
}

.chartEmpty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-family: var(--font);
  color: rgba(var(--ink-rgb), 0.35);
  font-size: 0.9rem;
}
</style>
