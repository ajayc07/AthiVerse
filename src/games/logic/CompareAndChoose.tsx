/**
 * Compare & Choose
 * Two big hero cards side by side and a real-data question where the pair
 * differs: "Who can fly?", "Who uses a sword?", "Who can swim?" — plus
 * "Who is faster?" (speed ranks) once deduction mastery grows.
 */

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CharacterCard } from '@/components/CharacterCard'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { useIdleNudge } from '@/hooks/useIdleNudge'
import { shuffle, pickOne } from '@/utils/helpers'
import type { Character } from '@/types'
import allCharacters from '@/data/characters.json'

const TOTAL_ROUNDS = 5
const SPEED_RANK: Record<Character['speed'], number> = { slow: 0, medium: 1, fast: 2, ultra: 3 }

interface Comparison {
  id: string
  question: string
  emoji: string
  /** Pick a [correct, other] pair from the pool, or null if impossible */
  buildPair: (pool: Character[]) => [Character, Character] | null
}

function booleanPair(pool: Character[], key: 'canFly' | 'canSwim' | 'canUseSword'): [Character, Character] | null {
  const withAttr = pool.filter(c => c[key])
  const without = pool.filter(c => !c[key])
  if (withAttr.length < 1 || without.length < 1) return null
  return [pickOne(withAttr), pickOne(without)]
}

const COMPARISONS: Comparison[] = [
  { id: 'fly',   question: 'Who can fly?',      emoji: '🦅', buildPair: p => booleanPair(p, 'canFly') },
  { id: 'swim',  question: 'Who can swim?',     emoji: '🌊', buildPair: p => booleanPair(p, 'canSwim') },
  { id: 'sword', question: 'Who uses a sword?', emoji: '⚔️', buildPair: p => booleanPair(p, 'canUseSword') }
]

const SPEED_COMPARISON: Comparison = {
  id: 'speed',
  question: 'Who is faster?',
  emoji: '💨',
  buildPair: pool => {
    for (let tries = 0; tries < 12; tries++) {
      const a = pickOne(pool)
      const b = pickOne(pool)
      if (a.id !== b.id && SPEED_RANK[a.speed] !== SPEED_RANK[b.speed]) {
        return SPEED_RANK[a.speed] > SPEED_RANK[b.speed] ? [a, b] : [b, a]
      }
    }
    return null
  }
}

interface Round {
  comparison: Comparison
  pair: Character[]      // display order (shuffled)
  correctId: string
}

function buildRound(comparisons: Comparison[], universe?: string): Round {
  const all = allCharacters as Character[]
  const universePool = universe ? all.filter(c => c.universe === universe) : all

  // Try comparisons in random order, universe pool first, full pool as fallback
  for (const pool of [universePool, all]) {
    for (const comparison of shuffle(comparisons)) {
      const result = comparison.buildPair(pool)
      if (result) {
        const [correct, other] = result
        return { comparison, pair: shuffle([correct, other]), correctId: correct.id }
      }
    }
  }
  // Unreachable with the shipped 41-character dataset; satisfies TS
  throw new Error('CompareAndChoose: no valid comparison pair found')
}

interface Props {
  universe?: string
  onComplete: (stars: number) => void
}

export function CompareAndChoose({ universe, onComplete }: Props) {
  const profile = useProfileStore(s => s.activeProfile)
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong, playChar } = useAudio()

  // Speed ranking is a two-step reasoning task — added once deduction grows
  const comparisons = (profile?.skillNodes.logic_deduction?.masteryScore ?? 0) >= 40
    ? [...COMPARISONS, SPEED_COMPARISON]
    : COMPARISONS

  const [round, setRound] = useState<Round>(() => buildRound(comparisons, universe))
  const [questionNum, setQuestionNum] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [stars, setStars] = useState(0)
  const [done, setDone] = useState(false)
  const nudge = useIdleNudge(questionNum, 6000, selected === null && !done)

  const advance = useCallback(() => {
    setCelebrate(false)
    setSelected(null)
    if (questionNum >= TOTAL_ROUNDS) { setDone(true); return }
    setQuestionNum(q => q + 1)
    setRound(buildRound(comparisons, universe))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionNum, universe])

  const handleAnswer = useCallback(async (charId: string) => {
    if (selected !== null) return
    const correct = charId === round.correctId
    setSelected(charId)

    await playChar(charId)
    await (correct ? playCorrect() : playWrong())
    await recordAnswer('logic_deduction', correct)
    recordResult({
      questionId: `compare-${questionNum}`,
      templateId: 'find_by_attribute',
      skillNode: 'logic_deduction',
      correct,
      timeMs: 0,
      answeredAt: new Date().toISOString()
    })

    if (correct) { setStars(s => s + 1); setCelebrate(true) }
    else setTimeout(advance, 2200)
  }, [selected, round, questionNum, advance, playChar, playCorrect, playWrong, recordAnswer, recordResult])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Compare & Choose ⚖️" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        <motion.div
          key={questionNum}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-white text-2xl font-hero">
            {round.comparison.question} {round.comparison.emoji}
          </p>
        </motion.div>

        <div className={`flex gap-6 items-center justify-center ${nudge ? 'animate-wiggle' : ''}`}>
          {round.pair.map((char, i) => {
            const isSelected = selected === char.id
            const isCorrect = selected !== null && char.id === round.correctId
            const isWrong = isSelected && char.id !== round.correctId

            return (
              <div key={char.id} className="flex items-center gap-6">
                {i === 1 && <span className="text-white/40 font-hero text-2xl">VS</span>}
                <motion.div
                  initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={!selected ? { scale: 1.05 } : {}}
                  whileTap={!selected ? { scale: 0.95 } : {}}
                  onClick={() => handleAnswer(char.id)}
                  className="relative cursor-pointer"
                >
                  <CharacterCard
                    character={char}
                    size="xl"
                    correct={isCorrect || undefined}
                    wrong={isWrong || undefined}
                    showName
                    animate={false}
                  />
                  {isCorrect && (
                    <motion.span
                      initial={{ opacity: 0, y: 10, scale: 0.5 }}
                      animate={{ opacity: 1, y: -14, scale: 1.4 }}
                      transition={{ duration: 0.6 }}
                      className="absolute -top-2 left-1/2 -translate-x-1/2 text-3xl pointer-events-none"
                    >
                      {round.comparison.emoji}
                    </motion.span>
                  )}
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>

      <CelebrationOverlay show={celebrate} onDone={advance} />
    </div>
  )
}
