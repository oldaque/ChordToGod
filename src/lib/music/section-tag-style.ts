export type SectionTagStyle = {
  className: string
}

function normalizeLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
}

const TAG_STYLE_MAP: Record<string, SectionTagStyle> = {
  REFRAO: { className: "bg-cyan-500/15 text-cyan-700 border-cyan-500/30 dark:text-cyan-300" },
  CORO: { className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300" },
  PONTE: { className: "bg-amber-500/15 text-amber-800 border-amber-500/35 dark:text-amber-300" },
  VERSO: { className: "bg-orange-500/15 text-orange-800 border-orange-500/35 dark:text-orange-300" },
}

const FALLBACK_STYLE: SectionTagStyle = {
  className: "bg-muted text-muted-foreground border-border",
}

export function getSectionTagStyle(label: string): SectionTagStyle {
  const normalizedLabel = normalizeLabel(label)
  return TAG_STYLE_MAP[normalizedLabel] ?? FALLBACK_STYLE
}

export function normalizeSectionLabel(label: string): string {
  return normalizeLabel(label)
}
