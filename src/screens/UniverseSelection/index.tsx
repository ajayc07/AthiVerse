import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useProfileStore } from '@/store/profileStore'
import { playClick } from '@/utils/audio'
import { Button } from '@/components/Button'
import type { Universe } from '@/types'
import allCharacters from '@/data/characters.json'
import type { Character } from '@/types'

const UNIVERSES: Array<{
  id: Universe
  label: string
  emoji: string
  from: string
  to: string
}> = [
  { id: 'marvel',      label: 'Marvel',       emoji: '🕷️', from: '#e11d48', to: '#be123c' },
  { id: 'dc',          label: 'DC',           emoji: '🦇', from: '#1d4ed8', to: '#1e40af' },
  { id: 'naruto',      label: 'Naruto',       emoji: '🍥', from: '#f97316', to: '#ea580c' },
  { id: 'onepiece',    label: 'One Piece',    emoji: '⚓', from: '#0891b2', to: '#0e7490' },
  { id: 'demonslayer', label: 'Demon Slayer', emoji: '⚔️', from: '#7c3aed', to: '#6d28d9' }
]

export function UniverseSelectionScreen() {
  const navigate = useGameStore(s => s.navigate)
  const profile = useProfileStore(s => s.activeProfile)

  const charsByUniverse = (u: Universe) =>
    (allCharacters as Character[]).filter(c => c.universe === u).length

  const isLocked = (u: Universe) =>
    !profile?.parentSettings.unlockAllUniverses &&
    !profile?.unlockedUniverses.includes(u)

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-8 pb-6">
        <Button variant="icon" onClick={() => navigate('home')}>←</Button>
        <div>
          <h1 className="text-white font-bold text-2xl">Choose Universe</h1>
          <p className="text-white/50 text-sm">Which world do you want to explore?</p>
        </div>
      </div>

      {/* Universe grid */}
      <div className="flex-1 overflow-auto px-5 pb-8 space-y-3">
        {UNIVERSES.map((u, i) => {
          const locked = isLocked(u.id)
          const count = charsByUniverse(u.id)

          return (
            <motion.button
              key={u.id}
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              whileHover={!locked ? { scale: 1.02 } : {}}
              whileTap={!locked ? { scale: 0.98 } : {}}
              disabled={locked}
              onClick={() => {
                if (!locked) { playClick(); navigate('game_selection', { universe: u.id }) }
              }}
              className={`w-full rounded-2xl p-4 flex items-center gap-4 border transition-all ${
                locked
                  ? 'bg-white/5 border-white/10 opacity-50'
                  : 'border-white/20 shadow-lg'
              }`}
              style={!locked ? { background: `linear-gradient(135deg, ${u.from}, ${u.to})` } : {}}
            >
              <span className="text-4xl">{locked ? '🔒' : u.emoji}</span>
              <div className="text-left flex-1">
                <p className="text-white font-bold text-xl">{u.label}</p>
                <p className="text-white/70 text-sm">{count} heroes</p>
              </div>
              {!locked && <span className="text-white/70 text-xl">→</span>}
            </motion.button>
          )
        })}

        {/* All universes option */}
        <motion.button
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: UNIVERSES.length * 0.08 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { playClick(); navigate('game_selection') }}
          className="w-full rounded-2xl p-4 flex items-center gap-4 border border-white/20 bg-gradient-to-r from-slate-700 to-slate-600 shadow-lg"
        >
          <span className="text-4xl">🌍</span>
          <div className="text-left flex-1">
            <p className="text-white font-bold text-xl">All Heroes</p>
            <p className="text-white/70 text-sm">Mix from all universes</p>
          </div>
          <span className="text-white/70 text-xl">→</span>
        </motion.button>
      </div>
    </div>
  )
}
