import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useProfileStore } from '@/store/profileStore'
import { StarCounter } from '@/components/StarCounter'
import { getPillarProgress } from '@/engine/ProgressEngine'
import { playClick } from '@/utils/audio'
import type { Pillar } from '@/types'

const PILLAR_META: Array<{ id: Pillar; label: string; emoji: string; color: string }> = [
  { id: 'numbers',   label: 'Numbers',   emoji: '🔢', color: '#3b82f6' },
  { id: 'alphabets', label: 'Alphabets', emoji: '🔤', color: '#8b5cf6' },
  { id: 'colors',    label: 'Colors',    emoji: '🎨', color: '#ec4899' },
  { id: 'memory',    label: 'Memory',    emoji: '🧠', color: '#f59e0b' },
  { id: 'logic',     label: 'Logic',     emoji: '⚡', color: '#10b981' }
]

export function HomeScreen() {
  const navigate = useGameStore(s => s.navigate)
  const profile = useProfileStore(s => s.activeProfile)

  if (!profile) return null

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <p className="text-indigo-300 text-sm">Welcome back!</p>
          <h1 className="text-white font-bold text-3xl">{profile.name} 🦸</h1>
        </motion.div>
        <div className="flex items-center gap-2">
          <StarCounter count={profile.totalStars} />
          <button
            onClick={() => { playClick(); navigate('parent_settings') }}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-lg"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Streak banner */}
      {profile.currentStreak >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-5 mb-3 bg-orange-500/20 border border-orange-400/30 rounded-2xl px-4 py-2 flex items-center gap-3"
        >
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-orange-300 font-bold">{profile.currentStreak} correct in a row!</p>
            <p className="text-orange-300/60 text-xs">Keep it up!</p>
          </div>
        </motion.div>
      )}

      {/* Big play button */}
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => { playClick(); navigate('universe_selection') }}
        className="mx-5 mb-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 flex items-center gap-4 shadow-2xl border border-white/10"
      >
        <span className="text-5xl">▶️</span>
        <div className="text-left">
          <p className="text-white font-bold text-2xl">Play Now!</p>
          <p className="text-white/70 text-sm">Choose your universe</p>
        </div>
      </motion.button>

      {/* Pillar progress */}
      <div className="px-5 mb-5">
        <h2 className="text-white/70 text-sm font-bold uppercase tracking-wide mb-3">Your Progress</h2>
        <div className="grid grid-cols-5 gap-2">
          {PILLAR_META.map((pillar, i) => {
            const pct = getPillarProgress(profile, pillar.id)
            return (
              <motion.button
                key={pillar.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => navigate('game_selection')}
                className="flex flex-col items-center gap-1.5 bg-white/5 rounded-2xl p-2 border border-white/10"
              >
                <span className="text-2xl">{pillar.emoji}</span>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: pillar.color }}
                  />
                </div>
                <p className="text-white/50 text-xs">{pct}%</p>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Daily missions */}
      <div className="px-5 pb-8">
        <h2 className="text-white/70 text-sm font-bold uppercase tracking-wide mb-3">Daily Missions</h2>
        {profile.dailyMissions.length === 0 ? (
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
            <p className="text-white/50 text-sm">No missions today — tap Play to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {profile.dailyMissions.map(mission => (
              <div
                key={mission.id}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${
                  mission.completed
                    ? 'bg-green-500/10 border-green-400/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <span className="text-2xl">{mission.completed ? '✅' : '🎯'}</span>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{mission.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full"
                        style={{ width: `${Math.min(100, (mission.progress / mission.target) * 100)}%` }}
                      />
                    </div>
                    <p className="text-white/40 text-xs">{mission.progress}/{mission.target}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
