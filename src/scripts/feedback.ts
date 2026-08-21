/**
 * Click sound + haptic feedback for every interactive element.
 *
 * Sound: a 14 ms band-passed noise burst synthesised in Web Audio. Packaged UI
 * sound libraries bottom out around 150 ms with a tonal tail, which reads as a
 * notification rather than a click, so this is hand-rolled on purpose.
 * Haptics: web-haptics uses navigator.vibrate on Android and the hidden
 * <input switch> trick on iOS < 26.5. On newer iOS it's a silent no-op.
 *
 * Both only ever fire inside a trusted pointer/keyboard gesture, which is also
 * what the browser autoplay policy requires. One stored flag mutes both.
 */
import { WebHaptics, type HapticInput } from "web-haptics"

export type HapticName = "tap" | "success"
export type SoundName = "tick" | "tock" | "double"

const STORAGE_KEY = "bk:feedback"
const CHANGE_EVENT = "bk:feedback-change"
const INTERACTIVE =
  'a[href], button, [role="button"], summary, input[type="checkbox"], input[type="radio"], select'

const HAPTIC_PATTERNS: Record<HapticName, HapticInput> = {
  tap: [{ duration: 12, intensity: 0.5 }],
  success: "success",
}

// Each sound is one or more short noise bursts: [centre frequency Hz, peak gain, delay s]
const SOUNDS: Record<SoundName, [number, number, number][]> = {
  tick: [[2800, 0.11, 0]],
  tock: [[1400, 0.11, 0]],
  double: [
    [2800, 0.11, 0],
    [3600, 0.09, 0.09],
  ],
}

const BURST_SECONDS = 0.014
const MIN_GAP_MS = 40

let context: AudioContext | undefined
let noise: AudioBuffer | undefined
let haptics: WebHaptics | undefined
let lastPlayedAt = 0

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off"
  } catch {
    return true
  }
}

function getContext(): AudioContext | undefined {
  if (typeof AudioContext === "undefined") return undefined
  context ??= new AudioContext()
  return context
}

function getNoise(ac: AudioContext): AudioBuffer {
  if (noise) return noise
  const length = Math.ceil(ac.sampleRate * BURST_SECONDS)
  noise = ac.createBuffer(1, length, ac.sampleRate)
  const data = noise.getChannelData(0)
  // Exponential decay so the burst has an attack and no audible cut-off
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length / 4))
  return noise
}

function burst(ac: AudioContext, frequency: number, gainValue: number, at: number) {
  const source = ac.createBufferSource()
  source.buffer = getNoise(ac)
  const filter = ac.createBiquadFilter()
  filter.type = "bandpass"
  filter.frequency.value = frequency
  filter.Q.value = 1.4
  const gain = ac.createGain()
  gain.gain.value = gainValue
  source.connect(filter).connect(gain).connect(ac.destination)
  source.onended = () => source.disconnect()
  source.start(at)
}

export const feedback = {
  isEnabled: readEnabled,

  setEnabled(enabled: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off")
    } catch {}
    document.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { enabled } }))
  },

  onChange(handler: (enabled: boolean) => void) {
    const listener = (event: Event) => handler((event as CustomEvent<{ enabled: boolean }>).detail.enabled)
    document.addEventListener(CHANGE_EVENT, listener)
    return () => document.removeEventListener(CHANGE_EVENT, listener)
  },

  play(name: SoundName) {
    if (!readEnabled() || document.hidden) return
    const now = performance.now()
    if (now - lastPlayedAt < MIN_GAP_MS) return
    lastPlayedAt = now

    const ac = getContext()
    if (!ac) return
    const schedule = () => {
      const start = ac.currentTime
      for (const [frequency, gainValue, delay] of SOUNDS[name]) burst(ac, frequency, gainValue, start + delay)
    }
    if (ac.state === "suspended") {
      void ac.resume().then(schedule)
    } else {
      schedule()
    }
  },

  haptic(name: HapticName) {
    if (!readEnabled()) return
    haptics ??= new WebHaptics()
    void haptics.trigger(HAPTIC_PATTERNS[name])
  },
}

function soundFor(element: Element): SoundName {
  const override = element.getAttribute("data-sound") as SoundName | null
  if (override && override in SOUNDS) return override
  return element.matches("a[href]") ? "tick" : "tock"
}

function triggerFor(element: Element) {
  // Elements that own their own feedback (theme toggle, mute button) opt out
  if (element.hasAttribute("data-feedback")) return
  feedback.play(soundFor(element))
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
