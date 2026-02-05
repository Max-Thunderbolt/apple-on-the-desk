<template>
    <Toaster position="top-right" theme="dark" :toast-options="{
        classNames: {
            toast: 'error-toast',
            title: 'error-toast-title',
            description: 'error-toast-description',
        },
    }" />
    <div class="classList">
        <div v-if="!students || students.length === 0" class="emptyState">
            No students in this class.
        </div>
        <div v-else class="studentGrid">
            <div v-for="(column, colIndex) in columns" :key="colIndex" class="studentColumn">
                <div v-for="student in column" :key="student.id">
                    <div v-if="props.isViewingShop && canAffordPoints(student)" class="studentRowCanAffordPoints"
                        @click="selectAction(student)">
                        <span class="studentName">{{ student.name }}</span>
                        <span class="studentPoints">{{ student.points ?? 0 }} pts <span
                                v-if="selectedStudents?.some((s) => s.id === student.id)"><v-icon>mdi-check</v-icon></span></span>
                    </div>
                    <div v-else-if="props.isViewingShop && !canAffordPoints(student)" class="studentRowCantAffordPoints"
                        @click="selectAction(student)">
                        <span class="studentName">{{ student.name }}</span>
                        <span class="studentPoints"> {{ student.points ?? 0 }} pts ({{ formatCost(student.points -
                            props.shopCost) }}) <span
                                v-if="selectedStudents?.some((s) => s.id === student.id)"><v-icon>mdi-check</v-icon></span></span>
                    </div>
                    <div v-else class="studentRow" @click="selectAction(student)">
                        <span class="studentName">{{ student.name }}</span>
                        <span class="studentPoints">{{ student.points ?? 0 }} pts </span>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="isViewingShop" class="checkoutContainer">
            <span class="checkoutTotal">Total: {{formatCost(selectedStudents?.reduce((acc, student) => acc +
                student.points, 0))}} ({{formatCost(selectedStudents?.reduce((acc, student) => acc +
                    student.points, 0) - props.shopCost)}} needed)</span>
            <v-btn class="checkoutButton" @click="checkout">
                Checkout
            </v-btn>
        </div>

        <v-dialog v-model="pointsDialogOpen" max-width="420" persistent transition="dialog-transition"
            class="pointsDialog" @click:outside="closePointsDialog">
            <v-card class="pointsDialogCard">
                <v-card-title class="pointsDialogTitle">
                    Award points – {{ selectedStudents?.name }}
                </v-card-title>
                <v-card-subtitle class="pointsDialogSubtitle">
                    Choose a category
                </v-card-subtitle>
                <v-card-text class="pointsDialogList">
                    <div v-for="category in pointsCategories" :key="category._id || category.id || category.name"
                        class="pointsCategoryItem" @click="awardPoints(category)">
                        <span class="pointsCategoryName">{{ category.name }}</span>
                        <span class="pointsCategoryValue">+{{ formatCost(category.value) }}</span>
                    </div>
                    <div v-if="pointsCategories.length === 0 && !pointsCategoriesLoading" class="noCategories">
                        No point categories available.
                    </div>
                    <div v-if="pointsCategoriesLoading" class="loadingCategories">
                        Loading…
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn class="pointsDialogCancelButton" variant="text" @click="closePointsDialog">Cancel</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { updateClass, getAllPointsCategories } from '../services/server';
import { Toaster, toast } from 'vue-sonner';

const props = defineProps({
    shopCost: {
        type: Number,
        required: true,
    },
    isViewingShop: {
        type: Boolean,
        required: true,
    },
    classId: {
        type: String,
        required: true,
    },
    students: {
        type: Array,
        default: () => [],
    },
    experience: {
        type: Number,
        default: 0,
    },
});

const emit = defineEmits(['students-updated', 'experience-updated']);

const pointsDialogOpen = ref(false);
const selectedStudents = ref([]);
const pointsCategories = ref([]);
const pointsCategoriesLoading = ref(false);
/** Split students into 4 columns */
const columns = computed(() => {
    const list = props.students || [];
    const cols = [[], [], [], []];
    list.forEach((student, index) => {
        cols[index % 4].push(student);
    });
    return cols;
});

