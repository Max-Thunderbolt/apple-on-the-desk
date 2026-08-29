<template>
    <!-- Full variant (legacy inline layout) -->
    <div v-if="variant === 'full'" class="timer timer--full">
        <div class="timerInputOrProgress">
            <div class="timerInput" v-if="!isRunning">
                <v-text-field v-model.number="enteredDuration" type="text" inputmode="numeric" min="1" variant="plain"
                    density="compact" hide-details class="durationInput" placeholder="Enter duration in seconds"
                    prepend-inner-icon="mdi-timer" />
            </div>
            <div v-else class="progressBarBg">
                <div class="progressBarFill" :style="{ width: progress + '%' }"></div>
            </div>
        </div>
        <div class="timerDisplay">
            <div class="timeWrapper">
                <div class="timeText">{{ formattedTime }}</div>
            </div>
        </div>
        <div class="stats" v-if="totalIterations > 0 || totalTimeSeconds > 0">
            <span class="stat">Iterations: {{ totalIterations }}</span>
            <span class="stat">Total time: {{ formattedTotalTime }}</span>
        </div>
        <div class="controls">
            <v-btn class="controlButtonStart" @click="startTimer" :disabled="!enteredDuration || enteredDuration < 1">
                Start
            </v-btn>
            <v-btn class="controlButtonStop" @click="stopTimer" :disabled="!isRunning">
                Stop
            </v-btn>
            <v-btn class="controlButton" @click="resetTimer">Reset</v-btn>
        </div>
    </div>

    <!-- Footer variant: compact trigger + expandable panel -->
    <div v-else class="timer timer--footer" :class="{ 'timer--embedded': embedded }">
        <div v-if="expanded" class="timerFooterPanel">
            <div class="timerPresets">
                <button
                    v-for="preset in presets"
                    :key="preset"
                    type="button"
                    class="presetChip"
                    :class="{ 'presetChip--active': enteredDuration === preset }"
                    @click="selectPreset(preset)"
                >
                    {{ formatPresetLabel(preset) }}
                </button>
            </div>
            <div class="timerCustomInput">
                <v-text-field
                    v-model.number="enteredDuration"
                    type="text"
                    inputmode="numeric"
                    variant="plain"
                    density="compact"
                    hide-details
                    class="durationInput durationInput--footer"
                    placeholder="Custom seconds"
                    prepend-inner-icon="mdi-timer"
                />
            </div>
            <div v-if="totalIterations > 0 || totalTimeSeconds > 0" class="stats stats--footer">
                <span class="stat">Iterations: {{ totalIterations }}</span>
                <span class="stat">Total: {{ formattedTotalTime }}</span>
            </div>
            <div class="controls controls--footer">
                <v-btn class="controlButtonStart" @click="startTimer" :disabled="!enteredDuration || enteredDuration < 1">
                    Start
                </v-btn>
                <v-btn class="controlButtonStop" @click="stopTimer" :disabled="!isRunning">
                    Stop
                </v-btn>
                <v-btn class="controlButton" @click="resetTimer">Reset</v-btn>
            </div>
        </div>

        <button
            v-if="!embedded"
            type="button"
            class="timerFooterTrigger"
            :class="{ 'timerFooterTrigger--running': isRunning, 'timerFooterTrigger--expanded': expanded }"
            :aria-expanded="expanded"
            aria-label="Timer"
            @click="toggleExpanded"
        >
            <v-icon size="20" class="timerFooterIcon">mdi-timer</v-icon>
            <span v-if="isRunning" class="timerFooterTime">{{ formattedTime }}</span>
            <span v-if="isRunning" class="timerFooterProgress">
                <span class="timerFooterProgressFill" :style="{ width: progress + '%' }" />
            </span>
        </button>
    </div>
</template>

<script setup>
import { ref, computed, onUnmounted, watch } from 'vue';
import swapSoundFile from '../assets/DriverNavigatorSwap.wav';

const props = defineProps({
    variant: {
        type: String,
        default: 'full',
        validator: (v) => ['full', 'footer'].includes(v),
    },
    embedded: {
        type: Boolean,
        default: false,
    },
});

const presets = [30, 60, 120, 300];
const expanded = ref(false);

const enteredDuration = ref(120);
const timeRemaining = ref(120);
const progress = ref(0);
const isRunning = ref(false);
const totalIterations = ref(0);
const totalTimeSeconds = ref(0);

let intervalId = null;
const durationPerIteration = ref(0);

