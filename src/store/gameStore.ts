import { create } from 'zustand'
import type { NavState, Screen, Universe, GameId, GameSession, QuestionResult } from '@/types'
import { uid } from '@/utils/helpers'

interface GameStore {
  nav: NavState
  currentSession: GameSession | null
  lastSessionResults: GameSession | null
  sessionStartTime: number | null

  // Navigation
  navigate: (screen: Screen, params?: Partial<NavState>) => void
  goBack: () => void

  // Session management
  startSession: (gameId: GameId, universe: Universe | null, profileId: string) => void
  recordResult: (result: QuestionResult) => void
  endSession: () => GameSession | null

  // Reward state
  pendingStars: number
  addPendingStars: (n: number) => void
  clearPendingStars: () => void
}

const history: NavState[] = []

export const useGameStore = create<GameStore>((set, get) => ({
  nav: { screen: 'splash' },
  currentSession: null,
  lastSessionResults: null,
  sessionStartTime: null,
  pendingStars: 0,

  navigate: (screen, params = {}) => {
    const current = get().nav
    history.push(current)
    set({ nav: { screen, ...params } })
  },

  goBack: () => {
    const prev = history.pop()
    if (prev) set({ nav: prev })
    else set({ nav: { screen: 'home' } })
  },

  startSession: (gameId, universe, profileId) => {
    const session: GameSession = {
      id: uid(),
      gameId,
      universe,
      profileId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      questions: [],
      starsEarned: 0,
      completed: false
    }
    set({ currentSession: session, sessionStartTime: Date.now(), pendingStars: 0 })
  },

  recordResult: (result) => {
    const session = get().currentSession
    if (!session) return
    const starsEarned = result.correct ? 1 : 0
    set(state => ({
      currentSession: {
        ...session,
        questions: [...session.questions, result],
        starsEarned: session.starsEarned + starsEarned
      },
      pendingStars: result.correct ? state.pendingStars + 1 : state.pendingStars
    }))
  },

  endSession: () => {
    const session = get().currentSession
    if (!session) return null
    const ended = { ...session, endedAt: new Date().toISOString(), completed: true }
    set({ currentSession: null, lastSessionResults: ended })
    return ended
  },

  addPendingStars: (n) => set(s => ({ pendingStars: s.pendingStars + n })),
  clearPendingStars: () => set({ pendingStars: 0 })
}))
