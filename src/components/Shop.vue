<template>
    <div v-if="!shopItemsList.length && !shopItemsLoading" class="emptyShop">
        No shop items available. Create some some in the actions menu below.
        <v-icon size="100"
            style="text-align: center; font-family: var(--font); font-size: 1.5rem;">mdi-arrow-down</v-icon>
    </div>
    <div v-else class="shopGrid">
        <button v-for="item in shopItemsList" :key="getItemId(item)" type="button" class="shopItemCard"
            :class="{ selected: selectedIds.has(getItemId(item)), outOfStock: isOutOfStock(item) }"
            :disabled="isOutOfStock(item)"
            @click="toggleSelect(item)"
            @contextmenu.prevent="emit('item-context-menu', $event, item)">
            <span class="shopItemName">{{ item.name }}</span>
            <span class="shopItemCost">{{ formatCost(item.cost) }}</span>
            <span v-if="isOutOfStock(item)" class="shopItemStock outOfStockLabel">Out of stock</span>
            <span v-else-if="item.stock != null && item.remainingStock != null" class="shopItemStock">{{ item.remainingStock }} left</span>
        </button>
    </div>
    <div v-if="selectedIds.size > 0" class="selectedSummary">
        <span class="selectedCount">{{ selectedIds.size }} selected ({{ formatCost(calcCost(selectedIds)) }})</span>
        <button type="button" class="clearSelectionBtn" @click="clearSelection">
            Clear selection
        </button>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const selectedIds = ref(new Set());

const props = defineProps({
    shopItems: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['cost-updated', 'selection-updated', 'item-context-menu']);

const shopItemsList = computed(() => props.shopItems);

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

function getItemId(item) {
    if (item._id != null) return typeof item._id === 'string' ? item._id : String(item._id);
    if (item.id != null) return String(item.id);
    return String(item.name ?? '');
}

function isOutOfStock(item) {
    if (item.stock == null) return false;
    const remaining = item.remainingStock;
    if (remaining !== undefined && remaining !== null) return remaining <= 0;
    const purchased = item.purchasedCount;
    return (purchased ?? 0) >= (item.stock ?? 0);
}

function emitSelection(cost, ids) {
    emit('cost-updated', cost);
    const idList = ids ? [...ids] : [...selectedIds.value];
    const selectedItemIds = idList.map(id => typeof id === 'string' ? id : String(id));
    const selectedItems = selectedItemIds.map(id => shopItemsList.value.find(i => getItemId(i) === id)).filter(Boolean);
    emit('selection-updated', { cost: Number(cost), selectedItemIds, selectedItems });
}

function toggleSelect(item) {
    if (isOutOfStock(item)) return;
    const key = getItemId(item);
    const next = new Set(selectedIds.value);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    selectedIds.value = next;
    const cost = calcCost(next);
    emitSelection(cost, next);
}

function clearSelection() {
    selectedIds.value = new Set();
    emitSelection(0, new Set());
}

function calcCost(selectedIdSet) {
    let cost = 0;
    for (const id of selectedIdSet) {
        const sid = typeof id === 'string' ? id : String(id);
        const item = shopItemsList.value.find(i => getItemId(i) === sid);
        if (item) cost += Number(item.cost) || 0;
    }
    return Number(cost);
}

// async function loadClass() {
//     try {
//         const res = await getClassById(id.value);
//         classData.value = res.class;
//     } catch (err) {
//         console.error('Error loading class:', err);
//         loadError.value = 'Could not load class.';
//     }
// }

// async function loadShopItems() {
//     shopItemsLoading.value = true;
//     try {
//         const res = await getShopItems();
//         shopItems.value = res.shopItems ?? [];
//     } catch (err) {
//         console.error('Error loading shop items:', err);
//         shopItems.value = [];
//     } finally {
//         shopItemsLoading.value = false;
//     }
// }

// onMounted(() => {
//     loadClass();
//     loadShopItems();
// });
</script>

<style scoped>
@import '../styles/style.css';

.shopPageContainer {
    justify-content: flex-start !important;
    padding-top: 1rem;
    padding-bottom: 2rem;
}

.pageTitle {
    font-family: var(--font);
    font-weight: 600;
    font-size: 2rem;
    color: var(--white);
    margin-bottom: 1.5rem;
    text-align: center;
}

.loadingText,
.errorText {
    font-family: var(--font);
    color: var(--white);
    opacity: 0.9;
}

.errorText {
    color: var(--intenseCherry);
}

.emptyShop {
    font-family: var(--font);
    color: var(--white);
    opacity: 0.8;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem 0.75rem;
    min-height: 120px;
}

.shopGrid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 0 0.75rem;
    min-width: 0;
    box-sizing: border-box;
}

