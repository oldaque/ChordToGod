import type { DisplayMode, FontScale, KeyNote, RepertoireState, SongSettingsMap, UIState } from "@/types/song"

export const STORAGE_KEYS = {
  repertoire: "ctg.repertoire.v1",
  songSettings: "ctg.songSettings.v1",
  ui: "ctg.ui.v1",
  theme: "ctg.theme.v1",
} as const

const DEFAULT_REPERTOIRE: RepertoireState = {
  songIds: [],
  currentSongId: undefined,
  updatedAt: Date.now(),
}

const DEFAULT_UI: UIState = {
  displayMode: "hybrid",
  fontScale: "md",
}

function parseJSON<T>(rawValue: string | null, fallback: T): T {
  if (!rawValue) {
    return fallback
  }

  try {
    return JSON.parse(rawValue) as T
  } catch {
    return fallback
  }
}

export function loadRepertoire(): RepertoireState {
  if (typeof window === "undefined") {
    return DEFAULT_REPERTOIRE
  }

  return parseJSON(window.localStorage.getItem(STORAGE_KEYS.repertoire), DEFAULT_REPERTOIRE)
}

export function saveRepertoire(value: RepertoireState): void {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEYS.repertoire, JSON.stringify(value))
}

export function loadSongSettings(): SongSettingsMap {
  if (typeof window === "undefined") {
    return {}
  }

  return parseJSON(window.localStorage.getItem(STORAGE_KEYS.songSettings), {})
}

export function saveSongSettings(value: SongSettingsMap): void {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEYS.songSettings, JSON.stringify(value))
}

export function loadUIState(): UIState {
  if (typeof window === "undefined") {
    return DEFAULT_UI
  }

  return parseJSON(window.localStorage.getItem(STORAGE_KEYS.ui), DEFAULT_UI)
}

export function saveUIState(value: UIState): void {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEYS.ui, JSON.stringify(value))
}

export function cycleFontScale(current: FontScale, direction: "up" | "down"): FontScale {
  const ordered: FontScale[] = ["sm", "md", "lg"]
  const currentIndex = ordered.indexOf(current)

  if (currentIndex < 0) {
    return "md"
  }

  if (direction === "up") {
    return ordered[Math.min(currentIndex + 1, ordered.length - 1)]
  }

  return ordered[Math.max(currentIndex - 1, 0)]
}

export function nextDisplayMode(current: DisplayMode): DisplayMode {
  const ordered: DisplayMode[] = ["hybrid", "degrees", "chords"]
  const index = ordered.indexOf(current)

  if (index < 0) {
    return "hybrid"
  }

  return ordered[(index + 1) % ordered.length]
}

export function keyWithOffset(key: KeyNote, offset: number, preferFlats: boolean): KeyNote {
  const SHARP_SCALE: KeyNote[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  const FLAT_SCALE: KeyNote[] = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
  const NOTE_TO_INDEX: Record<KeyNote, number> = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
  }

  const currentIndex = NOTE_TO_INDEX[key]
  const nextIndex = ((currentIndex + offset) % 12 + 12) % 12

  return preferFlats ? FLAT_SCALE[nextIndex] : SHARP_SCALE[nextIndex]
}
