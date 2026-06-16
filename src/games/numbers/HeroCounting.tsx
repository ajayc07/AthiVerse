/**
 * Hero Counting
 * Shows N character cards. Child taps the correct number.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CharacterCard } from '@/components/CharacterCard'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { shuffle, pickRandom } from '@/utils/helpers'
import type { Character } from '@/types'
import allCharacters from '@/data/characters.json'

const TOTAL_ROUNDS = 5

interface Round {
  characters: Character[]
  correctCount: number
  options: number[]
}

function buildRound(maxCount: number, universe?: string): Round {
  const pool = universe
    ? (allCharacters as Character[]).filter(c => c.universe === universe)
    : (allCharacters as Character[])

  // Cap to pool size so we never ask for more characters than exist
  const effectiveMax = Math.min(maxCount, pool.length)
  const correctCount = Math.floor(Math.random() * effectiveMax) + 1
  const chars = pickRandom(pool, correctCount)

  // Build adjacent distractors so wrong options are always plausible
  const wrongOptions = new Set<number>()
  for (let delta = 1; wrongOptions.size < 2; delta++) {
    if (correctCount - delta >= 1) wrongOptions.add(correctCount - delta)
    if (wrongOptions.size < 2 && correctCount + delta <= effectiveMax) wrongOptions.add(correctCount + delta)
    if (delta > effectiveMax) break
  }
  // Fallback: fill with any valid number if adjacency couldn't produce 2 values
  for (let n = 1; wrongOptions.size < 2; n++) {
    if (n !== correctCount) wrongOptions.add(n)
  }
  const options = shuffle([correctCount, ...Array.from(wrongOptions).slice(0, 2)])

  return { characters: chars, correctCount, options }
}

interface Props {
  universe?: string
  onComplete: (stars: number) => void
}

export function HeroCounting({ universe, onComplete }: Props) {
  const profile = useProfileStore(s => s.activeProfile)
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong } = useAudio()

  const maxCount = profile?.skillNodes.count_1_15?.masteryScore >= 80 ? 20
    : profile?.skillNodes.count_1_10?.masteryScore >= 80 ? 15 : 10

  const [round, setRound] = useState<Round>(() => buildRound(maxCount, universe))
  const [questionNum, setQuestionNum] = useState(1)
  const [selected, setSelected] = useState<number | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [stars, setStars] = useState(0)
  const [done, setDone] = useState(false)
  const startTime = useState(() => Date.now())[0]

  const advance = useCallback(() => {
    setCelebrate(false)
    setSelected(null)
    if (questionNum >= TOTAL_ROUNDS) {
      setDone(true)
      return
    }
    setQuestionNum(q => q + 1)
    setRound(buildRound(maxCount, universe))
  }, [questionNum, maxCount, universe])

  const handleAnswer = useCallback(async (n: number) => {
    if (selected !== null) return
    const correct = n === round.correctCount
    setSelected(n)

    await (correct ? playCorrect() : playWrong())
    await recordAnswer('count_1_10', correct)
    recordResult({
      questionId: `count-${questionNum}`,
      templateId: 'count_objects',
      skillNode: 'count_1_10',
      correct,
      timeMs: Date.now() - startTime,
      answeredAt: new Date().toISOString()
    })

    if (correct) {
      setStars(s => s + 1)
      setCelebrate(true)
    } else {
      setTimeout(advance, 1000)
    }
  }, [selected, round, questionNum, advance])

  useEffect(() => {
    if (done) onComplete(stars)
  }, [done, stars, onComplete])

  return (
    <div className="flex flex-col h-full">
      <GameHeader
        title="Hero Counting 🔢"
        current={questionNum - 1}
        total={TOTAL_ROUNDS}
        stars={stars}
      />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        {/* Question */}
        <motion.div
          key={questionNum}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-2xl font-bold text-center"
        >
          How many heroes do you see? 👀
        </motion.div>

        {/* Characters */}
        <motion.div
          key={`chars-${questionNum}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-wrap justify-center gap-3 max-w-xs"
        >
          {round.characters.map((char, i) => (
            <motion.div
              key={char.id + i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <CharacterCard character={char} size="md" animate={false} />
            </motion.div>
          ))}
        </motion.div>

        {/* Number options */}
        <div className="flex gap-4 mt-2">
          {round.options.map(n => {
            const isSelected = selected === n
            const isCorrect = isSelected && n === round.correctCount
            const isWrong = isSelected && n !== round.correctCount

            return (
              <motion.button
                key={n}
                whileHover={!selected ? { scale: 1.1 } : {}}
                whileTap={!selected ? { scale: 0.9 } : {}}
                animate={isWrong ? { x: [0, -10, 10, -10, 10, 0] } : isCorrect ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.4 }}
                onClick={() => handleAnswer(n)}
                disabled={selected !== null}
                className={`
                  w-20 h-20 rounded-2xl text-4xl font-bold border-4 transition-all
                  ${isCorrect ? 'bg-green-400 border-green-300 text-white' : ''}
                  ${isWrong ? 'bg-red-400 border-red-300 text-white' : ''}
                  ${!isSelected ? 'bg-white/10 border-white/30 text-white hover:bg-white/20' : ''}
                `}
              >
                {n}
              </motion.button>
            )
          })}
        </div>
      </div>

      <CelebrationOverlay show={celebrate} onDone={advance} />
    </div>
  )
}
