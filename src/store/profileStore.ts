import { create } from 'zustand'
import { saveProfile, loadAllProfiles, deleteProfile } from '@/utils/db'
import type { Profile, SkillNodeId, SkillNode, Universe, Achievement } from '@/types'
import skillNodesData from '@/data/skillNodes.json'
import achievementsData from '@/data/achievements.json'
import { uid, todayISO } from '@/utils/helpers'

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

interface ProfileStore {
  activeProfile: Profile | null
  allProfiles: Profile[]
  loading: boolean

  // Actions
  initProfiles: () => Promise<void>
  setActiveProfile: (profile: Profile) => void
  createProfile: (name: string) => Promise<Profile>
  updateProfile: (updates: Partial<Profile>) => Promise<void>

  // Skill progression
  recordAnswer: (skillNode: SkillNodeId, correct: boolean) => Promise<void>

  // Stars
  addStars: (n: number) => Promise<void>

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

  initProfiles: async () => {
    const profiles = await loadAllProfiles()
    if (profiles.length === 0) {
      // First launch: create Athiran's profile
      const profile = createDefaultProfile('Athiran')
      await saveProfile(profile)
      set({ activeProfile: profile, allProfiles: [profile], loading: false })
    } else {
      set({ activeProfile: profiles[0], allProfiles: profiles, loading: false })
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

    const node = { ...profile.skillNodes[skillNodeId] }
    node.attempts++
    node.lastSeen = new Date().toISOString()

    if (correct) {
      node.correctStreak++
      node.incorrectStreak = 0
      node.masteryScore = Math.min(100, node.masteryScore + 10)

      // Progression: 3 correct in a row → unlock next node
      if (node.correctStreak >= 3) {
        // Find next node
        const all = Object.values(profile.skillNodes)
        const next = all.find(n => n.prerequisite === skillNodeId && !n.unlocked)
        if (next) {
          const nextNode = { ...profile.skillNodes[next.id as SkillNodeId], unlocked: true }
          const updatedSkillNodes = {
            ...profile.skillNodes,
            [skillNodeId]: node,
            [next.id]: nextNode
          }
          const updated = {
            ...profile,
            skillNodes: updatedSkillNodes as Record<SkillNodeId, SkillNode>,
            totalCorrect: profile.totalCorrect + 1,
            totalAttempts: profile.totalAttempts + 1,
            currentStreak: profile.currentStreak + 1
          }
          await saveProfile(updated)
          set({ activeProfile: updated })
          return
        }
      }
    } else {
      node.incorrectStreak++
      node.correctStreak = 0
      node.masteryScore = Math.max(0, node.masteryScore - 5)

      // Regression: 2 incorrect → drop mastery
      if (node.incorrectStreak >= 2) {
        node.masteryScore = Math.max(0, node.masteryScore - 10)
      }
    }

    const updatedSkillNodes = { ...profile.skillNodes, [skillNodeId]: node }
    const updated = {
      ...profile,
      skillNodes: updatedSkillNodes as Record<SkillNodeId, SkillNode>,
      totalCorrect: correct ? profile.totalCorrect + 1 : profile.totalCorrect,
      totalAttempts: profile.totalAttempts + 1,
      currentStreak: correct ? profile.currentStreak + 1 : 0
    }
    await saveProfile(updated)
    set({ activeProfile: updated })
  },

  addStars: async (n) => {
    const profile = get().activeProfile
    if (!profile) return
    const updated = { ...profile, totalStars: profile.totalStars + n }

    // Check milestone achievements
    const milestones = [5, 20, 50, 100]
    const achievementMap: Record<number, string> = { 5: 'five_stars', 20: 'twenty_stars', 50: 'fifty_stars', 100: 'hundred_stars' }
    const updatedAchievements = updated.achievements.map(a => {
      if (a.condition === 'stars' && !a.unlocked && updated.totalStars >= a.threshold) {
        return { ...a, unlocked: true, unlockedAt: new Date().toISOString() }
      }
      return a
    })
    // Unlock backgrounds
    const unlockedBackgrounds = [...updated.unlockedBackgrounds]
    if (updated.totalStars >= 20 && !unlockedBackgrounds.includes('space')) {
      unlockedBackgrounds.push('space')
    }
    if (updated.totalStars >= 50 && !unlockedBackgrounds.includes('galaxy')) {
      unlockedBackgrounds.push('galaxy')
    }

    const final = { ...updated, achievements: updatedAchievements, unlockedBackgrounds }
    await saveProfile(final)
    set({ activeProfile: final })
  },

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
