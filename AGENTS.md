# Max's Overworld

Browser TypeScript canvas game. Preserve pixel art, gameplay, and phone-friendly controls.

## Find sources

- Entries: `js/core/main.ts`, `js/interiors/internal.ts`, `js/characters/niall/niall-fight.ts`, `js/core/transform.ts`. Coordinates: `js/core/config.ts`.
- NPC data: `js/overworld/npc-definitions.ts`; conversation state: `npcs.ts`. Interiors separate assets, player movement, and room dialogue into adjacent modules.
- UI: ordered sources in `css/game.css`; touch layout in `css/controls.css`; panels in `css/dialogue.css`.
- Consult the relevant section of [docs/development.md](docs/development.md) for the task map, commands, browser fixtures, generation, and character recipe.

## Work and verify

- Edit sources. Never hand-edit generated `js/generated/`, `dist/`, `style.css`, `img/web/`, `img/generated/`, `img/battle/`, or `audio/powers/`. Original assets live in `img/`, `audio/`, `fonts/`, and `char/`.
- After TS changes run `npm run build` once: it generates, typechecks, validates dialogue, runs all Node suites, and bundles. Do not repeat included checks unless later edits or failures require it.
- During iteration use `npm run test:controls`, `test:dialogue`, `test:progression`, `test:powers`, `test:assets`, `test:content`, or `test:tooling`. `npm test -- <suite>` selects matching suites; `npm test` runs all.
- CSS-only: `npm run bundle`. `npm run watch` watches four entries and CSS. A static server works: `python3 -m http.server`.
- For movement, collision, signs, doors, inventory, or rendering, exercise the changed interaction in a browser. Check mobile and desktop for layout, including affected control modes/orientations. Reuse `npm run test:browser -- --prepared` after a current build.
- Search relevant source ranges, avoid generated output/asset dumps, and keep normal logs concise. Keep edits scoped.

## Portraits

Only use `profile.png`, `profile.jpg`, or `profile.jpeg` directly in `char/<character>/`. No root profile means no portrait, intentionally. Never fall back to `player`, `example`, `char/real`, avatars, item art, or another character. Apply this rule uniformly; keep `scripts/generate-profiles.mjs` and its mapping consistent. Verify both portrait-present and portrait-absent cases when wiring characters.
