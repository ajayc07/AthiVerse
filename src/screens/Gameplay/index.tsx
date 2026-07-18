import { useCallback, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useProfileStore } from '@/store/profileStore'
import { GameRouter } from '@/games'
import { saveSession } from '@/utils/db'
import { calculateBonusStars } from '@/engine/RewardEngine'

export function GameplayScreen() {
  const nav = useGameStore(s => s.nav)
  const navigate = useGameStore(s => s.navigate)
  const endSession = useGameStore(s => s.endSession)
  const addPendingStars = useGameStore(s => s.addPendingStars)
  const profile = useProfileStore(s => s.activeProfile)
  const addStars = useProfileStore(s => s.addStars)
  const recordGameCompleted = useProfileStore(s => s.recordGameCompleted)

  const gameId = nav.gameId
  const universe = nav.universe

  useEffect(() => {
    if (!gameId) navigate('home')
  }, [gameId, navigate])

  const handleComplete = useCallback(async (stars: number) => {
    const session = endSession()
    if (session) {
      await saveSession(session)
      await recordGameCompleted()
    }

    // Perfect (or near-perfect) sessions earn bonus stars
    const correct = session?.questions.filter(q => q.correct).length ?? 0
    const total = session?.questions.length ?? 0
    const bonus = stars > 0 ? calculateBonusStars(correct, total) : 0
    if (bonus > 0) addPendingStars(bonus)

    if (stars + bonus > 0 && profile) {
      await addStars(stars + bonus)
      navigate('reward', { sessionId: session?.id })
    } else {
      navigate('home')
    }
  }, [endSession, profile, addStars, addPendingStars, recordGameCompleted, navigate])

  if (!gameId) return null

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900">
      <GameRouter
        gameId={gameId}
        universe={universe}
        onComplete={handleComplete}
      />
    </div>
  )
}
