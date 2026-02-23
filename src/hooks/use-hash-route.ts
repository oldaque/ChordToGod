import { useEffect, useMemo, useState } from "react"

export type AppRoute = "/" | "/play"

function parseHashRoute(hash: string): AppRoute {
  const normalized = hash.replace(/^#/, "") || "/"
  return normalized.startsWith("/play") ? "/play" : "/"
}

export function useHashRoute() {
  const [route, setRoute] = useState<AppRoute>(() => parseHashRoute(window.location.hash))

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = "/"
    }

    const onHashChange = () => setRoute(parseHashRoute(window.location.hash))

    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  const navigate = useMemo(
    () => (nextRoute: AppRoute) => {
      window.location.hash = nextRoute
    },
    []
  )

  return { route, navigate }
}
