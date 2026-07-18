import { create } from 'zustand'
import { saveProfile, loadAllProfiles, deleteProfile } from '@/utils/db'
import type { Profile, SkillNodeId, SkillNode, Universe, Achievement } from '@/types'
import skillNodesData from '@/data/skillNodes.json'
import achievementsData from '@/data/achievements.json'
import { uid } from '@/utils/helpers'
import { computeMasteryUpdate } from '@/engine/DifficultyEngine/masteryScore'
import { checkAchievements } from '@/engine/RewardEngine'
import { generateDailyMissions, refreshMissionsIfNeeded, applyMissionProgress } from '@/engine/ProgressEngine'

/** Bonus stars awarded when a daily mission completes */
const MISSION_BONUS_STARS = 2

const DEFAULT_AGE_CONFIG = {
  maxOptionsPerQuestion: 3,
  sessionLengthMinutes: 5,
  minTouchTargetPx: 80,
  maxSequenceMemoryLength: 3,
  autoNarrateInstructions: true,
  showTextWithAudio: true,
  celebrationEvery: 3,
  mistakeTolerance: 2
}

const DEFAULT_PARENT_SETTINGS = {
  maxSessionMinutes: 10,
  soundEnabled: true,
  hapticsEnabled: true,
  difficultyMode: 'adaptive' as const,
  unlockAllUniverses: false,
  allowFreePlay: true
}

function buildDefaultSkillNodes(): Record<SkillNodeId, SkillNode> {
  const nodes: Partial<Record<SkillNodeId, SkillNode>> = {}
  for (const node of skillNodesData) {
    nodes[node.id as SkillNodeId] = node as SkillNode
  }
  return nodes as Record<SkillNodeId, SkillNode>
}

function createDefaultProfile(name: string): Profile {
  return {
    id: uid(),
    name,
    avatar: '🦸',
    createdAt: new Date().toISOString(),
    totalStars: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    currentStreak: 0,
    gamesCompleted: 0,
    favoriteCharacters: ['zenitsu', 'spiderman', 'flash'],
    unlockedUniverses: ['marvel', 'dc', 'demonslayer'],
    unlockedBackgrounds: ['default'],
    unlockedStickers: [],
    achievements: achievementsData as Achievement[],
    skillNodes: buildDefaultSkillNodes(),
    ageConfig: DEFAULT_AGE_CONFIG,
    parentSettings: DEFAULT_PARENT_SETTINGS,
    dailyMissions: [],
    lastSession: null
  }
}

/**
 * Upgrade a stored profile in place so schema additions never break
 * existing IndexedDB data. Every new Profile field MUST get a default here.
 */
function migrateProfile(p: Profile): Profile {
  const storedAchievements = new Map((p.achievements ?? []).map(a => [a.id, a]))
  return {
    ...p,
    gamesCompleted: p.gamesCompleted ?? 0,
    dailyMissions: p.dailyMissions ?? [],
    ageConfig: { ...DEFAULT_AGE_CONFIG, ...p.ageConfig },
    parentSettings: { ...DEFAULT_PARENT_SETTINGS, ...p.parentSettings },
    // Union with the data file so new achievements/nodes appear, preserving earned state
    achievements: (achievementsData as Achievement[]).map(a => storedAchievements.get(a.id) ?? a),
    skillNodes: { ...buildDefaultSkillNodes(), ...p.skillNodes }
  }
}

interface ProfileStore {
  activeProfile: Profile | null
  allProfiles: Profile[]
  loading: boolean
  /** Achievements unlocked since the reward screen last consumed them (not persisted) */
  recentAchievements: Achievement[]

  // Actions
  initProfiles: () => Promise<void>
  setActiveProfile: (profile: Profile) => void
  createProfile: (name: string) => Promise<Profile>
  updateProfile: (updates: Partial<Profile>) => Promise<void>

  // Skill progression
  recordAnswer: (skillNode: SkillNodeId, correct: boolean) => Promise<void>

  // Stars
  addStars: (n: number) => Promise<void>

  // Game + mission lifecycle
  recordGameCompleted: () => Promise<void>
  refreshDailyMissions: () => Promise<void>
  clearRecentAchievements: () => void

  // Favorites
  addFavorite: (characterId: string) => Promise<void>
  removeFavorite: (characterId: string) => Promise<void>

  // Universe unlock
  unlockUniverse: (universe: Universe) => Promise<void>

  // Master reset
  resetProfile: () => Promise<void>
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  activeProfile: null,
  allProfiles: [],
  loading: true,
  recentAchievements: [],

  initProfiles: async () => {
    const stored = await loadAllProfiles()
    if (stored.length === 0) {
      // First launch: create Athiran's profile
      const profile = createDefaultProfile('Athiran')
      profile.dailyMissions = generateDailyMissions()
      await saveProfile(profile)
      set({ activeProfile: profile, allProfiles: [profile], loading: false })
    } else {
      const profiles = stored.map(migrateProfile)
      const active = { ...profiles[0], dailyMissions: refreshMissionsIfNeeded(profiles[0]) }
      profiles[0] = active
      await saveProfile(active)
      set({ activeProfile: active, allProfiles: profiles, loading: false })
    }
  },

