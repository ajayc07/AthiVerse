import { useCallback, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useProfileStore } from '@/store/profileStore'
import { GameRouter } from '@/games'
import { saveSession } from '@/utils/db'

export function GameplayScreen() {
  const nav = useGameStore(s => s.nav)
  const navigate = useGameStore(s => s.navigate)
  const endSession = useGameStore(s => s.endSession)
  const profile = useProfileStore(s => s.activeProfile)
  const addStars = useProfileStore(s => s.addStars)

  const gameId = nav.gameId
  const universe = nav.universe

  useEffect(() => {
    if (!gameId) navigate('home')
  }, [gameId, navigate])

  const handleComplete = useCallback(async (stars: number) => {
    const session = endSession()
    if (session) {
      await saveSession(session)
    }
    if (stars > 0 && profile) {
      await addStars(stars)
      navigate('reward', { sessionId: session?.id })
    } else {
      navigate('home')
    }
  }, [endSession, profile, addStars, navigate])

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
