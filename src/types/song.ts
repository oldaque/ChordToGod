export const KEY_NOTES = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
] as const

export type KeyNote = (typeof KEY_NOTES)[number]

export type TonToken = { kind: "ton" }
export type RelToken = { kind: "rel" }

export type DegreeToken = {
  kind: "degree"
  degree: 1 | 2 | 3 | 4 | 5 | 6 | 7
  quality: "maj" | "min"
  ext?: "7"
}

export type RawToken = {
  kind: "raw"
  raw: string
}

export type HarmonyToken = TonToken | RelToken | DegreeToken
export type ParsedHarmonyToken = HarmonyToken | RawToken

export type ProgressionLine = {
  tokens: ParsedHarmonyToken[]
}

export type Section = {
  label: string
  cue?: string
  progressions: ProgressionLine[]
}

export type SongFile = {
  id: string
  title: string
  artist: string
  key: KeyNote
  sections: Section[]
}

export type DisplayMode = "hybrid" | "degrees" | "chords"
export type FontScale = "sm" | "md" | "lg"

export type SongSettings = {
  songId: string
  selectedKey: KeyNote
  displayMode: DisplayMode
  fontScale: FontScale
}

export type SongSettingsMap = Record<string, SongSettings>

export type RepertoireState = {
  songIds: string[]
  currentSongId?: string
  updatedAt: number
}

export type UIState = {
  displayMode: DisplayMode
  fontScale: FontScale
}

export type SharedRepertoireItem = {
  songId: string
  key: KeyNote
}

export type SharedRepertoirePayload = {
  version: 1
  items: SharedRepertoireItem[]
  currentSongId?: string
}
