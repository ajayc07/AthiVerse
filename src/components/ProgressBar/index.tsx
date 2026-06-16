import { motion } from 'framer-motion'

interface Props {
  current: number
  total: number
  color?: string
  showLabel?: boolean
}

export function ProgressBar({ current, total, color = '#6366f1', showLabel = true }: Props) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0

  return (
    <div className="w-full">
      <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <p className="text-white/60 text-xs text-right mt-1">
          {current} / {total}
        </p>
      )}
    </div>
  )
}
