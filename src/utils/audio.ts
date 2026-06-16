/**
 * Audio utility — wraps Howler.js
 * Falls back silently if audio files are missing.
 *
 * Drop MP3 files into:
 *   public/sounds/instructions/<key>.mp3
 *   public/sounds/names/<characterId>.mp3
 *   public/sounds/ui/correct.mp3, wrong.mp3, celebration.mp3, click.mp3, open.mp3
 */

let HowlClass: typeof import('howler').Howl | null = null

async function getHowl() {
  if (!HowlClass) {
    try {
      const mod = await import('howler')
      HowlClass = mod.Howl
    } catch {
      // Howler not available
    }
  }
  return HowlClass
}

const cache: Record<string, InstanceType<typeof import('howler').Howl>> = {}

async function play(src: string): Promise<void> {
  const Howl = await getHowl()
  if (!Howl) return

  if (!cache[src]) {
    cache[src] = new Howl({ src: [src], preload: true, volume: 1.0 })
  }

  return new Promise<void>((resolve) => {
    const h = cache[src]
    let done = false
    const finish = () => { if (!done) { done = true; resolve() } }

    // Scope end/error listeners to this specific play ID so rapid calls don't cross-fire
    const id = h.play()
    if (typeof id === 'number') {
      h.once('end', finish, id)
      h.once('playerror', finish, id)
    } else {
      // Howl not yet loaded — fall back to unscoped listeners
      h.once('end', finish)
      h.once('playerror', finish)
    }
    h.once('loaderror', finish)
    setTimeout(finish, 3000)  // hard fallback so nothing blocks the game
  })
}

/** Play instruction audio (e.g. "find") */
export async function playInstruction(key: string): Promise<void> {
  await play(`/sounds/instructions/${key}.mp3`)
}

/** Play character name audio */
export async function playCharacterName(characterId: string): Promise<void> {
  await play(`/sounds/names/${characterId}.mp3`)
}

/** Play composed instruction: "Find" + character name */
export async function playQuestion(instruction: string, characterId?: string): Promise<void> {
  await playInstruction(instruction)
  if (characterId) {
    await playCharacterName(characterId)
  }
}

/** Play a UI sound (correct, wrong, celebration, click, open) */
export async function playUI(type: 'correct' | 'wrong' | 'celebration' | 'click' | 'open'): Promise<void> {
  await play(`/sounds/ui/${type}.mp3`)
}

/** Fire-and-forget click sound for navigation buttons */
export function playClick(): void {
  play('/sounds/ui/click.mp3').catch(() => {})
}
