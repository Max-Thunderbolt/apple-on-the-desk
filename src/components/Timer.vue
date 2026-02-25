<template>
    <div class="timer">
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
                <div class="timeText">
                    {{ formattedTime }}
                </div>
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
            <v-btn class="controlButton" @click="resetTimer">
                Reset
            </v-btn>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onUnmounted, watch } from 'vue';
import swapSoundFile from '../assets/DriverNavigatorSwap.wav';

const enteredDuration = ref(120);
const timeRemaining = ref(120);
const progress = ref(0);
const isRunning = ref(false);
const totalIterations = ref(0);
const totalTimeSeconds = ref(0);

let intervalId = null;
const durationPerIteration = ref(0);

// Create audio element for the swap sound
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

const tick = () => {
    if (timeRemaining.value <= 0) {
        // Play sound when timer reaches 0
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
        // Reset audio to beginning in case it's already playing
        swapSound.currentTime = 0;
        swapSound.play().catch(err => {
            console.warn('Could not play swap sound:', err);
        });
    } catch (err) {
        console.warn('Error playing swap sound:', err);
    }
};

const startTimer = () => {
    const duration = Math.max(1, Math.floor(Number(enteredDuration.value) || 60));
    enteredDuration.value = duration;
    // Always update durationPerIteration from current input so next repetition and total time use it
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
    timeRemaining.value = 0;
    progress.value = 0;
    durationPerIteration.value = 0;
    totalIterations.value = 0;
    totalTimeSeconds.value = 0;
};

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
});
</script>

<style>
@import '../styles/style.css';

.timer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 20px 20px 20px 20px;
}

.timerDisplay {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--inkBlack);
    border-radius: 25px;
    padding: 20px 20px 0px 20px;
    width: 100%;
}

.timeWrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--inkBlack);
    border-radius: 25px;
    padding: 20px 20px 20px 20px;
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

.inputLabel {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--white);
    font-family: var(--font);
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

/* Hide number input spinners (Firefox + WebKit) - target both .durationInput and .timer for reliability */
.durationInput input[type="number"],
.timer input[type="number"] {
    appearance: textfield;
    -moz-appearance: textfield;
}

.durationInput input[type="number"]::-webkit-outer-spin-button,
.durationInput input[type="number"]::-webkit-inner-spin-button,
.timer input[type="number"]::-webkit-outer-spin-button,
.timer input[type="number"]::-webkit-inner-spin-button {
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
    font-size: 1rem;
    border-radius: 180px;
    border: 2px solid var(--inkBlack);
    background-color: var(--inkBlack);
    padding: 6px 20px;
    color: var(--white);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background-color: var(--inkBlack);
    }
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
    box-shadow: 10px 10px 10px 0 rgba(0, 0, 0, 0.5);
    padding: 6px 20px;
    text-align: center;
    color: var(--white);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background-color: var(--intenseCherry);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &:active {
        transform: scale(0.98);
        box-shadow: 5px 5px 5px 0 rgba(0, 0, 0, 0.5);
    }

    &:focus {
        outline: none;
    }

    &:focus-visible {
        outline: none;
    }
}

.controlButtonStart {
    background-color: var(--seaGreen) !important;
    max-width: 100px;
    border-radius: 180px;
    box-shadow: 10px 10px 10px 0 rgba(0, 0, 0, 0.5);
    padding: 6px 20px;
    text-align: center;
    color: var(--white);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &:active {
        transform: scale(0.98);
        box-shadow: 5px 5px 5px 0 rgba(0, 0, 0, 0.5);
    }

    &:focus {
        outline: none;
    }

    &:focus-visible {
        outline: none;
    }
}

.controlButtonStop {
    background-color: var(--intenseCherry) !important;
    border-radius: 180px;
    box-shadow: 10px 10px 10px 0 rgba(0, 0, 0, 0.5);
    padding: 6px 20px;
    text-align: center;
    color: var(--white);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &:active {
        transform: scale(0.98);
        box-shadow: 5px 5px 5px 0 rgba(0, 0, 0, 0.5);
    }

    &:focus {
        outline: none;
    }

    &:focus-visible {
        outline: none;
    }
}
</style>