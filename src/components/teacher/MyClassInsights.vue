<template>
  <div class="myClassInsights">
    <section class="insightPanel">
      <div class="panelHead">
        <div>
          <h2 class="sectionTitle">Class leaderboard</h2>
          <p class="sectionHint">Classes ranked by experience (highest first).</p>
        </div>
      </div>

      <div v-if="classesLoading" class="loadingRow">
        <v-progress-circular indeterminate color="primary" size="32" width="3" />
        <span>Loading classes...</span>
      </div>
      <div v-else-if="leaderboardRows.length === 0" class="emptyStateBlock">
        <v-icon size="40" class="emptyStateIcon">mdi-google-classroom-outline</v-icon>
        <p class="emptyStateTitle">No classes yet</p>
        <p class="emptyStateText">Create a class from the Classes page to see rankings here.</p>
      </div>
      <ul v-else class="leaderboardList">
        <li v-for="(row, index) in leaderboardRows" :key="row.id" class="leaderboardItem">
          <div class="leaderboardCard">
            <span class="leaderboardPosition">{{ index + 1 }}</span>
            <span class="leaderboardIcon" :title="row.rankName">
              <RankBadge
                :rank-index="row.rankIndex"
                :aria-label="`${row.rankName} rank badge`"
                badge-class="leaderboardRankBadge"
              />
            </span>
            <div class="leaderboardMain">
              <div class="leaderboardTop">
                <span class="leaderboardName">{{ row.name }}</span>
                <span class="leaderboardRank">{{ row.rankName }} · {{ row.experience }} XP</span>
              </div>
              <div class="leaderboardTrack" aria-hidden="true">
                <div class="leaderboardFill" :style="{ width: `${xpRatio(row)}%` }" />
              </div>
            </div>
          </div>
          <div v-if="row.topStudents && row.topStudents.length" class="leaderboardTopThree">
            <TopStudentChips :students="row.topStudents" />
          </div>
        </li>
      </ul>
    </section>

    <section class="insightPanel">
      <div class="panelHead">
        <div>
          <h2 class="sectionTitle">Class comparison</h2>
          <p class="sectionHint">Select one or more classes to compare.</p>
        </div>
        <v-btn
          size="small"
          variant="tonal"
          class="exportBtn"
          prepend-icon="mdi-download"
          :disabled="comparisonRows.length === 0"
          @click="exportComparison"
        >
          Export CSV
        </v-btn>
      </div>

      <div class="selectRow">
        <v-select
          v-model="selectedClassIds"
          :items="classList"
          item-title="name"
          item-value="id"
          label="Classes to compare"
          multiple
          chips
          closable-chips
          class="classSelect classSelectMulti"
          density="comfortable"
          hide-details
          :loading="classesLoading"
          :menu-props="{ contentClass: 'classPerformanceMenu' }"
          @update:model-value="onClassSelectionChange"
        />
        <div class="selectAllActions">
          <v-btn size="small" variant="text" class="selectAllBtn" @click="selectAllClasses">
            Select all
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            class="clearAllBtn"
            :disabled="selectedClassIds.length === 0"
            @click="clearAllClasses"
          >
            Clear
          </v-btn>
        </div>
      </div>

      <div v-if="selectedClassIds.length > 0" class="comparisonSection">
        <div v-if="comparisonLoading" class="loadingRow">
          <v-progress-circular indeterminate color="primary" size="32" width="3" />
          <span>Loading class details...</span>
        </div>
        <div v-else class="tableWrap">
          <v-table class="comparisonTable">
            <thead>
              <tr>
                <th class="tableHeader">Class name</th>
                <th class="tableHeader">Students</th>
                <th v-if="hasSchoolAverages" class="tableHeader">vs school avg students</th>
                <th class="tableHeader">Experience</th>
                <th v-if="hasSchoolAverages" class="tableHeader">
                  {{ normalizedPeerLabel }}
                </th>
                <th class="tableHeader">Avg points / student</th>
                <th v-if="hasSchoolAverages" class="tableHeader">vs school avg pts</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in comparisonRows" :key="row.id">
                <td class="tableCell tableCell--name">{{ row.name }}</td>
                <td class="tableCell">{{ row.studentCount }}</td>
                <td v-if="hasSchoolAverages" class="tableCell">
                  {{ formatDelta(row.studentCount, schoolAverages.avgStudents) }}
                </td>
                <td class="tableCell">{{ row.experience }}</td>
                <td v-if="hasSchoolAverages" class="tableCell">
                  {{ formatPeerEngagementDelta(row) }}
                </td>
                <td class="tableCell">{{ row.avgPoints != null ? row.avgPoints.toFixed(1) : '—' }}</td>
                <td v-if="hasSchoolAverages" class="tableCell">
                  {{ row.avgPoints != null && schoolAverages.avgPointsPerStudent != null
                    ? formatDelta(row.avgPoints, schoolAverages.avgPointsPerStudent)
                    : '—' }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </div>
      <p v-else class="emptyInline">Select classes above to build a comparison table.</p>
    </section>

    <section class="insightPanel">
      <div class="panelHead">
        <div>
          <h2 class="sectionTitle">Student comparison</h2>
          <p class="sectionHint">Choose a class to see student effort ratings (Z-score normalized).</p>
        </div>
      </div>

      <v-select
        v-model="selectedClassIdForStudents"
        :items="classList"
        item-title="name"
        item-value="id"
        label="Class for student comparison"
        class="classSelect classSelectSingle"
        density="comfortable"
        hide-details
        clearable
        :loading="classesLoading"
        :menu-props="{ contentClass: 'classPerformanceMenu' }"
        @update:model-value="onStudentClassChange"
      />

      <div v-if="selectedClassIdForStudents && studentComparisonRows.length > 0" class="studentSection">
        <div class="tableWrap">
          <v-table class="comparisonTable studentTable">
            <thead>
              <tr>
                <th class="tableHeader">Student</th>
                <th class="tableHeader">Points</th>
                <th class="tableHeader">Z-score</th>
                <th class="tableHeader">Effort</th>
                <th class="tableHeader">Label</th>
                <th class="tableHeader">Purchases</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in studentComparisonRows" :key="row.id">
                <td class="tableCell tableCell--name">{{ row.name }}</td>
                <td class="tableCell">
                  <span v-if="row.totalSpent != null && row.totalSpent > 0">
                    {{ row.points }}
                    <span class="mutedMeta">({{ row.pointsEarned }} earned)</span>
                  </span>
                  <span v-else>{{ row.points }}</span>
                </td>
                <td class="tableCell">{{ formatZ(row.zScore) }}</td>
                <td class="tableCell">{{ row.effortIndex.toFixed(1) }}</td>
                <td class="tableCell">
                  <span class="effortChip" :class="`effortChip--${Math.round(row.effortIndex)}`">
                    {{ row.effortLabel }}
                  </span>
                </td>
                <td class="tableCell purchasesCell">
                  <template v-if="row.purchases && row.purchases.length > 0">
                    <ul class="purchasesList">
                      <li v-for="(p, i) in row.purchases" :key="i">
                        {{ p.itemName }} ({{ p.contributed }} pts)
                      </li>
                    </ul>
                  </template>
                  <span v-else class="mutedMeta">—</span>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </div>
      <div v-else-if="selectedClassIdForStudents && studentsLoading" class="loadingRow">
        <v-progress-circular indeterminate color="primary" size="32" width="3" />
        <span>Loading students...</span>
      </div>
      <div
        v-else-if="selectedClassIdForStudents && !studentsLoading && studentComparisonRows.length === 0"
        class="emptyStateBlock emptyStateBlock--compact"
      >
        <p class="emptyStateText">No students in this class.</p>
      </div>
      <p v-else class="emptyInline">Pick a class to review student effort.</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useClasses } from '@/composables/useClasses';
