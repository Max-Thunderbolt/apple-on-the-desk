<template>
    <v-dialog
        :model-value="modelValue"
        max-width="360"
        transition="dialog-transition"
        class="purchaseReceiptDialog"
        @update:model-value="onDialogUpdate"
        @click:outside="close"
    >
        <div v-if="current" class="receiptSlipWrap">
            <div class="receiptSlip">
                <div class="receiptPerforation receiptPerforation--top" aria-hidden="true" />

                <header class="receiptHeader">
                    <p class="receiptBrand">{{ className || 'Class shop' }}</p>
                    <h2 class="receiptTitle">Receipt</h2>
                    <p class="receiptId">#{{ shortId }}</p>
                    <p class="receiptDate">{{ formattedDate }}</p>
                </header>

                <div class="receiptRule" aria-hidden="true" />

                <section class="receiptSection">
                    <div class="receiptRow">
                        <span class="receiptLabel">Item</span>
                        <span class="receiptValue">{{ current.itemName || 'Unknown' }}</span>
                    </div>
                    <div class="receiptRow">
                        <span class="receiptLabel">Cost</span>
                        <span class="receiptValue receiptValue--accent">{{ formatCost(current.itemCost) }}</span>
                    </div>
                </section>

                <div class="receiptRule" aria-hidden="true" />

                <section class="receiptSection">
                    <p class="receiptSectionTitle">Paid by</p>
                    <div
                        v-for="(c, idx) in contributors"
                        :key="`${c.studentId || c.name}-${idx}`"
                        class="receiptRow"
                    >
                        <span class="receiptLabel">{{ c.name || 'Unknown' }}</span>
                        <span class="receiptValue">{{ formatCost(c.contributed) }}</span>
                    </div>
                    <p v-if="contributors.length === 0" class="receiptEmpty">No contributors recorded</p>
                </section>

                <div class="receiptRule receiptRule--double" aria-hidden="true" />

                <section class="receiptSection receiptSection--totals">
                    <div class="receiptRow">
                        <span class="receiptLabel">Payers</span>
                        <span class="receiptValue">{{ contributors.length }}</span>
                    </div>
                    <div class="receiptRow receiptRow--total">
                        <span class="receiptLabel">Total</span>
                        <span class="receiptValue receiptValue--total">{{ formatCost(current.itemCost) }}</span>
                    </div>
                </section>

                <p class="receiptThanks">Thank you</p>

                <div class="receiptPerforation receiptPerforation--bottom" aria-hidden="true" />
            </div>

            <div v-if="receipts.length > 1" class="receiptPager">
                <button
                    type="button"
                    class="receiptPagerBtn"
                    :disabled="index <= 0"
                    aria-label="Previous receipt"
                    @click="index = Math.max(0, index - 1)"
                >
                    <v-icon size="18">mdi-chevron-left</v-icon>
                </button>
                <span class="receiptPagerLabel">{{ index + 1 }} of {{ receipts.length }}</span>
                <button
                    type="button"
                    class="receiptPagerBtn"
                    :disabled="index >= receipts.length - 1"
                    aria-label="Next receipt"
                    @click="index = Math.min(receipts.length - 1, index + 1)"
                >
                    <v-icon size="18">mdi-chevron-right</v-icon>
                </button>
            </div>

            <button type="button" class="receiptCloseBtn" @click="close">Close</button>
        </div>
    </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useFormat } from '@/composables/useFormat';

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    receipts: { type: Array, default: () => [] },
    className: { type: String, default: '' },
    initialIndex: { type: Number, default: 0 },
});

const emit = defineEmits(['update:modelValue']);

const { formatCost } = useFormat();
const index = ref(0);

watch(
    () => [props.modelValue, props.receipts, props.initialIndex],
    () => {
        if (props.modelValue) {
            const max = Math.max(0, (props.receipts?.length || 1) - 1);
            index.value = Math.min(Math.max(0, props.initialIndex || 0), max);
        }
    },
    { immediate: true },
);

