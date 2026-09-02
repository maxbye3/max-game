# Max Game Project Notes

## Project shape

- This is a browser-based TypeScript canvas game called "Max's Overworld".
- The first screen is `index.html`, styled by `style.css`, and it loads `dist/main-bundle.js`.
- Source TypeScript lives in `js/`. Build output lives in `dist/`.
- The external overworld entry point is `js/main.ts`.
- The diary lab interior entry point is `js/internal.ts`.
- Game constants and map/building coordinates are in `js/config.ts`.
- Image, audio, font, and character assets live under `img/`, `audio/`, `fonts/`, `example_character/`, and `chat/`.

## Commands

- Run `npm run typecheck` after TypeScript changes.
- Run `npm test` for focused progression, sprite, and build-entry checks.
- Run `npm run build` after changing files in `js/` so `dist/` stays in sync.
- Use `npm run watch` for active browser iteration; it watches all three game entry points.
- A plain static server is enough to test the game, for example `python3 -m http.server`.

## Editing rules

- Edit TypeScript sources in `js/` first, then rebuild generated `dist/` bundles.
- Do not hand-edit generated sourcemaps unless the build command regenerates them.
- Keep game UI controls mobile-friendly; this project is often worked on from a phone.
- Preserve pixel-art rendering and the existing canvas-first game feel.
- Keep changes tightly scoped. Avoid unrelated asset churn or broad restyling.

## Verification

- For movement, collision, signs, doors, inventory, or rendering changes, verify the game loads in a browser and check the relevant interaction manually.
- For layout changes, check both narrow mobile and desktop-sized viewports.
