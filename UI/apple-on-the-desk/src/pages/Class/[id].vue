<template>
    <v-breadcrumbs density="compact" :items="breadcrumbs" class="breadcrumbs">
        <template v-slot:divider>
            <v-icon>mdi-chevron-right</v-icon>
        </template>
    </v-breadcrumbs>
    <div class="container" style="justify-content: flex-start !important;">
        <h1 class="classTitle">{{ classData?.name }} </h1>
        <div class="classContent">
            <!-- TIMER -->
            <div v-if="!viewShopModal" class="timer">
                <Timer :initialSeconds="300" :autoRepeat="false" />
            </div>
            <!-- SHOP -->
            <div v-if="viewShopModal" class="shopModal">
                <Shop :shopItems="shopItems" @cost-updated="onCostUpdated" />
            </div>
            <!-- ACTION BUTTONS -->
            <div class="shopContainer">
                <v-btn class="shopButton" @click="viewShop()">
                    <v-icon>{{ viewShopModal ? 'mdi-timer' : 'mdi-store' }}</v-icon>
                    {{ viewShopModal ? 'Timer' : 'Shop' }}
                </v-btn>
                <v-btn v-if="!viewShopModal" class="awardClassPointsButton" @click="openAwardClassPointsModal()">
                    🏆
                    Award Class Points
                </v-btn>
            </div>
            <!-- CLASS LIST -->
            <ClassList v-if="classData && id" :shopCost="shopCost" :isViewingShop="viewShopModal" :class-id="id"
                :students="classData.students || []" :experience="classData.experience || 0"
                @students-updated="onStudentsUpdated" @shopCostUpdated="onShopCostUpdated" />
            <!-- CLASS RANK -->
            <div class="classRankContainer">
                <v-card class="classRankCard">
                    <v-card-text class="classRankText">
                        {{ experienceToRank(classData?.experience).icon }} {{
                            experienceToRank(classData?.experience).name
                        }}
                    </v-card-text>
                    <v-card-text class="classExperienceText">
                        {{ classData?.experience }} exp
                    </v-card-text>
                </v-card>
            </div>
        </div>
    </div>
    <award-points-modal 
        v-model:pointsDialogOpen="awardClassPointsModal" 
        v-model:selectedStudents="selectedStudents"
        :all-students="classData?.students || []"
        :class-id="id"
        @studentsUpdated="onStudentsUpdated" />
</template>

<script setup>
import { ref, onMounted, computed, defineEmits, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Timer from '../../components/Timer.vue';
import ClassList from '../../components/classList.vue';
import Shop from '../../components/Shop.vue';
import Server from '../../services/server';
import { toast } from 'vue-sonner';
import { experienceToRank, getExperience } from '../../controllers/ExperienceController';
import AwardPointsModal from '../../components/modals/awardPointsModal.vue';

const router = useRouter();
const { id } = useRoute().params;
const classData = ref(null);
const viewShopModal = ref(false);
const shopItems = ref([]);
const shopCost = ref(0);
const awardClassPointsModal = ref(false);
const selectedStudents = ref([]);
let breadcrumbs = computed(() => [
    { title: 'Home', to: '/' },
    { title: 'Classes', to: '/Classes' },
    { title: classData.value?.name, to: `/Class/${id}` },
]);

const emit = defineEmits(['shopCostUpdated']);

function formatCost(cost) {
    const n = Number(cost);
    if (Number.isNaN(n)) return String(cost ?? '—');
    if (n % 1 === 0) {
        return `${n.toLocaleString()} pts`;
    } else {
        return `${n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pts`;
    }
}

function onStudentsUpdated(updatedStudents) {
    // Reload the class data to get the latest state
    loadClass();
    toast?.success?.('Points awarded successfully');
}

const loadClass = async () => {
    try {
        const response = await Server.getClassById(id);
        console.log('response', response);
        classData.value = response.class;
        // const experience = await getExperience(id);
    } catch (error) {
        console.error('Error loading class:', error);
    }
};

watch(classData, (newClassData) => {
    if (newClassData) {
        classData.value = newClassData;
    }
});

const loadShopItems = async () => {
    try {
        const response = await Server.getShopItems();
        shopItems.value = response.shopItems ?? [];
    } catch (error) {
        console.error('Error loading shop items:', error);
    }
}

function onShopCostUpdated(cost) {
    console.log('cost', cost);
    shopCost.value = Number(cost);
}

onMounted(async () => {
    await loadClass();
    await loadShopItems();
});

const navigateTo = (path) => {
    console.log(path);
    router.push(path);
}

const viewShop = () => {
    viewShopModal.value = !viewShopModal.value;
    shopCost.value = 0;
}

function onCostUpdated(cost) {
    console.log('cost', cost);
    shopCost.value = Number(cost);
    emit('shopCost', cost);
}

function openAwardClassPointsModal() {
    console.log('openAwardClassPointsModal');
    // Pre-select all students for whole class award
    selectedStudents.value = classData.value?.students || [];
    awardClassPointsModal.value = true;
}

function closeAwardClassPointsModal() {
    awardClassPointsModal.value = false;
}

</script>

<style>
@import '../../styles/style.css';


.classTitle {
    font-family: var(--font);
    font-optical-sizing: auto;
    font-weight: 600;
    font-style: normal;
    font-variation-settings:
        "wdth" 147.8;
    font-size: 6.25rem;
    color: var(--white);
    text-align: center;
    margin-top: 20px;
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.shopContainer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
}

.shopButton {
    background: linear-gradient(135deg,
            rgba(var(--gold-rgb), 0.589) 0%,
            rgba(var(--gold-rgb), 0.589) 50%,
            rgba(var(--gold-rgb), 0.589) 100%) !important;
    border-radius: 180px;
    box-shadow: 0 0 10px 0 rgba(var(--gold-rgb), 0.5);
    padding: 6px 20px;
    text-align: center;
    color: var(--white);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        transform: scale(1.02);
        box-shadow: 0 0 10px 0 rgba(var(--gold-rgb), 0.589);
        border: none;
        color: var(--white);
        background-color: rgba(var(--gold-rgb), 0.589);
    }
}

