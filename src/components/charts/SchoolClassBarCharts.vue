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
        <v-icon size="20" class="chartTitleIcon">mdi-star-four-points</v-icon>
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
  margin-top: 1rem;
}

@media (min-width: 900px) {
  .chartsRow {
    grid-template-columns: 1fr 1fr;
  }
}

.chartPanel {
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  padding: 1rem;
}

.chartTitle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 600;
  color: var(--white);
  margin: 0 0 0.75rem 0;
}

.chartTitleIcon {
  color: var(--freshSky);
}

.chartWrap {
  height: 220px;
}

.chartEmpty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-family: var(--font);
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
</style>
