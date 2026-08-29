<template>
  <div class="container saPage">
    <div class="saShell">
      <SchoolAdminNav />

      <header class="saHeader">
        <div class="saHeaderLeft">
          <p class="saEyebrow">School administration</p>
          <h1 class="saTitle">
            Schools <span class="titleAccent">overview</span>
          </h1>
          <p class="saSubtitle">
            Usage and term billing across {{ overview?.totals?.schools === 1 ? 'your school' : 'your schools' }}.
          </p>
        </div>
        <div class="headerControls">
          <div class="termRow">
            <v-select v-model="term" :items="termItems" density="compact" hide-details variant="outlined"
              class="glassField termField" label="Term" rounded="lg"
              :menu-props="{ contentClass: 'dashboardSelectMenu' }" @update:model-value="loadOverview" />
            <v-text-field v-model.number="year" label="Year" type="number" variant="outlined" density="compact"
              rounded="lg" hide-details class="glassField yearField" @update:model-value="loadOverview" />
            <v-btn class="refreshBtn" size="small" :loading="loading" icon="mdi-refresh" variant="flat"
              @click="loadOverview" />
          </div>
        </div>
      </header>

      <v-alert v-if="error" type="error" variant="tonal" class="saAlert" rounded="lg" closable
        @click:close="error = ''">
        {{ error }}
      </v-alert>

      <div v-if="loading && !overview" class="loadingWrap">
        <v-progress-circular indeterminate color="primary" size="48" width="4" />
      </div>

      <template v-if="overview">
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

        <section class="tablePanel">
          <div class="tableHead">
            <div>
              <h2 class="sectionTitle">
                <v-icon size="20" class="sectionTitleIcon">mdi-domain</v-icon>
                Per-school usage
              </h2>
              <p class="sectionDesc">
                {{ overview.totals.schools === 1
                  ? 'Your school at a glance.'
                  : 'Compare usage and term cost across schools you administer.' }}
              </p>
            </div>
            <div class="billingChip">
              <v-icon size="16" class="chipIcon">mdi-information-outline</v-icon>
              <span>R{{ overview.costPerStudentZAR }} × student × term</span>
            </div>
          </div>

          <div v-if="overview.schools?.length" class="tableWrap">
            <table class="dataTable">
              <thead>
                <tr>
                  <th>School</th>
                  <th class="num">Teachers</th>
                  <th class="num">Classes</th>
                  <th class="num">Students</th>
                  <th>Last activity</th>
                  <th class="num">Term cost</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in overview.schools" :key="row.schoolId" class="schoolRow">
                  <td>
                    <span class="schoolName">{{ row.schoolName }}</span>
                  </td>
                  <td class="num">{{ row.teacherCount ?? 0 }}</td>
                  <td class="num">{{ row.classCount ?? 0 }}</td>
                  <td class="num">{{ formatInt(row.studentCount) }}</td>
                  <td class="activityCell">{{ formatDate(row.lastActivityAt) }}</td>
                  <td class="num costCell">{{ formatZAR(row.costZAR) }}</td>
                  <td class="actionsCell">
                    <v-btn size="x-small" variant="tonal" class="rowActionBtn"
                      @click="goToDashboard(row.schoolId)">
                      Dashboard
                    </v-btn>
                    <v-btn size="x-small" variant="text" class="rowActionBtn"
                      @click="goToOnboarding(row.schoolId)">
                      Teachers
                    </v-btn>
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="overview.schools.length > 1">
                <tr class="totalsRow">
                  <td><strong>Total</strong></td>
                  <td class="num"><strong>{{ overview.totals.teachers }}</strong></td>
                  <td class="num"><strong>{{ overview.totals.classes }}</strong></td>
                  <td class="num"><strong>{{ formatInt(overview.totals.students) }}</strong></td>
                  <td></td>
                  <td class="num costCell"><strong>{{ formatZAR(overview.totals.costZAR) }}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Server from '@/services/server'
import { useTheme } from '@/composables/useTheme'
import SchoolAdminNav from '@/components/admin/SchoolAdminNav.vue'

const router = useRouter()
const overview = ref(null)
const loading = ref(false)
const error = ref('')
const year = ref(new Date().getFullYear())
const term = ref(1)
const { effectiveTheme } = useTheme()
const isDarkTheme = computed(() => effectiveTheme.value === 'dark')

const termItems = [
  { title: 'T1 · Jan–Apr', value: 1 },
  { title: 'T2 · May–Aug', value: 2 },
  { title: 'T3 · Sep–Dec', value: 3 },
]

