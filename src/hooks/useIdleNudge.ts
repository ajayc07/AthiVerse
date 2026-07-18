import { useEffect, useState } from 'react'

/**
 * Attention nudge for young players: returns true for ~1.2s after `idleMs`
 * of inactivity, then hides again (and re-arms). Pass a `resetKey` that
 * changes on interaction (e.g. `${questionNum}-${selected}`) to restart the
 * timer, and `active: false` to suspend it (e.g. once an answer is picked).
 */
export function useIdleNudge(resetKey: unknown, idleMs = 6000, active = true): boolean {
  const [nudge, setNudge] = useState(false)

  useEffect(() => {
    setNudge(false)
    if (!active) return
    const show = setTimeout(() => setNudge(true), idleMs)
    return () => clearTimeout(show)
  }, [resetKey, idleMs, active])

  useEffect(() => {
    if (!nudge) return
    const hide = setTimeout(() => setNudge(false), 1200)
    return () => clearTimeout(hide)
  }, [nudge])

  return nudge
}
