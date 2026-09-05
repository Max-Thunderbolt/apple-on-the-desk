<template>
    <div class="container classPage">
        <div class="classPageShell">
            <TeacherNav />
            <div v-if="dataLoading" class="dataLoadingPage">
                <div class="dataLoading">
                    <v-progress-circular indeterminate color="primary" size="64" width="6" />
                    <span class="dataLoadingText">Loading class...</span>
                </div>
            </div>
            <div v-else class="classPageContent classPageContent--withFooter">
        <!-- ROYAL RANK HEADER -->
        <div
            ref="rankAnchorRef"
            class="rankHeaderAnchor"
            :style="rankAnchorHeight ? { minHeight: `${rankAnchorHeight}px` } : undefined"
        >
            <div
                class="classRankContainer"
                :class="{
                    'classRankContainer--compact': isRankCompact,
                    'classRankContainer--pinned': isRankCompact,
                }"
            >
            <div class="rankOrnament rankOrnamentLeft">✦</div>
            <v-card class="classRankCard" flat elevation="0">
                <div class="rankCrown">
                    <RankBadge
                        :rank-index="currentRank.rankIndex"
                        :aria-label="`${currentRank.name} rank badge`"
                        badge-class="rankCrownBadge"
                    />
                </div>
                <div class="rankDisplay">
                    <span class="rankName">{{ currentRank.name }}</span>
                </div>
                <div class="experienceProgress">
                    <div class="progressInfo">
                        <span class="currentExp">{{ classData?.experience ?? 0 }} XP</span>
                        <span class="nextRankLabel">Next: {{ nextRank.name }}</span>
                        <span class="nextRankExp">{{ nextRank.experience }} XP</span>
                    </div>
                    <div class="progressBarContainer">
                        <div class="progressBar" :style="{ width: progressToNextRank + '%' }">
                        </div>
                    </div>
                </div>
            </v-card>
            <div class="rankOrnament rankOrnamentRight">✦</div>
            </div>
        </div>
        <div class="classContent">
            <!-- SHOP -->
            <div v-show="viewShopModal" class="shopModal">
                <Shop :shopItems="filteredShopItems" @cost-updated="onCostUpdated" @selection-updated="onShopSelectionUpdated"
                    @item-context-menu="(e, item) => openShopItemContextMenu(e, item)" />
            </div>
            <p v-if="searchQuery && !viewShopModal && hasStudents && filteredStudentCount === 0" class="searchResultHint searchResultHint--empty">
                No students match "{{ searchQuery }}"
            </p>
            <p v-else-if="searchQuery && !viewShopModal && hasStudents && filteredStudentCount < totalStudentCount" class="searchResultHint">
                Showing {{ filteredStudentCount }} of {{ totalStudentCount }} students
            </p>
            <p v-else-if="searchQuery && viewShopModal && filteredShopItems.length === 0" class="searchResultHint searchResultHint--empty">
                No shop items match "{{ searchQuery }}"
            </p>
            <!-- CLASS LIST -->
            <ClassList v-if="classData && id" :shopCost="shopCost" :selected-shop-item-ids="selectedShopItemIds"
                :isViewingShop="viewShopModal" :class-id="id" :students="classData.students || []"
                :group-names="classData.groupNames || []" :experience="classData.experience || 0" :view-mode="viewMode"
                :search-query="searchQuery"
                @students-updated="onStudentsUpdated" @shopCostUpdated="onShopCostUpdated"
                @purchase-completed="onPurchaseCompleted" />
        </div>
            </div>

            <Teleport to="body">
                <ClassFloatingBar
                    v-if="!dataLoading && classData"
                    v-model:search-query="searchQuery"
                    v-model:view-mode="viewMode"
                    :view-shop-modal="viewShopModal"
                    :has-groups="hasGroups"
                    :has-existing-groups="hasExistingGroups"
                    :has-students="hasStudents"
                    :shop-empty="shopItems.length === 0"
                    :is-all-selected="isAllSelected"
                    :selected-count="shopSelectedStudents.length"
                    :total-students="totalStudentCount"
                    :total-selected-points="totalSelectedPoints"
                    :points-remaining="pointsRemaining"
                    :can-afford-shop="canAffordShop"
                    :can-checkout="canCheckout"
                    @view-shop="viewShop()"
                    @create-shop-item="openCreateShopItemModal"
                    @view-receipts="openPurchaseHistory"
                    @award-class-points="handleAwardClassPoints"
                    @create-groups="handleCreateGroups"
                    @select-all="handleSelectAll"
                    @checkout="handleCheckout"
                />
            </Teleport>

            <award-points-modal v-model:pointsDialogOpen="awardClassPointsModal" v-model:selectedStudents="selectedStudents"
                :all-students="classData?.students || []" :class-id="id" scope="class" @studentsUpdated="onStudentsUpdated" />

            <grouper-modal v-model="grouperModalOpen" :class-id="id" :students="classData?.students || []"
                @groupsUpdated="onGroupsUpdated" />

            <PurchaseHistoryModal
                v-model="purchaseHistoryOpen"
                :purchases="classPurchases"
                :loading="purchaseHistoryLoading"
                @select="openReceiptFromHistory"
            />
            <PurchaseReceiptModal
                v-model="receiptModalOpen"
                :receipts="receiptModalReceipts"
                :class-name="classData?.name || ''"
                :initial-index="receiptModalIndex"
            />

            <AppContextMenu :open="isShopItemContextMenuOpen" :x="shopItemContextMenuX" :y="shopItemContextMenuY"
                :items="shopItemContextMenuItems" @close="closeShopItemContextMenu" @select="onShopItemContextSelect" />
            <CreateItemModal v-model="createShopItemModalOpen" type="shopItem" :editing-item="shopItemToEdit"
                @saved="onShopItemSaved" />

            <v-dialog v-model="deleteShopItemDialogOpen" max-width="420" persistent>
                <v-card class="confirmCard">
                    <v-card-title class="confirmTitle">Delete shop item?</v-card-title>
                    <v-card-text class="confirmText">
                        Delete "{{ shopItemToDelete?.name }}"? This cannot be undone.
                    </v-card-text>
                    <v-card-actions class="confirmActions">
                        <v-spacer />
                        <v-btn variant="text" :disabled="deletingShopItem" @click="closeDeleteShopItemDialog">Cancel</v-btn>
                        <v-btn color="error" :loading="deletingShopItem" @click="confirmDeleteShopItem">Delete</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, defineEmits, watch, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useActiveClass } from '../../composables/useActiveClass';
