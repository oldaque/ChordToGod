import { describe, expect, test } from "bun:test"

import { formatToken, parseHarmonyToken, transposeKey } from "../harmony"

describe("harmony parser", () => {
  test("parses valid v1 tokens", () => {
    expect(parseHarmonyToken("Ton")).toEqual({ kind: "ton" })
    expect(parseHarmonyToken("Rel")).toEqual({ kind: "rel" })
    expect(parseHarmonyToken("2m")).toEqual({ kind: "degree", degree: 2, quality: "min", ext: undefined })
    expect(parseHarmonyToken("3(7)")).toEqual({ kind: "degree", degree: 3, quality: "maj", ext: "7" })
    expect(parseHarmonyToken("2m(7)")).toEqual({ kind: "degree", degree: 2, quality: "min", ext: "7" })
  })

  test("falls back to raw when token is invalid", () => {
    expect(parseHarmonyToken("sus4")).toEqual({ kind: "raw", raw: "sus4" })
  })

  test("keeps major seventh literals as raw accepted tokens", () => {
    expect(parseHarmonyToken("Ton7M")).toEqual({ kind: "raw", raw: "Ton7M" })
    expect(parseHarmonyToken("4M7")).toEqual({ kind: "raw", raw: "4M7" })
    expect(parseHarmonyToken("4(7M)")).toEqual({ kind: "raw", raw: "4(7M)" })
  })
})

describe("key transposition", () => {
  test("transposes notes preserving accidental family", () => {
    expect(transposeKey("C", 2, false)).toBe("D")
    expect(transposeKey("D", 2, false)).toBe("E")
    expect(transposeKey("E", -1, false)).toBe("D#")
    expect(transposeKey("Bb", 2, true)).toBe("C")
  })

  test("renders Rel as vi minor in chord mode", () => {
    const relChordInC = formatToken({ kind: "rel" }, "chords", "C", false)
    const relChordInD = formatToken({ kind: "rel" }, "chords", "D", false)
    const relChordInBb = formatToken({ kind: "rel" }, "chords", "Bb", true)

    expect(relChordInC).toBe("Am")
    expect(relChordInD).toBe("Bm")
    expect(relChordInBb).toBe("Gm")
  })
})
