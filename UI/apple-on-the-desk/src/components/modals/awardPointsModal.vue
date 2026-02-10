<template>
    <v-dialog v-model="pointsDialogOpen" max-width="420" persistent transition="dialog-transition" class="pointsDialog"
        @click:outside="closePointsDialog">
        <v-card class="pointsDialogCard">
            <v-card-title class="pointsDialogTitle">
                Award points
            </v-card-title>
            <v-card-subtitle class="pointsDialogSubtitle">
                Choose a category
            </v-card-subtitle>
            <v-card-text class="pointsDialogList">
                <div v-for="category in pointsCategories" :key="category._id || category.id || category.name"
                    class="pointsCategoryItem" @click="awardPoints(category)">
                    <span class="pointsCategoryName">{{ category.name }}</span>
                    <span class="pointsCategoryValue">+{{ formatCost(category.value) }}</span>
                </div>
                <div v-if="pointsCategories.length === 0 && !pointsCategoriesLoading" class="noCategories">
                    No point categories available.
                </div>
                <div v-if="pointsCategoriesLoading" class="loadingCategories">
                    Loading…
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <div class="pointsDialogButtons">
                    <v-btn class="pointsDialogAwardButton" variant="text" @click="createPointsCategory">Create
                        Category</v-btn>
                    <v-btn class="pointsDialogCancelButton" variant="text" @click="closePointsDialog">Cancel</v-btn>
                </div>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import PointsController from '../../controllers/PointsController';

const pointsCategories = ref([]);
const pointsCategoriesLoading = ref(false);


const props = defineProps({
    selectedStudents: {
        type: Array,
        required: true,
        default: () => [],
    },
    allStudents: {
        type: Array,
        required: true,
        default: () => [],
    },
    pointsDialogOpen: {
        type: Boolean,
        required: true,
        default: true,
    },
    classId: {
        type: String,
        required: true,
    },
});
let pointsManager = null;

const emit = defineEmits(['update:pointsDialogOpen', 'update:selectedStudents', 'studentsUpdated']);

const pointsDialogOpen = computed({
    get: () => props.pointsDialogOpen,
    set: (value) => emit('update:pointsDialogOpen', value),
});

watch(() => props.classId, (classId) => {
    console.log('classId', classId);
    if (classId) {
        pointsManager = new PointsController(classId);
        loadPointsCategories();
    }
}, { immediate: true });

watch(pointsCategories, (categories) => {
    console.log('pointsCategories', categories);
    if (categories.length > 0) {
        console.log('pointsCategories is not empty');
        pointsCategoriesLoading.value = false;
        pointsCategories.value = categories;
    } else {
        console.log('pointsCategories is empty');
        pointsCategoriesLoading.value = false;
    }
});

async function loadPointsCategories() {
    pointsCategoriesLoading.value = true;
    pointsCategories.value = [];
    try {
        const data = await pointsManager.getPointsCategories();
        pointsCategories.value = data ?? [];
    } catch (err) {
        console.error('Failed to load points categories:', err);
    } finally {
        pointsCategoriesLoading.value = false;
    }
}

async function awardPoints(category) {
    console.log('=== FRONTEND AWARD POINTS ===');
    console.log('Category:', category);
    const categoryId = category.id || category._id;
    console.log('Category ID:', categoryId);
    console.log('Category Value:', category.value);
    console.log('Selected students count:', props.selectedStudents.length);
    console.log('All students count:', props.allStudents.length);
    console.log('============================');
    const selectedStudents = props.selectedStudents;
    const allStudents = props.allStudents;
    const updatedStudents = await pointsManager.awardPoints(categoryId, selectedStudents, allStudents);
    emit('update:selectedStudents', []);
    emit('studentsUpdated', updatedStudents);
    closePointsDialog();
}

function formatCost(cost) {
    const n = Number(cost);
    if (Number.isNaN(n)) return String(cost ?? '—');
    if (n % 1 === 0) {
        return `${n.toLocaleString()} pts`;
    } else {
        return `${n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pts`;
    }
}

function openPointsDialog(students) {
    emit('update:selectedStudents', students);
    emit('update:pointsDialogOpen', true);
}

function closePointsDialog() {
    emit('update:pointsDialogOpen', false);
    emit('update:selectedStudents', []);
}

function createPointsCategory() {
    console.log('Create points category clicked');
    // TODO: Implement points category creation dialog
    alert('Create Points Category feature coming soon!');
}
</script>

<style>
@import '../../styles/style.css';

.pointsDialogCard {
    background-color: var(--inkBlack);
    border-radius: 25px;
    border: 1px solid var(--white);
    padding: 0 0 0.5rem;
}

.pointsDialogTitle {
    font-family: var(--font);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--white);
    text-align: center;
    padding: 0.5rem 0;
}

.pointsDialogSubtitle {
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

.pointsDialogList {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.5rem;
}

.pointsCategoryItem {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background-color: var(--inkBlack);
    color: var(--white);
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.15s ease;
}

.pointsCategoryItem:hover {
    background-color: var(--seaGreen);
}

.pointsCategoryName {
    font-family: var(--font);
    font-weight: 500;
}

.pointsCategoryValue {
    font-weight: 600;
    color: var(--seaGreen);
}

.pointsCategoryItem:hover .pointsCategoryValue {
    color: var(--white);
}

.noCategories,
.loadingCategories {
    font-family: var(--font);
    font-size: 1rem;
    font-weight: 500;
    color: var(--white);
    opacity: 0.8;
    text-align: center;
    padding: 1rem;
}

.pointsDialogCancelButton {
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

    &:hover {
        transform: scale(1.02) !important;
        border-color: rgba(255, 0, 0, 0.459) !important;
        filter: brightness(1.1) !important;
    }
}

.pointsDialogAwardButton {
    font-family: var(--font);
    font-size: 1rem;
    font-weight: 500;
    color: var(--white);
    background-color: var(--seaGreen);
    border-radius: 12px;
    padding: 0.5rem 1rem;
}

.pointsDialogAwardButton:hover {
    transform: scale(1.02);
    background-color: var(--seaGreen);
    color: var(--white);
    border: none;
    box-shadow: 0 0 10px 0 rgba(26, 147, 111, 0.5);
    transition: all 0.3s ease;
}

.pointsDialogButtons {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1rem;
    width: 100%;
}
</style>