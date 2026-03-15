<template>
    <div class="controlsBar">
        <div class="searchWrap">
            <input v-model="searchInput" type="text" class="searchInput" placeholder="Search" @input="onSearchInput" />
        </div>
        <div class="actionsPill" :class="{ 'actions-pill-glow': highlightActions }">
            <div class="actionsPillSection">
                <v-tooltip location="bottom" :text="viewShopModal ? 'Timer' : 'Shop'">
                    <template #activator="{ props: tooltipProps }">
                        <v-btn v-bind="tooltipProps" class="actionPillBtn" variant="text" @click="emit('viewShop')">
                            <v-icon class="actionIcon actionIcon--shop">{{ viewShopModal ? 'mdi-timer' : 'mdi-store'
                                }}</v-icon>
                        </v-btn>
                    </template>
                </v-tooltip>
                <template v-if="viewShopModal">
                    <v-tooltip location="bottom" text="Create shop item">
                        <template #activator="{ props: tooltipProps }">
                            <v-btn v-bind="tooltipProps" class="actionPillBtn"
                                :class="{ 'actionPillBtn--highlight': highlightActions }" variant="text"
                                @click="emit('createShopItem')">
                                <v-icon class="actionIcon actionIcon--create">mdi-plus</v-icon>
                            </v-btn>
                        </template>
                    </v-tooltip>
                </template>
                <template v-else>
                    <v-tooltip location="bottom" text="Award Class Points">
                        <template #activator="{ props: tooltipProps }">
                            <v-btn v-bind="tooltipProps" class="actionPillBtn" variant="text"
                                @click="emit('awardClassPoints')">
                                <v-icon class="actionIcon actionIcon--award">mdi-medal</v-icon>
                            </v-btn>
                        </template>
                    </v-tooltip>
                    <v-tooltip location="bottom" :text="hasExistingGroups ? 'Manage Groups' : 'Create Groups'">
                        <template #activator="{ props: tooltipProps }">
                            <v-btn v-bind="tooltipProps" class="actionPillBtn" variant="text"
                                @click="emit('createGroups')">
                                <v-icon class="actionIcon actionIcon--groups">mdi-account-group</v-icon>
                            </v-btn>
                        </template>
                    </v-tooltip>
                </template>
            </div>
            <template v-if="showViewToggle">
                <div class="actionsPillDivider" aria-hidden="true" />
                <div class="actionsPillSection viewToggleSection">
                    <v-tooltip location="bottom" :text="viewMode === 'list' ? 'Group view' : 'List view'">
                        <template #activator="{ props: tooltipProps }">
                            <v-btn v-bind="tooltipProps" class="actionPillBtn viewToggleBtn" variant="text"
                                @click="emit('update:viewMode', viewMode === 'list' ? 'groups' : 'list')">
                                <v-icon>{{ viewMode === 'list' ? 'mdi-view-grid' : 'mdi-view-list' }}</v-icon>
                            </v-btn>
                        </template>
                    </v-tooltip>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
    viewShopModal: {
        type: Boolean,
        required: true,
    },
    viewMode: {
        type: String,
        default: 'list',
        validator: (v) => ['list', 'groups'].includes(v),
    },
    hasGroups: {
        type: Boolean,
        default: false,
    },
    hasExistingGroups: {
        type: Boolean,
        default: false,
    },
    hasStudents: {
        type: Boolean,
        default: false,
    },
    searchQuery: {
        type: String,
        default: '',
    },
    shopEmpty: {
        type: Boolean,
        default: false,
    },
});

const highlightActions = computed(() => props.viewShopModal && props.shopEmpty);

const emit = defineEmits([
    'viewShop',
    'createShopItem',
    'awardClassPoints',
    'createGroups',
    'update:viewMode',
    'update:searchQuery',
]);

const searchInput = ref(props.searchQuery);

const showViewToggle = computed(() => props.hasStudents && props.hasGroups);

watch(() => props.searchQuery, (v) => {
    if (searchInput.value !== v) searchInput.value = v;
});

function onSearchInput() {
    emit('update:searchQuery', searchInput.value);
}
</script>

<style scoped>
@import '../styles/style.css';

.controlsBar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: auto;
    max-width: 420px;
    margin: 0 auto 1.25rem;
    min-width: 0;
    flex-shrink: 0;
}

.searchWrap {
    width: 200px;
    min-width: 120px;
    flex-shrink: 0;
}

.searchInput {
    width: 100%;
    height: calc(44px + 0.5rem);
    font-family: var(--font);
    font-size: 1rem;
    color: var(--white);
    background-color: var(--inkBlack);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 180px;
    padding: 0.5rem 1rem;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.searchInput::placeholder {
    color: rgba(255, 255, 255, 0.5);
}

.searchInput:focus {
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.actionsPill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    flex-shrink: 0;
    background-color: var(--inkBlack);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 180px;
    padding: 0.25rem 0.15rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.actionsPillSection {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0;
}

.actionsPillDivider {
    width: 1px;
    height: 24px;
    margin: 0 0.15rem;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 1px;
}

.actionsPill:hover {
    border-color: rgba(255, 255, 255, 0.35);
}

.actions-pill-glow {
    animation: borderShine 2s ease-in-out infinite;
    border-color: var(--seaGreen) !important;
}

@keyframes borderShine {

    0%,
    100% {
        box-shadow: 0 0 6px rgba(var(--seaGreen-rgb), 0.4),
            0 0 12px rgba(var(--seaGreen-rgb), 0.2);
        border-color: rgba(var(--seaGreen-rgb), 0.6) !important;
    }

    50% {
        box-shadow: 0 0 14px rgba(var(--seaGreen-rgb), 0.8),
            0 0 28px rgba(var(--seaGreen-rgb), 0.4);
        border-color: var(--seaGreen) !important;
    }
}

.actionPillBtn {
    min-width: 44px !important;
    width: 44px !important;
    height: 44px !important;
    padding: 0 !important;
    border-radius: 50% !important;
    color: var(--white) !important;
}


.actionIcon {
    font-size: 1.35rem;
}

.actionIcon--shop {
    color: var(--freshSky);
}

.actionIcon--create {
    color: var(--seaGreen);
}

.actionIcon--award {
    color: var(--gold, gold);
}

.actionIcon--groups {
    color: orange;
}

.viewToggleBtn:hover {
    background-color: rgba(255, 255, 255, 0.12) !important;
}
</style>
