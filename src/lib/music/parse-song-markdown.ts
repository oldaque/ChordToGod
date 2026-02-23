import type { KeyNote, Section, SongFile } from "@/types/song"
import { isAcceptedLiteralToken, normalizeKey, parseHarmonyToken } from "@/lib/music/harmony"

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
  const searchIndex = parseSearchIndex(metadata.search_index)
  const lyrics = metadata.lyrics?.trim()

  return {
    song: {
      id,
      title,
      artist,
      key: key as KeyNote,
      searchIndex: searchIndex.length > 0 ? searchIndex : undefined,
      lyrics: lyrics ? lyrics : undefined,
      sections,
    },
    warnings,
  }
}

function parseFrontmatter(frontmatter: string): Record<string, string> {
  const lines = frontmatter.split("\n")
  const metadata: Record<string, string> = {}
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      index += 1
      continue
    }

    const separatorIndex = line.indexOf(":")

    if (separatorIndex < 0) {
      index += 1
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()

    if (value !== "|") {
      metadata[key] = value
      index += 1
      continue
    }

    index += 1
    const blockLines: string[] = []

    while (index < lines.length) {
      const blockLine = lines[index]

      if (!blockLine.trim()) {
        blockLines.push("")
        index += 1
        continue
      }

      if (/^\s+/.test(blockLine)) {
        blockLines.push(blockLine.replace(/^\s+/, ""))
        index += 1
        continue
      }

      break
    }

    metadata[key] = blockLines.join("\n").trimEnd()
  }

  return metadata
}

function parseSearchIndex(raw: string | undefined): string[] {
  if (!raw) {
    return []
  }

  return raw
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
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

        if (parsed.kind === "raw" && !isAcceptedLiteralToken(token)) {
          warnings.push(`Song '${songId}' has invalid token '${token}' in section '${sectionLabel}'.`)
        }

        return parsed
      })

    currentSection.progressions.push({ tokens })
  }

  return sections
}
