import { ref, computed } from 'vue';
import { toast } from 'vue-sonner';
import { useFormat } from './useFormat';

/**
 * Shop selection state and checkout logic for a class list. Use in components
 * where students can be selected to pay a shop cost. Pass a ref/getter for
 * the current shop cost.
 */
export function useShopSelection(shopCostRef) {
    const { formatCost } = useFormat();
    const selectedStudents = ref([]);

    const totalSelectedPoints = computed(() => {
        return selectedStudents.value?.reduce((acc, student) => acc + (student.points || 0), 0) || 0;
    });

    const pointsRemaining = computed(() => {
        return (shopCostRef?.value ?? 0) - totalSelectedPoints.value;
    });

    const canAffordShop = computed(() => {
        return totalSelectedPoints.value >= (shopCostRef?.value ?? 0);
    });

    function canAffordPoints(student) {
        return (student.points ?? 0) >= (shopCostRef?.value ?? 0);
    }

    function toggleStudent(student) {
        if (selectedStudents.value?.some((s) => s.id === student.id)) {
            selectedStudents.value = selectedStudents.value.filter((s) => s.id !== student.id);
        } else {
            selectedStudents.value = [...(selectedStudents.value || []), student];
        }
    }

    function setSelection(students) {
        selectedStudents.value = Array.isArray(students) ? [...students] : [];
    }

    function clearSelection() {
        selectedStudents.value = [];
    }

    async function checkout(classId, allStudents, updateClass, purchaseOptions = {}) {
        const selected = Array.isArray(selectedStudents.value) ? selectedStudents.value : [];
        if (!selected.length) return;

        const totalCost = Number(shopCostRef?.value ?? 0) || 0;
        const { selectedShopItemIds, purchaseItemsApi, onPurchaseSuccess } = purchaseOptions;
        const useApi = selectedShopItemIds?.length > 0 && typeof purchaseItemsApi === 'function';

        if (useApi) {
            try {
                const studentIds = selected.map(s => s.id);
                const res = await purchaseItemsApi(classId, studentIds, selectedShopItemIds);
                selectedStudents.value = [];
                onPurchaseSuccess?.(res.students);
                toast.success('Purchase completed', {
                    description: `Deducted ${formatCost(res.totalCost ?? totalCost)} from selected students`,
                    duration: 3000,
                });
            } catch (err) {
                console.error('Failed to checkout', err);
                const msg = err.response?.data?.message || 'Checkout failed';
                toast.error(msg);
            }
            return;
        }

        if (totalCost <= 0) {
            toast.error('No items selected. Select shop items above.');
            return;
        }

        const sorted = [...selected].sort((a, b) => (a.points ?? 0) - (b.points ?? 0));
        let remaining = totalCost;
        const deductions = new Map();

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

        const updated = (allStudents || []).map((s) => {
            const deduct = deductions.get(s.id);
            if (deduct !== undefined) {
                return { ...s, points: (s.points ?? 0) - deduct };
            }
            return { ...s };
        });

        try {
            await updateClass(classId, { students: updated });
            selectedStudents.value = [];
            toast.success('Purchase completed', {
                description: `Deducted ${formatCost(totalCost)} from selected students (least points first)`,
                duration: 3000,
            });
        } catch (err) {
            console.error('Failed to checkout', err);
            toast.error('Checkout failed');
        }
    }

    return {
        selectedStudents,
        totalSelectedPoints,
        pointsRemaining,
        canAffordShop,
        canAffordPoints,
        toggleStudent,
        setSelection,
        clearSelection,
        checkout,
    };
}
