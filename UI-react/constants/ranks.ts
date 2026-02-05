import { Rank } from '../types';
import { seaGreen, intenseCherry, freshSky } from './colors';

export const ranks: Rank[] = [
  { name: 'Beginner', minExperience: 0, color: seaGreen, icon: '🥉' },
  { name: 'Novice', minExperience: 100, color: freshSky, icon: '🥈' },
  { name: 'Apprentice', minExperience: 250, color: seaGreen, icon: '🥇' },
  { name: 'Expert', minExperience: 500, color: intenseCherry, icon: '💜' },
  { name: 'Master', minExperience: 1000, color: freshSky, icon: '💎' },
  { name: 'Grandmaster', minExperience: 2000, color: intenseCherry, icon: '👑' },
];

export function getRankForExperience(experience: number): Rank {
  let currentRank = ranks[0];
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (experience >= ranks[i].minExperience) {
      currentRank = ranks[i];
      break;
    }
  }
  return currentRank;
}

export function getNextRank(currentRank: Rank): Rank | null {
  const currentIndex = ranks.findIndex(r => r.name === currentRank.name);
  if (currentIndex < ranks.length - 1) {
    return ranks[currentIndex + 1];
  }
  return null;
}

export function getRankProgress(experience: number): {
  currentRank: Rank;
  nextRank: Rank | null;
  progress: number;
} {
  const currentRank = getRankForExperience(experience);
  const nextRank = getNextRank(currentRank);
  
  let progress = 0;
  if (nextRank) {
    const currentRange = nextRank.minExperience - currentRank.minExperience;
    const progressInRange = experience - currentRank.minExperience;
    progress = Math.min(1, Math.max(0, progressInRange / currentRange));
  } else {
    progress = 1; // Max rank achieved
  }
  
  return {
    currentRank,
    nextRank,
    progress,
  };
}
