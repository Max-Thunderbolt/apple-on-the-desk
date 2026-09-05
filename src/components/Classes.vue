<template>
    <div class="container classesPage">
        <div class="classesShell">
            <TeacherNav />

            <header class="classesHeader">
                <div class="classesHeaderLeft">
                    <!-- <p class="classesEyebrow">Teaching</p> -->
                    <h1 class="classesTitle">My <span class="titleAccent">Classes</span></h1>
                    <!-- <p class="classesSubtitle">Open a class to award points, run the shop, or manage groups.</p> -->
                </div>
            </header>

            <v-alert v-if="showWelcomeBanner" type="success" variant="tonal" class="welcomeAlert" rounded="lg" closable
                @click:close="dismissWelcomeBanner">
                <div class="welcomeAlertBody">
                    <p class="welcomeAlertTitle">Welcome to {{ welcomeSchoolName }}!</p>
                    <p class="welcomeAlertText">Create your first class to start awarding points.</p>
                    <div class="welcomeAlertActions">
                        <v-btn size="small" class="welcomeAlertBtn" @click="openAddClassModal">Create class</v-btn>
                        <v-btn size="small" variant="text" class="welcomeSkipBtn" @click="dismissWelcomeBanner">Skip for
                            now</v-btn>
                    </div>
                </div>
            </v-alert>

            <p v-if="!canCreateClass" class="classCreateHint">
                Join a school as a teacher to create classes.
                <router-link to="/Teacher" class="classCreateHintLink">Go to Teacher settings</router-link>
            </p>

            <div v-if="classesLoading" class="skeletonGrid">
                <v-skeleton-loader v-for="n in 3" :key="n" type="card" class="classSkeleton" />
            </div>

            <div v-else-if="filteredClasses.length === 0 && classes.length === 0" class="emptyStateBlock">
                <v-icon size="64" class="emptyStateIcon">mdi-google-classroom-outline</v-icon>
                <h2 class="emptyStateTitle">No classes yet</h2>
                <p class="emptyStateText">Create your first class to start awarding points and tracking rank progress.
                </p>
                <v-btn v-if="canCreateClass" class="emptyStateBtn" prepend-icon="mdi-plus" @click="openAddClassModal">
                    Create your first class
                </v-btn>
                <router-link to="/Onboarding" class="emptyStateLink">Watch tutorials</router-link>
            </div>

            <div v-else-if="filteredClasses.length === 0" class="emptyStateBlock emptyStateBlock--compact">
                <p class="emptyStateText">No classes match "{{ searchQuery }}".</p>
            </div>

            <!-- Card view -->
            <div v-else-if="viewMode === 'cards'" class="classContainer">
                <v-card v-for="classItem in filteredClasses" :key="classItem.id" class="classCard"
                    :style="{ '--card-glass-color': getCardColorRgba(classItem) }" tabindex="0" role="button"
                    :aria-label="`Open class ${classItem.name}`" @click="navigateTo(`/Class/${classItem.id}`)"
                    @keyup.enter="navigateTo(`/Class/${classItem.id}`)"
                    @keyup.space.prevent="navigateTo(`/Class/${classItem.id}`)"
                    @contextmenu.prevent="openContextMenu($event, classItem)">
                    <button type="button" class="classCardMenuBtn" aria-label="Class actions"
                        @click.stop="openContextMenuFromButton($event, classItem)">
                        <v-icon size="small">mdi-dots-vertical</v-icon>
                    </button>
                    <v-card-title class="classCardTitle" :title="classItem.name">
                        {{ classItem.name }}
                    </v-card-title>
                    <v-card-subtitle class="classCardSubtitle">
                        {{ classItem.numberOfStudents }} {{ classItem.numberOfStudents === 1 ? 'student' : 'students' }}
                    </v-card-subtitle>
                    <v-card-text class="classProgressSection">
                        <div class="classProgressBarTrack">
                            <div class="classProgressBarFill" :style="{ width: classItem.progressPercent + '%' }" />
                        </div>
                        <span class="classProgressLabel">
                            {{ classItem.isMaxRank ? 'Max rank reached' : `${classItem.xpToNext} XP to
                            ${classItem.nextRankName}` }}
                        </span>
                    </v-card-text>
                    <v-card-text class="classRankRow">
                        <RankBadge :rank-index="classItem.rankIndex" :aria-label="`${classItem.rankName} rank badge`"
                            badge-class="classRankBadge" />
                        <span>{{ classItem.rankName }}</span>
                    </v-card-text>
                    <v-card-text v-if="classItem.topStudents?.length" class="classTopStudents">
                        <TopStudentChips :students="classItem.topStudents" />
                    </v-card-text>
                </v-card>
            </div>

            <!-- List view -->
            <ul v-else class="classListView">
                <li v-for="classItem in filteredClasses" :key="classItem.id" class="classListRow" tabindex="0"
                    role="button" :aria-label="`Open class ${classItem.name}`"
                    @click="navigateTo(`/Class/${classItem.id}`)" @keyup.enter="navigateTo(`/Class/${classItem.id}`)"
                    @keyup.space.prevent="navigateTo(`/Class/${classItem.id}`)"
                    @contextmenu.prevent="openContextMenu($event, classItem)">
                    <RankBadge :rank-index="classItem.rankIndex" :aria-label="`${classItem.rankName} rank badge`"
                        badge-class="classListRankBadge" />
                    <div class="classListMain">
                        <span class="classListName" :title="classItem.name">{{ classItem.name }}</span>
                        <span class="classListMeta">
                            {{ classItem.numberOfStudents }} students · {{ classItem.rankName }}
                        </span>
                        <div class="classListProgressTrack">
                            <div class="classListProgressFill" :style="{ width: classItem.progressPercent + '%' }" />
                        </div>
                    </div>
                    <button type="button" class="classListMenuBtn" aria-label="Class actions"
                        @click.stop="openContextMenuFromButton($event, classItem)">
                        <v-icon size="small">mdi-dots-vertical</v-icon>
                    </button>
                </li>
            </ul>

            <AppContextMenu :open="isContextMenuOpen" :x="contextMenuX" :y="contextMenuY" :min-width="200"
                :items="contextMenuItems" @close="contextMenu.close()" @select="handleContextMenuAction" />

            <v-dialog v-model="deleteDialogOpen" max-width="420" persistent>
                <v-card class="confirmCard">
                    <v-card-title class="confirmTitle">Delete class?</v-card-title>
                    <v-card-text class="confirmText">
                        Delete "{{ classToDelete?.name }}"? This cannot be undone.
                    </v-card-text>
                    <v-card-actions class="confirmActions">
                        <v-spacer />
                        <v-btn variant="text" :disabled="deleting" @click="closeDeleteDialog">Cancel</v-btn>
                        <v-btn color="error" :loading="deleting" @click="confirmDeleteClass">Delete</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

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

            <award-points-modal v-model:pointsDialogOpen="awardPointsModalOpen"
                v-model:selectedStudents="awardSelectedStudents" :all-students="awardClassStudents"
                :class-id="awardClassId" scope="class" @studentsUpdated="onAwardPointsUpdated" />

            <Teleport to="body">
                <ClassesFloatingBar v-if="!classesLoading" v-model:search-query="searchQuery" v-model:sort-by="sortBy"
                    v-model:view-mode="viewMode" :can-create-class="canCreateClass" :has-classes="classes.length > 0"
                    @create-class="openAddClassModal" />
            </Teleport>
        </div>
    </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { toast } from 'vue-sonner';
