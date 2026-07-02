/**
 * Who Am I?
 * Shows a blurred mystery hero with visual emoji clues.
 * A progressive HINT button deblurs the hero so the child can work it out.
 * After a wrong guess the correct card is highlighted before advancing.
 */

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CharacterCard } from '@/components/CharacterCard'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { generateQuestion } from '@/engine/QuestionGenerator'
import type { Question, Character } from '@/types'
import allCharacters from '@/data/characters.json'

const TOTAL_ROUNDS = 5

// Map clue text snippets → emoji so clues are visual, not reading-dependent
function clueToEmoji(clue: string): string {
  const t = clue.toLowerCase()
  if (t.includes('red'))                          return '🔴'
  if (t.includes('blue'))                         return '🔵'
  if (t.includes('yellow') || t.includes('gold')) return '🟡'
  if (t.includes('green'))                        return '🟢'
  if (t.includes('purple') || t.includes('violet')) return '🟣'
  if (t.includes('orange'))                       return '🟠'
  if (t.includes('white') || t.includes('silver')) return '⚪'
  if (t.includes('black'))                        return '⚫'
  if (t.includes('fly'))                          return '🦅'
  if (t.includes('swim'))                         return '🌊'
  if (t.includes('sword'))                        return '⚔️'
  if (t.includes('web'))                          return '🕸️'
  if (t.includes('lightning') || t.includes('thunder')) return '⚡'
  if (t.includes('fire'))                         return '🔥'
  if (t.includes('ice') || t.includes('freeze'))  return '❄️'
  if (t.includes('strength'))                     return '💪'
  if (t.includes('speed') || t.includes('fast'))  return '💨'
  if (t.includes('heal'))                         return '❤️‍🔥'
  if (t.includes('wall') || t.includes('crawl'))  return '🧱'
  if (t.includes('energy') || t.includes('blast')) return '💥'
  return '⭐'
}

interface Props {
  universe?: string
  onComplete: (stars: number) => void
}

export function WhoAmI({ universe, onComplete }: Props) {
  const profile      = useProfileStore(s => s.activeProfile)
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong, playChar } = useAudio()
  const favorites = profile?.favoriteCharacters ?? []

  const nextQuestion = useCallback(() =>
    generateQuestion({
      templateId: 'who_am_i',
      universe: universe as any,
      maxOptions: profile?.ageConfig.maxOptionsPerQuestion ?? 3,
      favoriteCharacters: favorites,
    }), [universe, favorites])

  const [question, setQuestion]     = useState<Question | null>(() => nextQuestion())
  const [questionNum, setQuestionNum] = useState(1)
  const [selected, setSelected]     = useState<string | null>(null)
  const [celebrate, setCelebrate]   = useState(false)
  const [stars, setStars]           = useState(0)
  const [done, setDone]             = useState(false)
  const [blurPx, setBlurPx]         = useState(12)
  const [hintsUsed, setHintsUsed]   = useState(0)

  const advance = useCallback(() => {
    setCelebrate(false)
    setSelected(null)
    setBlurPx(12)
    setHintsUsed(0)
    if (questionNum >= TOTAL_ROUNDS) { setDone(true); return }
    setQuestionNum(q => q + 1)
    setQuestion(nextQuestion())
  }, [questionNum, nextQuestion])

  const handleHint = useCallback(async () => {
    if (hintsUsed === 0) {
      setBlurPx(6)
      setHintsUsed(1)
    } else if (hintsUsed === 1) {
      setBlurPx(0)
      if (question) await playChar(question.correctAnswer)
      setHintsUsed(2)
    }
  }, [hintsUsed, question, playChar])

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
      skillNode:  'logic_deduction',
      correct,
      timeMs:     0,
      answeredAt: new Date().toISOString(),
    })

    if (correct) {
      setStars(s => s + 1)
      setCelebrate(true)
    } else {
      setBlurPx(0)          // fully reveal the mystery hero
      setTimeout(advance, 2500)
    }
  }, [selected, question, advance, playChar, playCorrect, playWrong, recordAnswer, recordResult])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  if (!question) return null

  const correctChar = (allCharacters as Character[]).find(c => c.id === question.correctAnswer)
  if (!correctChar) return null

  // Parse clues: keep only "I …" sentences
  const rawClues = question.prompt
    .split(/[.!]/)
    .map(s => s.trim())
    .filter(s => /^i /i.test(s))

  const getChar = (id: string) => (allCharacters as Character[]).find(c => c.id === id)

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Who Am I? 🦸" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">

        {/* Mystery hero — blurred; clears when hinted or after wrong answer */}
        <motion.div
          key={questionNum}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div style={{ filter: `blur(${blurPx}px)`, transition: 'filter 0.55s ease' }}>
            <CharacterCard character={correctChar} size="xl" animate={false} />
          </div>
          {blurPx > 5 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-5xl">❓</span>
            </div>
          )}
        </motion.div>

        {/* Emoji clues */}
        {rawClues.length > 0 && (
          <div className="flex gap-3 justify-center flex-wrap">
            {rawClues.map((clue, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="bg-white/15 rounded-2xl px-3 py-2 flex flex-col items-center gap-1 min-w-[56px]"
              >
                <span className="text-3xl leading-none">{clueToEmoji(clue)}</span>
                <span className="text-white/65 text-[10px] text-center leading-tight max-w-[64px]">{clue}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Progressive HINT button */}
        {hintsUsed < 2 && !selected && (
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleHint}
            className="flex items-center gap-2 bg-yellow-400/85 text-black font-bold px-5 py-2 rounded-2xl border-2 border-yellow-300 text-base"
          >
            <span>💡</span>
            <span>{hintsUsed === 0 ? 'Hint — peek a little!' : 'Hint — show me!'}</span>
          </motion.button>
        )}

        <p className="text-white/65 text-base font-bold">Who am I? 👇</p>

        {/* Character choices */}
        <div className="flex gap-4 justify-center flex-wrap">
          {question.options.map(opt => {
            const char = getChar(opt.value)
            if (!char) return null

            const isSelected      = selected === char.id
            const isCorrect       = char.id === question.correctAnswer
            const isWrongSelected = isSelected && !isCorrect
            // Reveal correct card (pulse) when the user picked the wrong one
            const isReveal        = !!(selected && isCorrect && !isSelected)

            return (
              <motion.div
                key={char.id}
                animate={isReveal ? { scale: [1, 1.12, 1, 1.12, 1] } : {}}
                transition={{ duration: 0.7, repeat: isReveal ? Infinity : 0, repeatType: 'loop' }}
                whileHover={!selected ? { scale: 1.05 } : {}}
                whileTap={!selected ? { scale: 0.95 } : {}}
                onClick={() => handleAnswer(char.id)}
                className="cursor-pointer flex flex-col items-center gap-1"
              >
                {isReveal && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-yellow-300 text-xs font-bold text-center"
                  >
                    👆 This one!
                  </motion.p>
                )}
                <CharacterCard
                  character={char}
                  size="lg"
                  correct={selected !== null && isCorrect ? true : undefined}
                  wrong={isWrongSelected || undefined}
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
