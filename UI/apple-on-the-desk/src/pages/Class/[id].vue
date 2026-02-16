<template>
    <v-breadcrumbs density="compact" :items="breadcrumbs" class="breadcrumbs">
        <template v-slot:divider>
            <v-icon>mdi-chevron-right</v-icon>
        </template>
    </v-breadcrumbs>
    <div class="container" style="justify-content: flex-start !important;">
        <!-- ROYAL RANK HEADER -->
        <div class="classRankContainer">
            <div class="rankOrnament rankOrnamentLeft">✦</div>
            <v-card class="classRankCard">
                <div class="rankCrown">{{ experienceToRank(classData?.experience).icon }}</div>
                <div class="rankTopRow">
                    <h1 class="className">{{ classData?.name }}</h1>
                    <div class="rankDisplay">
                        <span class="rankName">{{ experienceToRank(classData?.experience).name }}</span>
                    </div>
                </div>
                <div class="experienceProgress">
                    <div class="progressInfo">
                        <span class="currentExp">{{ classData?.experience ?? 0 }} XP</span>
                        <span class="nextRankLabel">Next: {{ getNextRank().name }}</span>
                        <span class="nextRankExp">{{ getNextRank().experience }} XP</span>
                    </div>
                    <div class="progressBarContainer">
                        <div class="progressBar" :style="{ width: progressToNextRank + '%' }">
                        </div>
                    </div>
                </div>
            </v-card>
            <div class="rankOrnament rankOrnamentRight">✦</div>
        </div>
        <div class="classContent">
            <!-- TIMER -->
            <div v-if="!viewShopModal" class="timer">
                <Timer :initialSeconds="300" :autoRepeat="false" />
            </div>
            <!-- SHOP -->
            <div v-if="viewShopModal" class="shopModal">
                <Shop :shopItems="shopItems" @cost-updated="onCostUpdated"
                    @item-context-menu="(e, item) => openShopItemContextMenu(e, item)" />
            </div>
            <!-- ACTION BUTTONS -->
            <div class="shopContainer">
                <v-menu v-model="actionsMenuOpen" :close-on-content-click="true" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn class="actionsButton" v-bind="props">
                            <v-icon>mdi-dots-vertical</v-icon>
                            Actions
                            <v-icon>{{ actionsMenuOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                        </v-btn>
                    </template>
                    <v-card class="actionsMenu">
                        <v-list class="actionsMenuList">
                            <v-list-item class="actionMenuItem" @click="viewShop()">
                                <template v-slot:prepend>
                                    <v-icon style="color: var(--freshSky);"
                                        :color="viewShopModal ? 'timer' : 'store'">{{
                                            viewShopModal ? 'mdi-timer' :
                                                'mdi-store' }}</v-icon>
                                </template>
                                <v-list-item-title>{{ viewShopModal ? 'Timer' : 'Shop' }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item v-if="viewShopModal" class="actionMenuItem" @click="openCreateShopItemModal">
                                <template v-slot:prepend>
                                    <v-icon style="color: var(--seaGreen);">mdi-plus</v-icon>
                                </template>
                                <v-list-item-title>Create shop item</v-list-item-title>
                            </v-list-item>
                            <v-divider v-if="!viewShopModal" />
                            <v-list-item v-if="!viewShopModal" class="actionMenuItem" @click="handleAwardClassPoints()">
                                <template v-slot:prepend>
                                    <v-icon style="color: gold;">mdi-medal</v-icon>
                                </template>
                                <v-list-item-title>Award Class Points</v-list-item-title>
                            </v-list-item>
                            <v-divider v-if="!viewShopModal" />
                            <v-list-item v-if="!viewShopModal" class="actionMenuItem" @click="handleCreateGroups()">
                                <template v-slot:prepend>
                                    <v-icon style="color: orange;">mdi-account-group</v-icon>
                                </template>
                                <v-list-item-title>{{ classData?.students[0].group ? 'Manage Groups' :
                                    'Create Groups' }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-card>
                </v-menu>
            </div>
            <!-- CLASS LIST -->
            <ClassList v-if="classData && id" :shopCost="shopCost" :isViewingShop="viewShopModal" :class-id="id"
                :students="classData.students || []" :experience="classData.experience || 0"
                @students-updated="onStudentsUpdated" @shopCostUpdated="onShopCostUpdated" />
        </div>
    </div>
    <award-points-modal v-model:pointsDialogOpen="awardClassPointsModal" v-model:selectedStudents="selectedStudents"
        :all-students="classData?.students || []" :class-id="id" @studentsUpdated="onStudentsUpdated" />

    <grouper-modal v-model="grouperModalOpen" :class-id="id" :students="classData?.students || []"
        @groupsUpdated="onGroupsUpdated" />

    <v-menu v-model="shopItemContextMenuOpen"
        :style="{ position: 'fixed', left: shopItemContextMenuX + 'px', top: shopItemContextMenuY + 'px' }"
        :location="undefined" :attach="false" class="shopItemContextMenu">
        <v-list class="shopContextMenuList">
            <v-list-item @click="openEditShopItemModal">
                <template v-slot:prepend><v-icon size="small">mdi-pencil</v-icon></template>
                <v-list-item-title>Edit</v-list-item-title>
            </v-list-item>
            <v-list-item @click="deleteShopItemFromMenu">
                <template v-slot:prepend><v-icon size="small">mdi-delete</v-icon></template>
                <v-list-item-title>Delete</v-list-item-title>
            </v-list-item>
        </v-list>
    </v-menu>
    <CreateItemModal v-model="createShopItemModalOpen" type="shopItem" :editing-item="shopItemToEdit"
        @saved="onShopItemSaved" />
</template>

<script setup>
import { ref, onMounted, computed, defineEmits, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Timer from '../../components/Timer.vue';
import ClassList from '../../components/classList.vue';
import Shop from '../../components/Shop.vue';
import Server from '../../services/server';
import { toast } from 'vue-sonner';
import { experienceToRank, getExperience } from '../../controllers/ExperienceController';
import AwardPointsModal from '../../components/modals/awardPointsModal.vue';
import grouperModal from '../../components/modals/GrouperModal.vue';
import CreateItemModal from '../../components/modals/CreateItemModal.vue';

const router = useRouter();
const { id } = useRoute().params;
const classData = ref(null);
const viewShopModal = ref(false);
const shopItems = ref([]);
const shopCost = ref(0);
const awardClassPointsModal = ref(false);
const selectedStudents = ref([]);
const grouperModalOpen = ref(false);
const actionsMenuOpen = ref(false);
const createShopItemModalOpen = ref(false);
const shopItemToEdit = ref(null);
const shopItemContextMenuOpen = ref(false);
const shopItemContextMenuX = ref(0);
const shopItemContextMenuY = ref(0);
const shopItemContextTarget = ref(null);
let breadcrumbs = computed(() => [
    { title: 'Home', to: '/' },
    { title: 'Classes', to: '/Classes' },
    { title: classData.value?.name, to: `/Class/${id}` },
]);

// Rank thresholds
const RANK_THRESHOLDS = [
    { experience: 0, name: 'Beginner', icon: '🥉' },
    { experience: 100, name: 'Novice', icon: '🥈' },
    { experience: 200, name: 'Apprentice', icon: '🥇' },
    { experience: 300, name: 'Expert', icon: '💜' },
    { experience: 400, name: 'Master', icon: '💎' },
    { experience: 500, name: 'Grandmaster', icon: '👑' },
];

const getNextRank = () => {
    const currentExp = classData.value?.experience ?? 0;
    const nextRank = RANK_THRESHOLDS.find(rank => rank.experience > currentExp);
    return nextRank || RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
};

const getCurrentRank = () => {
    const currentExp = classData.value?.experience ?? 0;
    for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
        if (currentExp >= RANK_THRESHOLDS[i].experience) {
            return RANK_THRESHOLDS[i];
        }
    }
    return RANK_THRESHOLDS[0];
};

const progressToNextRank = computed(() => {
    const currentExp = classData.value?.experience ?? 0;
    const currentRank = getCurrentRank();
    const nextRank = getNextRank();

    if (currentRank.experience === nextRank.experience) {
        return 100; // Max rank
    }

    const expInCurrentRank = currentExp - currentRank.experience;
    const expNeededForNextRank = nextRank.experience - currentRank.experience;

    return Math.min(100, Math.floor((expInCurrentRank / expNeededForNextRank) * 100));
});

const emit = defineEmits(['shopCostUpdated']);

function formatCost(cost) {
    const n = Number(cost);
    if (Number.isNaN(n)) return String(cost ?? '—');
    if (n % 1 === 0) {
        return `${n.toLocaleString()} pts`;
    } else {
        return `${n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pts`;
    }
}

function onStudentsUpdated(updatedStudents) {
    // Reload the class data to get the latest state
    loadClass();
    toast?.success?.('Points awarded successfully');
}

const loadClass = async () => {
    try {
        const response = await Server.getClassById(id);
        console.log('response', response);
        classData.value = response.class;
        // const experience = await getExperience(id);
    } catch (error) {
        console.error('Error loading class:', error);
    }
};

watch(classData, (newClassData) => {
    if (newClassData) {
        classData.value = newClassData;
    }
});

const loadShopItems = async () => {
    try {
        const response = await Server.getShopItems();
        shopItems.value = response.shopItems ?? [];
    } catch (error) {
        console.error('Error loading shop items:', error);
    }
}

function onShopCostUpdated(cost) {
    console.log('cost', cost);
    if (Number(cost) === 0) {
        selectedStudents.value = [];
    }
    shopCost.value = Number(cost);
}

onMounted(async () => {
    await loadClass();
    await loadShopItems();
});

const navigateTo = (path) => {
    console.log(path);
    router.push(path);
}

const viewShop = () => {
    viewShopModal.value = !viewShopModal.value;
    shopCost.value = 0;
}

function onCostUpdated(cost) {
    console.log('cost', cost);
    shopCost.value = Number(cost);
    emit('shopCost', cost);
}

function openAwardClassPointsModal() {
    console.log('openAwardClassPointsModal');
    // Pre-select all students for whole class award
    selectedStudents.value = classData.value?.students || [];
    awardClassPointsModal.value = true;
}

function closeAwardClassPointsModal() {
    awardClassPointsModal.value = false;
}

function openGrouperModal() {
    grouperModalOpen.value = true;
}

function onGroupsUpdated(updatedStudents) {
    // Reload the class data to get the latest state with groups
    loadClass();
}

function openCreateShopItemModal() {
    shopItemToEdit.value = null;
    createShopItemModalOpen.value = true;
}

function openShopItemContextMenu(e, item) {
    shopItemContextTarget.value = item;
    shopItemContextMenuX.value = e.clientX;
    shopItemContextMenuY.value = e.clientY;
    shopItemContextMenuOpen.value = true;
}

function openEditShopItemModal() {
    if (shopItemContextTarget.value) {
        shopItemToEdit.value = shopItemContextTarget.value;
        shopItemContextMenuOpen.value = false;
        createShopItemModalOpen.value = true;
    }
    shopItemContextTarget.value = null;
}

async function deleteShopItemFromMenu() {
    const item = shopItemContextTarget.value;
    shopItemContextMenuOpen.value = false;
    shopItemContextTarget.value = null;
    if (!item) return;
    const itemId = item._id != null ? String(item._id) : item.id;
    if (!itemId) return;
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
        await Server.deleteShopItem(itemId);
        loadShopItems();
    } catch (err) {
        console.error('Failed to delete shop item:', err);
        alert('Could not delete shop item. Please try again.');
    }
}

function onShopItemSaved() {
    shopItemToEdit.value = null;
    loadShopItems();
}

function handleAwardClassPoints() {
    openAwardClassPointsModal();
}

function handleCreateGroups() {
    openGrouperModal();
}

</script>

<style>
@import '../../styles/style.css';

.rankTopRow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    width: 100%;
    flex-wrap: wrap;
}

.className {
    font-family: var(--font);
    font-optical-sizing: auto;
    font-weight: 700;
    font-style: normal;
    font-variation-settings: "wdth" 147.8;
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    color: var(--white);
    text-align: center;
    margin: 0;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.6),
        0 0 40px rgba(var(--gold-rgb), 0.3);
    letter-spacing: 1px;
}

.shopContainer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
}