import { useClasses } from '../composables/useClasses';
import { rankProgressFromExperience } from '../composables/useExperience';
import RankBadge from './common/RankBadge.vue';
import TopStudentChips from './common/TopStudentChips.vue';
import AppContextMenu from './common/AppContextMenu.vue';
import ClassesFloatingBar from './classes/ClassesFloatingBar.vue';
import TeacherNav from './navigation/TeacherNav.vue';
import { useUserProfile } from '@/composables/useUserProfile';
import { useContextMenu } from '@/composables/useContextMenu';
import ClassForm from './modals/ClassForm.vue';
import AwardPointsModal from './modals/awardPointsModal.vue';

const { classes, loadClasses, getClassById, deleteClass } = useClasses();
const router = useRouter();
const route = useRoute();
const contextMenu = useContextMenu();
const editClassModal = ref(false);
const addClassModal = ref(false);
const classToEdit = ref(null);
const classesLoading = ref(true);
const searchQuery = ref('');
const sortBy = ref('name');
const viewMode = ref('cards');
const deleteDialogOpen = ref(false);
const classToDelete = ref(null);
const deleting = ref(false);
const awardPointsModalOpen = ref(false);
const awardClassId = ref('');
const awardClassStudents = ref([]);
const awardSelectedStudents = ref([]);

const { teacherSchools } = useUserProfile();
const canCreateClass = computed(() => teacherSchools.value.length > 0);

const welcomeDismissed = ref(false);
const cameFromWelcome = ref(false);
const showWelcomeBanner = computed(
    () => cameFromWelcome.value && !welcomeDismissed.value && canCreateClass.value
);
const welcomeSchoolName = computed(
    () => teacherSchools.value[0]?.schoolName || 'your school'
);

