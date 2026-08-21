/**
 * Click sound + haptic feedback for every interactive element.
 *
 * Sound: uisfx synthesises cues in Web Audio, so nothing is downloaded.
 * Haptics: web-haptics uses navigator.vibrate on Android and the hidden
 * <input switch> trick on iOS < 26.5. On newer iOS it's a silent no-op.
 *
 * Both only ever fire inside a trusted pointer/keyboard gesture, which is also
 * what the browser autoplay policy requires. One stored flag mutes both.
 */
import { createUISFX, type CueName, type UISFXPlayer } from "uisfx"
import { WebHaptics, type HapticInput } from "web-haptics"

export type HapticName = "tap" | "success"

const STORAGE_KEY = "bk:feedback"
const CHANGE_EVENT = "bk:feedback-change"
const VOLUME = 0.22
const INTERACTIVE =
  'a[href], button, [role="button"], summary, input[type="checkbox"], input[type="radio"], select'

const HAPTIC_PATTERNS: Record<HapticName, HapticInput> = {
  tap: [{ duration: 12, intensity: 0.5 }],
  success: "success",
}

let player: UISFXPlayer | undefined
let haptics: WebHaptics | undefined

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off"
  } catch {
    return true
  }
}

function getPlayer(): UISFXPlayer {
  player ??= createUISFX({ pack: "minimal", volume: VOLUME, enabled: readEnabled() })
  return player
}

export const feedback = {
  isEnabled: readEnabled,

  setEnabled(enabled: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off")
    } catch {}
    player?.setEnabled(enabled)
    document.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { enabled } }))
  },

  onChange(handler: (enabled: boolean) => void) {
    const listener = (event: Event) => handler((event as CustomEvent<{ enabled: boolean }>).detail.enabled)
    document.addEventListener(CHANGE_EVENT, listener)
    return () => document.removeEventListener(CHANGE_EVENT, listener)
  },

  play(cue: CueName) {
    if (!readEnabled()) return
    const ui = getPlayer()
    // unlock() resumes the AudioContext; safe to call every time, it's a no-op once running
    void ui.unlock().then(() => ui.play(cue))
  },

  haptic(name: HapticName) {
    if (!readEnabled()) return
    haptics ??= new WebHaptics()
    void haptics.trigger(HAPTIC_PATTERNS[name])
  },
}

function cueFor(element: Element): CueName {
  const override = element.getAttribute("data-cue") as CueName | null
  if (override) return override
  return element.matches("a[href]") ? "select" : "press"
}

function triggerFor(element: Element) {
  // Elements that own their own feedback (theme toggle, mute button) opt out
  if (element.hasAttribute("data-feedback")) return
  feedback.play(cueFor(element))
  feedback.haptic("tap")
}

function onPointerDown(event: PointerEvent) {
  if (event.pointerType === "mouse" && event.button !== 0) return
  const element = (event.target as Element | null)?.closest(INTERACTIVE)
  if (element) triggerFor(element)
}

function onKeyDown(event: KeyboardEvent) {
  if (event.repeat) return
  const element = (event.target as Element | null)?.closest(INTERACTIVE)
  if (!element) return
  const isLink = element.matches("a[href]")
  const activates = event.key === "Enter" || (event.key === " " && !isLink)
  if (activates) triggerFor(element)
}

// Document-level delegation survives Astro view-transition swaps, so bind once.
// The module is also imported by a Svelte island, so it must be inert during SSR.
if (typeof document !== "undefined") {
  document.addEventListener("pointerdown", onPointerDown, { passive: true })
  document.addEventListener("keydown", onKeyDown)
}
