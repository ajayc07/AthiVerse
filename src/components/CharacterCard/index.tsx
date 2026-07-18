/**
 * CharacterCard
 *
 * Renders a character image with a colored placeholder fallback.
 * Swap the placeholder for real images by dropping webp files into:
 *   public/characters/private-pack/<universe>/<id>.webp
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Character } from '@/types'
import { colorToHex } from '@/utils/helpers'

interface Props {
  character: Character
  size?: 'sm' | 'md' | 'lg' | 'xl'
  selected?: boolean
  correct?: boolean
  wrong?: boolean
  onClick?: () => void
  showName?: boolean
  animate?: boolean
}

const SIZE_MAP = {
  sm: 'w-16 h-16 text-2xl',
  md: 'w-24 h-24 text-3xl',
  lg: 'w-32 h-32 text-4xl',
  xl: 'w-40 h-40 text-5xl'
}

export function CharacterCard({
  character,
  size = 'lg',
  selected = false,
  correct,
  wrong,
  onClick,
  showName = false,
  animate = true
}: Props) {
  // Track failure per-src so a reused card instance retries when the character changes
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const sizeClass = SIZE_MAP[size]
  const primaryColor = colorToHex(character.colors[0] ?? 'purple')
  const secondaryColor = colorToHex(character.colors[1] ?? character.colors[0] ?? 'indigo')
  const imgSrc = `${import.meta.env.BASE_URL}characters/${character.image}`
  const imgFailed = failedSrc === imgSrc

  let borderClass = 'border-4 border-transparent'
  if (selected) borderClass = 'border-4 border-yellow-400'
  if (correct === true) borderClass = 'border-4 border-green-400 ring-4 ring-green-300'
  if (wrong === true) borderClass = 'border-4 border-red-400 ring-4 ring-red-300'

  const card = (
    <div
      className={`
        relative rounded-2xl overflow-hidden cursor-pointer
        ${sizeClass} ${borderClass}
        transition-all duration-200 flex-shrink-0
        ${onClick ? 'active:scale-95' : ''}
      `}
      style={{ background: `linear-gradient(135deg, ${primaryColor}33, ${secondaryColor}55)` }}
      onClick={onClick}
    >
      {/* Real image */}
      {!imgFailed && (
        <img
          src={imgSrc}
          alt={character.name}
          className="w-full h-full object-contain p-1"
          onError={() => setFailedSrc(imgSrc)}
          draggable={false}
        />
      )}

      {/* Placeholder when image missing */}
      {imgFailed && (
        <div
          className="w-full h-full flex flex-col items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          <span className="text-white font-bold" style={{ fontSize: '2em', lineHeight: 1 }}>
            {character.name[0]}
          </span>
          <span className="text-white/80 text-xs mt-1 px-1 text-center leading-tight">
            {character.name.split(' ')[0]}
          </span>
        </div>
      )}

      {/* Correct overlay */}
      {correct === true && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-400/20">
          <span className="text-3xl">✅</span>
        </div>
      )}

      {/* Wrong overlay */}
      {wrong === true && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-400/20">
          <span className="text-3xl">❌</span>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        whileHover={animate && onClick ? { scale: 1.05 } : {}}
        whileTap={animate && onClick ? { scale: 0.95 } : {}}
        animate={
          correct ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } :
          wrong   ? { x: [0, -10, 10, -10, 10, 0] } :
          {}
        }
        transition={{ duration: 0.4 }}
      >
        {card}
      </motion.div>

      {showName && (
        <span className="text-white text-xs font-bold text-center max-w-[80px] leading-tight">
          {character.name}
        </span>
      )}
    </div>
  )
}