@media (min-width: 400px) {
    .shopGrid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.75rem;
    }
}

@media (min-width: 768px) {
    .shopGrid {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1rem;
        padding: 0;
    }
}

@media (min-width: 1024px) {
    .shopGrid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
}

.shopItemCard {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.75rem 0.6rem;
    min-height: 44px;
    min-width: 0;
    -webkit-tap-highlight-color: transparent;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: linear-gradient(135deg,
            rgba(0, 23, 31, 0.5) 0%,
            rgba(0, 23, 31, 0.35) 50%,
            rgba(0, 23, 31, 0.45) 100%);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: var(--white);
    font-family: var(--font);
    cursor: pointer;
    transition:
        transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.25s ease,
        border-color 0.2s ease,
        background 0.2s ease;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        0 4px 16px rgba(0, 0, 0, 0.15);
}

@media (min-width: 768px) {
    .shopItemCard {
        gap: 0.5rem;
        padding: 1.25rem 1rem;
    }
}

@media (hover: hover) {
    .shopItemCard:hover {
        transform: scale(1.02) translateY(-2px);
        border-color: rgba(255, 255, 255, 0.3);
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            0 8px 24px rgba(0, 168, 232, 0.2);
    }
}

.shopItemCard.selected {
    border-color: var(--seaGreen);
    background: linear-gradient(135deg,
            rgba(26, 147, 111, 0.4) 0%,
            rgba(26, 147, 111, 0.25) 50%,
            rgba(26, 147, 111, 0.35) 100%);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 0 0 2px rgba(26, 147, 111, 0.5),
        0 6px 20px rgba(26, 147, 111, 0.25);
}

.shopItemName {
    font-size: 0.95rem;
    font-weight: 600;
    text-align: center;
    word-break: break-word;
    line-height: 1.2;
}

@media (min-width: 768px) {
    .shopItemName {
        font-size: 1.1rem;
    }
}

.shopItemCost {
    font-size: 0.85rem;
    opacity: 0.9;
    color: var(--freshSky);
}

@media (min-width: 768px) {
    .shopItemCost {
        font-size: 0.95rem;
    }
}

.shopItemCard.selected .shopItemCost {
    color: var(--white);
}

.shopItemCard.outOfStock {
    opacity: 0.7;
    cursor: not-allowed;
}

.shopItemCard.outOfStock:hover {
    transform: none;
}

.shopItemStock {
    font-size: 0.8rem;
    opacity: 0.9;
    color: var(--freshSky);
}

.shopItemStock.outOfStockLabel {
    color: var(--intenseCherry);
    font-weight: 500;
}

.selectedSummary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5rem 0.75rem;
    margin-top: 1rem;
    padding: 0.6rem 0.75rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    margin-left: 0.75rem;
    margin-right: 0.75rem;
}

@media (min-width: 768px) {
    .selectedSummary {
        margin-left: 0;
        margin-right: 0;
        margin-top: 1.5rem;
        padding: 0.75rem 1rem;
        gap: 1rem;
    }
}

.selectedCount {
    font-family: var(--font);
    font-size: 0.9rem;
    color: var(--white);
}

@media (min-width: 768px) {
    .selectedCount {
        font-size: 0.95rem;
    }
}

.clearSelectionBtn {
    padding: 0.5rem 0.85rem;
    min-height: 44px;
    font-family: var(--font);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--white);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease;
    -webkit-tap-highlight-color: transparent;
}

@media (hover: hover) {
    .clearSelectionBtn:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
    }
}
</style>
