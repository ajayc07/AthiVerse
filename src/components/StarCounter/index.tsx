import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  count: number
}

/** Star pill that floats a "+n" whenever the count increases */
export function StarCounter({ count }: Props) {
  const prev = useRef(count)
  const [delta, setDelta] = useState<number | null>(null)

  useEffect(() => {
    if (count > prev.current) {
      setDelta(count - prev.current)
      const t = setTimeout(() => setDelta(null), 1000)
      prev.current = count
      return () => clearTimeout(t)
    }
    prev.current = count
  }, [count])

  return (
    <div className="relative flex items-center gap-1 bg-yellow-400/20 rounded-full px-3 py-1.5 border border-yellow-400/40">
      <span className="text-xl">⭐</span>
      <motion.span
        key={count}
        initial={{ scale: 1.4 }}
        animate={{ scale: 1 }}
        className="text-yellow-300 font-bold text-lg tabular-nums"
      >
        {count}
      </motion.span>

      <AnimatePresence>
        {delta !== null && (
          <motion.span
            key={`delta-${count}`}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -22 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8 }}
            className="absolute right-1 top-0 text-yellow-300 font-bold text-sm pointer-events-none"
          >
            +{delta}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
