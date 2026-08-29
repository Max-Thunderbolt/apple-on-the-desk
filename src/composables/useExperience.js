import Server from '../services/server';

const DIVISIONS_PER_TIER = 3;

const TIER_NAMES = [
    'Copper',
    'Bronze',
    'Silver',
    'Gold',
    'Platinum',
    'Diamond',
    'Master',
    'LEGEND',
];

/** Full artboard size of AppleOnTheDesk_Ranks.svg */
export const RANK_SVG_W = 1920;
export const RANK_SVG_H = 1080;

/**
 * Uniform display cell for RankBadge. Crops are letterboxed into this so every
 * rank renders at the same outer size (Copper has no side wings; higher tiers do).
 */
export const RANK_BADGE_DISPLAY_W = 68;
export const RANK_BADGE_DISPLAY_H = 112;

/**
 * Crop regions (x y w h) in SVG user units for each badge.
 * Rows = tiers (Copper → LEGEND), columns = divisions 1, 2, 3 (left → right).
 * Sized to include the tier nameplate without bleeding into the next row.
 */
const BADGE_VIEWBOXES = [
    [
        [72, 66, 56, 96],
        [140, 66, 56, 96],
        [209, 66, 56, 96],
    ],
    [
        [73, 164, 56, 96],
        [141, 164, 56, 96],
        [210, 164, 56, 96],
    ],
    [
        [73, 260, 56, 96],
        [141, 260, 56, 96],
        [210, 260, 56, 96],
    ],
    [
        [73, 356, 56, 96],
        [141, 356, 56, 96],
        [210, 356, 56, 96],
    ],
    [
        [71, 452, 58, 96],
        [139, 452, 58, 96],
        [208, 452, 58, 96],
    ],
    [
        [69, 548, 64, 96],
        [137, 548, 64, 96],
        [205, 548, 64, 96],
    ],
    [
        [68, 644, 65, 96],
        [136, 644, 65, 96],
        [205, 644, 65, 96],
    ],
    [
        [66, 740, 69, 92],
        [134, 740, 69, 100],
        [203, 740, 67, 92],
    ],
];

export const MAX_RANK_INDEX = TIER_NAMES.length * DIVISIONS_PER_TIER - 1;

export const XP_PER_RANK = 100;

export function rankIndexFromExperience(experience) {
    return Math.min(Math.floor(experience / XP_PER_RANK), MAX_RANK_INDEX);
}

/**
 * Map rank index → SVG crop rect for AppleOnTheDesk_Ranks.svg.
 * Progression within a tier is division 3 → 2 → 1.
 * @param {number} rankIndex
 * @returns {{ x: number, y: number, w: number, h: number }}
 */
export function rankIndexToBadgeViewBox(rankIndex) {
    const clamped = Math.min(Math.max(rankIndex, 0), MAX_RANK_INDEX);
    const tierIndex = Math.floor(clamped / DIVISIONS_PER_TIER);
    const division = DIVISIONS_PER_TIER - (clamped % DIVISIONS_PER_TIER); // 3, 2, 1
    const [x, y, w, h] = BADGE_VIEWBOXES[tierIndex][division - 1];
    return { x, y, w, h };
}

/**
 * Map experience number to rank display.
 * Each rank is 100 XP wide, 3 divisions per tier (24 ranks total).
 * @param {number} experience
 * @returns {{ rankIndex: number, name: string, viewBox: { x: number, y: number, w: number, h: number } }}
 */
export function experienceToRank(experience) {
    const rankIndex = rankIndexFromExperience(experience);
    const tierIndex = Math.floor(rankIndex / DIVISIONS_PER_TIER);
    const division = DIVISIONS_PER_TIER - (rankIndex % DIVISIONS_PER_TIER);
    return {
        rankIndex,
        viewBox: rankIndexToBadgeViewBox(rankIndex),
        name: `${TIER_NAMES[tierIndex]} ${division}`,
    };
}

/**
 * Rank progress for display (progress bar, XP to next rank).
 * @param {number} experience
 */
export function rankProgressFromExperience(experience) {
    const exp = Number(experience ?? 0);
    const currentRank = experienceToRank(exp);
    const currentRankIndex = rankIndexFromExperience(exp);
    const isMaxRank = currentRankIndex >= MAX_RANK_INDEX;

    if (isMaxRank) {
        return {
            currentRank,
            nextRank: { ...currentRank, experience: exp },
            progressPercent: 100,
            xpToNext: 0,
            isMaxRank: true,
        };
    }

    const nextRankIndex = currentRankIndex + 1;
    const rankStartXp = currentRankIndex * XP_PER_RANK;
    const nextRankXp = nextRankIndex * XP_PER_RANK;
    const expInCurrentRank = exp - rankStartXp;
    const expNeededForNextRank = nextRankXp - rankStartXp;
    const progressPercent = Math.min(100, Math.floor((expInCurrentRank / expNeededForNextRank) * 100));

    return {
        currentRank,
        nextRank: {
            ...experienceToRank(nextRankXp),
            experience: nextRankXp,
        },
        progressPercent,
        xpToNext: nextRankXp - exp,
        isMaxRank: false,
    };
}

/**
 * Fetch experience for a class by id.
 * @param {string} classId
 * @returns {Promise<number>}
 */
export async function getExperience(classId) {
    try {
        const response = await Server.getClassById(classId);
        return response.class?.experience ?? 0;
    } catch (error) {
        console.error('Error getting experience:', error);
        return 0;
    }
}

/**
 * Composable for experience/rank logic. Use when you need getExperience with reactive classId.
 * For pure experienceToRank(exp), import the function directly.
 */
export function useExperience(classIdRef) {
    async function fetchExperience(id) {
        return getExperience(id ?? (classIdRef && typeof classIdRef === 'object' && 'value' in classIdRef ? classIdRef.value : classIdRef));
    }

    return {
        experienceToRank,
        getExperience: fetchExperience,
    };
}
