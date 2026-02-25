<template>
    <v-dialog :model-value="modelValue" max-width="420" persistent transition="dialog-transition" class="createItemDialog"
        @click:outside="closeDialog" @update:model-value="emit('update:modelValue', $event)">
        <v-card class="createItemDialogCard">
            <v-card-title class="createItemDialogTitle">
                {{ title }}
            </v-card-title>
            <v-card-subtitle v-if="subtitle" class="createItemDialogSubtitle">
                {{ subtitle }}
            </v-card-subtitle>
            <v-card-text class="createItemDialogContent">
                <div class="formGroup">
                    <label class="formLabel">Name</label>
                    <input v-model="name" type="text" class="formInput" :placeholder="namePlaceholder" maxlength="120" />
                </div>
                <div class="formGroup">
                    <label class="formLabel">{{ numberLabel }}</label>
                    <input v-model.number="numberValue" type="number" class="formInput" min="0" step="1"
                        :placeholder="numberPlaceholder" />
                </div>
                <p v-if="submitError" class="formError">{{ submitError }}</p>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <div class="createItemDialogButtons">
                    <v-btn class="submitButton" variant="text" :disabled="!canSubmit || submitting" @click="submit">
                        {{ submitButtonText }}
                    </v-btn>
                    <v-btn class="cancelButton" variant="text" @click="closeDialog" :disabled="submitting">Cancel</v-btn>
                </div>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Server from '../../services/server';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },
    /** 'pointsCategory' | 'shopItem' */
    type: {
        type: String,
        required: true,
        validator: (v) => ['pointsCategory', 'shopItem'].includes(v),
    },
    /** When set, modal is in edit mode (prefilled, submit calls update). Points: { id?, _id?, name, value }. Shop: { _id, name, cost }. */
    editingItem: {
        type: Object,
        default: null,
    },
});

const emit = defineEmits(['update:modelValue', 'saved']);

const name = ref('');
const numberValue = ref('');
const submitError = ref('');
const submitting = ref(false);

const isEdit = computed(() => !!props.editingItem);
const title = computed(() => {
    if (props.type === 'pointsCategory') return isEdit.value ? 'Edit point category' : 'Create point category';
    return isEdit.value ? 'Edit shop item' : 'Create shop item';
});
const subtitle = computed(() => {
    if (isEdit.value) return '';
    return props.type === 'pointsCategory' ? 'Add a new category for awarding points.' : 'Add a new item to the shop.';
});
const submitButtonText = computed(() => {
    if (submitting.value) return isEdit.value ? 'Saving…' : 'Creating…';
    return isEdit.value ? 'Save' : 'Create';
});
const numberLabel = computed(() =>
    props.type === 'pointsCategory' ? 'Points value' : 'Cost (points)');
const numberPlaceholder = computed(() =>
    props.type === 'pointsCategory' ? 'e.g. 10' : 'e.g. 50');
const namePlaceholder = computed(() =>
    props.type === 'pointsCategory' ? 'e.g. Participation' : 'e.g. Homework pass');

const canSubmit = computed(() => {
    const n = name.value?.trim();
    const num = Number(numberValue.value);
    return !!n && n.length > 0 && !Number.isNaN(num) && num >= 0;
});

watch(() => [props.modelValue, props.editingItem], ([open, item]) => {
    if (open) {
        submitError.value = '';
        if (item) {
            name.value = item.name ?? '';
            numberValue.value = props.type === 'pointsCategory' ? (item.value ?? '') : (item.cost ?? '');
        } else {
            name.value = '';
            numberValue.value = '';
        }
    }
}, { deep: true });

function closeDialog() {
    emit('update:modelValue', false);
}

function getEditId() {
    const item = props.editingItem;
    if (!item) return null;
    if (props.type === 'pointsCategory') return item.id ?? (item._id != null ? String(item._id) : null);
    return item._id != null ? String(item._id) : null;
}

async function submit() {
    if (!canSubmit.value || submitting.value) return;
    submitError.value = '';
    submitting.value = true;
    const trimmedName = name.value.trim();
    const num = Number(numberValue.value);
    const editId = getEditId();

    try {
        if (props.type === 'pointsCategory') {
            if (editId) {
                const response = await Server.updatePointsCategory(editId, { name: trimmedName, value: num });
                emit('saved', response.pointsCategory);
            } else {
                const response = await Server.createPointsCategory({ name: trimmedName, value: num });
                emit('saved', response.pointsCategory);
            }
        } else {
            if (editId) {
                const response = await Server.updateShopItem(editId, { name: trimmedName, cost: num });
                emit('saved', response.shopItem);
            } else {
                const response = await Server.createShopItem({ name: trimmedName, cost: num });
                emit('saved', response.shopItem);
            }
        }
        closeDialog();
    } catch (err) {
        console.error(editId ? 'Failed to update' : 'Failed to create', err);
        submitError.value = err.response?.data?.message || (editId ? 'Could not update. Please try again.' : 'Could not create. Please try again.');
    } finally {
        submitting.value = false;
    }
}
</script>

<style scoped>
@import '../../styles/style.css';

.createItemDialogCard {
    background-color: var(--inkBlack);
    border-radius: 25px;
    border: 1px solid var(--white);
    padding: 0 0 0.5rem;
}

.createItemDialogTitle {
    font-family: var(--font);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--white);
    text-align: center;
    padding: 0.5rem 0;
}

.createItemDialogSubtitle {
    font-family: var(--font);
    padding-top: 0;
    font-size: 1rem;
    font-weight: 500;
    color: var(--white);
    opacity: 0.8;
    text-align: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--white);
}

.createItemDialogContent {
    padding-top: 1rem;
}

.formGroup {
    margin-bottom: 1rem;
}

.formLabel {
    display: block;
    font-family: var(--font);
    font-size: 1rem;
    font-weight: 600;
    color: var(--white);
    margin-bottom: 0.5rem;
}

.formInput {
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

.formInput::placeholder {
    color: rgba(255, 255, 255, 0.5);
}

.formInput:focus {
    border-color: var(--freshSky);
    box-shadow: 0 0 0 2px rgba(0, 168, 232, 0.25);
}

.formError {
    font-family: var(--font);
    font-size: 0.95rem;
    color: var(--intenseCherry);
    margin-top: 0.5rem;
}

.createItemDialogButtons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
    width: 100%;
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
}

.submitButton {
    font-family: var(--font);
    font-size: 1rem;
    font-weight: 500;
    color: var(--white);
    background-color: var(--seaGreen);
    border-radius: 12px;
    padding: 0.5rem 1rem;
}

.submitButton:disabled {
    opacity: 0.6;
}

@media (hover: hover) {
    .cancelButton:hover {
        filter: brightness(1.1);
    }

    .submitButton:hover:not(:disabled) {
        box-shadow: 0 0 10px 0 rgba(26, 147, 111, 0.5);
    }
}
</style>
