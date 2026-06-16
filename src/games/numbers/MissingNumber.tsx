/**
 * Missing Number
 * Shows a sequence with one number missing. Child picks the correct number.
 */

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { shuffle } from '@/utils/helpers'

const TOTAL_ROUNDS = 5

function buildRound(maxNum: number) {
  const seqLen = 5
  const start = Math.floor(Math.random() * (maxNum - seqLen)) + 1
  const sequence = Array.from({ length: seqLen }, (_, i) => start + i)
  const missingIdx = Math.floor(Math.random() * seqLen)
  const missingNum = sequence[missingIdx]

  // Wrong options
  const wrong = new Set<number>()
  while (wrong.size < 2) {
    const w = Math.floor(Math.random() * maxNum) + 1
    if (w !== missingNum) wrong.add(w)
  }
  const options = shuffle([missingNum, ...Array.from(wrong)])

  return { sequence, missingIdx, missingNum, options }
}

interface Props {
  universe?: string
  onComplete: (stars: number) => void
}

export function MissingNumber({ onComplete }: Props) {
  const profile = useProfileStore(s => s.activeProfile)
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong } = useAudio()

  const maxNum = (profile?.skillNodes.count_1_15?.masteryScore ?? 0) >= 80 ? 20
    : (profile?.skillNodes.count_1_10?.masteryScore ?? 0) >= 80 ? 15 : 10

  const [round, setRound] = useState(() => buildRound(maxNum))
  const [questionNum, setQuestionNum] = useState(1)
  const [selected, setSelected] = useState<number | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [stars, setStars] = useState(0)
  const [done, setDone] = useState(false)

  const advance = useCallback(() => {
    setCelebrate(false)
    setSelected(null)
    if (questionNum >= TOTAL_ROUNDS) { setDone(true); return }
    setQuestionNum(q => q + 1)
    setRound(buildRound(maxNum))
  }, [questionNum, maxNum])

  const handleAnswer = useCallback(async (n: number) => {
    if (selected !== null) return
    const correct = n === round.missingNum
    setSelected(n)

    await (correct ? playCorrect() : playWrong())
    await recordAnswer('count_1_10', correct)
    recordResult({
      questionId: `missing-${questionNum}`,
      templateId: 'count_objects',
      skillNode: 'count_1_10',
      correct,
      timeMs: 0,
      answeredAt: new Date().toISOString()
    })

    if (correct) {
      setStars(s => s + 1)
      setCelebrate(true)
    } else {
      setTimeout(advance, 1200)
    }
  }, [selected, round, questionNum, advance])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Missing Number ❓" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        <motion.p
          key={questionNum}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-2xl font-bold text-center"
        >
          What number is missing? 🤔
        </motion.p>

        {/* Sequence */}
        <div className="flex gap-2 flex-wrap justify-center">
          {round.sequence.map((n, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className={`
                w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl border-2
                ${i === round.missingIdx
                  ? 'bg-yellow-400/20 border-yellow-400 border-dashed text-yellow-400'
                  : 'bg-white/10 border-white/30 text-white'}
              `}
            >
              {i === round.missingIdx ? '?' : n}
            </motion.div>
          ))}
        </div>

        {/* Options */}
        <div className="flex gap-4">
          {round.options.map(n => {
            const isSelected = selected === n
            const isCorrect = isSelected && n === round.missingNum
            const isWrong = isSelected && n !== round.missingNum

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
                  ${!isSelected ? 'bg-white/10 border-white/30 text-white' : ''}
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
