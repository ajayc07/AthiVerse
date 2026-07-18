import { useState } from 'react'
import type { ParentSettings } from '@/types'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useProfileStore } from '@/store/profileStore'
import { playClick } from '@/utils/audio'
import { Button } from '@/components/Button'

export function ParentSettingsScreen() {
  const navigate = useGameStore(s => s.navigate)
  const profile = useProfileStore(s => s.activeProfile)
  const updateProfile = useProfileStore(s => s.updateProfile)
  const resetProfile = useProfileStore(s => s.resetProfile)
  const [pinInput, setPinInput] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const PIN = '1234'

  const settings = profile?.parentSettings
  const ageConfig = profile?.ageConfig

  const toggle = async (key: keyof ParentSettings, value: boolean) => {
    if (!settings) return
    await updateProfile({
      parentSettings: { ...settings, [key]: value }
    })
  }

  const handleReset = async () => {
    setResetting(true)
    await resetProfile()
    setResetting(false)
    setShowResetConfirm(false)
    navigate('home')
  }

  if (!unlocked) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-indigo-900 to-slate-900 items-center justify-center px-6">
        <div className="absolute top-8 left-5">
          <Button variant="icon" onClick={() => navigate('home')}>←</Button>
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <p className="text-4xl mb-4">🔐</p>
          <h2 className="text-white font-bold text-2xl mb-2">Parent Area</h2>
          <p className="text-white/50 text-sm mb-8">Enter PIN: 1234</p>

          <div className="bg-white/10 rounded-2xl p-4 text-center mb-6 border border-white/20 min-h-[3rem] flex items-center justify-center">
            <p className="text-white font-bold text-3xl tracking-widest">
              {pinInput.replace(/./g, '●')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-[240px]">
            {[1,2,3,4,5,6,7,8,9,'←',0,'✓'].map(key => (
              <button
                key={String(key)}
                onClick={() => {
                  if (key === '←') setPinInput(p => p.slice(0, -1))
                  else if (key === '✓') {
                    if (pinInput === PIN) setUnlocked(true)
                    else setPinInput('')
                  }
                  else if (pinInput.length < 4) setPinInput(p => p + key)
                }}
                className="h-14 rounded-xl bg-white/10 text-white font-bold text-xl border border-white/20 active:scale-95 transition-transform"
              >
                {key}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-900 to-slate-900 overflow-auto">
      <div className="flex items-center gap-3 px-5 pt-8 pb-4">
        <Button variant="icon" onClick={() => navigate('home')}>←</Button>
        <h1 className="text-white font-bold text-2xl">⚙️ Parent Settings</h1>
      </div>

      <div className="px-5 space-y-4 pb-8">
        {/* Toggles */}
        {[
          { key: 'soundEnabled' as const,       label: 'Sound Effects',        desc: 'Enable audio feedback', emoji: '🔊' },
          { key: 'hapticsEnabled' as const,     label: 'Vibration',            desc: 'Buzz on taps and answers', emoji: '📳' },
          { key: 'unlockAllUniverses' as const, label: 'Unlock All Universes', desc: 'Allow access to all worlds', emoji: '🔓' },
          { key: 'allowFreePlay' as const,      label: 'Free Play Mode',       desc: 'Explore without missions', emoji: '🎮' }
        ].map(item => (
          <div
            key={item.key}
            className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10"
          >
            <span className="text-2xl">{item.emoji}</span>
            <div className="flex-1">
              <p className="text-white font-bold">{item.label}</p>
              <p className="text-white/50 text-sm">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key, !settings?.[item.key])}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings?.[item.key] ? 'bg-indigo-500' : 'bg-white/20'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white mx-0.5 transition-transform ${
                settings?.[item.key] ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        ))}

        {/* Difficulty */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-white font-bold mb-3">Difficulty Mode</p>
          <div className="flex gap-2">
            {(['easy', 'adaptive', 'hard'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => updateProfile({ parentSettings: { ...settings!, difficultyMode: mode } })}
                className={`flex-1 py-2 rounded-xl font-bold text-sm capitalize transition-all ${
                  settings?.difficultyMode === mode
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Session length */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-white font-bold mb-1">Max Session: {settings?.maxSessionMinutes} min</p>
          <input
            type="range"
            min={5} max={30} step={5}
            value={settings?.maxSessionMinutes ?? 10}
            onChange={e => updateProfile({ parentSettings: { ...settings!, maxSessionMinutes: Number(e.target.value) } })}
            className="w-full"
          />
        </div>

        {/* Progress link */}
        <button
          onClick={() => { playClick(); navigate('progress_summary') }}
          className="w-full bg-indigo-500/20 text-indigo-300 font-bold py-3 rounded-2xl border border-indigo-400/30"
        >
          📊 View Full Progress
        </button>

        {/* Master Reset */}
        {!showResetConfirm ? (
          <button
            onClick={() => { playClick(); setShowResetConfirm(true) }}
            className="w-full bg-red-500/10 text-red-400 font-bold py-3 rounded-2xl border border-red-400/30"
          >
            🗑️ Reset All Progress
          </button>
        ) : (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-500/20 rounded-2xl p-4 border border-red-400/40 space-y-3"
          >
            <p className="text-white font-bold text-center">⚠️ Reset All Progress?</p>
            <p className="text-white/60 text-sm text-center">
              This will delete all stars, skill progress, and achievements for {profile?.name}. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { playClick(); setShowResetConfirm(false) }}
                className="flex-1 bg-white/10 text-white font-bold py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 bg-red-500 text-white font-bold py-2 rounded-xl disabled:opacity-50"
              >
                {resetting ? 'Resetting…' : 'Yes, Reset'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
