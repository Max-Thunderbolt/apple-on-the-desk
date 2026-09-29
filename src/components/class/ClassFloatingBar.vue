<template>
    <div class="classFloatingDock" ref="barRef" :class="{ 'classFloatingDock--expanded': dockExpanded }">
        <Transition name="dock-panel">
            <div v-if="viewShopModal" class="dockCheckout">
                <button type="button" class="dockCheckoutChip" @click="emit('selectAll')">
                    <v-icon size="16">{{ isAllSelected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline' }}</v-icon>
                    {{ isAllSelected ? 'Deselect' : 'Select all' }}
                </button>
                <span v-if="selectedCount > 0" class="dockCheckoutMeta">{{ selectedCount }}/{{ totalStudents }}</span>
                <span class="dockCheckoutMeta">
                    {{ formatCost(totalSelectedPoints) }}
                    <span v-if="!canAffordShop" class="checkoutShortfall"> · need {{ formatCost(pointsRemaining) }}</span>
                </span>
                <button type="button" class="dockCheckoutBtn" :disabled="!canCheckout" @click="emit('checkout')">
                    Checkout
                </button>
            </div>
        </Transition>

        <div class="dockTimerHost" :class="{ 'dockTimerHost--active': timerPanelOpen }">
            <Timer
                ref="timerRef"
                variant="footer"
                embedded
                class="dockTimer"
            />
        </div>

        <div
            class="dockOrbs"
            :class="{ 'dockOrbs--visible': dockExpanded }"
            role="toolbar"
            aria-label="Class actions"
            :aria-hidden="!dockExpanded"
        >
            <button
                v-for="(action, index) in dockActions"
                :key="action.key"
                type="button"
                class="dockOrb"
                :tabindex="dockExpanded ? 0 : -1"
                :class="[
                    `dockOrb--${action.key}`,
                    { 'dockOrb--active': action.active, 'dockOrb--highlight': action.highlight },
                ]"
                :style="{ '--orb-index': index }"
                :aria-label="action.label"
                :title="action.label"
                @click.stop="onOrbClick(action)"
            >
                <span class="dockOrbIconWrap">
                    <v-icon size="22">{{ action.icon }}</v-icon>
                    <span v-if="action.showDot" class="dockOrbDot" aria-hidden="true" />
                </span>
                <span class="dockOrbLabel">{{ action.shortLabel }}</span>
            </button>
        </div>

        <div class="dockBar" @click.stop>
            <FloatingSearchBar
                ref="searchRef"
                compact
                :model-value="searchQuery"
                :placeholder="searchPlaceholder"
                @update:model-value="emit('update:searchQuery', $event)"
            />

            <Transition name="dock-timer-chip">
                <button
                    v-if="showCollapsedTimer"
                    type="button"
                    class="dockTimerChip"
                    :aria-label="`Timer ${timerDisplay} remaining`"
                    :title="`Timer ${timerDisplay}`"
                    @click.stop="openTimerFromCollapsed"
                >
                    <span class="dockTimerChipBody">
                        <v-icon size="16" class="dockTimerChipIcon">mdi-timer-outline</v-icon>
                        <span class="dockTimerChipTime">{{ timerDisplay }}</span>
                    </span>
                    <span class="dockTimerChipTrack" aria-hidden="true">
                        <span class="dockTimerChipFill" :style="{ width: `${timerProgress}%` }" />
                    </span>
                </button>
            </Transition>

            <button
                type="button"
                class="dockLauncher"
                :class="{ 'dockLauncher--open': dockExpanded }"
                :aria-expanded="dockExpanded"
                aria-label="Class actions"
                @click.stop="toggleDock"
            >
                <v-icon size="20">{{ dockExpanded ? 'mdi-close' : 'mdi-apps' }}</v-icon>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import FloatingSearchBar from '@/components/common/FloatingSearchBar.vue';
import Timer from '@/components/Timer.vue';
import { useFormat } from '@/composables/useFormat';
import { setClassFloatingBarHeight, clearClassFloatingBarHeight } from '@/composables/useClassFloatingBarHeight';

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
const dockExpanded = ref(false);
const timerPanelOpen = ref(false);
const timerIsRunning = ref(false);
const timerDisplay = ref('');
const timerProgress = ref(0);

const searchPlaceholder = computed(() =>
    props.viewShopModal ? 'Search shop' : 'Search',
);

const timerRunning = computed(() => timerIsRunning.value);
const showCollapsedTimer = computed(() => timerRunning.value && !dockExpanded.value);

const dockActions = computed(() => {
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

function blurSearch() {
    searchRef.value?.inputRef?.blur?.();
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
}

function closeDockPanels() {
    timerPanelOpen.value = false;
    timerRef.value?.closePanel?.();
    blurSearch();
}

function toggleDock() {
    dockExpanded.value = !dockExpanded.value;
    if (!dockExpanded.value) {
        closeDockPanels();
    }
}

function openTimerFromCollapsed() {
    dockExpanded.value = true;
    timerPanelOpen.value = true;
    timerRef.value?.openPanel?.();
    requestAnimationFrame(updateBarHeight);
}

function collapseDock() {
    dockExpanded.value = false;
    closeDockPanels();
    requestAnimationFrame(() => {
        updateBarHeight();
        requestAnimationFrame(updateBarHeight);
    });
}

function onOrbClick(action) {
    switch (action.key) {
    case 'shop':
        emit('viewShop');
        collapseDock();
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
        collapseDock();
        break;
    case 'receipts':
        emit('viewReceipts');
        collapseDock();
        break;
    case 'groups':
        emit('createGroups');
        collapseDock();
        break;
    case 'points':
        emit('awardClassPoints');
        collapseDock();
        break;
    case 'view':
        emit('update:viewMode', props.viewMode === 'list' ? 'groups' : 'list');
        break;
    default:
        break;
    }
}

function onDocumentClick(event) {
    if (!dockExpanded.value && !timerPanelOpen.value) return;
    const target = event.target;
    if (barRef.value?.contains(target)) return;
    collapseDock();
}

function setDocumentClickListening(shouldListen) {
    if (shouldListen) {
        document.addEventListener('click', onDocumentClick, true);
    } else {
        document.removeEventListener('click', onDocumentClick, true);
    }
}

function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea' || el.isContentEditable;
}

function onKeydown(event) {
    if (event.key === 'Escape' && dockExpanded.value) {
        collapseDock();
        return;
    }
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTypingTarget(event.target)) return;
    event.preventDefault();
    searchRef.value?.focus();
}

function updateBarHeight() {
    const height = barRef.value?.offsetHeight ?? 0;
    document.documentElement.style.setProperty('--class-floating-bar-height', `${height}px`);
    setClassFloatingBarHeight(height);
}

let resizeObserver = null;
let timerSyncInterval = null;

watch(() => props.viewShopModal, () => {
    requestAnimationFrame(updateBarHeight);
});

watch(dockExpanded, (expanded) => {
    setDocumentClickListening(expanded || timerPanelOpen.value);
    requestAnimationFrame(updateBarHeight);
});

watch(timerPanelOpen, (open) => {
    setDocumentClickListening(open || dockExpanded.value);
});

onMounted(() => {
    window.addEventListener('keydown', onKeydown);
    updateBarHeight();
    if (typeof ResizeObserver !== 'undefined' && barRef.value) {
        resizeObserver = new ResizeObserver(updateBarHeight);
        resizeObserver.observe(barRef.value);
    }
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
    window.removeEventListener('keydown', onKeydown);
    setDocumentClickListening(false);
    resizeObserver?.disconnect();
    if (timerSyncInterval) clearInterval(timerSyncInterval);
    document.documentElement.style.removeProperty('--class-floating-bar-height');
    clearClassFloatingBarHeight();
});

defineExpose({ searchRef, timerRef });
</script>

<style scoped>
.classFloatingDock {
    position: fixed;
    bottom: calc(var(--floating-dock-bottom-offset, 1.5rem) + env(safe-area-inset-bottom, 0px));
    left: 50%;
    transform: translateX(-50%);
    z-index: 900;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.65rem;
    pointer-events: none;
    background: transparent;
    overflow: visible;
}

.dockBar,
.dockCheckout {
    pointer-events: auto;
}

.dockOrbs {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 0.65rem;
    padding: 0 0.25rem;
    max-height: 0;
    opacity: 0;
    transform: translateY(12px);
    overflow: hidden;
    pointer-events: none;
    visibility: hidden;
    transition:
        opacity 0.22s ease,
        transform 0.22s ease,
        max-height 0.22s ease,
        visibility 0s linear 0.22s;
}

.dockOrbs--visible {
    max-height: 160px;
    opacity: 1;
    transform: translateY(0);
    overflow: visible;
    pointer-events: auto;
    visibility: visible;
    padding-top: 0.5rem;
    padding-bottom: 0.15rem;
    transition:
        opacity 0.22s ease,
        transform 0.22s ease,
        max-height 0.22s ease,
        visibility 0s linear 0s;
}

.dockOrbs--visible .dockOrb {
    animation: orbIn 0.38s cubic-bezier(0.34, 1.4, 0.64, 1) both;
    animation-delay: calc(var(--orb-index) * 45ms);
}

.dockBar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.dockLauncher {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid rgba(var(--ink-rgb), 0.18);
    background: rgba(var(--ink-rgb), 0.14);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    color: var(--white);
    box-shadow: 0 8px 32px rgba(var(--shadow-rgb), 0.32);
    cursor: pointer;
    transition: transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1), background 0.2s ease, box-shadow 0.2s ease;
}

