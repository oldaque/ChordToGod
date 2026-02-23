import { describe, expect, test } from "bun:test"

import { applySharedRepertoirePayload } from "../repertoire-import"
import type { SharedRepertoirePayload, SongFile } from "../../types/song"

const SONGS = new Map<string, SongFile>([
  [
    "song-a",
    {
      id: "song-a",
      title: "A",
      artist: "Artist A",
      key: "C",
      sections: [],
    },
  ],
  [
    "song-b",
    {
      id: "song-b",
      title: "B",
      artist: "Artist B",
      key: "D",
      sections: [],
    },
  ],
])

describe("applySharedRepertoirePayload", () => {
  test("imports valid subset and applies song keys", () => {
    const payload: SharedRepertoirePayload = {
      version: 1,
      items: [
        { songId: "song-a", key: "Bb" },
        { songId: "missing", key: "C" },
      ],
      currentSongId: "song-a",
    }

    const result = applySharedRepertoirePayload(
      payload,
      SONGS,
      {},
      { displayMode: "hybrid", fontScale: "md" },
      123
    )

    expect(result).not.toBeNull()
    expect(result?.repertoire.songIds).toEqual(["song-a"])
    expect(result?.repertoire.currentSongId).toBe("song-a")
    expect(result?.repertoire.updatedAt).toBe(123)
    expect(result?.songSettingsMap["song-a"].selectedKey).toBe("Bb")
  })

  test("returns null when payload has no valid songs", () => {
    const payload: SharedRepertoirePayload = {
      version: 1,
      items: [{ songId: "missing", key: "C" }],
    }

    const result = applySharedRepertoirePayload(
      payload,
      SONGS,
      {},
      { displayMode: "hybrid", fontScale: "md" },
      456
    )

    expect(result).toBeNull()
  })
})
