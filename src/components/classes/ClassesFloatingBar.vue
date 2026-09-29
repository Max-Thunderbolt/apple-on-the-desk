<template>
    <div class="classFloatingDock" ref="barRef" :class="{ 'classFloatingDock--expanded': dockExpanded }">
        <div class="dockSortHost" :class="{ 'dockSortHost--active': sortPanelOpen }">
            <Transition name="dock-panel">
                <div v-if="sortPanelOpen" class="dockSortPanel">
                    <button
                        v-for="option in sortOptions"
                        :key="option.value"
                        type="button"
                        class="sortChip"
                        :class="{ 'sortChip--active': sortBy === option.value }"
                        @click="selectSort(option.value)"
                    >
                        {{ option.label }}
                    </button>
                </div>
            </Transition>
        </div>

        <div
            class="dockOrbs"
            :class="{ 'dockOrbs--visible': dockExpanded }"
            role="toolbar"
            aria-label="Classes actions"
            :aria-hidden="!dockExpanded"
        >
            <button
                v-for="(action, index) in dockActions"
                :key="action.key"
                type="button"
                class="dockOrb"
                :tabindex="dockExpanded ? 0 : -1"
                :disabled="action.disabled"
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
                </span>
                <span class="dockOrbLabel">{{ action.shortLabel }}</span>
            </button>
        </div>

        <div class="dockBar" @click.stop>
            <FloatingSearchBar
                v-if="hasClasses"
                ref="searchRef"
                compact
                :model-value="searchQuery"
                placeholder="Search classes"
                @update:model-value="emit('update:searchQuery', $event)"
            />

            <button
                type="button"
                class="dockLauncher"
                :class="{ 'dockLauncher--open': dockExpanded }"
                :aria-expanded="dockExpanded"
                aria-label="Classes actions"
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
import { setClassFloatingBarHeight, clearClassFloatingBarHeight } from '@/composables/useClassFloatingBarHeight';

const props = defineProps({
    searchQuery: { type: String, default: '' },
    sortBy: {
        type: String,
        default: 'name',
        validator: (v) => ['name', 'rank', 'students'].includes(v),
    },
    viewMode: {
        type: String,
        default: 'cards',
        validator: (v) => ['cards', 'list'].includes(v),
    },
    canCreateClass: { type: Boolean, default: false },
    hasClasses: { type: Boolean, default: false },
});

const emit = defineEmits([
    'update:searchQuery',
    'update:sortBy',
    'update:viewMode',
    'createClass',
]);

const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'rank', label: 'Rank' },
    { value: 'students', label: 'Students' },
];

const barRef = ref(null);
const searchRef = ref(null);
const dockExpanded = ref(false);
const sortPanelOpen = ref(false);

const currentSortLabel = computed(() =>
    sortOptions.find((o) => o.value === props.sortBy)?.label ?? 'Sort',
);

const dockActions = computed(() => [
    {
        key: 'sort',
        label: 'Sort classes',
        shortLabel: currentSortLabel.value,
        icon: 'mdi-sort',
        active: sortPanelOpen.value,
        highlight: false,
        disabled: false,
    },
    {
        key: 'view',
        label: props.viewMode === 'cards' ? 'Switch to list view' : 'Switch to card view',
        shortLabel: props.viewMode === 'cards' ? 'List' : 'Cards',
        icon: props.viewMode === 'cards' ? 'mdi-view-list' : 'mdi-view-grid',
        active: props.viewMode === 'list',
        highlight: false,
        disabled: false,
    },
    {
        key: 'create',
        label: 'Create class',
        shortLabel: 'Add',
        icon: 'mdi-plus',
        active: false,
        highlight: props.canCreateClass,
        disabled: !props.canCreateClass,
    },
]);

function blurSearch() {
    searchRef.value?.inputRef?.blur?.();
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
}

function closeDockPanels() {
    sortPanelOpen.value = false;
    blurSearch();
}

function toggleDock() {
    dockExpanded.value = !dockExpanded.value;
    if (!dockExpanded.value) {
        closeDockPanels();
    }
}

function collapseDock() {
    dockExpanded.value = false;
    closeDockPanels();
    requestAnimationFrame(() => {
        updateBarHeight();
        requestAnimationFrame(updateBarHeight);
    });
}