.dockLauncher:hover {
    transform: scale(1.06);
    background: rgba(var(--ink-rgb), 0.22);
    box-shadow: 0 12px 36px rgba(var(--shadow-rgb), 0.38);
}

.dockLauncher--open {
    transform: rotate(90deg);
    background: rgba(var(--seaGreen-rgb), 0.28);
    border-color: rgba(var(--seaGreen-rgb), 0.45);
}

.dockTimerChip {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    gap: 0.28rem;
    height: 44px;
    min-width: 5.6rem;
    padding: 0.4rem 0.7rem 0.38rem;
    border-radius: 999px;
    border: 1px solid rgba(var(--seaGreen-rgb), 0.28);
    background:
        linear-gradient(180deg, rgba(var(--seaGreen-rgb), 0.16), rgba(var(--seaGreen-rgb), 0.06)),
        rgba(var(--ink-rgb), 0.14);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    color: var(--white);
    box-shadow: 0 8px 32px rgba(var(--shadow-rgb), 0.3);
    cursor: pointer;
    transition:
        transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1),
        background 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease;
}

.dockTimerChip:hover {
    transform: translateY(-1px) scale(1.03);
    border-color: rgba(var(--seaGreen-rgb), 0.48);
    background:
        linear-gradient(180deg, rgba(var(--seaGreen-rgb), 0.24), rgba(var(--seaGreen-rgb), 0.1)),
        rgba(var(--ink-rgb), 0.16);
    box-shadow: 0 12px 36px rgba(var(--shadow-rgb), 0.36);
}

