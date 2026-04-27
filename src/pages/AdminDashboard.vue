<template>
  <div class="container adminPage">
    <div class="adminShell">
      <header class="adminHeader">
        <div class="adminHeaderLeft">
          <p class="adminEyebrow">Platform administration</p>
          <h1 class="adminTitle">
            Operations <span class="titleAccent">overview</span>
          </h1>
          <p class="adminSubtitle">
            Monitor schools, enrollment, and term-based billing across the entire platform.
          </p>
        </div>
        <div class="headerActions">
          <div class="billingChip">
            <v-icon size="16" class="chipIcon">mdi-information-outline</v-icon>
            <span>R60 × student × school × term</span>
          </div>
          <div class="termSelector">
            <v-select v-model="term" :items="termItems" density="compact" hide-details variant="outlined"
              class="glassField termField" label="Term" rounded="lg"
              :menu-props="{ contentClass: 'dashboardSelectMenu' }" />
            <v-text-field v-model.number="year" label="Year" type="number" variant="outlined" density="compact"
              rounded="lg" hide-details class="glassField yearField" :clearable="false" />
            <v-btn class="refreshBtn" size="small" :loading="overviewLoading" icon="mdi-refresh" variant="flat"
              @click="loadOverview" />
          </div>
        </div>
      </header>

      <v-alert v-if="loadError" type="error" variant="tonal" class="adminAlert" rounded="lg" closable
        @click:close="loadError = ''">
        {{ loadError }}
      </v-alert>

      <v-alert v-if="successMsg" type="success" variant="tonal" class="adminAlert" rounded="lg" closable
        @click:close="successMsg = ''">
        {{ successMsg }}
      </v-alert>

      <!-- Loading state -->
      <div v-if="overviewLoading && !overview" class="loadingWrap">
        <v-progress-circular indeterminate color="primary" size="48" width="4" />
      </div>

      <template v-if="overview">
        <!-- KPI cards -->
        <section class="kpiGrid" aria-label="Summary statistics">
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

        <!-- Charts section -->
        <section class="chartsRow">
          <div class="chartPanel chartPanel--bar">
            <h2 class="chartTitle">
              <v-icon size="20" class="chartTitleIcon">mdi-chart-bar</v-icon>
              Students by school
            </h2>
            <div class="chartWrap">
              <Bar v-if="studentsBarData" :data="studentsBarData" :options="barOptions" />
              <div v-else class="chartEmpty">No school data</div>
            </div>
          </div>
          <div class="chartPanel chartPanel--doughnut">
            <h2 class="chartTitle">
              <v-icon size="20" class="chartTitleIcon">mdi-chart-donut</v-icon>
              Revenue distribution
            </h2>
            <div class="chartWrap chartWrap--doughnut">
              <Doughnut v-if="revenueDoughnutData" :data="revenueDoughnutData" :options="doughnutOptions" />
              <div v-else class="chartEmpty">No revenue data</div>
            </div>
          </div>
        </section>

        <!-- Growth trend chart -->
        <section v-if="growthLineData" class="chartPanel chartPanel--full">
          <h2 class="chartTitle">
            <v-icon size="20" class="chartTitleIcon">mdi-trending-up</v-icon>
            Platform growth — last 6 months
          </h2>
          <div class="chartWrap chartWrap--line">
            <Line :data="growthLineData" :options="lineOptions" />
          </div>
        </section>

        <!-- Quick Actions -->
        <section class="actionsGrid">
          <!-- Create School -->
          <div class="actionCard">
            <div class="actionHeader">
              <v-icon size="22" color="var(--freshSky)">mdi-plus-circle-outline</v-icon>
              <h3 class="actionTitle">Create school</h3>
            </div>
            <p class="actionDesc">Add a new school to the platform. Assign members and generate invite links after
              creation.</p>
            <div class="actionRow">
              <v-text-field v-model="newSchoolName" placeholder="e.g. Riverside Primary" density="compact" hide-details
                variant="outlined" class="glassField actionInput" @keyup.enter="createSchool" />
              <v-btn class="actionBtn actionBtn--create" :loading="creatingSchool" @click="createSchool">
                Create
              </v-btn>
            </div>
          </div>

          <!-- Add Member -->
          <div class="actionCard">
            <div class="actionHeader">
              <v-icon size="22" color="var(--seaGreen)">mdi-account-plus-outline</v-icon>
              <h3 class="actionTitle">Add member</h3>
            </div>
            <p class="actionDesc">Search and assign an existing account to a school.</p>
            <div class="actionFields">
              <v-select v-model="memberSchoolId" :items="schoolSelectItems" item-title="title" item-value="value"
                placeholder="Select school" density="compact" hide-details variant="outlined" class="glassField"
                :menu-props="{ contentClass: 'dashboardSelectMenu' }" />
              <v-autocomplete v-model="memberUserId" v-model:search="memberSearchQuery" :items="memberSearchResults"
                item-title="label" item-value="userId" placeholder="Search user by name, email, or UID"
                density="compact" hide-details variant="outlined" class="glassField userLookupField" no-filter
                :loading="memberSearchLoading" :disabled="!memberSchoolId" clearable
                :menu-props="{ contentClass: 'dashboardSelectMenu' }">
                <template #prepend-inner>
                  <v-progress-circular v-if="memberSearchLoading" indeterminate size="16" width="2" color="primary" />
                  <v-icon v-else size="16">mdi-account-search-outline</v-icon>
                </template>
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.raw.name || 'Unnamed user'"
                    :subtitle="item.raw.email || item.raw.userId" />
                </template>
              </v-autocomplete>
              <div class="actionRowInline">
                <v-select v-model="memberRole" :items="roleItems" density="compact" hide-details variant="outlined"
                  class="glassField roleSelect" :menu-props="{ contentClass: 'dashboardSelectMenu' }" />
                <v-btn class="actionBtn actionBtn--member" :loading="addingMember" @click="addMember">
                  Add
                </v-btn>
              </div>
            </div>
          </div>

          <!-- Invite Links -->
          <div class="actionCard actionCard--wide">
            <div class="actionHeader">
              <v-icon size="22" color="var(--amethyst)">mdi-link-variant</v-icon>
              <h3 class="actionTitle">Invite links</h3>
            </div>
            <p class="actionDesc">Generate role-specific join links. Anyone signed in can join using the link.</p>
            <div class="inviteBody">
              <v-select v-model="inviteSchoolId" :items="schoolSelectItems" item-title="title" item-value="value"
                placeholder="Select school" density="compact" hide-details variant="outlined"
                class="glassField inviteSchoolSelect" :menu-props="{ contentClass: 'dashboardSelectMenu' }" />
              <div class="inviteLinkGroup">
                <div class="inviteLinkRow">
                  <v-btn class="actionBtn actionBtn--invite" size="small" :loading="creatingTeacherJoinCode"
                    :disabled="!inviteSchoolId" prepend-icon="mdi-account-school" @click="generateJoinCode('teacher')">
                    Teacher link
                  </v-btn>
                  <div v-if="teacherJoinUrl" class="linkCopy">
                    <code class="linkText">{{ teacherJoinUrl }}</code>
                    <v-btn icon="mdi-content-copy" size="x-small" variant="text" @click="copyLink(teacherJoinUrl)" />
                  </div>
                </div>
                <div class="inviteLinkRow">
                  <v-btn class="actionBtn actionBtn--invite" size="small" :loading="creatingSchoolAdminJoinCode"
                    :disabled="!inviteSchoolId" prepend-icon="mdi-shield-account"
                    @click="generateJoinCode('schoolAdmin')">
                    Admin link
                  </v-btn>
                  <div v-if="schoolAdminJoinUrl" class="linkCopy">
                    <code class="linkText">{{ schoolAdminJoinUrl }}</code>
                    <v-btn icon="mdi-content-copy" size="x-small" variant="text"
                      @click="copyLink(schoolAdminJoinUrl)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Schools directory -->
        <section class="tablePanel">
          <div class="tableHead">
            <div>
              <h2 class="sectionTitle">Schools directory</h2>
              <p class="sectionDesc">Click a school to view members, classes, and billing details.</p>
            </div>
            <div class="tableBadge">{{ overview.schools?.length ?? 0 }} schools</div>
          </div>

          <div v-if="overview.schools?.length" class="tableWrap">
            <table class="dataTable">
              <thead>
                <tr>
                  <th>School</th>
                  <th class="num">Teachers</th>
                  <th class="num">Classes</th>
                  <th class="num">Students</th>
                  <th class="num">Term cost</th>
                  <th class="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="row in overview.schools" :key="row.schoolId">
                  <tr class="schoolRow" @click="toggleSchoolExpand(row.schoolId)">
                    <td>
                      <div class="schoolNameCell">
                        <v-icon size="18" class="expandIcon"
                          :class="{ 'expandIcon--open': expandedSchool === row.schoolId }">
                          mdi-chevron-right
                        </v-icon>
                        <div>
                          <span class="schoolName">{{ row.schoolName }}</span>
                          <span class="schoolIdMono">{{ row.schoolId.slice(0, 8) }}…</span>
                        </div>
                      </div>
                    </td>
                    <td class="num">{{ row.teacherCount ?? 0 }}</td>
                    <td class="num">{{ row.classCount }}</td>
                    <td class="num">{{ formatInt(row.studentCount) }}</td>
                    <td class="num costCell">{{ formatZAR(row.costZAR) }}</td>
                    <td class="num">
                      <v-btn icon="mdi-open-in-new" size="x-small" variant="text"
                        @click.stop="viewSchoolMembers(row.schoolId)" />
                    </td>
                  </tr>
                  <tr v-if="expandedSchool === row.schoolId" class="expandRow">
                    <td colspan="6">
                      <div class="expandContent">
                        <div v-if="schoolMembersLoading" class="expandLoading">
                          <v-progress-circular indeterminate size="20" width="2" />
                        </div>
                        <template v-else-if="schoolMembers">
                          <h4 class="expandSubtitle">Members ({{ schoolMembers.members?.length ?? 0 }})</h4>
                          <div v-if="schoolMembers.members?.length" class="memberChips">
                            <div v-for="m in schoolMembers.members" :key="m.userId" class="memberChip" :class="m.role">
                              <v-icon size="14">{{ m.role === 'schoolAdmin' ? 'mdi-shield-account' : 'mdi-account'
                                }}</v-icon>
                              <span class="memberName">{{ m.name || m.email || m.userId.slice(0, 8) }}</span>
                              <span class="memberRole">{{ m.role === 'schoolAdmin' ? 'Admin' : 'Teacher' }}</span>
                              <span v-if="m.classCount" class="memberStat">{{ m.classCount }} classes · {{
                                m.studentCount }} students</span>
                            </div>
                          </div>
                          <p v-else class="expandEmpty">No members yet</p>
                        </template>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <div v-else class="emptyState">
            <v-icon size="48" class="emptyIcon">mdi-school-outline</v-icon>
            <p class="emptyTitle">No schools yet</p>
            <p class="emptyText">Create a school above to see it listed here with usage metrics.</p>
          </div>
        </section>

        <!-- Recent activity -->
        <section v-if="overview.recentActivity?.length" class="activityPanel">
          <h2 class="sectionTitle">
            <v-icon size="20" class="sectionTitleIcon">mdi-history</v-icon>
            Recent activity
          </h2>
          <div class="activityList">
            <div v-for="(item, idx) in overview.recentActivity" :key="idx" class="activityItem">
              <div class="activityDot" :class="'activityDot--' + item.type" />
              <div class="activityBody">
                <span class="activityLabel">{{ item.label }}</span>
                <span class="activityDate">{{ formatDate(item.date) }}</span>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import Server from '@/services/server'
