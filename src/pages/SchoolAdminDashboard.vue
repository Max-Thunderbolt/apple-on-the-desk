<template>
  <div class="container saPage">
    <div class="saShell">
      <header class="saHeader">
        <div class="saHeaderLeft">
          <p class="saEyebrow">School administration</p>
          <h1 class="saTitle">
            School <span class="titleAccent">dashboard</span>
          </h1>
        </div>
        <div class="headerControls">

          <div class="termRow">
            <v-select v-model="selectedSchoolId" :items="schoolOptions" item-title="schoolName" item-value="schoolId"
              density="compact" hide-details variant="outlined" class="glassField schoolPicker"
              :menu-props="{ contentClass: 'dashboardSelectMenu' }" @update:model-value="loadDashboard" />
            <!-- <v-select v-model="term" :items="termItems" density="compact" hide-details variant="outlined"
              class="glassField termField" :menu-props="{ contentClass: 'dashboardSelectMenu' }" />
            <v-text-field v-model.number="year" type="number" density="compact" hide-details variant="outlined"
              class="glassField yearField" /> -->
            <v-btn class="refreshBtn" size="small" :loading="loading" icon="mdi-refresh" variant="flat"
              @click="loadDashboard" />
          </div>
        </div>
      </header>

      <v-alert v-if="error" type="error" variant="tonal" class="saAlert" rounded="lg" closable
        @click:close="error = ''">
        {{ error }}
      </v-alert>
      <v-alert v-if="success" type="success" variant="tonal" class="saAlert" rounded="lg" closable
        @click:close="success = ''">
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
            <v-btn class="inviteBtn" size="small" :loading="generatingLink" prepend-icon="mdi-link-variant"
              @click="generateTeacherLink">
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
              <v-btn class="removeTeacherBtn" variant="text" size="small" icon="mdi-account-remove-outline"
                @click="openRemoveTeacherDialog(t)" />
            </div>
          </div>
          <p v-else class="emptyNote">No teachers have joined yet. Share the invite link above.</p>
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

          <div v-if="dash.classes?.length" class="classTeacherGroups">
            <div v-for="group in classesByTeacher" :key="group.teacherUserId" class="classTeacherGroup">
              <div class="classTeacherGroupHeader">
                <div class="classTeacherIdentity">
                  <span class="classTeacherName">{{ group.teacherName }}</span>
                  <span class="classTeacherEmail">{{ group.teacherEmail }}</span>
                </div>
                <span class="classTeacherCount">{{ group.classes.length }} classes</span>
              </div>

              <div v-if="group.classes.length" class="classGrid">
                <div v-for="c in group.classes" :key="c.id" class="classCard" @click="viewClassStudents(c)"
                  @contextmenu.prevent="openClassContextMenu($event, c)">
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
              <p v-else class="emptyNote">No classes for this teacher yet.</p>
            </div>
          </div>
          <p v-else class="emptyNote">No classes created yet. Teachers can create classes once they join.</p>
          <AppContextMenu :open="isClassContextMenuOpen" :x="classContextMenuX" :y="classContextMenuY"
            :items="classContextMenuItems" @close="closeClassContextMenu" @select="handleClassContextAction" />
        </section>

        <v-dialog v-model="classStudentsDialog" max-width="560" persistent>
          <v-card class="classActionModalCard">
            <v-card-title class="classActionTitle">
              Students - {{ classStudentsData?.name || 'Class' }}
            </v-card-title>
            <v-card-text>
              <div v-if="classActionLoading" class="classActionLoading">
                <v-progress-circular indeterminate color="primary" size="28" width="3" />
              </div>
              <div v-else-if="classStudentsData?.students?.length" class="studentList">
                <div v-for="s in classStudentsData.students" :key="s.id" class="studentRow">
                  <span class="studentName">{{ s.name || 'Unnamed student' }}</span>
                  <span class="studentPts">{{ s.points ?? 0 }} pts</span>
                </div>
              </div>
              <p v-else class="emptyNote">This class has no students yet.</p>
            </v-card-text>
            <v-card-actions class="classActionButtons">
              <v-btn variant="text" @click="classStudentsDialog = false">Close</v-btn>
              <v-btn class="editClassBtn" @click="openEditFromStudents">Edit class</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog v-model="classEditDialog" max-width="620" persistent>
          <v-card class="classActionModalCard">
            <ClassForm v-if="classToEdit" :class-data="classToEdit" @saved="onClassSaved"
              @cancel="closeClassEditModal" />
          </v-card>
        </v-dialog>

        <v-dialog v-model="removeTeacherDialogOpen" max-width="460" persistent>
          <v-card class="classActionModalCard">
            <v-card-title class="classActionTitle">Remove teacher?</v-card-title>
            <v-card-text class="removeTeacherText">
              This will remove
              <strong>{{ teacherToRemove?.name || teacherToRemove?.email || teacherToRemove?.userId || 'this teacher' }}</strong>
              from the school and permanently delete all of their classes in this school. This cannot be undone.
            </v-card-text>
            <v-card-actions class="classActionButtons">
              <v-btn variant="text" :disabled="removingTeacher" @click="removeTeacherDialogOpen = false">Cancel</v-btn>
              <v-btn color="error" :loading="removingTeacher" @click="confirmRemoveTeacher">Remove teacher</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

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
import { useContextMenu } from '@/composables/useContextMenu'
import Server from '@/services/server'
import ClassForm from '@/components/modals/ClassForm.vue'
import AppContextMenu from '@/components/common/AppContextMenu.vue'

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
const classContextMenu = useContextMenu()
const classActionLoading = ref(false)
const classStudentsDialog = ref(false)
const classStudentsData = ref(null)
const classEditDialog = ref(false)
const classToEdit = ref(null)
const removeTeacherDialogOpen = ref(false)
const teacherToRemove = ref(null)
const removingTeacher = ref(false)

