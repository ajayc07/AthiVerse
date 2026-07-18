/**
 * Pattern Builder
 * A row of hero cards forms a pattern (A B A B A ?) with a pulsing empty
 * slot at the end. Child picks which hero comes next.
 * AB patterns first; AAB / ABC patterns unlock with mastery.
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
import { weightedPickCharacters, shuffle, pickOne } from '@/utils/helpers'
import type { Character, SkillNodeId } from '@/types'
import allCharacters from '@/data/characters.json'

const TOTAL_ROUNDS = 5
const SHOWN = 5  // pattern cells visible before the ? slot

// Repeating units, as indices into the round's character set
const BASE_PATTERNS = [[0, 1]]                    // AB
const ADVANCED_PATTERNS = [[0, 1], [0, 0, 1], [0, 1, 2]]  // AB, AAB, ABC

interface Round {
  chars: Character[]      // distinct heroes used by the pattern
  cells: number[]         // the visible pattern cells
  answer: number          // index into chars that continues the pattern
  options: Character[]
  advanced: boolean       // true when the unit is AAB/ABC
}

function buildRound(useAdvanced: boolean, favorites: string[], universe?: string): Round {
  const all = allCharacters as Character[]
  let pool = universe ? all.filter(c => c.universe === universe) : all

  const unit = pickOne(useAdvanced ? ADVANCED_PATTERNS : BASE_PATTERNS)
  const distinct = Math.max(...unit) + 1
  if (pool.length < distinct) pool = all

  const chars = weightedPickCharacters(pool, favorites, distinct)
  const cells = Array.from({ length: SHOWN }, (_, i) => unit[i % unit.length])
  const answer = unit[SHOWN % unit.length]
  const options = shuffle([...chars])

  return { chars, cells, answer, options, advanced: unit.length > 2 }
}

interface Props {
  universe?: string
  onComplete: (stars: number) => void
}

export function PatternBuilder({ universe, onComplete }: Props) {
  const profile = useProfileStore(s => s.activeProfile)
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong, playChar } = useAudio()
  const favorites = profile?.favoriteCharacters ?? []

  const useAdvanced = (profile?.skillNodes.logic_patterns_2?.unlocked ?? false) ||
    (profile?.skillNodes.logic_patterns_1?.masteryScore ?? 0) >= 80

  const [round, setRound] = useState<Round>(() => buildRound(useAdvanced, favorites, universe))
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
    setRound(buildRound(useAdvanced, favorites, universe))
  }, [questionNum, useAdvanced, favorites, universe])

  const handleAnswer = useCallback(async (charId: string) => {
    if (selected !== null) return
    const answerChar = round.chars[round.answer]
    const correct = charId === answerChar.id
    setSelected(charId)

    // Harder pattern shapes credit the next logic node
    const skillNode: SkillNodeId = round.advanced ? 'logic_patterns_2' : 'logic_patterns_1'
    await playChar(charId)
    await (correct ? playCorrect() : playWrong())
    await recordAnswer(skillNode, correct)
    recordResult({
      questionId: `pattern-${questionNum}`,
      templateId: 'find_character',
      skillNode,
      correct,
      timeMs: 0,
      answeredAt: new Date().toISOString()
    })

    if (correct) { setStars(s => s + 1); setCelebrate(true) }
    else setTimeout(advance, 2200)
  }, [selected, round, questionNum, advance, playChar, playCorrect, playWrong, recordAnswer, recordResult])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  const answerChar = round.chars[round.answer]

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Pattern Builder 🔮" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-7 px-4">
        <motion.p
          key={questionNum}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-2xl font-hero text-center"
        >
          Who comes next? 🔮
        </motion.p>

        {/* Pattern row + pulsing ? slot */}
        <div className="flex gap-1.5 items-center justify-center flex-wrap">
          {round.cells.map((cellIdx, i) => (
            <motion.div
              key={`${questionNum}-${i}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.09 }}
            >
              <CharacterCard character={round.chars[cellIdx]} size="sm" animate={false} />
            </motion.div>
          ))}
          <motion.div
            animate={
              selected !== null
                ? { scale: 1 }
                : { scale: [1, 1.12, 1], borderColor: ['#facc15', '#fde047', '#facc15'] }
            }
            transition={{ duration: 1.1, repeat: selected === null ? Infinity : 0 }}
            className="w-16 h-16 rounded-2xl border-4 border-dashed border-yellow-400 bg-yellow-400/10 flex items-center justify-center overflow-hidden"
          >
            {selected !== null
              ? <CharacterCard character={answerChar} size="sm" animate={false} />
              : <span className="text-2xl text-yellow-400">?</span>}
          </motion.div>
        </div>

        {/* Options */}
        <div className={`flex gap-4 justify-center ${nudge ? 'animate-wiggle' : ''}`}>
          {round.options.map(char => {
            const isSelected = selected === char.id
            const isCorrect = selected !== null && char.id === answerChar.id
            const isWrong = isSelected && char.id !== answerChar.id

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
                  size="md"
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
