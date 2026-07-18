/**
 * Find the Odd One
 * 3 heroes from the same universe + 1 from a different universe.
 * Universe-colored borders + badges make it purely visual — no prior knowledge needed.
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

const UNIVERSE_COLORS: Record<string, string> = {
  marvel:      '#ef4444',
  dc:          '#3b82f6',
  naruto:      '#f97316',
  onepiece:    '#eab308',
  demonslayer: '#a855f7',
}

const UNIVERSE_EMOJIS: Record<string, string> = {
  marvel:      '⭐',
  dc:          '🦇',
  naruto:      '🍃',
  onepiece:    '☠️',
  demonslayer: '🗡️',
}

const UNIVERSE_LABELS: Record<string, string> = {
  marvel:      'Marvel',
  dc:          'DC',
  naruto:      'Naruto',
  onepiece:    'One Piece',
  demonslayer: 'Demon Slayer',
}

function buildRound() {
  const pool = allCharacters as Character[]
  const mainUniverse = pickOne(UNIVERSES)
  const otherUniverses = UNIVERSES.filter(u => u !== mainUniverse)
  const oddUniverse = pickOne(otherUniverses)

  const mainChars = pool.filter(c => c.universe === mainUniverse)
  const oddChars  = pool.filter(c => c.universe === oddUniverse)

  if (mainChars.length < 3 || oddChars.length < 1) return null

  const mainPicked = pickRandom(mainChars, 3)
  const oddChar    = pickOne(oddChars)
  const chars      = shuffle([...mainPicked, oddChar])

  return { chars, oddId: oddChar.id, mainUniverse }
}

interface Props {
  onComplete: (stars: number) => void
}

export function FindTheOddOne({ onComplete }: Props) {
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong, playChar } = useAudio()

  const [round, setRound]           = useState(() => buildRound())
  const [questionNum, setQuestionNum] = useState(1)
  const [selected, setSelected]     = useState<string | null>(null)
  const [celebrate, setCelebrate]   = useState(false)
  const [stars, setStars]           = useState(0)
  const [done, setDone]             = useState(false)

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
      skillNode:  'logic_patterns_1',
      correct,
      timeMs:     0,
      answeredAt: new Date().toISOString(),
    })

    if (correct) { setStars(s => s + 1); setCelebrate(true) }
    else setTimeout(advance, 2200)
  }, [selected, round, questionNum, advance, playChar, playCorrect, playWrong, recordAnswer, recordResult])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  if (!round) return null

  const mainColor = UNIVERSE_COLORS[round.mainUniverse]
  const mainEmoji = UNIVERSE_EMOJIS[round.mainUniverse]
  const mainLabel = UNIVERSE_LABELS[round.mainUniverse]

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Odd One Out 🔍" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4">

        {/* Instruction: show the "team" color so the child just matches visually */}
        <motion.div
          key={questionNum}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <p className="text-white text-xl font-bold">Who doesn't belong? 🤔</p>
          <div
            className="flex items-center gap-2 px-5 py-2 rounded-2xl border-4"
            style={{ borderColor: mainColor, background: mainColor + '22' }}
          >
            <span className="text-2xl">{mainEmoji}</span>
            <span className="text-white font-bold text-lg">{mainLabel} Team</span>
            <span className="text-2xl">{mainEmoji}</span>
          </div>
          <p className="text-white/55 text-sm">Find the hero with the DIFFERENT colour!</p>
        </motion.div>

        {/* Characters — each wrapped with their universe border colour */}
        <div className="flex flex-wrap gap-4 justify-center">
          {round.chars.map(char => {
            const uColor = UNIVERSE_COLORS[char.universe]
            const uEmoji = UNIVERSE_EMOJIS[char.universe]
            const uLabel = UNIVERSE_LABELS[char.universe]

            const isSelected    = selected === char.id
            const isCorrect     = isSelected && char.id === round.oddId
            const isWrong       = isSelected && char.id !== round.oddId
            const isOddReveal   = !!(selected && char.id === round.oddId && !isCorrect)

            // Universe colour is the visual signal the child matches on — always shown
            const borderColor =
              isCorrect || isOddReveal ? '#4ade80'
              : isWrong                ? '#f87171'
              : uColor

            return (
              <motion.div
                key={char.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={!selected ? { scale: 1.05 } : {}}
                whileTap={!selected ? { scale: 0.95 } : {}}
                onClick={() => handleAnswer(char.id)}
                className="cursor-pointer flex flex-col items-center gap-1.5"
              >
                {/* Coloured border wrapper */}
                <div
                  className="rounded-2xl p-1"
                  style={{
                    border: `5px solid ${borderColor}`,
                    boxShadow: isOddReveal
                      ? `0 0 22px #4ade80`
                      : `0 0 10px ${uColor}55`,
                    transition: 'border-color 0.25s, box-shadow 0.25s',
                  }}
                >
                  <CharacterCard
                    character={char}
                    size="lg"
                    correct={(isCorrect || isOddReveal) || undefined}
                    wrong={isWrong || undefined}
                    showName
                    animate={false}
                  />
                </div>

                {/* Universe badge — revealed only after answering, as a teaching moment
                    (always visible it labels the answer and bypasses the reasoning) */}
                <motion.div
                  animate={{ opacity: selected ? 1 : 0 }}
                  initial={{ opacity: 0 }}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-white text-xs font-bold"
                  style={{ background: uColor + 'cc' }}
                >
                  <span>{uEmoji}</span>
                  <span>{uLabel}</span>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <CelebrationOverlay show={celebrate} onDone={advance} />
    </div>
  )
}
