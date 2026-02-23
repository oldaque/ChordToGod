import { KEY_NOTES, type SharedRepertoireItem, type SharedRepertoirePayload } from "@/types/song"

const SUPPORTED_KEYS = new Set<string>(KEY_NOTES)

function bytesToBase64(input: Uint8Array): string {
  let binary = ""

  for (const byte of input) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

function base64ToBytes(input: string): Uint8Array {
  const binary = atob(input)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromBase64Url(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  const padLength = (4 - (base64.length % 4)) % 4

  return `${base64}${"=".repeat(padLength)}`
}

function isValidSharedItem(value: unknown): value is SharedRepertoireItem {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<SharedRepertoireItem>

  return (
    typeof candidate.songId === "string" &&
    candidate.songId.length > 0 &&
    typeof candidate.key === "string" &&
    SUPPORTED_KEYS.has(candidate.key)
  )
}

export function encodeSharedRepertoire(payload: SharedRepertoirePayload): string {
  const json = JSON.stringify(payload)
  const encoded = bytesToBase64(new TextEncoder().encode(json))

  return toBase64Url(encoded)
}

export function decodeSharedRepertoire(raw: string): SharedRepertoirePayload | null {
  try {
    const base64 = fromBase64Url(raw)
    const json = new TextDecoder().decode(base64ToBytes(base64))
    const parsed = JSON.parse(json) as Partial<SharedRepertoirePayload>

    if (parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return null
    }

    const items = parsed.items.filter((item) => isValidSharedItem(item))

    return {
      version: 1,
      items,
      currentSongId:
        typeof parsed.currentSongId === "string" && parsed.currentSongId.length > 0
          ? parsed.currentSongId
          : undefined,
    }
  } catch {
    return null
  }
}

export function getSharedRepertoireParamFromHash(hash: string): string | null {
  const cleanHash = hash.startsWith("#") ? hash.slice(1) : hash
  const queryStart = cleanHash.indexOf("?")

  if (queryStart < 0) {
    return null
  }

  const params = new URLSearchParams(cleanHash.slice(queryStart + 1))
  return params.get("r")
}