const isClassContextMenuOpen = computed(() => classContextMenu.isOpen.value)
const classContextMenuX = computed(() => classContextMenu.x.value)
const classContextMenuY = computed(() => classContextMenu.y.value)
const classContextMenuTarget = computed(() => classContextMenu.target.value)

const classContextMenuItems = computed(() => ([
  { key: 'edit-class', label: 'Edit class', icon: 'mdi-pencil', disabled: classActionLoading.value },
  { key: 'delete-class', label: 'Delete class', icon: 'mdi-delete', danger: true, disabled: classActionLoading.value },
]))

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

const classesByTeacher = computed(() => {
  const teachers = dash.value?.teachers || []
  const classes = dash.value?.classes || []
  const groups = teachers.map((teacher) => {
    const teacherClasses = classes.filter((c) => c.teacherUserId === teacher.userId)
    return {
      teacherUserId: teacher.userId,
      teacherName: teacher.name || 'Unnamed teacher',
      teacherEmail: teacher.email || teacher.userId,
      classes: teacherClasses,
    }
  })

  const assignedTeacherIds = new Set(teachers.map((t) => t.userId))
  const unassignedClasses = classes.filter((c) => !assignedTeacherIds.has(c.teacherUserId))
  if (unassignedClasses.length) {
    groups.push({
      teacherUserId: 'unknown-teacher',
      teacherName: 'Unknown teacher',
      teacherEmail: 'Not currently linked to school membership',
      classes: unassignedClasses,
    })
  }
  return groups
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

function openRemoveTeacherDialog(teacher) {
  teacherToRemove.value = teacher
  removeTeacherDialogOpen.value = true
}

async function confirmRemoveTeacher() {
  if (!selectedSchoolId.value || !teacherToRemove.value?.userId) return
  removingTeacher.value = true
  error.value = ''
  try {
    const result = await Server.removeSchoolTeacher(selectedSchoolId.value, teacherToRemove.value.userId)
    const deletedClasses = result?.deleted?.classes ?? 0
    success.value = `Teacher removed. Deleted ${deletedClasses} class${deletedClasses === 1 ? '' : 'es'}.`
    removeTeacherDialogOpen.value = false
    teacherToRemove.value = null
    await loadDashboard()
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to remove teacher'
  } finally {
    removingTeacher.value = false
  }
}

function openClassContextMenu(e, classSummary) {
  classContextMenu.open(e, classSummary)
}

function closeClassContextMenu() {
  classContextMenu.close()
}

function handleClassContextAction(actionKey) {
  if (actionKey === 'edit-class') {
    openClassEditModal()
    return
  }
  if (actionKey === 'delete-class') {
    deleteSelectedClass()
  }
}

async function loadClassDetails(classId) {
  classActionLoading.value = true
  try {
    const response = await Server.getClassById(classId)
    return response.class || null
  } finally {
    classActionLoading.value = false
  }
}

function resolveClassId(classSummary) {
  const rawId = classSummary?.id ?? classSummary?._id
  if (rawId == null) return ''
  return String(rawId)
}

async function viewClassStudents(classSummary = null) {
  const classId = resolveClassId(classSummary ?? classContextMenuTarget.value)
  if (!classId) return
  error.value = ''
  try {
    const classDoc = await loadClassDetails(classId)
    classStudentsData.value = classDoc
    classStudentsDialog.value = true
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to load class students'
  } finally {
    if (!classSummary) closeClassContextMenu()
  }
}

async function openClassEditModal() {
  const classId = resolveClassId(classContextMenuTarget.value)
  if (!classId) return
  error.value = ''
  try {
    const classDoc = await loadClassDetails(classId)
    classToEdit.value = classDoc
    classEditDialog.value = true
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to load class for editing'
  } finally {
    closeClassContextMenu()
  }
}

async function deleteSelectedClass() {
  const classId = resolveClassId(classContextMenuTarget.value)
  if (!classId) return
  if (!window.confirm('Delete this class? This action cannot be undone.')) return

  error.value = ''
  classActionLoading.value = true
  try {
    await Server.deleteClass(classId)
    success.value = 'Class deleted successfully'
    await loadDashboard()
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to delete class'
  } finally {
    classActionLoading.value = false
    closeClassContextMenu()
  }
}

function closeClassEditModal() {
  classEditDialog.value = false
  classToEdit.value = null
}

function openEditFromStudents() {
  if (!classStudentsData.value) return
  classToEdit.value = classStudentsData.value
  classStudentsDialog.value = false
  classEditDialog.value = true
}

async function onClassSaved() {
  success.value = 'Class updated successfully'
  closeClassEditModal()
  await loadDashboard()
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

watch(selectedSchoolId, () => {
  teacherInviteUrl.value = ''
  closeClassContextMenu()
  classStudentsDialog.value = false
  closeClassEditModal()
  classStudentsData.value = null
  removeTeacherDialogOpen.value = false
  teacherToRemove.value = null
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
  .saShell {
    padding: 0 1.5rem 3rem;
  }
}

.saBreadcrumbs :deep(.v-breadcrumbs-item) {
  font-size: 0.8125rem;
  font-weight: 500;
  opacity: 0.85;
}

.crumbIcon {
  opacity: 0.5;
}

/* Header */
.saHeader {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.saEyebrow {
  font-family: var(--font);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
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

.schoolPicker {
  min-width: 220px;
  max-width: 300px;
}

.termRow {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.termField {
  max-width: 150px;
}

.yearField {
  max-width: 85px;
}

.refreshBtn {
  background: rgba(0, 168, 232, 0.2) !important;
  border: 1px solid rgba(0, 168, 232, 0.3) !important;
  color: var(--white) !important;
}

.saAlert {
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
    grid-template-columns: repeat(4, 1fr);
  }
}

.kpiCard {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: border-color 0.2s, transform 0.2s;
}

@media (hover: hover) {
  .kpiCard:hover {
    border-color: rgba(255, 255, 255, 0.18);
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
  color: rgba(255, 255, 255, 0.4);
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
  font-size: 1.15rem;
}

.kpiMeta {
  font-family: var(--font);
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 0.1rem;
}

/* Charts */
.chartsRow {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

@media (min-width: 768px) {
  .chartsRow {
    grid-template-columns: 1fr 1fr;
  }
}

.chartPanel {
  padding: 1.25rem;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(160deg, rgba(0, 23, 31, 0.65) 0%, rgba(0, 23, 31, 0.4) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.chartTitle {
  font-family: var(--font);
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
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

.chartEmpty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-family: var(--font);
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.9rem;
}

/* Section panels */
.sectionPanel {
  padding: 1.25rem;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(160deg, rgba(0, 23, 31, 0.65) 0%, rgba(0, 23, 31, 0.4) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.04);
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

.sectionTitleIcon {
  opacity: 0.5;
}

.sectionDesc {
  font-family: var(--font);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

.sectionBadge {
  font-family: var(--font);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  background: rgba(168, 51, 185, 0.06);
  border: 1px solid rgba(168, 51, 185, 0.15);
}


.inviteBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  border-radius: 10px !important;
  background: linear-gradient(135deg, rgba(168, 51, 185, 0.35) 0%, rgba(168, 51, 185, 0.15) 100%) !important;
  border: 1px solid rgba(168, 51, 185, 0.3) !important;
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
  color: rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.04);
  padding: 0.3rem 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
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

@media (min-width: 640px) {
  .teacherGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 960px) {
  .teacherGrid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.teacherCard {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  transition: border-color 0.2s, background 0.2s;
}

@media (hover: hover) {
  .teacherCard:hover {
    border-color: rgba(0, 168, 232, 0.25);
    background: rgba(0, 168, 232, 0.04);
  }
}

.teacherAvatar {
  flex-shrink: 0;
}

.teacherInfo {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;
}

.teacherName {
  font-family: var(--font);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--white);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.teacherEmail {
  font-family: var(--font);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.teacherStats {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.removeTeacherBtn {
  color: rgba(255, 255, 255, 0.65) !important;
}

@media (hover: hover) {
  .removeTeacherBtn:hover {
    color: var(--intenseCherry) !important;
    background: rgba(197, 40, 61, 0.15) !important;
  }
}

.teacherStat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem;
}

.statValue {
  font-family: var(--font);
  font-weight: 700;
  font-size: 1rem;
  color: var(--white);
}

.statLabel {
  font-family: var(--font);
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Class grid */
.classTeacherGroups {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.classTeacherGroup {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.02);
}

.classTeacherGroupHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
}

.classTeacherIdentity {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.classTeacherName {
  font-family: var(--font);
  font-weight: 600;
  color: var(--white);
  font-size: 0.9rem;
}

.classTeacherEmail {
  font-family: var(--font);
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.72rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.classTeacherCount {
  font-family: var(--font);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  padding: 0.2rem 0.45rem;
}

.classGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .classGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 960px) {
  .classGrid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.classCard {
  padding: 1rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  transition: border-color 0.2s, background 0.2s;
  cursor: context-menu;
}

@media (hover: hover) {
  .classCard:hover {
    border-color: rgba(26, 147, 111, 0.25);
    background: rgba(26, 147, 111, 0.04);
  }
}

.classCardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.65rem;
}

.className {
  font-family: var(--font);
  font-weight: 600;
  font-size: 1rem;
  color: var(--white);
  margin: 0;
}

.classXP {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font);
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(247, 183, 7, 0.9);
}

.xpIcon {
  color: rgba(247, 183, 7, 0.7);
}

.classMetrics {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.classMetric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem;
}

.metricValue {
  font-family: var(--font);
  font-weight: 700;
  font-size: 1.35rem;
  color: var(--white);
}

.metricLabel {
  font-family: var(--font);
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.classLeaderboard {
  flex: 1;
  min-width: 0;
}

.leaderTitle {
  font-family: var(--font);
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.35);
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
  background: rgba(247, 183, 7, 0.15);
  color: rgba(247, 183, 7, 0.9);
  flex-shrink: 0;
}

.leaderName {
  color: rgba(255, 255, 255, 0.8);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leaderPts {
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.75rem;
  flex-shrink: 0;
}

.classActionModalCard {
  border-radius: 18px !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  background: linear-gradient(160deg, rgba(0, 23, 31, 0.78) 0%, rgba(0, 23, 31, 0.55) 100%) !important;
  backdrop-filter: blur(14px);
}

.classActionTitle {
  font-family: var(--font);
  font-weight: 600;
  color: var(--white);
}

.classActionLoading {
  display: flex;
  justify-content: center;
  padding: 0.9rem;
}

.studentList {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 320px;
  overflow: auto;
}

.studentRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.studentName {
  font-family: var(--font);
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.86rem;
}

.studentPts {
  font-family: var(--font);
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.75rem;
}

.classActionButtons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0 1rem 1rem;
}

.removeTeacherText {
  font-family: var(--font);
  color: rgba(255, 255, 255, 0.85);
}

.editClassBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  border-radius: 10px !important;
  background: linear-gradient(135deg, rgba(26, 147, 111, 0.35) 0%, rgba(26, 147, 111, 0.15) 100%) !important;
  border: 1px solid rgba(26, 147, 111, 0.3) !important;
  color: var(--white) !important;
}

/* Cost bar */
.costBar {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  border: 1px solid rgba(247, 183, 7, 0.15);
  background: rgba(247, 183, 7, 0.04);
  margin-bottom: 1.25rem;
}

.costItem {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.costLabel {
  font-family: var(--font);
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.4);
}

.costValue {
  font-family: var(--font);
  font-weight: 700;
  font-size: 1.15rem;
  color: rgba(247, 183, 7, 0.9);
  font-variant-numeric: tabular-nums;
}

.costValue--small {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.65);
}

.emptyNote {
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

/* Glass inputs */
.glassField :deep(.v-field) {
  border-radius: 10px !important;
  background: rgba(255, 255, 255, 0.04) !important;
}

.glassField :deep(.v-field__outline) {
  --v-field-border-opacity: 0.15;
}

.glassField :deep(.v-label),
.glassField :deep(input),
.glassField :deep(.v-select__selection-text) {
  font-family: var(--font);
}
</style>