import { experienceToRank } from '@/composables/useExperience';
import RankBadge from '@/components/common/RankBadge.vue';
import TopStudentChips from '@/components/common/TopStudentChips.vue';
import server from '@/services/server';
import { downloadCsv, formatDelta } from '@/utils/exportCsv';

const props = defineProps({
  schoolAverages: {
    type: Object,
    default: null,
  },
  useNormalizedEngagement: {
    type: Boolean,
    default: false,
  },
  peerClassScores: {
    type: Map,
    default: () => new Map(),
  },
});

const { getClassNames, getClassById } = useClasses();

const hasSchoolAverages = computed(() => props.schoolAverages != null);

const normalizedPeerLabel = computed(() =>
  props.useNormalizedEngagement ? 'vs peer engagement rank' : 'vs school avg XP'
);

function formatPeerEngagementDelta(row) {
  const avg = props.schoolAverages;
  if (!avg) return '—';
  if (props.useNormalizedEngagement) {
    const peer = props.peerClassScores.get(row.id);
    const score = peer?.teacherRelativeScore;
    if (score == null || avg.avgTeacherRelativeScore == null) return '—';
    return formatDelta(score, avg.avgTeacherRelativeScore);
  }
  return formatDelta(row.experience, avg.avgExperience);
}

const leaderboardRows = computed(() => {
  const list = classList.value ?? [];
  return [...list]
    .map((c) => {
      const exp = c.experience ?? 0;
      const { rankIndex, name: rankName } = experienceToRank(exp);
      return {
        id: c.id,
        name: c.name,
        experience: exp,
        rankIndex,
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

function xpRatio(row) {
  const max = maxLeaderboardExperience.value;
  if (!max) return 0;
  return Math.round(((row.experience || 0) / max) * 100);
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

function exportComparison() {
  const avg = props.schoolAverages;
  const columns = [
    { key: 'name', label: 'Class name' },
    { key: 'studentCount', label: 'Students' },
  ];
  if (avg) {
    columns.push({ key: 'vsAvgStudents', label: 'vs school avg students' });
  }
  columns.push({ key: 'experience', label: 'Experience' });
  if (avg) {
    if (props.useNormalizedEngagement) {
      columns.push({ key: 'vsEngagement', label: 'vs peer engagement rank' });
    } else {
      columns.push({ key: 'vsAvgXp', label: 'vs school avg XP' });
    }
  }
  columns.push({ key: 'avgPoints', label: 'Avg points per student' });
  if (avg) {
    columns.push({ key: 'vsAvgPts', label: 'vs school avg pts' });
  }

  const rows = comparisonRows.value.map((row) => ({
    name: row.name,
    studentCount: row.studentCount,
    vsAvgStudents: avg ? formatDelta(row.studentCount, avg.avgStudents) : '',
    experience: row.experience,
    vsAvgXp: avg && !props.useNormalizedEngagement ? formatDelta(row.experience, avg.avgExperience) : '',
    vsEngagement: avg && props.useNormalizedEngagement ? formatPeerEngagementDelta(row) : '',
    avgPoints: row.avgPoints != null ? row.avgPoints.toFixed(1) : '—',
    vsAvgPts:
      avg && row.avgPoints != null && avg.avgPointsPerStudent != null
        ? formatDelta(row.avgPoints, avg.avgPointsPerStudent)
        : '—',
  }));

  downloadCsv('my-classes-comparison', rows, columns);
}

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
      [selectedClassIdForStudents.value]: {
        purchaseHistory: historyData?.purchaseHistory ? historyData.purchaseHistory : { students: [] },
      },
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
.myClassInsights {
  width: 100%;
  font-family: var(--font);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.insightPanel {
  width: 100%;
  padding: 1.15rem 1.1rem 1.25rem;
  border-radius: 18px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  background: rgba(var(--ink-rgb), 0.035);
}

.panelHead {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.exportBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}

.sectionTitle {
  font-family: var(--font);
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--white);
  margin: 0 0 0.3rem;
}

.sectionHint {
  font-family: var(--font);
  font-size: 0.9rem;
  color: rgba(var(--ink-rgb), 0.6);
  margin: 0;
  line-height: 1.4;
}

.leaderboardList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: 100%;
}

.leaderboardItem {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-family: var(--font);
}

@media (min-width: 900px) {
  .leaderboardItem {
    flex-direction: row;
    align-items: center;
  }
}

.leaderboardCard {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex: 1;
  min-width: 0;
  width: 100%;
  padding: 0.8rem 1rem;
  background: rgba(var(--ink-rgb), 0.04);
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  border-radius: 14px;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.leaderboardCard:hover {
  background: rgba(var(--ink-rgb), 0.07);
  border-color: rgba(var(--freshSky-rgb), 0.35);
}

.leaderboardPosition {
  flex-shrink: 0;
  width: 28px;
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  color: var(--gold, #f7b707);
  font-variant-numeric: tabular-nums;
}

.leaderboardIcon {
  flex-shrink: 0;
  width: 2.25rem;
  line-height: 1;
}

.leaderboardRankBadge {
  width: 100%;
  height: auto;
}

.leaderboardMain {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.leaderboardTop {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 0.75rem;
}

.leaderboardName {
  font-weight: 600;
  color: var(--white);
  font-size: 1rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leaderboardRank {
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.6);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.leaderboardTrack {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(var(--ink-rgb), 0.1);
  overflow: hidden;
}

.leaderboardFill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--freshSky), var(--seaGreen));
  transition: width 0.35s ease;
}

.leaderboardTopThree {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  padding-left: 0.15rem;
}

.classSelect {
  max-width: 560px;
  width: 100%;
}

.selectRow {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 560px;
  width: 100%;
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
  color: rgba(var(--ink-rgb), 0.55) !important;
}

.clearAllBtn:hover:not(:disabled) {
  color: var(--color-text) !important;
  background: rgba(var(--ink-rgb), 0.08) !important;
}

.classSelect :deep(.v-field) {
  background: rgba(var(--ink-rgb), 0.04);
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 12px;
  color: var(--color-text);
}

.classSelect :deep(.v-field__input) {
  color: var(--color-text);
}

.classSelect :deep(.v-field .v-label) {
  color: rgba(var(--ink-rgb), 0.55);
}

.classSelect :deep(.v-chip) {
  background: rgba(0, 168, 232, 0.25) !important;
  color: var(--white) !important;
  border: 1px solid rgba(var(--ink-rgb), 0.15);
}

.classSelect :deep(.v-chip .v-icon) {
  color: rgba(var(--ink-rgb), 0.55) !important;
}

.classSelect :deep(.v-checkbox-btn .v-icon) {
  color: var(--freshSky) !important;
}

.comparisonSection,
.studentSection {
  margin-top: 1rem;
}

.tableWrap {
  width: 100%;
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
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
  background: transparent;
  width: 100%;
}

.comparisonTable :deep(thead) {
  background: rgba(var(--ink-rgb), 0.06);
}

.comparisonTable :deep(tbody tr:nth-child(even)) {
  background: rgba(var(--ink-rgb), 0.025);
}

.tableHeader {
  font-family: var(--font);
  font-weight: 600;
  color: var(--white);
  padding: 12px 16px;
  text-align: left;
  white-space: nowrap;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
}

.tableCell {
  font-family: var(--font);
  color: var(--color-text);
  padding: 11px 16px;
  font-variant-numeric: tabular-nums;
}

.tableCell--name {
  font-weight: 600;
  color: var(--white);
}

.mutedMeta {
  color: rgba(var(--ink-rgb), 0.5);
  font-size: 0.85rem;
}

.effortChip {
  display: inline-block;
  max-width: 220px;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
  border: 1px solid transparent;
}

.effortChip--5 {
  color: var(--seaGreen);
  background: rgba(var(--seaGreen-rgb), 0.14);
  border-color: rgba(var(--seaGreen-rgb), 0.3);
}

.effortChip--4 {
  color: var(--freshSky);
  background: rgba(var(--freshSky-rgb), 0.14);
  border-color: rgba(var(--freshSky-rgb), 0.3);
}

.effortChip--3 {
  color: rgba(var(--ink-rgb), 0.85);
  background: rgba(var(--ink-rgb), 0.08);
  border-color: rgba(var(--ink-rgb), 0.16);
}

.effortChip--2 {
  color: rgba(247, 183, 7, 0.95);
  background: rgba(247, 183, 7, 0.12);
  border-color: rgba(247, 183, 7, 0.28);
}

.effortChip--1 {
  color: rgba(197, 40, 61, 0.95);
  background: rgba(197, 40, 61, 0.12);
  border-color: rgba(197, 40, 61, 0.28);
}

.purchasesCell {
  max-width: 220px;
}

.purchasesList {
  margin: 0;
  padding-left: 1rem;
  font-size: 0.88rem;
  color: rgba(var(--ink-rgb), 0.8);
}

.purchasesList li {
  margin: 0.15rem 0;
}

.emptyStateBlock {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.4rem;
  padding: 1.75rem 1rem;
}

.emptyStateBlock--compact {
  padding: 1.25rem 0.5rem;
}

.emptyStateIcon {
  color: rgba(var(--ink-rgb), 0.4);
  margin-bottom: 0.25rem;
}

.emptyStateTitle {
  font-family: var(--font);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--white);
  margin: 0;
}

.emptyStateText,
.emptyInline {
  font-family: var(--font);
  font-size: 0.9rem;
  color: rgba(var(--ink-rgb), 0.55);
  margin: 0;
}

.emptyInline {
  padding: 0.35rem 0 0.15rem;
}
</style>

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
