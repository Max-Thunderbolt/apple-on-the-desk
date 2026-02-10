<template>
    <v-dialog v-model="dialogOpen" max-width="500" persistent transition="dialog-transition" class="constraintsDialog"
        @click:outside="closeDialog">
        <v-card class="constraintsDialogCard">
            <v-card-title class="constraintsDialogTitle">
                Pairing Constraints
            </v-card-title>
            <v-card-subtitle class="constraintsDialogSubtitle">
                {{ studentName }} cannot be paired with:
            </v-card-subtitle>
            <v-card-text class="constraintsDialogContent">
                <!-- Student selection list -->
                <div v-if="otherStudents.length > 0" class="studentsList">
                    <div v-for="student in otherStudents" :key="student.id" class="studentItem"
                        @click="toggleStudentConstraint(student.name)">
                        <v-checkbox :model-value="isConstraintSelected(student.name)" color="seaGreen" density="compact"
                            hide-details @click.stop="toggleStudentConstraint(student.name)" />
                        <span class="studentName">{{ student.name }}</span>
                    </div>
                </div>
                <div v-else class="noStudents">
                    No other students in this class.
                </div>

                <!-- Info message -->
                <div class="infoMessage">
                    <v-icon color="info" size="small">mdi-information-outline</v-icon>
                    <span>Selected students will not be grouped with {{ studentName }} when creating groups.</span>
                </div>

                <!-- Error message -->
                <div v-if="errorMessage" class="errorMessage">
                    <v-icon color="error">mdi-alert-circle</v-icon>
                    {{ errorMessage }}
                </div>

                <!-- Loading -->
                <div v-if="loading" class="loadingContainer">
                    <v-progress-circular indeterminate color="primary" size="24" />
                    <span class="loadingText">Saving...</span>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <div class="constraintsDialogButtons">
                    <v-btn class="saveButton" variant="text" @click="handleSave" :disabled="loading">
                        Save
                    </v-btn>
                    <v-btn class="cancelButton" variant="text" @click="closeDialog" :disabled="loading">
                        Cancel
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
    student: {
        type: Object,
        required: true,
        default: () => ({}),
    },
    allStudents: {
        type: Array,
        required: true,
        default: () => [],
    },
});

const emit = defineEmits(['update:modelValue', 'constraintsUpdated']);

const dialogOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
});

const loading = ref(false);
const errorMessage = ref('');
const selectedConstraints = ref([]);

const studentName = computed(() => props.student?.name || '');
const studentId = computed(() => props.student?.id || '');

const otherStudents = computed(() => {
    return props.allStudents.filter(s => s.id !== studentId.value);
});

watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        // Dialog opened, load current constraints
        loadCurrentConstraints();
        errorMessage.value = '';
    }
});

watch(() => props.student, (newStudent) => {
    if (newStudent && props.modelValue) {
        loadCurrentConstraints();
    }
});

function loadCurrentConstraints() {
    if (props.student && props.student.cannotPairWith) {
        selectedConstraints.value = [...props.student.cannotPairWith];
    } else {
        selectedConstraints.value = [];
    }
}

function isConstraintSelected(studentName) {
    return selectedConstraints.value.includes(studentName);
}

function toggleStudentConstraint(studentName) {
    const index = selectedConstraints.value.indexOf(studentName);
    if (index > -1) {
        selectedConstraints.value.splice(index, 1);
    } else {
        selectedConstraints.value.push(studentName);
    }
}

async function handleSave() {
    loading.value = true;
    errorMessage.value = '';

    try {
        const response = await Server.updateStudentConstraints(
            props.classId,
            studentId.value,
            selectedConstraints.value
        );

        if (response.success) {
            toast.success('Constraints updated successfully');
            emit('constraintsUpdated', response.student);
            closeDialog();
        } else {
            errorMessage.value = response.message || 'Failed to update constraints';
        }
    } catch (error) {
        console.error('Error updating constraints:', error);
        errorMessage.value = error.response?.data?.message || 'Failed to update constraints. Please try again.';
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
.constraintsDialogCard {
    background-color: var(--inkBlack);
    border-radius: 25px;
    border: 1px solid var(--white);
    padding: 0 0 0.5rem;
}

.constraintsDialogTitle {
    font-family: var(--font);
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--white);
    text-align: center;
    padding: 1rem 0 0.5rem;
}

.constraintsDialogSubtitle {
    font-family: var(--font);
    font-size: 1rem;
    font-weight: 500;
    color: var(--white);
    opacity: 0.8;
    text-align: center;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.constraintsDialogContent {
    padding: 1rem;
    max-height: 400px;
    overflow-y: auto;
}

.studentsList {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.studentItem {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.studentItem:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.studentName {
    font-family: var(--font);
    font-size: 1rem;
    color: var(--white);
}

.noStudents {
    font-family: var(--font);
    color: var(--white);
    opacity: 0.6;
    text-align: center;
    padding: 2rem 1rem;
}

.infoMessage {
    background-color: rgba(var(--seaGreen-rgb), 0.1);
    border: 1px solid rgba(var(--seaGreen-rgb), 0.3);
    border-radius: 12px;
    padding: 0.75rem;
    margin-top: 1rem;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    color: var(--white);
    font-family: var(--font);
    font-size: 0.85rem;
}

.infoMessage span {
    line-height: 1.4;
}

.errorMessage {
    background-color: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.3);
    border-radius: 12px;
    padding: 0.75rem;
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
    gap: 0.75rem;
    padding: 1rem;
    margin-top: 1rem;
}

.loadingText {
    font-family: var(--font);
    color: var(--white);
    font-size: 0.9rem;
}

.constraintsDialogButtons {
    display: flex;
    gap: 0.5rem;
    padding: 0 0.5rem;
}

.saveButton {
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

.saveButton:hover:not(:disabled) {
    transform: scale(1.02) !important;
    filter: brightness(1.1) !important;
}

.saveButton:disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
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
