import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { playClick } from '@/utils/audio'

type Variant = 'primary' | 'ghost' | 'icon'

interface Props {
  variant?: Variant
  onClick?: () => void
  disabled?: boolean
  className?: string
  children: ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl px-6 py-3 shadow-lg',
  ghost:   'bg-white/10 text-white font-bold rounded-2xl px-6 py-3 border border-white/20',
  icon:    'w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white text-lg'
}

/** Shared button: press-scale animation + click sound + haptic tick on every tap */
export function Button({ variant = 'ghost', onClick, disabled, className = '', children }: Props) {
  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.92 } : undefined}
      onClick={() => {
        if (disabled) return
        playClick()
        onClick?.()
      }}
      disabled={disabled}
      className={`${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </motion.button>
  )
}
