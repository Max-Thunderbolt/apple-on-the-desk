<template>
  <div class="container saPage">
    <div class="saShell">
      <SchoolAdminNav />

      <header class="saHeader">
        <div class="saHeaderLeft">
          <p class="saEyebrow">School administration</p>
          <h1 class="saTitle">
            Student <span class="titleAccent">management</span>
          </h1>
          <p v-if="selectedSchoolLabel" class="saSubtitle">{{ selectedSchoolLabel }}</p>
        </div>
        <div class="headerControls">
          <v-select
            v-if="schoolOptions.length > 1"
            v-model="selectedSchoolId"
            :items="schoolOptions"
            item-title="schoolName"
            item-value="schoolId"
            density="compact"
            hide-details
            variant="outlined"
            class="glassField schoolPicker"
            label="School"
            :menu-props="{ contentClass: 'dashboardSelectMenu' }"
            @update:model-value="onSchoolChange"
          />
          <v-btn
            class="primaryActionBtn"
            size="small"
            prepend-icon="mdi-plus"
            variant="flat"
            @click="openCreateClass"
          >
            Create class
          </v-btn>
        </div>
      </header>

      <v-alert v-if="error" type="error" variant="tonal" class="saAlert" rounded="lg" closable @click:close="error = ''">
        {{ error }}
      </v-alert>
      <v-alert
        v-if="success"
        type="success"
        variant="tonal"
        class="saAlert"
        rounded="lg"
        closable
        @click:close="success = ''"
      >
        {{ success }}
      </v-alert>

      <div v-if="loading && !classes.length" class="loadingWrap">
        <v-progress-circular indeterminate color="primary" size="48" width="4" />
      </div>

      <div v-else class="studentsLayout">
        <aside class="sectionPanel classSidebar">
          <div class="sectionHead">
            <div>
              <h2 class="sectionTitle">
                <v-icon size="20" class="sectionTitleIcon">mdi-google-classroom</v-icon>
                Classes
              </h2>
              <p class="sectionDesc">All classes at this school.</p>
            </div>
            <span class="sectionBadge">{{ classes.length }} classes</span>
          </div>

          <p v-if="!classes.length" class="emptyNote">No classes yet. Create a class to manage students.</p>

          <div v-else class="classList">
            <button
              v-for="c in classes"
              :key="c.id"
              type="button"
              class="classListItem"
              :class="{ 'classListItem--active': selectedClassId === c.id }"
              @click="selectClass(c.id)"
            >
              <span class="classListName">{{ c.name || 'Untitled' }}</span>
              <span class="classListMeta">
                {{ studentCountFor(c) }} students
                <template v-if="teacherLabel(c)"> · {{ teacherLabel(c) }}</template>
              </span>
            </button>
          </div>
        </aside>

        <section class="sectionPanel rosterPanel">
          <template v-if="selectedClass">
            <div class="sectionHead">
              <div>
                <h2 class="sectionTitle">
                  <v-icon size="20" class="sectionTitleIcon">mdi-account-group-outline</v-icon>
                  {{ selectedClass.name || 'Class' }}
                </h2>
                <p class="sectionDesc">Manage the roster for this class.</p>
              </div>
              <div class="sectionHeadActions">
                <v-btn
                  class="secondaryActionBtn"
                  size="small"
                  variant="tonal"
                  prepend-icon="mdi-upload"
                  @click="uploadInput?.click()"
                >
                  Upload list
                </v-btn>
                <input
                  ref="uploadInput"
                  type="file"
                  accept=".txt,.csv,text/plain,text/csv"
                  class="hiddenFile"
                  @change="onFileSelected"
                />
                <v-btn
                  class="secondaryActionBtn"
                  size="small"
                  variant="tonal"
                  prepend-icon="mdi-account-plus"
                  @click="openAddStudent"
                >
                  Add student
                </v-btn>
              </div>
            </div>

            <div class="uploadCard">
              <label class="formLabel">Paste or edit student list (one name per line)</label>
              <textarea
                v-model="rosterText"
                class="formTextarea"
                rows="8"
                placeholder="Alice&#10;Bob&#10;Charlie"
              />
              <div class="uploadActions">
                <v-btn
                  class="primaryActionBtn"
                  size="small"
                  :loading="savingRoster"
                  :disabled="!rosterText.trim()"
                  @click="saveRoster"
                >
                  Sync roster
                </v-btn>
                <span class="hint">Sync replaces the class list with the names above (matched by name to keep points).</span>
              </div>
            </div>

            <div v-if="rosterLoading" class="expandLoading">
              <v-progress-circular indeterminate size="24" width="2" />
            </div>
            <div v-else-if="students.length" class="studentTable">
              <div
                v-for="student in students"
                :key="student.id"
                class="studentRow"
                @contextmenu.prevent="openStudentMenu($event, student)"
              >
                <span class="studentName">{{ student.name }}</span>
                <span class="studentPts">{{ student.points ?? 0 }} pts</span>
              </div>
              <p class="hint">Right-click a student to rename, move, or delete.</p>
            </div>
            <p v-else class="emptyNote">No students in this class yet.</p>
          </template>
          <p v-else class="emptyNote">Select a class to manage its students.</p>
        </section>
      </div>
    </div>

    <AppContextMenu
      :open="isContextMenuOpen"
      :x="contextMenuX"
      :y="contextMenuY"
      :min-width="220"
      :items="contextMenuItems"
      @close="contextMenu.close()"
      @select="handleContextMenuAction"
    />

    <v-dialog v-model="createClassOpen" max-width="560" persistent>
      <v-card class="dialogCard">
        <ClassForm
          :preferred-school-id="selectedSchoolId"
          @saved="onClassCreated"
          @cancel="createClassOpen = false"
        />
      </v-card>
    </v-dialog>

    <v-dialog v-model="addStudentOpen" max-width="420" persistent>
      <v-card class="confirmCard">
        <v-card-title class="confirmTitle">Add student</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newStudentName"
            label="Student name"
            variant="outlined"
            hide-details="auto"
            autofocus
            @keyup.enter="confirmAddStudent"
          />
        </v-card-text>
        <v-card-actions class="confirmActions">
          <v-spacer />
          <v-btn variant="text" :disabled="addingStudent" @click="addStudentOpen = false">Cancel</v-btn>
          <v-btn color="primary" :loading="addingStudent" @click="confirmAddStudent">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editNameOpen" max-width="420" persistent>
      <v-card class="confirmCard">
        <v-card-title class="confirmTitle">Edit student name</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editNameValue"
            label="Student name"
            variant="outlined"
            hide-details="auto"
            autofocus
            @keyup.enter="confirmRename"
          />
        </v-card-text>
        <v-card-actions class="confirmActions">
          <v-spacer />
          <v-btn variant="text" :disabled="savingName" @click="editNameOpen = false">Cancel</v-btn>
          <v-btn color="primary" :loading="savingName" @click="confirmRename">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteOpen" max-width="420" persistent>
      <v-card class="confirmCard">
        <v-card-title class="confirmTitle">Delete student?</v-card-title>
        <v-card-text class="confirmText">
          Delete "{{ studentPending?.name }}"? This cannot be undone.
        </v-card-text>
        <v-card-actions class="confirmActions">
          <v-spacer />
          <v-btn variant="text" :disabled="deleting" @click="deleteOpen = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import Server from '@/services/server'
