<template>
  <div class="container adminPage">
    <div class="adminShell">
      <AdminNav />

      <header class="adminHeader">
        <div class="adminHeaderLeft">
          <p class="adminEyebrow">Platform administration</p>
          <h1 class="adminTitle">
            School <span class="titleAccent">groups</span>
          </h1>
          <p class="adminSubtitle">
            Name groups and assign schools for combined billing and teacher insights across campuses.
          </p>
        </div>
        <v-btn class="refreshBtn" size="small" :loading="loading" icon="mdi-refresh" variant="flat"
          @click="loadGroups" />
      </header>

      <v-alert v-if="error" type="error" variant="tonal" class="adminAlert" rounded="lg" closable
        @click:close="error = ''">
        {{ error }}
      </v-alert>
      <v-alert v-if="success" type="success" variant="tonal" class="adminAlert" rounded="lg" closable
        @click:close="success = ''">
        {{ success }}
      </v-alert>

      <div class="createBar">
        <v-text-field v-model="newGroupName" placeholder="New group name" density="compact" hide-details
          variant="outlined" class="glassField createInput" rounded="lg" @keyup.enter="createGroup" />
        <v-btn class="actionBtn" :loading="creating" prepend-icon="mdi-plus" @click="createGroup">
          Create group
        </v-btn>
      </div>

      <div v-if="loading && !groups.length" class="loadingWrap">
        <v-progress-circular indeterminate color="primary" size="48" width="4" />
      </div>

      <div v-else class="groupLayout">
        <aside class="groupListPanel">
          <h2 class="panelTitle">Groups</h2>
          <div v-if="groups.length" class="groupList">
            <button v-for="g in groups" :key="g.id" type="button" class="groupListItem"
              :class="{ 'groupListItem--active': selectedGroupId === g.id }" @click="selectGroup(g.id)">
              <span class="groupListName">{{ g.name }}</span>
              <span class="groupListMeta">{{ g.schoolIds?.length ?? 0 }} schools</span>
            </button>
          </div>
          <p v-else class="emptyNote">No groups yet. Create one above.</p>
        </aside>

        <main v-if="selectedGroup" class="groupDetailPanel">
          <div class="detailHead">
            <div>
              <h2 class="detailTitle">{{ selectedGroup.name }}</h2>
              <p class="detailMeta">{{ selectedGroup.schoolIds?.length ?? 0 }} schools in this group</p>
            </div>
            <div class="detailActions">
              <v-btn size="small" variant="tonal" prepend-icon="mdi-pencil" @click="openRename">Rename</v-btn>
              <v-btn size="small" variant="outlined" color="error" prepend-icon="mdi-delete" @click="confirmDelete">
                Delete group
              </v-btn>
            </div>
          </div>

          <div class="addSchoolRow">
            <v-select v-model="schoolToAdd" :items="availableSchools" item-title="name" item-value="id"
              label="Add school to group" density="compact" hide-details variant="outlined" class="glassField schoolAddSelect"
              :menu-props="{ contentClass: 'dashboardSelectMenu' }" />
            <v-btn size="small" :disabled="!schoolToAdd" :loading="addingSchool" @click="addSchool">
              Add school
            </v-btn>
          </div>

          <div v-if="selectedGroup.schools?.length" class="schoolChipList">
            <div v-for="s in selectedGroup.schools" :key="s.schoolId" class="schoolChipRow">
              <span class="schoolChipName">{{ s.schoolName }}</span>
              <v-btn icon="mdi-close" size="x-small" variant="text" @click="removeSchool(s.schoolId)" />
            </div>
          </div>
          <p v-else class="emptyNote">No schools in this group yet.</p>
        </main>

        <div v-else class="groupDetailPanel groupDetailPanel--empty">
          <p class="emptyTitle">Select a group</p>
          <p class="emptyText">Choose a group from the list or create a new one.</p>
        </div>
      </div>

      <v-dialog v-model="renameOpen" max-width="400" persistent>
        <v-card class="dialogCard">
          <v-card-title>Rename group</v-card-title>
          <v-card-text>
            <v-text-field v-model="renameName" label="Group name" variant="outlined" hide-details />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="renameOpen = false">Cancel</v-btn>
            <v-btn :loading="renaming" @click="saveRename">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="deleteDialogOpen" max-width="420" persistent>
        <v-card class="confirmCard">
          <v-card-title class="confirmTitle">Delete group?</v-card-title>
          <v-card-text class="confirmText">
            Delete "{{ selectedGroup?.name }}"? Schools will be ungrouped but not deleted.
          </v-card-text>
          <v-card-actions class="confirmActions">
            <v-spacer />
            <v-btn variant="text" :disabled="deleting" @click="deleteDialogOpen = false">Cancel</v-btn>
            <v-btn color="error" :loading="deleting" @click="executeDelete">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AdminNav from '@/components/admin/AdminNav.vue';
import Server from '@/services/server';

const groups = ref([]);
const allSchools = ref([]);
const loading = ref(false);
const creating = ref(false);
const addingSchool = ref(false);
const renaming = ref(false);
const error = ref('');
const success = ref('');
const newGroupName = ref('');
const selectedGroupId = ref('');
const schoolToAdd = ref(null);
const renameOpen = ref(false);
const renameName = ref('');
const deleteDialogOpen = ref(false);
const deleting = ref(false);

const selectedGroup = computed(() =>
  groups.value.find((g) => g.id === selectedGroupId.value) ?? null
);

