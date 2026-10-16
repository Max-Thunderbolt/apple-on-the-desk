<template>
    <div class="classToolbar" ref="barRef">
        <!-- Checkout panel (shown when in shop mode with selections) -->
        <Transition name="toolbar-panel">
            <div v-if="viewShopModal && (selectedCount > 0 || isAllSelected)" class="toolbarCheckout">
                <button type="button" class="checkoutChip" @click="emit('selectAll')">
                    <v-icon size="16">{{ isAllSelected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline' }}</v-icon>
                    {{ isAllSelected ? 'Deselect' : 'Select all' }}
                </button>
                <span v-if="selectedCount > 0" class="checkoutMeta">{{ selectedCount }}/{{ totalStudents }}</span>
                <span class="checkoutMeta">
                    {{ formatCost(totalSelectedPoints) }}
                    <span v-if="!canAffordShop" class="checkoutShortfall"> · need {{ formatCost(pointsRemaining) }}</span>
                </span>
                <button type="button" class="checkoutBtn" :disabled="!canCheckout" @click="emit('checkout')">
                    Checkout
                </button>
            </div>
        </Transition>

        <!-- Timer modal (shown when opened) -->
        <div v-if="timerPanelOpen" class="toolbarTimerHost">
            <Timer
                ref="timerRef"
                variant="footer"
                embedded
                class="toolbarTimer"
            />
        </div>

        <!-- Main toolbar -->
        <div class="toolbarMain">
            <FloatingSearchBar
                ref="searchRef"
                compact
                :model-value="searchQuery"
                :placeholder="searchPlaceholder"
                @update:model-value="emit('update:searchQuery', $event)"
            />

            <div class="toolbarActions" role="toolbar" aria-label="Class actions">
                <button
                    v-for="action in toolbarActions"
                    :key="action.key"
                    type="button"
                    class="toolbarBtn"
                    :class="[
                        { 'toolbarBtn--active': action.active, 'toolbarBtn--highlight': action.highlight },
                    ]"
                    :aria-label="action.label"
                    :title="action.label"
                    @click="onActionClick(action)"
                >
                    <v-icon size="18">{{ action.icon }}</v-icon>
                    <span class="toolbarBtnLabel">{{ action.shortLabel }}</span>
                    <span v-if="action.showDot" class="toolbarBtnDot" aria-hidden="true" />
                </button>
            </div>
        </div>

        <!-- Inline timer display when running (collapsed) -->
        <Transition name="toolbar-timer">
            <div
                v-if="showCollapsedTimer"
                class="toolbarTimerChip"
                :aria-label="`Timer ${timerDisplay} remaining`"
                :title="`Timer ${timerDisplay}`"
                @click="openTimerFromCollapsed"
            >
                <v-icon size="16" class="timerChipIcon">mdi-timer-outline</v-icon>
                <span class="timerChipTime">{{ timerDisplay }}</span>
                <span class="timerChipTrack" aria-hidden="true">
                    <span class="timerChipFill" :style="{ width: `${timerProgress}%` }" />
                </span>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import FloatingSearchBar from '@/components/common/FloatingSearchBar.vue';
import Timer from '@/components/Timer.vue';
import { useFormat } from '@/composables/useFormat';

const props = defineProps({
    searchQuery: { type: String, default: '' },
    viewShopModal: { type: Boolean, required: true },
    viewMode: {
        type: String,
        default: 'list',
        validator: (v) => ['list', 'groups'].includes(v),
    },
    hasGroups: { type: Boolean, default: false },
    hasExistingGroups: { type: Boolean, default: false },
    hasStudents: { type: Boolean, default: false },
    shopEmpty: { type: Boolean, default: false },
    isAllSelected: { type: Boolean, default: false },
    selectedCount: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0 },
    totalSelectedPoints: { type: Number, default: 0 },
    pointsRemaining: { type: Number, default: 0 },
    canAffordShop: { type: Boolean, default: false },
    canCheckout: { type: Boolean, default: false },
});

const emit = defineEmits([
    'update:searchQuery',
    'update:viewMode',
    'viewShop',
    'createShopItem',
    'viewReceipts',
    'awardClassPoints',
    'createGroups',
    'selectAll',
    'checkout',
]);

const { formatCost } = useFormat();

const barRef = ref(null);
const searchRef = ref(null);
const timerRef = ref(null);
const timerPanelOpen = ref(false);
const timerIsRunning = ref(false);
const timerDisplay = ref('');
const timerProgress = ref(0);

const searchPlaceholder = computed(() =>
    props.viewShopModal ? 'Search shop' : 'Search',
);

const timerRunning = computed(() => timerIsRunning.value);
const showCollapsedTimer = computed(() => timerRunning.value && !timerPanelOpen.value);

