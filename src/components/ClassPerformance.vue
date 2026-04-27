<template>
  <div class="classPerformance">
    <h2 class="sectionTitle">Class leaderboard</h2>
    <p class="sectionHint">Classes ranked by experience (highest rank first).</p>
    <div class="leaderboardSection">
      <div v-if="classesLoading" class="loadingRow">
        <v-progress-circular indeterminate color="primary" size="32" width="3" />
        <span>Loading classes...</span>
      </div>
      <div v-else-if="leaderboardRows.length === 0" class="emptyState">
        No classes yet. Create a class from the Classes page.
      </div>
      <ul v-else class="leaderboardList">
        <li v-for="(row, index) in leaderboardRows" :key="row.id" class="leaderboardItem">
          <div class="leaderboardCard" :style="getLeaderboardCardStyle(row)">
            <span class="leaderboardPosition">{{ index + 1 }}</span>
            <span class="leaderboardIcon" :title="row.rankName">{{ row.rankIcon }}</span>
            <span class="leaderboardName">{{ row.name }}</span>
            <span class="leaderboardRank">{{ row.rankName }}</span>
          </div>
          <div v-if="row.topStudents && row.topStudents.length" class="leaderboardTopThree">
            <span v-for="(student, si) in row.topStudents" :key="row.id + '-top-' + si" class="topStudentChip" :class="[
              si === 0 ? 'topStudentGold' : si === 1 ? 'topStudentSilver' : 'topStudentBronze'
            ]" :title="`${student.name}: ${student.points} pts`">
              {{ student.name }}
            </span>
          </div>
        </li>
      </ul>
    </div>

    <h2 class="sectionTitle">Class comparison</h2>
    <p class="sectionHint">Select one or more classes to compare. No limit on how many you can select.</p>
    <div class="selectRow">
      <v-select v-model="selectedClassIds" :items="classList" item-title="name" item-value="id"
        label="Classes to compare" multiple chips closable-chips class="classSelect classSelectMulti"
        density="comfortable" hide-details :loading="classesLoading"
        :menu-props="{ contentClass: 'classPerformanceMenu' }" @update:model-value="onClassSelectionChange" />
      <div class="selectAllActions">
        <v-btn size="small" variant="text" class="selectAllBtn" @click="selectAllClasses">
          Select all
        </v-btn>
        <v-btn size="small" variant="text" class="clearAllBtn" :disabled="selectedClassIds.length === 0"
          @click="clearAllClasses">
          Clear
        </v-btn>
      </div>
    </div>

    <div v-if="selectedClassIds.length > 0" class="comparisonSection">
      <div v-if="comparisonLoading" class="loadingRow">
        <v-progress-circular indeterminate color="primary" size="32" width="3" />
        <span>Loading class details...</span>
      </div>
      <v-table v-else class="comparisonTable">
        <thead>
          <tr>
            <th class="tableHeader">Class name</th>
            <th class="tableHeader">Students</th>
            <th class="tableHeader">Experience</th>
            <th class="tableHeader">Avg points / student</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in comparisonRows" :key="row.id">
            <td class="tableCell">{{ row.name }}</td>
            <td class="tableCell">{{ row.studentCount }}</td>
            <td class="tableCell">{{ row.experience }}</td>
            <td class="tableCell">{{ row.avgPoints != null ? row.avgPoints.toFixed(1) : '—' }}</td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <h2 class="sectionTitle studentSectionTitle">Student comparison</h2>
    <p class="sectionHint">Choose a class to see student effort ratings (Z-score normalized).</p>
    <v-select v-model="selectedClassIdForStudents" :items="classList" item-title="name" item-value="id"
      label="Class for student comparison" class="classSelect classSelectSingle" density="comfortable" hide-details
      clearable :loading="classesLoading" :menu-props="{ contentClass: 'classPerformanceMenu' }"
      @update:model-value="onStudentClassChange" />

    <div v-if="selectedClassIdForStudents && studentComparisonRows.length > 0" class="studentSection">
      <v-table class="comparisonTable studentTable">
        <thead>
          <tr>
            <th class="tableHeader">Student</th>
            <th class="tableHeader">Points</th>
            <th class="tableHeader">Z-score</th>
            <th class="tableHeader">Effort index</th>
            <th class="tableHeader">Label</th>
            <th class="tableHeader">Purchases</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in studentComparisonRows" :key="row.id">
            <td class="tableCell">{{ row.name }}</td>
            <td class="tableCell">
              <span v-if="row.totalSpent != null && row.totalSpent > 0">
                {{ row.points }} ({{ row.pointsEarned }} earned)
              </span>
              <span v-else>{{ row.points }}</span>
            </td>
            <td class="tableCell">{{ formatZ(row.zScore) }}</td>
            <td class="tableCell">{{ row.effortIndex.toFixed(1) }}</td>
            <td class="tableCell">{{ row.effortLabel }}</td>
            <td class="tableCell purchasesCell">
              <template v-if="row.purchases && row.purchases.length > 0">
                <ul class="purchasesList">
                  <li v-for="(p, i) in row.purchases" :key="i">
                    {{ p.itemName }} ({{ p.contributed }} pts)
                  </li>
                </ul>
              </template>
              <span v-else>—</span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <div v-else-if="selectedClassIdForStudents && studentsLoading" class="loadingRow">
      <v-progress-circular indeterminate color="primary" size="32" width="3" />
      <span>Loading students...</span>
    </div>
    <div v-else-if="selectedClassIdForStudents && !studentsLoading && studentComparisonRows.length === 0"
      class="emptyState">
      No students in this class.
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useClasses } from '@/composables/useClasses';
import { experienceToRank } from '@/composables/useExperience';
import server from '@/services/server';

