import { GHOST_SPRITE_SOURCE } from '../generated/core/ghost-sprite.generated.js';
import { createDiaryRoomNpcs } from './diary-room-npcs.js';
import { BOOKSHOP_NPCS } from './bookshop-npcs.js';
import { characterAsset, playerAsset } from '../core/character-assets.js';
import { GYM_NPCS } from './gym-npcs.js';
import { MUSIC_HOUSE_NPCS } from './music-house-npcs.js';
import { isTimAtCinema, isTimAtMusicShop } from '../characters/tim/tim-location.js';
import { SHOW_COLLISION_SHAPES } from '../core/config.js';
import { webImageSource } from '../core/web-images.js';
import type { InteriorScene } from './interior-scenes.js';
export function createInteriorAssets(scene: InteriorScene, SEAL_MODE: boolean, wheldonPlayer: boolean, ghostWheldonPlayer: boolean) {
  const isDiaryLabInterior = scene.kind === 'diaryLab';
  const isMusicShopInterior = scene.kind === 'musicShop';
  const isGymInterior = scene.kind === 'gym';
  const isBookshopInterior = scene.kind === 'bookshop';
  const isCinemaInterior = scene.kind === 'cinema';
  const cinemaFilm = isCinemaInterior ? document.createElement('video') : null;
  if (cinemaFilm) {
    cinemaFilm.muted = true;
    cinemaFilm.loop = true;
    cinemaFilm.playsInline = true;
    cinemaFilm.autoplay = true;
    cinemaFilm.src = '../video/film.mp4';
    void cinemaFilm.play().catch(() => {});
  }
  const isCaveInterior = scene.kind === 'cave';
  const interior = new Image(); const collisionMask = new Image();
  const doorOverlay = new Image(); const spriteSheet = new Image();
  const ghostSpriteSheet = new Image();
  ghostSpriteSheet.src = GHOST_SPRITE_SOURCE;
  const noelSprite = new Image(); const joshSprite = new Image(); const siblingsSprite = new Image();
  const gardenPanda = new Image();
  const musicDjMachine = new Image(); const gymGloves = new Image();
  const bookshopNpcs = BOOKSHOP_NPCS.map((npc) => ({ ...npc, image: new Image() }));
  const diaryRoomNpcs = isDiaryLabInterior ? createDiaryRoomNpcs().filter((npc) => !(wheldonPlayer && npc.id === 'wheldon')) : [];
  const musicHouseNpcs = MUSIC_HOUSE_NPCS.filter((npc) => npc.id !== 'tim' || isTimAtMusicShop()).map((npc, index) => ({ ...npc, id: npc.id ?? (index === 0 ? 'andy' : 'aliya'), image: new Image() }));
  const gymNpcs = GYM_NPCS.map((npc) => ({ ...npc, image: new Image() }));
  const timCinemaSeat = isCinemaInterior && isTimAtCinema() ? new Image() : null;
  const cinemaNpcs = isCinemaInterior ? [
    { id: 'dad', source: `../${characterAsset('dad', 'avatar')}`, x: 398, y: 462, width: 48, height: 72, image: new Image() },
    { id: 'kirin', source: `../${characterAsset('kirin', 'mapSprite')}`, x: 115, y: 535, width: 52, height: 80, image: new Image() },
  ] : [];
  interior.src = webImageSource(scene.backgroundSource);
  const interiorFrames = scene.backgroundAnimation?.sources.map((source) => {
    const image = new Image();
    image.src = webImageSource(source);
    return image;
  }) ?? [];
  if (SHOW_COLLISION_SHAPES && scene.collisionMaskSource) collisionMask.src = scene.collisionMaskSource;
  if (scene.doorOverlaySource) doorOverlay.src = webImageSource(scene.doorOverlaySource);
  const playerSpriteSource = ghostWheldonPlayer ? characterAsset('alex-s', 'ghostWheldonSprite') : wheldonPlayer ? characterAsset('alex-s', 'wheldonSprite') : SEAL_MODE ? `${playerAsset('sealSpriteSheet')}?v=20260831-transparent` : playerAsset('spriteSheet');
  spriteSheet.src = webImageSource(`../${playerSpriteSource}`);
  if (scene.kind === 'artStudio') joshSprite.src = webImageSource(`../${characterAsset('josh', 'avatar')}`);
  if (scene.kind === 'mansion') noelSprite.src = webImageSource(`../${characterAsset('noel', 'interiorAvatar')}`);
  if (scene.kind === 'plantRoom') gardenPanda.src = webImageSource('../img/internal/art/panda.png');
  if (isCaveInterior) siblingsSprite.src = webImageSource(`../${characterAsset('siblings', 'girlsSprite')}`);
  if (isMusicShopInterior) musicDjMachine.src = '../img/internal/music-dj-machine.png';
  if (isBookshopInterior) {
    bookshopNpcs.forEach((npc) => {
      npc.image.src = webImageSource(npc.source);
    });
  }
  if (isMusicShopInterior) {
    musicHouseNpcs.forEach((npc) => {
      npc.image.src = webImageSource(npc.source);
    });
  }
  if (isGymInterior) { gymGloves.src = '../img/internal/gloves.png'; gymNpcs.forEach((npc) => { npc.image.src = webImageSource(npc.source); }); }
  if (timCinemaSeat) timCinemaSeat.src = '../img/internal/cinema-tim-seat.png';
  if (isCinemaInterior) cinemaNpcs.forEach((npc) => { npc.image.src = webImageSource(npc.source); });

  const requiredImages = [
    interior,
    ...interiorFrames,
    spriteSheet,
    ghostSpriteSheet,
    ...(SHOW_COLLISION_SHAPES && scene.collisionMaskSource ? [collisionMask] : []),
    ...(scene.doorOverlaySource ? [doorOverlay] : []),
    ...diaryRoomNpcs.flatMap((npc) => npc.frames?.map((frame) => frame.image) ?? [npc.image]),
    ...(scene.kind === 'artStudio' ? [joshSprite] : []),
    ...(scene.kind === 'mansion' ? [noelSprite] : []),
    ...(isBookshopInterior ? bookshopNpcs.map((npc) => npc.image) : []),
    ...(isCaveInterior ? [siblingsSprite] : []),
    ...(isMusicShopInterior ? [...musicHouseNpcs.map((npc) => npc.image), musicDjMachine] : []),
    ...(isGymInterior ? [gymGloves, ...gymNpcs.map((npc) => npc.image)] : []),
    ...cinemaNpcs.map((npc) => npc.image),
    ...(timCinemaSeat ? [timCinemaSeat] : []),
  ];
  return { interior, interiorFrames, collisionMask, doorOverlay, spriteSheet, ghostSpriteSheet, noelSprite, gardenPanda, diaryRoomNpcs, joshSprite, siblingsSprite, musicDjMachine, gymGloves, bookshopNpcs, musicHouseNpcs, gymNpcs, cinemaNpcs, timCinemaSeat, cinemaFilm, requiredImages };
}
