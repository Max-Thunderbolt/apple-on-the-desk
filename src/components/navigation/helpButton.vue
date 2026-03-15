<template>
    <div class="helpButton">
        <div v-if="showTutorialTip" class="tutorialTip">
            <p class="tutorialTipText">This button opens the tutorials menu. It will display all outstanding tutorials.
            </p>
            <button type="button" class="tutorialTipGotIt" @click="dismissTutorialTip">Got it</button>
        </div>
        <v-speed-dial location="bottom end" transition="fade-transition" class="helpApple">
            <template #activator="{ props: activatorProps }">
                <v-fab v-bind="activatorProps" class="helpAppleFab" variant="text" elevation="0"
                    @click="allComplete ? getHelp('search') : undefined">
                    <img src="@/assets/apple-icon.svg" alt="Help" class="helpAppleIcon" />
                </v-fab>
            </template>
            <template v-if="!allComplete">
                <div v-for="cat in incompleteCategories" :key="cat.key" class="helpButtonOption">
                    <div class="helpButtonIconText" @click="getHelp(cat.key)">{{ cat.name }}</div>
                </div>
            </template>
        </v-speed-dial>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { computed, onMounted, ref } from 'vue';
import { useOnboarding } from '@/composables/useOnboarding';

const TUTORIAL_TIP_STORAGE_KEY = 'apple-on-the-desk-tutorial-tip-dismissed';

const router = useRouter();
const { config, progress, loadOnboarding } = useOnboarding();

const showTutorialTip = ref(false);

const props = defineProps({
    className: { type: String, default: 'Classes' },
    classId: { type: String, default: null },
})

const className = computed(() => props.className)
const classId = computed(() => props.classId)

const incompleteCategories = computed(() => {
    if (!config.value || !progress.value) return []
    const completed = progress.value.completedFieldKeys || []
    return config.value.categories.filter(cat =>
        cat.fields.some(f => !completed.includes(f.key))
    )
})

const allComplete = computed(() =>
    config.value && progress.value && incompleteCategories.value.length === 0
)

const getHelp = (section) => {
    const query = { section, className: className.value }
    if (classId.value) query.classId = classId.value
    router.push({ path: '/Onboarding', query })
}

function dismissTutorialTip() {
    try {
        localStorage.setItem(TUTORIAL_TIP_STORAGE_KEY, 'true')
    } catch (_) { }
    showTutorialTip.value = false
}

onMounted(() => {
    loadOnboarding()
    try {
        showTutorialTip.value = localStorage.getItem(TUTORIAL_TIP_STORAGE_KEY) !== 'true'
    } catch (_) {
        showTutorialTip.value = true
    }
})
</script>

<style scoped>
.helpButton {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
}

.tutorialTip {
    position: relative;
    max-width: 200px;
    padding: 0.6rem 0.75rem;
    background: var(--inkBlack);
    border: 1px solid var(--freshSky);
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
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

.helpButtonOption {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: center !important;
    margin-bottom: 10px;
    margin-right: 10px;
    gap: 10px;
}

.helpButtonIcon {
    color: var(--white) !important;
    border: 1px solid var(--freshSky) !important;
    background-color: var(--inkBlack) !important;
    border-radius: 50% !important;
    width: 48px !important;
    height: 48px !important;
}

.helpApple {
    border-radius: 9999px;
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

.helpButtonIconText {
    position: relative;
    font-family: var(--font);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--white);
    text-align: center;
    margin-top: 4px;
    padding: 6px 20px;
    background-color: var(--inkBlack);
    border-radius: 180px;
    border: 1px solid var(--freshSky);
    overflow: hidden;
    transition:
        transform 150ms ease-out,
        box-shadow 150ms ease-out;
}

.helpButtonIconText::after {
    content: '';
    position: absolute;
    top: 0;
    left: -150%;
    width: 50%;
    height: 100%;
    background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.5), transparent);
    transform: skewX(-20deg);
}

.helpButtonIconText:hover {
    cursor: pointer;
    transform: translateY(-1px) scale(1.03);
    box-shadow: 0 0 12px rgba(0, 168, 232, 0.45);
}

.helpButtonIconText:hover::after {
    left: 150%;
    transition: left 300ms ease-out;
}
</style>