function dismissWelcomeBanner() {
    welcomeDismissed.value = true;
}

function stripWelcomeQuery() {
    if (route.query.welcome) {
        router.replace({ path: '/Classes' });
    }
}

function handleWelcomeFlow() {
    if (route.query.welcome !== '1' || !canCreateClass.value) {
        return;
    }
    cameFromWelcome.value = true;
    stripWelcomeQuery();
    if (classes.value.length === 0) {
        openAddClassModal();
    }
}

const isContextMenuOpen = computed(() => contextMenu.isOpen.value);
const contextMenuX = computed(() => contextMenu.x.value);
const contextMenuY = computed(() => contextMenu.y.value);
const contextMenuTarget = computed(() => contextMenu.target.value);

const contextMenuItems = [
    { key: 'open', label: 'Open class', icon: 'mdi-open-in-new' },
    { key: 'award', label: 'Award class points', icon: 'mdi-medal' },
    { key: 'edit', label: 'Edit class', icon: 'mdi-pencil' },
    { key: 'delete', label: 'Delete class', icon: 'mdi-delete', danger: true },
];

const classesWithRank = computed(() =>
    (classes.value ?? []).map((classItem) => {
        const progress = rankProgressFromExperience(classItem.experience ?? 0);
        return {
            ...classItem,
            rankIndex: progress.currentRank.rankIndex,
            rankName: progress.currentRank.name,
            nextRankName: progress.nextRank.name,
            progressPercent: progress.progressPercent,
            xpToNext: progress.xpToNext,
            isMaxRank: progress.isMaxRank,
        };
    }),
);

