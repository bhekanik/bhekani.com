import { describe, expect, it } from "vitest"
import { getMicroLabel } from "../../src/utils/micro"

describe("Micro labels", () => {
  it("uses a supplied title and creates a deterministic date fallback only where a label is needed", () => {
    const date = new Date("2026-10-26T12:00:00.000Z")
    expect(getMicroLabel("A real title", date)).toBe("A real title")
    expect(getMicroLabel(undefined, date)).toBe("Micro note — October 26, 2026")
  })
})