const swapSound = new Audio(swapSoundFile);

const formattedTime = computed(() => {
    const s = timeRemaining.value;
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

watch(enteredDuration, (newVal) => {
    if (newVal > 0) {
        timeRemaining.value = newVal;
    }
    if (newVal < 1) {
        timeRemaining.value = 0;
    }
});

const formattedTotalTime = computed(() => {
    const s = totalTimeSeconds.value;
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
});

function formatPresetLabel(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const mins = seconds / 60;
    return mins % 1 === 0 ? `${mins}m` : `${mins}m`;
}

function selectPreset(seconds) {
    enteredDuration.value = seconds;
    timeRemaining.value = seconds;
}

function toggleExpanded() {
    expanded.value = !expanded.value;
}

function openPanel() {
    expanded.value = true;
}

function closePanel() {
    expanded.value = false;
}

const tick = () => {
    if (timeRemaining.value <= 0) {
        playSwapSound();
        totalIterations.value++;
        totalTimeSeconds.value += durationPerIteration.value;
        timeRemaining.value = durationPerIteration.value;
    }
    timeRemaining.value--;
    progress.value = durationPerIteration.value > 0
        ? ((durationPerIteration.value - timeRemaining.value) / durationPerIteration.value) * 100
        : 0;
    if (timeRemaining.value < 0) {
        timeRemaining.value = 0;
    }
};

const playSwapSound = () => {
    try {
        swapSound.currentTime = 0;
        swapSound.play().catch((err) => {
            console.warn('Could not play swap sound:', err);
        });
    } catch (err) {
        console.warn('Error playing swap sound:', err);
    }
};

const startTimer = () => {
    const duration = Math.max(1, Math.floor(Number(enteredDuration.value) || 60));
    enteredDuration.value = duration;
    durationPerIteration.value = duration;
    const isResuming = !isRunning.value && timeRemaining.value > 0;
    if (!isResuming) {
        timeRemaining.value = duration;
        progress.value = 0;
    } else {
        progress.value = duration > 0
            ? ((duration - timeRemaining.value) / duration) * 100
            : 0;
    }
    isRunning.value = true;
    intervalId = setInterval(tick, 1000);
    if (props.variant === 'footer') {
        expanded.value = false;
    }
};

const stopTimer = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    isRunning.value = false;
};

const resetTimer = () => {
    stopTimer();
    timeRemaining.value = enteredDuration.value || 120;
    progress.value = 0;
    durationPerIteration.value = 0;
    totalIterations.value = 0;
    totalTimeSeconds.value = 0;
};

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
});

defineExpose({
    isRunning,
    formattedTime,
    progress,
    expanded,
    toggleExpanded,
    openPanel,
    closePanel,
});
</script>

<style scoped>
.timer--full {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 20px;
}

.timer--footer {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.timer--footer.timer--embedded {
    align-items: center;
}

.timer--footer.timer--embedded .timerFooterPanel {
    right: auto;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(100% + 0.65rem);
}

.timerFooterPanel {
    position: absolute;
    bottom: calc(100% + 0.5rem);
    right: 0;
    min-width: 260px;
    max-width: min(320px, 90vw);
    padding: 0.85rem;
    background: var(--inkBlack);
    border: 1px solid rgba(var(--ink-rgb), 0.25);
    border-radius: 16px;
    box-shadow: 0 -8px 28px rgba(var(--shadow-rgb), 0.45);
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    z-index: 10;
}

.timerPresets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
}

.presetChip {
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

.presetChip:hover,
.presetChip--active {
    background: rgba(var(--seaGreen-rgb), 0.25);
    border-color: var(--seaGreen);
}

.timerCustomInput {
    width: 100%;
}

.timerFooterTrigger {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 44px;
    height: 44px;
    padding: 0 0.65rem;
    background: rgba(var(--ink-rgb), 0.08);
    border: 1px solid rgba(var(--ink-rgb), 0.2);
    border-radius: 999px;
    color: var(--white);
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;
    position: relative;
    overflow: hidden;
}

.timerFooterTrigger:hover {
    background: rgba(var(--ink-rgb), 0.14);
    border-color: rgba(var(--ink-rgb), 0.35);
}

.timerFooterTrigger--running {
    border-color: rgba(var(--seaGreen-rgb), 0.5);
    padding-right: 0.85rem;
}

.timerFooterTrigger--expanded {
    background: rgba(var(--seaGreen-rgb), 0.18);
    border-color: var(--seaGreen);
}

.timerFooterIcon {
    color: var(--seaGreen);
    flex-shrink: 0;
}

.timerFooterTime {
    font-family: var(--font);
    font-size: 0.95rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
}

.timerFooterProgress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(var(--shadow-rgb), 0.4);
}

