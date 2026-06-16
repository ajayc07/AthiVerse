import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useProfileStore } from '@/store/profileStore'
import { MILESTONES } from '@/engine/RewardEngine'

export function RewardScreen() {
  const navigate = useGameStore(s => s.navigate)
  const lastSession = useGameStore(s => s.lastSessionResults)
  const profile = useProfileStore(s => s.activeProfile)
  const [showConfetti, setShowConfetti] = useState(true)

  const stars = lastSession?.starsEarned ?? 0
  const correct = lastSession?.questions.filter(q => q.correct).length ?? 0
  const total = lastSession?.questions.length ?? 0
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  // Find crossed milestones
  const previousStars = (profile?.totalStars ?? 0) - stars
  const newMilestones = MILESTONES.filter(
    m => m.stars > previousStars && m.stars <= (profile?.totalStars ?? 0)
  )

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 items-center justify-center px-6">
      {/* Confetti particles */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
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

      {/* Stars earned */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-center mb-8"
      >
        <div className="text-7xl mb-2">🏆</div>
        <h1 className="text-white font-bold text-4xl">
          {stars > 0 ? 'Amazing!' : 'Keep trying!'}
        </h1>
        <p className="text-white/60 mt-1">
          {correct} out of {total} correct
        </p>
      </motion.div>

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
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 + i * 0.1 }}
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
        className="w-full max-w-xs bg-white/10 rounded-2xl p-4 mb-6 border border-white/20 space-y-2"
      >
        <div className="flex justify-between text-white">
          <span className="text-white/60">Stars earned</span>
          <span className="font-bold">+{stars} ⭐</span>
        </div>
        <div className="flex justify-between text-white">
          <span className="text-white/60">Accuracy</span>
          <span className="font-bold">{accuracy}%</span>
        </div>
        <div className="flex justify-between text-white">
          <span className="text-white/60">Total stars</span>
          <span className="font-bold">{profile?.totalStars ?? 0} ⭐</span>
        </div>
      </motion.div>

      {/* Milestones */}
      {newMilestones.length > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
          className="w-full max-w-xs mb-6"
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
        <button
          onClick={() => navigate('game_selection')}
          className="flex-1 bg-white/10 text-white font-bold py-3 rounded-2xl border border-white/20"
        >
          Play Again
        </button>
        <button
          onClick={() => navigate('home')}
          className="flex-1 bg-indigo-500 text-white font-bold py-3 rounded-2xl"
        >
          Home 🏠
        </button>
      </motion.div>
    </div>
  )
}
