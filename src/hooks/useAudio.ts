import { useCallback } from 'react'
import { useProfileStore } from '@/store/profileStore'
import { playInstruction, playCharacterName, playUI } from '@/utils/audio'

export function useAudio() {
  const soundEnabled = useProfileStore(
    s => s.activeProfile?.parentSettings.soundEnabled ?? true
  )

  const playInstruct = useCallback(async (key: string) => {
    if (!soundEnabled) return
    await playInstruction(key)
  }, [soundEnabled])

  const playChar = useCallback(async (charId: string) => {
    if (!soundEnabled) return
    await playCharacterName(charId)
  }, [soundEnabled])

  const playCorrect = useCallback(async () => {
    if (!soundEnabled) return
    await playUI('correct')
  }, [soundEnabled])

  const playWrong = useCallback(async () => {
    if (!soundEnabled) return
    await playUI('wrong')
  }, [soundEnabled])

  const playCelebration = useCallback(async () => {
    if (!soundEnabled) return
    await playUI('celebration')
  }, [soundEnabled])

  return { playInstruct, playChar, playCorrect, playWrong, playCelebration }
}
