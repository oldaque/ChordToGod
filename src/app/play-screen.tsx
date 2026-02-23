import { useEffect, useMemo, useRef, useState } from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatToken, isFlatFamilyKey } from "@/lib/music/harmony"
import { getSectionTagStyle } from "@/lib/music/section-tag-style"
import { cn } from "@/lib/utils"
import type { DisplayMode, FontScale, KeyNote, SongFile } from "@/types/song"

type PlayScreenProps = {
  song?: SongFile
  selectedKey?: KeyNote
  mode: DisplayMode
  fontScale: FontScale
  isOnline: boolean
  songPosition: { current: number; total: number }
  onBack: () => void
  onPrev: () => void
  onNext: () => void
  onTranspose: (delta: number) => void
  onResetKey: () => void
  onModeChange: (mode: DisplayMode) => void
  onFontScaleChange: (direction: "up" | "down") => void
}

const FONT_SCALE_CLASS: Record<FontScale, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
}

const MODE_OPTIONS: DisplayMode[] = ["hybrid", "degrees", "chords"]

export function PlayScreen({
  song,
  selectedKey,
  mode,
  fontScale,
  isOnline,
  songPosition,
  onBack,
  onPrev,
  onNext,
  onTranspose,
  onResetKey,
  onModeChange,
  onFontScaleChange,
}: PlayScreenProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  const prefersFlats = useMemo(() => isFlatFamilyKey(song?.key ?? "C"), [song?.key])

  useEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current

    if (!viewport || !content) {
      return
    }

    const checkOverflow = () => {
      setIsOverflowing(content.scrollHeight > viewport.clientHeight)
    }

    checkOverflow()

    const observer = new ResizeObserver(checkOverflow)
    observer.observe(viewport)
    observer.observe(content)

    return () => observer.disconnect()
  }, [fontScale, mode, song?.id, selectedKey])

  if (!song || !selectedKey) {
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-3 p-4">
        <p className="text-center text-muted-foreground">Selecione músicas no repertório para iniciar.</p>
        <Button type="button" size="lg" onClick={onBack} className="min-h-11 min-w-28">
          Repertório
        </Button>
      </main>
    )
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.changedTouches[0].clientX
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) {
      return
    }

    const deltaX = event.changedTouches[0].clientX - touchStartXRef.current
    touchStartXRef.current = null

    if (Math.abs(deltaX) < 60) {
      return
    }

    if (deltaX < 0) {
      onNext()
      return
    }

    onPrev()
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="space-y-2 border-b bg-background/95 p-2 backdrop-blur md:p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold tracking-tight">ChordToGod</p>
            <p className="text-sm font-medium leading-tight">
              {song.title} <span className="text-muted-foreground">• {song.artist}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {isOnline ? "Online" : "Offline"} • {songPosition.current}/{songPosition.total}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle mode="icon-menu" />
            <Button type="button" variant="outline" size="sm" className="min-h-11 min-w-20" onClick={onBack}>
              Repertório
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <div className="col-span-2 flex flex-wrap items-center gap-1 rounded-lg border border-border p-1">
            {MODE_OPTIONS.map((modeOption) => (
              <Button
                key={modeOption}
                type="button"
                size="sm"
                variant={modeOption === mode ? "default" : "ghost"}
                className="min-h-11 min-w-[5.6rem] flex-1 capitalize"
                onClick={() => onModeChange(modeOption)}
              >
                {modeOption}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 flex-1"
              onClick={() => onTranspose(-1)}
            >
              -1
            </Button>
            <button type="button" className="min-h-11 flex-1 text-sm font-semibold" onClick={onResetKey}>
              {selectedKey}
            </button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 flex-1"
              onClick={() => onTranspose(1)}
            >
              +1
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-lg border border-border p-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 min-w-14"
              onClick={() => onFontScaleChange("down")}
            >
              A-
            </Button>
            <span className="text-xs font-semibold text-muted-foreground">Fonte</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 min-w-14"
              onClick={() => onFontScaleChange("up")}
            >
              A+
            </Button>
          </div>
        </div>

        {isOverflowing && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Conteúdo excedeu a tela. Reduza a fonte ou simplifique anotações dessa música.
          </p>
        )}
      </header>

      <section
        ref={viewportRef}
        className="min-h-0 flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div ref={contentRef} className={cn("space-y-3 p-2 pb-20 font-mono md:p-3", FONT_SCALE_CLASS[fontScale])}>
          {song.sections.map((section) => (
            <article key={`${song.id}-${section.label}`} className="rounded-xl border border-border bg-card p-2 md:p-3">
              <div className="mb-2">
                {section.cue ? (
                  <p className="font-sans text-sm font-semibold leading-tight text-foreground">"{section.cue}"</p>
                ) : (
                  <p className="font-sans text-xs text-muted-foreground">Sem trecho</p>
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  {section.progressions.map((progression, index) => (
                    <p key={`${song.id}-${section.label}-line-${index}`} className="leading-snug break-words">
                      {progression.tokens
                        .map((token) => formatToken(token, mode, selectedKey, prefersFlats))
                        .join(" - ")}
                    </p>
                  ))}
                </div>
                <Badge
                  variant="outline"
                  className={cn("shrink-0 border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide", getSectionTagStyle(section.label).className)}
                >
                  {section.label}
                </Badge>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="grid grid-cols-2 gap-2 border-t bg-background/95 p-2 backdrop-blur md:p-3">
        <Button type="button" size="lg" variant="outline" className="min-h-12" onClick={onPrev}>
          Anterior
        </Button>
        <Button type="button" size="lg" className="min-h-12" onClick={onNext}>
          Próxima
        </Button>
      </footer>
    </main>
  )
}
