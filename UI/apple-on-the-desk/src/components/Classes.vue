<template>
    <v-breadcrumbs density="compact" :items="[{ title: 'Home', to: '/' }, { title: 'Classes', to: '/classes' }]"
        class="breadcrumbs">
        <template v-slot:divider>
            <v-icon>mdi-chevron-right</v-icon>
        </template>
    </v-breadcrumbs>
    <div class="container" style="justify-content: flex-start !important;">
        <div class="title">My Classes <v-btn class="addClassButton_Classes" @click="navigateTo('/AddClass')">
                <v-icon>mdi-plus</v-icon>
            </v-btn>
        </div>
        <div class="classContainer">
            <template v-for="classItem in classes" :key="classItem.name">
                <v-card class="classCard" :style="{ '--card-glass-color': getCardColorRgba(classItem) }"
                    @click="navigateTo(`/Class/${classItem.id}`)"
                    @contextmenu.prevent="openContextMenu($event, classItem)">
                    <v-card-title
                        style="font-size: 2rem; font-weight: 600; text-align: center; font-family: var(--font);">
                        {{ classItem.name }}
                    </v-card-title>
                    <v-card-subtitle style="text-align: center; font-family: var(--font);">
                        {{ classItem.numberOfStudents }} students
                    </v-card-subtitle>
                    <v-card-text style="text-align: center; font-family: var(--font);">
                        {{ classItem.experience }} exp
                    </v-card-text>
                    <v-card-text style="text-align: center; font-family: var(--font); font-size: 1.5rem;">
                        {{ getExperienceIcon(classItem.experience) }} {{ getExperienceName(classItem.experience) }}
                    </v-card-text>
                    <!-- <v-card-actions style="justify-content: center; font-family: var(--font); gap: 10px;">
                        <v-btn class="classShopButton" @click.stop="navigateTo(`/Class/${classItem.id}/shop`)">
                            <v-icon>mdi-cart</v-icon>
                            Shop
                        </v-btn>
                    </v-card-actions> -->
                </v-card>
            </template>

            <div v-if="contextMenuClass" class="contextMenuBackdrop" @click="closeContextMenu">
                <div class="contextMenu" :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }" @click.stop>
                    <button class="contextMenuItem contextMenuItemDanger" @click="deleteSelectedClass">
                        <v-icon size="small">mdi-delete</v-icon>
                        Delete class
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted } from 'vue';
import { getClassNames, deleteClass } from '../services/server';
// import rank1 from '../assets/rank 1.JPG';
// import rank2 from '../assets/rank 2.JPG';
// import rank3 from '../assets/rank 3.JPG';
// import rank4 from '../assets/rank 4.JPG';
// import rank5 from '../assets/rank 5.JPG';
// import rank6 from '../assets/rank 6.JPG';

const classes = ref([]);
const router = useRouter();
const contextMenuClass = ref(null);
const contextMenuX = ref(0);
const contextMenuY = ref(0);

const organiseClassNames = (classNames) => {
    return classNames.sort((a, b) => a.name.localeCompare(b.name));
}

const loadClasses = async () => {
    console.log('Getting classes...');
    const response = await getClassNames();

    classes.value = organiseClassNames(response.classes);
}

// const experienceIcons = {
//     rank1: rank1,
//     rank2: rank2,
//     rank3: rank3,
//     rank4: rank4,
//     rank5: rank5,
//     rank6: rank6,
// }

const experienceIcons = {
    rank1: '🥉',
    rank2: '🥈',
    rank3: '🥇',
    rank4: '💜',
    rank5: '💎',
    rank6: '👑',
}

const getExperienceIcon = (experience) => {
    if (experience >= 0 && experience < 100) {
        console.log('[getExperienceIcon level 0 < x < 100] experience', experience);
        return experienceIcons.rank1;
    } else if (experience >= 100 && experience < 200) {
        console.log('[getExperienceIcon level 100 < x < 200] experience', experience);
        return experienceIcons.rank2;
    } else if (experience >= 200 && experience < 300) {
        console.log('[getExperienceIcon level 200 < x < 300] experience', experience);
        return experienceIcons.rank3;
    } else if (experience >= 300 && experience < 400) {
        console.log('[getExperienceIcon level 300 < x < 400] experience', experience);
        return experienceIcons.rank4;
    } else if (experience >= 400 && experience < 500) {
        console.log('[getExperienceIcon level 400 < x < 500] experience', experience);
        return experienceIcons.rank5;
    } else if (experience >= 500 && experience < 600) {
        console.log('[getExperienceIcon level 500 < x < 600] experience', experience);
        return experienceIcons.rank6;
    } else {
        console.log('[getExperienceIcon default] experience', experience);
        return experienceIcons.rank1;
    }
}

