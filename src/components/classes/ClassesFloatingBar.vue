<template>
    <div class="classesToolbar" ref="barRef">
        <div class="toolbarLeft">
            <FloatingSearchBar
                v-if="hasClasses"
                ref="searchRef"
                compact
                :model-value="searchQuery"
                placeholder="Search classes"
                @update:model-value="emit('update:searchQuery', $event)"
            />
        </div>
        <div class="toolbarRight" role="toolbar" aria-label="Classes actions">
            <v-menu v-model="sortPanelOpen" location="bottom" :close-on-content-click="true">
                <template #activator="{ props: menuProps }">
                    <button
                        type="button"
                        class="toolbarBtn"
                        v-bind="menuProps"
                        :class="{ 'toolbarBtn--active': sortPanelOpen }"
                        aria-label="Sort classes"
                    >
                        <v-icon size="18">mdi-sort</v-icon>
                        <span class="toolbarBtnLabel">{{ currentSortLabel }}</span>
                    </button>
                </template>
                <v-list class="sortMenu">
                    <v-list-item
                        v-for="option in sortOptions"
                        :key="option.value"
                        @click="selectSort(option.value)"
                        :class="{ 'sortMenuItem--active': sortBy === option.value }"
                    >
                        {{ option.label }}
                    </v-list-item>
                </v-list>
            </v-menu>
            
            <button
                type="button"
                class="toolbarBtn"
                :class="{ 'toolbarBtn--active': viewMode === 'list' }"
                :aria-label="viewMode === 'cards' ? 'Switch to list view' : 'Switch to card view'"
                @click="toggleView"
            >
                <v-icon size="18">{{ viewMode === 'cards' ? 'mdi-view-list' : 'mdi-view-grid' }}</v-icon>
                <span class="toolbarBtnLabel">{{ viewMode === 'cards' ? 'List' : 'Cards' }}</span>
            </button>

            <button
                type="button"
                class="toolbarBtn toolbarBtn--primary"
                :disabled="!canCreateClass"
                aria-label="Create class"
                @click="emit('createClass')"
            >
                <v-icon size="18">mdi-plus</v-icon>
                <span class="toolbarBtnLabel">Add</span>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import FloatingSearchBar from '@/components/common/FloatingSearchBar.vue';

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
const sortPanelOpen = ref(false);

const currentSortLabel = computed(() =>
    sortOptions.find((o) => o.value === props.sortBy)?.label ?? 'Sort',
);

function selectSort(value) {
    emit('update:sortBy', value);
    sortPanelOpen.value = false;
}

function toggleView() {
    emit('update:viewMode', props.viewMode === 'cards' ? 'list' : 'cards');
}
</script>

<style scoped>
.classesToolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem 0;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
}

.toolbarLeft {
    flex: 1;
    min-width: 200px;
    max-width: 400px;
}

.toolbarRight {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.toolbarBtn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.85rem;
    font-family: var(--font);
    font-size: 0.9rem;
    font-weight: 600;
    color: rgba(var(--ink-rgb), 0.7);
    background: rgba(var(--ink-rgb), 0.04);
    border: 1px solid rgba(var(--ink-rgb), 0.12);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.toolbarBtn:hover:not(:disabled) {
    background: rgba(var(--ink-rgb), 0.08);
    border-color: rgba(var(--ink-rgb), 0.18);
    color: rgba(var(--ink-rgb), 0.85);
}

.toolbarBtn--active {
    background: rgba(26, 147, 111, 0.12);
    border-color: rgba(26, 147, 111, 0.3);
    color: var(--seaGreen);
}

.toolbarBtn--primary {
    background: rgba(26, 147, 111, 0.18);
    border-color: rgba(26, 147, 111, 0.3);
    color: var(--seaGreen);
}

.toolbarBtn--primary:hover:not(:disabled) {
    background: rgba(26, 147, 111, 0.25);
    border-color: rgba(26, 147, 111, 0.4);
    transform: translateY(-1px);
}

.toolbarBtn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.toolbarBtnLabel {
    line-height: 1;
}

.sortMenu {
    background: var(--inkBlack);
    border: 1px solid rgba(var(--ink-rgb), 0.2);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(var(--shadow-rgb), 0.4);
    padding: 0.35rem;
}

.sortMenu :deep(.v-list-item) {
    font-family: var(--font);
    font-weight: 600;
    color: var(--white);
    border-radius: 8px;
    min-height: 40px;
}

.sortMenu :deep(.v-list-item:hover) {
    background: rgba(var(--seaGreen-rgb), 0.15);
}

.sortMenu :deep(.v-list-item.sortMenuItem--active) {
    background: rgba(var(--seaGreen-rgb), 0.25);
    color: var(--seaGreen);
}

@media (max-width: 600px) {
    .classesToolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .toolbarLeft {
        max-width: none;
    }

    .toolbarRight {
        justify-content: flex-end;
    }
}

:root[data-theme='light'] .toolbarBtn {
    color: rgba(13, 37, 48, 0.7);
    background: rgba(255, 255, 255, 0.5);
    border-color: rgba(13, 37, 48, 0.12);
}

:root[data-theme='light'] .toolbarBtn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(13, 37, 48, 0.2);
    color: rgba(13, 37, 48, 0.9);
}

:root[data-theme='light'] .toolbarBtn--active,
:root[data-theme='light'] .toolbarBtn--primary {
    background: rgba(26, 147, 111, 0.1);
    border-color: rgba(26, 147, 111, 0.25);
    color: rgba(26, 147, 111, 0.9);
}

:root[data-theme='light'] .sortMenu {
    background: rgba(255, 255, 255, 0.98);
    border-color: rgba(13, 37, 48, 0.12);
    box-shadow: 0 8px 24px rgba(13, 37, 48, 0.12);
}

:root[data-theme='light'] .sortMenu :deep(.v-list-item) {
    color: rgba(13, 37, 48, 0.85);
}

:root[data-theme='light'] .sortMenu :deep(.v-list-item:hover) {
    background: rgba(26, 147, 111, 0.08);
}

:root[data-theme='light'] .sortMenu :deep(.v-list-item.sortMenuItem--active) {
    background: rgba(26, 147, 111, 0.15);
    color: rgba(26, 147, 111, 0.95);
}
</style>
