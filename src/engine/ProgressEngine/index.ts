import type { Profile, DailyMission, Pillar } from '@/types'
import { uid, todayISO, pickRandom } from '@/utils/helpers'

const MISSION_TEMPLATES: Array<{ label: string; description: string; pillar: Pillar; target: number }> = [
  { label: 'Count to 15', description: 'Answer 3 counting questions correctly', pillar: 'numbers',   target: 3 },
  { label: 'Letter Hunt', description: 'Match 5 letters correctly',            pillar: 'alphabets', target: 5 },
  { label: 'Color Hero',  description: 'Sort 4 heroes by color',               pillar: 'colors',    target: 4 },
  { label: 'Memory Pro',  description: 'Complete 3 memory games',              pillar: 'memory',    target: 3 },
  { label: 'Logic Star',  description: 'Solve 3 logic puzzles',                pillar: 'logic',     target: 3 },
  { label: 'Find 5 Red',  description: 'Find 5 red-colored heroes',            pillar: 'colors',    target: 5 },
  { label: 'Streak Hero', description: 'Get 5 correct answers in a row',       pillar: 'logic',     target: 5 }
]

/** Generate daily missions for today */
export function generateDailyMissions(count = 3): DailyMission[] {
  const templates = pickRandom(MISSION_TEMPLATES, count)
  const today = todayISO()

  return templates.map(t => ({
    id: uid(),
    label: t.label,
    description: t.description,
    pillar: t.pillar,
    target: t.target,
    progress: 0,
    completed: false,
    date: today
  }))
}

/** Refresh missions if they're from a previous day */
export function refreshMissionsIfNeeded(profile: Profile): DailyMission[] {
  const today = todayISO()
  const hasTodayMissions = profile.dailyMissions.some(m => m.date === today)

  if (hasTodayMissions) return profile.dailyMissions
  return generateDailyMissions(3)
}

/** Universe completion percentage */
export function getUniverseProgress(
  profile: Profile,
  universe: string,
  totalCharacters: number
): number {
  if (totalCharacters === 0) return 0
  // We track mastery through skill nodes — derive progress from sessions
  // Simple proxy: stars earned / expected stars
  const expectedStars = totalCharacters * 5
  const proxy = Math.min(100, Math.round((profile.totalStars / Math.max(expectedStars, 1)) * 100))
  return proxy
}

/** Pillar progress 0-100 */
export function getPillarProgress(profile: Profile, pillar: Pillar): number {
  const nodes = Object.values(profile.skillNodes).filter(n => n.pillar === pillar)
  if (nodes.length === 0) return 0
  const total = nodes.reduce((sum, n) => sum + n.masteryScore, 0)
  return Math.round(total / nodes.length)
}