const filteredClasses = computed(() => {
    let list = [...classesWithRank.value];
    const q = searchQuery.value.trim().toLowerCase();
    if (q) {
        list = list.filter((c) => (c.name || '').toLowerCase().includes(q));
    }
    if (sortBy.value === 'rank') {
        list.sort((a, b) => (b.experience ?? 0) - (a.experience ?? 0));
    } else if (sortBy.value === 'students') {
        list.sort((a, b) => (b.numberOfStudents ?? 0) - (a.numberOfStudents ?? 0));
    } else {
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return list;
});

const CARD_COLOURS_RGBA = [
    '73, 54, 87',
    '206, 125, 165',
    '190, 229, 191',
    '165, 64, 45',
    '40, 89, 67',
];

const getCardColorRgba = (classItem) => {
    const id = String(classItem.id ?? classItem.name ?? 0);
    let n = 0;
    for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
    return CARD_COLOURS_RGBA[n % CARD_COLOURS_RGBA.length];
};

function openContextMenu(e, classItem) {
    contextMenu.open(e, classItem);
}

function openContextMenuFromButton(e, classItem) {
    const rect = e.currentTarget.getBoundingClientRect();
    contextMenu.open({ clientX: rect.right, clientY: rect.bottom }, classItem);
}

function handleContextMenuAction(actionKey) {
    const classItem = contextMenuTarget.value;
    contextMenu.close();
    if (!classItem) return;

    if (actionKey === 'open') {
        navigateTo(`/Class/${classItem.id}`);
    } else if (actionKey === 'award') {
        openAwardPointsModal(classItem);
    } else if (actionKey === 'edit') {
        openEditClassModal(classItem);
    } else if (actionKey === 'delete') {
        classToDelete.value = classItem;
        deleteDialogOpen.value = true;
    }
}

async function openAwardPointsModal(classItem) {
    try {
        const data = await getClassById(classItem.id);
        awardClassId.value = classItem.id;
        awardClassStudents.value = data?.students ?? [];
        awardSelectedStudents.value = [];
        awardPointsModalOpen.value = true;
    } catch (err) {
        console.error('Failed to load class for award points:', err);
        toast.error('Failed to load class');
    }
}

function onAwardPointsUpdated() {
    loadClasses();
}

async function openEditClassModal(classItem) {
    const id = classItem?.id ?? contextMenuTarget.value?.id;
    if (!id) return;
    try {
        classToEdit.value = await getClassById(id);
        editClassModal.value = true;
    } catch (err) {
        console.error('Failed to load class for edit:', err);
        toast.error('Failed to load class');
    }
}

function closeDeleteDialog() {
    deleteDialogOpen.value = false;
    classToDelete.value = null;
}

async function confirmDeleteClass() {
    if (!classToDelete.value) return;
    const id = classToDelete.value.id;
    const name = classToDelete.value.name;
    deleting.value = true;
    try {
        await deleteClass(id);
        classes.value = classes.value.filter((c) => c.id !== id);
        toast.success('Class deleted', { description: name, duration: 3000 });
        closeDeleteDialog();
    } catch (err) {
        console.error('Failed to delete class:', err);
        toast.error('Failed to delete class');
    } finally {
        deleting.value = false;
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
    if (!canCreateClass.value) return;
    addClassModal.value = true;
}

function closeAddClassModal() {
    addClassModal.value = false;
}

function onAddSaved() {
    closeAddClassModal();
    loadClasses();
}

onMounted(async () => {
    try {
        await loadClasses();
    } finally {
        classesLoading.value = false;
        handleWelcomeFlow();
    }
});

onUnmounted(() => {
    contextMenu.close();
});

const navigateTo = (path) => {
    router.push(path);
};
</script>

<style scoped>
.classesPage {
    align-items: stretch;
    justify-content: flex-start !important;
    padding-top: 1rem;
    padding-bottom: calc(var(--class-floating-bar-height, 100px) + 1.5rem);
}

.classesShell {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1rem 2rem;
}

@media (min-width: 768px) {
    .classesShell {
        padding: 0 1.5rem 3rem;
    }
}

.welcomeAlert {
    margin-bottom: 1.25rem;
    font-family: var(--font);
}

.welcomeAlertBody {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.welcomeAlertTitle {
    margin: 0;
    font-weight: 600;
    font-size: 1.05rem;
}

.welcomeAlertText {
    margin: 0;
    opacity: 0.85;
}

.welcomeAlertActions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.25rem;
}

.welcomeAlertBtn {
    text-transform: none !important;
    font-family: var(--font) !important;
    font-weight: 600 !important;
}

.welcomeSkipBtn {
    text-transform: none !important;
    font-family: var(--font) !important;
}

.classesHeader {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
}

.classesEyebrow {
    font-family: var(--font);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: rgba(var(--ink-rgb), 0.55);
    margin: 0 0 0.25rem;
}

.classesTitle {
    font-family: var(--font);
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--white);
    margin: 0 0 0.35rem;
}

.classesSubtitle {
    font-family: var(--font);
    font-size: 0.95rem;
    color: rgba(var(--ink-rgb), 0.7);
    margin: 0;
    max-width: 36rem;
}

.classCreateHint {
    width: 100%;
    text-align: center;
    font-family: var(--font);
    color: rgba(var(--ink-rgb), 0.75);
    margin-bottom: 1rem;
}

.classCreateHintLink {
    color: var(--freshSky);
    margin-left: 0.35rem;
}

.skeletonGrid {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
    width: 100%;
}

.classSkeleton {
    width: 100%;
    max-width: 400px;
    border-radius: 20px;
}

@media (min-width: 600px) {
    .classSkeleton {
        width: 300px;
    }
}

.emptyStateBlock {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 3rem 1.5rem;
    gap: 0.75rem;
}

.emptyStateBlock--compact {
    padding: 2rem 1rem;
}

.emptyStateIcon {
    color: rgba(var(--ink-rgb), 0.4);
    margin-bottom: 0.5rem;
}

.emptyStateTitle {
    font-family: var(--font);
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--white);
    margin: 0;
}

.emptyStateText {
    font-family: var(--font);
    font-size: 1rem;
    color: rgba(var(--ink-rgb), 0.75);
    margin: 0;
    max-width: 28rem;
}

.emptyStateBtn {
    margin-top: 0.5rem;
    text-transform: none !important;
    font-family: var(--font) !important;
    font-weight: 600 !important;
    border-radius: 14px !important;
    background: linear-gradient(135deg,
            rgba(26, 147, 111, 0.55) 0%,
            rgba(26, 147, 111, 0.35) 100%) !important;
    color: var(--white) !important;
}

.emptyStateLink {
    font-family: var(--font);
    font-size: 0.9rem;
    color: var(--freshSky);
    margin-top: 0.25rem;
}

.classContainer {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: stretch;
    justify-content: center;
    gap: 20px;
    width: 100%;
}

.classCard {
    --card-glass-color: 73, 54, 87;
    position: relative;
    justify-content: flex-start;
    color: var(--white) !important;
    width: 100%;
    max-width: 400px;
    border-radius: 20px !important;
    border: 1px solid rgba(var(--ink-rgb), 0.18) !important;
    background: linear-gradient(135deg,
            rgba(var(--card-glass-color), 0.72) 0%,
            rgba(var(--card-glass-color), 0.52) 50%,
            rgba(var(--card-glass-color), 0.62) 100%) !important;
    box-shadow:
        inset 0 1px 0 rgba(var(--ink-rgb), 0.2),
        0 4px 24px rgba(var(--shadow-rgb), 0.2);
    cursor: pointer;
    transition:
        transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
        border-color 0.3s ease;
}

