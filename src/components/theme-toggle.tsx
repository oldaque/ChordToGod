import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme, type ThemeMode } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { ComputerIcon, MoonIcon, SunIcon, Tick02Icon } from "@hugeicons/core-free-icons"

const MODES: ThemeMode[] = ["system", "light", "dark"]

type ThemeToggleProps = {
  compact?: boolean
  mode?: "segmented" | "compact-menu" | "icon-menu"
}

const MODE_LABEL: Record<ThemeMode, string> = {
  system: "Sistema",
  light: "Claro",
  dark: "Escuro",
}

export function getThemeIconKind(theme: ThemeMode): "system" | "light" | "dark" {
  if (theme === "dark") {
    return "dark"
  }

  if (theme === "light") {
    return "light"
  }

  return "system"
}

export function ThemeToggle({ compact = false, mode = "segmented" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const activeIconKind = getThemeIconKind(theme)
  const activeIcon = activeIconKind === "dark" ? MoonIcon : activeIconKind === "light" ? SunIcon : ComputerIcon

  if (mode === "compact-menu") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="min-h-11 min-w-20">
            Tema
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {MODES.map((themeMode) => (
            <DropdownMenuItem key={themeMode} onClick={() => setTheme(themeMode)}>
              {MODE_LABEL[themeMode]}
              {theme === themeMode ? " •" : ""}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (mode === "icon-menu") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="size-11 rounded-full"
            aria-label="Alternar tema"
          >
            <HugeiconsIcon icon={activeIcon} strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {MODES.map((themeMode) => (
            <DropdownMenuItem key={themeMode} onClick={() => setTheme(themeMode)}>
              <HugeiconsIcon
                icon={themeMode === "dark" ? MoonIcon : themeMode === "light" ? SunIcon : ComputerIcon}
                strokeWidth={2}
                className="me-1"
              />
              {MODE_LABEL[themeMode]}
              {theme === themeMode ? <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="ms-auto" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1", compact && "p-0.5")}>
      {MODES.map((mode) => (
        <Button
          key={mode}
          type="button"
          size={compact ? "sm" : "default"}
          variant={theme === mode ? "default" : "ghost"}
          className="min-w-16 capitalize"
          onClick={() => setTheme(mode)}
          aria-label={`Set theme to ${mode}`}
        >
          {mode}
        </Button>
      ))}
    </div>
  )
}