  setActiveProfile: (profile) => set({ activeProfile: profile }),

  createProfile: async (name) => {
    const profile = createDefaultProfile(name)
    await saveProfile(profile)
    set(s => ({ allProfiles: [...s.allProfiles, profile] }))
    return profile
  },

  updateProfile: async (updates) => {
    const profile = get().activeProfile
    if (!profile) return
    const updated = { ...profile, ...updates }
    await saveProfile(updated)
    set({ activeProfile: updated })
  },

  recordAnswer: async (skillNodeId, correct) => {
    const profile = get().activeProfile
    if (!profile) return

    const node = profile.skillNodes[skillNodeId]
    if (!node) return

    const { updatedNode, nextNodeId } = computeMasteryUpdate(node, correct, profile.skillNodes)
    const skillNodes: Record<SkillNodeId, SkillNode> = { ...profile.skillNodes, [skillNodeId]: updatedNode }
    if (nextNodeId) {
      skillNodes[nextNodeId] = { ...skillNodes[nextNodeId], unlocked: true }
    }

    let updated: Profile = {
      ...profile,
      skillNodes,
      totalCorrect: correct ? profile.totalCorrect + 1 : profile.totalCorrect,
      totalAttempts: profile.totalAttempts + 1,
      currentStreak: correct ? profile.currentStreak + 1 : 0
    }

    // Correct answers advance today's missions in the node's pillar
    if (correct) {
      const { missions, newlyCompleted } = applyMissionProgress(updated.dailyMissions, updatedNode.pillar)
      updated = {
        ...updated,
        dailyMissions: missions,
        totalStars: updated.totalStars + newlyCompleted.length * MISSION_BONUS_STARS
      }
    }

    const { achievements, newlyUnlocked } = checkAchievements(updated)
    updated = { ...updated, achievements }

    await saveProfile(updated)
    set(s => ({
      activeProfile: updated,
      recentAchievements: newlyUnlocked.length
        ? [...s.recentAchievements, ...newlyUnlocked]
        : s.recentAchievements
    }))
  },

  addStars: async (n) => {
    const profile = get().activeProfile
    if (!profile) return
    let updated: Profile = { ...profile, totalStars: profile.totalStars + n }

    // Unlock backgrounds at star milestones
    const unlockedBackgrounds = [...updated.unlockedBackgrounds]
    if (updated.totalStars >= 20 && !unlockedBackgrounds.includes('space')) {
      unlockedBackgrounds.push('space')
    }
    if (updated.totalStars >= 50 && !unlockedBackgrounds.includes('galaxy')) {
      unlockedBackgrounds.push('galaxy')
    }

    const { achievements, newlyUnlocked } = checkAchievements(updated)
    updated = { ...updated, achievements, unlockedBackgrounds }

    await saveProfile(updated)
    set(s => ({
      activeProfile: updated,
      recentAchievements: newlyUnlocked.length
        ? [...s.recentAchievements, ...newlyUnlocked]
        : s.recentAchievements
    }))
  },

  recordGameCompleted: async () => {
    const profile = get().activeProfile
    if (!profile) return
    let updated: Profile = {
      ...profile,
      gamesCompleted: profile.gamesCompleted + 1,
      lastSession: new Date().toISOString()
    }

    const { achievements, newlyUnlocked } = checkAchievements(updated)
    updated = { ...updated, achievements }

    await saveProfile(updated)
    set(s => ({
      activeProfile: updated,
      recentAchievements: newlyUnlocked.length
        ? [...s.recentAchievements, ...newlyUnlocked]
        : s.recentAchievements
    }))
  },

  refreshDailyMissions: async () => {
    const profile = get().activeProfile
    if (!profile) return
    const missions = refreshMissionsIfNeeded(profile)
    if (missions === profile.dailyMissions) return
    const updated = { ...profile, dailyMissions: missions }
    await saveProfile(updated)
    set({ activeProfile: updated })
  },

  clearRecentAchievements: () => set({ recentAchievements: [] }),

  addFavorite: async (characterId) => {
    const profile = get().activeProfile
    if (!profile) return
    if (profile.favoriteCharacters.includes(characterId)) return
    const updated = { ...profile, favoriteCharacters: [...profile.favoriteCharacters, characterId] }
    await saveProfile(updated)
    set({ activeProfile: updated })
  },

  removeFavorite: async (characterId) => {
    const profile = get().activeProfile
    if (!profile) return
    const updated = { ...profile, favoriteCharacters: profile.favoriteCharacters.filter(id => id !== characterId) }
    await saveProfile(updated)
    set({ activeProfile: updated })
  },

  unlockUniverse: async (universe) => {
    const profile = get().activeProfile
    if (!profile) return
    if (profile.unlockedUniverses.includes(universe)) return
    const updated = { ...profile, unlockedUniverses: [...profile.unlockedUniverses, universe] }
    await saveProfile(updated)
    set({ activeProfile: updated })
  },

  resetProfile: async () => {
    const profile = get().activeProfile
    if (!profile) return
    await deleteProfile(profile.id)
    const fresh = createDefaultProfile(profile.name)
    await saveProfile(fresh)
    set({ activeProfile: fresh, allProfiles: [fresh] })
  }
}))
