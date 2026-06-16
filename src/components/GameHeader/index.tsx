import { motion } from 'framer-motion'
import { StarCounter } from '@/components/StarCounter'
import { ProgressBar } from '@/components/ProgressBar'
import { useGameStore } from '@/store/gameStore'
import { playClick } from '@/utils/audio'

interface Props {
  title: string
  current: number
  total: number
  stars: number
  onBack?: () => void
}

export function GameHeader({ title, current, total, stars, onBack }: Props) {
  const navigate = useGameStore(s => s.navigate)

  return (
    <div className="w-full px-4 pt-4 pb-2 space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => { playClick(); (onBack ?? (() => navigate('home')))() }}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-lg active:scale-90 transition-transform"
        >
          ←
        </button>

        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white font-bold text-lg"
        >
          {title}
        </motion.h2>

        <StarCounter count={stars} />
      </div>

      <ProgressBar current={current} total={total} />
    </div>
  )
}
