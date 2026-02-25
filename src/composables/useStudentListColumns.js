import { computed } from 'vue';

/**
 * Splits a student list into columns for grid display. Optionally sorts by
 * points (desc) when isViewingShop is true, else by name.
 */
export function useStudentListColumns(studentsRef, isViewingShopRef) {
    const columns = computed(() => {
        const list = studentsRef?.value ?? [];
        const sorted = [...list].sort((a, b) => {
            if (isViewingShopRef?.value) {
                return (b.points ?? 0) - (a.points ?? 0);
            }
            return (a.name || '').localeCompare(b.name || '');
        });
        const cols = [[], [], [], []];
        sorted.forEach((student, index) => {
            cols[index % 4].push(student);
        });
        return cols;
    });

    return { columns };
}