const getExperienceName = (experience) => {
    if (experience >= 0 && experience < 100) {
        console.log('[getExperienceName level 0 < x < 100] experience', experience);
        return 'Beginner';
    } else if (experience >= 100 && experience < 200) {
        console.log('[getExperienceName level 100 < x < 200] experience', experience);
        return 'Novice';
    } else if (experience >= 200 && experience < 300) {
        console.log('[getExperienceName level 200 < x < 300] experience', experience);
        return 'Apprentice';
    } else if (experience >= 300 && experience < 400) {
        console.log('[getExperienceName level 300 < x < 400] experience', experience);
        return 'Expert';
    } else if (experience >= 400 && experience < 500) {
        console.log('[getExperienceName level 400 < x < 500] experience', experience);
        return 'Master';
    } else if (experience >= 500 && experience < 600) {
        console.log('[getExperienceName level 500 < x < 600] experience', experience);
        return 'Grandmaster';
    } else {
        console.log('[getExperienceName default] experience', experience);
        return 'Beginner';
    }
}


const CARD_COLOURS = [
    '#493657ff',
    '#ce7da5ff',
    '#bee5bfff',
    '#a5402dff',
    '#285943ff'
];

/** Same palette as rgba for glass effect */
const CARD_COLOURS_RGBA = [
    '73, 54, 87',
    '206, 125, 165',
    '190, 229, 191',
    '165, 64, 45',
    '40, 89, 67'
];

const getCardColor = (classItem) => {
    const id = String(classItem.id ?? classItem.name ?? 0);
    let n = 0;
    for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
    return CARD_COLOURS[n % CARD_COLOURS.length];
};

const getCardColorRgba = (classItem) => {
    const id = String(classItem.id ?? classItem.name ?? 0);
    let n = 0;
    for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
    return CARD_COLOURS_RGBA[n % CARD_COLOURS_RGBA.length];
};

function openContextMenu(e, classItem) {
    contextMenuClass.value = classItem;
    contextMenuX.value = e.clientX;
    contextMenuY.value = e.clientY;
}

function closeContextMenu() {
    contextMenuClass.value = null;
}

async function deleteSelectedClass() {
    if (!contextMenuClass.value) return;
    const id = contextMenuClass.value.id;
    try {
        await deleteClass(id);
        classes.value = classes.value.filter((c) => c.id !== id);
    } catch (err) {
        console.error('Failed to delete class:', err);
    }
    closeContextMenu();
}

onMounted(() => {
    loadClasses();
});

onUnmounted(() => {
    closeContextMenu();
});

const navigateTo = (path) => {
    router.push(path);
};
</script>

<style>
@import '../styles/style.css';

.classContainer {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 20px;
}

.classCard {
    --card-glass-color: 73, 54, 87;
    justify-content: center;
    color: var(--white) !important;
    width: 300px;
    border-radius: 20px !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    background: linear-gradient(135deg,
            rgba(var(--card-glass-color), 0.55) 0%,
            rgba(var(--card-glass-color), 0.35) 50%,
            rgba(var(--card-glass-color), 0.45) 100%) !important;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 4px 24px rgba(0, 0, 0, 0.2);
    transition:
        transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
        border-color 0.3s ease;
}

.classCard:hover {
    transform: scale(1.02) translateY(-6px);
    border-color: rgba(255, 255, 255, 0.35) !important;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.25),
        0 12px 40px rgba(0, 0, 0, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.1);
}

.cardDivider {
    padding-top: 12px;
    width: 100% !important;
    margin: 10px 0 !important;
}

.classShopButton {
    color: var(--white) !important;
    border-radius: 16px !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    background: linear-gradient(135deg,
            rgba(26, 147, 111, 0.55) 0%,
            rgba(26, 147, 111, 0.35) 50%,
            rgba(26, 147, 111, 0.45) 100%) !important;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 2px 12px rgba(26, 147, 111, 0.2);
    gap: 10px;
    font-family: var(--font);
    font-size: 1.2rem;
    text-transform: none;
    transition:
        transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.3s ease,
        filter 0.3s ease;
}

.classShopButton:hover {
    transform: scale(1.02) translateY(-2px);
    border-color: rgba(255, 255, 255, 0.35) !important;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.3),
        0 8px 24px rgba(26, 147, 111, 0.35);
    filter: brightness(1.08);
}

.contextMenuBackdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
}

.contextMenu {
    position: fixed;
    min-width: 160px;
    padding: 4px 0;
    background: linear-gradient(135deg,
            rgba(0, 23, 31, 0.92) 0%,
            rgba(0, 23, 31, 0.88) 100%);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 1001;
}

.contextMenuItem {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 14px;
    border: none;
    background: none;
    color: var(--white);
    font-family: var(--font);
    font-size: 0.95rem;
    text-align: left;
    cursor: pointer;
    transition: background 0.2s ease;
}


.contextMenuItem:hover {
    background: rgba(255, 255, 255, 0.08);
}

.contextMenuItemDanger:hover {
    border-radius: 15px !important;
    background: rgba(197, 40, 61, 0.25);
    color: var(--intenseCherry);
}

.addClassButton_Classes {
    background: linear-gradient(135deg,
            rgba(0, 168, 232, 0.55) 0%,
            rgba(0, 168, 232, 0.35) 50%,
            rgba(0, 168, 232, 0.45) 100%) !important;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 4px 24px rgba(0, 168, 232, 0.15);
    padding: 0.5rem 1rem !important;
    transition: all 0.3s ease !important;
    border-radius: 180px !important;
    cursor: pointer !important;
    height: 50px !important;
    width: 30px !important;
}
</style>