import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  show: boolean
  message?: string
  onDone?: () => void
}

const EMOJIS = ['🎉', '⭐', '🏆', '💥', '✨', '🎊', '🌟', '🦸']
const MESSAGES = ['Amazing!', 'Super!', 'Brilliant!', 'You got it!', 'Hero!', 'Wow!', 'Perfect!']

interface Particle {
  id: number
  x: number
  y: number
  emoji: string
  scale: number
  rotation: number
}

function makeParticles(count = 12): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    scale: 0.5 + Math.random() * 1.5,
    rotation: Math.random() * 360
  }))
}

export function CelebrationOverlay({ show, message, onDone }: Props) {
  const [particles] = useState<Particle[]>(makeParticles)
  const displayMessage = message ?? MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone })

  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => onDoneRef.current?.(), 1800)
    return () => clearTimeout(t)
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
        >
          {/* Particles */}
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, scale: 0, x: '50vw', y: '50vh' }}
              animate={{
                opacity: [1, 1, 0],
                scale: p.scale,
                x: `${p.x}vw`,
                y: `${p.y}vh`,
                rotate: p.rotation
              }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute text-3xl"
            >
              {p.emoji}
            </motion.div>
          ))}

          {/* Big message */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: [0, 1.3, 1], rotate: [0, 5, 0] }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="bg-yellow-400 text-slate-900 font-bold text-4xl px-8 py-4 rounded-3xl shadow-2xl"
          >
            {displayMessage}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
