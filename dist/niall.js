import { requireElement } from './dom.js';
import { WORLD_HEIGHT, WORLD_WIDTH, } from './config.js';
import { hasCompletedNiallFight } from './world-state.js';
import { releaseAllInput } from './input.js';
const CONTACT_DISTANCE = 30;
const VERTICAL_SIGHT_HALF_WIDTH = 16;
const VERTICAL_SIGHT_DISTANCE = 180;
const CHASE_SPEED = 235;
const FRAME_COUNT = 4;
const FRAME_RATE = 9;
const BATTLE_TRANSITION_DURATION = 1350;
export const NIALL = {
    x: 792,
    y: 391,
    width: 28,
    height: 40,
};
const fightButton = requireElement('#niall-fight-start');
const gameShell = requireElement('.game-shell');
export const niallState = {
    x: NIALL.x,
    y: NIALL.y,
    direction: 'down',
    frame: 0,
    animationTime: 0,
};
export const isNiallFollowing = () => hasCompletedNiallFight();
let battleTransitionActive = false;
let alertActive = false;
export const isNiallBattleTransitionActive = () => battleTransitionActive;
export const isNiallAlertActive = () => alertActive;
export function playerCollidesWithNiall(x, y) {
    void x;
    void y;
    return false;
}
function startFight() {
    if (isNiallFollowing() || battleTransitionActive)
        return;
    battleTransitionActive = true;
    fightButton.hidden = true;
    releaseAllInput();
    const transition = document.createElement('div');
    transition.className = 'battle-transition';
    transition.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 12; index += 1) {
        const band = document.createElement('span');
        band.style.setProperty('--band-index', String(index));
        transition.append(band);
    }
    gameShell.append(transition);
    window.setTimeout(() => {
        window.location.assign('niall-fight/');
    }, BATTLE_TRANSITION_DURATION);
}
function setDirection(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy) * 1.7) {
        niallState.direction = dx < 0 ? 'left' : 'right';
    }
    else if (Math.abs(dy) > Math.abs(dx) * 1.7) {
        niallState.direction = dy < 0 ? 'up' : 'down';
    }
    else if (dx < 0 && dy < 0) {
        niallState.direction = 'upLeft';
    }
    else if (dx > 0 && dy < 0) {
        niallState.direction = 'upRight';
    }
    else if (dx < 0 && dy > 0) {
        niallState.direction = 'downLeft';
    }
    else if (dx > 0 && dy > 0) {
        niallState.direction = 'downRight';
    }
}
function chasePlayer(deltaTime, dx, dy, distance) {
    setDirection(dx, dy);
    niallState.x = Math.max(NIALL.width / 2, Math.min(WORLD_WIDTH - NIALL.width / 2, niallState.x + (dx / distance) * CHASE_SPEED * deltaTime));
    niallState.y = Math.max(NIALL.height, Math.min(WORLD_HEIGHT, niallState.y + (dy / distance) * CHASE_SPEED * deltaTime));
    niallState.animationTime += deltaTime;
    niallState.frame = Math.floor(niallState.animationTime * FRAME_RATE) % FRAME_COUNT;
}
export function updateNiallInteraction(deltaTime, playerX, playerY) {
    if (isNiallFollowing()) {
        fightButton.hidden = true;
        return;
    }
    if (battleTransitionActive)
        return;
    fightButton.hidden = true;
    const dx = playerX - niallState.x;
    const dy = playerY - niallState.y;
    if (!alertActive && Math.abs(dx) <= VERTICAL_SIGHT_HALF_WIDTH && dy > 0 && dy <= VERTICAL_SIGHT_DISTANCE) {
        alertActive = true;
        niallState.direction = 'down';
        niallState.frame = 0;
        releaseAllInput();
        return;
    }
    const distance = Math.hypot(dx, dy);
    if (distance <= CONTACT_DISTANCE) {
        startFight();
        return;
    }
    if (distance === 0 || !alertActive)
        return;
    chasePlayer(deltaTime, dx, dy, distance);
}
export function setupNiall() {
    fightButton.hidden = true;
}
//# sourceMappingURL=niall.js.map