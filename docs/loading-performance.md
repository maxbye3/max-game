# Loading audit — version 1.0.11

This pass continues the 1.0.10 audit across both map starts, all 11 interiors, transformation and battle. Measurements use Chromium at a 390 × 844 phone viewport, an empty cache, 4 Mbps download, 80 ms latency and 4× CPU slowdown on a local uncompressed static server. These are individual controlled runs, not live-site guarantees.

Readiness means essential room/map images loaded and the game loop started. The first-visit bus introduction is unchanged. Special scenes are measured when their initial artwork is visible. Frame work is the 95th percentile of time inside animation-frame callbacks during the next two seconds; it includes early deferred loading and is not an FPS measurement.

| Area | 1.0.10 loading | 1.0.11 loading | Frame work before → after |
| --- | ---: | ---: | ---: |
| First map visit | 2.23 s | 2.09 s | 17.5 → 16.1 ms |
| Returning map | 2.21 s | 2.08 s | 19.5 → 18.2 ms |
| Diary room / laboratory | 3.05 s | 2.64 s | 7.8 → 8.3 ms |
| Charity | 2.65 s | 1.97 s | 7.9 → 7.7 ms |
| Cave | 4.78 s | 2.24 s | 6.2 → 6.0 ms |
| Cinema | 3.35 s | 2.56 s | 30.4 → 18.1 ms |
| Doughnut shop | 4.20 s | 2.42 s | 6.8 → 7.2 ms |
| Plant Room | 3.16 s | 2.25 s | 7.1 → 6.8 ms |
| Music House | 5.03 s | 3.19 s | 8.6 → 9.1 ms |
| Gym | 4.11 s | 2.94 s | 8.2 → 8.4 ms |
| Bookshop | 2.82 s | 2.17 s | 6.7 → 7.8 ms |
| Art Studio | 3.69 s | 3.07 s | 8.0 → 7.7 ms |
| Mansion | 2.87 s | 2.30 s | 7.0 → 8.0 ms |
| Transformation | 6.61 s | 3.85 s | — |
| Niall battle | 1.24 s | 1.25 s | — |

## Changes in this pass

- Generate room rendering copies from actual scene geometry. Large backgrounds use the pixels the canvas displays; Music House retains full vertical resolution for portrait stretching. Keep the original asset whenever preparation would increase its download.
- Prepare door artwork at its displayed size: roughly 5–30 KB per room instead of 44–385 KB. Door positions, collision and exit triggers are unchanged.
- Pack the four indoor cave poses at their original pixel resolution, reducing that image from 1.44 MB to about 215 KB. The original complete sheet remains available to the overworld chase.
- Reduce the doughnut background from 870 KB to 316 KB, Gym from 474 KB to 148 KB, Plant Room from 604 KB to 193 KB, and Music House from 1.56 MB to 836 KB.
- Prepare a silent 168-pixel-high cinema projection at the same frame rate/duration: 2.1 MB instead of 8 MB. The original film remains available to the fullscreen Kirin view. Pause the projection when the tab is hidden.
- Cull offscreen static map art. Nine sampled map views retain identical pixels while image draw calls fall from 218 to 61.
- Discover universal map images in the HTML head. Only the large Music House background receives an early room-image hint; comparisons found smaller-room hints competing with startup JavaScript, so they were removed.

## Verification

- All 49 Node suites passed, including asset generation, source-pixel preservation, missing/stale cinema-copy fallback, visibility culling and preload URL matching.
- 43 browser canvas comparisons verify prepared backgrounds and cave poses against their originals, with tight rounding tolerances for doorway alpha edges.
- All 11 interiors and all five map forms opened on phone and desktop. Portrait, landscape and desktop checks covered movement, exits, stalled-animation fallback/recovery, cat poses, Dad/Josh conversations and lazy art galleries.
- Transformation still advances after browser image-decode rejection; battle artwork and opening controls work in all three layouts.
- The smaller cinema film plays, pauses while hidden and resumes without fetching the full-size film.
- The pulled ghost-Wheldon doughnut quest still returns to the map and unlocks the journal on phone and desktop.
- Deployment packaging verifies every generated rendering asset and the selected cinema film.

## Reproduce

Run `npm run build`, then `npm run profile:loading`. Detailed timings, request initiators, request sizes and frame work are written to ignored `test-results/loading-profile.json`. Use `npm run test:browser -- --prepared` after a current build for the integrated browser checks.

Remaining large downloads include optional background music and full overworld animation sheets. They are distinct from the required room-entry images; total requested bytes include media that starts after entry.