watch(() => props.isViewingShop, (viewingShop) => {
    if (viewingShop) {
        pointsDialogOpen.value = false;
    }
});

watch(() => props.shopCost, (shopCost) => {
    console.log('shopCost', shopCost);
    for (const student of props.students) {
        canAffordPoints(student);
    }
});

watch(pointsDialogOpen, (open) => {
    if (open) {
        loadPointsCategories();
    }
});

async function loadPointsCategories() {
    pointsCategoriesLoading.value = true;
    pointsCategories.value = [];
    try {
        const data = await getAllPointsCategories();
        pointsCategories.value = data.pointsCategories ?? [];
    } catch (err) {
        console.error('Failed to load points categories:', err);
    } finally {
        pointsCategoriesLoading.value = false;
    }
}

function formatCost(cost) {
    const n = Number(cost);
    if (Number.isNaN(n)) return String(cost ?? '—');
    if (n % 1 === 0) {
        return `${n.toLocaleString()} pts`;
    } else {
        // toLocaleString for floating point, keep one decimal, comma-separate thousands
        return `${n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pts`;
    }
}

function selectAction(student) {
    console.log('selectAction', student);
    console.log('isViewingShop', props.isViewingShop);
    if (!props.isViewingShop) {
        openPointsDialog(student);
    } else {
        if (selectedStudents.value?.some((s) => s.id === student.id)) {
            selectedStudents.value = selectedStudents.value.filter((s) => s.id !== student.id);
        } else {
            selectedStudents.value = [...selectedStudents.value, student];
        }

        // if (!canAffordPoints(student)) {
        //     console.log('student cannot afford points');
        //     toast.error(`${student.name} cannot afford this item,`, {
        //         description: `${student.name} needs ${formatCost(props.shopCost - student.points)} more points to afford this item`,
        //         duration: 3000,

        //     });
        //     return;
        // } else {
        //     if (selectedStudents.value?.some((s) => s.id === student.id)) {
        //         selectedStudents.value = selectedStudents.value.filter((s) => s.id !== student.id);
        //     } else {
        //         selectedStudents.value = [...selectedStudents.value, student];
        //     }
        // }
    }
}

function openPointsDialog(student) {
    selectedStudents.value = [student];
    pointsDialogOpen.value = props.isViewingShop ? false : true;
}

function closePointsDialog() {
    pointsDialogOpen.value = false;
    selectedStudents.value = [];
}

function canAffordPoints(student) {
    console.log(`student ${student.name} canAffordPoints`, student.points >= props.shopCost);
    return student.points >= props.shopCost;
}

async function awardPoints(category) {
    if (!selectedStudents.value) return;
    const students = selectedStudents.value;
    const value = Number(category.value) || 0;
    const updated = props.students.map((s) => {
        if (students.some((student) => student.id === s.id)) {
            return { ...s, points: (s.points ?? 0) + value };
        }
        return { ...s };
    });
    const updatedExperience = (value * 2) + props.experience;
    console.log('updatedExperience', updatedExperience);
    try {
        await updateClass(props.classId, { students: updated, experience: updatedExperience });
        emit('students-updated', updated);
        emit('experience-updated', updatedExperience);
        closePointsDialog();
    } catch (err) {
        console.error('Failed to award points:', err);
    }
}

