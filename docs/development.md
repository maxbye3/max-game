# Development guide

## Setup and commands

Use Node 20+ and `npm ci`. The game runs on a static server; no API server or credentials are required.

The inventory shows the version from `package.json`, stamped into both pages during bundling. Bump it for a release with `npm version patch --no-git-tag-version`, then build and commit the updated version and lockfile with the changes.

| Command | Purpose |
| --- | --- |
| `npm run build` | Generate once, typecheck, validate dialogue, run all Node suites, and bundle |
| `npm run build:site` | The same checks, then package a complete deployable `_site/` |
| `npm run bundle` | Refresh generated inputs, build CSS and four JS bundles, stamp HTML cache keys |
| `npm run typecheck` | Refresh generated inputs and check TypeScript |
| `npm test` | All Node suites, content refresh, and web performance checks |
| `npm test -- dialogue` | Only suites whose names contain `dialogue` |
| `node scripts/run-tests.mjs powers-rei` | Only Rei's power suite |
| `npm run test:controls` | Interior movement, collisions, paused movement, and power direction changes |
| `npm run test:dialogue` | NPC conversations, room characters, journals, and Niall |
| `npm run test:progression` | Save progression, road traffic, interior collision |
| `npm run test:assets` | Sprite crops, build entries, loading, audio, rendering caches |
| `npm run profile:loading` | Profile both map starts, all 11 interiors, transformation and battle with an empty browser cache, 4 Mbps network, 80 ms latency, and 4x CPU slowdown; saves `test-results/loading-profile.json`. Append `-- --muted` for muted playback or `-- --area=cinema --area=gym` to select areas. |
| `npm run test:content` | Feed freshness, fallbacks, refresh/cancellation, galleries |
| `npm run test:tooling` | Generation cache invalidation and recovery |
| `npm run watch` | Watch all four TS entries and `css/`, rebuilding cache keys |

Filters are OR matches: `npm test -- dialogue controls` runs both groups. The runner isolates suites in separate processes, continues after failures, and reports a summary plus all failures. Add `--verbose` for individual passing suite names. Fixtures live in `scripts/tests/helpers.mjs`; add independently runnable `*.test.mjs` files in that directory. Preserve meaningful behavioral assertions when extracting tests.

## Browser checks

Install Chromium once: `npx playwright install chromium` (on CI use `--with-deps`).

