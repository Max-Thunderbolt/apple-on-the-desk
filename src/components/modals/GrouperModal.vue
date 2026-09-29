<template>
    <v-dialog v-model="dialogOpen" max-width="720" persistent transition="dialog-transition" class="grouperDialog"
        @click:outside="closeDialog">
        <v-card class="grouperDialogCard">
            <v-card-title class="grouperDialogTitle">
                Create Groups
            </v-card-title>
            <v-card-subtitle class="grouperDialogSubtitle">
                Automatically divide students into groups
            </v-card-subtitle>
            <v-card-text class="grouperDialogContent">
                <!-- Number of groups input -->
                <div class="inputContainer">
                    <label class="inputLabel">Number of Groups</label>
                    <v-text-field v-model.number="numberOfGroups" type="number" min="1" :max="maxGroups"
                        variant="outlined" density="compact" class="grouperInput" @input="validateInput" />
                </div>

                <!-- Preview -->
                <div v-if="numberOfGroups > 0 && numberOfGroups <= maxGroups" class="previewContainer">
                    <div class="previewText">
                        <v-icon class="previewIcon">mdi-information-outline</v-icon>
                        {{ groupDistributionPreview }}
                    </div>
                </div>

                <!-- Current groups display -->
                <div v-if="hasExistingGroups" class="existingGroupsContainer">
                    <div class="existingGroupsHeader">
                        <v-icon>mdi-account-group</v-icon>
                        Current Groups
                    </div>
                    <p class="dragHint">Drag students between groups, right-click to send elsewhere, or edit a group name.</p>
                    <div class="existingGroupsList">
                        <div v-for="group in currentGroups" :key="group.name" class="groupCard"
                            :class="{ 'groupCard--drag-over': dragOverGroup === group.name }"
                            @dragover.prevent="onGroupDragover($event, group.name)"
                            @dragleave="onGroupDragleave(group.name)" @drop.prevent="onGroupDrop($event, group.name)">
                            <div class="groupCardHeader">
                                <v-text-field
                                    :model-value="pendingGroupNames[group.name] ?? group.name"
                                    type="text" variant="outlined" density="compact" class="groupNameInput"
                                    hide-details @update:model-value="(value) => onGroupNameEdit(group.name, value)"
                                    @blur="() => onGroupNameBlur(group.name)" />
                                <span class="groupCount">{{ group.students.length }} student{{ group.students.length !== 1 ? 's' :
                                    '' }}</span>
                            </div>
                            <div class="groupStudentsList">
                                <div v-for="student in group.students" :key="student.id" class="studentChip" draggable="true"
                                    @dragstart="onStudentDragstart($event, student, group.name)"
                                    @dragend="onStudentDragend"
                                    @contextmenu.prevent="openStudentContextMenu($event, student, group.name)">
                                    <v-icon size="small" class="studentChipIcon">mdi-drag</v-icon>
                                    <span class="studentChipName">{{ student.name }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Error message -->
                <div v-if="errorMessage" class="errorMessage">
                    <v-icon color="error">mdi-alert-circle</v-icon>
                    {{ errorMessage }}
                </div>

                <!-- Loading -->
                <div v-if="loading" class="loadingContainer">
                    <v-progress-circular indeterminate color="primary" />
                    <span class="loadingText">Generating groups...</span>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <div class="grouperDialogButtons">
                    <v-btn class="cancelButton" variant="text" @click="closeDialog" :disabled="loading">
                        Close
                    </v-btn>
                    <v-btn v-if="hasExistingGroups" class="clearGroupsButton" variant="text" @click="handleClearGroups"
                        :disabled="loading">
                        Clear Groups
                    </v-btn>
                    <v-btn class="generateButton" variant="text" @click="handleGenerateGroups"
                        :disabled="!isValidInput || loading">
                        {{ hasExistingGroups ? 'Regenerate' : 'Generate' }}
                    </v-btn>
                </div>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <AppContextMenu :open="isContextMenuOpen" :x="contextMenuX" :y="contextMenuY" :min-width="220" :z-index="2600"
        :items="contextMenuItems" @close="contextMenu.close()" @select="handleContextMenuAction" />
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import Server from '../../services/server';
import { toast } from 'vue-sonner';
import { useContextMenu } from '../../composables/useContextMenu';
import AppContextMenu from '../common/AppContextMenu.vue';

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true,
        default: false,
    },
    classId: {
        type: String,
        required: true,
    },
    students: {
        type: Array,
        required: true,
        default: () => [],
    },
});

const emit = defineEmits(['update:modelValue', 'groupsUpdated']);

const dialogOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
});

const numberOfGroups = ref(13);
const loading = ref(false);
const errorMessage = ref('');
const currentGroups = ref([]);
const dragOverGroup = ref(null);
const draggingStudent = ref(null);
const assigningStudentId = ref(null);
const pendingGroupNames = ref({});
const contextMenu = useContextMenu();

const isContextMenuOpen = computed(() => contextMenu.isOpen.value);
const contextMenuX = computed(() => contextMenu.x.value);
const contextMenuY = computed(() => contextMenu.y.value);
const contextMenuTarget = computed(() => contextMenu.target.value);

const contextMenuItems = computed(() => {
    const target = contextMenuTarget.value;
    if (!target) return [];

    const otherGroups = currentGroups.value
        .filter((group) => group.name !== target.groupName)
        .map((group) => ({
            key: `send-to-group:${group.name}`,
            label: group.name,
            icon: 'mdi-account-group',
        }));

    return [{
        key: 'send-to-group',
        label: 'Send to group...',
        icon: 'mdi-account-arrow-right',
        disabled: otherGroups.length === 0 || loading.value,
        children: otherGroups,
    }];
});

const totalStudents = computed(() => props.students.length);
const maxGroups = computed(() => props.students.length);

/** Accurate description of how many students will be in each group */
const groupDistributionPreview = computed(() => {
    const n = totalStudents.value;
    const g = numberOfGroups.value;
    if (g <= 0 || n <= 0) return '';
    const baseSize = Math.floor(n / g);
    const remainder = n % g;
    const countLarger = remainder;
    const countSmaller = g - remainder;
    const largerSize = baseSize + 1;
    const smallerSize = baseSize;

    const studentWord = (count) => count === 1 ? 'student' : 'students';
    if (remainder === 0) {
        return `${n} ${studentWord(n)} will be divided into ${g} group${g !== 1 ? 's' : ''} of ${smallerSize} ${studentWord(smallerSize)} each.`;
    }
    const parts = [];
    if (countLarger > 0) {
        parts.push(`${countLarger} group${countLarger !== 1 ? 's' : ''} of ${largerSize} ${studentWord(largerSize)}`);
    }
    if (countSmaller > 0) {
        parts.push(`${countSmaller} group${countSmaller !== 1 ? 's' : ''} of ${smallerSize} ${studentWord(smallerSize)}`);
    }
    return `${n} ${studentWord(n)} will be divided into ${g} groups: ${parts.join(' and ')}.`;
});

const isValidInput = computed(() => {
    return numberOfGroups.value > 0 && numberOfGroups.value <= maxGroups.value;
});

const hasExistingGroups = computed(() => currentGroups.value.length > 0);

watch(() => props.modelValue, async (newValue) => {
    if (newValue) {
        const max = props.students.length || 1;
        if (numberOfGroups.value > max || numberOfGroups.value < 1) {
            numberOfGroups.value = Math.min(Math.max(1, numberOfGroups.value), max);
        }
        await loadCurrentGroups();
        if (currentGroups.value.length > 0) {
            numberOfGroups.value = currentGroups.value.length;
        }
        pendingGroupNames.value = {};
        errorMessage.value = '';
    }
});

async function loadCurrentGroups() {
    try {
        const response = await Server.getGroups(props.classId);
        currentGroups.value = response.groups || [];
    } catch (error) {
        console.error('Error loading current groups:', error);
        currentGroups.value = [];
    }
}

function validateInput() {
    const n = Number(numberOfGroups.value);
    // Don't clamp while the user is typing (empty or invalid) — only clamp a valid number that's out of range
    if (numberOfGroups.value === '' || Number.isNaN(n)) {
        errorMessage.value = '';
        return;
    }
    if (n < 1) {
        numberOfGroups.value = 1;
    } else if (n > maxGroups.value) {
        numberOfGroups.value = maxGroups.value;
    }
    errorMessage.value = '';
}

async function handleGenerateGroups() {
    if (!isValidInput.value) return;

    loading.value = true;
    errorMessage.value = '';

    try {
        const response = await Server.generateGroups(props.classId, numberOfGroups.value);

        if (response.success) {
            toast.success('Groups created');
            emit('groupsUpdated', response);
            await loadCurrentGroups();
        } else {
            errorMessage.value = response.message || 'Failed to generate groups';
        }
    } catch (error) {
        console.error('Error generating groups:', error);
        errorMessage.value = error.response?.data?.message || 'Failed to generate groups. Please try again.';
        toast.error(errorMessage.value);
    } finally {
        loading.value = false;
    }
}