import { useUserProfile } from '@/composables/useUserProfile'
import { useContextMenu } from '@/composables/useContextMenu'
import SchoolAdminNav from '@/components/admin/SchoolAdminNav.vue'
import ClassForm from '@/components/modals/ClassForm.vue'
import AppContextMenu from '@/components/common/AppContextMenu.vue'

const route = useRoute()
const router = useRouter()
const { schoolAdminSchools } = useUserProfile()

const selectedSchoolId = ref('')
const classes = ref([])
const teachersById = ref(new Map())
const selectedClassId = ref('')
const students = ref([])
const rosterText = ref('')
const loading = ref(false)
const rosterLoading = ref(false)
const savingRoster = ref(false)
const error = ref('')
const success = ref('')
const createClassOpen = ref(false)
const addStudentOpen = ref(false)
const newStudentName = ref('')
const addingStudent = ref(false)
const editNameOpen = ref(false)
const editNameValue = ref('')
const savingName = ref(false)
const deleteOpen = ref(false)
const deleting = ref(false)
const studentPending = ref(null)
const uploadInput = ref(null)

const contextMenu = useContextMenu()
const isContextMenuOpen = computed(() => contextMenu.isOpen.value)
const contextMenuX = computed(() => contextMenu.x.value)
const contextMenuY = computed(() => contextMenu.y.value)
const contextMenuTarget = computed(() => contextMenu.target.value)

