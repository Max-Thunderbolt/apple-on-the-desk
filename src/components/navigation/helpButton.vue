<template>
    <div
        class="helpButton"
        :class="{ 'helpButton--dockAligned': alignWithDock }"
        :style="alignWithDock ? undefined : { bottom: `${bottomOffset}px` }"
    >
        <div v-if="showTutorialTip" class="tutorialTip">
            <p class="tutorialTipText">
                Open this menu for tutorials and theme settings.
            </p>
            <button type="button" class="tutorialTipGotIt" @click="dismissTutorialTip">Got it</button>
        </div>

        <v-menu
            v-model="menuOpen"
            location="top end"
            origin="overlap"
            :close-on-content-click="false"
            transition="fade-transition"
        >
            <template #activator="{ props: activatorProps }">
                <v-fab
                    v-bind="activatorProps"
                    class="helpAppleFab"
                    variant="text"
                    elevation="0"
                    aria-label="Help and settings"
                >
                    <img src="@/assets/apple-icon.svg" alt="" class="helpAppleIcon" />
                </v-fab>
            </template>

            <div class="helpMenu" role="menu">
                <template v-if="panel === 'main'">
                    <button type="button" class="helpMenuItem" role="menuitem" @click="onTutorialsClick">
                        <v-icon size="18">mdi-school-outline</v-icon>
                        <span>Tutorials</span>
                    </button>
                    <button type="button" class="helpMenuItem" role="menuitem" @click="panel = 'theme'">
                        <v-icon size="18">{{ themeIcon }}</v-icon>
                        <span>Theme</span>
                        <v-icon size="16" class="helpMenuChevron">mdi-chevron-right</v-icon>
                    </button>
                </template>

                <template v-else-if="panel === 'tutorials'">
                    <button type="button" class="helpMenuItem helpMenuBack" @click="panel = 'main'">
                        <v-icon size="18">mdi-chevron-left</v-icon>
                        <span>Tutorials</span>
                    </button>
                    <button
                        v-for="cat in incompleteCategories"
                        :key="cat.key"
                        type="button"
                        class="helpMenuItem"
                        role="menuitem"
                        @click="openTutorial(cat.key)"
                    >
                        <span>{{ cat.name }}</span>
                    </button>
                </template>

                <template v-else-if="panel === 'theme'">
                    <button type="button" class="helpMenuItem helpMenuBack" @click="panel = 'main'">
                        <v-icon size="18">mdi-chevron-left</v-icon>
                        <span>Theme</span>
                    </button>
                    <button
                        v-for="mode in themeOptions"
                        :key="mode.value"
                        type="button"
                        class="helpMenuItem"
                        :class="{ 'helpMenuItem--active': themeMode === mode.value }"
                        role="menuitemradio"
                        :aria-checked="themeMode === mode.value"
                        @click="selectTheme(mode.value)"
                    >
                        <v-icon size="18">{{ mode.icon }}</v-icon>
                        <span>{{ mode.label }}</span>
                    </button>
                </template>
            </div>
        </v-menu>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useOnboarding } from '@/composables/useOnboarding';
import { useTheme } from '@/composables/useTheme';

const TUTORIAL_TIP_STORAGE_KEY = 'apple-on-the-desk-tutorial-tip-dismissed';

const props = defineProps({
    className: { type: String, default: 'Classes' },
    classId: { type: String, default: null },
    bottomOffset: { type: Number, default: 20 },
    alignWithDock: { type: Boolean, default: false },
});

const router = useRouter();
const { config, progress, loadOnboarding } = useOnboarding();
const { themeMode, setThemeMode } = useTheme();

const menuOpen = ref(false);
const panel = ref('main');
const showTutorialTip = ref(false);

const themeOptions = [
    { value: 'system', label: 'System', icon: 'mdi-monitor' },
    { value: 'light', label: 'Light', icon: 'mdi-white-balance-sunny' },
    { value: 'dark', label: 'Dark', icon: 'mdi-weather-night' },
];

const themeIcon = computed(() => {
    const option = themeOptions.find((item) => item.value === themeMode.value);
    return option?.icon ?? 'mdi-monitor';
});

const incompleteCategories = computed(() => {
    if (!config.value || !progress.value) return [];
    const completed = progress.value.completedFieldKeys || [];
    return config.value.categories.filter((cat) =>
        cat.fields.some((f) => !completed.includes(f.key)),
    );
});

