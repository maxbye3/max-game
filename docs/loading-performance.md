# Loading audit — version 1.0.10

Measured locally with Chromium at a 390 × 844 phone viewport, an empty cache, 4 Mbps download, 80 ms latency and 4× CPU slowdown. These are individual controlled runs, not live-site guarantees. Map/room readiness is the game-loop start after essential images load; the first-visit bus introduction remains unchanged. Special scenes are measured once their initial artwork is visible.

| Page | Before | After |
| --- | ---: | ---: |
| First map visit | 2.61 s | 2.28 s |
| Returning map | 2.33 s | 2.25 s |
| Diary room / laboratory | 3.75 s | 3.00 s |
| Charity | 3.68 s | 2.66 s |
| Cave | 6.04 s | 4.86 s |
| Cinema | 3.92 s | 3.34 s |
| Doughnut shop | 4.48 s | 4.22 s |
| Plant Room | 3.76 s | 3.19 s |
| Music House | 5.64 s | 5.06 s |
| Gym | 4.77 s | 4.11 s |
| Bookshop | 3.33 s | 2.82 s |
| Art Studio | 5.14 s | 3.80 s |
| Mansion | 3.62 s | 2.93 s |
| Transformation | 8.36 s | 6.63 s |
| Niall battle | 3.79 s | 1.24 s |

## Changes

- Reduced encoded room collision grids from 114,760 to 25,220 bytes, preserving all seven grids byte for byte. The shared room bundle fell from 502 KB to about 416 KB.
- Require the first cat and Charity background pose for entry; download later poses after the first room frame and retain the first pose while waiting. Start ambience once the room is ready.
- Build hidden photo thumbnails only when their gallery opens. Keep saved/offline content and feed refresh behavior.
- Generate smaller lossless browser copies for remaining map sprites, room characters, animation sheets and overlays. Existing image dimensions and sprite crop coordinates are preserved for the newly registered sources.
- Ensure the actual selected map form is loaded before play. Give secondary art lower download priority and bound NPC image decoding so a stalled decode cannot hide a character indefinitely.
- Remove duplicate original battle portrait requests and move transparent battle artwork out of JavaScript. Battle JS fell from 740 KB to about 15 KB.
- Use prepared images and the retry/decode-tolerant loader on the transformation screen.

## Verification and remaining costs

All 46 Node suites and deployment packaging passed. Browser checks covered all 11 interiors on phone and desktop, all five map forms, inventory/version, portrait/landscape layouts, stalled animation recovery, cat poses, movement, Dad/Josh dialogue, art-gallery opening and exits. Transformation and battle have separate phone/landscape/desktop interaction checks.

The Music House background and the siblings' animation sheet remain large downloads. Their source artwork and animation coordinates were retained. Optional room audio and the cinema film continue downloading after entry; total requested bytes include these and should not be read as blocking startup bytes.

Run `npm run build`, then `npm run profile:loading` to reproduce a full audit. Detailed request sizes and long tasks are saved to ignored `test-results/loading-profile.json`.