const kpiCards = computed(() => {
  if (!overview.value) return []
  const t = overview.value.totals
  const tone = isDarkTheme.value
    ? {
      skyBg: 'rgba(0,168,232,0.15)', sky: 'rgba(0,168,232,0.9)',
      greenBg: 'rgba(26,147,111,0.15)', green: 'rgba(26,147,111,0.9)',
      purpleBg: 'rgba(168,51,185,0.15)', purple: 'rgba(168,51,185,0.9)',
      goldBg: 'rgba(247,183,7,0.15)', gold: 'rgba(247,183,7,0.9)',
    }
    : {
      skyBg: 'rgba(0,120,166,0.14)', sky: 'rgba(0,120,166,0.92)',
      greenBg: 'rgba(26,147,111,0.14)', green: 'rgba(26,147,111,0.92)',
      purpleBg: 'rgba(138,30,160,0.14)', purple: 'rgba(138,30,160,0.92)',
      goldBg: 'rgba(197,142,5,0.14)', gold: 'rgba(197,142,5,0.92)',
    }
  return [
    { label: 'Schools', value: t.schools, icon: 'mdi-domain', iconBg: tone.skyBg, iconColor: tone.sky, cls: 'kpiCard--schools' },
    { label: 'Teachers', value: t.teachers, icon: 'mdi-account-school-outline', iconBg: tone.greenBg, iconColor: tone.green, cls: 'kpiCard--teachers' },
    { label: 'Students', value: formatInt(t.students), icon: 'mdi-account-group-outline', iconBg: tone.purpleBg, iconColor: tone.purple, cls: 'kpiCard--students' },
    { label: 'Term cost', value: formatZAR(t.costZAR), icon: 'mdi-cash-multiple', iconBg: tone.goldBg, iconColor: tone.gold, cls: 'kpiCard--cost', isMoney: true, meta: overview.value.termKey },
  ]
})

function formatInt(n) {
  return typeof n === 'number' ? n.toLocaleString('en-ZA') : '0'
}

function formatZAR(n) {
  if (typeof n !== 'number') return 'R 0'
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

function goToDashboard(schoolId) {
  router.push({ path: '/SchoolAdminDashboard', query: { schoolId } })
}

function goToOnboarding(schoolId) {
  router.push({ path: '/SchoolAdminOnboarding', query: { schoolId } })
}

async function loadOverview() {
  error.value = ''
  loading.value = true
  try {
    overview.value = await Server.getSchoolAdminOverview({ year: year.value, term: term.value })
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to load overview'
    overview.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const m = new Date().getMonth()
  if (m <= 3) term.value = 1
  else if (m <= 7) term.value = 2
  else term.value = 3
  loadOverview()
})
</script>

<style scoped>
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

@media (min-width: 768px) {
  .saShell { padding: 0 1.5rem 3rem; }
}

.saHeader {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.08);
}

.saEyebrow {
  font-family: var(--font);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.4);
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

.saSubtitle {
  font-family: var(--font);
  font-size: 0.9rem;
  color: rgba(var(--ink-rgb), 0.5);
  margin: 0.5rem 0 0;
  max-width: 36rem;
}

.headerControls { display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end; }
.termRow { display: flex; gap: 0.5rem; align-items: center; }
.termField { max-width: 150px; }
.yearField { max-width: 85px; }
.refreshBtn {
  background: rgba(26, 147, 111, 0.2) !important;
  border: 1px solid rgba(26, 147, 111, 0.3) !important;
  color: var(--white) !important;
}

.saAlert { margin-bottom: 1rem; font-family: var(--font); }
.loadingWrap { display: flex; justify-content: center; padding: 3rem; }

.kpiGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .kpiGrid { grid-template-columns: repeat(4, 1fr); }
}

.kpiCard {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: linear-gradient(145deg, rgba(var(--ink-rgb), 0.06) 0%, rgba(var(--ink-rgb), 0.02) 100%);
}

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
.kpiLabel {
  font-family: var(--font);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.4);
}

.kpiValue {
  font-family: var(--font);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--white);
  line-height: 1.1;
}

.kpiValue--money { font-size: 1.25rem; }
.kpiMeta { font-family: var(--font); font-size: 0.7rem; color: rgba(var(--ink-rgb), 0.35); }

.tablePanel {
  padding: 1.25rem;
  border-radius: 18px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: linear-gradient(160deg, rgba(var(--color-bg-rgb), 0.65) 0%, rgba(var(--color-bg-rgb), 0.4) 100%);
}

.tableHead {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.sectionTitle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--white);
  margin: 0;
}

.sectionTitleIcon { opacity: 0.7; }

.sectionDesc {
  font-family: var(--font);
  font-size: 0.82rem;
  color: rgba(var(--ink-rgb), 0.45);
  margin: 0.35rem 0 0;
}

.billingChip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-family: var(--font);
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(var(--ink-rgb), 0.65);
  background: rgba(var(--ink-rgb), 0.05);
  border: 1px solid rgba(var(--ink-rgb), 0.1);
}

.tableWrap { overflow-x: auto; }

.dataTable {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font);
  font-size: 0.85rem;
}

.dataTable th,
.dataTable td {
  padding: 0.65rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.06);
}

.dataTable th.num,
.dataTable td.num { text-align: right; }

.dataTable th {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.45);
}

.schoolName { font-weight: 600; color: rgba(var(--ink-rgb), 0.9); }
.activityCell { font-size: 0.82rem; color: rgba(var(--ink-rgb), 0.55); white-space: nowrap; }
.costCell { color: rgba(247, 183, 7, 0.95); font-weight: 600; }
.actionsCell { white-space: nowrap; }
.rowActionBtn { text-transform: none !important; font-family: var(--font) !important; font-weight: 600 !important; }
.totalsRow td { border-top: 1px solid rgba(var(--ink-rgb), 0.12); border-bottom: none; }

.glassField :deep(.v-field) {
  border-radius: 10px !important;
  background: rgba(var(--ink-rgb), 0.04) !important;
}
</style>
