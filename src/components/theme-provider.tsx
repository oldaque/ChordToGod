import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { STORAGE_KEYS } from "@/lib/storage"

export type ThemeMode = "system" | "light" | "dark"

type ThemeContextValue = {
  theme: ThemeMode
  resolvedTheme: "light" | "dark"
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light"
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "system"
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEYS.theme)

  if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
    return savedTheme
  }

  return "system"
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(getSystemTheme)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const applyTheme = (nextTheme: ThemeMode) => {
      const nextResolvedTheme = nextTheme === "system" ? getSystemTheme() : nextTheme
      setResolvedTheme(nextResolvedTheme)
      document.documentElement.classList.toggle("dark", nextResolvedTheme === "dark")
    }

    applyTheme(theme)

    const handleSystemThemeChange = () => {
      if (theme === "system") {
        applyTheme("system")
      }
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange)
    }
  }, [theme])

  const setTheme = (nextTheme: ThemeMode) => {
    setThemeState(nextTheme)
    window.localStorage.setItem(STORAGE_KEYS.theme, nextTheme)
  }

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider")
  }

  return context
}