async function checkout() {
    const selected = Array.isArray(selectedStudents.value) ? selectedStudents.value : [];
    if (!selected.length) return;

    const totalCost = Number(props.shopCost) || 0;
    if (totalCost <= 0) {
        toast.error('No cost to pay');
        return;
    }

    // Sort selected students by points ascending (least points first)
    const sorted = [...selected].sort((a, b) => (a.points ?? 0) - (b.points ?? 0));

    let remaining = totalCost;
    const deductions = new Map(); // student id -> amount to deduct

    for (const student of sorted) {
        if (remaining <= 0) break;
        const points = student.points ?? 0;
        const deduct = Math.min(points, remaining);
        if (deduct > 0) {
            deductions.set(student.id, deduct);
            remaining -= deduct;
        }
    }

    if (remaining > 0) {
        toast.error('Selected students do not have enough points combined', {
            description: `Need ${formatCost(remaining)} more`,
            duration: 3000,
        });
        return;
    }

    const updated = props.students.map((s) => {
        const deduct = deductions.get(s.id);
        if (deduct !== undefined) {
            return { ...s, points: (s.points ?? 0) - deduct };
        }
        return { ...s };
    });

    try {
        await updateClass(props.classId, { students: updated });
        emit('students-updated', updated);
        toast.success('Purchase completed', {
            description: `Deducted ${formatCost(totalCost)} from selected students (least points first)`,
            duration: 3000,
        });
        selectedStudents.value = [];
    } catch (err) {
        console.error('Failed to checkout', err);
        toast.error('Checkout failed');
    }
}
</script>

<style scoped>
@import '../styles/style.css';

.classList {
    width: 100%;
    margin-top: 1rem;
}

.emptyState {
    color: var(--white);
    opacity: 0.8;
    text-align: center;
    padding: 2rem;
}

.studentGrid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem 2rem;
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    padding-bottom: 2rem;
}

.studentColumn {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.studentRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background-color: var(--inkBlack);
    border-radius: 12px;
    box-shadow: 10px 10px 10px 0 rgba(0, 0, 0, 0.5);
    min-height: 48px;
    transition: all 0.3s ease;
}

.studentRow:hover {
    transform: scale(1.05) translateY(-10px) !important;
    box-shadow: 0 0 20px 0 var(--seaGreen) !important;
    border: none !important;
    color: var(--white) !important;
    background-color: var(--seaGreen) !important;
}

.studentRowCanAffordPoints {
    background-color: var(--seaGreen) !important;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    box-shadow: 10px 10px 10px 0 rgba(0, 0, 0, 0.5);
    min-height: 48px;
    transition: all 0.3s ease;
}

.studentRowCanAffordPoints:hover {
    transform: scale(1.05) translateY(-10px) !important;
    box-shadow: 0 0 20px 0 var(--seaGreen) !important;
    border: none !important;
    color: var(--white) !important;
    background-color: var(--seaGreen) !important;
}

.studentRowCantAffordPoints {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background-color: var(--intenseCherry) !important;
    border-radius: 12px;
    box-shadow: 10px 10px 10px 0 rgba(0, 0, 0, 0.5);
    min-height: 48px;
    transition: all 0.3s ease;
    color: var(--white) !important;
}

.studentRowCantAffordPoints:hover {
    transform: scale(1.05) translateY(-10px) !important;
    box-shadow: 0 0 20px 0 var(--intenseCherry) !important;
    border: none !important;
    color: var(--white) !important;
    background-color: var(--intenseCherry) !important;
}

.studentName {
    font-family: var(--font);
    font-size: 1rem;
    font-weight: 500;
    color: var(--white);
    flex: 1;
    min-width: 0;
}

.studentName.clickable {
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
}

.studentName.clickable:hover {
    color: var(--freshSky);
}

.studentPoints {
    font-size: 0.9rem;
    opacity: 0.9;
    color: var(--white);
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

.checkoutContainer {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
}

.checkoutButton {
    font-family: var(--font);
    font-size: 1rem;
    font-weight: 500;
    color: var(--white);
    background-color: var(--seaGreen);
    border-radius: 12px;
    padding: 0.5rem 1rem;
}

.checkoutButton:hover {
    transform: scale(1.02);
    background-color: var(--seaGreen);
    color: var(--white);
    border: none;
    box-shadow: 0 0 10px 0 rgba(26, 147, 111, 0.5);
    transition: all 0.3s ease;
}

.checkoutTotal {
    font-family: var(--font);
    font-size: 1rem;
    font-weight: 500;
    color: var(--white);
    opacity: 0.8;
    background-color: var(--inkBlack);
    border: 1px solid var(--white);
    border-radius: 12px;
    margin-right: 1rem;
    padding: 0.5rem 1rem;
}
</style>
