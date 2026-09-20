import { readStorage, writeStorage } from './storage.js';

const TIM_AT_MUSIC_SHOP_KEY = 'max-game:tim-at-music-shop';
const TIM_AT_CINEMA_KEY = 'max-game:tim-at-cinema';

export function isTimAtMusicShop(): boolean {
  return readStorage(TIM_AT_MUSIC_SHOP_KEY) === 'true';
}

export function isTimAtCinema(): boolean {
  return readStorage(TIM_AT_CINEMA_KEY) === 'true';
}

export function moveTimToMusicShop(): void {
  writeStorage(TIM_AT_MUSIC_SHOP_KEY, 'true');
  writeStorage(TIM_AT_CINEMA_KEY, 'false');
}

export function moveTimToCinema(): void {
  writeStorage(TIM_AT_MUSIC_SHOP_KEY, 'false');
  writeStorage(TIM_AT_CINEMA_KEY, 'true');
}

export function resetTimRoute(): void {
  writeStorage(TIM_AT_MUSIC_SHOP_KEY, 'false');
  writeStorage(TIM_AT_CINEMA_KEY, 'false');
}