const { getClassNames, getClassById } = useClasses();

/** Classes sorted by experience (rank) descending for the leaderboard */
const leaderboardRows = computed(() => {
  const list = classList.value ?? [];
  return [...list]
    .map((c) => {
      const exp = c.experience ?? 0;
      const { icon: rankIcon, name: rankName } = experienceToRank(exp);
      return {
        id: c.id,
        name: c.name,
        experience: exp,
        rankIcon,
        rankName,
        topStudents: c.topStudents ?? [],
      };
    })
    .sort((a, b) => b.experience - a.experience);
});

const maxLeaderboardExperience = computed(() => {
  const rows = leaderboardRows.value;
  if (rows.length === 0) return 1;
  return Math.max(...rows.map((r) => r.experience), 1);
});

/** Base width fits position + icon + class name + rank name; width scales with experience so higher rank = wider card */
const LEADERBOARD_CARD_BASE_PX = 240;
const LEADERBOARD_CARD_EXPERIENCE_PX = 220;

function getLeaderboardCardStyle(row) {
  const max = maxLeaderboardExperience.value;
  const ratio = max > 0 ? row.experience / max : 0;
  const widthPx = LEADERBOARD_CARD_BASE_PX + ratio * LEADERBOARD_CARD_EXPERIENCE_PX;
  return { width: `${widthPx}px`, minWidth: `${widthPx}px` };
}

const classList = ref([]);
const classesLoading = ref(true);
const selectedClassIds = ref([]);
const comparisonRows = ref([]);
const comparisonLoading = ref(false);
const selectedClassIdForStudents = ref(null);
const studentDetail = ref(null);
const studentsLoading = ref(false);
const purchaseHistoryMap = ref({});

const EFFORT_LABELS = {
  5.0: 'Top 2% of all students',
  4.0: 'Well above average',
  3.0: 'Exactly the global average',
  2.0: 'Below average',
  1.0: 'Significantly disengaged',
};

function zToEffortIndex(z) {
  if (z >= 2.0) return 5.0;
  if (z >= 1.0) return 4.0;
  if (z >= 0) return 3.0;
  if (z >= -1.0) return 2.0;
  return 1.0;
}

function formatZ(z) {
  if (z == null || Number.isNaN(z)) return '—';
  return z.toFixed(2);
}

function computeMean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

