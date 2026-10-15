import { createGameAudio } from '../core/audio-mute.js';
import { releaseAllInput } from '../core/input.js';
import { getPlayerBody, setPlayerBody } from '../core/player-body.js';
import { isWheldonPlayerSpriteEnabled } from '../core/player-sprite-test.js';
import type { Player } from '../core/types.js';
import { isOscarEaten } from '../powers/oscar/oscar-power.js';
import { ALEX_S } from './npcs.js';
import { RoadAccidentScene } from './road-accident-scene.js';
import { stopRoadCarOnPlayer } from './road-traffic.js';

export const roadAccident = new RoadAccidentScene();
const screech = createGameAudio('audio/map/car_screech.mp3');
let possessButton: HTMLButtonElement;
let status: HTMLElement;
let statusLine: HTMLElement;
let shell: HTMLElement;

function canPossessAlex(player: Player): boolean {
  return getPlayerBody() === 'ghost' && !roadAccident.active && !isOscarEaten('alex-s') &&
    Math.hypot(player.x - ALEX_S.x, player.y - ALEX_S.y) <= ALEX_S.interactionDistance;
}

export function setupRoadAccident(player: Player): void {
  shell = document.querySelector<HTMLElement>('.game-shell')!;
  status = document.querySelector<HTMLElement>('#road-accident-status')!;
  statusLine = document.querySelector<HTMLElement>('#road-accident-line')!;
  possessButton = document.querySelector<HTMLButtonElement>('#possess-alex')!;
  possessButton.addEventListener('click', () => {
    if (!canPossessAlex(player)) return;
    releaseAllInput();
    window.dispatchEvent(new Event('max-game:world-interaction-opened'));
    setPlayerBody('alex-s');
    Object.assign(player, { x: ALEX_S.x, y: ALEX_S.y, direction: 'down', frame: 0, animationTime: 0 });
    updateRoadAccidentUi(player);
  });
  updateRoadAccidentUi(player);
}

export function checkRoadAccident(player: Player): void {
  if (getPlayerBody() === 'ghost' || roadAccident.active || !stopRoadCarOnPlayer(player.x, player.y)) return;
  releaseAllInput();
  window.dispatchEvent(new Event('max-game:world-interaction-opened'));
  const wheldon = getPlayerBody() === 'alex-s' || isWheldonPlayerSpriteEnabled();
  roadAccident.begin(player, wheldon ? 'Ah! Not again!' : 'Oh no!');
  updateRoadAccidentUi(player);
  screech.currentTime = 0;
  void screech.play().catch(() => {});
}

export function updateRoadAccident(deltaTime: number, player: Player): void {
  roadAccident.update(deltaTime, player, () => {
    setPlayerBody('ghost');
    releaseAllInput();
  });
  updateRoadAccidentUi(player);
}

function updateRoadAccidentUi(player: Player): void {
  const body = getPlayerBody();
  if (shell.dataset.playerBody !== body) shell.dataset.playerBody = body;
  const active = String(roadAccident.active);
  if (shell.dataset.roadAccident !== active) shell.dataset.roadAccident = active;
  const possessionHidden = !canPossessAlex(player);
  const hidden = !roadAccident.active && (body !== 'ghost' || possessionHidden);
  if (status.hidden !== hidden) status.hidden = hidden;
  const line = roadAccident.dialogue ?? '';
  if (statusLine.textContent !== line) statusLine.textContent = line;
  if (possessButton.hidden !== possessionHidden) possessButton.hidden = possessionHidden;
}
