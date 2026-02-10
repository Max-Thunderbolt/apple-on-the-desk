<template>
    <div class="classGroupView">
        <div v-if="!students || students.length === 0" class="emptyState">
            No students in this class.
        </div>
        <div v-else-if="!hasGroups" class="emptyState">
            No groups have been created yet. Click "Create Groups" to get started.
        </div>
        <div v-else class="groupsContainer">
            <div v-for="(groupStudents, groupName) in groupedStudents" :key="groupName" class="groupCard">
                <div class="groupHeader">
                    <h3 class="groupTitle">{{ groupName }}</h3>
                    <span class="groupCount">{{ groupStudents.length }} student{{ groupStudents.length !== 1 ? 's' : '' }}</span>
                </div>
                <div class="groupStudents">
                    <div v-for="student in groupStudents" :key="student.id">
                        <div v-if="props.isViewingShop && canAffordPoints(student)" class="studentRowCanAffordPoints"
                            @click="selectAction(student)" @contextmenu.prevent="openContextMenu($event, student)">
                            <span class="studentName">{{ student.name }}</span>
                            <span class="studentPoints">{{ student.points ?? 0 }} pts <span
                                    v-if="isStudentSelected(student)"><v-icon size="small">mdi-check</v-icon></span></span>
                        </div>
                        <div v-else-if="props.isViewingShop && !canAffordPoints(student)" class="studentRowCantAffordPoints"
                            @click="selectAction(student)" @contextmenu.prevent="openContextMenu($event, student)">
                            <span class="studentName">{{ student.name }}</span>
                            <span class="studentPoints"> {{ student.points ?? 0 }} pts ({{ formatCost(student.points -
                                props.shopCost) }}) <span
                                    v-if="isStudentSelected(student)"><v-icon size="small">mdi-check</v-icon></span></span>
                        </div>
                        <div v-else class="studentRow" @click="selectAction(student)"
                            @contextmenu.prevent="openContextMenu($event, student)">
                            <span class="studentName">{{ student.name }}</span>
                            <span class="studentPoints">{{ student.points ?? 0 }} pts </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    students: {
        type: Array,
        default: () => [],
    },
    shopCost: {
        type: Number,
        required: true,
    },
    isViewingShop: {
        type: Boolean,
        required: true,
    },
    selectedStudents: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits(['student-click', 'student-context-menu']);

const groupedStudents = computed(() => {
    const groups = {};
    
    props.students.forEach(student => {
        if (student.group) {
            if (!groups[student.group]) {
                groups[student.group] = [];
            }
            groups[student.group].push(student);
        }
    });

    // Sort group names (C02, C03, etc.)
    const sortedGroups = {};
    Object.keys(groups).sort().forEach(key => {
        sortedGroups[key] = groups[key];
    });

    return sortedGroups;
});

const hasGroups = computed(() => {
    return props.students.some(s => s.group);
});

function formatCost(cost) {
    const n = Number(cost);
    if (Number.isNaN(n)) return String(cost ?? '—');
    if (n % 1 === 0) {
        return `${n.toLocaleString(undefined, { locale: 'en-ZA' })} pts`;
    } else {
        return `${n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: true, locale: 'en-ZA' })} pts`;
    }
}

function canAffordPoints(student) {
    return student.points >= props.shopCost;
}

function isStudentSelected(student) {
    return props.selectedStudents?.some((s) => s.id === student.id);
}

function selectAction(student) {
    emit('student-click', student);
}

function openContextMenu(event, student) {
    emit('student-context-menu', event, student);
}
</script>

<style scoped>
.classGroupView {
    width: 100%;
    margin-top: 1rem;
}

.emptyState {
    color: var(--white);
    opacity: 0.8;
    text-align: center;
    padding: 2rem;
}

.groupsContainer {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding-bottom: 2rem;
}

.groupCard {
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 1rem;
    transition: all 0.3s ease;
}

.groupCard:hover {
    background-color: rgba(255, 255, 255, 0.08);
    border-color: var(--seaGreen);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.groupHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid rgba(var(--seaGreen-rgb), 0.3);
}

.groupTitle {
    font-family: var(--font);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--seaGreen);
    margin: 0;
}

.groupCount {
    font-family: var(--font);
    font-size: 0.85rem;
    color: var(--white);
    opacity: 0.7;
}

.groupStudents {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.studentRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background-color: var(--inkBlack);
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    min-height: 44px;
    transition: all 0.2s ease;
    cursor: pointer;
}

.studentRow:hover {
    transform: translateX(4px);
    background-color: var(--seaGreen);
    box-shadow: 0 2px 8px rgba(var(--seaGreen-rgb), 0.4);
}

.studentRowCanAffordPoints {
    background-color: var(--seaGreen) !important;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    min-height: 44px;
    transition: all 0.2s ease;
    cursor: pointer;
}

.studentRowCanAffordPoints:hover {
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(var(--seaGreen-rgb), 0.5);
    filter: brightness(1.1);
}

.studentRowCantAffordPoints {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background-color: var(--intenseCherry) !important;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    min-height: 44px;
    transition: all 0.2s ease;
    color: var(--white) !important;
    cursor: pointer;
}

.studentRowCantAffordPoints:hover {
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(var(--intenseCherry-rgb), 0.5);
    filter: brightness(1.1);
}

.studentName {
    font-family: var(--font);
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--white);
    flex: 1;
    min-width: 0;
}

.studentPoints {
    font-size: 0.85rem;
    opacity: 0.9;
    color: var(--white);
    white-space: nowrap;
}
</style>
