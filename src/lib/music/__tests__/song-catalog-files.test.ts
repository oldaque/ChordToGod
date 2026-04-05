import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "bun:test"

import { parseSongMarkdown } from "../parse-song-markdown"

const SONGS_DIR = join(import.meta.dir, "../../../content/songs")

describe("song markdown files", () => {
  test("all song files parse without throwing", () => {
    const files = readdirSync(SONGS_DIR).filter((file) => file.endsWith(".md"))
    expect(files.length).toBeGreaterThan(0)

    for (const file of files) {
      const id = file.replace(/\.md$/, "")
      const content = readFileSync(join(SONGS_DIR, file), "utf-8")
      const { song } = parseSongMarkdown(id, content)

      expect(song.title.length).toBeGreaterThan(0)
      expect(song.artist.length).toBeGreaterThan(0)
      expect(song.sections.length).toBeGreaterThan(0)
    }
  })
})
