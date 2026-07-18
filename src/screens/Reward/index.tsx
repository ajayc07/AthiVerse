import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useProfileStore } from '@/store/profileStore'
import { useAudio } from '@/hooks/useAudio'
import { MILESTONES } from '@/engine/RewardEngine'
import { CharacterCard } from '@/components/CharacterCard'
import { Button } from '@/components/Button'
import { pickOne } from '@/utils/helpers'
import type { Character } from '@/types'
import allCharacters from '@/data/characters.json'

export function RewardScreen() {
  const navigate = useGameStore(s => s.navigate)
  const lastSession = useGameStore(s => s.lastSessionResults)
  const pendingStars = useGameStore(s => s.pendingStars)
  const profile = useProfileStore(s => s.activeProfile)
  const recentAchievements = useProfileStore(s => s.recentAchievements)
  const clearRecentAchievements = useProfileStore(s => s.clearRecentAchievements)
  const { playCelebration } = useAudio()
  const [showConfetti, setShowConfetti] = useState(true)

  const sessionStars = lastSession?.starsEarned ?? 0
  const stars = Math.max(pendingStars, sessionStars)
  const bonus = Math.max(0, stars - sessionStars)
  const correct = lastSession?.questions.filter(q => q.correct).length ?? 0
  const total = lastSession?.questions.length ?? 0
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  // Find crossed milestones
  const previousStars = (profile?.totalStars ?? 0) - stars
  const newMilestones = MILESTONES.filter(
    m => m.stars > previousStars && m.stars <= (profile?.totalStars ?? 0)
  )

  // A favorite hero cheers the child on
  const [cameo] = useState<Character | null>(() => {
    const favorites = useProfileStore.getState().activeProfile?.favoriteCharacters ?? []
    const pool = (allCharacters as Character[]).filter(c => favorites.includes(c.id))
    return pool.length > 0 ? pickOne(pool) : null
  })

  useEffect(() => {
    if (stars > 0) playCelebration().catch(() => {})
    const t = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Achievements are shown once, then cleared for the next session
  useEffect(() => () => clearRecentAchievements(), [clearRecentAchievements])

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 items-center justify-center px-6 overflow-auto">
      {/* Confetti particles */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                initial={{ y: -20, x: `${Math.random() * 100}vw`, opacity: 1 }}
                animate={{ y: '110vh', opacity: 0, rotate: Math.random() * 720 }}
                transition={{ duration: 2 + Math.random() * 2, delay: Math.random() }}
              >
                {['⭐', '🎉', '✨', '🌟', '💥', '🏆'][Math.floor(Math.random() * 6)]}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Trophy + headline */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-center mb-6"
      >
        <motion.div
          className="text-7xl mb-2"
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1 }}
        >
          🏆
        </motion.div>
        <h1 className="text-white font-hero text-4xl">
          {stars > 0 ? 'Amazing!' : 'Keep trying!'}
        </h1>
        <p className="text-white/60 mt-1">
          {correct} out of {total} correct
        </p>
      </motion.div>

      {/* Favorite hero cheers */}
      {cameo && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-3 mb-5"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <CharacterCard character={cameo} size="sm" animate={false} />
          </motion.div>
          <p className="text-white/80 font-bold">
            {stars > 0 ? `${cameo.name} says: Great job! 💪` : `${cameo.name} believes in you! 💪`}
          </p>
        </motion.div>
      )}

      {/* Stars display */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex gap-2 mb-6"
      >
        {Array.from({ length: Math.max(5, stars) }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: i < stars ? [0, 1.4, 1] : 1 }}
            transition={{ delay: 0.4 + i * 0.12 }}
            className="text-3xl"
          >
            {i < stars ? '⭐' : '☆'}
          </motion.span>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-xs bg-white/10 rounded-2xl p-4 mb-5 border border-white/20 space-y-2"
      >
        <div className="flex justify-between text-white">
          <span className="text-white/60">Stars earned</span>
          <span className="font-bold">+{stars} ⭐</span>
        </div>
        {bonus > 0 && (
          <div className="flex justify-between text-white">
            <span className="text-white/60">Perfect bonus</span>
            <span className="font-bold text-amber-300">+{bonus} 🌟</span>
          </div>
        )}
        <div className="flex justify-between text-white">
          <span className="text-white/60">Accuracy</span>
          <span className="font-bold">{accuracy}%</span>
        </div>
        <div className="flex justify-between text-white">
          <span className="text-white/60">Total stars</span>
          <span className="font-bold">{profile?.totalStars ?? 0} ⭐</span>
        </div>
      </motion.div>

      {/* Newly unlocked achievements */}
      {recentAchievements.length > 0 && (
        <div className="w-full max-w-xs mb-5 space-y-2">
          {recentAchievements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7 + i * 0.15, type: 'spring' }}
              className="bg-purple-400/20 border border-purple-400/40 rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              <span className="text-3xl">{a.icon}</span>
              <div>
                <p className="text-purple-200 font-bold">{a.label}</p>
                <p className="text-purple-200/60 text-sm">Achievement unlocked!</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Milestones */}
      {newMilestones.length > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
          className="w-full max-w-xs mb-5 space-y-2"
        >
          {newMilestones.map(m => (
            <div
              key={m.stars}
              className="bg-yellow-400/20 border border-yellow-400/30 rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              <span className="text-3xl">🎊</span>
              <div>
                <p className="text-yellow-300 font-bold">{m.label}</p>
                <p className="text-yellow-300/60 text-sm">Milestone unlocked!</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex gap-3 w-full max-w-xs"
      >
        <Button variant="ghost" className="flex-1" onClick={() => navigate('game_selection')}>
          Play Again
        </Button>
        <Button variant="primary" className="flex-1" onClick={() => navigate('home')}>
          Home 🏠
        </Button>
      </motion.div>
    </div>
  )
}