.dockTimerChip:active {
    transform: scale(0.98);
}

.dockTimerChipBody {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.28rem;
    line-height: 1;
}

.dockTimerChipIcon {
    color: var(--seaGreen);
    flex-shrink: 0;
    opacity: 0.95;
}

.dockTimerChipTime {
    font-family: var(--font);
    font-size: 0.82rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
    line-height: 1;
}

.dockTimerChipTrack {
    display: block;
    width: 100%;
    height: 3px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(var(--shadow-rgb), 0.28);
}

.dockTimerChipFill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, rgba(var(--seaGreen-rgb), 0.75), var(--seaGreen));
    transition: width 1s linear;
}

.dockOrb {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    overflow: visible;
}

.dockOrbIconWrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 1px solid rgba(var(--ink-rgb), 0.16);
    background: rgba(var(--ink-rgb), 0.14);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 10px 36px rgba(var(--shadow-rgb), 0.34);
    color: var(--white);
    transition: transform 0.22s ease, background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.dockOrb:hover .dockOrbIconWrap {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 16px 40px rgba(var(--shadow-rgb), 0.42);
}

.dockOrb--active .dockOrbIconWrap {
    border-color: rgba(var(--seaGreen-rgb), 0.55);
    background: rgba(var(--seaGreen-rgb), 0.22);
}

.dockOrb--highlight .dockOrbIconWrap {
    animation: orbGlow 2s ease-in-out infinite;
}

.dockOrb--shop .dockOrbIconWrap { color: var(--freshSky); }
.dockOrb--timer .dockOrbIconWrap { color: var(--seaGreen); }
.dockOrb--groups .dockOrbIconWrap { color: orange; }
.dockOrb--points .dockOrbIconWrap { color: var(--gold, gold); }
.dockOrb--create .dockOrbIconWrap { color: var(--seaGreen); }
.dockOrb--receipts .dockOrbIconWrap { color: var(--freshSky); }
.dockOrb--view .dockOrbIconWrap { color: var(--white); }

.dockOrbLabel {
    font-family: var(--font);
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--white);
    opacity: 0.85;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 6px rgba(var(--shadow-rgb), 0.6);
    max-width: 56px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dockOrbDot {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--seaGreen);
    box-shadow: 0 0 6px rgba(var(--seaGreen-rgb), 0.9);
}

