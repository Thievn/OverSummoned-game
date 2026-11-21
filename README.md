# Thievn's Den

Waitlist page for **Thievn's Den**, a free browser-based text crime RPG. You arrive a drifter. The work decides what you become.

## View it

```bash
npm install
npm run dev
```

Open the local URL Vite prints, usually `http://localhost:5173`.

```bash
npm run build
npm run preview
```

`npm test` checks waitlist validation and the local save.

## Deploy

Vercel detects Vite with no extra config. Build command `vite build`, output `dist`.

## Waitlist

Nothing is sent to a server. Valid entries stay in this browser under `thievns-den.waitlist`.

The function to replace is `submitWaitlist` in `src/waitlist.js`. The comment at the top of that file is the Supabase wiring.

## Art

Pixel art lives in `public/assets`. Show it at integer scale only (`image-rendering: pixelated`). Idle strips are 5 frames at 128px, played with CSS `steps(5)` at 6fps.
