<!-- Copilot / AI agent instructions for the `ouroboros_v1` repo -->
# Quick orientation (what this project is)

- This is a small static web site / single-page exhibition viewer (no backend). The UI lives in `index.html`, styles in `style.css`, and the app logic in `script.js`.
- Content (posts) is driven by `feedData.json` (array of objects). Media assets (images, mp4) and fonts live in the repo root and `fonts/`.
- A `CNAME` file is present which indicates this is deployed as a static site (likely GitHub Pages).

# Key files and architecture notes (read these first)

- `index.html` — splash, open-call page, placeholders for `#feed`, `#loadingState`, and entry buttons (`#enter`, `#opencall`). Loads `script.js` with `defer`.
- `script.js` — single JS entrypoint. Responsibilities:
  - Fetch `feedData.json` (cache-busted via `?cache=` + Date.now()). Important: must be served over HTTP(S) — `file://` will fail the fetch.
  - Preloads first 3 media entries and adjacent media when navigating.
  - Renders posts to `#feed` as either `<img>` or `<video>` depending on `src` extension.
  - Navigation: touch swipes, wheel (throttled), and arrow keys. Uses `isNavigationReady` gating around UI interactions.
  - Video handling: videos are created muted, looped, playsinline — aligns with autoplay policies.
- `feedData.json` — canonical record format; each item is an object with at least: `artist`, `title`, `description`, `src`. Example entry:

```json
{
  "artist": "Example",
  "title": "Title",
  "description": "Short HTML allowed",
  "src": "image.png" // or video.mp4
}
```

- `style.css` — contains the animation and stacking semantics that `script.js` relies on: `.post`, `.active`, `.exit-up`, `.exit-down`, `.forward-start`, `.backward-start`, overlay classes, and `.snake-scales-container` styles.

# Project-specific behaviors you should preserve

- The app intentionally prevents normal page scrolling: `#feed` is fixed and the feed is navigated programmatically. Avoid changing overflow rules without testing navigation.
- `script.js` treats `src` file extension as the media type. When adding new items to `feedData.json`, use `.mp4` for video and image extensions for stills.
- Preload strategy: first 3 items are prefetched on load; adjacent items are preloaded on navigation. This is deliberate to reduce memory/bandwidth spikes.
- Autoplay-friendly videos: new video items must be playable muted with `playsinline` to allow autoplay on mobile/desktop.

# Local dev & debugging (concrete commands and tips)

- Preview locally (must run an HTTP server so fetch() works):

  - Quick (Python 3):
    - `python3 -m http.server 8000` (open http://localhost:8000)
  - Or use VS Code Live Server extension and open the workspace root.

- Debugging notes:
  - Check the browser console for `Error loading feedData.json:` messages — often a sign you're opening via `file://` or CORS/404.
  - If a fetch returns HTML (e.g., a 404 page), `script.js` checks for a leading `<` and throws — look at network tab to inspect the response.
  - To test video autoplay issues, ensure `src` items are muted; `script.js` sets `muted = true` by default.

# Conventions & small gotchas

- feed items may include simple HTML in `description` (see `feedData.json` examples). The code injects `description` into `.overlay` as HTML text — avoid adding untrusted markup.
- Many animation state changes depend on CSS `transitionend` events — DOM changes should preserve the class names used in `style.css`.
- `p5.js` and `p5.sound.min.js` are present in the repo but not referenced in `index.html`. Treat them as unused assets unless a feature explicitly requires p5.

# Integration and deploy notes

- Deploy: repository appears set up for static hosting (CNAME present). Pushing to the `main` branch and using GitHub Pages is likely the intended flow. Verify Pages settings in the repo settings.
- Asset expectations: media paths in `feedData.json` are relative to the repo root; when adding remote-hosted assets, ensure CORS and cross-origin video rules are satisfied.

# Example quick edits an agent may be asked to do (use these patterns)

- Add a new post: append a new object to `feedData.json` with `src` referencing a file checked into root (or an externally hosted URL). Example: `"src": "newwork.mp4"`.
- Change preload depth: modify `preloadMedia(posts)` where it slices `posts.slice(0, 3)` — keep the same pacing (setTimeout with 300ms) to avoid network spikes.
- Swap an image for a video: update `src` extension to `.mp4` and ensure `feedData.json` entry has a valid file; the rendering logic will create `<video>` automatically.

# What not to do (specific anti-patterns for this repo)

- Do not rely on server-side routing or API endpoints — the app is client-side only and expects `feedData.json` to be available at the root.
- Avoid changing the CSS stacking/positioning of `#feed` and `#splash` without testing on mobile — these layers intentionally control scroll/interaction behavior.

# Where to look next (quick reading order)

1. `index.html` — understand the DOM anchors and buttons
2. `script.js` — core behavior, event handlers, preloading, and rendering logic
3. `feedData.json` — data shape and examples
4. `style.css` — animation classes to preserve when making UI changes

---
If you'd like a slightly longer or more prescriptive version (for automated PR generation or for a CI agent), tell me which area to expand (deploy automation, editing the feed format, or tests) and I'll update the file.
