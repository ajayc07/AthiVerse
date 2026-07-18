/**
 * Haptic feedback — guarded navigator.vibrate wrapper.
 * Gated by parentSettings.hapticsEnabled (independent of sound, so a muted
 * device still buzzes). Silently no-ops where vibration is unsupported (iOS,
 * desktop) or blocked.
 */

import { useProfileStore } from '@/store/profileStore'

function vibrate(pattern: number | number[]): void {
  const enabled = useProfileStore.getState().activeProfile?.parentSettings.hapticsEnabled ?? true
  if (!enabled) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // unsupported — ignore
  }
}

export const haptics = {
  /** Light tick on any tap */
  tap: () => vibrate(10),
  /** Double-pulse on a correct answer */
  success: () => vibrate([15, 40, 20]),
  /** Single firm buzz on a wrong answer */
  error: () => vibrate(70),
  /** Rising pattern for celebrations */
  celebration: () => vibrate([20, 40, 20, 40, 90])
}
