import { requireElement } from './dom.js';
import { hasCompletedNiallFight } from './world-state.js';
const INTERACTION_DISTANCE = 58;
const COLLISION_DISTANCE = 27;
export const NIALL = {
    x: 430,
    y: 684,
    width: 44,
    height: 48,
};
const fightButton = requireElement('#niall-fight-start');
let nearby = false;
export const isNiallFollowing = () => hasCompletedNiallFight();
export function playerCollidesWithNiall(x, y) {
    if (isNiallFollowing())
        return false;
    return Math.hypot(x - NIALL.x, y - NIALL.y) < COLLISION_DISTANCE;
}
function startFight() {
    if (!nearby || isNiallFollowing())
        return;
    window.location.assign('niall-fight/');
}
export function updateNiallInteraction(playerX, playerY) {
    if (isNiallFollowing()) {
        nearby = false;
        fightButton.hidden = true;
        return;
    }
    const nextNearby = Math.hypot(playerX - NIALL.x, playerY - NIALL.y) <= INTERACTION_DISTANCE;
    if (nextNearby === nearby)
        return;
    nearby = nextNearby;
    fightButton.hidden = !nearby;
}
export function setupNiall() {
    if (isNiallFollowing()) {
        fightButton.hidden = true;
        return;
    }
    fightButton.addEventListener('click', startFight);
    window.addEventListener('keydown', (event) => {
        if (event.defaultPrevented)
            return;
        if ((event.code === 'KeyE' || event.code === 'Enter' || event.code === 'Space') && nearby) {
            event.preventDefault();
            startFight();
        }
    });
}
//# sourceMappingURL=niall.js.map