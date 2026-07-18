/**
 * Hero Counting
 * Shows N character cards. Child taps the correct number.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CharacterCard } from '@/components/CharacterCard'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { useIdleNudge } from '@/hooks/useIdleNudge'
import { pickRandom, buildAdjacentOptions, countingNodeFor } from '@/utils/helpers'
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

  const options = buildAdjacentOptions(correctCount, effectiveMax)

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

  const maxCount = (profile?.skillNodes.count_1_15?.masteryScore ?? 0) >= 80 ? 20
    : (profile?.skillNodes.count_1_10?.masteryScore ?? 0) >= 80 ? 15 : 10

  const [round, setRound] = useState<Round>(() => buildRound(maxCount, universe))
  const [questionNum, setQuestionNum] = useState(1)
  const [selected, setSelected] = useState<number | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [stars, setStars] = useState(0)
  const [done, setDone] = useState(false)
  const startTimeRef = useRef(Date.now())
  const nudge = useIdleNudge(questionNum, 6000, selected === null && !done)

  const advance = useCallback(() => {
    setCelebrate(false)
    setSelected(null)
    if (questionNum >= TOTAL_ROUNDS) {
      setDone(true)
      return
    }
    setQuestionNum(q => q + 1)
    setRound(buildRound(maxCount, universe))
    startTimeRef.current = Date.now()
  }, [questionNum, maxCount, universe])

  const handleAnswer = useCallback(async (n: number) => {
    if (selected !== null) return
    const correct = n === round.correctCount
    setSelected(n)

    const skillNode = countingNodeFor(round.correctCount)
    await (correct ? playCorrect() : playWrong())
    await recordAnswer(skillNode, correct)
    recordResult({
      questionId: `count-${questionNum}`,
      templateId: 'count_objects',
      skillNode,
      correct,
      timeMs: Date.now() - startTimeRef.current,
      answeredAt: new Date().toISOString()
    })

    if (correct) {
      setStars(s => s + 1)
      setCelebrate(true)
    } else {
      setTimeout(advance, 2000)
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
          className="text-white text-2xl font-hero text-center"
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
        <div className={`flex gap-4 mt-2 ${nudge ? 'animate-wiggle' : ''}`}>
          {round.options.map(n => {
            // After any pick, always reveal the correct number in green so the child learns it
            const revealed = selected !== null
            const showCorrect = revealed && n === round.correctCount
            const isWrong = selected === n && n !== round.correctCount

            return (
              <motion.button
                key={n}
                whileHover={!selected ? { scale: 1.1 } : {}}
                whileTap={!selected ? { scale: 0.9 } : {}}
                animate={isWrong ? { x: [0, -10, 10, -10, 10, 0] } : showCorrect ? { scale: [1, 1.2, 1, 1.15, 1] } : {}}
                transition={{ duration: 0.6 }}
                onClick={() => handleAnswer(n)}
                disabled={selected !== null}
                className={`
                  w-20 h-20 rounded-2xl text-4xl font-bold border-4 transition-all
                  ${showCorrect ? 'bg-green-400 border-green-300 text-white' : ''}
                  ${isWrong ? 'bg-red-400 border-red-300 text-white' : ''}
                  ${!showCorrect && !isWrong ? 'bg-white/10 border-white/30 text-white hover:bg-white/20' : ''}
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