function onGroupNameEdit(originalName, value) {
    pendingGroupNames.value = {
        ...pendingGroupNames.value,
        [originalName]: value,
    };
}

async function onGroupNameBlur(originalName) {
    const nextName = String(pendingGroupNames.value[originalName] ?? originalName).trim();
    const { [originalName]: _, ...rest } = pendingGroupNames.value;
    pendingGroupNames.value = rest;

    if (!nextName || nextName === originalName) {
        await loadCurrentGroups();
        return;
    }

    loading.value = true;
    try {
        const response = await Server.renameGroup(props.classId, originalName, nextName);
        if (response.success) {
            toast.success(`Group renamed to ${nextName}`);
            emit('groupsUpdated', response);
            await loadCurrentGroups();
        } else {
            toast.error(response.message || 'Failed to rename group');
            await loadCurrentGroups();
        }
    } catch (error) {
        console.error('Error renaming group:', error);
        toast.error(error.response?.data?.message || 'Failed to rename group.');
        await loadCurrentGroups();
    } finally {
        loading.value = false;
    }
}

async function moveStudentToGroup(studentId, fromGroupName, targetGroupName) {
    if (!studentId || fromGroupName === targetGroupName) return;

    assigningStudentId.value = studentId;
    try {
        const response = await Server.assignStudentToGroup(props.classId, studentId, targetGroupName);
        if (response.success) {
            toast.success(`Student moved to ${targetGroupName}`);
            emit('groupsUpdated', response);
            await loadCurrentGroups();
        } else {
            toast.error(response.message || 'Failed to move student');
        }
    } catch (error) {
        console.error('Error assigning student to group:', error);
        toast.error(error.response?.data?.message || 'Failed to move student.');
    } finally {
        assigningStudentId.value = null;
    }
}

function openStudentContextMenu(event, student, groupName) {
    contextMenu.open(event, { student, groupName });
}

async function handleContextMenuAction(actionKey) {
    const target = contextMenuTarget.value;
    if (!target || !actionKey.startsWith('send-to-group:')) return;

    const targetGroupName = actionKey.slice('send-to-group:'.length);
    await moveStudentToGroup(target.student.id, target.groupName, targetGroupName);
}

function onStudentDragstart(event, student, groupName) {
    draggingStudent.value = { studentId: student.id, groupName };
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify({ studentId: student.id, groupName }));
    event.dataTransfer.setData('text/plain', student.id);
}

function onStudentDragend() {
    draggingStudent.value = null;
    dragOverGroup.value = null;
}

function onGroupDragover(event, groupName) {
    if (!draggingStudent.value) return;
    if (draggingStudent.value.groupName === groupName) return;
    dragOverGroup.value = groupName;
}

function onGroupDragleave(groupName) {
    if (dragOverGroup.value === groupName) dragOverGroup.value = null;
}

async function onGroupDrop(event, targetGroupName) {
    dragOverGroup.value = null;
    const payload = draggingStudent.value;
    if (!payload || payload.groupName === targetGroupName) return;

    await moveStudentToGroup(payload.studentId, payload.groupName, targetGroupName);
}

async function handleClearGroups() {
    loading.value = true;
    errorMessage.value = '';

    try {
        const response = await Server.clearGroups(props.classId);

        if (response.success) {
            toast.success('Groups cleared');
            emit('groupsUpdated', response);
            currentGroups.value = [];
        } else {
            errorMessage.value = response.message || 'Failed to clear groups';
        }
    } catch (error) {
        console.error('Error clearing groups:', error);
        errorMessage.value = 'Failed to clear groups. Please try again.';
        toast.error(errorMessage.value);
    } finally {
        loading.value = false;
    }
}

function closeDialog() {
    if (!loading.value) {
        dialogOpen.value = false;
    }
}
</script>

<style scoped>
.grouperDialogCard {
    background-color: var(--inkBlack);
    border-radius: 25px;
    border: 2px solid rgba(var(--amethyst-rgb), 0.1);
    box-shadow: 0 0 10px 0 rgba(var(--amethyst-rgb), 0.5);
}

.grouperDialogTitle {
    font-family: var(--font);
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--white);
    text-align: center;
    padding: 1rem 0 0.5rem;
}

.grouperDialogSubtitle {
    font-family: var(--font);
    font-size: 1rem;
    font-weight: 500;
    color: var(--white);
    opacity: 0.8;
    text-align: center;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid rgba(var(--ink-rgb), 0.2);
}

.grouperDialogContent {
    padding: 1.5rem 1rem;
}

.groupNameInput {
    color: var(--white);
}

