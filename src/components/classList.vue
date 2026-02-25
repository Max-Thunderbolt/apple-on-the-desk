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

        <!-- Group View -->
        <ClassGroupView v-else-if="viewMode === 'groups'" :students="displayedStudents" :shopCost="props.shopCost"
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

        <div v-if="isViewingShop" class="shopTotalsContainer">
            <span class="classTotalLabel">Class total: {{ formatCost(classTotalPoints) }}</span>
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

        <!-- Context Menu: custom overlay so open/close state stays reliable with dialogs -->
        <Teleport to="body">
            <div v-if="isContextMenuOpen" class="contextMenuBackdrop" @click="contextMenu.close()">
                <div class="contextMenuPopover" :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
                    @click.stop>
                    <v-list class="contextMenu">
                        <v-list-item @click="editStudentName(contextMenuTarget); contextMenu.close()">
                            <template v-slot:prepend>
                                <v-icon>mdi-pencil</v-icon>
                            </template>
                            <v-list-item-title>Edit Name</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="openConstraintsModal(contextMenuTarget); contextMenu.close()">
                            <template v-slot:prepend>
                                <v-icon>mdi-account-multiple-remove</v-icon>
                            </template>
                            <v-list-item-title>Manage Pairing Constraints</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </div>
            </div>
        </Teleport>

        <award-points-modal v-model:pointsDialogOpen="pointsDialogOpen" v-model:selectedStudents="selectedStudents"
            :all-students="props.students" :class-id="props.classId" :is-for-group="awardPointsIsForGroup"
            @studentsUpdated="onStudentsUpdated" />

        <student-constraints-modal v-model="constraintsModalOpen" :class-id="props.classId"
            :student="selectedStudentForConstraints" :all-students="props.students"
            @constraintsUpdated="onConstraintsUpdated" />
    </div>
</template>

<script setup>
import { ref, computed, watch, toRef } from 'vue';
import { useClasses } from '../composables/useClasses';
import { useFormat } from '../composables/useFormat';
import { useContextMenu } from '../composables/useContextMenu';
import { useShopSelection } from '../composables/useShopSelection';
import { useStudentListColumns } from '../composables/useStudentListColumns';
import { Toaster, toast } from 'vue-sonner';
import AwardPointsModal from './modals/awardPointsModal.vue';
import StudentConstraintsModal from './modals/StudentConstraintsModal.vue';
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
    viewMode: {
        type: String,
        default: 'list',
        validator: (v) => ['list', 'groups'].includes(v),
    },
    searchQuery: {
        type: String,
        default: '',
    },
});

const emit = defineEmits(['students-updated', 'experience-updated']);

const { updateClass } = useClasses();
const { formatCost } = useFormat();
const contextMenu = useContextMenu();

// Expose ref values so template sees actual booleans/numbers (nested refs in plain object aren't auto-unwrapped)
const isContextMenuOpen = computed(() => contextMenu.isOpen.value);
const contextMenuX = computed(() => contextMenu.x.value);
const contextMenuY = computed(() => contextMenu.y.value);
const contextMenuTarget = computed(() => contextMenu.target.value);
const shopCostRef = toRef(props, 'shopCost');
const studentsRef = toRef(props, 'students');
const isViewingShopRef = toRef(props, 'isViewingShop');

const displayedStudents = computed(() => {
    const list = props.students ?? [];
    const q = (props.searchQuery || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => {
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const groupMatch = (s.group || '').toLowerCase().includes(q);
        return nameMatch || groupMatch;
    });
});

const { columns } = useStudentListColumns(displayedStudents, isViewingShopRef);

const pointsDialogOpen = ref(false);
const awardPointsIsForGroup = ref(false);
const constraintsModalOpen = ref(false);
const selectedStudentForConstraints = ref({});

const hasGroups = computed(() => {
    return props.students?.some(s => s.group) || false;
});

const classTotalPoints = computed(() => {
    return (props.students ?? []).reduce((sum, s) => sum + (s.points ?? 0), 0);
});

const {
    selectedStudents,
    totalSelectedPoints,
    pointsRemaining,
    canAffordShop,
    canAffordPoints,
    toggleStudent,
    setSelection,
    clearSelection,
    checkout: doCheckout,
} = useShopSelection(shopCostRef);

watch(() => props.isViewingShop, (viewingShop) => {
    if (viewingShop) {
        pointsDialogOpen.value = false;
    }
});

watch(() => props.shopCost, (shopCost) => {
    if (Number(shopCost) === 0) {
        clearSelection();
    }
});

