/**
 * Trace Numbers
 * Child taps numbered dots in the correct order to trace digits 1–9.
 * Teaches number shape and stroke direction through touch interaction.
 */

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { pickRandom, colorToHex } from '@/utils/helpers'
import type { Character } from '@/types'
import allCharacters from '@/data/characters.json'

const TOTAL_ROUNDS = 5
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

// Absolute [x, y] positions (px) within the 160×200 tracing area
const NUMBER_DOTS: Record<number, [number, number][]> = {
  1: [[80, 28], [80, 100], [80, 168]],
  2: [[42, 46], [115, 52], [55, 115], [115, 168]],
  3: [[42, 46], [115, 72], [75, 106], [115, 168]],
  4: [[58, 28], [58, 110], [118, 110], [118, 28], [118, 168]],
  5: [[115, 32], [42, 32], [42, 108], [108, 122], [105, 162], [42, 162]],
  6: [[108, 32], [42, 88], [40, 148], [106, 164], [115, 122], [40, 108]],
  7: [[38, 32], [120, 32], [62, 168]],
  8: [[80, 22], [115, 62], [80, 100], [45, 140], [80, 170]],
  9: [[80, 22], [120, 60], [80, 98], [42, 60], [80, 170]],
}

function pickChar(universe?: string): Character {
  const all  = allCharacters as Character[]
  const pool = universe ? all.filter(c => c.universe === universe) : all
  const safe = pool.length > 0 ? pool : all
  return safe[Math.floor(Math.random() * safe.length)]
}

interface Props {
  universe?: string
  onComplete: (stars: number) => void
}

