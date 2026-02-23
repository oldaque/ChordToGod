import type { RepertoireState, SharedRepertoirePayload, SongFile, SongSettingsMap, UIState } from "@/types/song"

type SharedImportResult = {
  repertoire: RepertoireState
  songSettingsMap: SongSettingsMap
}

export function applySharedRepertoirePayload(
  payload: SharedRepertoirePayload,
  songsById: Map<string, SongFile>,
  currentSettings: SongSettingsMap,
  uiState: UIState,
  now: number = Date.now()
): SharedImportResult | null {
  const validItems = payload.items.filter((item) => songsById.has(item.songId))

  if (validItems.length === 0) {
    return null
  }

  const songIds = validItems.map((item) => item.songId)
  const currentSongId = payload.currentSongId && songIds.includes(payload.currentSongId)
    ? payload.currentSongId
    : songIds[0]

  const nextSettings: SongSettingsMap = { ...currentSettings }

  for (const item of validItems) {
    const song = songsById.get(item.songId)

    if (!song) {
      continue
    }

    const previous = currentSettings[item.songId]

    nextSettings[item.songId] = {
      songId: item.songId,
      selectedKey: item.key,
      displayMode: previous?.displayMode ?? uiState.displayMode,
      fontScale: previous?.fontScale ?? uiState.fontScale,
    }
  }

  return {
    repertoire: {
      songIds,
      currentSongId,
      updatedAt: now,
    },
    songSettingsMap: nextSettings,
  }
}
