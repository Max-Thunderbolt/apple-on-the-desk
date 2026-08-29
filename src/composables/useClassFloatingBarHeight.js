import { ref } from 'vue';

export const classFloatingBarHeight = ref(100);

export function setClassFloatingBarHeight(height) {
    classFloatingBarHeight.value = Math.max(0, Number(height) || 0);
}

export function clearClassFloatingBarHeight() {
    classFloatingBarHeight.value = 100;
}