import { useContextMenu } from '../../composables/useContextMenu';
import { useShopSelection } from '../../composables/useShopSelection';
import { useClasses } from '../../composables/useClasses';
import ClassList from '../../components/classList.vue';
import Shop from '../../components/Shop.vue';
import ClassFloatingBar from '../../components/class/ClassFloatingBar.vue';
import AppContextMenu from '../../components/common/AppContextMenu.vue';
import Server from '../../services/server';
import { toast } from 'vue-sonner';
import { rankProgressFromExperience } from '../../composables/useExperience';
import RankBadge from '../../components/common/RankBadge.vue';
import AwardPointsModal from '../../components/modals/awardPointsModal.vue';
import grouperModal from '../../components/modals/GrouperModal.vue';
import CreateItemModal from '../../components/modals/CreateItemModal.vue';
import PurchaseReceiptModal from '../../components/modals/PurchaseReceiptModal.vue';
import PurchaseHistoryModal from '../../components/modals/PurchaseHistoryModal.vue';
import TeacherNav from '@/components/navigation/TeacherNav.vue';

const router = useRouter();
const route = useRoute();
const { updateClass } = useClasses();
const { id } = route.params;
const { setActiveClass, clearActiveClass } = useActiveClass();
const classData = ref(null);
const viewShopModal = ref(false);
const shopItems = ref([]);
const shopCost = ref(0);
const selectedShopItemIds = ref([]);
const awardClassPointsModal = ref(false);
const selectedStudents = ref([]);
const grouperModalOpen = ref(false);
const searchQuery = ref('');
const viewMode = ref('list');
const createShopItemModalOpen = ref(false);
const shopItemToEdit = ref(null);
const deleteShopItemDialogOpen = ref(false);
const shopItemToDelete = ref(null);
const deletingShopItem = ref(false);
const shopItemContextMenu = useContextMenu();
const dataLoading = ref(true);
const isRankCompact = ref(false);
const rankAnchorRef = ref(null);
const rankAnchorHeight = ref(null);
const receiptModalOpen = ref(false);
const receiptModalReceipts = ref([]);
const receiptModalIndex = ref(0);
const purchaseHistoryOpen = ref(false);
const purchaseHistoryLoading = ref(false);
const classPurchases = ref([]);