.classCard:focus-visible {
    outline: 2px solid var(--freshSky);
    outline-offset: 3px;
}

@media (min-width: 600px) {
    .classCard {
        width: 300px;
    }
}

@media (hover: hover) {
    .classCard:hover {
        transform: scale(1.02) translateY(-6px);
        border-color: rgba(var(--ink-rgb), 0.35) !important;
        box-shadow:
            inset 0 1px 0 rgba(var(--ink-rgb), 0.25),
            0 12px 40px rgba(var(--shadow-rgb), 0.25);
    }
}

.classCardMenuBtn {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    background: rgba(var(--ink-rgb), 0.15);
    color: var(--white);
    cursor: pointer;
    transition: background 0.2s ease;
}

.classCardMenuBtn:hover {
    background: rgba(var(--ink-rgb), 0.3);
}

.classCardTitle {
    font-size: 1.5rem !important;
    font-weight: 600 !important;
    text-align: center;
    font-family: var(--font) !important;
    padding-top: 1.5rem !important;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.25 !important;
    white-space: normal !important;
}

.classCardSubtitle {
    text-align: center;
    font-family: var(--font);
    opacity: 0.9;
}

.classProgressSection {
    text-align: center;
    font-family: var(--font);
    padding-top: 0.25rem !important;
    padding-bottom: 0.25rem !important;
}

.classProgressBarTrack {
    height: 6px;
    border-radius: 3px;
    background: rgba(var(--ink-rgb), 0.2);
    overflow: hidden;
    margin-bottom: 0.35rem;
}

.classProgressBarFill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, rgba(26, 147, 111, 0.8), rgba(0, 168, 232, 0.8));
    transition: width 0.3s ease;
}

.classProgressLabel {
    font-size: 0.8rem;
    opacity: 0.85;
}

.classRankRow {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    text-align: center;
    font-family: var(--font);
    font-size: 1.1rem;
    padding-top: 0 !important;
}

.classRankBadge {
    width: 3.5rem;
    height: auto;
    flex-shrink: 0;
}

.classTopStudents {
    padding-top: 0 !important;
    padding-bottom: 1rem !important;
}

.classListView {
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.classListRow {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--inkBlack);
    border: 1px solid rgba(var(--ink-rgb), 0.15);
    border-radius: 14px;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;
}

.classListRow:focus-visible {
    outline: 2px solid var(--freshSky);
    outline-offset: 2px;
}

@media (hover: hover) {
    .classListRow:hover {
        border-color: rgba(26, 147, 111, 0.4);
        background: rgba(26, 147, 111, 0.08);
    }
}

.classListRankBadge {
    width: 2.25rem;
    height: auto;
    flex-shrink: 0;
}

.classListMain {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.classListName {
    font-family: var(--font);
    font-weight: 600;
    font-size: 1rem;
    color: var(--white);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.classListMeta {
    font-family: var(--font);
    font-size: 0.85rem;
    color: rgba(var(--ink-rgb), 0.65);
}

.classListProgressTrack {
    height: 4px;
    border-radius: 2px;
    background: rgba(var(--ink-rgb), 0.15);
    overflow: hidden;
    margin-top: 0.15rem;
}

.classListProgressFill {
    height: 100%;
    border-radius: 2px;
    background: rgba(26, 147, 111, 0.75);
}

.classListMenuBtn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--white);
    cursor: pointer;
    flex-shrink: 0;
}

.classListMenuBtn:hover {
    background: rgba(var(--ink-rgb), 0.15);
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

.editClassModalCard,
.addClassModalCard {
    width: 100% !important;
    padding: 1rem !important;
    border-radius: 20px !important;
    border: 1px solid rgba(var(--ink-rgb), 0.18) !important;
    background: linear-gradient(135deg,
            rgba(var(--color-bg-rgb), 0.6) 0%,
            rgba(var(--color-bg-rgb), 0.4) 50%,
            rgba(var(--color-bg-rgb), 0.5) 100%) !important;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow:
        inset 0 1px 0 rgba(var(--ink-rgb), 0.12),
        0 4px 24px rgba(var(--shadow-rgb), 0.2) !important;
}

@media (min-width: 768px) {

    .editClassModalCard,
    .addClassModalCard {
        padding: 2rem !important;
    }
}
</style>
