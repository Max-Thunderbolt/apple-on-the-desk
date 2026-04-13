<template>
  <div class="container saPage">
    <div class="saShell">
      <v-breadcrumbs
        density="compact"
        :items="[
          { title: 'Home', to: '/' },
          { title: 'School dashboard', to: '/SchoolAdminDashboard' },
        ]"
        class="breadcrumbs saBreadcrumbs"
      >
        <template #divider>
          <v-icon size="18" class="crumbIcon">mdi-chevron-right</v-icon>
        </template>
      </v-breadcrumbs>

      <header class="saHeader">
        <div class="saHeaderLeft">
          <p class="saEyebrow">School administration</p>
          <h1 class="saTitle">
            School <span class="titleAccent">dashboard</span>
          </h1>
        </div>
        <div class="headerControls">
          <v-select
            v-model="selectedSchoolId"
            :items="schoolOptions"
            item-title="schoolName"
            item-value="schoolId"
            density="compact"
            hide-details
            variant="outlined"
            class="glassField schoolPicker"
            @update:model-value="loadDashboard"
          />
          <div class="termRow">
            <v-select
              v-model="term"
              :items="termItems"
              density="compact"
              hide-details
              variant="outlined"
              class="glassField termField"
            />
            <v-text-field
              v-model.number="year"
              type="number"
              density="compact"
              hide-details
              variant="outlined"
              class="glassField yearField"
            />
            <v-btn
              class="refreshBtn"
              size="small"
              :loading="loading"
              icon="mdi-refresh"
              variant="flat"
              @click="loadDashboard"
            />
          </div>
        </div>
      </header>

      <v-alert v-if="error" type="error" variant="tonal" class="saAlert" rounded="lg" closable @click:close="error = ''">
        {{ error }}
      </v-alert>
      <v-alert v-if="success" type="success" variant="tonal" class="saAlert" rounded="lg" closable @click:close="success = ''">
        {{ success }}
      </v-alert>

      <!-- Loading -->
      <div v-if="loading && !dash" class="loadingWrap">
        <v-progress-circular indeterminate color="primary" size="48" width="4" />
      </div>

      <template v-if="dash">
        <!-- KPI cards -->
        <section class="kpiGrid">
          <article v-for="kpi in kpiCards" :key="kpi.label" class="kpiCard" :class="kpi.cls">
            <div class="kpiIconWrap" :style="{ background: kpi.iconBg }">
              <v-icon size="24" :color="kpi.iconColor">{{ kpi.icon }}</v-icon>
            </div>
            <div class="kpiBody">
              <span class="kpiLabel">{{ kpi.label }}</span>
              <span class="kpiValue" :class="{ 'kpiValue--money': kpi.isMoney }">{{ kpi.value }}</span>
              <span v-if="kpi.meta" class="kpiMeta">{{ kpi.meta }}</span>
            </div>
          </article>
        </section>

        <!-- Charts -->
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
              Class experience (XP)
            </h2>
            <div class="chartWrap">
              <Bar v-if="classXPData" :data="classXPData" :options="xpBarOptions" />
              <div v-else class="chartEmpty">No XP data</div>
            </div>
          </div>
        </section>

        <!-- Teachers panel -->
        <section class="sectionPanel">
          <div class="sectionHead">
            <div>
              <h2 class="sectionTitle">
                <v-icon size="20" class="sectionTitleIcon">mdi-account-school-outline</v-icon>
                Teachers
              </h2>
              <p class="sectionDesc">Manage your teaching staff and invite new teachers.</p>
            </div>
            <div class="sectionBadge">{{ dash.teachers?.length ?? dash.teacherCount ?? 0 }} teachers</div>
          </div>

          <!-- Invite teacher -->
          <div class="inviteBar">
            <v-btn
              class="inviteBtn"
              size="small"
              :loading="generatingLink"
              prepend-icon="mdi-link-variant"
              @click="generateTeacherLink"
            >
              Generate invite link
            </v-btn>
            <div v-if="teacherInviteUrl" class="inviteLinkDisplay">
              <code class="linkCode">{{ teacherInviteUrl }}</code>
              <v-btn icon="mdi-content-copy" size="x-small" variant="text" @click="copyLink(teacherInviteUrl)" />
            </div>
          </div>

          <div v-if="dash.teachers?.length" class="teacherGrid">
            <div v-for="t in dash.teachers" :key="t.userId" class="teacherCard">
              <div class="teacherAvatar">
                <v-icon size="24" color="rgba(0,168,232,0.8)">mdi-account-circle</v-icon>
              </div>
              <div class="teacherInfo">
                <span class="teacherName">{{ t.name || 'Unnamed' }}</span>
                <span class="teacherEmail">{{ t.email || t.userId.slice(0, 12) }}</span>
              </div>
              <div class="teacherStats">
                <div class="teacherStat">
                  <span class="statValue">{{ t.classCount ?? 0 }}</span>
                  <span class="statLabel">classes</span>
                </div>
                <div class="teacherStat">
                  <span class="statValue">{{ t.studentCount ?? 0 }}</span>
                  <span class="statLabel">students</span>
                </div>
              </div>
            </div>
          </div>
          <p v-else class="emptyNote">No teachers have joined yet. Share the invite link above.</p>
        </section>

        <!-- Classes panel -->
        <section class="sectionPanel">
          <div class="sectionHead">
            <div>
              <h2 class="sectionTitle">
                <v-icon size="20" class="sectionTitleIcon">mdi-google-classroom</v-icon>
                Classes
              </h2>
              <p class="sectionDesc">Performance overview for all classes in this school.</p>
            </div>
            <div class="sectionBadge">{{ dash.classes?.length ?? dash.classCount ?? 0 }} classes</div>
          </div>

          <div v-if="dash.classes?.length" class="classGrid">
            <div v-for="c in dash.classes" :key="c.id" class="classCard">
              <div class="classCardHeader">
                <h3 class="className">{{ c.name }}</h3>
                <span class="classXP">
                  <v-icon size="14" class="xpIcon">mdi-star-four-points</v-icon>
                  {{ (c.experience ?? 0).toLocaleString() }} XP
                </span>
              </div>
              <div class="classMetrics">
                <div class="classMetric">
                  <span class="metricValue">{{ c.numberOfStudents }}</span>
                  <span class="metricLabel">students</span>
                </div>
                <div v-if="c.topStudents?.length" class="classLeaderboard">
                  <span class="leaderTitle">Top performers</span>
                  <div v-for="(s, idx) in c.topStudents" :key="idx" class="leaderRow">
                    <span class="leaderRank">{{ idx + 1 }}</span>
                    <span class="leaderName">{{ s.name }}</span>
                    <span class="leaderPts">{{ s.points }} pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p v-else class="emptyNote">No classes created yet. Teachers can create classes once they join.</p>
        </section>

        <!-- Cost summary -->
        <section class="costBar">
          <div class="costItem">
            <span class="costLabel">Term cost</span>
            <span class="costValue">{{ formatZAR(dash.costZAR) }}</span>
          </div>
          <div class="costItem">
            <span class="costLabel">Rate</span>
            <span class="costValue costValue--small">R{{ dash.costPerStudentZAR ?? 60 }} × student × term</span>
          </div>
          <div class="costItem">
            <span class="costLabel">Period</span>
            <span class="costValue costValue--small">{{ dash.termKey }}</span>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { useUserProfile } from '@/composables/useUserProfile'
