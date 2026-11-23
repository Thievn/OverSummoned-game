# OverSummoned as an installable app (repo-only notes, not served)

## What ships today
- `site.webmanifest` (written by `scripts/apply_seo.py`): id and start_url `/play`, scope `/`, standalone,
  regular + maskable icons (`/assets/pwa/maskable-*.png`), narrow + wide screenshots.
- `sw.js`: offline shell. Pages `/ /story /updates /privacy /terms` are kept for offline reading, `/play`
  offline shows `/offline`. Code and styles are network-first (never half old, half new), art is
  stale-while-revalidate (max 400 entries). It never touches Supabase, auth, analytics, fonts,
  `/updates.json`, `/ledger`, `/gm`, or any request with an Authorization header. The pinned supabase-js file
  from jsDelivr is the only cross-origin file it stores.
- Version: `scripts/build-updates.mjs` stamps `VERSION` in `sw.js` from the newest `updates.json` entry.
  New workers `skipWaiting` + `clients.claim`; if a page was already open, `js/pwa.js` asks the update bar
  to offer "Play the new version" (reload). Pages also re-check on focus and every 30 minutes.
- `js/pwa.js`: Install button (`[data-install]`, shown via `html.can-install`) uses `beforeinstallprompt`;
  on iOS it opens the Add to Home Screen hint. `js/splash.js`: pixel summoning circle, only in standalone
  mode, once per launch, skippable, off with reduced motion. Preview with `/play?splash=1`.
- CSP: works under the current policy (`worker-src 'self' blob:`, `manifest-src 'self'`). No new origins.

## Google Play later (Trusted Web Activity)
1. `npx @bubblewrap/cli init --manifest https://oversummoned.com/site.webmanifest` (package e.g. `com.oversummoned.app`).
2. `bubblewrap build` and upload the .aab. Use Play App Signing.
3. Put the Play signing key SHA-256 into `/.well-known/assetlinks.json`:
   ```json
   [{"relation":["delegate_permission/common.handle_all_urls"],
     "target":{"namespace":"android_app","package_name":"com.oversummoned.app",
               "sha256_cert_fingerprints":["AA:BB:..."]}}]
   ```
   `vercel.json` already serves that path as `application/json`. Do not add the file until the real
   fingerprint exists (a wrong one breaks full-screen mode).
4. Billing inside a TWA must use Play Billing (Digital Goods API) if anything is ever sold in the app.

## Steam later
- Wrap `/play` in Electron or Tauri (Tauri is smaller). Load the live site (keeps one codebase) with a
  bundled offline page, or bundle the static files and point Supabase at the same project.
- Steamworks: app id, achievements via `steamworks.js` (Electron) or the Rust crate (Tauri), Steam Cloud not
  needed (saves are on the server). Sign-in: keep email sign-in, optionally link a Steam ID later.
- Needs: 1280x720 / 1920x1080 screenshots, capsule art, a trailer, controller-friendly focus states.
