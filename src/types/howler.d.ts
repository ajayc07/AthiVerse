// Minimal type declaration for howler (replaces @types/howler)
declare module 'howler' {
  export interface HowlOptions {
    src: string[]
    volume?: number
    loop?: boolean
    preload?: boolean
    autoplay?: boolean
    onend?: () => void
    onloaderror?: (id: number, err: unknown) => void
    onplayerror?: (id: number, err: unknown) => void
  }

  export class Howl {
    constructor(options: HowlOptions)
    play(id?: number): number
    stop(id?: number): this
    pause(id?: number): this
    volume(vol?: number, id?: number): number | this
    once(event: string, fn: (...args: unknown[]) => void, id?: number): this
    on(event: string, fn: (...args: unknown[]) => void, id?: number): this
    off(event?: string, fn?: (...args: unknown[]) => void, id?: number): this
    unload(): this
  }

  export class Howler {
    static volume(vol?: number): number | typeof Howler
    static mute(muted: boolean): typeof Howler
  }
}