const schoolOptions = computed(() => schoolAdminSchools.value)

const selectedSchoolLabel = computed(() => {
  const match = schoolOptions.value.find((s) => s.schoolId === selectedSchoolId.value)
  return match?.schoolName || ''
})

const selectedClass = computed(() => classes.value.find((c) => c.id === selectedClassId.value) || null)

const otherClasses = computed(() =>
  classes.value.filter((c) => c.id && c.id !== selectedClassId.value)
)

const contextMenuItems = computed(() => {
  const moveChildren = otherClasses.value.map((c) => ({
    key: `move-to:${c.id}`,
    label: c.name || 'Untitled class',
    icon: 'mdi-google-classroom',
  }))
  const items = [
    { key: 'edit-name', label: 'Edit Name', icon: 'mdi-pencil' },
  ]
  if (moveChildren.length) {
    items.push({
      key: 'send-to-class',
      label: 'Send to another class',
      icon: 'mdi-account-switch',
      children: moveChildren,
    })
  }
  items.push({ key: 'delete-student', label: 'Delete Student', icon: 'mdi-delete', danger: true })
  return items
})

function teacherLabel(c) {
  const t = teachersById.value.get(c.teacherUserId)
  if (!t) return ''
  return t.name || t.email || ''
}

function studentCountFor(c) {
  if (c.id === selectedClassId.value) return students.value.length
  return c.numberOfStudents ?? 0
}

/**
 * Load school classes the same way as SchoolAdminDashboard
 * (includes legacy classes without schoolId that belong to this school's teachers).
 */
async function loadClasses() {
  if (!selectedSchoolId.value) return
  loading.value = true
  error.value = ''
  try {
    const dash = await Server.getSchoolDashboard(selectedSchoolId.value, {})
    const list = Array.isArray(dash?.classes) ? [...dash.classes] : []
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    classes.value = list

    const teacherMap = new Map()
    for (const t of dash?.teachers || []) {
      if (t?.userId) teacherMap.set(t.userId, t)
    }
    teachersById.value = teacherMap

    if (selectedClassId.value && !classes.value.some((c) => c.id === selectedClassId.value)) {
      selectedClassId.value = ''
      students.value = []
      rosterText.value = ''
    }
    if (!selectedClassId.value && classes.value.length) {
      await selectClass(classes.value[0].id)
    } else if (selectedClassId.value) {
      await loadStudents()
    }
  } catch (err) {
    console.error(err)
    error.value = err?.response?.data?.message || 'Failed to load classes'
  } finally {
    loading.value = false
  }
}

async function selectClass(classId) {
  selectedClassId.value = classId
  await loadStudents()
}

async function loadStudents() {
  if (!selectedClassId.value) return
  rosterLoading.value = true
  try {
    const res = await Server.getClassStudents(selectedClassId.value)
    students.value = res.students || []
    rosterText.value = students.value.map((s) => s.name || '').join('\n')
  } catch (err) {
    console.error(err)
    error.value = err?.response?.data?.message || 'Failed to load students'
  } finally {
    rosterLoading.value = false
  }
}

function onSchoolChange() {
  selectedClassId.value = ''
  students.value = []
  rosterText.value = ''
  router.replace({ path: '/SchoolAdminStudents', query: { schoolId: selectedSchoolId.value } })
  loadClasses()
}

