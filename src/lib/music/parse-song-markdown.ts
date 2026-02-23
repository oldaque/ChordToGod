import type { KeyNote, Section, SongFile } from "@/types/song"
import { normalizeKey, parseHarmonyToken } from "@/lib/music/harmony"

type ParseResult = {
  song: SongFile
  warnings: string[]
}

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n?/m
const SECTION_HEADER_REGEX = /^\[(?<label>[^\]]+)](?:\s+["“](?<cue>.+?)["”])?\s*$/

export function parseSongMarkdown(id: string, rawMarkdown: string): ParseResult {
  const warnings: string[] = []

  const frontmatterMatch = rawMarkdown.match(FRONTMATTER_REGEX)
  if (!frontmatterMatch) {
    throw new Error(`Song '${id}' is missing frontmatter block.`)
  }

  const metadata = parseFrontmatter(frontmatterMatch[1])

  const title = metadata.title?.trim()
  const artist = metadata.artist?.trim()
  const key = normalizeKey((metadata.key ?? "C").trim())

  if (!title) {
    throw new Error(`Song '${id}' is missing required 'title' metadata.`)
  }

  if (!artist) {
    throw new Error(`Song '${id}' is missing required 'artist' metadata.`)
  }

  if (!metadata.key) {
    warnings.push(`Song '${id}' is missing key metadata. Falling back to C.`)
  }

  const content = rawMarkdown.slice(frontmatterMatch[0].length)
  const sections = parseSections(content, id, warnings)

  return {
    song: {
      id,
      title,
      artist,
      key: key as KeyNote,
      sections,
    },
    warnings,
  }
}

function parseFrontmatter(frontmatter: string): Record<string, string> {
  return frontmatter
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, line) => {
      const separatorIndex = line.indexOf(":")
      if (separatorIndex < 0) {
        return acc
      }

      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim()
      acc[key] = value
      return acc
    }, {})
}

function parseSections(content: string, songId: string, warnings: string[]): Section[] {
  const lines = content.split("\n")
  const sections: Section[] = []

  let currentSection: Section | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      continue
    }

    const sectionMatch = line.match(SECTION_HEADER_REGEX)

    if (sectionMatch?.groups?.label) {
      currentSection = {
        label: sectionMatch.groups.label.trim(),
        cue: sectionMatch.groups.cue?.trim(),
        progressions: [],
      }

      sections.push(currentSection)
      continue
    }

    if (!currentSection) {
      warnings.push(`Song '${songId}' has progression outside section: '${line}'.`)
      continue
    }

    const sectionLabel = currentSection.label

    const tokens = line
      .split("-")
      .map((token) => token.trim())
      .filter(Boolean)
      .map((token) => {
        const parsed = parseHarmonyToken(token)

        if (parsed.kind === "raw") {
          warnings.push(`Song '${songId}' has invalid token '${token}' in section '${sectionLabel}'.`)
        }

        return parsed
      })

    currentSection.progressions.push({ tokens })
  }

  return sections
}
