<template>
    <div class="controlsBar">
        <div class="searchWrap">
            <input v-model="searchInput" type="text" class="searchInput" placeholder="Search" @input="onSearchInput" />
        </div>
        <v-menu v-model="actionsMenuOpen" :close-on-content-click="true" location="bottom">
            <template v-slot:activator="{ props: menuProps }">
                <v-btn class="controlBtn controlBtnActions" v-bind="menuProps" title="Actions">
                    <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
            </template>
            <v-card class="actionsMenu">
                <v-list class="actionsMenuList">
                    <v-list-item class="actionMenuItem" @click="emit('viewShop')">
                        <template v-slot:prepend>
                            <v-icon style="color: var(--freshSky);">{{
                                viewShopModal ? 'mdi-timer' : 'mdi-store'
                                }}</v-icon>
                        </template>
                        <v-list-item-title>{{ viewShopModal ? 'Timer' : 'Shop' }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item v-if="viewShopModal" class="actionMenuItem" @click="emit('createShopItem')">
                        <template v-slot:prepend>
                            <v-icon style="color: var(--seaGreen);">mdi-plus</v-icon>
                        </template>
                        <v-list-item-title>Create shop item</v-list-item-title>
                    </v-list-item>
                    <v-divider v-if="!viewShopModal" />
                    <v-list-item v-if="!viewShopModal" class="actionMenuItem" @click="emit('awardClassPoints')">
                        <template v-slot:prepend>
                            <v-icon style="color: gold;">mdi-medal</v-icon>
                        </template>
                        <v-list-item-title>Award Class Points</v-list-item-title>
                    </v-list-item>
                    <v-divider v-if="!viewShopModal" />
                    <v-list-item v-if="!viewShopModal" class="actionMenuItem" @click="emit('createGroups')">
                        <template v-slot:prepend>
                            <v-icon style="color: orange;">mdi-account-group</v-icon>
                        </template>
                        <v-list-item-title>{{ hasExistingGroups ? 'Manage Groups' : 'Create Groups'
                            }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-card>
        </v-menu>
        <div v-if="showViewToggle" class="viewToggleWrap">
            <v-btn-toggle :model-value="viewMode" class="viewToggleButtons" mandatory density="compact"
                @update:model-value="emit('update:viewMode', $event)">
                <v-btn value="list" class="viewToggleBtn" title="List view">
                    <v-icon>mdi-view-list</v-icon>
                </v-btn>
                <v-btn value="groups" class="viewToggleBtn" title="Group view">
                    <v-icon>mdi-view-grid</v-icon>
                </v-btn>
            </v-btn-toggle>
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
});

const emit = defineEmits([
    'viewShop',
    'createShopItem',
    'awardClassPoints',
    'createGroups',
    'update:viewMode',
    'update:searchQuery',
]);

const actionsMenuOpen = ref(false);
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

.controlBtn {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    min-width: 48px;
    padding: 0 !important;
    border-radius: 50% !important;
    background-color: var(--inkBlack) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    color: var(--white) !important;
    transition: all 0.3s ease;
}

.controlBtn:hover {
    background-color: rgba(255, 255, 255, 0.12) !important;
    border-color: rgba(255, 255, 255, 0.35) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.controlBtnActions:hover {
    background: linear-gradient(135deg,
            rgba(var(--seaGreen-rgb), 0.4) 0%,
            rgba(var(--amethyst-rgb), 0.3) 100%) !important;
}

.viewToggleWrap {
    flex-shrink: 0;
}

.viewToggleButtons {
    background-color: var(--inkBlack) !important;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 180px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.viewToggleBtn {
    min-width: 48px !important;
    width: 48px !important;
    padding: 0 !important;
    font-family: var(--font) !important;
    color: var(--white) !important;
    text-transform: none !important;
    background-color: transparent !important;
    border: none !important;
}

.viewToggleBtn:hover {
    background-color: rgba(var(--seaGreen-rgb), 0.2) !important;
}

.viewToggleBtn.v-btn--active {
    background: linear-gradient(135deg,
            rgba(var(--seaGreen-rgb), 0.6) 0%,
            rgba(var(--seaGreen-rgb), 0.7) 100%) !important;
    color: var(--white) !important;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
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

.actionsMenuList .v-divider {
    border-color: rgba(255, 255, 255, 0.1);
    margin: 0.25rem 0;
}
</style>
