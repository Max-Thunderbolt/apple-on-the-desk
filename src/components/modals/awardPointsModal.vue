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
                    class="pointsCategoryItem" @click="awardPoints(category)"
                    @contextmenu.prevent="openCategoryContextMenu($event, category)">
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
                    <v-btn class="pointsDialogAwardButton" variant="text" @click="openCreateCategoryModal">Create
                        Category</v-btn>
                    <v-btn class="pointsDialogCancelButton" variant="text" @click="closePointsDialog">Cancel</v-btn>
                </div>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-menu v-model="categoryContextMenuOpen" :style="{ position: 'fixed', left: categoryContextMenuX + 'px', top: categoryContextMenuY + 'px' }"
        :location="undefined" :attach="false" class="pointsCategoryContextMenu">
        <v-list class="contextMenuList">
            <v-list-item @click="openEditCategoryModal">
                <template v-slot:prepend><v-icon size="small">mdi-pencil</v-icon></template>
                <v-list-item-title>Edit</v-list-item-title>
            </v-list-item>
            <v-list-item @click="deleteCategoryFromMenu">
                <template v-slot:prepend><v-icon size="small">mdi-delete</v-icon></template>
                <v-list-item-title>Delete</v-list-item-title>
            </v-list-item>
        </v-list>
    </v-menu>
    <CreateItemModal v-model="createCategoryModalOpen" type="pointsCategory" :editing-item="categoryToEdit"
        @saved="onCategorySaved" />
</template>

<script setup>
import { ref, watch, computed, toRef } from 'vue';
import { usePoints } from '../../composables/usePoints';
import CreateItemModal from './CreateItemModal.vue';

const pointsCategories = ref([]);
const pointsCategoriesLoading = ref(false);
const createCategoryModalOpen = ref(false);
const categoryToEdit = ref(null);
const categoryContextMenuOpen = ref(false);
const categoryContextMenuX = ref(0);
const categoryContextMenuY = ref(0);
const categoryContextTarget = ref(null);

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
    isForGroup: {
        type: Boolean,
        default: false,
    },
});

const { getPointsCategories, awardPoints: awardPointsApi, deletePointsCategory } = usePoints(toRef(props, 'classId'));

const emit = defineEmits(['update:pointsDialogOpen', 'update:selectedStudents', 'studentsUpdated']);

const pointsDialogOpen = computed({
    get: () => props.pointsDialogOpen,
    set: (value) => emit('update:pointsDialogOpen', value),
});

watch(() => props.classId, () => {
    if (props.classId) {
        loadPointsCategories();
    }
}, { immediate: true });

watch(pointsCategories, (categories) => {
    if (categories.length > 0) {
        pointsCategoriesLoading.value = false;
        pointsCategories.value = categories;
    } else {
        pointsCategoriesLoading.value = false;
    }
});

async function loadPointsCategories() {
    pointsCategoriesLoading.value = true;
    pointsCategories.value = [];
    try {
        const data = await getPointsCategories();
        pointsCategories.value = data ?? [];
    } catch (err) {
        console.error('Failed to load points categories:', err);
    } finally {
        pointsCategoriesLoading.value = false;
    }
}

async function awardPointsHandler(category) {
    const categoryId = category.id || category._id;
    const selectedStudents = props.selectedStudents;
    const allStudents = props.allStudents;
    const updatedStudents = await awardPointsApi(categoryId, selectedStudents, allStudents, props.isForGroup);
    emit('update:selectedStudents', []);
    emit('studentsUpdated', updatedStudents);
    closePointsDialog();
}

// Template calls awardPoints(category)
const awardPoints = awardPointsHandler;

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

function openCreateCategoryModal() {
    categoryToEdit.value = null;
    createCategoryModalOpen.value = true;
}

function openCategoryContextMenu(e, category) {
    categoryContextTarget.value = category;
    categoryContextMenuX.value = e.clientX;
    categoryContextMenuY.value = e.clientY;
    categoryContextMenuOpen.value = true;
}

function openEditCategoryModal() {
    if (categoryContextTarget.value) {
        categoryToEdit.value = categoryContextTarget.value;
        categoryContextMenuOpen.value = false;
        createCategoryModalOpen.value = true;
    }
    categoryContextTarget.value = null;
}

async function deleteCategoryFromMenu() {
    const cat = categoryContextTarget.value;
    categoryContextMenuOpen.value = false;
    categoryContextTarget.value = null;
    if (!cat) return;
    const categoryId = cat.id || cat._id;
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    try {
        await deletePointsCategory(categoryId);
        loadPointsCategories();
    } catch (err) {
        console.error('Failed to delete category:', err);
        alert('Could not delete category. Please try again.');
    }
}

function onCategorySaved() {
    categoryToEdit.value = null;
    loadPointsCategories();
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

.pointsDialog {
    max-width: 90vw;
}

@media (min-width: 600px) {
    .pointsDialog {
        max-width: 420px;
    }
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

.pointsCategoryName {
    font-family: var(--font);
    font-weight: 500;
}

.pointsCategoryValue {
    font-weight: 600;
    color: var(--seaGreen);
}

@media (hover: hover) {
    .pointsCategoryItem:hover {
        background-color: var(--seaGreen);
    }

    .pointsCategoryItem:hover .pointsCategoryValue {
        color: var(--white);
    }
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

@media (hover: hover) {
    .pointsDialogCancelButton:hover {
        transform: scale(1.02) !important;
        border-color: rgba(255, 0, 0, 0.459) !important;
        filter: brightness(1.1) !important;
    }

    .pointsDialogAwardButton:hover {
        transform: scale(1.02);
        background-color: var(--seaGreen);
        color: var(--white);
        border: none;
        box-shadow: 0 0 10px 0 rgba(26, 147, 111, 0.5);
        transition: all 0.3s ease;
    }
}

.pointsDialogButtons {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1rem;
    width: 100%;
}

.contextMenuList {
    background-color: var(--inkBlack) !important;
    border: 1px solid var(--white);
    border-radius: 12px;
    padding: 0.25rem 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.contextMenuList .v-list-item {
    font-family: var(--font);
    color: var(--white);
    min-height: 40px;
}

@media (hover: hover) {
    .contextMenuList .v-list-item:hover {
        background-color: var(--seaGreen) !important;
    }
}
</style>