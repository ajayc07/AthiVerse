import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useProfileStore } from '@/store/profileStore'
import { playClick } from '@/utils/audio'
import type { GameId, GameMeta } from '@/types'
import gamesData from '@/data/games.json'

const PILLAR_COLORS: Record<string, string> = {
  numbers:   '#3b82f6',
  alphabets: '#8b5cf6',
  colors:    '#ec4899',
  memory:    '#f59e0b',
  logic:     '#10b981'
}

export function GameSelectionScreen() {
  const nav = useGameStore(s => s.nav)
  const navigate = useGameStore(s => s.navigate)
  const startSession = useGameStore(s => s.startSession)
  const profile = useProfileStore(s => s.activeProfile)

  const games = gamesData as GameMeta[]
  const tier1 = games.filter(g => g.tier === 1)
  const tier2 = games.filter(g => g.tier === 2)

  const handlePlay = (game: GameMeta) => {
    if (!profile) return
    playClick()
    startSession(game.id, nav.universe ?? null, profile.id)
    navigate('gameplay', { gameId: game.id, universe: nav.universe })
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-8 pb-4">
        <button
          onClick={() => { playClick(); navigate('universe_selection') }}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-lg"
        >
          ←
        </button>
        <div>
          <h1 className="text-white font-bold text-2xl">Choose a Game</h1>
          <p className="text-white/50 text-sm">
            {nav.universe ? `${nav.universe} universe` : 'All universes'}
          </p>
        </div>
      </div>

      {/* Games */}
      <div className="flex-1 overflow-auto px-5 pb-8 space-y-5">
        {/* Tier 1 */}
        <div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-3">⚡ Tier 1 — Play Now</p>
          <div className="space-y-2">
            {tier1.map((game, i) => (
              <GameCard key={game.id} game={game} index={i} onPlay={() => handlePlay(game)} />
            ))}
          </div>
        </div>

        {/* Tier 2 */}
        <div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-3">🔒 Tier 2 — Coming Soon</p>
          <div className="space-y-2">
            {tier2.map((game, i) => (
              <GameCard key={game.id} game={game} index={tier1.length + i} onPlay={() => handlePlay(game)} locked />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function GameCard({
  game,
  index,
  onPlay,
  locked = false
}: {
  game: GameMeta
  index: number
  onPlay: () => void
  locked?: boolean
}) {
  const color = PILLAR_COLORS[game.pillar] ?? '#6366f1'

  return (
    <motion.button
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={!locked ? { scale: 1.02 } : {}}
      whileTap={!locked ? { scale: 0.98 } : {}}
      disabled={locked}
      onClick={!locked ? onPlay : undefined}
      className={`w-full rounded-2xl p-4 flex items-center gap-4 border transition-all ${
        locked
          ? 'bg-white/5 border-white/10 opacity-50'
          : 'bg-white/10 border-white/20 hover:bg-white/15'
      }`}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ backgroundColor: `${color}33`, border: `2px solid ${color}55` }}
      >
        {game.emoji}
      </div>
      <div className="text-left flex-1">
        <p className="text-white font-bold">{game.label}</p>
        <p className="text-white/50 text-sm">{game.description}</p>
      </div>
      <div
        className="px-2 py-0.5 rounded-full text-xs font-bold capitalize"
        style={{ backgroundColor: `${color}33`, color }}
      >
        {game.pillar}
      </div>
    </motion.button>
  )
}
