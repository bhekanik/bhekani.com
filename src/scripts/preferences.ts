export type Skin = "panels" | "route"
export type Theme = "light" | "dark"

type PreferenceMemory = {
  bootstrapBound?: boolean
  feedback?: boolean
  skin?: Skin
  theme?: Theme
  bindings?: Set<string>
}

declare global {
  interface Window {
    __bkPreferences?: PreferenceMemory
  }
}

const SKIN_KEY = "bk:skin"
const THEME_KEY = "theme"
const FEEDBACK_KEY = "bk:feedback"

function memory(): PreferenceMemory {
  if (typeof window === "undefined") return {}
  window.__bkPreferences ??= {}
  return window.__bkPreferences
}

function persist(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {}
}

function readFeedback(): boolean {
  try {
    return window.localStorage.getItem(FEEDBACK_KEY) !== "off"
  } catch {
    return true
  }
}

export function getTheme(): Theme {
  const preferences = memory()
  if (preferences.theme) return preferences.theme
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function setTheme(theme: Theme) {
  const preferences = memory()
  preferences.theme = theme
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.classList.toggle("light", theme === "light")
  persist(THEME_KEY, theme)
}

export function getSkin(): Skin {
  const preferences = memory()
  if (preferences.skin) return preferences.skin
  return document.documentElement.dataset.skin === "route" ? "route" : "panels"
}

export function setSkin(skin: Skin) {
  memory().skin = skin
  document.documentElement.dataset.skin = skin
  persist(SKIN_KEY, skin)
}

export function getFeedbackEnabled(): boolean {
  const preferences = memory()
  preferences.feedback ??= readFeedback()
  return preferences.feedback
}

export function setFeedbackEnabled(enabled: boolean) {
  memory().feedback = enabled
  persist(FEEDBACK_KEY, enabled ? "on" : "off")
}

export function bindPreferenceOnce(name: string, bind: () => void) {
  const preferences = memory()
  preferences.bindings ??= new Set()
  if (preferences.bindings.has(name)) return
  preferences.bindings.add(name)
  bind()
}

export function renderOnPageLoad(name: string, render: () => void) {
  render()
  bindPreferenceOnce(`page-load:${name}`, () => document.addEventListener("astro:page-load", render))
}