const shopSelection = useShopSelection(shopCost);
provide('shopSelection', shopSelection);

const {
    selectedStudents: shopSelectedStudents,
    totalSelectedPoints,
    pointsRemaining,
    canAffordShop,
    selectAll,
    clearSelection,
    checkout: doCheckout,
} = shopSelection;

const totalStudentCount = computed(() => classData.value?.students?.length ?? 0);

const filteredStudentCount = computed(() => {
    const list = classData.value?.students ?? [];
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return list.length;
    return list.filter((s) => {
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const groupMatch = (s.group || '').toLowerCase().includes(q);
        return nameMatch || groupMatch;
    }).length;
});

const filteredShopItems = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return shopItems.value;
    return shopItems.value.filter((i) => (i.name || '').toLowerCase().includes(q));
});

const isAllSelected = computed(() => {
    const all = classData.value?.students || [];
    return all.length > 0 && all.every((s) => shopSelectedStudents.value.some((sel) => sel.id === s.id));
});

const canCheckout = computed(() => {
    if (!canAffordShop.value) return false;
    if (viewShopModal.value && (!selectedShopItemIds.value || selectedShopItemIds.value.length === 0)) return false;
    return shopSelectedStudents.value.length > 0;
});

const rankProgress = computed(() => rankProgressFromExperience(classData.value?.experience ?? 0));
const currentRank = computed(() => rankProgress.value.currentRank);
const nextRank = computed(() => rankProgress.value.nextRank);
const progressToNextRank = computed(() => rankProgress.value.progressPercent);

const hasGroups = computed(() => classData.value?.students?.some((s) => s.group) ?? false);
const hasExistingGroups = computed(() => hasGroups.value);
const hasStudents = computed(() => (classData.value?.students?.length ?? 0) > 0);
const isShopItemContextMenuOpen = computed(() => shopItemContextMenu.isOpen.value);
const shopItemContextMenuX = computed(() => shopItemContextMenu.x.value);
const shopItemContextMenuY = computed(() => shopItemContextMenu.y.value);
const shopItemContextTarget = computed(() => shopItemContextMenu.target.value);
const shopItemContextMenuItems = computed(() => ([
    { key: 'edit-shop-item', label: 'Edit', icon: 'mdi-pencil' },
    { key: 'delete-shop-item', label: 'Delete', icon: 'mdi-delete', danger: true },
]));

