# Check site preferences when browser storage is unavailable

Theme, edition, and feedback settings retain their existing storage keys (`theme`, `bk:skin`, and `bk:feedback`). Storage remains the cross-visit preference when it works. When a browser rejects a read or write, the page keeps the choice in `window.__bkPreferences` for the current tab instead.

The inline layout bootstrap resolves the initial theme and edition before paint. It uses the system theme and Panels defaults only when no valid stored value is available, then re-applies the same in-memory choice after Astro swaps. The controls use that same state, so the theme button's accessible label, root classes, selected edition, and existing Giscus `setConfig` message stay aligned. Feedback reads storage at most once per tab and retains an explicit mute choice, so later interactions do not revive audio or haptics.

## Verify locally

```sh
ASTRO_TELEMETRY_DISABLED=1 VERIFY_OFFLINE=1 ASTRO_DATABASE_FILE=.astro/verify.db bun run dev -- --port 4585
```

In a disposable browser, make `Storage.prototype.getItem` and `Storage.prototype.setItem` throw `SecurityError` before opening `/about/`.

1. With a light system preference, confirm the root starts as `light`, Panels is selected, and the theme button says `Switch to dark theme`. Repeat with a dark system preference and confirm the inverse label.
2. Change the theme. Confirm the root class, accessible label, and existing Giscus `setConfig` postMessage all name the new theme.
3. Mute feedback, then select the other edition. Confirm the mute button reads `Unmute click sounds and haptics`; no Web Audio source or haptic fallback is created.
4. Use the header controls to visit and return from `/posts`, `/micro`, `/projects`, `/books`, and `/unoffice-hours`. The selected theme, edition, and mute state must remain unchanged.
5. Repeat once with ordinary storage enabled and valid stored values to confirm normal cross-visit persistence.

## Route-light control contrast

On the Route light surface, the computed background is `#eef1ea`. The old accent `#d9742a` measured 2.84:1 against it, below the 3:1 non-text control threshold. The retained orange was darkened narrowly to `#d26c23`, which measures 3.11:1 against the same background; text/control foregrounds remain unchanged.