function openCreateClass() {
  createClassOpen.value = true
}

async function onClassCreated() {
  createClassOpen.value = false
  success.value = 'Class created'
  await loadClasses()
}

function openAddStudent() {
  newStudentName.value = ''
  addStudentOpen.value = true
}

async function confirmAddStudent() {
  const name = newStudentName.value.trim()
  if (!name || !selectedClassId.value) return
  addingStudent.value = true
  try {
    await Server.addClassStudents(selectedClassId.value, { name })
    addStudentOpen.value = false
    toast.success('Student added')
    await loadStudents()
    await loadClasses()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Failed to add student')
  } finally {
    addingStudent.value = false
  }
}

async function saveRoster() {
  if (!selectedClassId.value) return
  const names = rosterText.value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  savingRoster.value = true
  try {
    const existingByName = new Map(
      students.value.map((s) => [(s.name || '').toLowerCase(), s])
    )
    const payload = names.map((name, index) => {
      const existing = existingByName.get(name.toLowerCase())
      return existing
        ? { ...existing, name }
        : {
            id: `student-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}`}`,
            name,
            points: 0,
            experience: 0,
            addedAt: Date.now(),
          }
    })
    await Server.syncClassStudents(selectedClassId.value, payload)
    success.value = 'Roster updated'
    toast.success('Roster synced')
    await loadStudents()
    await loadClasses()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Failed to sync roster')
  } finally {
    savingRoster.value = false
  }
}

function onFileSelected(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result || '')
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.split(',')[0].trim())
      .filter(Boolean)
    rosterText.value = lines.join('\n')
    toast.success(`Loaded ${lines.length} name(s) from file`)
  }
  reader.readAsText(file)
  event.target.value = ''
}

function openStudentMenu(event, student) {
  contextMenu.open(event, student)
}

function handleContextMenuAction(actionKey) {
  const student = contextMenuTarget.value
  if (!student) return
  if (actionKey === 'edit-name') {
    studentPending.value = student
    editNameValue.value = student.name || ''
    editNameOpen.value = true
    return
  }
  if (actionKey === 'delete-student') {
    studentPending.value = student
    deleteOpen.value = true
    return
  }
  if (typeof actionKey === 'string' && actionKey.startsWith('move-to:')) {
    moveStudent(student, actionKey.slice('move-to:'.length))
  }
}

async function confirmRename() {
  const student = studentPending.value
  const trimmed = editNameValue.value.trim()
  if (!student || !trimmed) return
  savingName.value = true
  try {
    await Server.patchStudent(student.id, { name: trimmed })
    editNameOpen.value = false
    toast.success('Student renamed')
    await loadStudents()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Failed to rename')
  } finally {
    savingName.value = false
  }
}

async function confirmDelete() {
  const student = studentPending.value
  if (!student) return
  deleting.value = true
  try {
    await Server.deleteStudentById(student.id)
    deleteOpen.value = false
    toast.success('Student deleted')
    await loadStudents()
    await loadClasses()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Failed to delete')
  } finally {
    deleting.value = false
  }
}

async function moveStudent(student, targetClassId) {
  contextMenu.close()
  const target = otherClasses.value.find((c) => c.id === targetClassId)
  try {
    await Server.moveStudent(student.id, targetClassId)
    toast.success(`Moved to ${target?.name || 'another class'}`)
    await loadStudents()
    await loadClasses()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Failed to move student')
  }
}

watch(
  schoolAdminSchools,
  (schools) => {
    if (!schools?.length) return
    const fromQuery = route.query.schoolId
    if (fromQuery && schools.some((s) => s.schoolId === fromQuery)) {
      selectedSchoolId.value = fromQuery
    } else if (!selectedSchoolId.value) {
      selectedSchoolId.value = schools[0].schoolId
    }
  },
  { immediate: true }
)

onMounted(async () => {
  if (!selectedSchoolId.value && schoolOptions.value.length) {
    selectedSchoolId.value = schoolOptions.value[0].schoolId
  }
  if (selectedSchoolId.value) {
    await loadClasses()
  }
})
</script>

<style scoped>
.saPage {
  align-items: flex-start;
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
}

.headerControls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
}

.schoolPicker {
  min-width: 220px;
  max-width: 300px;
}

.glassField {
  background: rgba(var(--ink-rgb), 0.03);
  border-radius: 10px;
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

.studentsLayout {
  display: grid;
  grid-template-columns: minmax(240px, 300px) 1fr;
  gap: 1rem;
  align-items: start;
}

@media (max-width: 860px) {
  .studentsLayout {
    grid-template-columns: 1fr;
  }
}

.sectionPanel {
  padding: 1.25rem;
  border-radius: 18px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: linear-gradient(160deg, rgba(var(--color-bg-rgb), 0.65) 0%, rgba(var(--color-bg-rgb), 0.4) 100%);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 28px rgba(var(--shadow-rgb), 0.2), inset 0 1px 0 rgba(var(--ink-rgb), 0.04);
}

.sectionHead {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.sectionHeadActions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
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

.sectionBadge {
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

.primaryActionBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  border-radius: 10px !important;
  background: linear-gradient(135deg, rgba(26, 147, 111, 0.55) 0%, rgba(26, 147, 111, 0.25) 100%) !important;
  border: 1px solid rgba(26, 147, 111, 0.35) !important;
  color: var(--white) !important;
}

.secondaryActionBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
  border-radius: 10px !important;
}

.classList {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: min(70vh, 640px);
  overflow-y: auto;
}

.classListItem {
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  background: rgba(var(--ink-rgb), 0.03);
  border-radius: 12px;
  padding: 0.7rem 0.8rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-family: var(--font);
  transition: border-color 0.15s, background 0.15s;
}

.classListItem:hover {
  background: rgba(var(--ink-rgb), 0.06);
  border-color: rgba(var(--ink-rgb), 0.1);
}

.classListItem--active {
  background: rgba(26, 147, 111, 0.14);
  border-color: rgba(26, 147, 111, 0.28);
}

.classListName {
  font-weight: 600;
  color: var(--white);
  font-size: 0.92rem;
}

.classListMeta {
  font-size: 0.75rem;
  color: rgba(var(--ink-rgb), 0.45);
}

.hiddenFile {
  display: none;
}

.uploadCard {
  margin-bottom: 1.1rem;
}

.formLabel {
  display: block;
  font-family: var(--font);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
  color: rgba(var(--ink-rgb), 0.45);
}

.formTextarea {
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  padding: 0.85rem;
  font-family: var(--font);
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--white);
  background: rgba(var(--ink-rgb), 0.04);
  resize: vertical;
}

.formTextarea::placeholder {
  color: rgba(var(--ink-rgb), 0.3);
}

.formTextarea:focus {
  outline: none;
  border-color: rgba(26, 147, 111, 0.45);
  background: rgba(var(--ink-rgb), 0.06);
}

.uploadActions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.7rem;
}

.hint {
  font-family: var(--font);
  font-size: 0.78rem;
  color: rgba(var(--ink-rgb), 0.4);
}

.studentTable {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.studentRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 0.85rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--ink-rgb), 0.08);
  background: rgba(var(--ink-rgb), 0.03);
  cursor: context-menu;
  font-family: var(--font);
  transition: border-color 0.15s, background 0.15s;
}

.studentRow:hover {
  background: rgba(var(--ink-rgb), 0.06);
  border-color: rgba(var(--ink-rgb), 0.14);
}

.studentName {
  font-weight: 600;
  color: var(--white);
}

.studentPts {
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.5);
  font-variant-numeric: tabular-nums;
}

.emptyNote {
  font-family: var(--font);
  color: rgba(var(--ink-rgb), 0.45);
  font-size: 0.9rem;
  margin: 0;
}

.expandLoading {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
}

.dialogCard,
.confirmCard {
  border-radius: 16px !important;
  overflow: hidden;
}

.confirmTitle {
  font-family: var(--font) !important;
  font-weight: 700 !important;
}

.confirmActions {
  padding: 0.75rem 1rem 1rem !important;
}
</style>