watch(hasGroups, (newVal) => {
    if (newVal && viewMode.value === 'list') viewMode.value = 'groups';
    if (!newVal) viewMode.value = 'list';
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

function onStudentsUpdated(payload) {
    if (payload?.students) {
        if (classData.value) classData.value = { ...classData.value, students: payload.students };
    }
    const updatedStudents = Array.isArray(payload) ? payload : payload?.updatedStudents ?? payload?.students;
    loadClass();
    const allCount = classData.value?.students?.length ?? 0;
    let message = 'Points awarded';
    if (payload && !Array.isArray(payload) && payload.selectedStudents?.length && !payload.students) {
        const selected = payload.selectedStudents;
        const isWholeClass = allCount > 0 && selected.length >= allCount;
        if (isWholeClass) {
            message = 'Points awarded to the class';
        } else if (payload.isForGroup && selected.length) {
            const groupName = selected[0]?.group || 'Group';
            message = `Points awarded to ${groupName}`;
        } else {
            const names = selected.map((s) => s.name || 'Student').filter(Boolean);
            if (names.length <= 3) {
                message = `Points awarded to ${names.join(', ')}`;
            } else {
                message = `Points awarded to ${names.slice(0, 2).join(', ')} and ${names.length - 2} more`;
            }
        }
        toast.success(message);
    }
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
        const response = await Server.getShopItems(id);
        shopItems.value = response.shopItems ?? [];
    } catch (error) {
        console.error('Error loading shop items:', error);
    }
}

function onShopCostUpdated(cost) {
    if (Number(cost) === 0) {
        clearSelection();
    }
    shopCost.value = Number(cost);
}

function handleSelectAll() {
    selectAll(classData.value?.students || []);
}

function handleCheckout() {
    doCheckout(id, classData.value?.students || [], updateClass, {
        selectedShopItemIds: selectedShopItemIds.value || [],
        purchaseItemsApi: Server.purchaseItems.bind(Server),
        onPurchaseSuccess(res) {
            onStudentsUpdated({ students: res?.students });
            onPurchaseCompleted();
            const receipts = Array.isArray(res?.receipts) ? res.receipts : [];
            if (receipts.length > 0) {
                openReceipts(receipts, 0);
                classPurchases.value = [...receipts, ...classPurchases.value];
            }
        },
    });
}

async function loadClassPurchases() {
    purchaseHistoryLoading.value = true;
    try {
        const response = await Server.getClassPurchases(id);
        classPurchases.value = response.purchases ?? [];
    } catch (error) {
        console.error('Error loading purchases:', error);
        toast.error('Could not load receipts');
        classPurchases.value = [];
    } finally {
        purchaseHistoryLoading.value = false;
    }
}

async function openPurchaseHistory() {
    purchaseHistoryOpen.value = true;
    await loadClassPurchases();
}

function openReceipts(receipts, startIndex = 0) {
    receiptModalReceipts.value = Array.isArray(receipts) ? receipts : [];
    receiptModalIndex.value = startIndex;
    receiptModalOpen.value = true;
}

function openReceiptFromHistory(purchase) {
    if (!purchase) return;
    purchaseHistoryOpen.value = false;
    openReceipts([purchase], 0);
}

function onScroll() {
    const shouldCompact = window.scrollY > 60;
    if (shouldCompact === isRankCompact.value) return;

    if (shouldCompact) {
        if (rankAnchorRef.value) {
            rankAnchorHeight.value = rankAnchorRef.value.offsetHeight;
        }
        isRankCompact.value = true;
        return;
    }

    isRankCompact.value = false;
    requestAnimationFrame(() => {
        rankAnchorHeight.value = null;
    });
}

onMounted(async () => {
    window.addEventListener('scroll', onScroll, { passive: true });
    dataLoading.value = true;
    try {
        await loadClass();
        await loadShopItems();
        if (classData.value) {
            setActiveClass(id, classData.value.name);
        }
        const viewParam = route.query.view;
        if (viewParam === 'shop') {
            viewShopModal.value = true;
        } else if (viewParam === 'groups') {
            viewMode.value = 'groups';
        }
    } finally {
        dataLoading.value = false;
    }
});

onUnmounted(() => {
    window.removeEventListener('scroll', onScroll);
    clearActiveClass();
});

const navigateTo = (path) => {
    console.log(path);
    router.push(path);
}

const viewShop = () => {
    viewShopModal.value = !viewShopModal.value;
    shopCost.value = 0;
    selectedShopItemIds.value = [];
    clearSelection();
}

function onCostUpdated(cost) {
    shopCost.value = Number(cost);
    emit('shopCost', cost);
}

function onShopSelectionUpdated(payload) {
    shopCost.value = Number(payload?.cost ?? 0);
    selectedShopItemIds.value = Array.isArray(payload?.selectedItemIds) ? payload.selectedItemIds : (payload?.selectedItemIds ? [payload.selectedItemIds] : []);
}

function onPurchaseCompleted() {
    selectedShopItemIds.value = [];
    shopCost.value = 0;
    loadShopItems();
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
    shopItemContextMenu.open(e, item);
}

function closeShopItemContextMenu() {
    shopItemContextMenu.close();
}

function onShopItemContextSelect(actionKey) {
    if (actionKey === 'edit-shop-item') {
        openEditShopItemModal();
        return;
    }
    if (actionKey === 'delete-shop-item') {
        openDeleteShopItemDialog();
    }
}

function openEditShopItemModal() {
    if (shopItemContextTarget.value) {
        shopItemToEdit.value = shopItemContextTarget.value;
        closeShopItemContextMenu();
        createShopItemModalOpen.value = true;
    }
}

function openDeleteShopItemDialog() {
    const item = shopItemContextTarget.value;
    closeShopItemContextMenu();
    if (!item) return;
    shopItemToDelete.value = item;
    deleteShopItemDialogOpen.value = true;
}

function closeDeleteShopItemDialog() {
    deleteShopItemDialogOpen.value = false;
    shopItemToDelete.value = null;
}

async function confirmDeleteShopItem() {
    const item = shopItemToDelete.value;
    if (!item) return;
    const itemId = item._id != null ? String(item._id) : item.id;
    if (!itemId) return;
    deletingShopItem.value = true;
    try {
        await Server.deleteShopItem(itemId);
        loadShopItems();
        closeDeleteShopItemDialog();
    } catch (err) {
        console.error('Failed to delete shop item:', err);
        toast.error('Could not delete shop item');
    } finally {
        deletingShopItem.value = false;
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
.classPage {
    align-items: stretch;
    justify-content: flex-start !important;
    padding-top: 1rem;
    padding-bottom: 3rem;
}

.classPageShell {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1rem 2rem;
}

@media (min-width: 768px) {
    .classPageShell {
        padding: 0 1.5rem 3rem;
    }
}

.classPageContent {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
}

.classPageContent--withFooter {
    padding-bottom: calc(var(--class-floating-bar-height, 100px) + 1.5rem);
}

.searchResultHint {
    font-family: var(--font);
    font-size: 0.9rem;
    color: rgba(var(--ink-rgb), 0.65);
    text-align: center;
    margin: 0 0 0.75rem;
    padding: 0 0.75rem;
}

.searchResultHint--empty {
    opacity: 0.85;
    padding: 1.5rem 0.75rem;
}

.dataLoadingPage {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
}

.dataLoading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    min-height: 50vh;
    padding: 2rem;
}

.dataLoadingText {
    font-family: var(--font);
    color: var(--white);
    font-size: 1rem;
    opacity: 0.9;
}

.shopContainer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
}

.controlsWrapper {
    display: flex;
    justify-content: center;
    width: 100%;
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
    border: 1px solid rgba(var(--ink-rgb), 0.2);
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(var(--shadow-rgb), 0.5);
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
    border-color: rgba(var(--ink-rgb), 0.1);
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

.rankHeaderAnchor {
    position: relative;
    width: 100%;
    transition: min-height 0.4s cubic-bezier(0.22, 1, 0.36, 1);
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
    margin-left: auto;
    margin-right: auto;
    transition:
        padding 0.4s cubic-bezier(0.22, 1, 0.36, 1),
        gap 0.4s cubic-bezier(0.22, 1, 0.36, 1),
        margin 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.classRankContainer--pinned {
    position: sticky;
    top: 0;
    z-index: 100;
    margin-bottom: 0 !important;
    padding-top: 0.35rem;
    padding-bottom: 0.35rem;
    background: transparent;
}

.classRankContainer--compact {
    padding: 0.25rem 0.5rem;
    gap: 0;
    margin-bottom: 8px !important;
}

.classRankContainer--compact .rankOrnament {
    opacity: 0;
    transform: scale(0.5) rotate(45deg);
    max-width: 0;
    overflow: hidden;
    pointer-events: none;
}

.classRankContainer--compact .classRankCard {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5rem 1rem;
    padding: 0.65rem 1rem !important;
    border-radius: 20px !important;
    min-width: 0 !important;
    max-width: 100%;
    box-shadow: none !important;
}

.classRankContainer--compact .classRankCard::before {
    display: none;
}

.classRankContainer--compact .rankCrown {
    width: 2.5rem;
    animation: none;
    transform: translateY(0);
}

.classRankContainer--compact .rankDisplay {
    padding: 0.25rem 0.85rem;
}

.classRankContainer--compact .rankName {
    font-size: 0.85rem;
    letter-spacing: 1px;
}

.classRankContainer--compact .experienceProgress {
    flex: 1 1 180px;
    min-width: 160px;
    padding: 0.5rem 0.85rem;
    gap: 0.35rem;
    border-radius: 14px;
}

.classRankContainer--compact .progressInfo {
    font-size: 0.75rem;
    margin-bottom: 0;
}

.classRankContainer--compact .progressBarContainer {
    height: 14px;
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
    transition:
        opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1),
        transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
        max-width 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    max-width: 3rem;
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
    background: transparent !important;
    border: none !important;
    border-radius: 32px !important;
    padding: 1.5rem 1.5rem 1.5rem 1.5rem !important;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    overflow: visible;
    box-shadow: none !important;
    width: 100%;
    max-width: 550px;
    transition:
        padding 0.4s cubic-bezier(0.22, 1, 0.36, 1),
        gap 0.4s cubic-bezier(0.22, 1, 0.36, 1),
        border-radius 0.4s cubic-bezier(0.22, 1, 0.36, 1),
        flex-direction 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

@media (min-width: 768px) {
    .classRankCard {
        padding: 1.75rem 2.5rem 1.5rem 2.5rem !important;
        min-width: 550px;
    }
}

.classRankCard::before {
    display: none;
}

.classRankCard :deep(.v-card__overlay),
.classRankCard :deep(.v-card__underlay) {
    display: none;
}

.rankCrown {
    position: relative;
    width: 4.5rem;
    animation: float 3s ease-in-out infinite;
    z-index: 10;
    transition:
        width 0.4s cubic-bezier(0.22, 1, 0.36, 1),
        transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.rankCrownBadge {
    width: 100%;
    height: auto;
}

@media (min-width: 768px) {
    .rankCrown {
        width: 6rem;
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
    background: rgba(var(--shadow-rgb), 0.2);
    border-radius: 50px;
    border: 1px solid rgba(var(--gold-rgb), 0.3);
    transition:
        padding 0.4s cubic-bezier(0.22, 1, 0.36, 1),
        border-radius 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.rankIcon {
    font-size: 2rem;
    filter: drop-shadow(0 4px 12px rgba(var(--shadow-rgb), 0.5));
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
    transition:
        font-size 0.4s cubic-bezier(0.22, 1, 0.36, 1),
        letter-spacing 0.4s cubic-bezier(0.22, 1, 0.36, 1);
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
    background: rgba(var(--shadow-rgb), 0.3);
    border-radius: 20px;
    border: 1px solid rgba(var(--gold-rgb), 0.3);
    transition:
        padding 0.4s cubic-bezier(0.22, 1, 0.36, 1),
        gap 0.4s cubic-bezier(0.22, 1, 0.36, 1),
        border-radius 0.4s cubic-bezier(0.22, 1, 0.36, 1),
        flex 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.progressInfo {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font);
    font-size: 0.85rem;
    color: var(--white);
    margin-bottom: 0.25rem;
    transition: font-size 0.4s cubic-bezier(0.22, 1, 0.36, 1);
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
    background: rgba(var(--shadow-rgb), 0.4);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(var(--gold-rgb), 0.2);
    box-shadow: inset 0 2px 4px rgba(var(--shadow-rgb), 0.5);
    transition: height 0.4s cubic-bezier(0.22, 1, 0.36, 1);
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
            rgba(var(--ink-rgb), 0.4) 50%,
            transparent 100%);
    animation: shine 2s infinite;
}


.shopModal {
    margin-bottom: 20px;
    width: 100%;
    padding: 0 0.75rem;
    box-sizing: border-box;
}

@media (min-width: 768px) {
    .shopModal {
        padding: 0;
    }
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

:root[data-theme='light'] .actionsMenu,
:root[data-theme='light'] .pointsDialogCard,
:root[data-theme='light'] .rankDisplay,
:root[data-theme='light'] .experienceProgress,
:root[data-theme='light'] .progressBarContainer {
    border-color: rgba(13, 37, 48, 0.2);
    background: rgba(255, 255, 255, 0.96) !important;
    box-shadow: 0 8px 22px rgba(13, 37, 48, 0.12);
}

:root[data-theme='light'] .actionMenuItem .v-list-item-title,
:root[data-theme='light'] .pointsDialogTitle,
:root[data-theme='light'] .pointsDialogSubtitle,
:root[data-theme='light'] .progressInfo,
:root[data-theme='light'] .nextRankLabel {
    color: rgba(13, 37, 48, 0.88);
}

:root[data-theme='light'] .pointsCategoryItem {
    background: rgba(13, 37, 48, 0.05);
    color: rgba(13, 37, 48, 0.88);
}

:root[data-theme='light'] .classRankCard {
    background: transparent !important;
    box-shadow: none !important;
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
</style>
