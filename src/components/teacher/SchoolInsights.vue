<template>
  <div class="schoolInsights">
    <div v-if="loading && !insights" class="loadingRow">
      <v-progress-circular indeterminate color="primary" size="32" width="3" />
      <span>Loading school insights...</span>
    </div>

    <template v-else-if="insights">
      <p v-if="groupBanner" class="groupBanner">
        <v-icon size="18" class="groupBannerIcon">mdi-domain</v-icon>
        {{ groupBanner }}
      </p>

      <section class="insightPanel">
        <div class="panelHead">
          <div>
            <h2 class="sectionTitle">School class leaderboard</h2>
            <p class="sectionHint">{{ leaderboardHint }}</p>
            <p v-if="insights.termKey" class="termMeta">
              {{ insights.termKey === 'all-terms' ? 'All terms' : `Term: ${insights.termKey}` }}
            </p>
          </div>
        </div>

        <div v-if="schoolLeaderboard.length === 0" class="emptyStateBlock">
          <p class="emptyStateText">No classes in this school for the selected term.</p>
        </div>
        <ul v-else class="leaderboardList">
          <li v-for="(row, index) in schoolLeaderboard" :key="row.id" class="leaderboardItem">
            <div class="leaderboardCard" :class="{ 'leaderboardCard--own': isOwnClass(row) }">
              <span class="leaderboardPosition">{{ index + 1 }}</span>
              <div class="leaderboardMain">
                <div class="leaderboardTop">
                  <span class="leaderboardName">
                    {{ row.name }}
                    <v-chip
                      v-if="isOwnClass(row)"
                      size="x-small"
                      color="primary"
                      variant="flat"
                      class="youChip"
                    >
                      You
                    </v-chip>
                  </span>
                  <span class="leaderboardXp">
                    <template v-if="useNormalizedEngagement">
                      <span class="leaderboardScore">{{ formatEngagementScore(row) }}</span>
                      <span class="leaderboardXpRaw">{{ row.experience ?? 0 }} XP</span>
                    </template>
                    <template v-else>{{ row.experience }} XP</template>
                  </span>
                </div>
                <span v-if="isGroupView && row.schoolName" class="leaderboardSchool">{{ row.schoolName }}</span>
              </div>
            </div>
            <div v-if="row.topStudents?.length" class="leaderboardTopThree">
              <TopStudentChips :students="row.topStudents" />
            </div>
          </li>
        </ul>
      </section>

      <section class="insightPanel">
        <div class="panelHead">
          <div>
            <h2 class="sectionTitle">By teacher</h2>
            <p class="sectionHint">Expand a teacher to see their classes.</p>
          </div>
        </div>
        <div class="teacherGroups">
          <details v-for="group in classesByTeacher" :key="group.teacherUserId" class="teacherGroup" open>
            <summary class="teacherGroupHeader">
              <span class="teacherGroupName">{{ group.teacherName }}</span>
              <span class="teacherGroupMeta">{{ group.classes.length }} classes</span>
            </summary>
            <div v-if="group.classes.length" class="classMiniGrid">
              <div
                v-for="c in group.classes"
                :key="c.id"
                class="classMiniCard"
                :class="{ 'classMiniCard--own': isOwnClass(c) }"
              >
                <span class="classMiniName">{{ c.name }}</span>
                <span v-if="isGroupView && c.schoolName" class="classMiniSchool">{{ c.schoolName }}</span>
                <span class="classMiniMeta">
                  {{ c.numberOfStudents }} students
                  <template v-if="useNormalizedEngagement">
                    · {{ formatEngagementScore(c) }} · {{ c.experience ?? 0 }} XP
                  </template>
                  <template v-else> · {{ c.experience ?? 0 }} XP</template>
                </span>
                <v-chip v-if="isOwnClass(c)" size="x-small" color="primary" variant="flat">You</v-chip>
              </div>
            </div>
            <p v-else class="emptyNote">No classes</p>
          </details>
        </div>
      </section>

      <section class="insightPanel">
        <SchoolClassBarCharts
          :classes="filteredComparisonClasses"
          :use-normalized-engagement="useNormalizedEngagement"
        />
      </section>

      <section class="insightPanel">
        <div class="panelHead">
          <div>
            <h2 class="sectionTitle">School comparison</h2>
            <p class="sectionHint">{{ comparisonHint }}</p>
          </div>
          <v-btn
            size="small"
            variant="tonal"
            class="exportBtn"
            prepend-icon="mdi-download"
            :disabled="filteredComparisonClasses.length === 0"
            @click="exportSchoolComparison"
          >
            Export CSV
          </v-btn>
        </div>

        <div class="filterRow">
          <v-btn-toggle v-model="comparisonMode" mandatory density="comfortable" class="modeToggle" divided>
            <v-btn value="all" size="small">{{ isGroupView ? 'All group' : 'All school' }}</v-btn>
            <v-btn value="mine" size="small">My classes</v-btn>
            <v-btn value="teachers" size="small">Select teachers</v-btn>
          </v-btn-toggle>
          <v-select
            v-if="comparisonMode === 'teachers'"
            v-model="selectedTeacherIds"
            :items="teacherSelectItems"
            item-title="label"
            item-value="userId"
            label="Teachers"
            multiple
            chips
            closable-chips
            density="comfortable"
            hide-details
            class="teacherSelect"
            :menu-props="{ contentClass: 'classPerformanceMenu' }"
          />
        </div>

        <div v-if="filteredComparisonClasses.length" class="tableWrap">
          <v-table class="comparisonTable">
            <thead>
              <tr>
                <th class="tableHeader">Class</th>
                <th v-if="isGroupView" class="tableHeader">School</th>
                <th class="tableHeader">Teacher</th>
                <th class="tableHeader">Students</th>
                <th class="tableHeader">
                  {{ useNormalizedEngagement ? 'Engagement rank' : 'Experience' }}
                </th>
                <th v-if="useNormalizedEngagement" class="tableHeader">Raw XP</th>
                <th class="tableHeader">Avg pts / student</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filteredComparisonClasses"
                :key="row.id"
                :class="{ 'row--own': isOwnClass(row) }"
              >
                <td class="tableCell tableCell--name">{{ row.name }}</td>
                <td v-if="isGroupView" class="tableCell">{{ row.schoolName || '—' }}</td>
                <td class="tableCell">{{ teacherNameFor(row.teacherUserId) }}</td>
                <td class="tableCell">{{ row.numberOfStudents }}</td>
                <td class="tableCell">
                  {{ useNormalizedEngagement ? formatEngagementScore(row) : (row.experience ?? 0) }}
                </td>
                <td v-if="useNormalizedEngagement" class="tableCell">{{ row.experience ?? 0 }}</td>
                <td class="tableCell">
                  {{ row.avgPointsPerStudent != null ? row.avgPointsPerStudent.toFixed(1) : '—' }}
                </td>
              </tr>
              <tr v-if="schoolAverages" class="summaryRow">
                <td class="tableCell summaryCell" :colspan="isGroupView ? 3 : 2">
                  {{ isGroupView ? 'Group average' : 'School average' }}
                </td>
                <td class="tableCell summaryCell">{{ schoolAverages.avgStudents?.toFixed(1) ?? '—' }}</td>
                <td class="tableCell summaryCell">
                  {{ useNormalizedEngagement
                    ? (schoolAverages.avgTeacherRelativeScore != null
                      ? schoolAverages.avgTeacherRelativeScore.toFixed(1)
                      : '—')
                    : (schoolAverages.avgExperience?.toFixed(1) ?? '—') }}
                </td>
                <td v-if="useNormalizedEngagement" class="tableCell summaryCell">
                  {{ schoolAverages.avgExperience?.toFixed(1) ?? '—' }}
                </td>
                <td class="tableCell summaryCell">
                  {{ schoolAverages.avgPointsPerStudent != null
                    ? schoolAverages.avgPointsPerStudent.toFixed(1)
                    : '—' }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
        <p v-else class="emptyInline">No classes match this filter.</p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import TopStudentChips from '@/components/common/TopStudentChips.vue';
import SchoolClassBarCharts from '@/components/charts/SchoolClassBarCharts.vue';
import { downloadCsv } from '@/utils/exportCsv';

const props = defineProps({
  insights: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  classesByTeacher: { type: Array, default: () => [] },
  isOwnClass: { type: Function, required: true },
  schoolAverages: { type: Object, default: null },
  isGroupView: { type: Boolean, default: false },
  useNormalizedEngagement: { type: Boolean, default: false },
  displayTitle: { type: String, default: '' },
  groupContext: { type: Object, default: null },
});

const groupBanner = computed(() => {
  if (!props.isGroupView || !props.groupContext) return '';
  const names = props.groupContext.schools?.map((s) => s.schoolName).join(', ');
  return `Grouped schools: ${names || props.displayTitle}`;
});

const leaderboardHint = computed(() => {
  const normalizedNote = props.useNormalizedEngagement
    ? ' Ranked by engagement score (0–100 within each teacher’s active classes). Classes with no XP or points are unranked.'
    : ' Ranked by experience.';
  if (props.isGroupView) {
    const count = props.groupContext?.schools?.length ?? props.insights?.schools?.length ?? 0;
    return `All classes across ${count} schools in ${props.displayTitle}.${normalizedNote}`;
  }
  return `All classes at ${props.insights?.schoolName || 'your school'}.${normalizedNote}`;
});

const comparisonHint = computed(() => {
  if (props.useNormalizedEngagement) {
    return props.isGroupView
      ? 'Engagement rank compares each class to others taught by the same teacher (reward sizes differ).'
      : 'Engagement rank compares each class to others taught by the same teacher at your school.';
  }
  return props.isGroupView
    ? 'Compare classes across all teachers in this school group.'
    : 'Compare classes across teachers at your school.';
});

function formatEngagementScore(row) {
  const score = row?.teacherRelativeScore;
  if (score == null) {
    const exp = row?.experience ?? 0;
    const pts = row?.avgPointsPerStudent ?? 0;
    if (exp === 0 && pts === 0) return 'Unranked';
    return '—';
  }
  return `${score}`;
}

function engagementSortValue(row) {
  const score = row?.teacherRelativeScore;
  return score != null ? score : -1;
}

const schoolLeaderboard = computed(() => {
  const classes = props.insights?.classes || [];
  if (props.useNormalizedEngagement) {
    return [...classes].sort((a, b) => {
      const diff = engagementSortValue(b) - engagementSortValue(a);
      if (diff !== 0) return diff;
      return (b.experience ?? 0) - (a.experience ?? 0);
    });
  }
  return [...classes].sort((a, b) => (b.experience ?? 0) - (a.experience ?? 0));
});
const comparisonMode = ref('all');
const selectedTeacherIds = ref([]);

const teacherSelectItems = computed(() =>
  (props.insights?.teachers || []).map((t) => ({
    userId: t.userId,
    label: t.name || t.email || t.userId,
  }))
);

const teacherNameMap = computed(() => {
  const map = new Map();
  for (const t of props.insights?.teachers || []) {
    map.set(t.userId, t.name || t.email || 'Unnamed');
  }
  return map;
});

function teacherNameFor(userId) {
  return teacherNameMap.value.get(userId) || 'Unknown';
}

const filteredComparisonClasses = computed(() => {
  const classes = props.insights?.classes || [];
  if (comparisonMode.value === 'mine') {
    return classes.filter((c) => props.isOwnClass(c));
  }
  if (comparisonMode.value === 'teachers') {
    const ids = new Set(selectedTeacherIds.value);
    if (!ids.size) return [];
    return classes.filter((c) => ids.has(c.teacherUserId));
  }
  return classes;
});

watch(comparisonMode, (mode) => {
  if (mode === 'teachers' && !selectedTeacherIds.value.length) {
    selectedTeacherIds.value = (props.insights?.teachers || []).map((t) => t.userId);
  }
});

function exportSchoolComparison() {
  const rows = filteredComparisonClasses.value.map((row) => ({
    name: row.name,
    school: props.isGroupView ? row.schoolName || '—' : '',
    teacher: teacherNameFor(row.teacherUserId),
    students: row.numberOfStudents,
    engagementRank: props.useNormalizedEngagement ? formatEngagementScore(row) : '',
    experience: row.experience ?? 0,
    avgPoints:
      row.avgPointsPerStudent != null ? row.avgPointsPerStudent.toFixed(1) : '—',
  }));
  const columns = [{ key: 'name', label: 'Class' }];
  if (props.isGroupView) columns.push({ key: 'school', label: 'School' });
  columns.push(
    { key: 'teacher', label: 'Teacher' },
    { key: 'students', label: 'Students' }
  );
  if (props.useNormalizedEngagement) {
    columns.push({ key: 'engagementRank', label: 'Engagement rank' });
  }
  columns.push({ key: 'experience', label: 'Experience (XP)' });
  columns.push({ key: 'avgPoints', label: 'Avg pts per student' });
  downloadCsv(
    props.isGroupView ? 'school-group-comparison' : 'school-classes-comparison',
    rows,
    columns
  );
}
</script>

<style scoped>
.schoolInsights {
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

.groupBanner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font);
  font-size: 0.9rem;
  color: var(--freshSky);
  margin: 0;
  padding: 0.65rem 0.85rem;
  border-radius: 12px;
  background: rgba(0, 168, 232, 0.1);
  border: 1px solid rgba(0, 168, 232, 0.25);
}

