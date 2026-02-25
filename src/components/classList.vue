<template>
    <Toaster position="top-right" theme="dark" :toast-options="{
        classNames: {
            toast: 'error-toast',
            title: 'error-toast-title',
            description: 'error-toast-description',
        },
    }" />
    <div class="classList">
        <!-- View Toggle -->
        <div v-if="students && students.length > 0 && hasGroups" class="viewToggle">
            <v-btn-toggle v-model="actualViewMode" class="viewToggleButtons" mandatory>
                <v-btn value="list" class="viewToggleBtn">
                    <v-icon>mdi-view-list</v-icon>
                    List View
                </v-btn>
                <v-btn value="groups" class="viewToggleBtn">
                    <v-icon>mdi-view-grid</v-icon>
                    Group View
                </v-btn>
            </v-btn-toggle>
        </div>

        <div v-if="!students || students.length === 0" class="emptyState">
            No students in this class.
        </div>

        <!-- Group View -->
        <ClassGroupView v-else-if="actualViewMode === 'groups'" :students="props.students" :shopCost="props.shopCost"
            :isViewingShop="props.isViewingShop" :selectedStudents="selectedStudents" @student-click="selectAction"
            @student-context-menu="openContextMenu" @group-click="openPointsDialogForGroup" />

        <!-- List View -->
        <div v-else class="studentGrid">
            <div v-for="(column, colIndex) in columns" :key="colIndex" class="studentColumn">
                <div v-for="student in column" :key="student.id">
                    <div v-if="props.isViewingShop && canAffordPoints(student)" class="studentRowCanAffordPoints"
                        @click="selectAction(student)" @contextmenu.prevent="openContextMenu($event, student)">
                        <div class="studentNameContainer">
                            <span class="studentName"
                                :class="{ zeroPoints: (student.points ?? 0) === 0 && props.isViewingShop && props.shopCost > 0 }">{{
                                    student.name }}</span>
                        </div>
                        <span class="studentPoints">{{ student.points ?? 0 }} pts <span
                                v-if="selectedStudents?.some((s) => s.id === student.id)"><v-icon>mdi-check</v-icon></span></span>
                    </div>
                    <div v-else-if="props.isViewingShop && !canAffordPoints(student)" class="studentRowCantAffordPoints"
                        @click="selectAction(student)" @contextmenu.prevent="openContextMenu($event, student)">
                        <div class="studentNameContainer">
                            <span class="studentName"
                                :class="{ zeroPoints: (student.points ?? 0) === 0 && props.isViewingShop && props.shopCost > 0 }">{{
                                    student.name }}</span>
                        </div>
                        <span class="studentPoints"> {{ student.points ?? 0 }} pts ({{ formatCost(student.points -
                            props.shopCost) }}) <span
                                v-if="selectedStudents?.some((s) => s.id === student.id)"><v-icon>mdi-check</v-icon></span></span>
                    </div>
                    <div v-else class="studentRow" @click="selectAction(student)"
                        @contextmenu.prevent="openContextMenu($event, student)">
                        <div class="studentNameContainer">
                            <span class="studentName"
                                :class="{ zeroPoints: (student.points ?? 0) === 0 && props.isViewingShop && props.shopCost > 0 }">{{
                                    student.name }}</span>
                        </div>
                        <span class="studentPoints">{{ student.points ?? 0 }} pts </span>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="isViewingShop" class="checkoutContainer">
            <span class="checkoutTotal">
                Total: {{ formatCost(totalSelectedPoints) }}
                <span v-if="!canAffordShop" class="checkoutShortfall">
                    ({{ formatCost(pointsRemaining) }} needed)
                </span>
                <span v-else class="checkoutExcess">
                    ({{ formatCost(-pointsRemaining) }} excess)
                </span>
            </span>
            <v-btn class="checkoutButton" :disabled="!canAffordShop" @click="checkout">
                Checkout
            </v-btn>
        </div>

        <!-- Context Menu -->
        <v-menu v-model="contextMenuOpen"
            :style="{ position: 'fixed', left: contextMenuX + 'px', top: contextMenuY + 'px' }" :location="undefined"
            :attach="false">
            <v-list class="contextMenu">
                <v-list-item @click="editStudentName(contextMenuStudent)">
                    <template v-slot:prepend>
                        <v-icon>mdi-pencil</v-icon>
                    </template>
                    <v-list-item-title>Edit Name</v-list-item-title>
                </v-list-item>
                <v-list-item @click="openConstraintsModal(contextMenuStudent)">
                    <template v-slot:prepend>
                        <v-icon>mdi-account-multiple-remove</v-icon>
                    </template>
                    <v-list-item-title>Manage Pairing Constraints</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>

        <award-points-modal v-model:pointsDialogOpen="pointsDialogOpen" v-model:selectedStudents="selectedStudents"
            :all-students="props.students" :class-id="props.classId" :is-for-group="awardPointsIsForGroup"
            @studentsUpdated="onStudentsUpdated" />

        <student-constraints-modal v-model="constraintsModalOpen" :class-id="props.classId"
            :student="selectedStudentForConstraints" :all-students="props.students"
            @constraintsUpdated="onConstraintsUpdated" />
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Server from '../services/server';
import { Toaster, toast } from 'vue-sonner';
import AwardPointsModal from '../components/modals/awardPointsModal.vue';
import StudentConstraintsModal from '../components/modals/StudentConstraintsModal.vue';
import ClassGroupView from './ClassGroupView.vue';

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
const awardPointsIsForGroup = ref(false);
const contextMenuOpen = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuStudent = ref(null);
const constraintsModalOpen = ref(false);
const selectedStudentForConstraints = ref({});

