import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useProfileStore } from '@/store/profileStore'
import { playUI } from '@/utils/audio'

export function SplashScreen() {
  const navigate = useGameStore(s => s.navigate)
  const initProfiles = useProfileStore(s => s.initProfiles)

  useEffect(() => {
    playUI('open').catch(() => {})
    initProfiles().then(() => {
      setTimeout(() => navigate('home'), 2200)
    })
  }, [])

  return (
    <div className="flex flex-col h-full items-center justify-center bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-300 text-sm"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
          >
            ✦
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        className="text-center z-10"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-8xl mb-4"
        >
          🦸
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-5xl font-bold text-white tracking-tight"
        >
          AthiVerse
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-indigo-300 text-lg mt-2 font-medium"
        >
          Hero Learning Universe
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-12 flex gap-2"
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-indigo-400"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </div>
  )
}
