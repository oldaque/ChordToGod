import type { DisplayMode, DegreeToken, HarmonyToken, KeyNote, ParsedHarmonyToken } from "@/types/song"

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  "B#": 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  "E#": 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
}

const SHARP_SCALE: KeyNote[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const FLAT_SCALE: KeyNote[] = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const

const DEGREE_TOKEN_REGEX = /^(?<degree>[1-7])(?<minor>m)?(?:\((?<ext>7)\))?$/i

const DEFAULT_KEY: KeyNote = "C"

export function isFlatFamilyKey(note: string): boolean {
  return note.includes("b")
}

export function isSupportedKey(note: string): note is KeyNote {
  return NOTE_TO_SEMITONE[note] !== undefined
}

export function normalizeKey(note: string): KeyNote {
  if (isSupportedKey(note)) {
    return note
  }

  if (import.meta.env.DEV) {
    console.warn(`[music] Invalid key '${note}', falling back to ${DEFAULT_KEY}.`)
  }

  return DEFAULT_KEY
}

export function transposeKey(currentKey: KeyNote, semitones: number, preferFlats: boolean): KeyNote {
  const normalizedSteps = ((semitones % 12) + 12) % 12
  const currentSemitone = NOTE_TO_SEMITONE[currentKey]
  const nextSemitone = (currentSemitone + normalizedSteps) % 12

  return preferFlats ? FLAT_SCALE[nextSemitone] : SHARP_SCALE[nextSemitone]
}

function degreeToChord(degreeToken: DegreeToken, key: KeyNote, preferFlats: boolean): string {
  const keySemitone = NOTE_TO_SEMITONE[key]
  const interval = MAJOR_INTERVALS[degreeToken.degree - 1]
  const chordSemitone = (keySemitone + interval) % 12
  const root = preferFlats ? FLAT_SCALE[chordSemitone] : SHARP_SCALE[chordSemitone]

  if (degreeToken.quality === "min") {
    return `${root}m${degreeToken.ext === "7" ? "7" : ""}`
  }

  return `${root}${degreeToken.ext === "7" ? "7" : ""}`
}

function toDegreeToken(token: HarmonyToken): DegreeToken {
  if (token.kind === "degree") {
    return token
  }

  if (token.kind === "ton") {
    return { kind: "degree", degree: 1, quality: "maj" }
  }

  return { kind: "degree", degree: 6, quality: "min" }
}

export function formatAsDegree(token: ParsedHarmonyToken): string {
  if (token.kind === "raw") {
    return token.raw
  }

  if (token.kind === "ton") {
    return "1"
  }

  if (token.kind === "rel") {
    return "6m"
  }

  return `${token.degree}${token.quality === "min" ? "m" : ""}${token.ext === "7" ? "(7)" : ""}`
}

export function formatToken(
  token: ParsedHarmonyToken,
  mode: DisplayMode,
  key: KeyNote,
  preferFlats: boolean
): string {
  if (token.kind === "raw") {
    return token.raw
  }

  if (mode === "hybrid") {
    if (token.kind === "ton") {
      return "Ton"
    }

    if (token.kind === "rel") {
      return "Rel"
    }

    return formatAsDegree(token)
  }

  if (mode === "degrees") {
    return formatAsDegree(token)
  }

  return degreeToChord(toDegreeToken(token), key, preferFlats)
}

export function parseHarmonyToken(rawToken: string): ParsedHarmonyToken {
  const normalized = rawToken.trim()

  if (!normalized) {
    return { kind: "raw", raw: rawToken }
  }

  if (/^ton$/i.test(normalized)) {
    return { kind: "ton" }
  }

  if (/^rel$/i.test(normalized)) {
    return { kind: "rel" }
  }

  const match = normalized.match(DEGREE_TOKEN_REGEX)

  if (!match?.groups) {
    if (import.meta.env.DEV) {
      console.warn(`[music] Invalid harmony token '${rawToken}', rendering raw.`)
    }

    return { kind: "raw", raw: rawToken.trim() }
  }

  return {
    kind: "degree",
    degree: Number(match.groups.degree) as DegreeToken["degree"],
    quality: match.groups.minor ? "min" : "maj",
    ext: match.groups.ext === "7" ? "7" : undefined,
  }
}
