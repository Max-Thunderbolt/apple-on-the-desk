<template>
    <v-breadcrumbs density="compact" :items="breadcrumbs" class="breadcrumbs">
        <template v-slot:divider>
            <v-icon>mdi-chevron-right</v-icon>
        </template>
    </v-breadcrumbs>
    <div class="container addClassContainer">
        <h1 class="pageTitle">Add a Class</h1>

        <div class="addClassForm">
            <div class="formGroup">
                <label class="formLabel">Class name</label>
                <input v-model="className" type="text" class="formInput" placeholder="e.g. 4T" maxlength="120" />
            </div>
            <div class="formGroup">
                <label class="formLabel">Students (one per line)</label>
                <textarea v-model="studentsText" class="formTextarea" placeholder="Alice&#10;Bob&#10;Charlie"
                    rows="10" />
            </div>
            <p v-if="submitError" class="formError">{{ submitError }}</p>
            <div class="formActions">
                <v-btn class="cancelButton" @click="navigateTo('/Classes')">
                    Cancel
                </v-btn>
                <v-btn class="submitButton" :disabled="!canSubmit || submitting" @click="submit">
                    {{ submitting ? 'Creating…' : 'Create class' }}
                </v-btn>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { createClass } from '../services/server';

const router = useRouter();
const className = ref('');
const studentsText = ref('');
const submitError = ref('');
const submitting = ref(false);

const breadcrumbs = [
    { title: 'Home', to: '/' },
    { title: 'Classes', to: '/Classes' },
    { title: 'Add class', to: '/AddClass' },
];

const canSubmit = computed(() => {
    const name = className.value?.trim();
    return !!name && name.length > 0;
});

function parseStudents() {
    return studentsText.value
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
}

async function submit() {
    if (!canSubmit.value || submitting.value) return;
    submitError.value = '';
    submitting.value = true;
    const name = className.value.trim();
    const lines = parseStudents();
    const students = lines.map((studentName, index) => ({
        id: `student-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}`}`,
        name: studentName,
        points: 0,
        experience: 0,
    }));
    const payload = {
        id: crypto.randomUUID ? crypto.randomUUID() : `class-${Date.now()}`,
        name,
        students,
        experience: 0,
    };
    try {
        await createClass(payload);
        router.push('/Classes');
    } catch (err) {
        console.error('Failed to create class:', err);
        submitError.value = err.response?.data?.message || 'Could not create class. Please try again.';
    } finally {
        submitting.value = false;
    }
}

function navigateTo(path) {
    router.push(path);
}
</script>

<style scoped>
@import '../styles/style.css';

.addClassContainer {
    justify-content: flex-start !important;
    padding-top: 1rem;
    padding-bottom: 2rem;
}

.pageTitle {
    font-family: var(--font);
    font-weight: 600;
    font-size: 2.5rem;
    color: var(--white);
    margin-bottom: 1.5rem;
    text-align: center;
}

.addClassForm {
    width: 100%;
    max-width: 520px;
    padding: 2rem;
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

.formInput:hover,
.formTextarea:hover {
    border-color: rgba(255, 255, 255, 0.3);
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

.cancelButton:hover {
    transform: scale(1.02);
    border-color: rgba(255, 0, 0, 0.459) !important;
    filter: brightness(1.1);
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

.submitButton:hover:not(:disabled) {
    transform: scale(1.02) translateY(-2px);
    border-color: rgba(255, 255, 255, 0.35) !important;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.3),
        0 8px 24px rgba(26, 147, 111, 0.35);
    filter: brightness(1.08);
}

.submitButton:disabled {
    opacity: 0.6;
}
</style>