function computeStd(arr, mean) {
  if (arr.length < 2) return 0;
  const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

const studentComparisonRows = computed(() => {
  const cls = studentDetail.value;
  if (!cls?.students?.length) return [];
  const purchaseStudents = (purchaseHistoryMap.value[cls?.id]?.purchaseHistory?.students) || [];
  const byStudentId = new Map(purchaseStudents.map((p) => [p.studentId, p]));

  const pointsEarnedList = cls.students.map((s) => {
    const current = s.points ?? 0;
    const hist = byStudentId.get(s.id);
    const totalSpent = hist?.totalSpent ?? 0;
    return current + totalSpent;
  });
  const mean = computeMean(pointsEarnedList);
  const std = computeStd(pointsEarnedList, mean);

  const rows = cls.students.map((s) => {
    const current = s.points ?? 0;
    const hist = byStudentId.get(s.id);
    const totalSpent = hist?.totalSpent ?? 0;
    const pointsEarned = current + totalSpent;
    const z = std > 0 ? (pointsEarned - mean) / std : 0;
    const effortIndex = zToEffortIndex(z);
    return {
      id: s.id,
      name: s.name || 'Unknown',
      points: current,
      pointsEarned,
      totalSpent: totalSpent > 0 ? totalSpent : null,
      purchases: hist?.purchases ?? [],
      zScore: z,
      effortIndex,
      effortLabel: EFFORT_LABELS[effortIndex] || '',
    };
  });
  rows.sort((a, b) => b.effortIndex - a.effortIndex);
  return rows;
});

async function loadClassList() {
  classesLoading.value = true;
  try {
    const list = await getClassNames();
    classList.value = list ?? [];
  } catch (e) {
    console.error('Failed to load classes', e);
    classList.value = [];
  } finally {
    classesLoading.value = false;
  }
}

async function onClassSelectionChange() {
  if (selectedClassIds.value.length === 0) {
    comparisonRows.value = [];
    return;
  }
  comparisonLoading.value = true;
  try {
    const rows = await Promise.all(
      selectedClassIds.value.map(async (id) => {
        const c = await getClassById(id);
        const students = c?.students ?? [];
        const points = students.map((s) => s.points ?? 0);
        const avgPoints = points.length ? computeMean(points) : null;
        return {
          id: c?.id ?? id,
          name: c?.name ?? id,
          studentCount: students.length,
          experience: c?.experience ?? 0,
          avgPoints,
        };
      })
    );
    comparisonRows.value = rows;
  } catch (e) {
    console.error('Failed to load comparison', e);
    comparisonRows.value = [];
  } finally {
    comparisonLoading.value = false;
  }
}

async function onStudentClassChange() {
  if (!selectedClassIdForStudents.value) {
    studentDetail.value = null;
    purchaseHistoryMap.value = {};
    return;
  }
  studentsLoading.value = true;
  try {
    const [classData, historyData] = await Promise.all([
      getClassById(selectedClassIdForStudents.value),
      server.getPurchaseHistory(selectedClassIdForStudents.value).catch(() => ({ purchaseHistory: { students: [] } })),
    ]);
    studentDetail.value = classData;
    purchaseHistoryMap.value = {
      [selectedClassIdForStudents.value]: { purchaseHistory: (historyData && historyData.purchaseHistory) ? historyData.purchaseHistory : { students: [] } },
    };
  } catch (e) {
    console.error('Failed to load class for students', e);
    studentDetail.value = null;
    purchaseHistoryMap.value = {};
  } finally {
    studentsLoading.value = false;
  }
}

function selectAllClasses() {
  selectedClassIds.value = classList.value.map((c) => c.id);
  onClassSelectionChange();
}

function clearAllClasses() {
  selectedClassIds.value = [];
  comparisonRows.value = [];
}

loadClassList();
</script>

<style scoped>
.classPerformance {
  width: 100%;
  font-family: var(--font);
}

.sectionTitle {
  font-family: var(--font);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--white);
  margin: 0 0 0.5rem 0;
}

.studentSectionTitle {
  margin-top: 2rem;
}

.sectionHint {
  font-family: var(--font);
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin: 0 0 1rem 0;
}

.leaderboardSection {
  margin-bottom: 2rem;
}

.leaderboardList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 900px;
}

.leaderboardItem {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font);
}

.leaderboardCard {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-shrink: 0;
  min-width: 0;
  padding: 0.75rem 1.15rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  transition: background 0.2s ease, border-color 0.2s ease, width 0.25s ease;
}

.leaderboardCard:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border);
}

