<template>
  <div class="container saPage">
    <div class="saShell">
      <SchoolAdminNav />

      <header class="saHeader">
        <div class="saHeaderLeft">
          <p class="saEyebrow">School administration</p>
          <h1 class="saTitle">
            Teacher <span class="titleAccent">onboarding</span>
          </h1>
          <p v-if="selectedSchoolName" class="saSubtitle">{{ selectedSchoolName }}</p>
        </div>
        <div v-if="schoolOptions.length > 1" class="headerControls">
          <v-select v-model="selectedSchoolId" :items="schoolOptions" item-title="schoolName" item-value="schoolId"
            density="compact" hide-details variant="outlined" class="glassField schoolPicker" label="School"
            :menu-props="{ contentClass: 'dashboardSelectMenu' }" @update:model-value="onSchoolChange" />
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

      <v-alert v-if="showWelcomeBanner" type="info" variant="tonal" class="saAlert welcomeAlert" rounded="lg" closable
        @click:close="dismissWelcomeBanner">
        <div class="welcomeAlertBody">
          <p class="welcomeAlertTitle">Welcome to {{ selectedSchoolName }}!</p>
          <p class="welcomeAlertText">
            Invite your teachers to get started. Share the link below — they'll sign in and create their first class.
          </p>
          <v-btn size="small" class="welcomeAlertBtn" @click="scrollToInviteSection">Generate invite link</v-btn>
        </div>
      </v-alert>

      <div v-if="loading && !teachers.length && selectedSchoolId" class="loadingWrap">
        <v-progress-circular indeterminate color="primary" size="48" width="4" />
      </div>

      <template v-if="selectedSchoolId">
        <section class="checklistPanel">
          <h2 class="checklistTitle">Onboarding checklist</h2>
          <div class="checklistItems">
            <div class="checklistItem" :class="{ 'checklistItem--done': teacherCount > 0 }">
              <v-icon size="18">{{ teacherCount > 0 ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
              <span>{{ teacherCount > 0
                ? `${teacherCount} teacher${teacherCount === 1 ? '' : 's'} joined`
                : 'Invite teachers to join' }}</span>
            </div>
            <div class="checklistItem" :class="{ 'checklistItem--done': hasActiveTeachers }">
              <v-icon size="18">{{ hasActiveTeachers ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
              <span>{{ hasActiveTeachers
                ? 'Teachers have created classes'
                : 'Teachers create their first class' }}</span>
            </div>
          </div>
        </section>

        <section ref="inviteSectionRef" class="actionCard">
          <div class="actionHeader">
            <v-icon size="22" color="var(--amethyst)">mdi-link-variant</v-icon>
            <h2 class="actionTitle">Teacher invite link</h2>
          </div>
          <p class="actionDesc">
            Share this link with teachers. They must sign in with their Apple on the Desk account before joining.
          </p>
          <div class="inviteRow">
            <v-btn class="inviteBtn" size="small" :loading="generatingLink" prepend-icon="mdi-link-variant"
              @click="generateTeacherLink">
              Generate invite link
            </v-btn>
            <div v-if="teacherInviteUrl" class="linkCopy">
              <code class="linkText">{{ teacherInviteUrl }}</code>
              <v-btn icon="mdi-content-copy" size="x-small" variant="text" @click="copyLink(teacherInviteUrl)" />
            </div>
          </div>
        </section>

        <section class="actionCard">
          <div class="actionHeader">
            <v-icon size="22" color="var(--seaGreen)">mdi-account-plus-outline</v-icon>
            <h2 class="actionTitle">Add teacher directly</h2>
          </div>
          <p class="actionDesc">Search for an existing account and assign them as a teacher at this school.</p>
          <div class="actionFields">
            <v-autocomplete v-model="memberUserId" v-model:search="memberSearchQuery" :items="memberSearchResults"
              item-title="label" item-value="userId" placeholder="Search by name, email, or UID" density="compact"
              hide-details variant="outlined" class="glassField userLookupField" no-filter :loading="memberSearchLoading"
              clearable :menu-props="{ contentClass: 'dashboardSelectMenu' }">
              <template #prepend-inner>
                <v-progress-circular v-if="memberSearchLoading" indeterminate size="16" width="2" color="primary" />
                <v-icon v-else size="16">mdi-account-search-outline</v-icon>
              </template>
              <template #item="{ props, item }">
                <v-list-item v-bind="props" :title="item.raw.name || 'Unnamed user'"
                  :subtitle="item.raw.email || item.raw.userId" />
              </template>
            </v-autocomplete>
            <v-btn class="addBtn" :loading="addingMember" :disabled="!memberUserId" @click="addTeacher">
              Add teacher
            </v-btn>
          </div>
        </section>

        <section class="membersPanel">
          <div class="panelHead">
            <h2 class="sectionTitle">
              <v-icon size="20" class="sectionTitleIcon">mdi-account-school-outline</v-icon>
              Teachers at this school
            </h2>
            <span class="tableBadge">{{ teachers.length }}</span>
          </div>

          <div v-if="loading" class="expandLoading">
            <v-progress-circular indeterminate size="24" width="2" />
          </div>
          <div v-else-if="teachers.length" class="teacherGrid">
            <div v-for="t in teachers" :key="t.userId" class="teacherCard">
              <div class="teacherAvatar">
                <v-icon size="24" color="var(--freshSky)">mdi-account-circle</v-icon>
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
              <v-btn class="removeBtn" variant="text" size="small" icon="mdi-account-remove-outline"
                @click="openRemoveDialog(t)" />
            </div>
          </div>
          <p v-else class="emptyNote">No teachers yet. Generate an invite link or add a teacher directly.</p>
        </section>
      </template>
    </div>

    <v-dialog v-model="removeDialogOpen" max-width="440" persistent>
      <v-card class="dialogCard">
        <v-card-title>Remove teacher?</v-card-title>
        <v-card-text>
          Remove <strong>{{ teacherToRemove?.name || teacherToRemove?.email }}</strong> from this school?
          Their classes at this school will be deleted.
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" :disabled="removing" @click="removeDialogOpen = false">Cancel</v-btn>
          <v-btn color="error" :loading="removing" @click="confirmRemove">Remove</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Server from '@/services/server'
import { useUserProfile } from '@/composables/useUserProfile'
import { useSchoolSetupStatus, clearSchoolSetupStatusCache } from '@/composables/useSchoolSetupStatus'
import SchoolAdminNav from '@/components/admin/SchoolAdminNav.vue'

const route = useRoute()
const router = useRouter()
const { schoolAdminSchools } = useUserProfile()
const schoolOptions = computed(() => schoolAdminSchools.value)

const selectedSchoolId = ref('')
const error = ref('')
const success = ref('')

const setupStatus = useSchoolSetupStatus()
const loading = setupStatus.loading
const teachers = setupStatus.teachers

const teacherInviteUrl = ref('')
const generatingLink = ref(false)
const inviteSectionRef = ref(null)

const cameFromWelcome = ref(false)
const welcomeDismissed = ref(false)
const showWelcomeBanner = computed(() => cameFromWelcome.value && !welcomeDismissed.value)

const memberUserId = ref('')
const memberSearchQuery = ref('')
const memberSearchResults = ref([])
const memberSearchLoading = ref(false)
const addingMember = ref(false)
let memberSearchRequestId = 0

const removeDialogOpen = ref(false)
const teacherToRemove = ref(null)
const removing = ref(false)

const selectedSchoolName = computed(() =>
  schoolOptions.value.find((s) => s.schoolId === selectedSchoolId.value)?.schoolName ?? ''
)

const teacherCount = computed(() => setupStatus.teacherCount.value)
const hasActiveTeachers = computed(() => setupStatus.hasActiveTeachers.value)

function resolveInitialSchoolId() {
  const fromQuery = route.query.schoolId
  if (fromQuery && schoolOptions.value.some((s) => s.schoolId === fromQuery)) {
    return fromQuery
  }
  return schoolOptions.value[0]?.schoolId ?? ''
}

async function loadTeachers() {
  if (!selectedSchoolId.value) return
  error.value = ''
  try {
    await setupStatus.load(selectedSchoolId.value)
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to load teachers'
  }
}

function onSchoolChange() {
  teacherInviteUrl.value = ''
  memberUserId.value = ''
  memberSearchQuery.value = ''
  memberSearchResults.value = []
  loadTeachers()
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

async function addTeacher() {
  if (!selectedSchoolId.value || !memberUserId.value) return
  addingMember.value = true
  error.value = ''
  try {
    await Server.addSchoolMember(selectedSchoolId.value, {
      role: 'teacher',
      userId: memberUserId.value,
    })
    success.value = 'Teacher added to school'
    memberUserId.value = ''
    memberSearchQuery.value = ''
    memberSearchResults.value = []
    clearSchoolSetupStatusCache(selectedSchoolId.value)
    await loadTeachers()
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to add teacher'
  } finally {
    addingMember.value = false
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

function openRemoveDialog(teacher) {
  teacherToRemove.value = teacher
  removeDialogOpen.value = true
}

async function confirmRemove() {
  if (!selectedSchoolId.value || !teacherToRemove.value?.userId) return
  removing.value = true
  error.value = ''
  try {
    const result = await Server.removeSchoolTeacher(selectedSchoolId.value, teacherToRemove.value.userId)
    const deletedClasses = result?.deleted?.classes ?? 0
    success.value = `Teacher removed. Deleted ${deletedClasses} class${deletedClasses === 1 ? '' : 'es'}.`
    removeDialogOpen.value = false
    teacherToRemove.value = null
    clearSchoolSetupStatusCache(selectedSchoolId.value)
    await loadTeachers()
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to remove teacher'
  } finally {
    removing.value = false
  }
}

watch(memberSearchQuery, async (raw) => {
  const q = raw?.trim() || ''
  if (!selectedSchoolId.value || q.length < 2) {
    memberSearchResults.value = []
    memberSearchLoading.value = false
    return
  }
  const requestId = ++memberSearchRequestId
  memberSearchLoading.value = true
  try {
    const data = await Server.searchSchoolUsers(selectedSchoolId.value, q)
    if (requestId !== memberSearchRequestId) return
    memberSearchResults.value = (data.users || []).map((u) => ({
      ...u,
      label: `${u.name || 'Unnamed user'} - ${u.email || u.userId}`,
    }))
  } catch (e) {
    if (requestId !== memberSearchRequestId) return
    error.value = e.response?.data?.message || e.message || 'Failed to search users'
  } finally {
    if (requestId === memberSearchRequestId) memberSearchLoading.value = false
  }
})

watch(
  schoolOptions,
  (opts) => {
    if (!opts?.length) return
    const next = resolveInitialSchoolId()
    if (next && next !== selectedSchoolId.value) {
      selectedSchoolId.value = next
      loadTeachers()
    }
  },
  { immediate: true }
)

watch(
  () => route.query.schoolId,
  (schoolId) => {
    if (schoolId && schoolOptions.value.some((s) => s.schoolId === schoolId)) {
      selectedSchoolId.value = schoolId
      loadTeachers()
    }
  }
)

onMounted(() => {
  if (route.query.welcome === '1') {
    cameFromWelcome.value = true
    const schoolId = typeof route.query.schoolId === 'string' ? route.query.schoolId : selectedSchoolId.value
    router.replace({
      path: '/SchoolAdminOnboarding',
      query: schoolId ? { schoolId } : {},
    })
  }
})

watch(
  [selectedSchoolId, cameFromWelcome],
  async ([sid, welcome]) => {
    if (!sid) return
    await loadTeachers()
    if (welcome && !teacherInviteUrl.value && !generatingLink.value) {
      await generateTeacherLink()
    }
  },
  { immediate: true }
)

function dismissWelcomeBanner() {
  welcomeDismissed.value = true
}

function scrollToInviteSection() {
  inviteSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (!teacherInviteUrl.value) generateTeacherLink()
}
</script>

<style scoped>
.saPage { align-items: flex-start; padding-top: 1rem; padding-bottom: 3rem; }
.saShell { width: 100%; max-width: 900px; margin: 0 auto; padding: 0 1rem 2rem; }
@media (min-width: 768px) { .saShell { padding: 0 1.5rem 3rem; } }

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
  color: var(--white);
  margin: 0;
}

.saSubtitle {
  font-family: var(--font);
  font-size: 0.9rem;
  color: rgba(var(--ink-rgb), 0.5);
  margin: 0.5rem 0 0;
}

.schoolPicker { min-width: 220px; max-width: 300px; }
.saAlert { margin-bottom: 1rem; font-family: var(--font); }
.loadingWrap { display: flex; justify-content: center; padding: 3rem; }

.welcomeAlertBody {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.welcomeAlertTitle {
  margin: 0;
  font-weight: 600;
  font-size: 1.05rem;
  font-family: var(--font);
}

.welcomeAlertText {
  margin: 0;
  font-family: var(--font);
  opacity: 0.85;
}

.welcomeAlertBtn {
  align-self: flex-start;
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}

.checklistPanel,
.actionCard,
.membersPanel {
  padding: 1.25rem;
  border-radius: 18px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: linear-gradient(160deg, rgba(var(--color-bg-rgb), 0.65) 0%, rgba(var(--color-bg-rgb), 0.4) 100%);
  margin-bottom: 1rem;
}

.checklistTitle {
  font-family: var(--font);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--white);
  margin: 0 0 0.75rem;
}

.checklistItems { display: flex; flex-direction: column; gap: 0.5rem; }

.checklistItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.55);
}

.checklistItem--done { color: rgba(26, 147, 111, 0.95); }

.actionHeader { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; }
.actionTitle { font-family: var(--font); font-size: 1rem; font-weight: 600; color: var(--white); margin: 0; }
.actionDesc { font-family: var(--font); font-size: 0.82rem; color: rgba(var(--ink-rgb), 0.45); margin: 0 0 1rem; }

.inviteRow { display: flex; flex-direction: column; gap: 0.75rem; }
.inviteBtn { text-transform: none !important; font-family: var(--font) !important; font-weight: 600 !important; align-self: flex-start; }

.linkCopy {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  background: rgba(var(--ink-rgb), 0.05);
  border: 1px solid rgba(var(--ink-rgb), 0.08);
}

.linkText {
  font-family: monospace;
  font-size: 0.75rem;
  color: rgba(var(--ink-rgb), 0.75);
  word-break: break-all;
  flex: 1;
}

.actionFields { display: flex; flex-direction: column; gap: 0.75rem; }
.userLookupField { width: 100%; }
.addBtn { align-self: flex-start; text-transform: none !important; font-family: var(--font) !important; font-weight: 600 !important; }

.panelHead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.sectionTitle { display: flex; align-items: center; gap: 0.4rem; font-family: var(--font); font-size: 1rem; font-weight: 600; color: var(--white); margin: 0; }
.sectionTitleIcon { opacity: 0.7; }
.tableBadge {
  font-family: var(--font);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: rgba(var(--ink-rgb), 0.08);
  color: rgba(var(--ink-rgb), 0.6);
}

.teacherGrid { display: flex; flex-direction: column; gap: 0.65rem; }

.teacherCard {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(var(--ink-rgb), 0.08);
  background: rgba(var(--ink-rgb), 0.03);
}

.teacherInfo { display: flex; flex-direction: column; min-width: 0; }
.teacherName { font-family: var(--font); font-weight: 600; color: rgba(var(--ink-rgb), 0.9); }
.teacherEmail { font-family: var(--font); font-size: 0.78rem; color: rgba(var(--ink-rgb), 0.45); overflow: hidden; text-overflow: ellipsis; }
.teacherStats { display: flex; gap: 0.75rem; }
.teacherStat { display: flex; flex-direction: column; align-items: center; }
.statValue { font-family: var(--font); font-weight: 700; color: var(--white); font-size: 0.95rem; }
.statLabel { font-family: var(--font); font-size: 0.65rem; color: rgba(var(--ink-rgb), 0.4); text-transform: uppercase; }
.emptyNote { font-family: var(--font); font-size: 0.85rem; color: rgba(var(--ink-rgb), 0.45); margin: 0; }
.expandLoading { display: flex; justify-content: center; padding: 1.5rem; }

.dialogCard { font-family: var(--font); }
.glassField :deep(.v-field) { border-radius: 10px !important; background: rgba(var(--ink-rgb), 0.04) !important; }
</style>
