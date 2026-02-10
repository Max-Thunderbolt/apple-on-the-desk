<template>
    <div :class="['classFormWrapper', { 'inDialog': isEdit }]">
        <h1 class="pageTitle">{{ isEdit ? 'Edit class' : 'Add a Class' }}</h1>

        <div class="addClassForm">
            <div class="formGroup">
                <label class="formLabel">Class name</label>
                <input v-model="className" type="text" class="formInput" placeholder="e.g. 4T" maxlength="120" />
            </div>
            <div class="formGroup">
                <label class="formLabel">Students (one per line)</label>
                <textarea v-model="studentsText" class="formTextarea" :placeholder="placeholder" rows="10" />
            </div>
            <p v-if="duplicateStudentNames.length" class="formWarning">Duplicate name(s): {{
                duplicateStudentNames.join(', ') }}. Resolve duplicates to continue.</p>
            <p v-if="submitError" class="formError">{{ submitError }}</p>
            <div class="formActions">
                <v-btn class="cancelButton" @click="onCancel">
                    Cancel
                </v-btn>
                <v-btn class="submitButton" :disabled="!canSubmit || submitting" @click="submit">
                    {{ submitting ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save changes' : 'Create class') }}
                </v-btn>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Server from '../../services/server';

const studentsText = ref('');
const submitError = ref('');
const submitting = ref(false);
const placeholder = ref('Alice\nBob\nCharlie');
const className = ref('');

const props = defineProps({
    classData: {
        type: Object,
        default: null,
    },
});

const emit = defineEmits(['saved', 'cancel']);

const isEdit = computed(() => !!props.classData?.id);

watch(() => props.classData, (newClassData) => {
    if (newClassData?.name != null) {
        className.value = newClassData.name;
        studentsText.value = Array.isArray(newClassData.students)
            ? newClassData.students.map((s) => s.name || '').join('\n')
            : '';
    } else {
        className.value = '';
        studentsText.value = '';
    }
}, { immediate: true, deep: true });

const canSubmit = computed(() => {
    const name = className.value?.trim();
    const noDuplicates = duplicateStudentNames.value.length === 0;
    return !!name && name.length > 0 && noDuplicates;
});

function parseStudents() {
    return studentsText.value
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
}

/** Names that appear more than once (case-insensitive). Each duplicate name listed once. */
const duplicateStudentNames = computed(() => {
    const names = parseStudents();
    const seen = new Map();
    const duplicates = new Set();
    for (const name of names) {
        const key = name.toLowerCase();
        if (seen.has(key)) {
            duplicates.add(seen.get(key));
        } else {
            seen.set(key, name);
        }
    }
    return [...duplicates];
});

function onCancel() {
    emit('cancel');
}

async function submit() {
    if (!canSubmit.value || submitting.value) return;
    submitError.value = '';
    submitting.value = true;
    const name = className.value.trim();
    const lines = parseStudents();
    const existingStudents = props.classData?.students ?? [];
    const students = lines.map((studentName, index) => {
        const existing = existingStudents.find((s) => (s.name || '').toLowerCase() === studentName.toLowerCase());
        return existing
            ? { ...existing, name: studentName }
            : {
                id: `student-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}`}`,
                name: studentName,
                points: 0,
                experience: 0,
            };
    });
    const payload = {
        name,
        students,
        experience: props.classData?.experience ?? 0,
    };
    try {
        if (isEdit.value) {
            payload.id = props.classData.id;
            await Server.updateClass(props.classData.id, payload);
        } else {
            payload.id = crypto.randomUUID ? crypto.randomUUID() : `class-${Date.now()}`;
            await Server.createClass(payload);
        }
        emit('saved');
    } catch (err) {
        console.error(isEdit.value ? 'Failed to update class' : 'Failed to create class', err);
        submitError.value = err.response?.data?.message || (isEdit.value ? 'Could not update class. Please try again.' : 'Could not create class. Please try again.');
    } finally {
        submitting.value = false;
    }
}
</script>

<style scoped>
@import '../../styles/style.css';

.classFormWrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
}

.classFormWrapper.inDialog {
    padding: 0;
}

.pageTitle {
    font-family: var(--font);
    font-weight: 600;
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    color: var(--white);
    margin-bottom: 1.5rem;
    text-align: center;
}

.inDialog .pageTitle {
    font-size: clamp(1.5rem, 4vw, 2rem);
    margin-bottom: 1rem;
}

.addClassForm {
    width: 100%;
    max-width: 520px;
    padding: 1rem;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: linear-gradient(135deg,
            rgba(0, 23, 31, 0.6) 0%,
            rgba(0, 23, 31, 0.4) 50%,
            rgba(0, 23, 31, 0.5) 100%);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.12),
        0 4px 24px rgba(0, 0, 0, 0.2);
}

@media (min-width: 768px) {
    .addClassForm {
        padding: 2rem;
    }
}

.formGroup {
    margin-bottom: 1.5rem;
}

.formLabel {
    display: block;
    font-family: var(--font);
    font-size: 1rem;
    font-weight: 600;
    color: var(--white);
    margin-bottom: 0.5rem;
}

.formInput,
.formTextarea {
    width: 100%;
    padding: 0.75rem 1rem;
    font-family: var(--font);
    font-size: 1rem;
    color: var(--white);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    box-sizing: border-box;
}

.formInput::placeholder,
.formTextarea::placeholder {
    color: rgba(255, 255, 255, 0.5);
}

@media (hover: hover) {
    .formInput:hover,
    .formTextarea:hover {
        border-color: rgba(255, 255, 255, 0.3);
    }
}

.formInput:focus,
.formTextarea:focus {
    border-color: var(--freshSky);
    box-shadow: 0 0 0 2px rgba(0, 168, 232, 0.25);
}

.formTextarea {
    resize: vertical;
    min-height: 160px;
}

.formWarning {
    font-family: var(--font);
    font-size: 0.95rem;
    color: rgb(var(--gold-rgb));
    margin-bottom: 1rem;
}

.formError {
    font-family: var(--font);
    font-size: 0.95rem;
    color: var(--intenseCherry);
    margin-bottom: 1rem;
}

.formActions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
}

.cancelButton,
.submitButton {
    text-transform: none !important;
    font-family: var(--font) !important;
    font-weight: 600 !important;
    border-radius: 16px !important;
    padding: 0.6rem 1.25rem !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    transition:
        transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.3s ease,
        filter 0.3s ease;
}

.cancelButton {
    color: var(--white) !important;
    background: linear-gradient(135deg,
            rgba(255, 0, 0, 0.459) 0%,
            rgba(255, 0, 0, 0.459) 100%) !important;
}

.submitButton {
    color: var(--white) !important;
    background: linear-gradient(135deg,
            rgba(26, 147, 111, 0.55) 0%,
            rgba(26, 147, 111, 0.35) 50%,
            rgba(26, 147, 111, 0.45) 100%) !important;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 4px 16px rgba(26, 147, 111, 0.2);
}

@media (hover: hover) {
    .cancelButton:hover {
        transform: scale(1.02);
        border-color: rgba(255, 0, 0, 0.459) !important;
        filter: brightness(1.1);
    }

    .submitButton:hover:not(:disabled) {
        transform: scale(1.02) translateY(-2px);
        border-color: rgba(255, 255, 255, 0.35) !important;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            0 8px 24px rgba(26, 147, 111, 0.35);
        filter: brightness(1.08);
    }
}

.submitButton:disabled {
    opacity: 0.6;
}
</style>