import Server from '@/services/server'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const PALETTE = [
  'rgba(0, 168, 232, 0.85)',
  'rgba(26, 147, 111, 0.85)',
  'rgba(168, 51, 185, 0.85)',
  'rgba(247, 183, 7, 0.85)',
  'rgba(197, 40, 61, 0.85)',
  'rgba(0, 168, 232, 0.5)',
  'rgba(26, 147, 111, 0.5)',
  'rgba(168, 51, 185, 0.5)',
]

const { schoolAdminSchools } = useUserProfile()
const schoolOptions = computed(() => schoolAdminSchools.value)

const selectedSchoolId = ref('')
const year = ref(new Date().getFullYear())
const term = ref(1)
const dash = ref(null)
const loading = ref(false)
const error = ref('')
const success = ref('')

const teacherInviteUrl = ref('')
const generatingLink = ref(false)

const termItems = [
  { title: 'T1 · Jan–Apr', value: 1 },
  { title: 'T2 · May–Aug', value: 2 },
  { title: 'T3 · Sep–Dec', value: 3 },
]

const kpiCards = computed(() => {
  if (!dash.value) return []
  const d = dash.value
  return [
    { label: 'Teachers', value: d.teachers?.length ?? d.teacherCount ?? 0, icon: 'mdi-account-school-outline', iconBg: 'rgba(0,168,232,0.15)', iconColor: 'rgba(0,168,232,0.9)', cls: 'kpiCard--teachers' },
    { label: 'Classes', value: d.classCount ?? d.classes?.length ?? 0, icon: 'mdi-google-classroom', iconBg: 'rgba(26,147,111,0.15)', iconColor: 'rgba(26,147,111,0.9)', cls: 'kpiCard--classes' },
    { label: 'Students', value: d.studentCount ?? 0, icon: 'mdi-account-group-outline', iconBg: 'rgba(168,51,185,0.15)', iconColor: 'rgba(168,51,185,0.9)', cls: 'kpiCard--students' },
    { label: 'Term cost', value: formatZAR(d.costZAR), icon: 'mdi-cash-multiple', iconBg: 'rgba(247,183,7,0.15)', iconColor: 'rgba(247,183,7,0.9)', cls: 'kpiCard--cost', isMoney: true, meta: d.termKey },
  ]
})

