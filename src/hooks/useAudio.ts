import { useCallback } from 'react'
import { useProfileStore } from '@/store/profileStore'
import { playInstruction, playCharacterName, playUI } from '@/utils/audio'
import { haptics } from '@/utils/haptics'

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

  // Haptics fire before the sound gate so a muted device still gives feedback
  const playCorrect = useCallback(async () => {
    haptics.success()
    if (!soundEnabled) return
    await playUI('correct')
  }, [soundEnabled])

  const playWrong = useCallback(async () => {
    haptics.error()
    if (!soundEnabled) return
    await playUI('wrong')
  }, [soundEnabled])

  const playCelebration = useCallback(async () => {
    haptics.celebration()
    if (!soundEnabled) return
    await playUI('celebration')
  }, [soundEnabled])

  return { playInstruct, playChar, playCorrect, playWrong, playCelebration }
}
