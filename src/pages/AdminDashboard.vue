<template>
  <div class="container adminPage">
    <div class="adminShell">
      <AdminNav />

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

        <!-- Usage breakdown -->
        <section v-if="usageSummaryCards.length" class="usagePillRow">
          <button v-for="pill in usageSummaryCards" :key="pill.key" type="button" class="usagePill"
            :class="[pill.cls, { 'usagePill--selected': usageFilter === pill.key }]" @click="setUsageFilter(pill.key)">
            <span class="usagePillCount">{{ pill.count }}</span>
            <span class="usagePillLabel">{{ pill.label }}</span>
            <span class="usagePillDesc">{{ pill.desc }}</span>
          </button>
        </section>

        <!-- Engagement breakdown -->
        <section v-if="engagementSummaryCards.length" class="usagePillRow engagementPillRow">
          <button v-for="pill in engagementSummaryCards" :key="pill.key" type="button" class="usagePill"
            :class="[pill.cls, { 'usagePill--selected': engagementFilter === pill.key }]"
            @click="setEngagementFilter(pill.key)">
            <span class="usagePillCount">{{ pill.count }}</span>
            <span class="usagePillLabel">{{ pill.label }}</span>
            <span class="usagePillDesc">{{ pill.desc }}</span>
          </button>
        </section>

        <!-- School usage tracker -->
        <section class="tablePanel">
          <div class="tableHead">
            <div>
              <h2 class="sectionTitle">
                <v-icon size="20" class="sectionTitleIcon">mdi-radar</v-icon>
                School usage tracker
              </h2>
              <p class="sectionDesc">See which schools are actively using the platform, onboarding, or still awaiting setup.</p>
            </div>
            <div class="tableHeadActions">
              <div class="filterChips">
                <v-btn v-for="f in USAGE_FILTERS" :key="f.value" size="x-small" variant="text" class="filterChip"
                  :class="{ 'filterChip--active': usageFilter === f.value && engagementFilter === 'all' }"
                  @click="setUsageFilter(f.value)">
                  {{ f.label }}
                </v-btn>
                <v-btn v-for="f in ENGAGEMENT_FILTERS" :key="f.value" size="x-small" variant="text"
                  class="filterChip filterChip--engagement"
                  :class="{ 'filterChip--active': engagementFilter === f.value && usageFilter === 'all' }"
                  @click="setEngagementFilter(f.value)">
                  {{ f.label }}
                </v-btn>
              </div>
              <v-btn size="small" variant="tonal" class="manageSchoolsBtn" prepend-icon="mdi-domain" @click="goToSchools">
                Manage schools
              </v-btn>
            </div>
          </div>

          <div v-if="filteredSchools.length" class="tableWrap">
            <table class="dataTable">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Lifecycle</th>
                  <th>Engagement</th>
                  <th class="num">Admins</th>
                  <th class="num">Teachers</th>
                  <th class="num">Classes</th>
                  <th class="num">Students</th>
                  <th>Last class</th>
                  <th>Last login</th>
                  <th class="num">30d events</th>
                  <th class="num">Term cost</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in filteredSchools" :key="row.schoolId" class="usageRow">
                  <td>
                    <div class="schoolNameCell">
                      <div>
                        <span class="schoolName">{{ row.schoolName }}</span>
                        <span class="schoolIdMono">Joined {{ formatDate(row.createdAt) }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="statusBadge" :class="usageStatusMeta(row.usageStatus).cls">
                      <v-icon size="14">{{ usageStatusMeta(row.usageStatus).icon }}</v-icon>
                      {{ usageStatusMeta(row.usageStatus).label }}
                    </span>
                  </td>
                  <td>
                    <span class="statusBadge" :class="engagementStatusMeta(row.engagementStatus).cls">
                      <v-icon size="14">{{ engagementStatusMeta(row.engagementStatus).icon }}</v-icon>
                      {{ engagementStatusMeta(row.engagementStatus).label }}
                    </span>
                  </td>
                  <td class="num">{{ row.schoolAdminCount ?? 0 }}</td>
                  <td class="num">{{ row.teacherCount ?? 0 }}</td>
                  <td class="num">{{ row.classCount ?? 0 }}</td>
                  <td class="num">{{ formatInt(row.studentCount) }}</td>
                  <td class="activityCell">{{ formatDate(row.lastClassActivityAt) }}</td>
                  <td class="activityCell">{{ formatDate(row.lastTeacherLoginAt) }}</td>
                  <td class="num">{{ row.eventsLast30Days ?? 0 }}</td>
                  <td class="num costCell">{{ formatZAR(row.costZAR) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="emptyState">
            <v-icon size="48" class="emptyIcon">mdi-filter-off-outline</v-icon>
            <p class="emptyTitle">No schools in this filter</p>
            <p class="emptyText">Try another usage filter or onboard schools from the Schools page.</p>
          </div>
        </section>

        <!-- Engagement health + platform activity -->
        <section class="chartsRow chartsRow--double">
          <div class="chartPanel chartPanel--doughnut">
            <h2 class="chartTitle">
              <v-icon size="20" class="chartTitleIcon">mdi-heart-pulse</v-icon>
              Engagement health
            </h2>
            <p class="chartSubtitle">School activity in the last 7 / 30 days</p>
            <div class="chartWrap chartWrap--doughnut">
              <Doughnut v-if="engagementDoughnutData" :data="engagementDoughnutData" :options="doughnutOptions" />
              <div v-else class="chartEmpty">No engagement data</div>
            </div>
          </div>
          <div class="chartPanel chartPanel--line">
            <h2 class="chartTitle">
              <v-icon size="20" class="chartTitleIcon">mdi-pulse</v-icon>
              Platform activity — last 12 weeks
            </h2>
            <p class="chartSubtitle">Points, purchases, roster changes, and new classes</p>
            <div class="chartWrap chartWrap--line">
              <Line v-if="platformActivityData" :data="platformActivityData" :options="lineOptions" />
              <div v-else class="chartEmpty">No activity logged yet</div>
            </div>
          </div>
        </section>

        <!-- Charts section -->
        <section class="chartsRow chartsRow--triple">
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
          <div class="chartPanel chartPanel--bar">
            <h2 class="chartTitle">
              <v-icon size="20" class="chartTitleIcon">mdi-google-classroom</v-icon>
              Classes by school
            </h2>
            <div class="chartWrap">
              <Bar v-if="classesBarData" :data="classesBarData" :options="barOptions" />
              <div v-else class="chartEmpty">No classes yet</div>
            </div>
          </div>
          <div class="chartPanel chartPanel--doughnut">
            <h2 class="chartTitle">
              <v-icon size="20" class="chartTitleIcon">mdi-chart-donut</v-icon>
              Usage breakdown
            </h2>
            <div class="chartWrap chartWrap--doughnut">
              <Doughnut v-if="usageDoughnutData" :data="usageDoughnutData" :options="doughnutOptions" />
              <div v-else class="chartEmpty">No usage data</div>
            </div>
          </div>
        </section>

        <section v-if="revenueDoughnutData" class="chartsRow chartsRow--single">
          <div class="chartPanel chartPanel--doughnut chartPanel--wide">
            <h2 class="chartTitle">
              <v-icon size="20" class="chartTitleIcon">mdi-chart-donut</v-icon>
              Revenue distribution
            </h2>
            <div class="chartWrap chartWrap--doughnut chartWrap--wide">
              <Doughnut :data="revenueDoughnutData" :options="doughnutOptions" />
            </div>
          </div>
        </section>

        <!-- Growth trend chart -->
        <section v-if="growthLineData" class="chartPanel chartPanel--full">
          <h2 class="chartTitle">
            <v-icon size="20" class="chartTitleIcon">mdi-trending-up</v-icon>
            Platform growth — last 6 months
          </h2>
          <p class="chartSubtitle">New students use roster addedAt timestamps; classes use createdAt</p>
          <div class="chartWrap chartWrap--line">
            <Line :data="growthLineData" :options="lineOptions" />
          </div>
        </section>

        <!-- Teacher activity -->
        <section v-if="overview.teacherActivity?.length" class="tablePanel">
          <div class="tableHead">
            <div>
              <h2 class="sectionTitle">
                <v-icon size="20" class="sectionTitleIcon">mdi-account-school</v-icon>
                Teacher activity
              </h2>
              <p class="sectionDesc">Teachers sorted by last login — follow up with inactive accounts.</p>
            </div>
          </div>
          <div class="tableWrap">
            <table class="dataTable">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>School</th>
                  <th>Last login</th>
                  <th>Last class activity</th>
                  <th class="num">Classes</th>
                  <th class="num">Students</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in overview.teacherActivity" :key="`${t.userId}-${t.schoolId}`" class="usageRow">
                  <td>{{ t.name || t.email || t.userId.slice(0, 10) }}</td>
                  <td>{{ t.schoolName || '—' }}</td>
                  <td class="activityCell">{{ formatDate(t.lastLoginDate) }}</td>
                  <td class="activityCell">{{ formatDate(t.lastClassActivityAt) }}</td>
                  <td class="num">{{ t.classCount ?? 0 }}</td>
                  <td class="num">{{ t.studentCount ?? 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Recent activity -->
        <section v-if="filteredRecentActivity.length" class="activityPanel">
          <div class="activityPanelHead">
            <h2 class="sectionTitle">
              <v-icon size="20" class="sectionTitleIcon">mdi-history</v-icon>
              Recent activity
            </h2>
            <div class="filterChips">
              <v-btn v-for="f in ACTIVITY_FILTERS" :key="f.value" size="x-small" variant="text" class="filterChip"
                :class="{ 'filterChip--active': activityFilter === f.value }" @click="activityFilter = f.value">
                {{ f.label }}
              </v-btn>
            </div>
          </div>
          <div class="activityList">
            <div v-for="(item, idx) in filteredRecentActivity" :key="idx" class="activityItem">
              <div class="activityDot" :class="'activityDot--' + item.type" />
              <div class="activityBody">
                <span class="activityLabel">{{ item.label }}</span>
                <span v-if="item.schoolName" class="activitySchool">{{ item.schoolName }}</span>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
import AdminNav from '@/components/admin/AdminNav.vue'

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
const usageFilter = ref('all')
const engagementFilter = ref('all')
const activityFilter = ref('all')
const router = useRouter()
const { effectiveTheme } = useTheme()
const isDarkTheme = computed(() => effectiveTheme.value === 'dark')

const termItems = [
  { title: 'T1 · Jan–Apr', value: 1 },
  { title: 'T2 · May–Aug', value: 2 },
  { title: 'T3 · Sep–Dec', value: 3 },
]

const USAGE_FILTERS = [
  { value: 'all', label: 'All schools' },
  { value: 'active', label: 'Active' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'registered', label: 'Registered' },
]

const USAGE_STATUS_META = {
  active: { label: 'Active', icon: 'mdi-check-circle', cls: 'status--active' },
  engaged: { label: 'Engaged', icon: 'mdi-google-classroom', cls: 'status--engaged' },
  onboarding: { label: 'Onboarding', icon: 'mdi-account-clock-outline', cls: 'status--onboarding' },
  registered: { label: 'Registered', icon: 'mdi-domain', cls: 'status--registered' },
}

const ENGAGEMENT_FILTERS = [
  { value: 'all', label: 'All engagement' },
  { value: 'active', label: 'Active (7d)' },
  { value: 'recent', label: 'Recent (30d)' },
  { value: 'dormant', label: 'Dormant' },
  { value: 'never', label: 'Never' },
]

const ENGAGEMENT_STATUS_META = {
  active: { label: 'Active', icon: 'mdi-lightning-bolt', cls: 'engagement--active' },
  recent: { label: 'Recent', icon: 'mdi-clock-outline', cls: 'engagement--recent' },
  dormant: { label: 'Dormant', icon: 'mdi-sleep', cls: 'engagement--dormant' },
  never: { label: 'Never', icon: 'mdi-minus-circle-outline', cls: 'engagement--never' },
}

const ACTIVITY_FILTERS = [
  { value: 'all', label: 'All events' },
  { value: 'points', label: 'Points' },
  { value: 'purchases', label: 'Purchases' },
  { value: 'roster', label: 'Roster' },
]

const ACTIVITY_TYPE_GROUPS = {
  points: ['points_awarded'],
  purchases: ['purchase_completed'],
  roster: ['student_added', 'student_removed'],
}

const kpiCards = computed(() => {
  if (!overview.value) return []
  const t = overview.value.totals
  const u = t.usageSummary || {}
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
      tealBg: 'rgba(0,168,232,0.12)',
      teal: 'rgba(0,168,232,0.9)',
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
      tealBg: 'rgba(0,120,166,0.12)',
      teal: 'rgba(0,120,166,0.92)',
    }
  return [
    { label: 'Active (7d)', value: t.schoolsActiveLast7Days ?? 0, icon: 'mdi-lightning-bolt', iconBg: tone.greenBg, iconColor: tone.green, cls: 'kpiCard--eng7', meta: 'Schools with recent activity' },
    { label: 'Active (30d)', value: t.schoolsActiveLast30Days ?? 0, icon: 'mdi-calendar-check', iconBg: tone.tealBg, iconColor: tone.teal, cls: 'kpiCard--eng30', meta: 'Including recent engagement' },
    { label: 'Dormant', value: t.schoolsDormant ?? 0, icon: 'mdi-sleep', iconBg: tone.redBg, iconColor: tone.red, cls: 'kpiCard--dormant', meta: 'No activity in 30+ days' },
    { label: 'Teachers (7d login)', value: t.teachersActiveLast7Days ?? 0, icon: 'mdi-account-check', iconBg: tone.purpleBg, iconColor: tone.purple, cls: 'kpiCard--teachers7', meta: 'Logged in this week' },
    { label: 'Schools', value: t.schools, icon: 'mdi-domain', iconBg: tone.skyBg, iconColor: tone.sky, cls: 'kpiCard--schools', meta: `${u.active ?? 0} with students` },
    { label: 'Students', value: formatInt(t.students), icon: 'mdi-account-group-outline', iconBg: tone.purpleBg, iconColor: tone.purple, cls: 'kpiCard--students', meta: `${t.schoolsWithStudents ?? 0} schools with students` },
    { label: 'Term revenue', value: formatZAR(t.costZAR), icon: 'mdi-cash-multiple', iconBg: tone.goldBg, iconColor: tone.gold, cls: 'kpiCard--cost', isMoney: true, meta: overview.value.termKey },
    { label: '30d events', value: t.eventsLast30Days ?? 0, icon: 'mdi-pulse', iconBg: tone.goldBg, iconColor: tone.gold, cls: 'kpiCard--events', meta: `${t.pointsEventsLast30Days ?? 0} points · ${t.purchasesLast30Days ?? 0} purchases` },
  ]
})

const usageSummaryCards = computed(() => {
  const u = overview.value?.totals?.usageSummary
  if (!u) return []
  return [
    { key: 'active', label: 'Active', desc: 'Students enrolled', count: u.active ?? 0, cls: 'usagePill--active' },
    { key: 'engaged', label: 'Engaged', desc: 'Classes created', count: u.engaged ?? 0, cls: 'usagePill--engaged' },
    { key: 'onboarding', label: 'Onboarding', desc: 'Members joined', count: u.onboarding ?? 0, cls: 'usagePill--onboarding' },
    { key: 'registered', label: 'Registered', desc: 'Awaiting setup', count: u.registered ?? 0, cls: 'usagePill--registered' },
  ]
})

const engagementSummaryCards = computed(() => {
  const e = overview.value?.totals?.engagementSummary
  if (!e) return []
  return [
    { key: 'active', label: 'Active', desc: 'Activity ≤7 days', count: e.active ?? 0, cls: 'usagePill--engActive' },
    { key: 'recent', label: 'Recent', desc: 'Activity ≤30 days', count: e.recent ?? 0, cls: 'usagePill--engRecent' },
    { key: 'dormant', label: 'Dormant', desc: 'No activity 30+ days', count: e.dormant ?? 0, cls: 'usagePill--engDormant' },
    { key: 'never', label: 'Never', desc: 'No class/login activity', count: e.never ?? 0, cls: 'usagePill--engNever' },
  ]
})

const filteredSchools = computed(() => {
  let schools = overview.value?.schools || []
  if (usageFilter.value !== 'all') {
    schools = schools.filter((s) => s.usageStatus === usageFilter.value)
  }
  if (engagementFilter.value !== 'all') {
    schools = schools.filter((s) => s.engagementStatus === engagementFilter.value)
  }
  return schools
})

const filteredRecentActivity = computed(() => {
  const items = overview.value?.recentActivity || []
  if (activityFilter.value === 'all') return items
  const types = ACTIVITY_TYPE_GROUPS[activityFilter.value] || []
  return items.filter((item) => types.includes(item.type))
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

const engagementDoughnutData = computed(() => {
  const e = overview.value?.totals?.engagementSummary
  if (!e) return null
  const entries = [
    { label: 'Active (7d)', value: e.active ?? 0, color: 'rgba(26, 147, 111, 0.85)' },
    { label: 'Recent (30d)', value: e.recent ?? 0, color: 'rgba(0, 168, 232, 0.85)' },
    { label: 'Dormant', value: e.dormant ?? 0, color: 'rgba(247, 183, 7, 0.85)' },
    { label: 'Never', value: e.never ?? 0, color: 'rgba(148, 163, 184, 0.75)' },
  ].filter((entry) => entry.value > 0)
  if (!entries.length) return null
  return {
    labels: entries.map((entry) => entry.label),
    datasets: [{
      data: entries.map((entry) => entry.value),
      backgroundColor: entries.map((entry) => entry.color),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  }
})

const platformActivityData = computed(() => {
  const weeks = overview.value?.platformActivityByWeek
  if (!weeks?.length) return null
  return {
    labels: weeks.map((w) => w.label),
    datasets: [
      {
        label: 'Points',
        data: weeks.map((w) => w.pointsAwarded ?? 0),
        borderColor: PALETTE[0],
        backgroundColor: 'rgba(0,168,232,0.08)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: 'Purchases',
        data: weeks.map((w) => w.purchases ?? 0),
        borderColor: PALETTE[1],
        backgroundColor: 'transparent',
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: 'Students added',
        data: weeks.map((w) => w.studentsAdded ?? 0),
        borderColor: PALETTE[2],
        backgroundColor: 'transparent',
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: 'Classes created',
        data: weeks.map((w) => w.classesCreated ?? 0),
        borderColor: PALETTE[3],
        backgroundColor: 'transparent',
        tension: 0.35,
        pointRadius: 3,
      },
    ],
  }
})

const usageDoughnutData = computed(() => {
  const u = overview.value?.totals?.usageSummary
  if (!u) return null
  const entries = [
    { label: 'Active', value: u.active ?? 0, color: 'rgba(26, 147, 111, 0.85)' },
    { label: 'Engaged', value: u.engaged ?? 0, color: 'rgba(0, 168, 232, 0.85)' },
    { label: 'Onboarding', value: u.onboarding ?? 0, color: 'rgba(247, 183, 7, 0.85)' },
    { label: 'Registered', value: u.registered ?? 0, color: 'rgba(148, 163, 184, 0.75)' },
  ].filter((e) => e.value > 0)
  if (!entries.length) return null
  return {
    labels: entries.map((e) => e.label),
    datasets: [{
      data: entries.map((e) => e.value),
      backgroundColor: entries.map((e) => e.color),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  }
})

const classesBarData = computed(() => {
  const schools = overview.value?.schools?.filter((s) => s.classCount > 0)
  if (!schools?.length) return null
  return {
    labels: schools.map((s) => s.schoolName),
    datasets: [{
      label: 'Classes',
      data: schools.map((s) => s.classCount),
      backgroundColor: 'rgba(0, 168, 232, 0.75)',
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 48,
    }],
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

function usageStatusMeta(status) {
  return USAGE_STATUS_META[status] || USAGE_STATUS_META.registered
}

function engagementStatusMeta(status) {
  return ENGAGEMENT_STATUS_META[status] || ENGAGEMENT_STATUS_META.never
}

function setUsageFilter(value) {
  usageFilter.value = value
  engagementFilter.value = 'all'
}

function setEngagementFilter(value) {
  engagementFilter.value = value
  usageFilter.value = 'all'
}

function goToSchools() {
  router.push('/AdminSchools')
}

async function loadOverview() {
  loadError.value = ''
  overviewLoading.value = true
  try {
    overview.value = await Server.getAdminOverview({ year: year.value, term: term.value })
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Failed to load overview'
  } finally {
    overviewLoading.value = false
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
  max-width: 1320px;
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
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Usage pills */
.usagePillRow {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

@media (min-width: 768px) {
  .usagePillRow {
    grid-template-columns: repeat(4, 1fr);
  }
}

.usagePill {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: rgba(var(--ink-rgb), 0.03);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, transform 0.15s, background 0.15s;
  font-family: var(--font);
}

@media (hover: hover) {
  .usagePill:hover {
    transform: translateY(-1px);
    border-color: rgba(var(--ink-rgb), 0.18);
  }
}

.usagePill--selected {
  border-color: rgba(0, 168, 232, 0.35) !important;
  background: rgba(0, 168, 232, 0.08) !important;
}

.usagePillCount {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--white);
  line-height: 1;
}

.usagePillLabel {
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(var(--ink-rgb), 0.85);
}

.usagePillDesc {
  font-size: 0.72rem;
  color: rgba(var(--ink-rgb), 0.4);
}

.usagePill--active .usagePillCount { color: rgba(26, 147, 111, 0.95); }
.usagePill--engaged .usagePillCount { color: rgba(0, 168, 232, 0.95); }
.usagePill--onboarding .usagePillCount { color: rgba(247, 183, 7, 0.95); }
.usagePill--registered .usagePillCount { color: rgba(var(--ink-rgb), 0.55); }

.tableHeadActions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.65rem;
}

.filterChips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: flex-end;
}

.filterChip {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-size: 0.72rem !important;
  font-weight: 600 !important;
  color: rgba(var(--ink-rgb), 0.55) !important;
  border-radius: 999px !important;
}

.filterChip--active {
  color: var(--white) !important;
  background: rgba(0, 168, 232, 0.18) !important;
}

.manageSchoolsBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}

.statusBadge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
  font-family: var(--font);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.status--active {
  color: rgba(26, 147, 111, 0.95);
  background: rgba(26, 147, 111, 0.12);
  border: 1px solid rgba(26, 147, 111, 0.25);
}

.status--engaged {
  color: rgba(0, 168, 232, 0.95);
  background: rgba(0, 168, 232, 0.12);
  border: 1px solid rgba(0, 168, 232, 0.25);
}

.status--onboarding {
  color: rgba(247, 183, 7, 0.95);
  background: rgba(247, 183, 7, 0.12);
  border: 1px solid rgba(247, 183, 7, 0.25);
}

.status--registered {
  color: rgba(var(--ink-rgb), 0.55);
  background: rgba(var(--ink-rgb), 0.06);
  border: 1px solid rgba(var(--ink-rgb), 0.12);
}

.engagement--active {
  color: rgba(26, 147, 111, 0.95);
  background: rgba(26, 147, 111, 0.12);
  border: 1px solid rgba(26, 147, 111, 0.25);
}

.engagement--recent {
  color: rgba(0, 168, 232, 0.95);
  background: rgba(0, 168, 232, 0.12);
  border: 1px solid rgba(0, 168, 232, 0.25);
}

.engagement--dormant {
  color: rgba(247, 183, 7, 0.95);
  background: rgba(247, 183, 7, 0.12);
  border: 1px solid rgba(247, 183, 7, 0.25);
}

.engagement--never {
  color: rgba(var(--ink-rgb), 0.55);
  background: rgba(var(--ink-rgb), 0.06);
  border: 1px solid rgba(var(--ink-rgb), 0.12);
}

.usagePill--engActive .usagePillCount { color: rgba(26, 147, 111, 0.95); }
.usagePill--engRecent .usagePillCount { color: rgba(0, 168, 232, 0.95); }
.usagePill--engDormant .usagePillCount { color: rgba(247, 183, 7, 0.95); }
.usagePill--engNever .usagePillCount { color: rgba(var(--ink-rgb), 0.55); }

.engagementPillRow {
  margin-top: -0.25rem;
}

.filterChip--engagement.filterChip--active {
  background: rgba(26, 147, 111, 0.18) !important;
}

.activityCell {
  font-size: 0.82rem;
  color: rgba(var(--ink-rgb), 0.55);
  white-space: nowrap;
}

.usageRow td {
  vertical-align: middle;
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

.chartsRow--triple {
  grid-template-columns: 1fr;
}

@media (min-width: 900px) {
  .chartsRow--triple {
    grid-template-columns: 1.2fr 1.2fr 1fr;
  }
}

.chartsRow--single {
  grid-template-columns: 1fr;
}

.chartsRow--double {
  grid-template-columns: 1fr;
}

@media (min-width: 900px) {
  .chartsRow--double {
    grid-template-columns: 1fr 1.4fr;
  }
}

.chartSubtitle {
  font-family: var(--font);
  font-size: 0.78rem;
  color: rgba(var(--ink-rgb), 0.45);
  margin: -0.35rem 0 0.75rem;
}

.chartWrap--wide {
  height: 240px;
  max-width: 420px;
  margin: 0 auto;
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

.activityPanelHead {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
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

.activityDot--points_awarded {
  background: rgba(247, 183, 7, 0.85);
  box-shadow: 0 0 6px rgba(247, 183, 7, 0.45);
}

.activityDot--purchase_completed {
  background: rgba(168, 51, 185, 0.8);
  box-shadow: 0 0 6px rgba(168, 51, 185, 0.4);
}

.activityDot--student_added,
.activityDot--student_removed {
  background: rgba(0, 168, 232, 0.8);
  box-shadow: 0 0 6px rgba(0, 168, 232, 0.4);
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

.activitySchool {
  font-family: var(--font);
  font-size: 0.72rem;
  color: rgba(var(--ink-rgb), 0.5);
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
