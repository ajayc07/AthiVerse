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
import { useIdleNudge } from '@/hooks/useIdleNudge'
import { shuffle, pickRandom } from '@/utils/helpers'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const TOTAL_ROUNDS = 5

function buildRound(correct: string) {
  const wrong = shuffle(LETTERS.filter(l => l !== correct)).slice(0, 2)
  const options = shuffle([correct, ...wrong])
  return { capital: correct, options }
}

interface Props {
  onComplete: (stars: number) => void
}

export function CapitalToSmallMatch({ onComplete }: Props) {
  const profile = useProfileStore(s => s.activeProfile)
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong } = useAudio()

  // 5 distinct letters per game so rounds never repeat
  const [letterQueue] = useState(() => pickRandom(LETTERS, TOTAL_ROUNDS))
  const [round, setRound] = useState(() => buildRound(letterQueue[0]))
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
    setRound(buildRound(letterQueue[questionNum]))
  }, [questionNum, letterQueue])

  const handleAnswer = useCallback(async (letter: string) => {
    if (selected) return
    const correct = letter === round.capital
    setSelected(letter)

    // Once small_letters is unlocked, credit it so the alphabet chain can progress
    const skillNode = profile?.skillNodes.small_letters?.unlocked ? 'small_letters' as const : 'capital_letters' as const
    await (correct ? playCorrect() : playWrong())
    await recordAnswer(skillNode, correct)
    recordResult({
      questionId: `letter-${questionNum}`,
      templateId: 'find_by_first_letter',
      skillNode,
      correct,
      timeMs: 0,
      answeredAt: new Date().toISOString()
    })

    if (correct) { setStars(s => s + 1); setCelebrate(true) }
    else setTimeout(advance, 2000)
  }, [selected, round, questionNum, advance, profile])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Letter Match 🔤" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        <p className="text-white text-2xl font-hero text-center">
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
        <div className={`flex gap-4 ${nudge ? 'animate-wiggle' : ''}`}>
          {round.options.map(letter => {
            // After any pick, always reveal the matching small letter in green
            const revealed = selected !== null
            const showCorrect = revealed && letter === round.capital
            const isWrong = selected === letter && letter !== round.capital

            return (
              <motion.button
                key={letter}
                whileHover={!selected ? { scale: 1.1 } : {}}
                whileTap={!selected ? { scale: 0.9 } : {}}
                animate={isWrong ? { x: [0, -10, 10, -10, 10, 0] } : showCorrect ? { scale: [1, 1.15, 1, 1.1, 1] } : {}}
                transition={{ duration: 0.6 }}
                onClick={() => handleAnswer(letter)}
                disabled={!!selected}
                className={`
                  w-24 h-24 rounded-2xl text-5xl font-bold border-4 transition-all
                  ${showCorrect ? 'bg-green-400 border-green-300 text-white' : ''}
                  ${isWrong ? 'bg-red-400 border-red-300 text-white' : ''}
                  ${!showCorrect && !isWrong ? 'bg-white/10 border-white/30 text-white' : ''}
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