.shopButton {
    background: linear-gradient(135deg,
            rgba(var(--gold-rgb), 0.589) 0%,
            rgba(var(--gold-rgb), 0.589) 50%,
            rgba(var(--gold-rgb), 0.589) 100%) !important;
    border-radius: 180px;
    box-shadow: 0 0 10px 0 rgba(var(--gold-rgb), 0.5);
    padding: 6px 20px;
    text-align: center;
    color: var(--white);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        transform: scale(1.02);
        box-shadow: 0 0 10px 0 rgba(var(--gold-rgb), 0.589);
        border: none;
        color: var(--white);
        background-color: rgba(var(--gold-rgb), 0.589);
    }
}

.awardClassPointsButton {
    background: linear-gradient(135deg,
            rgba(var(--amethyst-rgb), 0.589) 0%,
            rgba(var(--amethyst-rgb), 0.589) 50%,
            rgba(var(--amethyst-rgb), 0.589) 100%) !important;
    border-radius: 180px;
    box-shadow: 0 0 10px 0 rgba(var(--amethyst-rgb), 0.5);
    padding: 6px 20px;
    color: var(--white);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.awardClassPointsButton:hover {
    transform: scale(1.02);
    box-shadow: 0 0 10px 0 rgba(var(--amethyst-rgb), 0.589);
    border: none;
    color: var(--white);
    background-color: rgba(var(--amethyst-rgb), 0.589);
}

.grouperButton {
    background: linear-gradient(135deg,
            rgba(var(--seaGreen-rgb), 0.589) 0%,
            rgba(var(--seaGreen-rgb), 0.589) 50%,
            rgba(var(--seaGreen-rgb), 0.589) 100%) !important;
    border-radius: 180px;
    box-shadow: 0 0 10px 0 rgba(var(--seaGreen-rgb), 0.5);
    padding: 6px 20px;
    color: var(--white);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.grouperButton:hover {
    transform: scale(1.02);
    box-shadow: 0 0 10px 0 rgba(var(--seaGreen-rgb), 0.589);
    border: none;
    color: var(--white);
    background-color: rgba(var(--seaGreen-rgb), 0.589);
}

.actionsButton {
    background: linear-gradient(135deg,
            rgba(var(--gold-rgb), 0.589) 0%,
            rgba(var(--amethyst-rgb), 0.589) 50%,
            rgba(var(--seaGreen-rgb), 0.589) 100%) !important;
    border-radius: 180px;
    box-shadow: 0 0 10px 0 rgba(var(--gold-rgb), 0.5);
    padding: 6px 20px;
    text-align: center;
    color: var(--white);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    gap: 0.5rem;
}

.actionsButton:hover {
    transform: scale(1.02);
    box-shadow: 0 0 15px 0 rgba(var(--gold-rgb), 0.7);
    filter: brightness(1.1);
}

.actionsMenu {
    background-color: var(--inkBlack) !important;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    margin-top: 0.5rem;
    min-width: 200px;
    width: 90vw;
    max-width: 250px;
}

@media (min-width: 600px) {
    .actionsMenu {
        width: auto;
    }
}

.actionsMenuList {
    background-color: transparent !important;
    padding: 0.5rem 0;
}

.actionMenuItem {
    font-family: var(--font);
    color: var(--white) !important;
    padding: 0.75rem 1.25rem;
    min-height: 48px;
    transition: all 0.2s ease;
    cursor: pointer;
}

@media (hover: hover) {
    .actionMenuItem:hover {
        background: linear-gradient(90deg,
                rgba(var(--seaGreen-rgb), 0.3) 0%,
                rgba(var(--seaGreen-rgb), 0.1) 100%) !important;
    }
}

.actionMenuItem .v-list-item-title {
    font-family: var(--font);
    font-weight: 500;
    color: var(--white);
}

.actionItemIcon {
    font-size: 1.25rem;
    margin-right: 0.5rem;
}

.actionsMenuList .v-divider {
    border-color: rgba(255, 255, 255, 0.1);
    margin: 0.25rem 0;
}

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

.classRankContainer {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 12px !important;
    padding: 0.5rem;
    max-width: 700px;
    gap: 0.5rem;
}

@media (min-width: 768px) {
    .classRankContainer {
        padding: 1.5rem;
        gap: 2rem;
    }
}

.rankOrnament {
    font-size: 1.5rem;
    color: var(--gold);
    animation: sparkle 3s ease-in-out infinite;
    text-shadow: 0 0 20px rgba(var(--gold-rgb), 0.8),
        0 0 40px rgba(var(--gold-rgb), 0.6);
}

@media (min-width: 768px) {
    .rankOrnament {
        font-size: 3rem;
    }
}

.rankOrnamentLeft {
    animation-delay: 0s;
}

.rankOrnamentRight {
    animation-delay: 1.5s;
}

@keyframes sparkle {

    0%,
    100% {
        opacity: 0.6;
        transform: scale(1) rotate(0deg);
    }

    50% {
        opacity: 1;
        transform: scale(1.2) rotate(180deg);
    }
}

.classRankCard {
    position: relative;
    background: linear-gradient(135deg,
            rgba(var(--gold-rgb), 0.15) 0%,
            rgba(var(--amethyst-rgb), 0.15) 50%,
            rgba(var(--gold-rgb), 0.15) 100%) !important;
    border-radius: 32px !important;
    padding: 3rem 1.5rem 1.5rem 1.5rem !important;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    overflow: visible;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
        0 0 60px rgba(var(--gold-rgb), 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    width: 100%;
    max-width: 550px;
}

@media (min-width: 768px) {
    .classRankCard {
        padding: 3.5rem 2.5rem 1.5rem 2.5rem !important;
        min-width: 550px;
    }
}

.classRankCard::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(135deg,
            rgba(var(--gold-rgb), 0.3),
            rgba(var(--amethyst-rgb), 0.3),
            rgba(var(--gold-rgb), 0.3));
    border-radius: 32px;
    z-index: -1;
    filter: blur(15px);
    opacity: 0.6;
}

.rankCrown {
    position: absolute;
    top: -25px;
    font-size: 2.5rem;
    animation: float 3s ease-in-out infinite;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    z-index: 10;
}

@media (min-width: 768px) {
    .rankCrown {
        top: -35px;
        font-size: 3.5rem;
    }
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-10px);
    }
}

