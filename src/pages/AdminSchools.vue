<template>
  <div class="container adminPage">
    <div class="adminShell">
      <AdminNav />

      <header class="adminHeader">
        <div class="adminHeaderLeft">
          <p class="adminEyebrow">Platform administration</p>
          <h1 class="adminTitle">
            Schools &amp; <span class="titleAccent">onboarding</span>
          </h1>
          <p class="adminSubtitle">
            Create schools, assign school admins, and invite teachers to get new schools up and running.
          </p>
        </div>
        <v-btn class="refreshBtn" size="small" :loading="schoolsLoading" icon="mdi-refresh" variant="flat"
          @click="loadSchools" />
      </header>

      <v-alert v-if="loadError" type="error" variant="tonal" class="adminAlert" rounded="lg" closable
        @click:close="loadError = ''">
        {{ loadError }}
      </v-alert>
      <v-alert v-if="successMsg" type="success" variant="tonal" class="adminAlert" rounded="lg" closable
        @click:close="successMsg = ''">
        {{ successMsg }}
      </v-alert>

      <!-- Create school -->
      <section class="createBar">
        <div class="createBarIcon">
          <v-icon size="22" color="var(--freshSky)">mdi-plus-circle-outline</v-icon>
        </div>
        <div class="createBarBody">
          <h2 class="createBarTitle">Create a new school</h2>
          <p class="createBarDesc">Add the school first, then assign a school admin and invite teachers.</p>
        </div>
        <div class="createBarActions">
          <v-text-field v-model="newSchoolName" placeholder="e.g. Riverside Primary" density="compact" hide-details
            variant="outlined" class="glassField createInput" rounded="lg" @keyup.enter="createSchool" />
          <v-btn class="actionBtn actionBtn--create" :loading="creatingSchool" @click="createSchool">
            Create
          </v-btn>
        </div>
      </section>

      <div v-if="schoolsLoading && !schools.length" class="loadingWrap">
        <v-progress-circular indeterminate color="primary" size="48" width="4" />
      </div>

      <div v-else class="schoolLayout">
        <!-- School list -->
        <aside class="schoolListPanel">
          <div class="panelHead">
            <h2 class="sectionTitle">All schools</h2>
            <span class="tableBadge">{{ schools.length }}</span>
          </div>
          <v-text-field v-model="schoolSearch" placeholder="Search schools…" density="compact" hide-details
            variant="outlined" class="glassField searchField" prepend-inner-icon="mdi-magnify" rounded="lg" clearable />

          <div v-if="filteredSchools.length" class="schoolList">
            <button v-for="s in filteredSchools" :key="s.id" type="button" class="schoolListItem"
              :class="{ 'schoolListItem--active': selectedSchoolId === s.id }" @click="selectSchool(s.id)">
              <span class="schoolListName">{{ s.name }}</span>
              <span class="schoolListMeta">{{ s.id.slice(0, 8) }}…</span>
            </button>
          </div>
          <div v-else class="emptyState emptyState--compact">
            <v-icon size="36" class="emptyIcon">mdi-school-outline</v-icon>
            <p class="emptyTitle">No schools yet</p>
            <p class="emptyText">Create your first school above to begin onboarding.</p>
          </div>
        </aside>

        <!-- Selected school detail -->
        <main v-if="selectedSchool" class="schoolDetailPanel">
          <div class="detailHeader">
            <div>
              <h2 class="detailTitle">{{ selectedSchool.name }}</h2>
              <p class="detailId">{{ selectedSchool.id }}</p>
            </div>
            <v-btn class="deleteSchoolBtn" variant="outlined" size="small" color="error" prepend-icon="mdi-delete-outline"
              @click="openDeleteDialog">
              Delete school
            </v-btn>
          </div>

          <!-- Onboarding checklist -->
          <section class="checklistPanel">
            <h3 class="checklistTitle">Onboarding checklist</h3>
            <div class="checklistItems">
              <div class="checklistItem" :class="{ 'checklistItem--done': hasSchoolAdmin }">
                <v-icon size="18">{{ hasSchoolAdmin ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                <span>School admin assigned</span>
              </div>
              <div class="checklistItem" :class="{ 'checklistItem--done': teacherCount > 0 }">
                <v-icon size="18">{{ teacherCount > 0 ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                <span>{{ teacherCount > 0 ? `${teacherCount} teacher${teacherCount === 1 ? '' : 's'} joined` : 'Teachers invited' }}</span>
              </div>
            </div>
          </section>

          <!-- Invite links -->
          <section class="actionCard">
            <div class="actionHeader">
              <v-icon size="22" color="var(--amethyst)">mdi-link-variant</v-icon>
              <h3 class="actionTitle">Invite links</h3>
            </div>
            <p class="actionDesc">Share these links with people who need to join this school. They must sign in first.</p>
            <div class="inviteLinkGroup">
              <div class="inviteLinkRow">
                <v-btn class="actionBtn actionBtn--invite" size="small" :loading="creatingSchoolAdminJoinCode"
                  prepend-icon="mdi-shield-account" @click="generateJoinCode('schoolAdmin')">
                  School admin link
                </v-btn>
                <div v-if="schoolAdminJoinUrl" class="linkCopy">
                  <code class="linkText">{{ schoolAdminJoinUrl }}</code>
                  <v-btn icon="mdi-content-copy" size="x-small" variant="text" @click="copyLink(schoolAdminJoinUrl)" />
                </div>
              </div>
              <div class="inviteLinkRow">
                <v-btn class="actionBtn actionBtn--invite" size="small" :loading="creatingTeacherJoinCode"
                  prepend-icon="mdi-account-school" @click="generateJoinCode('teacher')">
                  Teacher link
                </v-btn>
                <div v-if="teacherJoinUrl" class="linkCopy">
                  <code class="linkText">{{ teacherJoinUrl }}</code>
                  <v-btn icon="mdi-content-copy" size="x-small" variant="text" @click="copyLink(teacherJoinUrl)" />
                </div>
              </div>
            </div>
          </section>

          <!-- Add member directly -->
          <section class="actionCard">
            <div class="actionHeader">
              <v-icon size="22" color="var(--seaGreen)">mdi-account-plus-outline</v-icon>
              <h3 class="actionTitle">Add member directly</h3>
            </div>
            <p class="actionDesc">Search for an existing account and assign them to this school.</p>
            <div class="actionFields">
              <v-autocomplete v-model="memberUserId" v-model:search="memberSearchQuery" :items="memberSearchResults"
                item-title="label" item-value="userId" placeholder="Search user by name, email, or UID"
                density="compact" hide-details variant="outlined" class="glassField userLookupField" no-filter
                :loading="memberSearchLoading" clearable :menu-props="{ contentClass: 'dashboardSelectMenu' }">
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
          </section>

          <!-- Members -->
          <section class="membersPanel">
            <div class="panelHead">
              <h3 class="sectionTitle">Members</h3>
              <span class="tableBadge">{{ members.length }}</span>
            </div>
            <div v-if="membersLoading" class="expandLoading">
              <v-progress-circular indeterminate size="24" width="2" />
            </div>
            <div v-else-if="members.length" class="memberChips">
              <div v-for="m in members" :key="m.userId" class="memberChip" :class="m.role">
                <v-icon size="14">{{ m.role === 'schoolAdmin' ? 'mdi-shield-account' : 'mdi-account' }}</v-icon>
                <span class="memberName">{{ m.name || m.email || m.userId.slice(0, 8) }}</span>
                <span class="memberRole">{{ m.role === 'schoolAdmin' ? 'Admin' : 'Teacher' }}</span>
                <span v-if="m.role === 'teacher' && m.classCount" class="memberStat">
                  {{ m.classCount }} classes · {{ m.studentCount }} students
                </span>
              </div>
            </div>
            <p v-else class="expandEmpty">No members yet. Add a school admin or share an invite link.</p>
          </section>
        </main>

        <div v-else class="schoolDetailPanel schoolDetailPanel--empty">
          <v-icon size="56" class="emptyIcon">mdi-hand-pointing-left</v-icon>
          <p class="emptyTitle">Select a school</p>
          <p class="emptyText">Choose a school from the list to manage members and onboarding.</p>
        </div>
      </div>

      <v-dialog v-model="deleteDialogOpen" max-width="520" persistent>
        <v-card class="deleteDialogCard">
          <v-card-title class="deleteDialogTitle">Delete school permanently?</v-card-title>
          <v-card-text class="deleteDialogText">
            <p>
              This will permanently delete <strong>{{ selectedSchool?.name }}</strong>, all of its classes and
              student data, invite links, and memberships.
            </p>
            <p>
              Teachers and school admins who belong only to this school will have their accounts deleted, including
              their Firebase login.
            </p>
            <p class="deleteDialogWarn">This action cannot be undone.</p>
            <v-text-field v-model="deleteConfirmName" :label="deleteConfirmLabel"
              density="compact" variant="outlined" class="glassField deleteConfirmField" hide-details autofocus
              @keyup.enter="canConfirmDelete && confirmDeleteSchool()" />
          </v-card-text>
          <v-card-actions class="deleteDialogActions">
            <v-spacer />
            <v-btn variant="text" :disabled="deletingSchool" @click="closeDeleteDialog">Cancel</v-btn>
            <v-btn color="error" :loading="deletingSchool" :disabled="!canConfirmDelete" @click="confirmDeleteSchool">
              Delete everything
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Server from '@/services/server'
import AdminNav from '@/components/admin/AdminNav.vue'

const schools = ref([])
const schoolsLoading = ref(false)
const loadError = ref('')
const successMsg = ref('')

const newSchoolName = ref('')
const creatingSchool = ref(false)

const selectedSchoolId = ref('')
const schoolSearch = ref('')

const members = ref([])
const membersLoading = ref(false)

const memberUserId = ref('')
const memberRole = ref('schoolAdmin')
const addingMember = ref(false)
const memberSearchQuery = ref('')
const memberSearchLoading = ref(false)
const memberSearchResults = ref([])
let memberSearchRequestId = 0

const teacherJoinUrl = ref('')
const schoolAdminJoinUrl = ref('')
const creatingTeacherJoinCode = ref(false)
const creatingSchoolAdminJoinCode = ref(false)

const deleteDialogOpen = ref(false)
const deleteConfirmName = ref('')
const deletingSchool = ref(false)

const roleItems = [
  { title: 'School admin', value: 'schoolAdmin' },
  { title: 'Teacher', value: 'teacher' },
]

const filteredSchools = computed(() => {
  const q = schoolSearch.value?.trim().toLowerCase()
  if (!q) return schools.value
  return schools.value.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
})

const selectedSchool = computed(() =>
  schools.value.find((s) => s.id === selectedSchoolId.value) ?? null
)

const hasSchoolAdmin = computed(() => members.value.some((m) => m.role === 'schoolAdmin'))
const teacherCount = computed(() => members.value.filter((m) => m.role === 'teacher').length)
const canConfirmDelete = computed(() =>
  deleteConfirmName.value.trim() === (selectedSchool.value?.name || '')
)
const deleteConfirmLabel = computed(() =>
  `Type "${selectedSchool.value?.name || ''}" to confirm`
)

async function loadSchools() {
  loadError.value = ''
  schoolsLoading.value = true
  try {
    const data = await Server.listAdminSchools()
    schools.value = data.schools || []
    if (selectedSchoolId.value && !schools.value.some((s) => s.id === selectedSchoolId.value)) {
      selectedSchoolId.value = ''
      members.value = []
    }
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Failed to load schools'
  } finally {
    schoolsLoading.value = false
  }
}

async function loadMembers(schoolId) {
  if (!schoolId) {
    members.value = []
    return
  }
  membersLoading.value = true
  try {
    const data = await Server.getAdminSchoolMembers(schoolId)
    members.value = data.members || []
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Failed to load members'
    members.value = []
  } finally {
    membersLoading.value = false
  }
}

function selectSchool(schoolId) {
  selectedSchoolId.value = schoolId
  teacherJoinUrl.value = ''
  schoolAdminJoinUrl.value = ''
  memberUserId.value = ''
  memberSearchQuery.value = ''
  memberSearchResults.value = []
  loadMembers(schoolId)
}

async function createSchool() {
  const name = newSchoolName.value?.trim()
  if (!name) return
  creatingSchool.value = true
  loadError.value = ''
  try {
    const data = await Server.createAdminSchool({ name })
    newSchoolName.value = ''
    successMsg.value = `School "${name}" created`
    await loadSchools()
    if (data.school?.id) {
      selectSchool(data.school.id)
      memberRole.value = 'schoolAdmin'
    }
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Failed to create school'
  } finally {
    creatingSchool.value = false
  }
}

async function addMember() {
  if (!selectedSchoolId.value) { loadError.value = 'Select a school'; return }
  if (!memberUserId.value) { loadError.value = 'Select a user account'; return }
  addingMember.value = true
  loadError.value = ''
  try {
    await Server.addAdminSchoolMember(selectedSchoolId.value, {
      role: memberRole.value,
      userId: memberUserId.value,
    })
    successMsg.value = `Member added as ${memberRole.value === 'schoolAdmin' ? 'school admin' : 'teacher'}`
    memberUserId.value = ''
    memberSearchQuery.value = ''
    memberSearchResults.value = []
    await loadMembers(selectedSchoolId.value)
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
  if (!selectedSchoolId.value) { loadError.value = 'Select a school first'; return }
  if (role === 'teacher') creatingTeacherJoinCode.value = true
  else creatingSchoolAdminJoinCode.value = true
  loadError.value = ''
  try {
    const result = await Server.createAdminSchoolJoinCode(selectedSchoolId.value, role)
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

function openDeleteDialog() {
  deleteConfirmName.value = ''
  deleteDialogOpen.value = true
}

function closeDeleteDialog() {
  deleteDialogOpen.value = false
  deleteConfirmName.value = ''
}

async function confirmDeleteSchool() {
  if (!selectedSchoolId.value || !canConfirmDelete.value) return
  deletingSchool.value = true
  loadError.value = ''
  try {
    const data = await Server.deleteAdminSchool(selectedSchoolId.value)
    const deleted = data.deleted || {}
    successMsg.value = `"${data.school?.name || 'School'}" deleted (${deleted.classes ?? 0} classes, ${deleted.accounts ?? 0} accounts removed)`
    closeDeleteDialog()
    selectedSchoolId.value = ''
    members.value = []
    teacherJoinUrl.value = ''
    schoolAdminJoinUrl.value = ''
    await loadSchools()
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Failed to delete school'
  } finally {
    deletingSchool.value = false
  }
}

onMounted(loadSchools)
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

.adminAlert {
  margin-bottom: 1rem;
  font-family: var(--font);
}

.loadingWrap,
.expandLoading {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.refreshBtn {
  background: rgba(0, 168, 232, 0.2) !important;
  border: 1px solid rgba(0, 168, 232, 0.3) !important;
  color: var(--white) !important;
}

/* Create bar */
.createBar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
  border-radius: 18px;
  border: 1px solid rgba(0, 168, 232, 0.2);
  background: linear-gradient(135deg, rgba(0, 168, 232, 0.08) 0%, rgba(var(--color-bg-rgb), 0.4) 100%);
  backdrop-filter: blur(14px);
}

.createBarIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(0, 168, 232, 0.12);
  flex-shrink: 0;
}

.createBarBody {
  flex: 1;
  min-width: 180px;
}

.createBarTitle {
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 600;
  color: var(--white);
  margin: 0 0 0.2rem;
}

.createBarDesc {
  font-family: var(--font);
  font-size: 0.8rem;
  color: rgba(var(--ink-rgb), 0.45);
  margin: 0;
}

.createBarActions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
}

@media (min-width: 640px) {
  .createBarActions {
    width: auto;
    min-width: 320px;
  }
}

.createInput {
  flex: 1;
  min-width: 160px;
}

/* Layout */
.schoolLayout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  align-items: start;
}

@media (min-width: 900px) {
  .schoolLayout {
    grid-template-columns: 280px 1fr;
  }
}

.schoolListPanel,
.schoolDetailPanel,
.membersPanel,
.checklistPanel,
.actionCard {
  border-radius: 18px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: linear-gradient(160deg, rgba(var(--color-bg-rgb), 0.65) 0%, rgba(var(--color-bg-rgb), 0.4) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 28px rgba(var(--shadow-rgb), 0.2), inset 0 1px 0 rgba(var(--ink-rgb), 0.04);
}

.schoolListPanel {
  padding: 1rem;
}

.schoolDetailPanel {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.schoolDetailPanel--empty {
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 320px;
  padding: 2.5rem 1.5rem;
}

.panelHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.sectionTitle {
  font-family: var(--font);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--white);
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

.searchField {
  margin-bottom: 0.75rem;
}

.schoolList {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 420px;
  overflow-y: auto;
}

.schoolListItem {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 12px;
  border: 1px solid transparent;
  background: rgba(var(--ink-rgb), 0.03);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
  font-family: var(--font);
}

@media (hover: hover) {
  .schoolListItem:hover {
    background: rgba(var(--ink-rgb), 0.06);
    border-color: rgba(var(--ink-rgb), 0.08);
  }
}

.schoolListItem--active {
  background: rgba(0, 168, 232, 0.1) !important;
  border-color: rgba(0, 168, 232, 0.25) !important;
}

.schoolListName {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--white);
}

.schoolListMeta {
  font-size: 0.65rem;
  font-family: ui-monospace, monospace;
  color: rgba(var(--ink-rgb), 0.35);
}

.detailHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.06);
}

.deleteSchoolBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  flex-shrink: 0;
}

.detailTitle {
  font-family: var(--font);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--white);
  margin: 0;
}

.detailId {
  font-family: ui-monospace, monospace;
  font-size: 0.72rem;
  color: rgba(var(--ink-rgb), 0.35);
  margin: 0.25rem 0 0;
}

/* Checklist */
.checklistPanel {
  padding: 1rem 1.15rem;
}

.checklistTitle {
  font-family: var(--font);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(var(--ink-rgb), 0.5);
  margin: 0 0 0.75rem;
}

.checklistItems {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checklistItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font);
  font-size: 0.88rem;
  color: rgba(var(--ink-rgb), 0.5);
}