.awardClassPointsButton {
    background: linear-gradient(135deg,
            rgba(var(--amethyst-rgb), 0.589) 0%,
            rgba(var(--amethyst-rgb), 0.589) 50%,
            rgba(var(--amethyst-rgb), 0.589) 100%) !important;
    border-radius: 180px;
    box-shadow: 0 0 10px 0 rgba(var(--amethyst-rgb), 0.5);
    padding: 6px 20px;
    color: var(--white);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.awardClassPointsButton:hover {
    transform: scale(1.02);
    box-shadow: 0 0 10px 0 rgba(var(--amethyst-rgb), 0.589);
    border: none;
    color: var(--white);
    background-color: rgba(var(--amethyst-rgb), 0.589);
}

.pointsDialogCard {
    background-color: var(--inkBlack);
    border-radius: 25px;
    border: 1px solid var(--white);
    padding: 0 0 0.5rem;
}

.pointsDialogTitle {
    font-family: var(--font);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--white);
    text-align: center;
    padding: 0.5rem 0;
}

.pointsDialogSubtitle {
    font-family: var(--font);
    padding-top: 0;
    font-size: 1rem;
    font-weight: 500;
    color: var(--white);
    opacity: 0.8;
    text-align: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--white);
}

.pointsDialogList {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.5rem;
}

.pointsCategoryItem {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background-color: var(--inkBlack);
    color: var(--white);
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.15s ease;
}

.pointsCategoryItem:hover {
    background-color: var(--seaGreen);
}

.pointsCategoryName {
    font-family: var(--font);
    font-weight: 500;
}

.pointsCategoryValue {
    font-weight: 600;
    color: var(--seaGreen);
}

.pointsCategoryItem:hover .pointsCategoryValue {
    color: var(--white);
}

.noCategories,
.loadingCategories {
    color: var(--white);
    opacity: 0.8;
    text-align: center;
    padding: 1rem;
}

.pointsDialogCancelButton {
    font-family: var(--font) !important;
    font-size: 1rem !important;
    font-weight: 500 !important;
    color: var(--white) !important;
    background: linear-gradient(135deg,
            rgba(255, 0, 0, 0.459) 0%,
            rgba(255, 0, 0, 0.459) 100%) !important;
    border-radius: 15px !important;
    padding: 0.5rem 1rem !important;
    transition: all 0.3s ease !important;
    cursor: pointer !important;

    &:hover {
        transform: scale(1.02) !important;
        border-color: rgba(255, 0, 0, 0.459) !important;
        filter: brightness(1.1) !important;
    }
}

.classRankContainer {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    margin-bottom: 20px;
    padding: 0.5rem 0.5rem;
    border-top: 1px solid rgba(var(--gold-rgb), 0.5);
    border-bottom: 1px solid rgba(var(--gold-rgb), 0.5);
    border-radius: 24px;
    background-color: var(--inkBlack);
}

.classRankCard {
    background-color: var(--inkBlack);
    border-radius: 24px;
    padding: 0.5rem 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.classRankText {
    font-family: var(--font);
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--white);
    text-align: center;
}

.classExperienceText {
    font-family: var(--font);
    font-size: 1rem;
    font-weight: 500;
    color: var(--white);
    opacity: 0.8;
    text-align: center;
}

.shopModal {
    margin-bottom: 20px;
}
</style>