function selectSort(value) {
    emit('update:sortBy', value);
    sortPanelOpen.value = false;
}

function onOrbClick(action) {
    if (action.disabled) return;

    switch (action.key) {
    case 'sort':
        sortPanelOpen.value = !sortPanelOpen.value;
        break;
    case 'view':
        emit('update:viewMode', props.viewMode === 'cards' ? 'list' : 'cards');
        break;
    case 'create':
        emit('createClass');
        collapseDock();
        break;
    default:
        break;
    }
}

function onDocumentClick(event) {
    if (!dockExpanded.value && !sortPanelOpen.value) return;
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
    if (event.key === 'Escape') {
        if (dockExpanded.value || sortPanelOpen.value) {
            collapseDock();
        }
        return;
    }
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTypingTarget(event.target) || !props.hasClasses) return;
    event.preventDefault();
    searchRef.value?.focus();
}

function updateBarHeight() {
    const height = barRef.value?.offsetHeight ?? 0;
    document.documentElement.style.setProperty('--class-floating-bar-height', `${height}px`);
    setClassFloatingBarHeight(height);
}

let resizeObserver = null;

watch(dockExpanded, (expanded) => {
    setDocumentClickListening(expanded || sortPanelOpen.value);
    requestAnimationFrame(updateBarHeight);
});

watch(sortPanelOpen, (open) => {
    setDocumentClickListening(open || dockExpanded.value);
    requestAnimationFrame(updateBarHeight);
});

watch(() => props.hasClasses, () => {
    requestAnimationFrame(updateBarHeight);
});

onMounted(() => {
    window.addEventListener('keydown', onKeydown);
    updateBarHeight();
    if (typeof ResizeObserver !== 'undefined' && barRef.value) {
        resizeObserver = new ResizeObserver(updateBarHeight);
        resizeObserver.observe(barRef.value);
    }
});

onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown);
    setDocumentClickListening(false);
    resizeObserver?.disconnect();
    document.documentElement.style.removeProperty('--class-floating-bar-height');
    clearClassFloatingBarHeight();
});
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

.dockBar {
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

.dockOrb:disabled {
    cursor: not-allowed;
    opacity: 0.45;
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

.dockOrb:hover:not(:disabled) .dockOrbIconWrap {
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

.dockOrb--sort .dockOrbIconWrap { color: var(--freshSky); }
.dockOrb--view .dockOrbIconWrap { color: var(--white); }
.dockOrb--create .dockOrbIconWrap { color: var(--seaGreen); }

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

.dockSortHost {
    position: absolute;
    bottom: calc(100% + 3.5rem);
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    width: 0;
    height: 0;
}

.dockSortHost--active {
    pointer-events: auto;
    width: auto;
    height: auto;
}

.dockSortPanel {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem;
    min-width: 220px;
    max-width: min(320px, 90vw);
    padding: 0.85rem;
    background: var(--inkBlack);
    border: 1px solid rgba(var(--ink-rgb), 0.25);
    border-radius: 16px;
    box-shadow: 0 -8px 28px rgba(var(--shadow-rgb), 0.45);
}

.sortChip {
    font-family: var(--font);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--white);
    background: rgba(var(--ink-rgb), 0.12);
    border: 1px solid rgba(var(--ink-rgb), 0.25);
    border-radius: 999px;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
}

.sortChip:hover,
.sortChip--active {
    background: rgba(var(--seaGreen-rgb), 0.25);
    border-color: var(--seaGreen);
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

:root[data-theme='light'] .dockLauncher,
:root[data-theme='light'] .dockOrbIconWrap,
:root[data-theme='light'] .dockSortPanel {
    background: rgba(255, 255, 255, 0.72);
    border-color: rgba(13, 37, 48, 0.12);
    box-shadow: 0 10px 32px rgba(13, 37, 48, 0.14);
    color: rgba(13, 37, 48, 0.88);
}

:root[data-theme='light'] .dockOrbLabel {
    color: rgba(13, 37, 48, 0.75);
    text-shadow: none;
}

:root[data-theme='light'] .sortChip {
    color: rgba(13, 37, 48, 0.88);
    background: rgba(13, 37, 48, 0.06);
}
</style>