const allComplete = computed(() =>
    Boolean(config.value && progress.value && incompleteCategories.value.length === 0),
);

function openTutorial(section) {
    const query = { section, className: props.className };
    if (props.classId) query.classId = props.classId;
    menuOpen.value = false;
    router.push({ path: '/Onboarding', query });
}

function onTutorialsClick() {
    if (allComplete.value) {
        openTutorial('search');
        return;
    }
    panel.value = 'tutorials';
}

function selectTheme(mode) {
    setThemeMode(mode);
    menuOpen.value = false;
}

function dismissTutorialTip() {
    try {
        localStorage.setItem(TUTORIAL_TIP_STORAGE_KEY, 'true');
    } catch (_) { /* ignore */ }
    showTutorialTip.value = false;
}

watch(menuOpen, (open) => {
    if (!open) panel.value = 'main';
});

onMounted(() => {
    loadOnboarding();
    try {
        showTutorialTip.value = localStorage.getItem(TUTORIAL_TIP_STORAGE_KEY) !== 'true';
    } catch (_) {
        showTutorialTip.value = true;
    }
});
</script>

<style scoped>
.helpButton {
    position: fixed;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
}

.helpButton--dockAligned {
    bottom: calc(var(--floating-dock-bottom-offset, 1.5rem) + env(safe-area-inset-bottom, 0px));
    justify-content: center;
    min-height: 44px;
}

.tutorialTip {
    position: relative;
    max-width: 200px;
    padding: 0.6rem 0.75rem;
    background: var(--inkBlack);
    border: 1px solid var(--freshSky);
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(var(--shadow-rgb), 0.4);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.tutorialTip::after {
    content: '';
    position: absolute;
    bottom: -6px;
    right: 20px;
    width: 12px;
    height: 12px;
    background: var(--inkBlack);
    border-right: 1px solid var(--freshSky);
    border-bottom: 1px solid var(--freshSky);
    transform: rotate(45deg);
}

.tutorialTipText {
    margin: 0;
    font-family: var(--font);
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--white);
    line-height: 1.3;
}

.tutorialTipGotIt {
    align-self: flex-end;
    font-family: var(--font);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--freshSky);
    background: transparent;
    border: 1px solid var(--freshSky);
    border-radius: 8px;
    padding: 0.35rem 0.6rem;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
}

.tutorialTipGotIt:hover {
    background: rgba(var(--freshSky-rgb), 0.2);
    color: var(--white);
}

.helpAppleFab {
    background-color: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
    min-width: auto !important;
    width: 48px;
    height: 48px;
    border-radius: 9999px;
}

.helpAppleIcon {
    width: 32px;
    height: 32px;
}

.helpMenu {
    min-width: 11.5rem;
    padding: 0.45rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    background: var(--inkBlack);
    border: 1px solid var(--freshSky);
    border-radius: 16px;
    box-shadow: 0 8px 28px rgba(var(--shadow-rgb), 0.45);
}

.helpMenuItem {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    margin: 0;
    padding: 0.55rem 0.75rem;
    border: 1px solid transparent;
    border-radius: 999px;
    background: transparent;
    color: var(--white);
    font-family: var(--font);
    font-size: 0.8rem;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
    overflow: hidden;
    transition:
        transform 150ms ease-out,
        box-shadow 150ms ease-out,
        background 150ms ease-out,
        border-color 150ms ease-out;
}

.helpMenuItem :deep(.v-icon) {
    color: var(--freshSky);
    flex-shrink: 0;
}

.helpMenuChevron {
    margin-left: auto;
}

.helpMenuBack {
    border-color: rgba(var(--freshSky-rgb), 0.35);
    margin-bottom: 0.15rem;
}

.helpMenuItem--active {
    background: rgba(var(--freshSky-rgb), 0.18);
    border-color: rgba(var(--freshSky-rgb), 0.55);
}

.helpMenuItem:hover {
    transform: translateY(-1px) scale(1.02);
    background: rgba(var(--freshSky-rgb), 0.14);
    border-color: rgba(var(--freshSky-rgb), 0.45);
    box-shadow: 0 0 12px rgba(0, 168, 232, 0.35);
}
</style>
