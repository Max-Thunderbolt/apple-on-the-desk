<template>
    <v-dialog
        :model-value="modelValue"
        max-width="440"
        transition="dialog-transition"
        class="purchaseHistoryDialog"
        @update:model-value="onDialogUpdate"
        @click:outside="close"
    >
        <v-card class="purchaseHistoryCard">
            <v-card-title class="purchaseHistoryTitle">Receipts</v-card-title>
            <v-card-subtitle class="purchaseHistorySubtitle">
                Past shop purchases for this class
            </v-card-subtitle>
            <v-card-text class="purchaseHistoryBody">
                <div v-if="loading" class="purchaseHistoryStatus">Loading…</div>
                <div v-else-if="purchases.length === 0" class="purchaseHistoryStatus">
                    No purchases yet
                </div>
                <button
                    v-for="purchase in purchases"
                    :key="purchase.id"
                    type="button"
                    class="purchaseHistoryRow"
                    @click="emit('select', purchase)"
                >
                    <div class="purchaseHistoryRowMain">
                        <span class="purchaseHistoryItem">{{ purchase.itemName || 'Unknown' }}</span>
                        <span class="purchaseHistoryCost">{{ formatCost(purchase.itemCost) }}</span>
                    </div>
                    <div class="purchaseHistoryRowMeta">
                        <span class="purchaseHistoryDate">{{ formatDate(purchase.createdAt) }}</span>
                        <span class="purchaseHistoryPayers">{{ payerSummary(purchase) }}</span>
                    </div>
                </button>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" class="purchaseHistoryClose" @click="close">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { useFormat } from '@/composables/useFormat';

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    purchases: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'select']);

const { formatCost } = useFormat();

function onDialogUpdate(open) {
    emit('update:modelValue', open);
}

function close() {
    emit('update:modelValue', false);
}

function formatDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function payerSummary(purchase) {
    const list = Array.isArray(purchase?.studentContribution) ? purchase.studentContribution : [];
    if (list.length === 0) return 'No payers';
    const names = list.map((c) => c.name || 'Unknown').filter(Boolean);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}
</script>

<style scoped>
.purchaseHistoryCard {
    background-color: var(--inkBlack);
    border-radius: 25px;
    border: 1px solid var(--white);
    padding: 0 0 0.5rem;
}

.purchaseHistoryTitle {
    font-family: var(--font);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--white);
    text-align: center;
    padding: 0.75rem 0 0.25rem;
}

.purchaseHistorySubtitle {
    font-family: var(--font);
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--white);
    opacity: 0.75;
    text-align: center;
    padding: 0 1rem 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.35);
    opacity: 0.8;
}

.purchaseHistoryBody {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    padding-top: 0.75rem;
    max-height: min(60vh, 420px);
    overflow-y: auto;
}

.purchaseHistoryStatus {
    font-family: var(--font);
    text-align: center;
    color: var(--white);
    opacity: 0.65;
    padding: 1.25rem 0.5rem;
}

.purchaseHistoryRow {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
    text-align: left;
    padding: 0.7rem 0.85rem;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(255, 255, 255, 0.04);
    color: var(--white);
    font-family: var(--font);
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
}

.purchaseHistoryRow:hover {
    border-color: rgba(var(--seaGreen-rgb), 0.55);
    background: rgba(var(--seaGreen-rgb), 0.1);
}

.purchaseHistoryRowMain {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
}

.purchaseHistoryItem {
    font-size: 1rem;
    font-weight: 600;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.purchaseHistoryCost {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--freshSky);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
}

.purchaseHistoryRowMeta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.8rem;
    opacity: 0.7;
}

.purchaseHistoryDate {
    font-variant-numeric: tabular-nums;
}

.purchaseHistoryPayers {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: right;
}

.purchaseHistoryClose {
    font-family: var(--font) !important;
    color: var(--white) !important;
}
</style>
