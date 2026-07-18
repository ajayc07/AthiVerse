/**
 * Tap & Count
 * Tap each hero to count them one by one — a giant number counts up with
 * every tap — then pick the total from three options.
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CharacterCard } from '@/components/CharacterCard'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { useIdleNudge } from '@/hooks/useIdleNudge'
import { weightedPickCharacters, buildAdjacentOptions, countingNodeFor } from '@/utils/helpers'
import type { Character } from '@/types'
import allCharacters from '@/data/characters.json'

const TOTAL_ROUNDS = 5

interface Round {
  chars: Character[]
  count: number
  options: number[]
}

function buildRound(min: number, max: number, favorites: string[], universe?: string): Round {
  const all = allCharacters as Character[]
  let pool = universe ? all.filter(c => c.universe === universe) : all
  if (pool.length < min) pool = all

  const target = min + Math.floor(Math.random() * (max - min + 1))
  const chars = weightedPickCharacters(pool, favorites, Math.min(target, pool.length))
  return { chars, count: chars.length, options: buildAdjacentOptions(chars.length, Math.max(max, chars.length)) }
}

interface Props {
  universe?: string
  onComplete: (stars: number) => void
}

export function TapAndCount({ universe, onComplete }: Props) {
  const profile = useProfileStore(s => s.activeProfile)
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong, playChar } = useAudio()
  const favorites = profile?.favoriteCharacters ?? []

  // Adaptive size: 3–5 base, 6–9 once counting 1–10 is strong, 10–12 at the top
  const [minN, maxN] =
    (profile?.skillNodes.count_1_15?.masteryScore ?? 0) >= 80 ? [10, 12]
    : (profile?.skillNodes.count_1_10?.masteryScore ?? 0) >= 80 ? [6, 9]
    : [3, 5]

  const [round, setRound] = useState<Round>(() => buildRound(minN, maxN, favorites, universe))
  const [questionNum, setQuestionNum] = useState(1)
  const [tapped, setTapped] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<number | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [stars, setStars] = useState(0)
  const [done, setDone] = useState(false)

  const allTapped = tapped.size === round.count
  const nudge = useIdleNudge(`${questionNum}-${tapped.size}`, 6000, !done && selected === null)

  const advance = useCallback(() => {
    setCelebrate(false)
    setSelected(null)
    setTapped(new Set())
    if (questionNum >= TOTAL_ROUNDS) { setDone(true); return }
    setQuestionNum(q => q + 1)
    setRound(buildRound(minN, maxN, favorites, universe))
  }, [questionNum, minN, maxN, favorites, universe])

  const handleTapHero = useCallback((charId: string) => {
    if (allTapped || tapped.has(charId)) return
    playChar(charId).catch(() => {})
    setTapped(prev => new Set(prev).add(charId))
  }, [allTapped, tapped, playChar])

  const handleAnswer = useCallback(async (n: number) => {
    if (selected !== null || !allTapped) return
    const correct = n === round.count
    setSelected(n)

    const skillNode = countingNodeFor(round.count)
    await (correct ? playCorrect() : playWrong())
    await recordAnswer(skillNode, correct)
    recordResult({
      questionId: `tapcount-${questionNum}`,
      templateId: 'count_objects',
      skillNode,
      correct,
      timeMs: 0,
      answeredAt: new Date().toISOString()
    })

    if (correct) { setStars(s => s + 1); setCelebrate(true) }
    else setTimeout(advance, 2000)
  }, [selected, allTapped, round, questionNum, advance, playCorrect, playWrong, recordAnswer, recordResult])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Tap & Count 👆" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <motion.p
          key={questionNum}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-xl font-hero text-center"
        >
          {allTapped ? 'How many heroes? 🤔' : 'Tap every hero to count! 👆'}
        </motion.p>

        {/* Giant running counter */}
        <motion.div
          key={`counter-${tapped.size}`}
          initial={{ scale: tapped.size > 0 ? 1.6 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="text-6xl font-hero text-yellow-300"
        >
          {tapped.size}
        </motion.div>

        {/* Heroes to tap */}
        <div className={`flex flex-wrap justify-center gap-2 max-w-sm ${nudge && !allTapped ? 'animate-wiggle' : ''}`}>
          {round.chars.map((char, i) => {
            const isTapped = tapped.has(char.id)
            return (
              <motion.div
                key={char.id + i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: isTapped ? 0.45 : 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => handleTapHero(char.id)}
                className="relative cursor-pointer"
              >
                <CharacterCard character={char} size={round.count > 9 ? 'sm' : 'md'} animate={false} />
                {isTapped && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="text-3xl">✅</span>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Number options — appear once every hero is counted */}
        <AnimatePresence>
          {allTapped && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${nudge ? 'animate-wiggle' : ''}`}
            >
              {round.options.map(n => {
                const revealed = selected !== null
                const showCorrect = revealed && n === round.count
                const isWrong = selected === n && n !== round.count

                return (
                  <motion.button
                    key={n}
                    whileHover={!selected ? { scale: 1.1 } : {}}
                    whileTap={!selected ? { scale: 0.9 } : {}}
                    animate={isWrong ? { x: [0, -10, 10, -10, 10, 0] } : showCorrect ? { scale: [1, 1.2, 1, 1.15, 1] } : {}}
                    transition={{ duration: 0.6 }}
                    onClick={() => handleAnswer(n)}
                    disabled={selected !== null}
                    className={`
                      w-20 h-20 rounded-2xl text-4xl font-bold border-4 transition-all
                      ${showCorrect ? 'bg-green-400 border-green-300 text-white' : ''}
                      ${isWrong ? 'bg-red-400 border-red-300 text-white' : ''}
                      ${!showCorrect && !isWrong ? 'bg-white/10 border-white/30 text-white' : ''}
                    `}
                  >
                    {n}
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CelebrationOverlay show={celebrate} onDone={advance} />
    </div>
  )
}
