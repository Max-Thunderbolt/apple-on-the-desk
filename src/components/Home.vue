<template>
    <div class="container">
        <div class="title">
            Apple On The <span class="titleAccent">Desk</span>
        </div>
        <div class="subtitle">
            Make learning fun! <img src="@/assets/apple-icon.svg" class="main-apple" />
        </div>

        <div class="menuContainer">
            <template v-if="authReady">
                <v-btn v-if="!isSignedIn" class="createAccountButton" @click="navigateTo('/Login')">
                    Join
                </v-btn>
                <template v-else>
                    <v-btn class="viewClassesButton" @click="navigateTo('/Classes')">
                        View Classes
                    </v-btn>
                    <v-btn class="profileButton" @click="navigateTo('/Teacher')">
                        Teacher
                    </v-btn>
                </template>
            </template>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { computed } from 'vue'


const router = useRouter()
const { authReady, isSignedIn, user } = useAuth()

const userId = computed(() => user.value?.uid)
console.log(userId.value)

const navigateTo = (path) => {
    router.push(path)
}
</script>

<style>
@import '../styles/style.css';

.viewClassesButton,
.addClassButton,
.createAccountButton,
.profileButton {
    position: relative;
    overflow: hidden;
    padding: 16px 30px !important;
    font-family: var(--font) !important;
    font-size: 1.5rem !important;
    font-weight: 600 !important;
    height: 70px !important;
    width: 100% !important;
    max-width: min(420px, 90vw);
    border-radius: 20px !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    color: var(--white) !important;
    text-transform: none !important;
    letter-spacing: 0.02em;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transition:
        transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
        border-color 0.3s ease,
        filter 0.3s ease;
}

@media (min-width: 768px) {

    .viewClassesButton,
    .addClassButton,
    .createAccountButton,
    .profileButton {
        padding: 24px 40px !important;
        font-size: 2rem !important;
        height: 100px !important;
    }
}

.viewClassesButton {
    background: linear-gradient(135deg,
            rgba(0, 168, 232, 0.55) 0%,
            rgba(0, 168, 232, 0.35) 50%,
            rgba(0, 168, 232, 0.45) 100%) !important;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 4px 24px rgba(0, 168, 232, 0.15);
}

.addClassButton,
.createAccountButton {
    background: linear-gradient(135deg,
            rgba(26, 147, 111, 0.55) 0%,
            rgba(26, 147, 111, 0.35) 50%,
            rgba(26, 147, 111, 0.45) 100%) !important;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 4px 24px rgba(26, 147, 111, 0.15);
}

.profileButton {
    background: linear-gradient(135deg,
            rgba(var(--amethyst-rgb), 0.4) 0%,
            rgba(var(--amethyst-rgb), 0.25) 50%,
            rgba(var(--amethyst-rgb), 0.35) 100%) !important;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 4px 24px rgba(var(--amethyst-rgb), 0.2);
}

@media (hover: hover) {

    .viewClassesButton:hover,
    .addClassButton:hover,
    .createAccountButton:hover,
    .profileButton:hover {
        transform: scale(1.02) translateY(-6px);
        border-color: rgba(255, 255, 255, 0.35) !important;
        color: var(--white) !important;
        filter: brightness(1.08);
    }

    .viewClassesButton:hover {
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            0 12px 40px rgba(0, 168, 232, 0.35),
            0 0 0 1px rgba(0, 168, 232, 0.2);
    }

    .addClassButton:hover,
    .createAccountButton:hover {
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            0 12px 40px rgba(26, 147, 111, 0.35),
            0 0 0 1px rgba(26, 147, 111, 0.2);
    }

    .profileButton:hover {
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            0 12px 40px rgba(var(--amethyst-rgb), 0.4),
            0 0 0 1px rgba(var(--amethyst-rgb), 0.3);
    }
}

.viewClassesButton:active,
.addClassButton:active,
.createAccountButton:active,
.profileButton:active {
    transform: scale(0.98) translateY(-2px);
    transition-duration: 0.1s;
}

/* Glass shine sweep on hover */
.viewClassesButton::after,
.addClassButton::after,
.createAccountButton::after,
.profileButton::after {
    content: '';
    position: absolute;
    left: -60%;
    top: -50%;
    width: 50%;
    height: 200%;
    background: linear-gradient(105deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 40%,
            rgba(255, 255, 255, 0.25) 50%,
            rgba(255, 255, 255, 0.08) 60%,
            transparent 100%);
    transform: skewX(-28deg) translateX(-150%);
    transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
    pointer-events: none;
}

.viewClassesButton:hover::after,
.addClassButton:hover::after,
.createAccountButton:hover::after,
.profileButton:hover::after {
    transform: skewX(-28deg) translateX(280%);
    transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.main-apple {
    width: 60px;
    height: 60px;
    animation: pulse 2s infinite ease-in-out;
}

@media (min-width: 768px) {
    .main-apple {
        width: 100px;
        height: 100px;
    }
}

.mini-apple {
    width: 24px;
    height: 24px;
    vertical-align: middle;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        filter: drop-shadow(0 0 5px var(--freshSky-rgb));
    }

    50% {
        transform: scale(1.05);
        filter: drop-shadow(0 0 15px var(--amethyst));
    }

    100% {
        transform: scale(1);
        filter: drop-shadow(0 0 5px var(--freshSky-rgb));
    }
}
</style>