.groupNameInput :deep(.v-field-label) {
    color: rgba(255, 255, 255, 0.7);
}

.inputContainer {
    margin-bottom: 1rem;
}

.inputLabel {
    display: block;
    font-family: var(--font);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--white);
    margin-bottom: 0.5rem;
}

.grouperInput {
    color: var(--white);
}

.previewContainer {
    background-color: rgba(var(--seaGreen-rgb), 0.1);
    border: 1px solid rgba(var(--seaGreen-rgb), 0.3);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.previewText {
    font-family: var(--font);
    font-size: 0.9rem;
    color: var(--white);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.previewIcon {
    color: var(--seaGreen);
}

.existingGroupsContainer {
    background-color: rgba(var(--ink-rgb), 0.05);
    border-radius: 12px;
    padding: 1rem;
    margin-top: 1rem;
}

.existingGroupsHeader {
    font-family: var(--font);
    font-size: 1rem;
    font-weight: 600;
    color: var(--white);
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.dragHint {
    font-family: var(--font);
    font-size: 0.8rem;
    color: var(--white);
    opacity: 0.7;
    margin: 0 0 0.75rem 0;
}

.existingGroupsList {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    max-height: 320px;
    overflow-y: auto;
}

.groupCard {
    padding: 0.5rem 0.75rem;
    background-color: rgba(var(--ink-rgb), 0.05);
    border-radius: 8px;
    border: 2px solid transparent;
    transition: border-color 0.15s ease, background-color 0.15s ease;
}

.groupCard--drag-over {
    border-color: var(--seaGreen);
    background-color: rgba(var(--seaGreen-rgb), 0.15);
}

.groupCardHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.groupCardHeader .groupNameInput {
    flex: 1;
    min-width: 0;
}

.groupCount {
    font-family: var(--font);
    font-size: 0.85rem;
    color: var(--white);
    opacity: 0.7;
}

.groupStudentsList {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.studentChip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background-color: rgba(var(--ink-rgb), 0.08);
    border-radius: 6px;
    font-family: var(--font);
    font-size: 0.85rem;
    color: var(--white);
    cursor: grab;
    user-select: none;
}

.studentChip:active {
    cursor: grabbing;
}

.studentChipIcon {
    opacity: 0.6;
    flex-shrink: 0;
}

.studentChipName {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.errorMessage {
    background-color: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.3);
    border-radius: 12px;
    padding: 1rem;
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--white);
    font-family: var(--font);
    font-size: 0.9rem;
}

.loadingContainer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    margin-top: 1rem;
}

.loadingText {
    font-family: var(--font);
    color: var(--white);
}

.grouperDialogButtons {
    display: flex;
    gap: 0.5rem;
    padding: 0 0.5rem;
}

.generateButton {
    font-family: var(--font) !important;
    font-size: 1rem !important;
    font-weight: 500 !important;
    color: var(--white) !important;
    background: linear-gradient(135deg,
            rgba(var(--seaGreen-rgb), 0.6) 0%,
            rgba(var(--seaGreen-rgb), 0.6) 100%) !important;
    border-radius: 15px !important;
    padding: 0.5rem 1rem !important;
    transition: all 0.3s ease !important;
    cursor: pointer !important;
}

.generateButton:hover:not(:disabled) {
    transform: scale(1.02) !important;
    filter: brightness(1.1) !important;
}

.generateButton:disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
}

.clearGroupsButton {
    font-family: var(--font) !important;
    font-size: 1rem !important;
    font-weight: 500 !important;
    color: var(--white) !important;
    background: linear-gradient(135deg,
            rgba(255, 165, 0, 0.6) 0%,
            rgba(255, 165, 0, 0.6) 100%) !important;
    border-radius: 15px !important;
    padding: 0.5rem 1rem !important;
    transition: all 0.3s ease !important;
    cursor: pointer !important;
}

.clearGroupsButton:hover:not(:disabled) {
    transform: scale(1.02) !important;
    filter: brightness(1.1) !important;
}

.cancelButton {
    font-family: var(--font) !important;
    font-size: 1rem !important;
    font-weight: 500 !important;
    color: var(--white) !important;
    background: linear-gradient(135deg,
            rgba(255, 0, 0, 0.459) 0%,
            rgba(255, 0, 0, 0.459) 100%) !important;
    border-radius: 15px !important;
    padding: 0.5rem 1rem !important;
    transition: all 0.3s ease !important;
    cursor: pointer !important;
}

.cancelButton:hover:not(:disabled) {
    transform: scale(1.02) !important;
    filter: brightness(1.1) !important;
}
</style>