.leaderboardPosition {
  flex-shrink: 0;
  width: 28px;
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  color: var(--gold, #f7b707);
}

.leaderboardIcon {
  flex-shrink: 0;
  font-size: 1.5rem;
  line-height: 1;
}

.leaderboardName {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  color: var(--white);
  font-size: 1rem;
}

.leaderboardRank {
  flex-shrink: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.leaderboardTopThree {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.topStudentChip {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topStudentGold {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.5), rgba(184, 134, 11, 0.5));
  color: #fff;
  border: 1px solid rgba(212, 175, 55, 0.6);
}

.topStudentSilver {
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.45), rgba(128, 128, 128, 0.45));
  color: #fff;
  border: 1px solid rgba(192, 192, 192, 0.6);
}

.topStudentBronze {
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.5), rgba(139, 90, 43, 0.5));
  color: #fff;
  border: 1px solid rgba(205, 127, 50, 0.6);
}

.classSelect {
  max-width: 480px;
}

.selectRow {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 480px;
}

.selectAllActions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.selectAllBtn,
.clearAllBtn {
  font-family: var(--font) !important;
  text-transform: none !important;
  letter-spacing: 0.02em;
  min-width: auto !important;
}

.selectAllBtn {
  color: rgba(0, 168, 232, 0.95) !important;
}

.selectAllBtn:hover {
  color: var(--freshSky) !important;
  background: rgba(0, 168, 232, 0.12) !important;
}

.clearAllBtn {
  color: var(--color-text-muted) !important;
}

.clearAllBtn:hover:not(:disabled) {
  color: var(--color-text) !important;
  background: var(--color-surface-hover) !important;
}

.classSelect :deep(.v-field) {
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  color: var(--color-text);
}

.classSelect :deep(.v-field__input) {
  color: var(--color-text);
}

.classSelect :deep(.v-field .v-label) {
  color: var(--color-text-muted);
}

.classSelect :deep(.v-field--focused .v-label),
.classSelect :deep(.v-field--variant-filled .v-field__input) {
  color: var(--color-text);
}

.classSelect :deep(.v-chip) {
  background: rgba(0, 168, 232, 0.25) !important;
  color: var(--white) !important;
  border: 1px solid rgba(var(--ink-rgb), 0.15);
}

.classSelect :deep(.v-chip .v-icon) {
  color: var(--color-text-muted) !important;
}

.classSelect :deep(.v-checkbox-btn .v-icon) {
  color: var(--freshSky) !important;
}

.comparisonSection {
  margin-top: 1rem;
}

.loadingRow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0;
  color: var(--color-text);
  font-family: var(--font);
}

.comparisonTable {
  background: var(--color-surface);
  border-radius: 12px;
  border: 1px solid var(--color-border-soft);
  overflow: hidden;
}

.comparisonTable :deep(thead) {
  background: var(--color-surface-hover);
}

.tableHeader {
  font-family: var(--font);
  font-weight: 600;
  color: var(--white);
  padding: 12px 16px;
  text-align: left;
}

.tableCell {
  font-family: var(--font);
  color: var(--color-text);
  padding: 10px 16px;
}

.studentSection {
  margin-top: 1rem;
}

.studentTable {
  margin-top: 0.5rem;
}

.purchasesCell {
  max-width: 200px;
}

.purchasesList {
  margin: 0;
  padding-left: 1rem;
  font-size: 0.9rem;
  color: var(--color-text);
}

.purchasesList li {
  margin: 0.15rem 0;
}

.emptyState {
  font-family: var(--font);
  color: var(--color-text-muted);
  padding: 1rem 0;
}
</style>

<!-- Global styles for teleported dropdown menu (Vuetify overlays to body) -->
<style>
.classPerformanceMenu {
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border-soft) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px var(--color-shadow) !important;
}

.classPerformanceMenu .v-list {
  background: transparent !important;
}

.classPerformanceMenu .v-list-item {
  color: var(--color-text) !important;
}

.classPerformanceMenu .v-list-item:hover,
.classPerformanceMenu .v-list-item--active {
  background: var(--color-surface-hover) !important;
}

.classPerformanceMenu .v-list-item--active {
  color: var(--color-text) !important;
}

.classPerformanceMenu .v-list-item .v-icon {
  color: var(--color-text-muted) !important;
}

.classPerformanceMenu .v-checkbox-btn .v-icon {
  color: #00a8e8 !important;
}

.classPerformanceMenu .v-field__input {
  color: var(--color-text) !important;
}
</style>
