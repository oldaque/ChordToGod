import { parseSongMarkdown } from "@/lib/music/parse-song-markdown"
import type { SongFile } from "@/types/song"

const SONG_MODULES = import.meta.glob("/src/content/songs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>

function filePathToSongId(filePath: string): string {
  const filename = filePath.split("/").pop() ?? filePath
  return filename.replace(/\.md$/, "")
}

export function loadSongCatalog(): SongFile[] {
  const songs: SongFile[] = []

  for (const [filePath, rawMarkdown] of Object.entries(SONG_MODULES)) {
    const id = filePathToSongId(filePath)

    try {
      const { song, warnings } = parseSongMarkdown(id, rawMarkdown)
      songs.push(song)

      if (warnings.length > 0 && import.meta.env.DEV) {
        warnings.forEach((warning) => console.warn(`[music] ${warning}`))
      }
    } catch (error) {
      console.error(`[music] Failed to parse ${filePath}.`, error)
    }
  }

  return songs.sort((a, b) => a.title.localeCompare(b.title))
}