import { useTheme } from '@/composables/useTheme'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler)

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

const overview = ref(null)
const overviewLoading = ref(false)
const loadError = ref('')
const successMsg = ref('')
const year = ref(new Date().getFullYear())
const term = ref(1)
const { effectiveTheme } = useTheme()
const isDarkTheme = computed(() => effectiveTheme.value === 'dark')

const newSchoolName = ref('')
const creatingSchool = ref(false)

const memberSchoolId = ref('')
const memberUserId = ref('')
const memberRole = ref('teacher')
const addingMember = ref(false)
const memberSearchQuery = ref('')
const memberSearchLoading = ref(false)
const memberSearchResults = ref([])
let memberSearchRequestId = 0

const inviteSchoolId = ref('')
const teacherJoinUrl = ref('')
const schoolAdminJoinUrl = ref('')
const creatingTeacherJoinCode = ref(false)
const creatingSchoolAdminJoinCode = ref(false)

const expandedSchool = ref(null)
const schoolMembers = ref(null)
const schoolMembersLoading = ref(false)

const termItems = [
  { title: 'T1 · Jan–Apr', value: 1 },
  { title: 'T2 · May–Aug', value: 2 },
  { title: 'T3 · Sep–Dec', value: 3 },
]
const roleItems = [
  { title: 'Teacher', value: 'teacher' },
  { title: 'School admin', value: 'schoolAdmin' },
]

