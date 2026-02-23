import { describe, expect, test } from "bun:test"

import { getSectionTagStyle, normalizeSectionLabel } from "../section-tag-style"

describe("section tag style", () => {
  test("normalizes accented labels", () => {
    expect(normalizeSectionLabel("Refrão")).toBe("REFRAO")
    expect(normalizeSectionLabel("  coro ")).toBe("CORO")
  })

  test("returns fixed style for known labels", () => {
    expect(getSectionTagStyle("REFRÃO").className).toContain("cyan")
    expect(getSectionTagStyle("Refrão").className).toContain("cyan")
    expect(getSectionTagStyle("CORO").className).toContain("emerald")
  })

  test("falls back to neutral style for unknown labels", () => {
    expect(getSectionTagStyle("INTRO").className).toContain("bg-muted")
  })
})
