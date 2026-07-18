/**
 * Who Vanished?
 * Heroes appear for a few seconds, flip face-down, and one sneaks away.
 * When the rest flip back, the child picks who vanished from three options.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { CharacterCard } from '@/components/CharacterCard'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { useIdleNudge } from '@/hooks/useIdleNudge'
import { weightedPickCharacters, shuffle, pickRandom, pickOne } from '@/utils/helpers'
import type { Character, SkillNodeId } from '@/types'
import allCharacters from '@/data/characters.json'

const TOTAL_ROUNDS = 5

type Phase = 'memorize' | 'hidden' | 'question'

interface Round {
  shown: Character[]
  vanished: Character
  options: Character[]
}

function buildRound(showCount: number, favorites: string[], universe?: string): Round {
  const all = allCharacters as Character[]
  let pool = universe ? all.filter(c => c.universe === universe) : all
  if (pool.length < showCount) pool = all

  const shown = weightedPickCharacters(pool, favorites, showCount)
  const vanished = pickOne(shown)
  // Distractors come from OUTSIDE the lineup so remembering the lineup is the task
  const shownIds = new Set(shown.map(c => c.id))
  const outsiders = all.filter(c => !shownIds.has(c.id))
  const options = shuffle([vanished, ...pickRandom(outsiders, 2)])

  return { shown, vanished, options }
}

interface Props {
  universe?: string
  onComplete: (stars: number) => void
}

export function CharacterDisappears({ universe, onComplete }: Props) {
  const profile = useProfileStore(s => s.activeProfile)
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong, playChar } = useAudio()
  const favorites = profile?.favoriteCharacters ?? []

  // 3 heroes base, 4 once sequence-3 memory is strong; memorize time shrinks with mastery
  const seq3Mastery = profile?.skillNodes.memory_sequence_3?.masteryScore ?? 0
  const showCount = seq3Mastery >= 50 ? 4 : 3
  const memorizeMs = seq3Mastery >= 80 ? 2000 : 3000
  const skillNode: SkillNodeId = showCount === 4 ? 'memory_sequence_3' : 'memory_sequence_2'

  const [round, setRound] = useState<Round>(() => buildRound(showCount, favorites, universe))
  const [questionNum, setQuestionNum] = useState(1)
  const [phase, setPhase] = useState<Phase>('memorize')
  const [selected, setSelected] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [stars, setStars] = useState(0)
  const [done, setDone] = useState(false)
  const timeouts = useRef<number[]>([])
  const nudge = useIdleNudge(`${questionNum}-${phase}`, 6000, phase === 'question' && selected === null && !done)

  // Phase timeline: memorize → hidden (1s) → question
  useEffect(() => {
    setPhase('memorize')
    timeouts.current.push(window.setTimeout(() => setPhase('hidden'), memorizeMs))
    timeouts.current.push(window.setTimeout(() => setPhase('question'), memorizeMs + 1000))
    return () => {
      timeouts.current.forEach(t => clearTimeout(t))
      timeouts.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionNum])

  const advance = useCallback(() => {
    setCelebrate(false)
    setSelected(null)
    if (questionNum >= TOTAL_ROUNDS) { setDone(true); return }
    setQuestionNum(q => q + 1)
    setRound(buildRound(showCount, favorites, universe))
  }, [questionNum, showCount, favorites, universe])

  const handleAnswer = useCallback(async (charId: string) => {
    if (selected !== null || phase !== 'question') return
    const correct = charId === round.vanished.id
    setSelected(charId)

    await playChar(charId)
    await (correct ? playCorrect() : playWrong())
    await recordAnswer(skillNode, correct)
    recordResult({
      questionId: `vanish-${questionNum}`,
      templateId: 'find_character',
      skillNode,
      correct,
      timeMs: 0,
      answeredAt: new Date().toISOString()
    })

    if (correct) { setStars(s => s + 1); setCelebrate(true) }
    else setTimeout(advance, 2200)
  }, [selected, phase, round, skillNode, questionNum, advance, playChar, playCorrect, playWrong, recordAnswer, recordResult])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  const prompt =
    phase === 'memorize' ? 'Remember these heroes! 👀'
    : phase === 'hidden' ? 'Shhh… one is sneaking away! 👻'
    : 'Who vanished? 🤔'

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Who Vanished? 👻" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        <motion.p
          key={`${questionNum}-${phase}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-2xl font-hero text-center"
        >
          {prompt}
        </motion.p>

        {/* Countdown bar while memorizing */}
        {phase === 'memorize' && (
          <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: memorizeMs / 1000, ease: 'linear' }}
              className="h-full bg-yellow-400 rounded-full"
            />
          </div>
        )}

        {/* The lineup */}
        <div className="flex gap-3 justify-center flex-wrap">
          {round.shown.map((char, i) => {
            const isGone = char.id === round.vanished.id && phase === 'question'
            const faceDown = phase === 'hidden'
            return (
              <motion.div
                key={char.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1, opacity: isGone ? 0 : 1 }}
                transition={{ delay: phase === 'memorize' ? i * 0.1 : 0 }}
              >
                {faceDown ? (
                  <motion.div
                    initial={{ rotateY: 90 }}
                    animate={{ rotateY: 0 }}
                    className="w-24 h-24 rounded-2xl bg-indigo-600/60 border-2 border-indigo-400/40 flex items-center justify-center"
                  >
                    <span className="text-4xl">🦸</span>
                  </motion.div>
                ) : isGone ? (
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/30 flex items-center justify-center">
                    <span className="text-3xl">❓</span>
                  </div>
                ) : (
                  <CharacterCard character={char} size="md" showName={phase === 'memorize'} animate={false} />
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Options */}
        {phase === 'question' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 justify-center flex-wrap ${nudge ? 'animate-wiggle' : ''}`}
          >
            {round.options.map(char => {
              const isSelected = selected === char.id
              const isCorrect = selected !== null && char.id === round.vanished.id
              const isWrong = isSelected && char.id !== round.vanished.id

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
          </motion.div>
        )}
      </div>

      <CelebrationOverlay show={celebrate} onDone={advance} />
    </div>
  )
}
