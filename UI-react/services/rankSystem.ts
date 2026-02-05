import { getRankProgress } from '../constants/ranks';

export function calculateRankProgress(experience: number) {
  return getRankProgress(experience);
}
