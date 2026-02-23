import { describe, expect, test } from "bun:test"

import { getThemeIconKind } from "../theme-toggle"

describe("theme toggle icon mode", () => {
  test("returns icon kind for each theme", () => {
    expect(getThemeIconKind("system")).toBe("system")
    expect(getThemeIconKind("light")).toBe("light")
    expect(getThemeIconKind("dark")).toBe("dark")
  })
})
