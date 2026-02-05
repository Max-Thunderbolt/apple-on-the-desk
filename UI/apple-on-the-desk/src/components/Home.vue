<template>
    <div class="container">
        <div class="title">
            Apple On The <span class="titleAccent">Desk</span>
        </div>
        <div class="subtitle">
            Make learning fun! <img src="@/assets/apple-icon.svg" class="main-apple" />
        </div>

        <div class="menuContainer">
            <v-btn class="viewClassesButton" @click="navigateTo('/Classes')">
                View Classes
            </v-btn>
            <v-btn class="addClassButton" @click="navigateTo('/AddClass')">
                Add a Class
            </v-btn>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const navigateTo = (path) => {
    router.push(path);
}

</script>

<style>
@import '../styles/style.css';

.viewClassesButton,
.addClassButton {
    position: relative;
    overflow: hidden;
    padding: 24px 40px !important;
    font-family: var(--font) !important;
    font-size: 2rem !important;
    font-weight: 600 !important;
    height: 100px !important;
    width: 100% !important;
    max-width: 420px;
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

.viewClassesButton {
    background: linear-gradient(135deg,
            rgba(0, 168, 232, 0.55) 0%,
            rgba(0, 168, 232, 0.35) 50%,
            rgba(0, 168, 232, 0.45) 100%) !important;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 4px 24px rgba(0, 168, 232, 0.15);
}

.addClassButton {
    background: linear-gradient(135deg,
            rgba(26, 147, 111, 0.55) 0%,
            rgba(26, 147, 111, 0.35) 50%,
            rgba(26, 147, 111, 0.45) 100%) !important;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 4px 24px rgba(26, 147, 111, 0.15);
}

.viewClassesButton:hover,
.addClassButton:hover {
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

.addClassButton:hover {
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.3),
        0 12px 40px rgba(26, 147, 111, 0.35),
        0 0 0 1px rgba(26, 147, 111, 0.2);
}

.viewClassesButton:active,
.addClassButton:active {
    transform: scale(0.98) translateY(-2px);
    transition-duration: 0.1s;
}

/* Glass shine sweep on hover */
.viewClassesButton::after,
.addClassButton::after {
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
.addClassButton:hover::after {
    transform: skewX(-28deg) translateX(280%);
    transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.main-apple {
    width: 100px;
    height: 100px;
    /* Example: make it pulse when active */
    animation: pulse 2s infinite ease-in-out;
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