const schoolSelectItems = computed(() =>
  (overview.value?.schools ?? []).map((s) => ({ title: s.schoolName, value: s.schoolId }))
)

const kpiCards = computed(() => {
  if (!overview.value) return []
  const t = overview.value.totals
  const tone = isDarkTheme.value
    ? {
      skyBg: 'rgba(0,168,232,0.15)',
      sky: 'rgba(0,168,232,0.9)',
      redBg: 'rgba(197,40,61,0.15)',
      red: 'rgba(197,40,61,0.9)',
      greenBg: 'rgba(26,147,111,0.15)',
      green: 'rgba(26,147,111,0.9)',
      purpleBg: 'rgba(168,51,185,0.15)',
      purple: 'rgba(168,51,185,0.9)',
      goldBg: 'rgba(247,183,7,0.15)',
      gold: 'rgba(247,183,7,0.9)',
    }
    : {
      skyBg: 'rgba(0,120,166,0.14)',
      sky: 'rgba(0,120,166,0.92)',
      redBg: 'rgba(181,34,54,0.14)',
      red: 'rgba(181,34,54,0.92)',
      greenBg: 'rgba(26,147,111,0.14)',
      green: 'rgba(26,147,111,0.92)',
      purpleBg: 'rgba(138,30,160,0.14)',
      purple: 'rgba(138,30,160,0.92)',
      goldBg: 'rgba(197,142,5,0.14)',
      gold: 'rgba(197,142,5,0.92)',
    }
  return [
    { label: 'Schools', value: t.schools, icon: 'mdi-domain', iconBg: tone.skyBg, iconColor: tone.sky, cls: 'kpiCard--schools', meta: 'Registered' },
    { label: 'Teachers', value: t.teachers ?? 0, icon: 'mdi-account-school-outline', iconBg: tone.redBg, iconColor: tone.red, cls: 'kpiCard--teachers', meta: 'Unique across schools' },
    { label: 'Classes', value: t.classes, icon: 'mdi-google-classroom', iconBg: tone.greenBg, iconColor: tone.green, cls: 'kpiCard--classes', meta: 'Active this term' },
    { label: 'Students', value: formatInt(t.students), icon: 'mdi-account-group-outline', iconBg: tone.purpleBg, iconColor: tone.purple, cls: 'kpiCard--students' },
    { label: 'Term revenue', value: formatZAR(t.costZAR), icon: 'mdi-cash-multiple', iconBg: tone.goldBg, iconColor: tone.gold, cls: 'kpiCard--cost', isMoney: true, meta: overview.value.termKey },
    { label: 'Year projection', value: formatZAR(t.projectedYearlyCostZAR ?? 0), icon: 'mdi-chart-timeline-variant', iconBg: tone.greenBg, iconColor: tone.green, cls: 'kpiCard--yearly', isMoney: true, meta: `${overview.value.termsPerYear ?? 3} terms` },
  ]
})

