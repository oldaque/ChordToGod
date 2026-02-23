import { useEffect, useMemo, useState } from "react"

import { LibraryScreen } from "@/app/library-screen"
import { PlayScreen } from "@/app/play-screen"
import { applySharedRepertoirePayload } from "@/app/repertoire-import"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useHashRoute } from "@/hooks/use-hash-route"
import { isFlatFamilyKey, transposeKey } from "@/lib/music/harmony"
import { loadSongCatalog } from "@/lib/music/song-catalog"
import {
  decodeSharedRepertoire,
  encodeSharedRepertoire,
  getSharedRepertoireParamFromHash,
} from "@/lib/repertoire-share"
import {
  cycleFontScale,
  loadRepertoire,
  loadSongSettings,
  loadUIState,
  saveRepertoire,
  saveSongSettings,
  saveUIState,
} from "@/lib/storage"
import type {
  DisplayMode,
  KeyNote,
  RepertoireState,
  SharedRepertoirePayload,
  SongFile,
  SongSettingsMap,
  UIState,
} from "@/types/song"

function withTimestamp(repertoire: Omit<RepertoireState, "updatedAt">): RepertoireState {
  return {
    ...repertoire,
    updatedAt: Date.now(),
  }
}

function sanitizeRepertoire(repertoire: RepertoireState, allowedSongIds: Set<string>): RepertoireState {
  const songIds = repertoire.songIds.filter((songId) => allowedSongIds.has(songId))
  const currentSongId = getNextCurrentSongId(songIds, repertoire.currentSongId)

  if (songIds.length === repertoire.songIds.length && currentSongId === repertoire.currentSongId) {
    return repertoire
  }

  return withTimestamp({ songIds, currentSongId })
}

function getNextCurrentSongId(songIds: string[], currentSongId?: string): string | undefined {
  if (songIds.length === 0) {
    return undefined
  }

  if (!currentSongId) {
    return songIds[0]
  }

  if (songIds.includes(currentSongId)) {
    return currentSongId
  }

  return songIds[0]
}

function getSongPosition(songIds: string[], currentSongId?: string): { current: number; total: number } {
  if (!currentSongId) {
    return { current: 0, total: songIds.length }
  }

  const index = songIds.indexOf(currentSongId)
  return {
    current: index >= 0 ? index + 1 : 0,
    total: songIds.length,
  }
}

