import Server from '../services/server';

const TIERS = [
    { name: 'Copper', icon: '🟤', divisions: 5 },
    { name: 'Bronze', icon: '🟠', divisions: 5 },
    { name: 'Silver', icon: '⚪', divisions: 5 },
    { name: 'Gold', icon: '🌕', divisions: 5 },
    { name: 'Platinum', icon: '🔷', divisions: 5 },
    { name: 'Diamond', icon: '💎', divisions: 5 },
    { name: 'Master', icon: '🔮', divisions: 5 },
    { name: 'LEGEND', icon: '👑', divisions: 5 },
];

/**
 * Map experience number to rank display (icon + name).
 * Each rank is 100 XP wide, 5 divisions per tier.
 * @param {number} experience
 * @returns {{ icon: string, name: string }}
 */
export function experienceToRank(experience) {
    const rankIndex = Math.min(Math.floor(experience / 100), 39); // clamp to rank 40 max
    const tierIndex = Math.floor(rankIndex / 3);
    const division = TIERS[tierIndex].divisions - (rankIndex % TIERS[tierIndex].divisions); // counts down: 3, 2, 1
    return {
        icon: TIERS[tierIndex].icon,
        name: `${TIERS[tierIndex].name} ${division}`,
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