const availableSchools = computed(() => {
  const inAnyGroup = new Set(groups.value.flatMap((g) => g.schoolIds ?? []));
  return allSchools.value.filter((s) => !inAnyGroup.has(s.id));
});

async function loadGroups() {
  loading.value = true;
  error.value = '';
  try {
    const [groupsRes, schoolsRes] = await Promise.all([
      Server.listAdminSchoolGroups(),
      Server.listAdminSchools(),
    ]);
    groups.value = groupsRes.groups ?? [];
    allSchools.value = schoolsRes.schools ?? [];
    if (!selectedGroupId.value && groups.value.length) {
      selectedGroupId.value = groups.value[0].id;
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Failed to load groups';
  } finally {
    loading.value = false;
  }
}

function selectGroup(id) {
  selectedGroupId.value = id;
  schoolToAdd.value = null;
}

async function createGroup() {
  const name = newGroupName.value.trim();
  if (!name) return;
  creating.value = true;
  error.value = '';
  try {
    const res = await Server.createAdminSchoolGroup({ name });
    newGroupName.value = '';
    await loadGroups();
    if (res.group?.id) selectedGroupId.value = res.group.id;
    success.value = 'Group created';
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Failed to create group';
  } finally {
    creating.value = false;
  }
}

async function addSchool() {
  if (!selectedGroupId.value || !schoolToAdd.value) return;
  addingSchool.value = true;
  try {
    await Server.addSchoolToAdminGroup(selectedGroupId.value, schoolToAdd.value);
    schoolToAdd.value = null;
    await loadGroups();
    success.value = 'School added to group';
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Failed to add school';
  } finally {
    addingSchool.value = false;
  }
}

async function removeSchool(schoolId) {
  if (!selectedGroupId.value) return;
  try {
    await Server.removeSchoolFromAdminGroup(selectedGroupId.value, schoolId);
    await loadGroups();
    success.value = 'School removed from group';
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Failed to remove school';
  }
}

function openRename() {
  renameName.value = selectedGroup.value?.name ?? '';
  renameOpen.value = true;
}

async function saveRename() {
  if (!selectedGroupId.value || !renameName.value.trim()) return;
  renaming.value = true;
  try {
    await Server.updateAdminSchoolGroup(selectedGroupId.value, { name: renameName.value.trim() });
    renameOpen.value = false;
    await loadGroups();
    success.value = 'Group renamed';
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Failed to rename group';
  } finally {
    renaming.value = false;
  }
}

async function confirmDelete() {
  if (!selectedGroupId.value) return;
  deleteDialogOpen.value = true;
}

async function executeDelete() {
  if (!selectedGroupId.value) return;
  deleting.value = true;
  try {
    await Server.deleteAdminSchoolGroup(selectedGroupId.value);
    selectedGroupId.value = '';
    deleteDialogOpen.value = false;
    await loadGroups();
    success.value = 'Group deleted';
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Failed to delete group';
  } finally {
    deleting.value = false;
  }
}

onMounted(loadGroups);
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
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
}

.adminHeader {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.adminEyebrow {
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.6);
  margin: 0 0 0.25rem 0;
}

.adminTitle {
  font-family: var(--font);
  margin: 0 0 0.35rem 0;
}

.adminSubtitle {
  font-family: var(--font);
  color: rgba(var(--ink-rgb), 0.7);
  margin: 0;
  max-width: 520px;
}

.adminAlert {
  margin-bottom: 1rem;
}

.createBar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-radius: 14px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: rgba(var(--ink-rgb), 0.03);
}

.createInput {
  flex: 1;
  min-width: 200px;
  max-width: 360px;
}

.actionBtn {
  text-transform: none !important;
  font-family: var(--font) !important;
  font-weight: 600 !important;
}

.loadingWrap {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.groupLayout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .groupLayout {
    grid-template-columns: 1fr;
  }
}

.groupListPanel {
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  border-radius: 14px;
  padding: 1rem;
  background: rgba(var(--ink-rgb), 0.03);
}

.panelTitle {
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
}

.groupList {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.groupListItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  font-family: var(--font);
  text-align: left;
}

.groupListItem--active {
  background: rgba(0, 168, 232, 0.12);
  border-color: rgba(0, 168, 232, 0.3);
}

.groupListName {
  font-weight: 600;
  color: var(--white);
}

.groupListMeta {
  font-size: 0.8rem;
  color: rgba(var(--ink-rgb), 0.55);
}

.groupDetailPanel {
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  border-radius: 14px;
  padding: 1.25rem;
  background: rgba(var(--ink-rgb), 0.03);
}

.groupDetailPanel--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.detailHead {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.detailTitle {
  font-family: var(--font);
  margin: 0 0 0.25rem 0;
}

.detailMeta {
  font-family: var(--font);
  font-size: 0.9rem;
  color: rgba(var(--ink-rgb), 0.6);
  margin: 0;
}

.detailActions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.addSchoolRow {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}

.schoolAddSelect {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.schoolChipList {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.schoolChipRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: rgba(var(--ink-rgb), 0.04);
}

.schoolChipName {
  font-family: var(--font);
  font-weight: 600;
}

.emptyNote,
.emptyTitle,
.emptyText {
  font-family: var(--font);
  color: rgba(var(--ink-rgb), 0.65);
}

.dialogCard {
  background: var(--inkBlack) !important;
}

.confirmCard {
  font-family: var(--font);
}

.confirmTitle {
  font-weight: 600;
}

.confirmText {
  color: rgba(var(--ink-rgb), 0.85);
}

.confirmActions {
  padding: 0 1rem 1rem;
}
</style>
