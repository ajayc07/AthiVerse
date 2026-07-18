/**
 * Number Hunt
 * A 3×3 grid of hero-badge number tiles. Find the called-out number!
 * Higher tiers mix in tricky distractors (reversed digits, close neighbors).
 */

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { useIdleNudge } from '@/hooks/useIdleNudge'
import { shuffle, pickRandom, countingNodeFor } from '@/utils/helpers'

const TOTAL_ROUNDS = 5
const GRID_SIZE = 9

interface Round {
  target: number
  tiles: number[]
}

function buildRound(target: number, maxNum: number): Round {
  const distractors = new Set<number>()

  // Tricky first: reversed digits (12 ↔ 21) and close neighbors
  const reversed = Number(String(target).split('').reverse().join(''))
  if (reversed !== target && reversed >= 1 && reversed <= maxNum) distractors.add(reversed)
  for (let delta = 1; distractors.size < GRID_SIZE - 1 && delta <= maxNum; delta++) {
    if (target - delta >= 1) distractors.add(target - delta)
    if (distractors.size < GRID_SIZE - 1 && target + delta <= maxNum) distractors.add(target + delta)
  }
  // Fill from the full range if the neighborhood ran out
  const rest = shuffle(Array.from({ length: maxNum }, (_, i) => i + 1)
    .filter(n => n !== target && !distractors.has(n)))
  for (const n of rest) {
    if (distractors.size >= GRID_SIZE - 1) break
    distractors.add(n)
  }

  const tiles = shuffle([target, ...shuffle(Array.from(distractors)).slice(0, GRID_SIZE - 1)])
  return { target, tiles }
}

interface Props {
  universe?: string
  onComplete: (stars: number) => void
}

export function NumberHunt({ onComplete }: Props) {
  const profile = useProfileStore(s => s.activeProfile)
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong } = useAudio()

  const maxNum = (profile?.skillNodes.count_1_15?.masteryScore ?? 0) >= 80 ? 20
    : (profile?.skillNodes.count_1_10?.masteryScore ?? 0) >= 80 ? 15 : 10

  // 5 distinct targets per game
  const [targetQueue] = useState(() =>
    pickRandom(Array.from({ length: maxNum }, (_, i) => i + 1), TOTAL_ROUNDS))
  const [round, setRound] = useState<Round>(() => buildRound(targetQueue[0], maxNum))
  const [questionNum, setQuestionNum] = useState(1)
  const [selected, setSelected] = useState<number | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [stars, setStars] = useState(0)
  const [done, setDone] = useState(false)
  const nudge = useIdleNudge(questionNum, 6000, selected === null && !done)

  const advance = useCallback(() => {
    setCelebrate(false)
    setSelected(null)
    if (questionNum >= TOTAL_ROUNDS) { setDone(true); return }
    setQuestionNum(q => q + 1)
    setRound(buildRound(targetQueue[questionNum], maxNum))
  }, [questionNum, targetQueue, maxNum])

  const handleAnswer = useCallback(async (n: number) => {
    if (selected !== null) return
    const correct = n === round.target
    setSelected(n)

    const skillNode = countingNodeFor(round.target)
    await (correct ? playCorrect() : playWrong())
    await recordAnswer(skillNode, correct)
    recordResult({
      questionId: `hunt-${questionNum}`,
      templateId: 'count_objects',
      skillNode,
      correct,
      timeMs: 0,
      answeredAt: new Date().toISOString()
    })

    if (correct) { setStars(s => s + 1); setCelebrate(true) }
    else setTimeout(advance, 2000)
  }, [selected, round, questionNum, advance, playCorrect, playWrong, recordAnswer, recordResult])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Number Hunt 🔭" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        <motion.div
          key={questionNum}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="text-white text-xl font-hero">Find the number… 🔭</p>
          <motion.p
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="text-yellow-300 font-hero text-6xl mt-1"
          >
            {round.target}
          </motion.p>
        </motion.div>

        {/* 3×3 badge grid */}
        <div className={`grid grid-cols-3 gap-3 ${nudge ? 'animate-wiggle' : ''}`}>
          {round.tiles.map((n, i) => {
            const revealed = selected !== null
            const showCorrect = revealed && n === round.target
            const isWrong = selected === n && n !== round.target

            return (
              <motion.button
                key={`${n}-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={
                  isWrong ? { opacity: 1, scale: 1, x: [0, -8, 8, -8, 0] }
                  : showCorrect ? { opacity: 1, scale: [1, 1.15, 1, 1.1, 1] }
                  : { opacity: 1, scale: 1 }
                }
                transition={{ delay: selected === null ? i * 0.05 : 0, duration: 0.4 }}
                whileHover={!selected ? { scale: 1.08 } : {}}
                whileTap={!selected ? { scale: 0.92 } : {}}
                onClick={() => handleAnswer(n)}
                disabled={selected !== null}
                className={`
                  w-20 h-20 rounded-2xl text-3xl font-bold border-4 transition-all
                  ${showCorrect ? 'bg-green-400 border-green-300 text-white' : ''}
                  ${isWrong ? 'bg-red-400 border-red-300 text-white' : ''}
                  ${!showCorrect && !isWrong ? 'bg-indigo-500/30 border-indigo-400/50 text-white' : ''}
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
