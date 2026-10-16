import { hasAlexEatenDoughnut } from '../../core/alex-w-state.js';
import { isAlexPlayer } from '../../core/player-character.js';

export interface TimCinemaDialogue {
  readonly opening: string;
  readonly highlight: string;
  readonly ending: string;
}

export function getTimCinemaDialogue(): TimCinemaDialogue | null {
  if (!isAlexPlayer()) return null;

  return hasAlexEatenDoughnut()
    ? { opening: "Not now Alex, it's just getting good ", highlight: 'go talk to Lucy', ending: '.' }
    : { opening: 'Alex you look hungry you should ', highlight: 'eat some doughnuts', ending: '' };
}