const toolbarActions = computed(() => {
    const actions = [
        {
            key: 'shop',
            label: props.viewShopModal ? 'Back to class' : 'Shop',
            shortLabel: 'Shop',
            icon: props.viewShopModal ? 'mdi-arrow-left' : 'mdi-store',
            active: props.viewShopModal,
            highlight: false,
            showDot: false,
        },
        {
            key: 'timer',
            label: 'Timer',
            shortLabel: timerRunning.value ? timerDisplay.value : 'Timer',
            icon: 'mdi-timer',
            active: timerPanelOpen.value,
            highlight: timerRunning.value,
            showDot: timerRunning.value,
        },
        {
            key: 'groups',
            label: props.hasExistingGroups ? 'Manage groups' : 'Create groups',
            shortLabel: 'Groups',
            icon: 'mdi-account-group',
            active: false,
            highlight: false,
            showDot: false,
        },
        {
            key: 'points',
            label: 'Award class points',
            shortLabel: 'Points',
            icon: 'mdi-medal',
            active: false,
            highlight: false,
            showDot: false,
        },
    ];

    if (props.viewShopModal) {
        actions.splice(1, 0, {
            key: 'create',
            label: 'Create shop item',
            shortLabel: 'Add',
            icon: 'mdi-plus',
            active: false,
            highlight: props.shopEmpty,
            showDot: false,
        });
        actions.splice(2, 0, {
            key: 'receipts',
            label: 'View receipts',
            shortLabel: 'Receipts',
            icon: 'mdi-receipt-text-outline',
            active: false,
            highlight: false,
            showDot: false,
        });
    }

    if (props.hasStudents && props.hasGroups) {
        actions.push({
            key: 'view',
            label: props.viewMode === 'list' ? 'Group view' : 'List view',
            shortLabel: props.viewMode === 'list' ? 'Groups' : 'List',
            icon: props.viewMode === 'list' ? 'mdi-view-grid' : 'mdi-view-list',
            active: props.viewMode === 'groups',
            highlight: false,
            showDot: false,
        });
    }

    return actions;
});

function openTimerFromCollapsed() {
    timerPanelOpen.value = true;
    timerRef.value?.openPanel?.();
}

function onActionClick(action) {
    switch (action.key) {
    case 'shop':
        emit('viewShop');
        break;
    case 'timer':
        timerPanelOpen.value = !timerPanelOpen.value;
        if (timerPanelOpen.value) {
            timerRef.value?.openPanel?.();
        } else {
            timerRef.value?.closePanel?.();
        }
        break;
    case 'create':
        emit('createShopItem');
        break;
    case 'receipts':
        emit('viewReceipts');
        break;
    case 'groups':
        emit('createGroups');
        break;
    case 'points':
        emit('awardClassPoints');
        break;
    case 'view':
        emit('update:viewMode', props.viewMode === 'list' ? 'groups' : 'list');
        break;
    default:
        break;
    }
}

let timerSyncInterval = null;

onMounted(() => {
    const syncTimerRunning = () => {
        const running = timerRef.value?.isRunning;
        timerIsRunning.value = running?.value ?? running ?? false;
        const time = timerRef.value?.formattedTime;
        timerDisplay.value = time?.value ?? time ?? '';
        const prog = timerRef.value?.progress;
        timerProgress.value = prog?.value ?? prog ?? 0;
    };
    syncTimerRunning();
    timerSyncInterval = setInterval(syncTimerRunning, 500);
});

onUnmounted(() => {
    if (timerSyncInterval) clearInterval(timerSyncInterval);
});

defineExpose({ searchRef, timerRef });
</script>

<style scoped>
.classToolbar {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem 0;
    margin-bottom: 1rem;
}

.toolbarCheckout {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem 0.85rem;
    border-radius: 14px;
    border: 1px solid rgba(var(--ink-rgb), 0.15);
    background: rgba(var(--ink-rgb), 0.05);
}

.checkoutChip,
.checkoutBtn {
    font-family: var(--font);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--white);
    border-radius: 10px;
    border: 1px solid rgba(var(--ink-rgb), 0.18);
    background: rgba(var(--ink-rgb), 0.08);
    padding: 0.4rem 0.75rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    transition: background 0.15s ease, border-color 0.15s ease;
}

.checkoutChip:hover,
.checkoutBtn:hover:not(:disabled) {
    background: rgba(var(--seaGreen-rgb), 0.15);
    border-color: rgba(var(--seaGreen-rgb), 0.3);
}

.checkoutBtn {
    background: rgba(var(--seaGreen-rgb), 0.2);
    border-color: rgba(var(--seaGreen-rgb), 0.35);
}

.checkoutBtn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.checkoutMeta {
    font-family: var(--font);
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(var(--ink-rgb), 0.75);
}

