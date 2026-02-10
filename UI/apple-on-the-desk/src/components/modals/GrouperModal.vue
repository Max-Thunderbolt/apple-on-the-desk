<template>
    <v-dialog v-model="dialogOpen" max-width="500" persistent transition="dialog-transition" class="grouperDialog"
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
                        {{ totalStudents }} student{{ totalStudents !== 1 ? 's' : '' }} will be divided into
                        {{ numberOfGroups }} group{{ numberOfGroups !== 1 ? 's' : '' }} of approximately
                        {{ groupSize }} student{{ groupSize !== 1 ? 's' : '' }} each
                    </div>
                </div>

                <!-- Current groups display -->
                <div v-if="hasExistingGroups" class="existingGroupsContainer">
                    <div class="existingGroupsHeader">
                        <v-icon>mdi-account-group</v-icon>
                        Current Groups
                    </div>
                    <div class="existingGroupsList">
                        <div v-for="(students, groupName) in currentGroups" :key="groupName" class="groupItem">
                            <span class="groupName">{{ groupName }}</span>
                            <span class="groupCount">{{ students.length }} student{{ students.length !== 1 ? 's' : ''
                                }}</span>
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
                    <v-btn v-if="hasExistingGroups" class="clearGroupsButton" variant="text" @click="handleClearGroups"
                        :disabled="loading">
                        Clear Groups
                    </v-btn>
                    <v-btn class="generateButton" variant="text" @click="handleGenerateGroups"
                        :disabled="!isValidInput || loading">
                        Generate
                    </v-btn>
                    <v-btn class="cancelButton" variant="text" @click="closeDialog" :disabled="loading">
                        Close
                    </v-btn>
                </div>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import Server from '../../services/server';
import { toast } from 'vue-sonner';

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

const numberOfGroups = ref(2);
const loading = ref(false);
const errorMessage = ref('');
const currentGroups = ref({});

const totalStudents = computed(() => props.students.length);
const maxGroups = computed(() => props.students.length);
const groupSize = computed(() => {
    if (numberOfGroups.value <= 0) return 0;
    return Math.ceil(totalStudents.value / numberOfGroups.value);
});

const isValidInput = computed(() => {
    return numberOfGroups.value > 0 && numberOfGroups.value <= maxGroups.value;
});

const hasExistingGroups = computed(() => {
    return Object.keys(currentGroups.value).length > 0;
});

watch(() => props.modelValue, async (newValue) => {
    if (newValue) {
        // Dialog opened, load current groups
        await loadCurrentGroups();
        errorMessage.value = '';
    }
});

async function loadCurrentGroups() {
    try {
        const response = await Server.getGroups(props.classId);
        currentGroups.value = response.groups || {};
    } catch (error) {
        console.error('Error loading current groups:', error);
        currentGroups.value = {};
    }
}

function validateInput() {
    if (numberOfGroups.value < 1) {
        numberOfGroups.value = 1;
    } else if (numberOfGroups.value > maxGroups.value) {
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
            toast.success('Groups generated successfully');
            emit('groupsUpdated', response.students);
            await loadCurrentGroups();
            closeDialog();
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

async function handleClearGroups() {
    loading.value = true;
    errorMessage.value = '';

    try {
        const response = await Server.clearGroups(props.classId);

        if (response.success) {
            toast.success('Groups cleared successfully');
            emit('groupsUpdated', response.students);
            currentGroups.value = {};
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
    border: 1px solid var(--white);
    padding: 0 0 0.5rem;
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
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.grouperDialogContent {
    padding: 1.5rem 1rem;
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
    background-color: rgba(255, 255, 255, 0.05);
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

.existingGroupsList {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.groupItem {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.groupName {
    font-family: var(--font);
    font-weight: 600;
    color: var(--seaGreen);
}

.groupCount {
    font-family: var(--font);
    font-size: 0.85rem;
    color: var(--white);
    opacity: 0.7;
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