.dockTimerHost {
    position: absolute;
    bottom: calc(100% + 3.5rem);
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    width: 0;
    height: 0;
}

.dockTimerHost--active {
    pointer-events: auto;
    width: auto;
    height: auto;
}

.dockTimer {
    pointer-events: none;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 0;
}

.dockTimerHost--active .dockTimer {
    pointer-events: auto;
}

.dockTimer--hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    opacity: 0;
    pointer-events: none;
}

.dockCheckout {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    max-width: min(92vw, 420px);
    padding: 0.45rem 0.65rem;
    border-radius: 999px;
    border: 1px solid rgba(var(--ink-rgb), 0.16);
    background: rgba(var(--ink-rgb), 0.12);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(var(--shadow-rgb), 0.3);
}

.dockCheckoutChip,
.dockCheckoutBtn {
    font-family: var(--font);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--white);
    border-radius: 999px;
    border: 1px solid rgba(var(--ink-rgb), 0.18);
    background: rgba(var(--ink-rgb), 0.1);
    padding: 0.35rem 0.65rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    transition: background 0.15s ease;
}

.dockCheckoutChip:hover,
.dockCheckoutBtn:hover:not(:disabled) {
    background: rgba(var(--seaGreen-rgb), 0.25);
}

.dockCheckoutBtn {
    background: rgba(var(--seaGreen-rgb), 0.35);
    border-color: rgba(var(--seaGreen-rgb), 0.45);
}

.dockCheckoutBtn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.dockCheckoutMeta {
    font-family: var(--font);
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--white);
    opacity: 0.85;
}

.checkoutShortfall {
    color: var(--intenseCherry);
}

@keyframes orbIn {
    from {
        opacity: 0;
        transform: translateY(16px) scale(0.7);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes orbGlow {
    0%, 100% {
        box-shadow: 0 10px 36px rgba(var(--shadow-rgb), 0.34), 0 0 0 0 rgba(var(--seaGreen-rgb), 0.3);
    }
    50% {
        box-shadow: 0 10px 36px rgba(var(--shadow-rgb), 0.34), 0 0 0 6px rgba(var(--seaGreen-rgb), 0.15);
    }
}

.dock-panel-enter-active,
.dock-panel-leave-active {
    transition: opacity 0.2s ease, transform 0.22s ease;
}

.dock-panel-enter-from,
.dock-panel-leave-to {
    opacity: 0;
    transform: translateY(8px);
}

.dock-timer-chip-enter-active {
    transition: opacity 0.28s ease, transform 0.34s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.dock-timer-chip-leave-active {
    transition: opacity 0.18s ease, transform 0.18s ease;
}

.dock-timer-chip-enter-from,
.dock-timer-chip-leave-to {
    opacity: 0;
    transform: scale(0.82);
}

:root[data-theme='light'] .dockLauncher,
:root[data-theme='light'] .dockOrbIconWrap,
:root[data-theme='light'] .dockCheckout {
    background: rgba(255, 255, 255, 0.72);
    border-color: rgba(13, 37, 48, 0.12);
    box-shadow: 0 10px 32px rgba(13, 37, 48, 0.14);
    color: rgba(13, 37, 48, 0.88);
}

:root[data-theme='light'] .dockTimerChip {
    color: rgba(13, 37, 48, 0.88);
    border-color: rgba(var(--seaGreen-rgb), 0.32);
    background:
        linear-gradient(180deg, rgba(var(--seaGreen-rgb), 0.14), rgba(255, 255, 255, 0.55)),
        rgba(255, 255, 255, 0.72);
    box-shadow: 0 10px 32px rgba(13, 37, 48, 0.12);
}

:root[data-theme='light'] .dockTimerChip:hover {
    border-color: rgba(var(--seaGreen-rgb), 0.48);
    background:
        linear-gradient(180deg, rgba(var(--seaGreen-rgb), 0.2), rgba(255, 255, 255, 0.65)),
        rgba(255, 255, 255, 0.8);
}

:root[data-theme='light'] .dockTimerChipTrack {
    background: rgba(13, 37, 48, 0.1);
}

:root[data-theme='light'] .dockOrbLabel,
:root[data-theme='light'] .dockCheckoutMeta {
    color: rgba(13, 37, 48, 0.75);
    text-shadow: none;
}

:root[data-theme='light'] .dockCheckoutChip,
:root[data-theme='light'] .dockCheckoutBtn {
    color: rgba(13, 37, 48, 0.88);
    background: rgba(13, 37, 48, 0.06);
}
</style>
