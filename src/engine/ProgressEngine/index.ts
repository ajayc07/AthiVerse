import type { Profile, DailyMission, Pillar } from '@/types'
import { uid, todayISO, pickRandom } from '@/utils/helpers'

// One uniform semantic — "N correct answers in pillar X" — so a single hook
// in profileStore.recordAnswer can advance every mission type.
const MISSION_TEMPLATES: Array<{ label: string; description: string; pillar: Pillar | 'any'; target: number }> = [
  { label: 'Number Ninja', description: 'Get 3 number answers right',   pillar: 'numbers',   target: 3 },
  { label: 'Letter Hunt',  description: 'Get 3 letter answers right',   pillar: 'alphabets', target: 3 },
  { label: 'Color Hero',   description: 'Get 3 color answers right',    pillar: 'colors',    target: 3 },
  { label: 'Memory Pro',   description: 'Get 3 memory answers right',   pillar: 'memory',    target: 3 },
  { label: 'Logic Star',   description: 'Get 3 logic answers right',    pillar: 'logic',     target: 3 },
  { label: 'Hero Day',     description: 'Get 8 answers right anywhere', pillar: 'any',       target: 8 }
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

export interface MissionProgressResult {
  missions: DailyMission[]
  newlyCompleted: DailyMission[]
}

/** Advance today's missions matching a pillar after a correct answer */
export function applyMissionProgress(
  missions: DailyMission[],
  pillar: Pillar
): MissionProgressResult {
  const today = todayISO()
  const newlyCompleted: DailyMission[] = []

  const updated = missions.map(m => {
    if (m.completed || m.date !== today) return m
    if (m.pillar !== pillar && m.pillar !== 'any') return m
    const progress = m.progress + 1
    const completed = progress >= m.target
    const next = { ...m, progress, completed }
    if (completed) newlyCompleted.push(next)
    return next
  })

  return { missions: updated, newlyCompleted }
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
