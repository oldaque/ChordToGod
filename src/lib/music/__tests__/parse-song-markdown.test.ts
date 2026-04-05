import { describe, expect, test } from "bun:test"

import { parseSongMarkdown } from "../parse-song-markdown"

const VALID_SONG = `---
title: Música Teste
artist: Banda Teste
key: D
search_index: começo | ponte forte
lyrics: |
  Linha um da letra
  Linha dois da letra
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
    expect(song.searchIndex).toEqual(["começo", "ponte forte"])
    expect(song.lyrics).toBe("Linha um da letra\nLinha dois da letra")
    expect(song.sections).toHaveLength(2)
    expect(song.sections[0].label).toBe("CORO")
    expect(song.sections[0].cue).toBe("Começo")
    expect(song.sections[0].progressions[0].tokens[0]).toEqual({ kind: "ton" })
    expect(song.sections[0].progressions[0].tokens[1]).toEqual({ kind: "rel" })
    expect(song.sections[0].progressions[0].tokens[2]).toEqual({ kind: "degree", degree: 4, quality: "maj", ext: undefined })
    expect(song.sections[0].progressions[0].tokens[3]).toEqual({ kind: "degree", degree: 3, quality: "maj", ext: "7" })
    expect(warnings.length).toBe(1)
  })

  test("accepts major seventh literal tokens without invalid warning", () => {
    const rawSong = `---
title: Música Teste
artist: Banda Teste
key: C
---

[CORO]
Ton7M - 4M7 - 4(7M)
`

    const { song, warnings } = parseSongMarkdown("song-7m", rawSong)
    expect(song.sections[0].progressions[0].tokens).toEqual([
      { kind: "raw", raw: "Ton7M" },
      { kind: "raw", raw: "4M7" },
      { kind: "raw", raw: "4(7M)" },
    ])
    expect(warnings).toHaveLength(0)
  })

  test("keeps compatibility when lyrics and search_index are missing", () => {
    const rawSong = `---
title: Sem Extras
artist: Artista
key: C
---

[CORO]
Ton - 4 - 5
`

    const { song } = parseSongMarkdown("song-base", rawSong)
    expect(song.searchIndex).toBeUndefined()
    expect(song.lyrics).toBeUndefined()
  })

  test("throws when required frontmatter is missing", () => {
    expect(() => parseSongMarkdown("invalid", "[CORO]\nTon - 4")).toThrow()
  })
})