const hasGroups = computed(() => {
    return props.students?.some(s => s.group) || false;
});

// Track the actual view mode selection
const actualViewMode = ref('list');

// Watch for when groups are created and switch to group view automatically
watch(hasGroups, (newHasGroups) => {
    if (newHasGroups && actualViewMode.value === 'list') {
        actualViewMode.value = 'groups';
    } else if (!newHasGroups) {
        actualViewMode.value = 'list';
    }
});
/** Split students into 4 columns */
const columns = computed(() => {
    const list = props.isViewingShop ? props.students.sort((a, b) => (b.points ?? 0) - (a.points ?? 0)) : props.students.sort((a, b) => a.name.localeCompare(b.name)) || [];
    const cols = [[], [], [], []];
    list.forEach((student, index) => {
        cols[index % 4].push(student);
    });
    return cols;
});

/** Total points of selected students */
const totalSelectedPoints = computed(() => {
    return selectedStudents.value?.reduce((acc, student) => acc + (student.points || 0), 0) || 0;
});

/** Remaining points needed to afford shop cost (negative if they have excess) */
const pointsRemaining = computed(() => {
    return props.shopCost - totalSelectedPoints.value;
});

/** Whether selected students can afford the shop cost */
const canAffordShop = computed(() => {
    return totalSelectedPoints.value >= props.shopCost;
});

watch(() => props.isViewingShop, (viewingShop) => {
    if (viewingShop) {
        pointsDialogOpen.value = false;
    }
});

watch(() => props.shopCost, (shopCost) => {
    console.log('shopCost', shopCost);
    if (Number(shopCost) === 0) {
        selectedStudents.value = [];
    }
    for (const student of props.students) {
        canAffordPoints(student);
    }
});

function formatCost(cost) {
    const n = Number(cost);
    if (Number.isNaN(n)) return String(cost ?? '—');
    if (n % 1 === 0) {
        return `${n.toLocaleString(undefined, { locale: 'en-ZA' })} pts`;
    } else {
        // toLocaleString for floating point, keep one decimal, comma-separate thousands
        return `${n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: true, locale: 'en-ZA' })} pts`;
    }
}

function selectAction(student) {
    // console.log('selectAction', student);
    // console.log('isViewingShop', props.isViewingShop);
    if (!props.isViewingShop) {
        openPointsDialog(student);
    } else {
        if (selectedStudents.value?.some((s) => s.id === student.id)) {
            selectedStudents.value = selectedStudents.value.filter((s) => s.id !== student.id);
        } else {
            selectedStudents.value = [...selectedStudents.value, student];
        }
    }
}

function onStudentsUpdated(updatedStudents) {
    emit('students-updated', updatedStudents);
}

function openPointsDialog(student) {
    awardPointsIsForGroup.value = false;
    selectedStudents.value = [student];
    pointsDialogOpen.value = props.isViewingShop ? false : true;
}

function openPointsDialogForGroup(groupStudents) {
    if (!groupStudents?.length) return;
    awardPointsIsForGroup.value = true;
    selectedStudents.value = [...groupStudents];
    pointsDialogOpen.value = true;
}

function closePointsDialog() {
    pointsDialogOpen.value = false;
    selectedStudents.value = [];
    awardPointsIsForGroup.value = false;
}

function canAffordPoints(student) {
    console.log(`student ${student.name} canAffordPoints`, student.points >= props.shopCost);
    return student.points >= props.shopCost;
}

function openContextMenu(event, student) {
    contextMenuStudent.value = student;
    contextMenuX.value = event.clientX;
    contextMenuY.value = event.clientY;
    contextMenuOpen.value = true;
}

async function editStudentName(student) {
    contextMenuOpen.value = false;
    if (!student) return;

    const currentName = student.name ?? '';
    const newName = window.prompt('Edit student name', currentName);

    if (newName == null) return;

    const trimmed = newName.trim();
    if (!trimmed || trimmed === currentName) return;

    const updated = props.students.map((s) =>
        s.id === student.id
            ? { ...s, name: trimmed }
            : { ...s }
    );

    try {
        await Server.updateClass(props.classId, { students: updated });
        emit('students-updated', updated);
        toast.success('Student name updated', {
            description: `${currentName} → ${trimmed}`,
            duration: 3000,
        });
    } catch (err) {
        console.error('Failed to update student name:', err);
        toast.error('Failed to update student name');
    }
}

function openConstraintsModal(student) {
    contextMenuOpen.value = false;
    if (!student) return;
    selectedStudentForConstraints.value = student;
    constraintsModalOpen.value = true;
}