const studentsBarData = computed(() => {
  const schools = overview.value?.schools
  if (!schools?.length) return null
  return {
    labels: schools.map((s) => s.schoolName),
    datasets: [
      {
        label: 'Students',
        data: schools.map((s) => s.studentCount),
        backgroundColor: schools.map((_, i) => PALETTE[i % PALETTE.length]),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 48,
      },
    ],
  }
})

const revenueDoughnutData = computed(() => {
  const schools = overview.value?.schools?.filter((s) => s.costZAR > 0)
  if (!schools?.length) return null
  return {
    labels: schools.map((s) => s.schoolName),
    datasets: [
      {
        data: schools.map((s) => s.costZAR),
        backgroundColor: schools.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  }
})

const growthLineData = computed(() => {
  const growth = overview.value?.growth
  if (!growth?.length) return null
  return {
    labels: growth.map((g) => g.label),
    datasets: [
      {
        label: 'Students',
        data: growth.map((g) => g.newStudents),
        borderColor: PALETTE[0],
        backgroundColor: 'rgba(0,168,232,0.08)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Teachers',
        data: growth.map((g) => g.newTeachers),
        borderColor: PALETTE[1],
        backgroundColor: 'transparent',
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Classes',
        data: growth.map((g) => g.newClasses),
        borderColor: PALETTE[2],
        backgroundColor: 'transparent',
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Schools',
        data: growth.map((g) => g.newSchools),
        borderColor: PALETTE[3],
        backgroundColor: 'transparent',
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }
})

const chartFont = { family: 'Advent Pro, sans-serif' }
const chartTheme = computed(() => (
  isDarkTheme.value
    ? {
      gridColor: 'rgba(255,255,255,0.08)',
      tickColor: 'rgba(255,255,255,0.6)',
      tooltipBg: 'rgba(8,33,42,0.96)',
      tooltipBorder: 'rgba(255,255,255,0.16)',
    }
    : {
      gridColor: 'rgba(13,37,48,0.12)',
      tickColor: 'rgba(13,37,48,0.72)',
      tooltipBg: 'rgba(255,255,255,0.98)',
      tooltipBorder: 'rgba(13,37,48,0.2)',
    }
))

const barOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { titleFont: chartFont, bodyFont: chartFont, backgroundColor: chartTheme.value.tooltipBg, borderColor: chartTheme.value.tooltipBorder, borderWidth: 1 },
  },
  scales: {
    x: { ticks: { color: chartTheme.value.tickColor, font: chartFont }, grid: { display: false } },
    y: { ticks: { color: chartTheme.value.tickColor, font: chartFont }, grid: { color: chartTheme.value.gridColor }, beginAtZero: true },
  },
}))

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: { position: 'bottom', labels: { color: chartTheme.value.tickColor, font: chartFont, padding: 14, usePointStyle: true, pointStyle: 'circle' } },
    tooltip: { titleFont: chartFont, bodyFont: chartFont, backgroundColor: chartTheme.value.tooltipBg, borderColor: chartTheme.value.tooltipBorder, borderWidth: 1 },
  },
}))

const lineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', align: 'end', labels: { color: chartTheme.value.tickColor, font: chartFont, padding: 16, usePointStyle: true, pointStyle: 'circle' } },
    tooltip: { mode: 'index', intersect: false, titleFont: chartFont, bodyFont: chartFont, backgroundColor: chartTheme.value.tooltipBg, borderColor: chartTheme.value.tooltipBorder, borderWidth: 1 },
  },
  scales: {
    x: { ticks: { color: chartTheme.value.tickColor, font: chartFont }, grid: { display: false } },
    y: { ticks: { color: chartTheme.value.tickColor, font: chartFont }, grid: { color: chartTheme.value.gridColor }, beginAtZero: true },
  },
  interaction: { mode: 'nearest', axis: 'x', intersect: false },
}))

function formatInt(n) {
  return typeof n === 'number' ? n.toLocaleString('en-ZA') : '0'
}
function formatZAR(n) {
  if (typeof n !== 'number') return 'R 0'
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n)
}
function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function loadOverview() {
  loadError.value = ''
  overviewLoading.value = true
  try {
    overview.value = await Server.getAdminOverview({ year: year.value, term: term.value })
    if (!memberSchoolId.value && overview.value?.schools?.length) {
      memberSchoolId.value = overview.value.schools[0].schoolId
    }
    if (!inviteSchoolId.value && overview.value?.schools?.length) {
      inviteSchoolId.value = overview.value.schools[0].schoolId
    }
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Failed to load overview'
  } finally {
    overviewLoading.value = false
  }
}

async function createSchool() {
  const name = newSchoolName.value?.trim()
  if (!name) return
  creatingSchool.value = true
  loadError.value = ''
  try {
    await Server.createAdminSchool({ name })
    newSchoolName.value = ''
    successMsg.value = `School "${name}" created`
    await loadOverview()
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Failed to create school'
  } finally {
    creatingSchool.value = false
  }
}

async function addMember() {
  if (!memberSchoolId.value) { loadError.value = 'Select a school'; return }
  if (!memberUserId.value) { loadError.value = 'Select a user account'; return }
  const body = { role: memberRole.value, userId: memberUserId.value }
  addingMember.value = true
  loadError.value = ''
  try {
    await Server.addAdminSchoolMember(memberSchoolId.value, body)
    successMsg.value = `Member added as ${memberRole.value}`
    memberUserId.value = ''
    memberSearchQuery.value = ''
    memberSearchResults.value = []
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Failed to add member'
  } finally {
    addingMember.value = false
  }
}

watch(memberSearchQuery, async (raw) => {
  const q = raw?.trim() || ''
  if (q.length < 2) {
    memberSearchResults.value = []
    memberSearchLoading.value = false
    return
  }
  const requestId = ++memberSearchRequestId
  memberSearchLoading.value = true
  try {
    const data = await Server.searchAdminUsers(q)
    if (requestId !== memberSearchRequestId) return
    memberSearchResults.value = (data.users || []).map((u) => ({
      ...u,
      label: `${u.name || 'Unnamed user'} - ${u.email || u.userId}`,
    }))
  } catch (e) {
    if (requestId !== memberSearchRequestId) return
    loadError.value = e.response?.data?.message || e.message || 'Failed to search users'
  } finally {
    if (requestId === memberSearchRequestId) {
      memberSearchLoading.value = false
    }
  }
})

async function generateJoinCode(role) {
  if (!inviteSchoolId.value) { loadError.value = 'Select a school first'; return }
  if (role === 'teacher') creatingTeacherJoinCode.value = true
  else creatingSchoolAdminJoinCode.value = true
  loadError.value = ''
  try {
    const result = await Server.createAdminSchoolJoinCode(inviteSchoolId.value, role)
    if (role === 'teacher') teacherJoinUrl.value = result.joinUrl
    else schoolAdminJoinUrl.value = result.joinUrl
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Failed to generate invite link'
  } finally {
    if (role === 'teacher') creatingTeacherJoinCode.value = false
    else creatingSchoolAdminJoinCode.value = false
  }
}

async function copyLink(url) {
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    successMsg.value = 'Link copied to clipboard'
  } catch {
    loadError.value = 'Could not copy link'
  }
}

function toggleSchoolExpand(schoolId) {
  if (expandedSchool.value === schoolId) {
    expandedSchool.value = null
    schoolMembers.value = null
    return
  }
  expandedSchool.value = schoolId
  viewSchoolMembers(schoolId)
}