.timerFooterProgressFill {
    display: block;
    height: 100%;
    background: var(--seaGreen);
    transition: width 1s linear;
}

.stats--footer {
    gap: 0.5rem;
    flex-wrap: wrap;
}

.controls--footer {
    gap: 0.4rem;
}

.timerDisplay {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--inkBlack);
    border-radius: 25px;
    padding: 20px 20px 0;
    width: 100%;
}

.timeWrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--inkBlack);
    border-radius: 25px;
    padding: 20px;
    width: 100%;
}

.timeText {
    font-size: 4rem;
    font-weight: 600;
    color: var(--white);
    font-family: var(--font);
}

.timerInput {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.timerInputOrProgress {
    width: 100%;
    min-height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.durationInput {
    max-width: 100%;
    font-weight: 600;
    color: var(--white);
    background-color: var(--inkBlack);
    border-radius: 25px;
    padding: 6px 20px;
    width: 100%;
    text-align: center;
    font-family: var(--font);
}

.durationInput--footer {
    background: rgba(var(--ink-rgb), 0.08);
    border-radius: 12px;
    padding: 4px 12px;
}

.durationInput :deep(.v-field) {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    border: none;
    box-shadow: none;
}

.durationInput :deep(.v-field__field) {
    flex: 0 1 auto;
    min-width: 60px;
}

.durationInput :deep(.v-field__input),
.durationInput :deep(.v-field__input input),
.durationInput :deep(input) {
    text-align: center;
}

.durationInput :deep(.v-field__outline),
.durationInput :deep(.v-field__overlay) {
    display: none;
}

.durationInput input[type="number"],
.timer--full input[type="number"] {
    appearance: textfield;
    -moz-appearance: textfield;
}

.durationInput input[type="number"]::-webkit-outer-spin-button,
.durationInput input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.stats {
    display: flex;
    gap: 24px;
    font-size: 0.95rem;
    color: var(--white);
    justify-content: center;
    font-family: var(--font);
}

.stat {
    opacity: 0.9;
    text-align: center;
    font-weight: 600;
    font-size: 0.85rem;
    border-radius: 180px;
    border: 1px solid rgba(var(--ink-rgb), 0.25);
    background-color: rgba(var(--ink-rgb), 0.08);
    padding: 0.35rem 0.75rem;
    color: var(--white);
}

.progressBarBg {
    background-color: var(--inkBlack);
    border-radius: 25px;
    padding: 6px 20px;
    width: 100%;
    min-height: 24px;
}

.progressBarFill {
    height: 12px;
    min-height: 12px;
    border-radius: 6px;
    background-color: var(--seaGreen);
    transition: width 1s linear;
}

.controls {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.controlButton {
    background-color: var(--inkBlack) !important;
    border-radius: 180px;
    box-shadow: 10px 10px 10px 0 rgba(var(--shadow-rgb), 0.5);
    padding: 6px 20px;
    text-align: center;
    color: var(--white);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.controlButton:hover {
    background-color: var(--intenseCherry) !important;
}

.controlButton:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.controlButtonStart {
    background-color: var(--seaGreen) !important;
    max-width: 100px;
    border-radius: 180px;
    box-shadow: 10px 10px 10px 0 rgba(var(--shadow-rgb), 0.5);
    padding: 6px 20px;
    text-align: center;
    color: var(--white);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.controlButtonStart:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.controlButtonStop {
    background-color: var(--intenseCherry) !important;
    border-radius: 180px;
    box-shadow: 10px 10px 10px 0 rgba(var(--shadow-rgb), 0.5);
    padding: 6px 20px;
    text-align: center;
    color: var(--white);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.controlButtonStop:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

:root[data-theme='light'] .timerFooterPanel {
    background: rgba(255, 255, 255, 0.98);
    border-color: rgba(13, 37, 48, 0.15);
    box-shadow: 0 -8px 28px rgba(13, 37, 48, 0.12);
}

:root[data-theme='light'] .presetChip,
:root[data-theme='light'] .stat {
    color: rgba(13, 37, 48, 0.88);
}

:root[data-theme='light'] .timerFooterTrigger {
    color: rgba(13, 37, 48, 0.88);
    background: rgba(13, 37, 48, 0.05);
}
</style>