.groupBannerIcon {
  flex-shrink: 0;
}

.leaderboardSchool,
.classMiniSchool {
  font-size: 0.8rem;
  color: rgba(var(--ink-rgb), 0.55);
}

.termMeta {
  font-size: 0.82rem;
  color: rgba(var(--ink-rgb), 0.5);
  margin: 0.45rem 0 0;
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

.exportBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}

.leaderboardList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.leaderboardItem {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
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
  gap: 0.75rem;
  padding: 0.8rem 1rem;
  background: rgba(var(--ink-rgb), 0.04);
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  border-radius: 14px;
  flex: 1;
  min-width: 0;
  width: 100%;
}

.leaderboardCard--own {
  border-color: rgba(0, 168, 232, 0.45);
  background: rgba(0, 168, 232, 0.08);
}

.leaderboardPosition {
  font-weight: 700;
  color: var(--gold, #f7b707);
  min-width: 24px;
  font-variant-numeric: tabular-nums;
}

.leaderboardMain {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
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
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.leaderboardXp {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
  font-size: 0.9rem;
  color: rgba(var(--ink-rgb), 0.6);
  font-variant-numeric: tabular-nums;
}

.leaderboardScore {
  font-weight: 600;
  color: var(--white);
}

.leaderboardXpRaw {
  font-size: 0.8rem;
}

.youChip {
  font-family: var(--font) !important;
}

.leaderboardTopThree {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.teacherGroups {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.teacherGroup {
  background: rgba(var(--ink-rgb), 0.04);
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  border-radius: 14px;
  padding: 0.55rem 0.85rem;
}

.teacherGroupHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  cursor: pointer;
  font-family: var(--font);
  padding: 0.35rem 0;
  list-style: none;
}

.teacherGroupHeader::-webkit-details-marker {
  display: none;
}

.teacherGroupName {
  font-weight: 600;
  color: var(--white);
}

.teacherGroupMeta {
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.55);
}

.classMiniGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-bottom: 0.35rem;
}

.classMiniCard {
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  background: rgba(var(--ink-rgb), 0.04);
}

.classMiniCard--own {
  border-color: rgba(0, 168, 232, 0.35);
  background: rgba(0, 168, 232, 0.08);
}

.classMiniName {
  display: block;
  font-weight: 600;
  color: var(--white);
  font-size: 0.95rem;
}

.classMiniMeta {
  display: block;
  font-size: 0.8rem;
  color: rgba(var(--ink-rgb), 0.55);
  margin-top: 0.15rem;
}

.emptyNote,
.emptyStateText,
.emptyInline {
  font-family: var(--font);
  color: rgba(var(--ink-rgb), 0.55);
  font-size: 0.9rem;
  margin: 0;
}

.emptyStateBlock {
  padding: 1rem 0.25rem;
}

.filterRow {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.modeToggle :deep(.v-btn) {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}

.teacherSelect {
  max-width: 560px;
  width: 100%;
}

.teacherSelect :deep(.v-field) {
  background: rgba(var(--ink-rgb), 0.04);
  border-radius: 12px;
}

.tableWrap {
  width: 100%;
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
}

.comparisonTable {
  background: transparent;
  width: 100%;
}

.comparisonTable :deep(thead) {
  background: rgba(var(--ink-rgb), 0.06);
}

.comparisonTable :deep(tbody tr:nth-child(even):not(.summaryRow)) {
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

.row--own .tableCell {
  background: rgba(0, 168, 232, 0.06);
}

.summaryRow .summaryCell {
  font-weight: 600;
  color: var(--white);
  background: rgba(var(--ink-rgb), 0.07);
  border-top: 1px solid rgba(var(--ink-rgb), 0.12);
}

.loadingRow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0;
  color: var(--color-text);
}
</style>