function moveSong(songIds: string[], songId: string, direction: "up" | "down"): string[] {
  const currentIndex = songIds.indexOf(songId)

  if (currentIndex < 0) {
    return songIds
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

  if (targetIndex < 0 || targetIndex >= songIds.length) {
    return songIds
  }

  const nextSongIds = [...songIds]
  ;[nextSongIds[currentIndex], nextSongIds[targetIndex]] = [nextSongIds[targetIndex], nextSongIds[currentIndex]]
  return nextSongIds
}

function getNeighborSongId(songIds: string[], currentSongId: string | undefined, direction: "prev" | "next"): string | undefined {
  if (songIds.length === 0) {
    return undefined
  }

  const currentIndex = currentSongId ? songIds.indexOf(currentSongId) : -1

  if (currentIndex < 0) {
    return songIds[0]
  }

  if (direction === "next") {
    return songIds[(currentIndex + 1) % songIds.length]
  }

  return songIds[(currentIndex - 1 + songIds.length) % songIds.length]
}

export function AppShell() {
  const songs = useMemo<SongFile[]>(() => loadSongCatalog(), [])
  const songsById = useMemo(() => new Map(songs.map((song) => [song.id, song])), [songs])
  const songIdsFromCatalog = useMemo(() => new Set(songs.map((song) => song.id)), [songs])

  const { route, navigate } = useHashRoute()
  const isOnline = useOnlineStatus()

  const initialUIState = useMemo(() => loadUIState(), [])
  const initialSongSettingsMap = useMemo(() => loadSongSettings(), [])
  const initialRepertoire = useMemo(
    () => sanitizeRepertoire(loadRepertoire(), songIdsFromCatalog),
    [songIdsFromCatalog]
  )
  const initialSharedImport = useMemo(() => {
    const rawPayload = getSharedRepertoireParamFromHash(window.location.hash)

    if (!rawPayload) {
      return null
    }

    const decodedPayload = decodeSharedRepertoire(rawPayload)

    if (!decodedPayload) {
      return null
    }

    return applySharedRepertoirePayload(
      decodedPayload,
      songsById,
      initialSongSettingsMap,
      initialUIState
    )
  }, [initialSongSettingsMap, initialUIState, songsById])

  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<string | undefined>(() =>
    initialSharedImport ? "Repertório importado do link." : undefined
  )
  const [repertoire, setRepertoire] = useState<RepertoireState>(
    initialSharedImport?.repertoire ?? initialRepertoire
  )
  const [songSettingsMap, setSongSettingsMap] = useState<SongSettingsMap>(
    initialSharedImport?.songSettingsMap ?? initialSongSettingsMap
  )
  const [uiState, setUiState] = useState<UIState>(initialUIState)

  useEffect(() => saveRepertoire(repertoire), [repertoire])
  useEffect(() => saveSongSettings(songSettingsMap), [songSettingsMap])
  useEffect(() => saveUIState(uiState), [uiState])

  useEffect(() => {
    if (!shareFeedback) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setShareFeedback(undefined)
    }, 3500)

    return () => window.clearTimeout(timeoutId)
  }, [shareFeedback])

  const currentSong = repertoire.currentSongId ? songsById.get(repertoire.currentSongId) : undefined

  const selectedKey = currentSong
    ? songSettingsMap[currentSong.id]?.selectedKey ?? currentSong.key
    : undefined

  const songPosition = getSongPosition(repertoire.songIds, repertoire.currentSongId)

  const songKeys = useMemo<Record<string, KeyNote>>(() => {
    const mapped: Record<string, KeyNote> = {}

    for (const songId of repertoire.songIds) {
      const song = songsById.get(songId)

      if (!song) {
        continue
      }

      mapped[songId] = songSettingsMap[songId]?.selectedKey ?? song.key
    }

    return mapped
  }, [repertoire.songIds, songSettingsMap, songsById])

  const ensureSongSetting = (songId: string, selectedKey?: KeyNote) => {
    const song = songsById.get(songId)

    if (!song) {
      return
    }

    setSongSettingsMap((prev) => {
      const previous = prev[songId]

      return {
        ...prev,
        [songId]: {
          songId,
          selectedKey: selectedKey ?? previous?.selectedKey ?? song.key,
          displayMode: previous?.displayMode ?? uiState.displayMode,
          fontScale: previous?.fontScale ?? uiState.fontScale,
        },
      }
    })
  }

  const setSongKey = (songId: string, selectedSongKey: KeyNote) => {
    ensureSongSetting(songId, selectedSongKey)
  }

  const addSongToRepertoire = (songId: string) => {
    if (repertoire.songIds.includes(songId)) {
      return
    }

    ensureSongSetting(songId)

    const nextSongIds = [...repertoire.songIds, songId]
    const nextCurrentSongId = repertoire.currentSongId ?? songId

    setRepertoire(withTimestamp({ songIds: nextSongIds, currentSongId: nextCurrentSongId }))
  }

  const removeSongFromRepertoire = (songId: string) => {
    const currentIndex = repertoire.songIds.indexOf(songId)
    const nextSongIds = repertoire.songIds.filter((id) => id !== songId)

    let nextCurrentSongId = repertoire.currentSongId

    if (repertoire.currentSongId === songId) {
      nextCurrentSongId = nextSongIds[currentIndex] ?? nextSongIds[currentIndex - 1] ?? nextSongIds[0]
    }

    setRepertoire(withTimestamp({ songIds: nextSongIds, currentSongId: nextCurrentSongId }))
  }

  const setCurrentSong = (songId: string) => {
    if (!repertoire.songIds.includes(songId)) {
      return
    }

    setRepertoire(withTimestamp({ songIds: repertoire.songIds, currentSongId: songId }))
    ensureSongSetting(songId)
  }

  const reorderSong = (songId: string, direction: "up" | "down") => {
    const nextSongIds = moveSong(repertoire.songIds, songId, direction)

    if (nextSongIds === repertoire.songIds) {
      return
    }

    setRepertoire(withTimestamp({ songIds: nextSongIds, currentSongId: repertoire.currentSongId }))
  }

  const startPlayMode = () => {
    const firstSongId = repertoire.currentSongId ?? repertoire.songIds[0]

    if (!firstSongId) {
      return
    }

    setCurrentSong(firstSongId)
    navigate("/play")
  }

  const goToNeighborSong = (direction: "prev" | "next") => {
    const nextSongId = getNeighborSongId(repertoire.songIds, repertoire.currentSongId, direction)

    if (!nextSongId) {
      return
    }

    setCurrentSong(nextSongId)
  }

  const updateCurrentSongKey = (delta: number) => {
    if (!currentSong) {
      return
    }

    const currentSongKey = songSettingsMap[currentSong.id]?.selectedKey ?? currentSong.key

    const nextKey = transposeKey(currentSongKey, delta, isFlatFamilyKey(currentSong.key))

    setSongSettingsMap((prev) => ({
      ...prev,
      [currentSong.id]: {
        songId: currentSong.id,
        selectedKey: nextKey,
        displayMode: uiState.displayMode,
        fontScale: uiState.fontScale,
      },
    }))
  }

  const resetCurrentSongKey = () => {
    if (!currentSong) {
      return
    }

    setSongSettingsMap((prev) => ({
      ...prev,
      [currentSong.id]: {
        songId: currentSong.id,
        selectedKey: currentSong.key,
        displayMode: uiState.displayMode,
        fontScale: uiState.fontScale,
      },
    }))
  }

  const updateDisplayMode = (displayMode: DisplayMode) => {
    setUiState((prev) => ({ ...prev, displayMode }))

    if (!currentSong) {
      return
    }

    const song = currentSong

    setSongSettingsMap((prev) => ({
      ...prev,
      [song.id]: {
        songId: song.id,
        selectedKey: prev[song.id]?.selectedKey ?? song.key,
        displayMode,
        fontScale: uiState.fontScale,
      },
    }))
  }

  const updateFontScale = (direction: "up" | "down") => {
    const nextFontScale = cycleFontScale(uiState.fontScale, direction)
    setUiState((prev) => ({ ...prev, fontScale: nextFontScale }))

    if (!currentSong) {
      return
    }

    const song = currentSong

    setSongSettingsMap((prev) => ({
      ...prev,
      [song.id]: {
        songId: song.id,
        selectedKey: prev[song.id]?.selectedKey ?? song.key,
        displayMode: uiState.displayMode,
        fontScale: nextFontScale,
      },
    }))
  }

  const shareRepertoire = async () => {
    if (repertoire.songIds.length === 0) {
      setShareFeedback("Adicione músicas antes de compartilhar.")
      return
    }

    const payload: SharedRepertoirePayload = {
      version: 1,
      items: repertoire.songIds
        .map((songId) => {
          const song = songsById.get(songId)

          if (!song) {
            return null
          }

          return {
            songId,
            key: songSettingsMap[songId]?.selectedKey ?? song.key,
          }
        })
        .filter((item): item is { songId: string; key: KeyNote } => Boolean(item)),
      currentSongId: repertoire.currentSongId,
    }

    const encoded = encodeSharedRepertoire(payload)
    const shareUrl = `${window.location.origin}${window.location.pathname}#/?r=${encoded}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareFeedback("Link copiado para a área de transferência.")
    } catch {
      setShareFeedback(shareUrl)
    }
  }

  if (route === "/play") {
    return (
      <PlayScreen
        song={currentSong}
        selectedKey={selectedKey}
        mode={uiState.displayMode}
        fontScale={uiState.fontScale}
        isOnline={isOnline}
        songPosition={songPosition}
        onBack={() => navigate("/")}
        onPrev={() => goToNeighborSong("prev")}
        onNext={() => goToNeighborSong("next")}
        onTranspose={updateCurrentSongKey}
        onResetKey={resetCurrentSongKey}
        onModeChange={updateDisplayMode}
        onFontScaleChange={updateFontScale}
      />
    )
  }

  return (
    <LibraryScreen
      songs={songs}
      repertoire={repertoire}
      searchQuery={searchQuery}
      isSearchActive={isSearchActive}
      shareFeedback={shareFeedback}
      songKeys={songKeys}
      onSearchChange={(value) => {
        setSearchQuery(value)
        if (!isSearchActive) {
          setIsSearchActive(true)
        }
      }}
      onSearchFocus={() => setIsSearchActive(true)}
      onSearchClose={() => setIsSearchActive(false)}
      onShare={shareRepertoire}
      onAddSong={addSongToRepertoire}
      onRemoveSong={removeSongFromRepertoire}
      onMoveSong={reorderSong}
      onSetCurrentSong={setCurrentSong}
      onSetSongKey={setSongKey}
      onStart={startPlayMode}
    />
  )
}
