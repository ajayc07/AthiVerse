import type { Profile, MilestoneReward, RewardType } from '@/types'

export const MILESTONES: MilestoneReward[] = [
  { stars: 1,   type: 'star',        label: 'First Star!' },
  { stars: 5,   type: 'sticker',     label: 'Hero Sticker!' },
  { stars: 20,  type: 'background',  label: 'Space Background!' },
  { stars: 50,  type: 'celebration', label: 'Character Celebration!' },
  { stars: 100, type: 'certificate', label: 'Hero Certificate!' }
]

export interface RewardCheck {
  newMilestones: MilestoneReward[]
  totalStarsAfter: number
}

/** Check which milestones were crossed when adding stars */
export function checkRewards(profile: Profile, starsToAdd: number): RewardCheck {
  const before = profile.totalStars
  const after = before + starsToAdd

  const newMilestones = MILESTONES.filter(
    m => m.stars > before && m.stars <= after
  )

  return { newMilestones, totalStarsAfter: after }
}

/** Stars earned in a session: 1 per correct answer */
export function calculateSessionStars(correct: number): number {
  return correct
}

/** Bonus stars for perfect session (all correct) */
export function calculateBonusStars(correct: number, total: number): number {
  if (total === 0) return 0
  if (correct === total) return Math.floor(total * 0.5) // 50% bonus
  if (correct / total >= 0.8) return 1                   // 80%+ gets 1 bonus
  return 0
}

/** Get the celebration type based on streak */
export function getCelebrationLevel(streak: number): 'small' | 'medium' | 'big' {
  if (streak >= 10) return 'big'
  if (streak >= 5)  return 'medium'
  return 'small'
}