const chartFont = { family: 'Advent Pro, sans-serif' }
const gridColor = 'rgba(255,255,255,0.06)'
const tickColor = 'rgba(255,255,255,0.45)'

const studentsPerClassData = computed(() => {
  const classes = dash.value?.classes
  if (!classes?.length) return null
  return {
    labels: classes.map((c) => c.name),
    datasets: [{
      label: 'Students',
      data: classes.map((c) => c.numberOfStudents),
      backgroundColor: classes.map((_, i) => PALETTE[i % PALETTE.length]),
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 48,
    }],
  }
})

const classXPData = computed(() => {
  const classes = dash.value?.classes?.filter((c) => (c.experience ?? 0) > 0)
  if (!classes?.length) return null
  return {
    labels: classes.map((c) => c.name),
    datasets: [{
      label: 'XP',
      data: classes.map((c) => c.experience ?? 0),
      backgroundColor: classes.map((_, i) => PALETTE[(i + 2) % PALETTE.length]),
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 48,
    }],
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { titleFont: chartFont, bodyFont: chartFont, backgroundColor: 'rgba(0,23,31,0.92)', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1 },
  },
  scales: {
    x: { ticks: { color: tickColor, font: chartFont }, grid: { display: false } },
    y: { ticks: { color: tickColor, font: chartFont }, grid: { color: gridColor }, beginAtZero: true },
  },
}

const xpBarOptions = {
  ...barOptions,
  plugins: {
    ...barOptions.plugins,
    tooltip: { ...barOptions.plugins.tooltip, callbacks: { label: (ctx) => `${ctx.parsed.y.toLocaleString()} XP` } },
  },
}

function formatZAR(n) {
  if (typeof n !== 'number') return 'R 0'
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n)
}

async function loadDashboard() {
  if (!selectedSchoolId.value) return
  error.value = ''
  loading.value = true
  try {
    dash.value = await Server.getSchoolDashboard(selectedSchoolId.value, {
      year: year.value,
      term: term.value,
    })
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to load dashboard'
    dash.value = null
  } finally {
    loading.value = false
  }
}

async function generateTeacherLink() {
  if (!selectedSchoolId.value) return
  generatingLink.value = true
  error.value = ''
  try {
    const result = await Server.createSchoolJoinCode(selectedSchoolId.value, 'teacher')
    teacherInviteUrl.value = result.joinUrl
    success.value = 'Teacher invite link generated'
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to generate invite link'
  } finally {
    generatingLink.value = false
  }
}

async function copyLink(url) {
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    success.value = 'Link copied to clipboard'
  } catch {
    error.value = 'Could not copy link'
  }
}

const m = new Date().getMonth()
if (m <= 3) term.value = 1
else if (m <= 7) term.value = 2
else term.value = 3

