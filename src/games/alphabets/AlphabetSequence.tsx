/**
 * ABC Order
 * Shows a 4-letter alphabet run with one letter missing (A B ? D).
 * Child picks the missing letter from three options.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { useIdleNudge } from '@/hooks/useIdleNudge'
import { shuffle } from '@/utils/helpers'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const TOTAL_ROUNDS = 5
const RUN_LENGTH = 4

interface Round {
  run: string[]
  missingIdx: number
  missingLetter: string
  options: string[]
}

function buildRound(advanced: boolean, usedLetters: Set<string>): Round {
  // Base tier: runs stay in the familiar A–F zone and the gap is never first
  const maxStart = advanced ? LETTERS.length - RUN_LENGTH : 2

  // Dedup: retry until the missing letter is one we haven't asked yet this game
  // (base tier only has B–F as possible answers — exactly enough for 5 rounds)
  let start = 0
  let missingIdx = 1
  for (let attempt = 0; attempt < 40; attempt++) {
    start = Math.floor(Math.random() * (maxStart + 1))
    missingIdx = advanced
      ? Math.floor(Math.random() * RUN_LENGTH)
      : 1 + Math.floor(Math.random() * (RUN_LENGTH - 1))
    if (!usedLetters.has(LETTERS[start + missingIdx])) break
  }

  const run = LETTERS.slice(start, start + RUN_LENGTH)
  const missingLetter = run[missingIdx]
  usedLetters.add(missingLetter)

  // Distractors: nearby letters that are NOT visible in the run
  const missingPos = LETTERS.indexOf(missingLetter)
  const wrong = new Set<string>()
  for (let delta = 2; wrong.size < 2 && delta < LETTERS.length; delta++) {
    const before = LETTERS[missingPos - delta]
    const after = LETTERS[missingPos + delta]
    if (before && !run.includes(before)) wrong.add(before)
    if (wrong.size < 2 && after && !run.includes(after)) wrong.add(after)
  }
  const options = shuffle([missingLetter, ...Array.from(wrong).slice(0, 2)])

  return { run, missingIdx, missingLetter, options }
}

interface Props {
  onComplete: (stars: number) => void
}

export function AlphabetSequence({ onComplete }: Props) {
  const profile = useProfileStore(s => s.activeProfile)
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong } = useAudio()

  const advanced = (profile?.skillNodes.alphabet_sequence?.masteryScore ?? 0) >= 40

  const usedLetters = useRef<Set<string>>(new Set())
  const [round, setRound] = useState<Round>(() => {
    usedLetters.current.clear()  // StrictMode double-init safety
    return buildRound(advanced, usedLetters.current)
  })
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
    setRound(buildRound(advanced, usedLetters.current))
  }, [questionNum, advanced])

  const handleAnswer = useCallback(async (letter: string) => {
    if (selected !== null) return
    const correct = letter === round.missingLetter
    setSelected(letter)

    await (correct ? playCorrect() : playWrong())
    await recordAnswer('alphabet_sequence', correct)
    recordResult({
      questionId: `abc-${questionNum}`,
      templateId: 'find_by_first_letter',
      skillNode: 'alphabet_sequence',
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
      <GameHeader title="ABC Order 🔡" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        <motion.p
          key={questionNum}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-2xl font-hero text-center"
        >
          Which letter is missing? 🔡
        </motion.p>

        {/* Letter run */}
        <div className="flex gap-2 flex-wrap justify-center">
          {round.run.map((letter, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className={`
                w-16 h-16 rounded-xl flex items-center justify-center font-bold text-3xl border-2
                ${i === round.missingIdx
                  ? 'bg-yellow-400/20 border-yellow-400 border-dashed text-yellow-400'
                  : 'bg-purple-500/25 border-purple-400/50 text-white'}
              `}
            >
              {i === round.missingIdx ? '?' : letter}
            </motion.div>
          ))}
        </div>

        {/* Options */}
        <div className={`flex gap-4 ${nudge ? 'animate-wiggle' : ''}`}>
          {round.options.map(letter => {
            const revealed = selected !== null
            const showCorrect = revealed && letter === round.missingLetter
            const isWrong = selected === letter && letter !== round.missingLetter

            return (
              <motion.button
                key={letter}
                whileHover={!selected ? { scale: 1.1 } : {}}
                whileTap={!selected ? { scale: 0.9 } : {}}
                animate={isWrong ? { x: [0, -10, 10, -10, 10, 0] } : showCorrect ? { scale: [1, 1.15, 1, 1.1, 1] } : {}}
                transition={{ duration: 0.6 }}
                onClick={() => handleAnswer(letter)}
                disabled={selected !== null}
                className={`
                  w-20 h-20 rounded-2xl text-4xl font-bold border-4 transition-all
                  ${showCorrect ? 'bg-green-400 border-green-300 text-white' : ''}
                  ${isWrong ? 'bg-red-400 border-red-300 text-white' : ''}
                  ${!showCorrect && !isWrong ? 'bg-white/10 border-white/30 text-white' : ''}
                `}
              >
                {letter}
              </motion.button>
            )
          })}
        </div>
      </div>

      <CelebrationOverlay show={celebrate} onDone={advance} />
    </div>
  )
}
