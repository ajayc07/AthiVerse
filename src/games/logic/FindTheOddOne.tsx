/**
 * Find the Odd One
 * Shows 3 heroes from same universe + 1 from different. Find who doesn't belong.
 */

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CharacterCard } from '@/components/CharacterCard'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { shuffle, pickRandom, pickOne } from '@/utils/helpers'
import type { Character, Universe } from '@/types'
import allCharacters from '@/data/characters.json'

const TOTAL_ROUNDS = 5
const UNIVERSES: Universe[] = ['marvel', 'dc', 'naruto', 'onepiece', 'demonslayer']

function buildRound() {
  const pool = allCharacters as Character[]
  const mainUniverse = pickOne(UNIVERSES)
  const otherUniverses = UNIVERSES.filter(u => u !== mainUniverse)
  const oddUniverse = pickOne(otherUniverses)

  const mainChars = pool.filter(c => c.universe === mainUniverse)
  const oddChars = pool.filter(c => c.universe === oddUniverse)

  if (mainChars.length < 3 || oddChars.length < 1) return null

  const mainPicked = pickRandom(mainChars, 3)
  const oddChar = pickOne(oddChars)
  const chars = shuffle([...mainPicked, oddChar])

  return { chars, oddId: oddChar.id, mainUniverse }
}

const UNIVERSE_LABELS: Record<string, string> = {
  marvel: 'Marvel', dc: 'DC', naruto: 'Naruto', onepiece: 'One Piece', demonslayer: 'Demon Slayer'
}

interface Props {
  onComplete: (stars: number) => void
}

export function FindTheOddOne({ onComplete }: Props) {
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong, playChar } = useAudio()

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

  const handleAnswer = useCallback(async (charId: string) => {
    if (selected || !round) return
    const correct = charId === round.oddId
    setSelected(charId)

    await playChar(charId)
    await (correct ? playCorrect() : playWrong())
    await recordAnswer('logic_patterns_1', correct)
    recordResult({
      questionId: `odd-${questionNum}`,
      templateId: 'find_character',
      skillNode: 'logic_patterns_1',
      correct,
      timeMs: 0,
      answeredAt: new Date().toISOString()
    })

    if (correct) { setStars(s => s + 1); setCelebrate(true) }
    else setTimeout(advance, 1200)
  }, [selected, round, questionNum, advance])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  if (!round) return null

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Odd One Out 🔍" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        <motion.p
          key={questionNum}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-2xl font-bold text-center"
        >
          Who doesn't belong? 🤔
          <br />
          <span className="text-white/60 text-base font-normal">
            Find the hero NOT from {UNIVERSE_LABELS[round.mainUniverse]}
          </span>
        </motion.p>

        <div className="flex flex-wrap gap-3 justify-center">
          {round.chars.map(char => {
            const isSelected = selected === char.id
            const isCorrect = isSelected && char.id === round.oddId
            const isWrong = isSelected && char.id !== round.oddId
            const isOddReveal = selected && char.id === round.oddId && !isCorrect

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
                  size="lg"
                  correct={(isCorrect || isOddReveal) || undefined}
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