watch(
  schoolOptions,
  (opts) => {
    if (!opts?.length) return
    if (!selectedSchoolId.value || !opts.some((o) => o.schoolId === selectedSchoolId.value)) {
      selectedSchoolId.value = opts[0].schoolId
      loadDashboard()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
@import '../styles/style.css';

.saPage {
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: 1rem;
  padding-bottom: 3rem;
}
.saShell {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
}
@media (min-width: 768px) { .saShell { padding: 0 1.5rem 3rem; } }
.saBreadcrumbs :deep(.v-breadcrumbs-item) { font-size: 0.8125rem; font-weight: 500; opacity: 0.85; }
.crumbIcon { opacity: 0.5; }

/* Header */
.saHeader {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.saEyebrow {
  font-family: var(--font);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.4);
  margin: 0 0 0.4rem;
}
.saTitle {
  font-family: var(--font);
  font-weight: 600;
  font-size: clamp(1.75rem, 4vw, 2.4rem);
  line-height: 1.15;
  color: var(--white);
  margin: 0;
}
.headerControls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}
.schoolPicker { min-width: 220px; max-width: 300px; }
.termRow { display: flex; gap: 0.5rem; align-items: center; }
.termField { max-width: 150px; }
.yearField { max-width: 85px; }
.refreshBtn {
  background: rgba(0,168,232,0.2) !important;
  border: 1px solid rgba(0,168,232,0.3) !important;
  color: var(--white) !important;
}

.saAlert { margin-bottom: 1rem; font-family: var(--font); }
.loadingWrap { display: flex; justify-content: center; padding: 3rem; }

/* KPI */
.kpiGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
@media (min-width: 640px) { .kpiGrid { grid-template-columns: repeat(4, 1fr); } }

.kpiCard {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.1);
  background: linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05);
  transition: border-color 0.2s, transform 0.2s;
}
@media (hover: hover) {
  .kpiCard:hover { border-color: rgba(255,255,255,0.18); transform: translateY(-2px); }
}
.kpiCard--teachers { border-left: 3px solid rgba(0,168,232,0.7); }
.kpiCard--classes { border-left: 3px solid rgba(26,147,111,0.7); }
.kpiCard--students { border-left: 3px solid rgba(168,51,185,0.7); }
.kpiCard--cost { border-left: 3px solid rgba(247,183,7,0.8); }
.kpiIconWrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  flex-shrink: 0;
}
.kpiBody { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
.kpiLabel { font-family: var(--font); font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255,255,255,0.4); }
.kpiValue { font-family: var(--font); font-size: 1.5rem; font-weight: 700; line-height: 1.1; color: var(--white); font-variant-numeric: tabular-nums; }
.kpiValue--money { font-size: 1.15rem; }
.kpiMeta { font-family: var(--font); font-size: 0.7rem; color: rgba(255,255,255,0.35); margin-top: 0.1rem; }

