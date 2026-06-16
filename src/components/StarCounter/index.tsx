import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  count: number
  showDelta?: number // transient "+1" pop-up
}

export function StarCounter({ count, showDelta }: Props) {
  return (
    <div className="flex items-center gap-1 bg-yellow-400/20 rounded-full px-3 py-1.5 border border-yellow-400/40">
      <span className="text-xl">⭐</span>
      <span className="text-yellow-300 font-bold text-lg tabular-nums">{count}</span>

      <AnimatePresence>
        {showDelta !== undefined && showDelta > 0 && (
          <motion.span
            key={showDelta + Date.now()}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -20 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8 }}
            className="absolute text-yellow-300 font-bold text-sm pointer-events-none"
          >
            +{showDelta}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
