/**
 * Color Sorting
 * Shows 3 heroes. Child picks the one matching the given color.
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
import { shuffle, weightedPickCharacters, pickOne, colorToHex } from '@/utils/helpers'
import type { Character } from '@/types'
import allCharacters from '@/data/characters.json'

const TOTAL_ROUNDS = 5

function buildRound(favorites: string[], universe?: string) {
  const pool = universe
    ? (allCharacters as Character[]).filter(c => c.universe === universe)
    : (allCharacters as Character[])

  // Pick a color first
  const colorsInPool = [...new Set(pool.flatMap(c => c.colors))]
  const targetColor = pickOne(colorsInPool)

  // Find characters with and without this color
  const withColor = pool.filter(c => c.colors.includes(targetColor))
  const withoutColor = pool.filter(c => !c.colors.includes(targetColor))

  if (withColor.length < 1 || withoutColor.length < 2) return null

  const correct = pickOne(weightedPickCharacters(withColor, favorites, 3))
  const distractors = shuffle(withoutColor).slice(0, 2)
  const chars = shuffle([correct, ...distractors])

  return { chars, targetColor, correctId: correct.id }
}

interface Props {
  universe?: string
  onComplete: (stars: number) => void
}

export function ColorSorting({ universe, onComplete }: Props) {
  const profile = useProfileStore(s => s.activeProfile)
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong, playChar } = useAudio()
  const favorites = profile?.favoriteCharacters ?? []

  // Fall back to the full pool when the chosen universe can't fill a round
  const [round, setRound] = useState(() => buildRound(favorites, universe) ?? buildRound(favorites))
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
    setRound(buildRound(favorites, universe) ?? buildRound(favorites))
  }, [questionNum, favorites, universe])

  const handleAnswer = useCallback(async (charId: string) => {
    if (selected || !round) return
    const correct = charId === round.correctId
    setSelected(charId)

    await playChar(charId)
    await (correct ? playCorrect() : playWrong())
    await recordAnswer('color_primary', correct)
    recordResult({
      questionId: `color-${questionNum}`,
      templateId: 'find_by_color',
      skillNode: 'color_primary',
      correct,
      timeMs: 0,
      answeredAt: new Date().toISOString()
    })

    if (correct) { setStars(s => s + 1); setCelebrate(true) }
    else setTimeout(advance, 2000)
  }, [selected, round, questionNum, advance])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  if (!round) return null

  const colorHex = colorToHex(round.targetColor)

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Color Sort 🎨" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        {/* Color display */}
        <motion.div
          key={round.targetColor}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex flex-col items-center gap-2"
        >
          <div
            className="w-20 h-20 rounded-2xl border-4 border-white/40 shadow-xl"
            style={{ backgroundColor: colorHex }}
          />
          <p className="text-white text-2xl font-hero capitalize">
            Find the {round.targetColor} hero! 🎨
          </p>
        </motion.div>

        {/* Characters */}
        <div className={`flex gap-4 justify-center flex-wrap ${nudge ? 'animate-wiggle' : ''}`}>
          {round.chars.map(char => {
            const isSelected = selected === char.id
            // After any pick, reveal the correct hero so the child learns the color
            const isCorrect = selected !== null && char.id === round.correctId
            const isWrong = isSelected && char.id !== round.correctId

            return (
              <motion.div
                key={char.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={!selected ? { scale: 1.05 } : {}}
                whileTap={!selected ? { scale: 0.95 } : {}}
                onClick={() => handleAnswer(char.id)}
                className="cursor-pointer"
              >
                <CharacterCard
                  character={char}
                  size="xl"
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