function selectAction(student) {
    if (!props.isViewingShop) {
        openPointsDialog(student);
    } else {
        toggleStudent(student);
    }
}

function onStudentsUpdated(updatedStudents) {
    emit('students-updated', updatedStudents);
}

function openPointsDialog(student) {
    awardPointsIsForGroup.value = false;
    setSelection([student]);
    pointsDialogOpen.value = !props.isViewingShop;
}

function openPointsDialogForGroup(groupStudents) {
    if (!groupStudents?.length) return;
    awardPointsIsForGroup.value = true;
    setSelection([...groupStudents]);
    pointsDialogOpen.value = true;
}

function openContextMenu(event, student) {
    contextMenu.open(event, student);
}

async function editStudentName(student) {
    contextMenu.close();
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
        await updateClass(props.classId, { students: updated });
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
    contextMenu.close();
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

function checkout() {
    doCheckout(props.classId, props.students, updateClass);
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
    padding: 0 0.75rem;
    padding-bottom: 2rem;
    min-width: 0;
    box-sizing: border-box;
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
    gap: 0.5rem;
    padding: 0.5rem 0.6rem;
    background-color: var(--inkBlack);
    border-radius: 10px;
    box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.4);
    min-height: 48px;
    transition: all 0.3s ease;
    -webkit-tap-highlight-color: transparent;
}

@media (min-width: 600px) {
    .studentRow {
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        border-radius: 12px;
        box-shadow: 10px 10px 10px 0 rgba(0, 0, 0, 0.5);
    }
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
    gap: 0.5rem;
    padding: 0.5rem 0.6rem;
    border-radius: 10px;
    box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.4);
    min-height: 48px;
    transition: all 0.3s ease;
    -webkit-tap-highlight-color: transparent;
}

@media (min-width: 600px) {
    .studentRowCanAffordPoints {
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        border-radius: 12px;
        box-shadow: 10px 10px 10px 0 rgba(0, 0, 0, 0.5);
    }
}

.studentRowCantAffordPoints {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.6rem;
    background-color: var(--intenseCherry) !important;
    border-radius: 10px;
    box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.4);
    min-height: 48px;
    transition: all 0.3s ease;
    color: var(--white) !important;
    -webkit-tap-highlight-color: transparent;
}

@media (min-width: 600px) {
    .studentRowCantAffordPoints {
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        border-radius: 12px;
        box-shadow: 10px 10px 10px 0 rgba(0, 0, 0, 0.5);
    }
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
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--white);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

@media (min-width: 600px) {
    .studentName {
        font-size: 1rem;
    }
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
    font-size: 0.8rem;
    opacity: 0.9;
    color: var(--white);
    flex-shrink: 0;
    white-space: nowrap;
}

@media (min-width: 600px) {
    .studentPoints {
        font-size: 0.9rem;
    }
}

.shopTotalsContainer {
    display: flex;
    justify-content: center;
    margin-top: 0.75rem;
    padding: 0 0.75rem;
}

.classTotalLabel {
    font-family: var(--font);
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--white);
    opacity: 0.9;
    background-color: var(--inkBlack);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 12px;
    padding: 0.5rem 0.75rem;
    text-align: center;
    max-width: 100%;
}

@media (min-width: 768px) {
    .shopTotalsContainer {
        margin-top: 1rem;
        padding: 0;
    }

    .classTotalLabel {
        font-size: 0.95rem;
        padding: 0.5rem 1rem;
    }
}

.checkoutContainer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
    padding: 0 0.75rem;
}

@media (min-width: 768px) {
    .checkoutContainer {
        margin-top: 1rem;
        margin-bottom: 1rem;
        padding: 0;
    }
}

.checkoutTotal {
    font-family: var(--font);
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--white);
    opacity: 0.8;
    background-color: var(--inkBlack);
    border: 1px solid var(--white);
    border-radius: 12px;
    padding: 0.5rem 0.75rem;
    max-width: 100%;
}

@media (min-width: 768px) {
    .checkoutTotal {
        font-size: 0.9rem;
        margin-right: 1rem;
        padding: 0.5rem 1rem;
    }
}

.checkoutButton {
    font-family: var(--font);
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--white);
    background-color: var(--seaGreen);
    border-radius: 12px;
    padding: 0.5rem 1rem;
    min-height: 44px;
    -webkit-tap-highlight-color: transparent;
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

.contextMenuBackdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
}

.contextMenuPopover {
    position: fixed;
    z-index: 2001;
    min-width: 200px;
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
</style>
