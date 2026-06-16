import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Profile, GameSession } from '@/types'

const DB_NAME = 'athiverse'
const DB_VERSION = 1

interface AthiVerseDB extends DBSchema {
  profiles: {
    key: string
    value: Profile
    indexes: { 'by-name': string }
  }
  sessions: {
    key: string
    value: GameSession
    indexes: { 'by-profile': string; 'by-game': string }
  }
}

let dbInstance: IDBPDatabase<AthiVerseDB> | null = null

export async function getDB(): Promise<IDBPDatabase<AthiVerseDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<AthiVerseDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Profiles store
      const profileStore = db.createObjectStore('profiles', { keyPath: 'id' })
      profileStore.createIndex('by-name', 'name')

      // Sessions store
      const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' })
      sessionStore.createIndex('by-profile', 'profileId')
      sessionStore.createIndex('by-game', 'gameId')
    }
  })

  return dbInstance
}

// ─── Profile CRUD ────────────────────────────────────────────────────────────

export async function saveProfile(profile: Profile): Promise<void> {
  const db = await getDB()
  await db.put('profiles', profile)
}

export async function loadProfile(id: string): Promise<Profile | undefined> {
  const db = await getDB()
  return db.get('profiles', id)
}

export async function loadAllProfiles(): Promise<Profile[]> {
  const db = await getDB()
  return db.getAll('profiles')
}

export async function deleteProfile(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('profiles', id)
}

// ─── Session CRUD ─────────────────────────────────────────────────────────────

export async function saveSession(session: GameSession): Promise<void> {
  const db = await getDB()
  await db.put('sessions', session)
}

export async function loadSessionsByProfile(profileId: string): Promise<GameSession[]> {
  const db = await getDB()
  return db.getAllFromIndex('sessions', 'by-profile', profileId)
}

export async function loadSessionsByGame(gameId: string): Promise<GameSession[]> {
  const db = await getDB()
  return db.getAllFromIndex('sessions', 'by-game', gameId)
}

// ─── Export helpers (for parent review) ──────────────────────────────────────

export async function exportAllData(): Promise<string> {
  const db = await getDB()
  const profiles = await db.getAll('profiles')
  const sessions = await db.getAll('sessions')
  return JSON.stringify({ profiles, sessions, exportedAt: new Date().toISOString() }, null, 2)
}
