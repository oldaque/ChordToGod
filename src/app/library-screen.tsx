import { useEffect, useRef } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { KEY_NOTES, type KeyNote, type RepertoireState, type SongFile } from "@/types/song"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons"

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

type LibraryScreenProps = {
  songs: SongFile[]
  repertoire: RepertoireState
  searchQuery: string
  isSearchActive: boolean
  shareFeedback?: string
  songKeys: Record<string, KeyNote>
  onSearchChange: (value: string) => void
  onSearchFocus: () => void
  onSearchClose: () => void
  onShare: () => void | Promise<void>
  onAddSong: (songId: string) => void
  onRemoveSong: (songId: string) => void
  onMoveSong: (songId: string, direction: "up" | "down") => void
  onSetCurrentSong: (songId: string) => void
  onSetSongKey: (songId: string, key: KeyNote) => void
  onStart: () => void
}

export function LibraryScreen({
  songs,
  repertoire,
  searchQuery,
  isSearchActive,
  shareFeedback,
  songKeys,
  onSearchChange,
  onSearchFocus,
  onSearchClose,
  onShare,
  onAddSong,
  onRemoveSong,
  onMoveSong,
  onSetCurrentSong,
  onSetSongKey,
  onStart,
}: LibraryScreenProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const songIdsInRepertoire = new Set(repertoire.songIds)

  useEffect(() => {
    if (!isSearchActive) {
      return
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onSearchClose()
      }
    }

    window.addEventListener("keydown", onEscape)

    return () => {
      window.removeEventListener("keydown", onEscape)
    }
  }, [isSearchActive, onSearchClose])

  const filteredSongs = songs.filter((song) => {
    const normalizedQuery = normalizeSearchText(searchQuery.trim())

    if (!normalizedQuery) {
      return false
    }

    const searchableText = [
      song.title,
      song.artist,
      song.searchIndex?.join(" ") ?? "",
      song.lyrics ?? "",
    ]
      .join(" ")
      .trim()

    const normalizedSearchableText = normalizeSearchText(searchableText)

    return (
      normalizedSearchableText.includes(normalizedQuery)
    )
  })

  const repertoireSongs = repertoire.songIds
    .map((songId) => songs.find((song) => song.id === songId))
    .filter((song): song is SongFile => Boolean(song))

  const handleSearchCloseOrClear = () => {
    if (searchQuery.trim().length > 0) {
      onSearchChange("")
      searchInputRef.current?.focus()
      return
    }

    onSearchClose()
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-3 pb-6 md:p-6">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">ChordToGod</h1>
        <ThemeToggle mode="icon-menu" />
      </header>

      <div className="relative z-30">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={searchInputRef}
          value={searchQuery}
          placeholder="pesquisar música"
          onFocus={onSearchFocus}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Pesquisar música"
          className="min-h-11 rounded-full ps-9 pe-12"
        />
        {isSearchActive ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute end-1 top-1/2 size-9 -translate-y-1/2 rounded-full"
            onClick={handleSearchCloseOrClear}
            aria-label={searchQuery.trim().length > 0 ? "Limpar busca" : "Fechar busca"}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          </Button>
        ) : null}
      </div>

      <section className="relative min-h-[62dvh]">
        <Card
          className={cn(
            "transition-all duration-200 ease-out",
            isSearchActive && "pointer-events-none scale-[0.99] opacity-55 blur-[2px]"
          )}
        >
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Repertório</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-10"
                onClick={() => void onShare()}
                disabled={repertoireSongs.length === 0}
              >
                Compartilhar
              </Button>
            </div>
            {shareFeedback ? <CardDescription>{shareFeedback}</CardDescription> : null}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-[50dvh] space-y-2 overflow-y-auto pr-1 md:max-h-[56dvh]">
              {repertoireSongs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Adicione músicas pela busca para montar o repertório.</p>
              ) : (
                repertoireSongs.map((song, index) => {
                  const isCurrent = repertoire.currentSongId === song.id
                  const selectedKey = songKeys[song.id] ?? song.key

                  return (
                    <div key={song.id} className="rounded-lg border border-border/70 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <button type="button" className="min-h-11 text-start" onClick={() => onSetCurrentSong(song.id)}>
                          <p className="font-medium leading-tight">{song.title}</p>
                          <p className="text-xs text-muted-foreground">{song.artist}</p>
                        </button>
                        {isCurrent ? <Badge>Atual</Badge> : <Badge variant="outline">Selecionar</Badge>}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Select value={selectedKey} onValueChange={(value) => onSetSongKey(song.id, value as KeyNote)}>
                          <SelectTrigger size="default" className="min-h-11 w-28" aria-label={`Tom de ${song.title}`}>
                            <SelectValue placeholder="Tom" />
                          </SelectTrigger>
                          <SelectContent>
                            {KEY_NOTES.map((key) => (
                              <SelectItem key={`${song.id}-${key}`} value={key}>
                                {key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          type="button"
                          size="lg"
                          variant="outline"
                          className="min-h-11"
                          onClick={() => onMoveSong(song.id, "up")}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          size="lg"
                          variant="outline"
                          className="min-h-11"
                          onClick={() => onMoveSong(song.id, "down")}
                          disabled={index === repertoireSongs.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          type="button"
                          size="lg"
                          variant="destructive"
                          className="min-h-11"
                          onClick={() => onRemoveSong(song.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="sticky bottom-0 border-t bg-card pt-3">
              <Button
                type="button"
                size="lg"
                className="min-h-11 w-full"
                disabled={repertoireSongs.length === 0}
                onClick={onStart}
              >
                Iniciar
              </Button>
            </div>
          </CardContent>
        </Card>

        <button
          type="button"
          aria-label="Fechar painel de busca"
          onClick={onSearchClose}
          className={cn(
            "absolute inset-0 z-10 cursor-default rounded-xl bg-background/10 backdrop-blur-sm transition-all duration-150",
            isSearchActive ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        />

        <div
          className={cn(
            "absolute inset-x-0 top-0 z-20 origin-top transition-all duration-150",
            isSearchActive ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2 scale-[0.98] opacity-0 pointer-events-none"
          )}
        >
          <Card className="border-primary/20 bg-background/95 shadow-xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
              <CardDescription>
                {searchQuery.trim().length === 0 ? "Digite para começar a buscar." : `${filteredSongs.length} resultado(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[50dvh] space-y-2 overflow-y-auto pr-1 md:max-h-[56dvh]">
                {searchQuery.trim().length === 0 ? (
                  <p className="text-sm text-muted-foreground">Busque por título, cantor, índice ou letra.</p>
                ) : filteredSongs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma música encontrada.</p>
                ) : (
                  filteredSongs.map((song) => {
                    const inRepertoire = songIdsInRepertoire.has(song.id)

                    return (
                      <div key={song.id} className="flex items-center justify-between rounded-lg border border-border/70 p-2">
                        <div>
                          <p className="font-medium leading-tight">{song.title}</p>
                          <p className="text-xs text-muted-foreground">{song.artist}</p>
                        </div>
                        {inRepertoire ? (
                          <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            className="min-h-11 min-w-20"
                            onClick={() => onRemoveSong(song.id)}
                          >
                            Remover
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="lg"
                            className="min-h-11 min-w-20"
                            onClick={() => onAddSong(song.id)}
                          >
                            Adicionar
                          </Button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
