import { describe, expect, test } from "bun:test"

import { parseSongMarkdown } from "../parse-song-markdown"

const VALID_SONG = `---
title: Música Teste
artist: Banda Teste
key: D
---

[CORO] "Começo"
Ton - Rel - 4 - 3(7)

[PONTE]
2m - 5 - INVALIDO
`

describe("parseSongMarkdown", () => {
  test("parses sections with cue and progression tokens", () => {
    const { song, warnings } = parseSongMarkdown("song-1", VALID_SONG)

    expect(song.title).toBe("Música Teste")
    expect(song.artist).toBe("Banda Teste")
    expect(song.key).toBe("D")
    expect(song.sections).toHaveLength(2)
    expect(song.sections[0].label).toBe("CORO")
    expect(song.sections[0].cue).toBe("Começo")
    expect(song.sections[0].progressions[0].tokens[0]).toEqual({ kind: "ton" })
    expect(song.sections[0].progressions[0].tokens[1]).toEqual({ kind: "rel" })
    expect(song.sections[0].progressions[0].tokens[2]).toEqual({ kind: "degree", degree: 4, quality: "maj", ext: undefined })
    expect(song.sections[0].progressions[0].tokens[3]).toEqual({ kind: "degree", degree: 3, quality: "maj", ext: "7" })
    expect(warnings.length).toBe(1)
  })

  test("throws when required frontmatter is missing", () => {
    expect(() => parseSongMarkdown("invalid", "[CORO]\nTon - 4")).toThrow()
  })
})
