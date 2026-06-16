/**
 * Capital to Small Match
 * Shows a capital letter, child picks the matching small letter.
 */

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { shuffle, pickRandom } from '@/utils/helpers'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const TOTAL_ROUNDS = 5

function buildRound() {
  const correct = pickRandom(LETTERS, 1)[0]
  const wrong = shuffle(LETTERS.filter(l => l !== correct)).slice(0, 2)
  const options = shuffle([correct, ...wrong])
  return { capital: correct, options }
}

interface Props {
  onComplete: (stars: number) => void
}

export function CapitalToSmallMatch({ onComplete }: Props) {
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong } = useAudio()

  const [round, setRound] = useState(() => buildRound())
  const [questionNum, setQuestionNum] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [stars, setStars] = useState(0)
  const [done, setDone] = useState(false)

  const advance = useCallback(() => {
    setCelebrate(false)
    setSelected(null)
    if (questionNum >= TOTAL_ROUNDS) { setDone(true); return }
    setQuestionNum(q => q + 1)
    setRound(buildRound())
  }, [questionNum])

  const handleAnswer = useCallback(async (letter: string) => {
    if (selected) return
    const correct = letter === round.capital
    setSelected(letter)

    await (correct ? playCorrect() : playWrong())
    await recordAnswer('capital_letters', correct)
    recordResult({
      questionId: `letter-${questionNum}`,
      templateId: 'find_by_first_letter',
      skillNode: 'capital_letters',
      correct,
      timeMs: 0,
      answeredAt: new Date().toISOString()
    })

    if (correct) { setStars(s => s + 1); setCelebrate(true) }
    else setTimeout(advance, 1200)
  }, [selected, round, questionNum, advance])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Letter Match 🔤" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        <p className="text-white text-2xl font-bold text-center">
          Find the small letter! 🔤
        </p>

        {/* Big capital letter */}
        <motion.div
          key={round.capital}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="w-32 h-32 bg-indigo-500 rounded-3xl flex items-center justify-center shadow-xl border-4 border-indigo-300"
        >
          <span className="text-white font-bold text-7xl leading-none">{round.capital}</span>
        </motion.div>

        <p className="text-white/60 text-base">↓ Which one matches? ↓</p>

        {/* Small letter options */}
        <div className="flex gap-4">
          {round.options.map(letter => {
            const isSelected = selected === letter
            const isCorrect = isSelected && letter === round.capital
            const isWrong = isSelected && letter !== round.capital

            return (
              <motion.button
                key={letter}
                whileHover={!selected ? { scale: 1.1 } : {}}
                whileTap={!selected ? { scale: 0.9 } : {}}
                onClick={() => handleAnswer(letter)}
                disabled={!!selected}
                className={`
                  w-24 h-24 rounded-2xl text-5xl font-bold border-4 transition-all
                  ${isCorrect ? 'bg-green-400 border-green-300 text-white' : ''}
                  ${isWrong ? 'bg-red-400 border-red-300 text-white' : ''}
                  ${!isSelected ? 'bg-white/10 border-white/30 text-white' : ''}
                `}
              >
                {letter.toLowerCase()}
              </motion.button>
            )
          })}
        </div>
      </div>

      <CelebrationOverlay show={celebrate} onDone={advance} />
    </div>
  )
}