.rankDisplay {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1.5rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 50px;
    border: 1px solid rgba(var(--gold-rgb), 0.3);
}

.rankIcon {
    font-size: 2rem;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
    animation: pulse 2s ease-in-out infinite;
    line-height: 1;
}

@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

.rankName {
    font-family: var(--font);
    font-size: clamp(1rem, 3vw, 1.35rem);
    font-weight: 700;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 2px;
    line-height: 1.2;
    white-space: nowrap;
    text-shadow: 0 0 10px rgba(var(--gold-rgb), 0.8),
        0 0 20px rgba(var(--amethyst-rgb), 0.6),
        0 2px 4px rgba(0, 0, 0, 0.5);
}

@keyframes shimmer {

    0%,
    100% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }
}

.experienceProgress {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 20px;
    border: 1px solid rgba(var(--gold-rgb), 0.3);
}

.progressInfo {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font);
    font-size: 0.85rem;
    color: var(--white);
    margin-bottom: 0.25rem;
}

.currentExp {
    font-weight: 600;
    color: var(--gold);
    text-shadow: 0 2px 8px rgba(var(--gold-rgb), 0.5);
}

.nextRankLabel {
    font-weight: 500;
    opacity: 0.8;
}

.nextRankExp {
    font-weight: 600;
    color: var(--amethyst);
}

