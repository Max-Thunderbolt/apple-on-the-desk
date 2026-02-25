<template>
    <v-breadcrumbs density="compact" :items="[{ title: 'Home', to: '/' }, { title: 'Classes', to: '/classes' }]"
        class="breadcrumbs">
        <template v-slot:divider>
            <v-icon>mdi-chevron-right</v-icon>
        </template>
    </v-breadcrumbs>
    <div class="container" style="justify-content: flex-start !important;">
        <div class="title">My Classes <v-btn class="addClassButton_Classes" @click="openAddClassModal">
                <v-icon>mdi-plus</v-icon>
            </v-btn>
        </div>
        <div class="classContainer">
            <div v-if="classes.length === 0">
                <div class="emptyState" style="text-align: center; font-family: var(--font); font-size: 1.5rem;">
                    No classes yet! Let's create one by clicking the + button above.
                </div>

            </div>
            <template v-for="classItem in classes" :key="classItem.name">
                <v-card class="classCard" :style="{ '--card-glass-color': getCardColorRgba(classItem) }"
                    @click="navigateTo(`/Class/${classItem.id}`)"
                    @contextmenu.prevent="openContextMenu($event, classItem)">
                    <v-card-title
                        style="font-size: 2rem; font-weight: 600; text-align: center; font-family: var(--font);">
                        {{ classItem.name }}
                    </v-card-title>
                    <v-card-subtitle style="text-align: center; font-family: var(--font);">
                        {{ classItem.numberOfStudents }} students
                    </v-card-subtitle>
                    <v-card-text style="text-align: center; font-family: var(--font);">
                        {{ classItem.experience }} exp
                    </v-card-text>
                    <v-card-text style="text-align: center; font-family: var(--font); font-size: 1.5rem;">
                        {{ experienceToRank(classItem.experience).icon }} {{ experienceToRank(classItem.experience).name
                        }}
                    </v-card-text>
                    <!-- <v-card-actions style="justify-content: center; font-family: var(--font); gap: 10px;">
                        <v-btn class="classShopButton" @click.stop="navigateTo(`/Class/${classItem.id}/shop`)">
                            <v-icon>mdi-cart</v-icon>
                            Shop
                        </v-btn>
                    </v-card-actions> -->
                </v-card>
            </template>

            <div v-if="contextMenuClass" class="contextMenuBackdrop" @click="closeContextMenu">
                <div class="contextMenu" :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }" @click.stop>
                    <button class="contextMenuItem" @click="openEditClassModal">
                        <v-icon size="small">mdi-pencil</v-icon>
                        Edit class
                    </button>
                    <button class="contextMenuItem contextMenuItemDanger" @click="deleteSelectedClass">
                        <v-icon size="small">mdi-delete</v-icon>
                        Delete class
                    </button>
                </div>
            </div>
        </div>
        <v-dialog v-model="editClassModal" max-width="600" persistent transition="dialog-transition"
            class="editClassModal" @click:outside="closeEditClassModal">
            <v-card class="editClassModalCard">
                <ClassForm v-if="classToEdit" :class-data="classToEdit" @saved="onEditSaved"
                    @cancel="closeEditClassModal" />
            </v-card>
        </v-dialog>
        <v-dialog v-model="addClassModal" max-width="600" persistent transition="dialog-transition"
            class="addClassModal" @click:outside="closeAddClassModal">
            <v-card class="addClassModalCard">
                <ClassForm @saved="onAddSaved" @cancel="closeAddClassModal" />
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted } from 'vue';
import { useClasses } from '../composables/useClasses';
import { experienceToRank } from '../composables/useExperience';
import ClassForm from './modals/ClassForm.vue';

const { classes, loadClasses, getClassById, deleteClass } = useClasses();
const router = useRouter();
const contextMenuClass = ref(null);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const editClassModal = ref(false);
const addClassModal = ref(false);
const classToEdit = ref(null);

const CARD_COLOURS = [
    '#493657ff',
    '#ce7da5ff',
    '#bee5bfff',
    '#a5402dff',
    '#285943ff'
];

/** Same palette as rgba for glass effect */
const CARD_COLOURS_RGBA = [
    '73, 54, 87',
    '206, 125, 165',
    '190, 229, 191',
    '165, 64, 45',
    '40, 89, 67'
];

const getCardColor = (classItem) => {
    const id = String(classItem.id ?? classItem.name ?? 0);
    let n = 0;
    for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
    return CARD_COLOURS[n % CARD_COLOURS.length];
};

const getCardColorRgba = (classItem) => {
    const id = String(classItem.id ?? classItem.name ?? 0);
    let n = 0;
    for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
    return CARD_COLOURS_RGBA[n % CARD_COLOURS_RGBA.length];
};

function openContextMenu(e, classItem) {
    contextMenuClass.value = classItem;
    contextMenuX.value = e.clientX;
    contextMenuY.value = e.clientY;
}

function closeContextMenu() {
    contextMenuClass.value = null;
}

