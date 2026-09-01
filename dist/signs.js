import { FRAME_HEIGHT, FRAME_WIDTH, MUSIC_SHOP_SIGN_HEIGHT, MUSIC_SHOP_SIGN_WIDTH, MUSIC_SHOP_SIGN_X, MUSIC_SHOP_SIGN_Y, SCALE, } from './config.js';
import { requireElement } from './dom.js';
const SIGN_MESSAGES = [
    'Hey, welcome to my website! You can quick-travel by clicking the “Jump” button in the bottom-right.',
    'People add things to your inventory as you talk to them click the inventory button to use it',
    'DC has one of the highest employment rates in the country, so helping folks find work is my side hustle.',
];
// World-space bounds for every fully visible, readable sign in the composed map.
export const SIGNS = [
    {
        id: 'north-directory',
        title: 'Town Directory',
        message: SIGN_MESSAGES[0],
        x: 392,
        y: 157,
        width: 19,
        height: 20,
    },
    {
        id: 'community-billboard',
        title: 'Community Billboard',
        message: SIGN_MESSAGES[0],
        x: 402,
        y: 420,
        width: 108,
        height: 61,
    },
    {
        id: 'music-shop-placard',
        title: 'Inventory',
        message: SIGN_MESSAGES[1],
        x: MUSIC_SHOP_SIGN_X,
        y: MUSIC_SHOP_SIGN_Y,
        width: MUSIC_SHOP_SIGN_WIDTH,
        height: MUSIC_SHOP_SIGN_HEIGHT,
    },
    {
        id: 'job-center-noticeboard',
        title: 'Job Center',
        message: SIGN_MESSAGES[2],
        x: 1057,
        y: 803,
        width: 43,
        height: 59,
    },
    {
        id: 'east-directory',
        title: 'Fast travel',
        message: SIGN_MESSAGES[0],
        x: 610,
        y: 1151,
        width: 25,
        height: 23,
    },
];
export const SIGN_COLLISION_SHAPES = SIGNS.map(({ x, y, width, height }) => [x, y, width, height]);
const dialogue = requireElement('#sign-dialogue');
const dialogueTitle = requireElement('#sign-dialogue-title');
const dialogueText = requireElement('#sign-dialogue-text');
const announcer = requireElement('#announcer');
const READ_DISTANCE = 46;
const DISMISS_DISTANCE = 62;
let activeSign = null;
function playerFootIntersectsSign(playerX, playerY, sign) {
    const footHalfWidth = Math.max(4, FRAME_WIDTH * SCALE * 0.3);
    const left = playerX - footHalfWidth;
    const right = playerX + footHalfWidth;
    const top = playerY - Math.max(4, FRAME_HEIGHT * SCALE * 0.18);
    const bottom = playerY;
    return left < sign.x + sign.width &&
        right > sign.x &&
        top < sign.y + sign.height &&
        bottom > sign.y;
}
function distanceToSign(playerX, playerY, sign) {
    const dx = Math.max(sign.x - playerX, 0, playerX - (sign.x + sign.width));
    const dy = Math.max(sign.y - playerY, 0, playerY - (sign.y + sign.height));
    return Math.hypot(dx, dy);
}
function showSign(sign) {
    if (activeSign?.id === sign.id)
        return;
    activeSign = sign;
    dialogueTitle.textContent = sign.title;
    dialogueText.textContent = sign.message;
    dialogue.hidden = false;
    announcer.textContent = `${sign.title}: ${sign.message}`;
}
function hideSign() {
    activeSign = null;
    dialogue.hidden = true;
}
/** Called with each attempted player position so contact opens the sign immediately. */
export function bumpSignAt(playerX, playerY) {
    const sign = SIGNS.find((candidate) => playerFootIntersectsSign(playerX, playerY, candidate));
    if (!sign)
        return false;
    showSign(sign);
    return true;
}
/** Proximity reads the nearest sign automatically; moving away dismisses it. */
export function updateSigns(playerX, playerY) {
    let nearestSign = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const sign of SIGNS) {
        const distance = distanceToSign(playerX, playerY, sign);
        if (distance < nearestDistance) {
            nearestSign = sign;
            nearestDistance = distance;
        }
    }
    if (nearestSign && nearestDistance <= READ_DISTANCE) {
        showSign(nearestSign);
    }
    else if (activeSign && distanceToSign(playerX, playerY, activeSign) > DISMISS_DISTANCE) {
        hideSign();
    }
}
//# sourceMappingURL=signs.js.map