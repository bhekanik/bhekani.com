import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  getFeedbackEnabled,
  getSkin,
  getTheme,
  setFeedbackEnabled,
  setSkin,
  setTheme,
} from "../../src/scripts/preferences"
import { feedback } from "../../src/scripts/feedback"

describe("session preferences", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    delete window.__bkPreferences
    document.documentElement.className = ""
    delete document.documentElement.dataset.skin
    localStorage.clear()
  })

  it("persists valid choices with the existing storage keys", () => {
    setTheme("dark")
    setSkin("route")
    setFeedbackEnabled(false)

    expect(localStorage.getItem("theme")).toBe("dark")
    expect(localStorage.getItem("bk:skin")).toBe("route")
    expect(localStorage.getItem("bk:feedback")).toBe("off")
  })

  it("keeps theme, edition, and mute choices in the current session when storage writes fail", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage is unavailable", "SecurityError")
    })

    setTheme("dark")
    setSkin("route")
    setFeedbackEnabled(false)

    expect(getTheme()).toBe("dark")
    expect(getSkin()).toBe("route")
    expect(getFeedbackEnabled()).toBe(false)
    expect(document.documentElement).toHaveClass("dark")
    expect(document.documentElement.dataset.skin).toBe("route")
  })

  it("uses the applied defaults and stays mute when storage reads fail", () => {
    document.documentElement.classList.add("light")
    document.documentElement.dataset.skin = "panels"
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage is unavailable", "SecurityError")
    })

    expect(getTheme()).toBe("light")
    expect(getSkin()).toBe("panels")
    expect(getFeedbackEnabled()).toBe(true)

    setFeedbackEnabled(false)

    expect(getFeedbackEnabled()).toBe(false)
  })

  it("keeps an explicit session choice when a later root swap removes its applied attributes", () => {
    setTheme("dark")
    setSkin("route")
    document.documentElement.className = ""
    delete document.documentElement.dataset.skin

    expect(getTheme()).toBe("dark")
    expect(getSkin()).toBe("route")
  })

  it("does not re-enable feedback when storage reads fail after a mute", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage is unavailable", "SecurityError")
    })

    feedback.setEnabled(false)

    expect(feedback.isEnabled()).toBe(false)
  })
})
