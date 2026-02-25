import Server from '../services/server';

const EXPERIENCE_ICONS = {
    rank1: '🥉',
    rank2: '🥈',
    rank3: '🥇',
    rank4: '💜',
    rank5: '💎',
    rank6: '👑',
};

const EXPERIENCE_NAMES = {
    rank1: 'Beginner',
    rank2: 'Novice',
    rank3: 'Apprentice',
    rank4: 'Expert',
    rank5: 'Master',
    rank6: 'Grandmaster',
};

/**
 * Map experience number to rank display (icon + name).
 * @param {number} experience
 * @returns {{ icon: string, name: string }}
 */
export function experienceToRank(experience) {
    if (experience >= 0 && experience < 100) {
        return { icon: EXPERIENCE_ICONS.rank1, name: EXPERIENCE_NAMES.rank1 };
    }
    if (experience >= 100 && experience < 200) {
        return { icon: EXPERIENCE_ICONS.rank2, name: EXPERIENCE_NAMES.rank2 };
    }
    if (experience >= 200 && experience < 300) {
        return { icon: EXPERIENCE_ICONS.rank3, name: EXPERIENCE_NAMES.rank3 };
    }
    if (experience >= 300 && experience < 400) {
        return { icon: EXPERIENCE_ICONS.rank4, name: EXPERIENCE_NAMES.rank4 };
    }
    if (experience >= 400 && experience < 500) {
        return { icon: EXPERIENCE_ICONS.rank5, name: EXPERIENCE_NAMES.rank5 };
    }
    if (experience >= 500) {
        return { icon: EXPERIENCE_ICONS.rank6, name: EXPERIENCE_NAMES.rank6 };
    }
    return { icon: EXPERIENCE_ICONS.rank1, name: EXPERIENCE_NAMES.rank1 };
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
