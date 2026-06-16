/**
 * Sort by Attribute
 * Question: "Who can fly?" / "Who uses a sword?" — pick all that apply.
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
import type { Character } from '@/types'
import allCharacters from '@/data/characters.json'

const TOTAL_ROUNDS = 4

const ATTRIBUTES = [
  { key: 'canFly' as const,      label: 'can fly',        emoji: '🦅' },
  { key: 'canSwim' as const,     label: 'can swim',       emoji: '🌊' },
  { key: 'canUseSword' as const, label: 'uses a sword',   emoji: '⚔️' }
]

function buildRound() {
  const pool = allCharacters as Character[]
  const attr = pickOne(ATTRIBUTES)

  const withAttr = pool.filter(c => c[attr.key])
  const withoutAttr = pool.filter(c => !c[attr.key])

  if (withAttr.length < 1 || withoutAttr.length < 1) return null

  // Show 4 characters: 1-2 with attr, rest without
  const correctCount = Math.random() > 0.4 ? 2 : 1
  const correct = pickRandom(withAttr, Math.min(correctCount, withAttr.length))
  const wrong = pickRandom(withoutAttr, 4 - correct.length)
  const chars = shuffle([...correct, ...wrong])
  const correctIds = new Set(correct.map(c => c.id))

  return { chars, attr, correctIds }
}

interface Props {
  onComplete: (stars: number) => void
}

export function SortByAttribute({ onComplete }: Props) {
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong, playChar } = useAudio()

  const [round, setRound] = useState(() => buildRound())
  const [questionNum, setQuestionNum] = useState(1)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [stars, setStars] = useState(0)
  const [done, setDone] = useState(false)

  const advance = useCallback(() => {
    setCelebrate(false)
    setSubmitted(false)
    setPicked(new Set())
    if (questionNum >= TOTAL_ROUNDS) { setDone(true); return }
    setQuestionNum(q => q + 1)
    setRound(buildRound())
  }, [questionNum])

  const togglePick = useCallback((id: string) => {
    if (submitted || !round) return
    playChar(id).catch(() => {})
    setPicked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [submitted, round, playChar])

  const handleSubmit = useCallback(async () => {
    if (!round || submitted || picked.size === 0) return
    setSubmitted(true)

    const isCorrect = [...picked].every(id => round.correctIds.has(id)) &&
      picked.size === round.correctIds.size

    await (isCorrect ? playCorrect() : playWrong())
    await recordAnswer('logic_classification', isCorrect)
    recordResult({
      questionId: `sort-${questionNum}`,
      templateId: 'sort_objects',
      skillNode: 'logic_classification',
      correct: isCorrect,
      timeMs: 0,
      answeredAt: new Date().toISOString()
    })

    if (isCorrect) { setStars(s => s + 1); setCelebrate(true) }
    else setTimeout(advance, 1500)
  }, [round, submitted, picked, questionNum, advance])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  if (!round) return null

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Hero Sort ⚡" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        <motion.p
          key={questionNum}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-2xl font-bold text-center"
        >
          Tap all heroes who {round.attr.label}! {round.attr.emoji}
        </motion.p>

        <div className="grid grid-cols-2 gap-4">
          {round.chars.map(char => {
            const isPicked = picked.has(char.id)
            const isCorrect = submitted && round.correctIds.has(char.id)
            const isWrong = submitted && isPicked && !round.correctIds.has(char.id)

            return (
              <motion.div
                key={char.id}
                whileHover={!submitted ? { scale: 1.05 } : {}}
                whileTap={!submitted ? { scale: 0.95 } : {}}
                onClick={() => togglePick(char.id)}
                className="cursor-pointer"
              >
                <div className={`rounded-2xl border-4 transition-all ${
                  isPicked && !submitted ? 'border-yellow-400' :
                  isCorrect ? 'border-green-400' :
                  isWrong ? 'border-red-400' : 'border-transparent'
                }`}>
                  <CharacterCard
                    character={char}
                    size="lg"
                    correct={isCorrect || undefined}
                    wrong={isWrong || undefined}
                    showName
                    animate={false}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>

        {!submitted && picked.size > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="bg-yellow-400 text-slate-900 font-bold text-xl px-8 py-3 rounded-2xl shadow-lg"
          >
            Check! ✅
          </motion.button>
        )}
      </div>

      <CelebrationOverlay show={celebrate} onDone={advance} />
    </div>
  )
}