/* Charts */
.chartsRow {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
@media (min-width: 768px) { .chartsRow { grid-template-columns: 1fr 1fr; } }
.chartPanel {
  padding: 1.25rem;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.1);
  background: linear-gradient(160deg, rgba(0,23,31,0.65) 0%, rgba(0,23,31,0.4) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 28px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);
}
.chartTitle {
  font-family: var(--font);
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.chartTitleIcon { opacity: 0.5; }
.chartWrap { position: relative; height: 220px; }
.chartEmpty {
  display: flex; align-items: center; justify-content: center; height: 100%;
  font-family: var(--font); color: rgba(255,255,255,0.3); font-size: 0.9rem;
}

/* Section panels */
.sectionPanel {
  padding: 1.25rem;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.1);
  background: linear-gradient(160deg, rgba(0,23,31,0.65) 0%, rgba(0,23,31,0.4) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 28px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);
  margin-bottom: 1.25rem;
}
.sectionHead {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.sectionTitle {
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 600;
  color: var(--white);
  margin: 0 0 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.sectionTitleIcon { opacity: 0.5; }
.sectionDesc { font-family: var(--font); font-size: 0.8rem; color: rgba(255,255,255,0.4); margin: 0; }
.sectionBadge {
  font-family: var(--font);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  color: rgba(255,255,255,0.8);
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
}

/* Invite bar */
.inviteBar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 12px;
  background: rgba(168,51,185,0.06);
  border: 1px solid rgba(168,51,185,0.15);
}
.inviteBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  border-radius: 10px !important;
  background: linear-gradient(135deg, rgba(168,51,185,0.35) 0%, rgba(168,51,185,0.15) 100%) !important;
  border: 1px solid rgba(168,51,185,0.3) !important;
  color: var(--white) !important;
}
.inviteLinkDisplay {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}
.linkCode {
  font-family: ui-monospace, monospace;
  font-size: 0.72rem;
  color: rgba(255,255,255,0.55);
  background: rgba(255,255,255,0.04);
  padding: 0.3rem 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* Teacher grid */
.teacherGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
@media (min-width: 640px) { .teacherGrid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 960px) { .teacherGrid { grid-template-columns: repeat(3, 1fr); } }

.teacherCard {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  transition: border-color 0.2s, background 0.2s;
}
@media (hover: hover) {
  .teacherCard:hover { border-color: rgba(0,168,232,0.25); background: rgba(0,168,232,0.04); }
}
.teacherAvatar { flex-shrink: 0; }
.teacherInfo { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; flex: 1; }
.teacherName { font-family: var(--font); font-weight: 600; font-size: 0.9rem; color: var(--white); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.teacherEmail { font-family: var(--font); font-size: 0.75rem; color: rgba(255,255,255,0.4); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.teacherStats { display: flex; gap: 0.75rem; flex-shrink: 0; }
.teacherStat { display: flex; flex-direction: column; align-items: center; gap: 0.05rem; }
.statValue { font-family: var(--font); font-weight: 700; font-size: 1rem; color: var(--white); }
.statLabel { font-family: var(--font); font-size: 0.6rem; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.04em; }

/* Class grid */
.classGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
@media (min-width: 640px) { .classGrid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 960px) { .classGrid { grid-template-columns: repeat(3, 1fr); } }

.classCard {
  padding: 1rem;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  transition: border-color 0.2s, background 0.2s;
}
@media (hover: hover) {
  .classCard:hover { border-color: rgba(26,147,111,0.25); background: rgba(26,147,111,0.04); }
}
.classCardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.65rem;
}
.className { font-family: var(--font); font-weight: 600; font-size: 1rem; color: var(--white); margin: 0; }
.classXP {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font);
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(247,183,7,0.9);
}
.xpIcon { color: rgba(247,183,7,0.7); }

.classMetrics { display: flex; gap: 1rem; align-items: flex-start; }
.classMetric { display: flex; flex-direction: column; align-items: center; gap: 0.05rem; }
.metricValue { font-family: var(--font); font-weight: 700; font-size: 1.35rem; color: var(--white); }
.metricLabel { font-family: var(--font); font-size: 0.6rem; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.04em; }

.classLeaderboard { flex: 1; min-width: 0; }
.leaderTitle {
  font-family: var(--font);
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255,255,255,0.35);
  display: block;
  margin-bottom: 0.35rem;
}
.leaderRow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0;
  font-family: var(--font);
  font-size: 0.8rem;
}
.leaderRank {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: 700;
  background: rgba(247,183,7,0.15);
  color: rgba(247,183,7,0.9);
  flex-shrink: 0;
}
.leaderName { color: rgba(255,255,255,0.8); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.leaderPts { color: rgba(255,255,255,0.45); font-size: 0.75rem; flex-shrink: 0; }

/* Cost bar */
.costBar {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  border: 1px solid rgba(247,183,7,0.15);
  background: rgba(247,183,7,0.04);
  margin-bottom: 1.25rem;
}
.costItem { display: flex; flex-direction: column; gap: 0.15rem; }
.costLabel { font-family: var(--font); font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.4); }
.costValue { font-family: var(--font); font-weight: 700; font-size: 1.15rem; color: rgba(247,183,7,0.9); font-variant-numeric: tabular-nums; }
.costValue--small { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.65); }

.emptyNote { font-family: var(--font); font-size: 0.85rem; color: rgba(255,255,255,0.4); margin: 0; }

/* Glass inputs */
.glassField :deep(.v-field) {
  border-radius: 10px !important;
  background: rgba(255,255,255,0.04) !important;
}
.glassField :deep(.v-field__outline) { --v-field-border-opacity: 0.15; }
.glassField :deep(.v-label),
.glassField :deep(input),
.glassField :deep(.v-select__selection-text) { font-family: var(--font); }
</style>