- `npm run test:browser` builds current sources, serves on an ephemeral local port, and checks phone portrait, phone landscape, and desktop.
- `npm run test:browser -- --prepared` reuses a current build. Use this only after generating/bundling the current sources.
- Add `--screenshots` to save screenshots under ignored `test-results/`; failures always save a screenshot. Add `--headed` to inspect the running browser.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` optionally selects an existing compatible Chromium binary; normally Playwright uses its own installation.

`scripts/lib/browser-fixture.mjs` appends small test hooks to the actual game entry sources in a temporary directory. These hooks open real conversations and expose real held input; they never enter shipped bundles. The browser checks toggle real controls, check hit targets and dialogue bounds, scroll long text, and press/release each direction. They also check root portraits for Sam and deliberate portrait absence for Rei. A separate pass loads the shipped bundles for all eleven interior types and verifies that the real thumbstick moves the overworld player. Interior movement and character stages have focused Node tests as well. Exercise any additional interaction changed by a task in the browser.

## Source map

| Concern | Location |
| --- | --- |
| Entry / overworld loop | `js/core/main.ts` |
| Image sources / loading priority | `js/core/asset-sources.ts`, `js/core/assets.ts` |
| World constants / collisions | `js/core/config.ts`, `js/core/collision*.ts` |
| Keyboard and touch input | `js/core/input.ts`, `js/core/mobile-controls.ts` |
| Options, mute, reset, and feedback entry | `js/core/options-menu.ts`, `js/core/audio-mute.ts`, `js/core/thoughts.ts` |
| Overworld NPC positions, dialogue, gifts, songs | `js/overworld/npc-definitions.ts` |
| Stateful NPC conversation / Rei quest | `js/overworld/npcs.ts` |
| Interior orchestration | `js/interiors/internal.ts` |
| Interior sprites and image loading | `js/interiors/interior-assets.ts` |
| Interior player movement and collision | `js/interiors/interior-player.ts` |
| Noel, Wheldon, Helen, cat conversations | `js/interiors/room-character-dialogue.ts` |
| Specialized conversations | `js/interiors/*dialogue.ts`, `js/characters/dad/` |
| Room definitions and drawing | `js/interiors/interior-scenes.ts`, `interior-render.ts` |
| Gifts / save persistence | `js/core/inventory-gifts.ts`, `world-state.ts`, `storage.ts` |
| Battle / transformation entries | `js/characters/niall/niall-fight.ts`, `js/core/transform.ts` |

CSS is intentionally ordered in `css/game.css`: base, HUD, navigation, world effects/signs, battle, dialogue, interior features, controls/responsive layout, overlays. Asset URLs in these sources are relative to the root output `style.css`. The style builder concatenates them without changing cascade order or URLs. Edit `css/controls.css` for touch layouts and dialogue clearance, and `css/dialogue.css` for shared conversation panels.

## Generated inputs

`node scripts/generate-source.mjs` fingerprints each generator's source files, helper scripts, and outputs. It skips unchanged work; edits, missing/corrupt outputs, added/deleted inputs, and generator changes invalidate the relevant task. The disposable cache is `.cache/generation.json`; deleting it forces a safe rebuild. `npm run generate:source -- --force` explicitly regenerates everything.

Tasks: `dialogues`, `profiles`, `dialogue-themes`, `item-descriptions`, `internal-collision`, `interior-render-assets`, `cinema-film`, `ghost-sprite`, `seal-sprite`, `web-images`, `web-assets`, `battle-avatars`, `styles`. A single task can be run with `node scripts/generate-source.mjs styles`. Specialized `generate:*` npm commands use the same cache. The build invokes generation once, rather than nesting npm lifecycle hooks.

Power descriptions come verbatim from each character’s `item.txt`. The item-description generator explicitly selects Andy’s `Item.txt`, Rei’s `item-1.txt`/`item-2.txt`, and Niall’s `player/item.txt`. Inventory reveals use this text and remember discoveries across navigation and future copies of the gift; edit the original text files to change the wording. Alex S uses `char/wheldon/item.txt`.

Room collision grids use byte-preserving run-length encoding where smaller, expanded only for the selected room. First poses are required for entry; extra cat/charity animation poses follow the first frame, retaining the first pose while later frames load. Audible room ambience starts when the room is ready. Muted room/world ambience stays paused and resumes from its position on unmute, including while Options pauses movement. Muted story voices still play silently so dialogue timing and progression remain intact. The snowman cue preloads only on an audible nearby approach. Photo galleries build their thumbnails when opened.

Map image hints and the measured large-room background hint are stamped into HTML during bundling from the same runtime source definitions. Smaller room images load with the game code to avoid bandwidth contention. See [the loading audit](loading-performance.md) for current measurements.

Room rendering derivatives are generated from the actual scene geometry into `img/generated/interiors/`. They bake the canvas's nearest-neighbour sampling for large backgrounds and door art; short rooms retain vertical resolution for portrait stretching. The four cave poses are packed without changing their source pixels. Original art remains untouched. Browser checks compare prepared backgrounds/poses against original renders, including portrait/desktop crops.

The cinema uses a checked-in 298×168 silent projection copy, with the original film retained for the fullscreen Kirin view. After changing `video/film.mp4`, use `npm run prepare:cinema-film` with ffmpeg on PATH (or `FFMPEG_PATH` pointing to its executable), then build. Normal builds require no ffmpeg; a stale projection falls back to the original film. The cinema pauses its video while the tab is hidden.

Normal builds generate lossless WebP browser copies for `scripts/web-image-sources.json`, including on CI. Add original image paths to that registry to optimize them; optional dimensions use nearest-neighbour resizing. The seal sheet is generated as a separate, cache-versioned image and only fetched in seal form. Music/fonts remain optional prepared copies: use `npm run prepare:web-assets` to refresh them. Stale or missing copies fall back to originals. Collision guides are original assets and are never optimized.

## Character recipe

For dialogue-only changes edit `char/<character>/dialogue.txt`, then build. Do not edit generated arrays.

For a new ordinary overworld character:

1. Add original assets and dialogue to the character's root folder. A portrait is optional and must be a root `profile.png`, `profile.jpg`, or `profile.jpeg`.
2. Add an entry to `char/manifest.json`, including `directory`, `displayName`, and `files.dialogue`. The generator automatically adds its dialogue module and registry entry and removes retired generated modules; there is no separate generator list to maintain.
3. Add a `defineNpc` record in `js/overworld/npc-definitions.ts` and include it in `NPCS`. A record specifies the name/position and optional `itemGift`, `songReward`, `requestLine`, and follow-up hooks. Common geometry and generated dialogue lookup are supplied centrally. Existing visit IDs such as `alexS` and `marinaD` stay unchanged; their `character` field selects the canonical manifest ID.
4. Add its world rendering through `js/overworld/map-characters.ts` or a dedicated renderer. Interaction definitions do not automatically draw new sprites.
5. Run dialogue and asset checks, build, and verify the interaction and both portrait cases in the browser.

Example (after adding the manifest entry and generating):

```ts
export const NEW_CHARACTER = defineNpc('new-character', {
  name: 'New Character',
  x: 400,
  y: 500,
  // itemGift: NEW_ITEM,
});
```

Keep custom story flows in controllers: Rei has staged mission rewards; Maddy has timed voice lines; Ed has an asynchronous fixture follow-up; Georgia has a moving position. These hooks should remain explicit rather than forcing every character through additional configuration.

Dan, Bochra, Ju, Chris, Katy, Marina D, Ruby, and overworld Maddy exchange eight clear outdoor spots on every overworld load. `js/overworld/map-npc-positions.ts` chooses one shared layout for dialogue, rendering, and power targets, and remembers the previous layout per tab so every character moves. Interior imports never record a map visit.