const current = computed(() => props.receipts?.[index.value] || null);

const shortId = computed(() => {
    const id = current.value?.id || '';
    return id.slice(-6).toUpperCase() || '------';
});

const formattedDate = computed(() => {
    const ts = current.value?.createdAt;
    if (!ts) return '—';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
});

const contributors = computed(() => {
    const list = current.value?.studentContribution;
    return Array.isArray(list) ? list : [];
});

function onDialogUpdate(open) {
    emit('update:modelValue', open);
}

function close() {
    emit('update:modelValue', false);
}
</script>

<style scoped>
.receiptSlipWrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
    padding: 0.25rem;
}

.receiptSlip {
    width: 100%;
    max-width: 320px;
    background:
        linear-gradient(180deg, rgba(var(--seaGreen-rgb), 0.08) 0%, transparent 28%),
        linear-gradient(165deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
    background-color: var(--inkBlack);
    border: 1px solid rgba(255, 255, 255, 0.22);
    box-shadow:
        0 12px 40px rgba(0, 0, 0, 0.45),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    padding: 0.35rem 1.1rem 0.85rem;
    font-family: var(--font);
    color: var(--white);
    position: relative;
}

.receiptPerforation {
    height: 10px;
    margin: 0 -0.35rem;
    background-image: radial-gradient(circle at 50% 50%, var(--inkBlack) 3.5px, transparent 3.7px);
    background-size: 12px 10px;
    background-repeat: repeat-x;
    background-position: center;
    opacity: 0.95;
}

.receiptPerforation--top {
    margin-bottom: 0.55rem;
}

.receiptPerforation--bottom {
    margin-top: 0.65rem;
}

.receiptHeader {
    text-align: center;
    padding: 0.15rem 0 0.35rem;
}

.receiptBrand {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--seaGreen);
    opacity: 0.95;
}

.receiptTitle {
    margin: 0.2rem 0 0;
    font-size: 1.45rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.receiptId {
    margin: 0.15rem 0 0;
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    opacity: 0.55;
    font-variant-numeric: tabular-nums;
}

.receiptDate {
    margin: 0.35rem 0 0;
    font-size: 0.85rem;
    opacity: 0.8;
    font-variant-numeric: tabular-nums;
}

.receiptRule {
    border: none;
    border-top: 1px dashed rgba(255, 255, 255, 0.28);
    margin: 0.65rem 0;
}

.receiptRule--double {
    border-top-style: solid;
    border-top-width: 2px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.28);
    height: 4px;
    margin: 0.75rem 0;
}

.receiptSection {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.receiptSectionTitle {
    margin: 0 0 0.15rem;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.55;
}

.receiptRow {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
}

.receiptRow--total {
    margin-top: 0.2rem;
}

.receiptLabel {
    font-size: 0.92rem;
    font-weight: 500;
    opacity: 0.9;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}

.receiptValue {
    font-size: 0.92rem;
    font-weight: 600;
    text-align: right;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
}

.receiptValue--accent {
    color: var(--freshSky);
}

.receiptValue--total {
    color: var(--seaGreen);
    font-size: 1.05rem;
}

.receiptEmpty {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.55;
    text-align: center;
}

.receiptThanks {
    margin: 0.85rem 0 0;
    text-align: center;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--seaGreen);
    opacity: 0.85;
}

.receiptPager {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
}

.receiptPagerBtn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.06);
    color: var(--white);
    cursor: pointer;
}

.receiptPagerBtn:disabled {
    opacity: 0.35;
    cursor: default;
}

.receiptPagerLabel {
    font-family: var(--font);
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
    opacity: 0.8;
    min-width: 4.5rem;
    text-align: center;
}

.receiptCloseBtn {
    font-family: var(--font);
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--white);
    background: transparent;
    border: none;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
    opacity: 0.75;
}

.receiptCloseBtn:hover {
    opacity: 1;
    color: var(--freshSky);
}
</style>