export function TraceNumbers({ universe, onComplete }: Props) {
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong } = useAudio()

  // 5 distinct digits per game so the same number never repeats within a session
  const [numberQueue] = useState(() => pickRandom(NUMBERS, TOTAL_ROUNDS))
  const [currentNumber, setCurrentNumber] = useState(() => numberQueue[0])
  const [character, setCharacter]         = useState<Character>(() => pickChar(universe))
  const [questionNum, setQuestionNum]     = useState(1)
  const [nextDot, setNextDot]             = useState(0)
  const [tappedDots, setTappedDots]       = useState<number[]>([])
  const [shakeDot, setShakeDot]           = useState<number | null>(null)
  const [completed, setCompleted]         = useState(false)
  const [celebrate, setCelebrate]         = useState(false)
  const [stars, setStars]                 = useState(0)
  const [done, setDone]                   = useState(false)

  const dots      = NUMBER_DOTS[currentNumber]
  const heroColor = colorToHex(character.colors[0] ?? 'purple')

  const advance = useCallback(() => {
    setCelebrate(false)
    setNextDot(0)
    setTappedDots([])
    setCompleted(false)
    if (questionNum >= TOTAL_ROUNDS) { setDone(true); return }
    setQuestionNum(q => q + 1)
    setCurrentNumber(numberQueue[questionNum])
    setCharacter(pickChar(universe))
  }, [questionNum, universe, numberQueue])

  const handleDotTap = useCallback(async (index: number) => {
    if (completed) return

    if (index === nextDot) {
      const newTapped = [...tappedDots, index]
      setTappedDots(newTapped)
      setNextDot(index + 1)
      await playCorrect()

      if (newTapped.length === dots.length) {
        setCompleted(true)
        setStars(s => s + 1)
        recordAnswer('count_1_10', true)
        recordResult({
          questionId: `trace-${questionNum}-${currentNumber}`,
          templateId: 'count_objects',
          skillNode:  'count_1_10',
          correct:    true,
          timeMs:     0,
          answeredAt: new Date().toISOString(),
        })
        setTimeout(() => setCelebrate(true), 650)
      }
    } else {
      setShakeDot(index)
      await playWrong()
      setTimeout(() => setShakeDot(null), 500)
    }
  }, [completed, nextDot, tappedDots, dots, currentNumber, questionNum,
      playCorrect, playWrong, recordAnswer, recordResult])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Trace Numbers ✏️" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4">

        {/* Instruction */}
        <motion.div
          key={questionNum}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-white text-2xl font-bold">Trace the number {currentNumber}!</p>
          <p className="text-white/55 text-sm mt-1">Tap dots in order → 1, 2, 3…</p>
        </motion.div>

        {/* Tracing canvas */}
        <div className="relative select-none" style={{ width: 160, height: 200 }}>

          {/* Ghost digit — barely visible guide; fills with hero colour on completion */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden
          >
            <span
              style={{
                fontSize:   155,
                fontWeight: 900,
                lineHeight: 1,
                userSelect: 'none',
                color:      completed ? heroColor : 'white',
                opacity:    completed ? 0.92 : 0.07,
                textShadow: completed ? `0 0 40px ${heroColor}88` : 'none',
                transition: 'color 0.5s ease, opacity 0.5s ease',
              }}
            >
              {currentNumber}
            </span>
          </div>

          {/* SVG connection lines between tapped dots */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={160}
            height={200}
            viewBox="0 0 160 200"
          >
            {tappedDots.length > 1 && tappedDots.slice(1).map((dotIdx, lineIdx) => {
              const from = dots[tappedDots[lineIdx]]
              const to   = dots[dotIdx]
              return (
                <motion.line
                  key={`l-${lineIdx}`}
                  x1={from[0]} y1={from[1]}
                  x2={to[0]}   y2={to[1]}
                  stroke={heroColor}
                  strokeWidth={8}
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )
            })}
          </svg>

          {/* Numbered tap dots */}
          {dots.map((pos, i) => {
            const isTapped = tappedDots.includes(i)
            const isNext   = i === nextDot && !completed
            const isShake  = shakeDot === i

            return (
              <motion.button
                key={i}
                style={{
                  position:        'absolute',
                  left:            pos[0] - 22,
                  top:             pos[1] - 22,
                  width:           44,
                  height:          44,
                  borderRadius:    '50%',
                  border:          `3px solid ${isTapped ? '#4ade80' : isNext ? 'white' : 'rgba(255,255,255,0.35)'}`,
                  backgroundColor: isTapped
                    ? '#4ade8033'
                    : isNext
                    ? 'rgba(255,255,255,0.18)'
                    : 'rgba(255,255,255,0.05)',
                  boxShadow: isTapped
                    ? '0 0 12px #4ade80'
                    : isNext
                    ? '0 0 14px rgba(255,255,255,0.75)'
                    : 'none',
                  color:      isTapped ? '#4ade80' : 'white',
                  fontSize:   15,
                  fontWeight: 800,
                  display:    'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor:     isTapped || completed ? 'default' : 'pointer',
                  transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
                }}
                animate={
                  isShake ? { x: [0, -8, 8, -8, 0] }
                  : isNext ? { scale: [1, 1.18, 1] }
                  : {}
                }
                transition={{
                  duration:   isNext ? 1.1 : 0.35,
                  repeat:     isNext ? Infinity : 0,
                  repeatType: 'loop',
                }}
                onClick={() => handleDotTap(i)}
                disabled={isTapped || completed}
              >
                {isTapped ? '✓' : i + 1}
              </motion.button>
            )
          })}
        </div>

        {/* Hero cheerleader */}
        <motion.div
          className="flex flex-col items-center gap-1"
          animate={completed ? { scale: [1, 1.3, 1], rotate: [0, 12, -12, 0] } : {}}
          transition={{ duration: 0.55 }}
        >
          <img
            src={`${import.meta.env.BASE_URL}characters/${character.image}`}
            alt={character.name}
            className="w-14 h-14 object-contain"
            style={{ opacity: 0.72 }}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <span className="text-white/50 text-xs text-center">
            {completed
              ? `${character.name} is proud! 🎉`
              : `${character.name} is watching! ⭐`}
          </span>
        </motion.div>
      </div>

      <CelebrationOverlay show={celebrate} onDone={advance} />
    </div>
  )
}
