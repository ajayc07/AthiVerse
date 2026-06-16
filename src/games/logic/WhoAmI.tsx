/**
 * Who Am I?
 * Shows clues about a hero. Child picks the right character.
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CharacterCard } from '@/components/CharacterCard'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { generateQuestion } from '@/engine/QuestionGenerator'
import type { Question } from '@/types'
import allCharacters from '@/data/characters.json'
import type { Character } from '@/types'

const TOTAL_ROUNDS = 5

interface Props {
  universe?: string
  onComplete: (stars: number) => void
}

export function WhoAmI({ universe, onComplete }: Props) {
  const profile = useProfileStore(s => s.activeProfile)
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong, playChar } = useAudio()
  const favorites = profile?.favoriteCharacters ?? []

  const nextQuestion = useCallback(() =>
    generateQuestion({
      templateId: 'who_am_i',
      universe: universe as any,
      maxOptions: profile?.ageConfig.maxOptionsPerQuestion ?? 3,
      favoriteCharacters: favorites
    }), [universe, favorites])

  const [question, setQuestion] = useState<Question | null>(() => nextQuestion())
  const [questionNum, setQuestionNum] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [stars, setStars] = useState(0)
  const [done, setDone] = useState(false)
  const [clueIndex, setClueIndex] = useState(0)

  const advance = useCallback(() => {
    setCelebrate(false)
    setSelected(null)
    setClueIndex(0)
    if (questionNum >= TOTAL_ROUNDS) { setDone(true); return }
    setQuestionNum(q => q + 1)
    setQuestion(nextQuestion())
  }, [questionNum, nextQuestion])

  const handleAnswer = useCallback(async (charId: string) => {
    if (selected || !question) return
    const correct = charId === question.correctAnswer
    setSelected(charId)

    await playChar(charId)
    await (correct ? playCorrect() : playWrong())
    await recordAnswer('logic_deduction', correct)
    recordResult({
      questionId: question.id,
      templateId: 'who_am_i',
      skillNode: 'logic_deduction',
      correct,
      timeMs: 0,
      answeredAt: new Date().toISOString()
    })

    if (correct) { setStars(s => s + 1); setCelebrate(true) }
    else setTimeout(advance, 1200)
  }, [selected, question, advance])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  if (!question) return null

  // Extract clues from prompt (split by ". " or "!")
  const clues = question.prompt.split(/[.!]/).filter(Boolean).map(s => s.trim())

  const getChar = (id: string) =>
    (allCharacters as Character[]).find(c => c.id === id)

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Who Am I? 🦸" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        {/* Clue box */}
        <motion.div
          key={questionNum}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 rounded-2xl p-5 w-full max-w-sm border border-white/20"
        >
          <p className="text-white/60 text-sm mb-2 text-center">🔍 Clues:</p>
          {clues.map((clue, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.3 }}
              className="text-white font-bold text-lg text-center"
            >
              {clue}
            </motion.p>
          ))}
        </motion.div>

        <p className="text-white/70 text-base font-bold">Who am I? 👇</p>

        {/* Character options */}
        <div className="flex gap-4 justify-center flex-wrap">
          {question.options.map(opt => {
            const char = getChar(opt.value)
            if (!char) return null
            const isSelected = selected === char.id
            const isCorrect = isSelected && char.id === question.correctAnswer
            const isWrong = isSelected && char.id !== question.correctAnswer

            return (
              <motion.div
                key={char.id}
                whileHover={!selected ? { scale: 1.05 } : {}}
                whileTap={!selected ? { scale: 0.95 } : {}}
                onClick={() => handleAnswer(char.id)}
                className="cursor-pointer"
              >
                <CharacterCard
                  character={char}
                  size="lg"
                  correct={isCorrect || undefined}
                  wrong={isWrong || undefined}
                  showName
                  animate={false}
                />
              </motion.div>
            )
          })}
        </div>
      </div>

      <CelebrationOverlay show={celebrate} onDone={advance} />
    </div>
  )
}
