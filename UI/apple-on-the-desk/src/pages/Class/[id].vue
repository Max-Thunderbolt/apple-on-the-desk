<template>
    <v-breadcrumbs density="compact" :items="breadcrumbs" class="breadcrumbs">
        <template v-slot:divider>
            <v-icon>mdi-chevron-right</v-icon>
        </template>
    </v-breadcrumbs>
    <div class="container" style="justify-content: flex-start !important;">
        <h1 class="classTitle">{{ classData?.name }} </h1>
        <div class="classContent">
            <div v-if="!viewShopModal" class="timer">
                <Timer :initialSeconds="300" :autoRepeat="false" />
            </div>
            <div v-if="viewShopModal" class="shopModal">
                <Shop :shopItems="shopItems" @cost-updated="onCostUpdated" />
            </div>
            <div class="shopContainer">
                <v-btn class="shopButton" @click="viewShop()">
                    <v-icon>{{ viewShopModal ? 'mdi-timer' : 'mdi-store' }}</v-icon>
                    {{ viewShopModal ? 'Timer' : 'Shop' }}
                </v-btn>
            </div>
            <ClassList v-if="classData && id" :shopCost="shopCost" :isViewingShop="viewShopModal" :class-id="id"
                :students="classData.students || []" :experience="classData.experience || 0"
                @students-updated="onStudentsUpdated" @shopCostUpdated="onShopCostUpdated" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, defineEmits } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getClassById } from '../../services/server';
import Timer from '../../components/Timer.vue';
import ClassList from '../../components/classList.vue';
import Shop from '../../components/Shop.vue';
import { getShopItems } from '../../services/server';

const router = useRouter();
const { id } = useRoute().params;
const classData = ref(null);
const viewShopModal = ref(false);
const shopItems = ref([]);
const shopCost = ref(0);

let breadcrumbs = computed(() => [
    { title: 'Home', to: '/' },
    { title: 'Classes', to: '/Classes' },
    { title: classData.value?.name, to: `/Class/${id}` },
]);

const emit = defineEmits(['shopCostUpdated']);

const loadClass = async () => {
    try {
        const response = await getClassById(id);
        console.log(response);
        classData.value = response.class;
    } catch (error) {
        console.error('Error loading class:', error);
    }
};

const loadShopItems = async () => {
    try {
        const response = await getShopItems();
        shopItems.value = response.shopItems ?? [];
    } catch (error) {
        console.error('Error loading shop items:', error);
    }
}

function onStudentsUpdated(updatedStudents) {
    if (classData.value) {
        classData.value.students = updatedStudents;
    }
}

function onShopCostUpdated(cost) {
    console.log('cost', cost);
    shopCost.value = Number(cost);
}

onMounted(() => {
    loadClass();
    loadShopItems();
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
    flex-direction: row;
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

.shopModal {
    margin-bottom: 20px;
}
</style>