.progressBarContainer {
    position: relative;
    width: 100%;
    height: 20px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(var(--gold-rgb), 0.2);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
}

.progressBar {
    position: relative;
    height: 100%;
    background: linear-gradient(90deg,
            rgba(var(--gold-rgb), 0.8) 0%,
            rgba(var(--amethyst-rgb), 0.8) 50%,
            rgba(var(--gold-rgb), 0.8) 100%);
    border-radius: 12px;
    transition: width 0.8s ease-out;
    box-shadow: 0 0 20px rgba(var(--gold-rgb), 0.6),
        0 0 40px rgba(var(--amethyst-rgb), 0.4);
    overflow: hidden;
}

.progressShine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 100%);
    animation: shine 2s infinite;
}


.shopModal {
    margin-bottom: 20px;
    width: 100%;
}

.shopHeader {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;
}

.createShopItemButton {
    font-family: var(--font) !important;
    text-transform: none !important;
    color: var(--white) !important;
    background-color: var(--seaGreen) !important;
    border-radius: 12px !important;
}

.createShopItemButton:hover {
    filter: brightness(1.1);
}

.shopContextMenuList {
    background-color: var(--inkBlack) !important;
    border: 1px solid var(--white);
    border-radius: 12px;
    padding: 0.25rem 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.shopContextMenuList .v-list-item {
    font-family: var(--font);
    color: var(--white);
    min-height: 40px;
}

@media (hover: hover) {
    .shopContextMenuList .v-list-item:hover {
        background-color: var(--seaGreen) !important;
    }
}
</style>