function onConstraintsUpdated(updatedStudent) {
    const updated = props.students.map((s) =>
        s.id === updatedStudent.id ? { ...s, cannotPairWith: updatedStudent.cannotPairWith } : { ...s }
    );
    emit('students-updated', updated);
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
        await Server.updateClass(props.classId, { students: updated });
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

.viewToggle {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
}

.viewToggleButtons {
    background-color: var(--inkBlack) !important;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 180px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.viewToggleBtn {
    font-family: var(--font) !important;
    color: var(--white) !important;
    text-transform: none !important;
    font-size: 0.9rem !important;
    font-weight: 500 !important;
    padding: 8px 20px !important;
    transition: all 0.3s ease !important;
    background-color: transparent !important;
    border: none !important;
}

.viewToggleBtn:hover {
    background-color: rgba(var(--seaGreen-rgb), 0.2) !important;
}

.viewToggleBtn.v-btn--active {
    background: linear-gradient(135deg,
            rgba(var(--seaGreen-rgb), 0.6) 0%,
            rgba(var(--seaGreen-rgb), 0.7) 100%) !important;
    color: var(--white) !important;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.viewToggleBtn .v-icon {
    margin-right: 0.5rem;
}

.emptyState {
    color: var(--white);
    opacity: 0.8;
    text-align: center;
    padding: 2rem;
}

.studentGrid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem;
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    padding-bottom: 2rem;
    min-width: 0;
}

/* Step columns by width – 1 → 2 → 3 → 4 so we never force too many columns on small screens */
@media (min-width: 600px) {
    .studentGrid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem 1rem;
    }
}

@media (min-width: 900px) {
    .studentGrid {
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem 1.25rem;
    }
}

@media (min-width: 1200px) {
    .studentGrid {
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem 2rem;
    }
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

@media (hover: hover) {
    .studentRow:hover {
        transform: scale(1.05) translateY(-10px) !important;
        box-shadow: 0 0 20px 0 var(--seaGreen) !important;
        border: none !important;
        color: var(--white) !important;
        background-color: var(--seaGreen) !important;
    }
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

@media (hover: hover) {
    .studentRowCanAffordPoints:hover {
        transform: scale(1.05) translateY(-10px) !important;
        box-shadow: 0 0 20px 0 var(--seaGreen) !important;
        border: none !important;
        color: var(--white) !important;
        background-color: var(--seaGreen) !important;
    }

    .studentRowCantAffordPoints:hover {
        transform: scale(1.05) translateY(-10px) !important;
        box-shadow: 0 0 20px 0 var(--intenseCherry) !important;
        border: none !important;
        color: var(--white) !important;
        background-color: var(--intenseCherry) !important;
    }
}

.studentNameContainer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
}

.studentName {
    font-family: var(--font);
    font-size: 1rem;
    font-weight: 500;
    color: var(--white);
    flex: 1;
}

.studentName.zeroPoints {
    text-decoration: line-through;
    opacity: 0.85;
}

.studentName.clickable {
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
}

.studentName.clickable:hover {
    color: var(--freshSky);
}

.groupBadge {
    font-family: var(--font);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--white);
    background: linear-gradient(135deg,
            rgba(var(--seaGreen-rgb), 0.6) 0%,
            rgba(var(--seaGreen-rgb), 0.8) 100%);
    padding: 0.2rem 0.5rem;
    border-radius: 8px;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.studentPoints {
    font-size: 0.9rem;
    opacity: 0.9;
    color: var(--white);
}

.checkoutContainer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
    padding: 0 0.5rem;
}

@media (min-width: 768px) {
    .checkoutContainer {
        margin-top: 1rem;
        margin-bottom: 1rem;
        padding: 0;
    }
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

@media (hover: hover) {
    .checkoutButton:hover {
        transform: scale(1.02);
        background-color: var(--seaGreen);
        color: var(--white);
        border: none;
        box-shadow: 0 0 10px 0 rgba(26, 147, 111, 0.5);
        transition: all 0.3s ease;
    }
}

.checkoutTotal {
    font-family: var(--font);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--white);
    opacity: 0.8;
    background-color: var(--inkBlack);
    border: 1px solid var(--white);
    border-radius: 12px;
    padding: 0.5rem 0.75rem;
}

@media (min-width: 768px) {
    .checkoutTotal {
        font-size: 1rem;
        margin-right: 1rem;
        padding: 0.5rem 1rem;
    }
}

.checkoutShortfall {
    color: var(--intenseCherry);
    font-weight: 600;
}

.checkoutExcess {
    color: var(--seaGreen);
    font-weight: 600;
}

.checkoutButton:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.contextMenu {
    background-color: var(--inkBlack) !important;
    border: 1px solid var(--white);
    border-radius: 12px;
    padding: 0.25rem 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.contextMenu .v-list-item {
    font-family: var(--font);
    color: var(--white);
    min-height: 40px;
}

@media (hover: hover) {
    .contextMenu .v-list-item:hover {
        background-color: var(--seaGreen) !important;
    }
}

:deep(.v-overlay__content) {
    position: fixed !important;
}
</style>
