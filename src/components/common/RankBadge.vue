<template>
    <span
        class="rank-badge"
        :class="badgeClass"
        role="img"
        :aria-label="ariaLabel"
        :style="frameStyle"
    >
        <img
            class="rank-badge__sheet"
            :src="ranksSvg"
            alt=""
            draggable="false"
            :style="sheetStyle"
        >
    </span>
</template>

<script setup>
import { computed } from 'vue';
import ranksSvg from '@/assets/AppleOnTheDesk_Ranks.svg';
import {
    RANK_SVG_W,
    RANK_SVG_H,
    RANK_BADGE_DISPLAY_W,
    RANK_BADGE_DISPLAY_H,
    rankIndexToBadgeViewBox,
} from '@/composables/useExperience';

const props = defineProps({
    rankIndex: { type: Number, required: true },
    ariaLabel: { type: String, default: 'Class rank badge' },
    badgeClass: { type: String, default: '' },
});

const viewBox = computed(() => rankIndexToBadgeViewBox(props.rankIndex));

/** Same outer box for every rank; crop is contained and centered inside. */
const frameStyle = computed(() => ({
    aspectRatio: `${RANK_BADGE_DISPLAY_W} / ${RANK_BADGE_DISPLAY_H}`,
}));

const sheetStyle = computed(() => {
    const { x, y, w, h } = viewBox.value;
    const scale = Math.min(RANK_BADGE_DISPLAY_W / w, RANK_BADGE_DISPLAY_H / h);
    const offsetX = (RANK_BADGE_DISPLAY_W - w * scale) / 2;
    const offsetY = (RANK_BADGE_DISPLAY_H - h * scale) / 2;
    return {
        width: `${((RANK_SVG_W * scale) / RANK_BADGE_DISPLAY_W) * 100}%`,
        height: `${((RANK_SVG_H * scale) / RANK_BADGE_DISPLAY_H) * 100}%`,
        left: `${((offsetX - x * scale) / RANK_BADGE_DISPLAY_W) * 100}%`,
        top: `${((offsetY - y * scale) / RANK_BADGE_DISPLAY_H) * 100}%`,
    };
});
</script>

<style scoped>
.rank-badge {
    position: relative;
    display: block;
    overflow: hidden;
    width: 100%;
    height: auto;
}

.rank-badge__sheet {
    position: absolute;
    max-width: none;
    pointer-events: none;
    user-select: none;
}
</style>
