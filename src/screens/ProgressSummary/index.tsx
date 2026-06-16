import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useProfileStore } from '@/store/profileStore'
import { getPillarProgress } from '@/engine/ProgressEngine'
import { exportAllData } from '@/utils/db'
import type { Pillar } from '@/types'

const PILLARS: Array<{ id: Pillar; label: string; emoji: string; color: string }> = [
  { id: 'numbers',   label: 'Numbers',   emoji: '🔢', color: '#3b82f6' },
  { id: 'alphabets', label: 'Alphabets', emoji: '🔤', color: '#8b5cf6' },
  { id: 'colors',    label: 'Colors',    emoji: '🎨', color: '#ec4899' },
  { id: 'memory',    label: 'Memory',    emoji: '🧠', color: '#f59e0b' },
  { id: 'logic',     label: 'Logic',     emoji: '⚡', color: '#10b981' }
]

export function ProgressSummaryScreen() {
  const navigate = useGameStore(s => s.navigate)
  const profile = useProfileStore(s => s.activeProfile)

  const handleExport = async () => {
    const data = await exportAllData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `athiverse-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!profile) return null

  const unlockedSkills = Object.values(profile.skillNodes).filter(n => n.unlocked && n.masteryScore >= 80).length
  const totalSkills = Object.values(profile.skillNodes).length

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 overflow-auto">
      <div className="flex items-center gap-3 px-5 pt-8 pb-4">
        <button
          onClick={() => navigate('home')}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-lg"
        >
          ←
        </button>
        <h1 className="text-white font-bold text-2xl">Progress</h1>
      </div>

      <div className="px-5 space-y-5 pb-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Stars', value: profile.totalStars, emoji: '⭐' },
            { label: 'Correct', value: profile.totalCorrect, emoji: '✅' },
            { label: 'Skills', value: `${unlockedSkills}/${totalSkills}`, emoji: '🔓' }
          ].map(stat => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-white/10 rounded-2xl p-3 text-center border border-white/10"
            >
              <p className="text-2xl">{stat.emoji}</p>
              <p className="text-white font-bold text-xl">{stat.value}</p>
              <p className="text-white/50 text-xs">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Pillar bars */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h2 className="text-white font-bold mb-4">Learning Pillars</h2>
          <div className="space-y-3">
            {PILLARS.map(pillar => {
              const pct = getPillarProgress(profile, pillar.id)
              return (
                <div key={pillar.id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-white text-sm">{pillar.emoji} {pillar.label}</span>
                    <span className="text-white/50 text-sm">{pct}%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: pillar.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Skill nodes */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h2 className="text-white font-bold mb-4">Skill Tree</h2>
          <div className="space-y-2">
            {Object.values(profile.skillNodes).map(node => (
              <div key={node.id} className="flex items-center gap-3">
                <span className="text-lg">
                  {!node.unlocked ? '🔒' : node.masteryScore >= 80 ? '✅' : '📖'}
                </span>
                <div className="flex-1">
                  <p className="text-white text-sm">{node.label}</p>
                  {node.unlocked && (
                    <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full"
                        style={{ width: `${node.masteryScore}%` }}
                      />
                    </div>
                  )}
                </div>
                {node.unlocked && (
                  <span className="text-white/40 text-xs">{node.masteryScore}%</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h2 className="text-white font-bold mb-4">Achievements</h2>
          <div className="flex flex-wrap gap-2">
            {profile.achievements.map(a => (
              <div
                key={a.id}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${
                  a.unlocked
                    ? 'bg-yellow-400/20 border-yellow-400/30'
                    : 'bg-white/5 border-white/10 opacity-40'
                }`}
              >
                <span>{a.icon}</span>
                <span className="text-white text-xs font-bold">{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          className="w-full bg-white/10 text-white/70 font-bold py-3 rounded-2xl border border-white/20 text-sm"
        >
          📤 Export Progress (JSON)
        </button>
      </div>
    </div>
  )
}
