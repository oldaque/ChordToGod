import { AppShell } from "@/app/app-shell"
import { ThemeProvider } from "@/components/theme-provider"

export function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  )
}

export default App
