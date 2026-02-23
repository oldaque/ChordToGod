import { describe, expect, test } from "bun:test"

import {
  decodeSharedRepertoire,
  encodeSharedRepertoire,
  getSharedRepertoireParamFromHash,
} from "../repertoire-share"

function rawJsonToBase64Url(json: string): string {
  return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

describe("repertoire share", () => {
  test("encodes and decodes a valid payload", () => {
    const encoded = encodeSharedRepertoire({
      version: 1,
      items: [
        { songId: "a", key: "C" },
        { songId: "b", key: "Bb" },
      ],
      currentSongId: "b",
    })

    const decoded = decodeSharedRepertoire(encoded)

    expect(decoded).not.toBeNull()
    expect(decoded?.version).toBe(1)
    expect(decoded?.items).toHaveLength(2)
    expect(decoded?.currentSongId).toBe("b")
  })

  test("returns null for invalid version", () => {
    const invalid = rawJsonToBase64Url(JSON.stringify({ version: 2, items: [] }))
    expect(decodeSharedRepertoire(invalid)).toBeNull()
  })

  test("returns null for corrupted payload", () => {
    expect(decodeSharedRepertoire("%%%not-valid%%%")).toBeNull()
  })

  test("discards invalid items and keeps valid ones", () => {
    const encoded = rawJsonToBase64Url(
      JSON.stringify({
        version: 1,
        items: [
          { songId: "ok", key: "D" },
          { songId: "bad", key: "H" },
          { songId: "", key: "C" },
        ],
      })
    )

    const decoded = decodeSharedRepertoire(encoded)

    expect(decoded).not.toBeNull()
    expect(decoded?.items).toEqual([{ songId: "ok", key: "D" }])
  })

  test("extracts share param from hash", () => {
    expect(getSharedRepertoireParamFromHash("#/?r=abc")).toBe("abc")
    expect(getSharedRepertoireParamFromHash("#/play")).toBeNull()
  })
})
