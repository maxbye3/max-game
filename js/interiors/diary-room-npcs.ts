import { characterAsset } from '../core/character-assets.js';
import { webImageSource } from '../core/web-images.js';
import type { InteriorSceneryNpc } from './interior-scenery-npcs.js';
import { WHELDON } from './interior-scenes.js';

const CAT_FRAME_DURATION_MS = 1800;
const CAT_VISIBLE_AREA = 3600;

// Tight alpha bounds for every pose. Match visible area instead of image width:
// a lying cat should occupy as much space as a sitting or rolling cat.
const CATS = [
  { name: 'buzz', x: 315, y: 360, bounds: [[2, 52, 134, 172], [3, 39, 133, 197], [4, 39, 133, 206]] },
  { name: 'minnie', x: 110, y: 520, bounds: [[2, 55, 134, 166], [2, 69, 134, 137], [2, 54, 134, 168]] },
  { name: 'socks', x: 415, y: 360, bounds: [[2, 32, 134, 211], [2, 43, 134, 189]] },
  { name: 'tigger', x: 410, y: 525, bounds: [[2, 98, 134, 79], [2, 101, 134, 74], [2, 105, 134, 65]] },
] as const;

export function createDiaryRoomNpcs(): InteriorSceneryNpc[] {
  const alex = new Image();
  alex.src = webImageSource(`../${characterAsset('alex-w', 'mapSprite')}`);
  return [
    { id: 'wheldon', x: WHELDON.x, y: WHELDON.y, width: WHELDON.width, height: WHELDON.height, image: alex },
    ...CATS.map((cat): InteriorSceneryNpc => {
      const frames = cat.bounds.map((sourceBounds, index) => {
        const image = new Image();
        const source = `../img/internal/diary-room/${cat.name}/${cat.name}-${index + 1}.png`;
        if (index === 0) image.src = webImageSource(source);
        const scale = Math.sqrt(CAT_VISIBLE_AREA / (sourceBounds[2] * sourceBounds[3]));
        return { image, source, sourceBounds, width: sourceBounds[2] * scale, height: sourceBounds[3] * scale };
      });
      return {
        x: cat.x, y: cat.y,
        width: Math.max(...frames.map((frame) => frame.width)),
        height: Math.max(...frames.map((frame) => frame.height)),
        image: frames[0]!.image, frames, smooth: true,
        frameDurationMs: CAT_FRAME_DURATION_MS,
      };
    }),
  ];
}