async function viewSchoolMembers(schoolId) {
  schoolMembersLoading.value = true
  schoolMembers.value = null
  expandedSchool.value = schoolId
  try {
    schoolMembers.value = await Server.getAdminSchoolMembers(schoolId)
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Failed to load members'
  } finally {
    schoolMembersLoading.value = false
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
.adminPage {
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: 1rem;
  padding-bottom: 3rem;
}

.adminShell {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
}

@media (min-width: 768px) {
  .adminShell {
    padding: 0 1.5rem 3rem;
  }
}

.adminBreadcrumbs :deep(.v-breadcrumbs-item) {
  font-size: 0.8125rem;
  font-weight: 500;
  opacity: 0.85;
}

.crumbIcon {
  opacity: 0.5;
}

/* Header */
.adminHeader {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.08);
}

.adminEyebrow {
  font-family: var(--font);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.4);
  margin: 0 0 0.4rem;
}

.adminTitle {
  font-family: var(--font);
  font-weight: 600;
  font-size: clamp(1.75rem, 4vw, 2.4rem);
  line-height: 1.15;
  color: var(--white);
  margin: 0 0 0.5rem;
}

.adminSubtitle {
  font-family: var(--font);
  font-size: 0.95rem;
  color: rgba(var(--ink-rgb), 0.55);
  margin: 0;
  max-width: 36rem;
}

.headerActions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
}

.billingChip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-family: var(--font);
  font-size: 0.75rem;
  color: rgba(var(--ink-rgb), 0.7);
  background: rgba(var(--ink-rgb), 0.05);
  border: 1px solid rgba(var(--ink-rgb), 0.08);
}

.chipIcon {
  opacity: 0.6;
}