async function deleteSelectedClass() {
    if (!contextMenuClass.value) return;
    const id = contextMenuClass.value.id;
    try {
        await deleteClass(id);
        classes.value = classes.value.filter((c) => c.id !== id);
    } catch (err) {
        console.error('Failed to delete class:', err);
    }
    closeContextMenu();
}

async function openEditClassModal() {
    const id = contextMenuClass.value?.id;
    closeContextMenu();
    if (!id) return;
    try {
        classToEdit.value = await getClassById(id);
        editClassModal.value = true;
    } catch (err) {
        console.error('Failed to load class for edit:', err);
    }
}

function closeEditClassModal() {
    editClassModal.value = false;
    classToEdit.value = null;
}

function onEditSaved() {
    closeEditClassModal();
    loadClasses();
}

function openAddClassModal() {
    addClassModal.value = true;
}

function closeAddClassModal() {
    addClassModal.value = false;
}

function onAddSaved() {
    closeAddClassModal();
    loadClasses();
}

onMounted(() => {
    loadClasses();
});

onUnmounted(() => {
    closeContextMenu();
});

const navigateTo = (path) => {
    router.push(path);
};
</script>

<style>
@import '../styles/style.css';

.classContainer {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 20px;
}

.classCard {
    --card-glass-color: 73, 54, 87;
    justify-content: center;
    color: var(--white) !important;
    width: 100%;
    max-width: 400px;
    border-radius: 20px !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    background: linear-gradient(135deg,
            rgba(var(--card-glass-color), 0.55) 0%,
            rgba(var(--card-glass-color), 0.35) 50%,
            rgba(var(--card-glass-color), 0.45) 100%) !important;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 4px 24px rgba(0, 0, 0, 0.2);
    transition:
        transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
        border-color 0.3s ease;
}

@media (min-width: 600px) {
    .classCard {
        width: 300px;
    }
}

@media (hover: hover) {
    .classCard:hover {
        transform: scale(1.02) translateY(-6px);
        border-color: rgba(255, 255, 255, 0.35) !important;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.25),
            0 12px 40px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1);
    }
}

.cardDivider {
    padding-top: 12px;
    width: 100% !important;
    margin: 10px 0 !important;
}

.classShopButton {
    color: var(--white) !important;
    border-radius: 16px !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    background: linear-gradient(135deg,
            rgba(26, 147, 111, 0.55) 0%,
            rgba(26, 147, 111, 0.35) 50%,
            rgba(26, 147, 111, 0.45) 100%) !important;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 2px 12px rgba(26, 147, 111, 0.2);
    gap: 10px;
    font-family: var(--font);
    font-size: 1.2rem;
    text-transform: none;
    transition:
        transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.3s ease,
        filter 0.3s ease;
}

.classShopButton:hover {
    transform: scale(1.02) translateY(-2px);
    border-color: rgba(255, 255, 255, 0.35) !important;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.3),
        0 8px 24px rgba(26, 147, 111, 0.35);
    filter: brightness(1.08);
}

.contextMenuBackdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
}

.contextMenu {
    position: fixed;
    min-width: 160px;
    padding: 4px 0;
    background: linear-gradient(135deg,
            rgba(0, 23, 31, 0.92) 0%,
            rgba(0, 23, 31, 0.88) 100%);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 1001;
}

.contextMenuItem {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 14px;
    border: none;
    background: none;
    color: var(--white);
    font-family: var(--font);
    font-size: 0.95rem;
    text-align: left;
    cursor: pointer;
    transition: background 0.2s ease;
}


@media (hover: hover) {
    .contextMenuItem:hover {
        background: rgba(255, 255, 255, 0.08);
    }

    .contextMenuItemDanger:hover {
        border-radius: 15px !important;
        background: rgba(197, 40, 61, 0.25);
        color: var(--intenseCherry);
    }
}

.addClassButton_Classes {
    background: linear-gradient(135deg,
            rgba(0, 168, 232, 0.55) 0%,
            rgba(0, 168, 232, 0.35) 50%,
            rgba(0, 168, 232, 0.45) 100%) !important;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 4px 24px rgba(0, 168, 232, 0.15);
    padding: 0.5rem 1rem !important;
    transition: all 0.3s ease !important;
    border-radius: 180px !important;
    cursor: pointer !important;
    height: 50px !important;
    width: 30px !important;
}

.editClassModalCard,
.addClassModalCard {
    width: 100% !important;
    padding: 1rem !important;
    border-radius: 20px !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    background: linear-gradient(135deg,
            rgba(0, 23, 31, 0.6) 0%,
            rgba(0, 23, 31, 0.4) 50%,
            rgba(0, 23, 31, 0.5) 100%) !important;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.12),
        0 4px 24px rgba(0, 0, 0, 0.2) !important;
}

@media (min-width: 768px) {

    .editClassModalCard,
    .addClassModalCard {
        padding: 2rem !important;
    }
}
</style>