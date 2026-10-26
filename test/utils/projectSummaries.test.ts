import { describe, expect, it } from "vitest"
import { selectProjectSummaries } from "../../src/utils/projectSummaries"

const projects = [
  { id: "first", data: { title: "First", url: "https://first.example", description: "First description" } },
  { id: "second", data: { title: "Second", url: "https://second.example", description: "Second description" } },
] as const

describe("selectProjectSummaries", () => {
  it("returns the collection facts in the requested page-specific order", () => {
    expect(selectProjectSummaries(projects, ["second", "first"])).toEqual([
      projects[1].data,
      projects[0].data,
    ])
  })

  it("rejects a page projection that refers to a missing project", () => {
    expect(() => selectProjectSummaries(projects, ["missing"])).toThrow("Missing project summary for missing")
  })
})