.checklistItem--done {
  color: rgba(26, 147, 111, 0.95);
}

/* Action cards */
.actionCard {
  padding: 1.15rem;
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
  max-width: 180px;
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

/* Members */
.membersPanel {
  padding: 1.15rem;
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

.emptyState {
  padding: 2rem 1rem;
  text-align: center;
}

.emptyState--compact {
  padding: 1.5rem 0.5rem;
}

.emptyIcon {
  opacity: 0.3;
  margin-bottom: 0.5rem;
}

.emptyTitle {
  font-family: var(--font);
  font-weight: 600;
  font-size: 0.95rem;
  color: rgba(var(--ink-rgb), 0.8);
  margin: 0 0 0.25rem;
}

.emptyText {
  font-family: var(--font);
  font-size: 0.82rem;
  color: rgba(var(--ink-rgb), 0.4);
  margin: 0 auto;
  max-width: 240px;
}

.deleteDialogCard {
  font-family: var(--font);
}

.deleteDialogTitle {
  font-weight: 600;
}

.deleteDialogText p {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(var(--ink-rgb), 0.75);
}

.deleteDialogWarn {
  color: rgba(197, 40, 61, 0.95) !important;
  font-weight: 600;
}

.deleteConfirmField {
  margin-top: 0.5rem;
}

.deleteDialogActions {
  padding: 0 1rem 1rem;
}
</style>
