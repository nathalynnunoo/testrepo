# Kids Storybook — Sunny's Big Adventure

A small web app with a realistic page‑flip effect, kid‑friendly controls, read‑aloud (Web Speech API), and optional autoplay.

## Run locally

- Option 1: Open `index.html` directly in a modern browser.
- Option 2: Serve the folder:
  - Python: `python3 -m http.server 8000` then visit `http://localhost:8000`
  - Node (npx): `npx http-server -p 8000` then visit `http://localhost:8000`

## Controls

- Arrows or onscreen buttons to turn pages
- Read Aloud: toggles narration using your browser's voice
- Autoplay: turns pages automatically (syncs with narration if enabled)
- Speed: adjusts narration/auto speed
- Night mode: easier on eyes for bedtime reading
- Swipe left/right on touch devices

## Customize the story

Edit `script.js` and modify the `storyPages` array. Each page supports:

```
{ title: "Page title", text: "Narration text", art: "Emoji or short text", cover?: true, end?: true }
```

Add or remove pages as needed. Page numbers and navigation update automatically.