.termSelector {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.termField {
  max-width: 160px;
}

.yearField {
  max-width: 90px;
}

.adminAlert {
  margin-bottom: 1rem;
  font-family: var(--font);
}

.loadingWrap {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

/* KPI */
.kpiGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .kpiGrid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1100px) {
  .kpiGrid {
    grid-template-columns: repeat(6, 1fr);
  }
}

.kpiCard {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: linear-gradient(145deg, rgba(var(--ink-rgb), 0.06) 0%, rgba(var(--ink-rgb), 0.02) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 4px 24px rgba(var(--shadow-rgb), 0.18), inset 0 1px 0 rgba(var(--ink-rgb), 0.05);
  transition: border-color 0.2s, transform 0.2s;
}

@media (hover: hover) {
  .kpiCard:hover {
    border-color: rgba(var(--ink-rgb), 0.18);
    transform: translateY(-2px);
  }
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

.kpiBody {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

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
  line-height: 1.1;
  color: var(--white);
  font-variant-numeric: tabular-nums;
}

.kpiValue--money {
  font-size: 1.2rem;
}

.kpiMeta {
  font-family: var(--font);
  font-size: 0.7rem;
  color: rgba(var(--ink-rgb), 0.35);
  margin-top: 0.1rem;
}

/* Charts */
.chartsRow {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (min-width: 768px) {
  .chartsRow {
    grid-template-columns: 3fr 2fr;
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

.chartPanel--full {
  margin-bottom: 1rem;
}

.chartTitle {
  font-family: var(--font);
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(var(--ink-rgb), 0.85);
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chartTitleIcon {
  opacity: 0.5;
}

.chartWrap {
  position: relative;
  height: 220px;
}

.chartWrap--doughnut {
  height: 260px;
}

.chartWrap--line {
  height: 200px;
}

.chartEmpty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-family: var(--font);
  color: rgba(var(--ink-rgb), 0.3);
  font-size: 0.9rem;
}

/* Action cards */
.actionsGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (min-width: 768px) {
  .actionsGrid {
    grid-template-columns: 1fr 1fr;
  }
}

.actionCard {
  padding: 1.25rem;
  border-radius: 18px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: linear-gradient(160deg, rgba(var(--color-bg-rgb), 0.65) 0%, rgba(var(--color-bg-rgb), 0.4) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 28px rgba(var(--shadow-rgb), 0.2), inset 0 1px 0 rgba(var(--ink-rgb), 0.04);
}

.actionCard--wide {
  grid-column: 1 / -1;
}

.actionHeader {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.actionTitle {
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 600;
  color: var(--white);
  margin: 0;
}

.actionDesc {
  font-family: var(--font);
  font-size: 0.8rem;
  color: rgba(var(--ink-rgb), 0.45);
  margin: 0 0 0.85rem;
  line-height: 1.4;
}

.actionRow {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.actionInput {
  flex: 1;
}

.actionFields {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.actionRowInline {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.roleSelect {
  max-width: 160px;
}

.userLookupField {
  width: 100%;
}

.actionBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  letter-spacing: 0.01em !important;
  padding: 0 1rem !important;
}

.actionBtn--create {
  background: linear-gradient(135deg, rgba(0, 168, 232, 0.45) 0%, rgba(0, 168, 232, 0.2) 100%) !important;
  border: 1px solid rgba(0, 168, 232, 0.4) !important;
  color: var(--white) !important;
}

.actionBtn--member {
  background: linear-gradient(135deg, rgba(26, 147, 111, 0.45) 0%, rgba(26, 147, 111, 0.2) 100%) !important;
  border: 1px solid rgba(26, 147, 111, 0.4) !important;
  color: var(--white) !important;
}

.actionBtn--invite {
  background: linear-gradient(135deg, rgba(168, 51, 185, 0.35) 0%, rgba(168, 51, 185, 0.15) 100%) !important;
  border: 1px solid rgba(168, 51, 185, 0.3) !important;
  color: var(--white) !important;
}

/* Invite links */
.inviteBody {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.inviteSchoolSelect {
  max-width: 300px;
}

.inviteLinkGroup {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.inviteLinkRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.linkCopy {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.linkText {
  font-family: ui-monospace, monospace;
  font-size: 0.72rem;
  color: rgba(var(--ink-rgb), 0.55);
  background: rgba(var(--ink-rgb), 0.04);
  padding: 0.3rem 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(var(--ink-rgb), 0.08);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.refreshBtn {
  background: rgba(0, 168, 232, 0.2) !important;
  border: 1px solid rgba(0, 168, 232, 0.3) !important;
  color: var(--white) !important;
}

/* Table panel */
.tablePanel {
  border-radius: 18px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: linear-gradient(160deg, rgba(var(--color-bg-rgb), 0.65) 0%, rgba(var(--color-bg-rgb), 0.4) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 28px rgba(var(--shadow-rgb), 0.2), inset 0 1px 0 rgba(var(--ink-rgb), 0.04);
  overflow: hidden;
  margin-bottom: 1rem;
}

.tableHead {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.25rem 1.35rem 1rem;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.06);
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

.sectionTitleIcon {
  opacity: 0.5;
}

.sectionDesc {
  font-family: var(--font);
  font-size: 0.8rem;
  color: rgba(var(--ink-rgb), 0.4);
  margin: 0;
}

.tableBadge {
  font-family: var(--font);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  color: rgba(var(--ink-rgb), 0.8);
  background: rgba(var(--ink-rgb), 0.06);
  border: 1px solid rgba(var(--ink-rgb), 0.08);
}

.tableWrap {
  overflow-x: auto;
}

.dataTable {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font);
}

.dataTable thead th {
  text-align: left;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.4);
  padding: 0.6rem 1.35rem;
  background: rgba(var(--shadow-rgb), 0.15);
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.06);
}

.dataTable tbody td {
  padding: 0.85rem 1.35rem;
  font-size: 0.9rem;
  color: rgba(var(--ink-rgb), 0.88);
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.05);
  vertical-align: middle;
}

.dataTable tbody tr:last-child td {
  border-bottom: none;
}

.schoolRow {
  cursor: pointer;
  transition: background 0.15s;
}

@media (hover: hover) {
  .schoolRow:hover td {
    background: rgba(var(--ink-rgb), 0.03);
  }
}

.schoolNameCell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.expandIcon {
  transition: transform 0.2s;
  opacity: 0.4;
}

.expandIcon--open {
  transform: rotate(90deg);
  opacity: 0.8;
}

.schoolName {
  display: block;
  font-weight: 600;
  color: var(--white);
}

.schoolIdMono {
  display: block;
  font-size: 0.65rem;
  font-family: ui-monospace, monospace;
  color: rgba(var(--ink-rgb), 0.3);
  margin-top: 0.15rem;
}

.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.costCell {
  font-weight: 600;
  color: rgba(247, 183, 7, 0.9);
}

/* Expanded row */
.expandRow td {
  background: rgba(var(--shadow-rgb), 0.12) !important;
  padding: 0 !important;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.06) !important;
}

.expandContent {
  padding: 1rem 1.35rem;
}

.expandLoading {
  display: flex;
  justify-content: center;
  padding: 0.75rem;
}

.expandSubtitle {
  font-family: var(--font);
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(var(--ink-rgb), 0.6);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.75rem;
}

.memberChips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.memberChip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 12px;
  font-family: var(--font);
  font-size: 0.78rem;
  color: rgba(var(--ink-rgb), 0.85);
  background: rgba(var(--ink-rgb), 0.05);
  border: 1px solid rgba(var(--ink-rgb), 0.1);
}

.memberChip.schoolAdmin {
  border-color: rgba(168, 51, 185, 0.3);
  background: rgba(168, 51, 185, 0.08);
}

.memberChip.teacher {
  border-color: rgba(0, 168, 232, 0.3);
  background: rgba(0, 168, 232, 0.06);
}

.memberName {
  font-weight: 600;
}

.memberRole {
  font-size: 0.68rem;
  color: rgba(var(--ink-rgb), 0.45);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.memberStat {
  font-size: 0.7rem;
  color: rgba(var(--ink-rgb), 0.4);
}

.expandEmpty {
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.4);
  margin: 0;
}

/* Empty */
.emptyState {
  padding: 2.5rem 1.5rem;
  text-align: center;
}

.emptyIcon {
  opacity: 0.3;
  margin-bottom: 0.75rem;
}

.emptyTitle {
  font-family: var(--font);
  font-weight: 600;
  font-size: 1rem;
  color: rgba(var(--ink-rgb), 0.8);
  margin: 0 0 0.25rem;
}

.emptyText {
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.4);
  margin: 0 auto;
  max-width: 280px;
}

/* Activity */
.activityPanel {
  padding: 1.25rem;
  border-radius: 18px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: linear-gradient(160deg, rgba(var(--color-bg-rgb), 0.65) 0%, rgba(var(--color-bg-rgb), 0.4) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 28px rgba(var(--shadow-rgb), 0.2), inset 0 1px 0 rgba(var(--ink-rgb), 0.04);
  margin-bottom: 1rem;
}

.activityList {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 1rem;
}

.activityItem {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.04);
}

.activityItem:last-child {
  border-bottom: none;
}

.activityDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 0.35rem;
  flex-shrink: 0;
}

.activityDot--school_created {
  background: rgba(0, 168, 232, 0.8);
  box-shadow: 0 0 6px rgba(0, 168, 232, 0.4);
}

.activityDot--member_joined {
  background: rgba(26, 147, 111, 0.8);
  box-shadow: 0 0 6px rgba(26, 147, 111, 0.4);
}

.activityDot--class_created {
  background: rgba(168, 51, 185, 0.8);
  box-shadow: 0 0 6px rgba(168, 51, 185, 0.4);
}

.activityDot--class_deleted {
  background: rgba(197, 40, 61, 0.85);
  box-shadow: 0 0 6px rgba(197, 40, 61, 0.45);
}

.activityDot--member_removed {
  background: rgba(247, 183, 7, 0.85);
  box-shadow: 0 0 6px rgba(247, 183, 7, 0.45);
}

.activityBody {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.activityLabel {
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.8);
  line-height: 1.35;
}

.activityDate {
  font-family: var(--font);
  font-size: 0.72rem;
  color: rgba(var(--ink-rgb), 0.35);
}

/* Glass inputs */
.glassField :deep(.v-field) {
  border-radius: 10px !important;
  background: rgba(var(--ink-rgb), 0.04) !important;
}

.glassField :deep(.v-field__outline) {
  --v-field-border-opacity: 0.15;
}

.glassField :deep(.v-label),
.glassField :deep(input),
.glassField :deep(.v-select__selection-text) {
  font-family: var(--font);
}

:global(:root[data-theme='light']) .adminHeader,
:global(:root[data-theme='light']) .tableHead {
  border-bottom-color: rgba(13, 37, 48, 0.14);
}

:global(:root[data-theme='light']) .adminEyebrow,
:global(:root[data-theme='light']) .kpiLabel,
:global(:root[data-theme='light']) .sectionDesc,
:global(:root[data-theme='light']) .activityDate {
  color: rgba(13, 37, 48, 0.6);
}

:global(:root[data-theme='light']) .adminSubtitle,
:global(:root[data-theme='light']) .actionDesc,
:global(:root[data-theme='light']) .activityLabel,
:global(:root[data-theme='light']) .tableBadge {
  color: rgba(13, 37, 48, 0.72);
}

:global(:root[data-theme='light']) .kpiCard,
:global(:root[data-theme='light']) .chartPanel,
:global(:root[data-theme='light']) .actionCard,
:global(:root[data-theme='light']) .tablePanel,
:global(:root[data-theme='light']) .activityPanel {
  border-color: rgba(13, 37, 48, 0.14);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 6px 22px rgba(13, 37, 48, 0.08);
}

:global(:root[data-theme='light']) .dataTable thead th {
  color: rgba(13, 37, 48, 0.7);
  background: rgba(13, 37, 48, 0.06);
  border-bottom-color: rgba(13, 37, 48, 0.12);
}

:global(:root[data-theme='light']) .dataTable tbody td {
  color: rgba(13, 37, 48, 0.88);
  border-bottom-color: rgba(13, 37, 48, 0.1);
}

:global(:root[data-theme='light']) .schoolRow:hover td {
  background: rgba(13, 37, 48, 0.05);
}

:global(:root[data-theme='light']) .expandRow td {
  background: rgba(13, 37, 48, 0.04) !important;
  border-bottom-color: rgba(13, 37, 48, 0.12) !important;
}

:global(:root[data-theme='light']) .glassField :deep(.v-field) {
  background: rgba(13, 37, 48, 0.05) !important;
}
</style>
