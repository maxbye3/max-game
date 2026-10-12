export interface MusicHouseNpc {
  readonly id?: 'tim';
  readonly source: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly animation?: {
    readonly frameWidth: number;
    readonly frameHeight: number;
    readonly frameCount: number;
    readonly frameDurationMs: number;
    readonly framesPerRow: number;
  };
}

// World coordinates are traced from the DJ booth and the left-side stools in
// the Music House artwork. These are scenery characters, not interactables.
export const MUSIC_HOUSE_NPCS: readonly MusicHouseNpc[] = [
  {
    source: '../chat/andy/overworld-sprite.png',
    x: 258,
    y: 280,
    width: 90,
    height: 100,
  },
  {
    source: '../chat/aliya/overworld-sprite.png',
    x: 130,
    y: 350,
    width: 51,
    height: 80,
  },
  {
    id: 'tim',
    source: '../chat/tim/dancing.png',
    x: 380,
    y: 475,
    width: 56,
    height: 72,
    animation: {
      frameWidth: 58,
      frameHeight: 77,
      frameCount: 8,
      framesPerRow: 4,
      frameDurationMs: 270,
    },
  },
];
