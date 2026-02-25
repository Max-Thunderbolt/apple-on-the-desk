/**
 * Formatting utilities (points, cost, etc.). Use in components that display
 * point values or costs.
 */
export function useFormat() {
    function formatCost(cost) {
        const n = Number(cost);
        if (Number.isNaN(n)) return String(cost ?? '—');
        if (n % 1 === 0) {
            return `${n.toLocaleString(undefined, { locale: 'en-ZA' })} pts`;
        }
        return `${n.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
            useGrouping: true,
            locale: 'en-ZA',
        })} pts`;
    }

    return { formatCost };
}