.checkoutShortfall {
    color: var(--intenseCherry);
}

.toolbarTimerHost {
    position: relative;
    width: 100%;
}

.toolbarTimer {
    width: 100%;
}

.toolbarMain {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.toolbarMain :deep(.floatingSearchBar) {
    flex: 1;
    min-width: 180px;
    max-width: 300px;
}

.toolbarActions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.toolbarBtn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.85rem;
    font-family: var(--font);
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(var(--ink-rgb), 0.7);
    background: rgba(var(--ink-rgb), 0.04);
    border: 1px solid rgba(var(--ink-rgb), 0.12);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.toolbarBtn:hover {
    background: rgba(var(--ink-rgb), 0.08);
    border-color: rgba(var(--ink-rgb), 0.18);
    color: rgba(var(--ink-rgb), 0.85);
}

.toolbarBtn--active {
    background: rgba(26, 147, 111, 0.12);
    border-color: rgba(26, 147, 111, 0.3);
    color: var(--seaGreen);
}

.toolbarBtn--highlight {
    animation: btnPulse 2s ease-in-out infinite;
}

.toolbarBtnLabel {
    line-height: 1;
}

.toolbarBtnDot {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--seaGreen);
    box-shadow: 0 0 4px rgba(var(--seaGreen-rgb), 0.8);
}

.toolbarTimerChip {
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    gap: 0.3rem;
    min-width: 100px;
    padding: 0.45rem 0.75rem;
    border-radius: 10px;
    border: 1px solid rgba(var(--seaGreen-rgb), 0.3);
    background: rgba(var(--seaGreen-rgb), 0.08);
    color: rgba(var(--ink-rgb), 0.85);
    cursor: pointer;
    transition: all 0.2s ease;
}

.toolbarTimerChip:hover {
    border-color: rgba(var(--seaGreen-rgb), 0.4);
    background: rgba(var(--seaGreen-rgb), 0.12);
    transform: translateY(-1px);
}

.timerChipIcon {
    color: var(--seaGreen);
    flex-shrink: 0;
    opacity: 0.95;
}

.timerChipTime {
    font-family: var(--font);
    font-size: 0.8rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.03em;
    text-align: center;
}

.timerChipTrack {
    display: block;
    width: 100%;
    height: 3px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(var(--shadow-rgb), 0.2);
}

.timerChipFill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, rgba(var(--seaGreen-rgb), 0.7), var(--seaGreen));
    transition: width 1s linear;
}

@keyframes btnPulse {
    0%, 100% {
        box-shadow: 0 0 0 0 rgba(var(--seaGreen-rgb), 0.4);
    }
    50% {
        box-shadow: 0 0 0 4px rgba(var(--seaGreen-rgb), 0);
    }
}

.toolbar-panel-enter-active,
.toolbar-panel-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.toolbar-panel-enter-from,
.toolbar-panel-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

.toolbar-timer-enter-active {
    transition: opacity 0.25s ease, transform 0.3s ease;
}

.toolbar-timer-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.toolbar-timer-enter-from,
.toolbar-timer-leave-to {
    opacity: 0;
    transform: scale(0.9);
}

@media (max-width: 640px) {
    .toolbarMain {
        flex-direction: column;
        align-items: stretch;
    }

    .toolbarMain :deep(.floatingSearchBar) {
        max-width: none;
    }

    .toolbarActions {
        justify-content: center;
    }
}

:root[data-theme='light'] .toolbarCheckout {
    background: rgba(255, 255, 255, 0.5);
    border-color: rgba(13, 37, 48, 0.12);
}

:root[data-theme='light'] .checkoutChip,
:root[data-theme='light'] .checkoutBtn {
    color: rgba(13, 37, 48, 0.85);
    background: rgba(255, 255, 255, 0.6);
    border-color: rgba(13, 37, 48, 0.15);
}

:root[data-theme='light'] .checkoutMeta {
    color: rgba(13, 37, 48, 0.7);
}

:root[data-theme='light'] .toolbarBtn {
    color: rgba(13, 37, 48, 0.7);
    background: rgba(255, 255, 255, 0.5);
    border-color: rgba(13, 37, 48, 0.12);
}

:root[data-theme='light'] .toolbarBtn:hover {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(13, 37, 48, 0.2);
    color: rgba(13, 37, 48, 0.9);
}

:root[data-theme='light'] .toolbarBtn--active {
    background: rgba(26, 147, 111, 0.1);
    border-color: rgba(26, 147, 111, 0.25);
    color: rgba(26, 147, 111, 0.9);
}

:root[data-theme='light'] .toolbarTimerChip {
    color: rgba(13, 37, 48, 0.85);
    background: rgba(26, 147, 111, 0.06);
    border-color: rgba(26, 147, 111, 0.25);
}
</style>
