import { images } from './assets.js';
import { getCaveTheftCameraCenter, getCaveThief, getCaveThiefDialogue } from './cave-thief.js';
import { drawColander, hasCaveColander } from './colander.js';
import { COLLISION_SHAPES } from './collision-data.js';
import { ARTIST_STUDIO_X, ARTIST_STUDIO_Y, BILLBOARD_X, BILLBOARD_Y, BOOKSHOP_HEIGHT, BOOKSHOP_WIDTH, BOOKSHOP_X, BOOKSHOP_Y, CINEMA_X, CINEMA_Y, DIARY_LAB_HEIGHT, DIARY_LAB_WIDTH, DIARY_LAB_X, DIARY_LAB_Y, FEEDBACK_X, FEEDBACK_Y, FRAME_HEIGHT, FRAME_WIDTH, GYM_ROOF_TOGGLE_INTERVAL, GYM_ROOF_X, GYM_ROOF_Y, GYM_X, GYM_Y, JOB_CENTER_X, JOB_CENTER_Y, MUSIC_SHOP_X, MUSIC_SHOP_Y, SCALE, SHOW_COLLISION_SHAPES, SNOW_MANSION_X, SNOW_MANSION_Y, TORI_PLAYER_DEPTH_Y, TORI_SIZE, TORI_X, TORI_Y, WORLD_HEIGHT, WORLD_WIDTH, ZEN_GARDEN_X, ZEN_GARDEN_Y, } from './config.js';
import { canvas, context } from './dom.js';
import { getOpenDoorways } from './doors.js';
import { getHolePlayerTransform } from './hole.js';
import { isMikeAftermathActive, MIKE } from './mike.js';
import { isNiallAlertActive, isNiallFollowing, NIALL, niallState } from './niall.js';
import { directionRows, player } from './player.js';
import { isSnowmanFallen, SNOWMAN } from './snowman.js';
const MIKE_AFTERMATH_X = 222;
const MIKE_AFTERMATH_Y = 432;
const MIKE_AFTERMATH_WIDTH = 276;
const MIKE_AFTERMATH_HEIGHT = 271;
const NIALL_SPRITE_COLUMNS = 4;
const NIALL_SPRITE_ROWS = 7;
const NIALL_EXPLANATION_MARK_WIDTH = 26;
const NIALL_EXPLANATION_MARK_HEIGHT = 21;
const BAKED_SNOWMAN_PATCH = {
    sourceX: 270,
    sourceY: 105,
    sourceWidth: 28,
    sourceHeight: 88,
    x: SNOW_MANSION_X + 214,
    y: SNOW_MANSION_Y - 10 + 105,
    width: 56,
    height: 88,
};
const niallDirectionRows = {
    down: 0,
    downRight: 1,
    right: 2,
    upRight: 3,
    upLeft: 4,
    left: 4,
    up: 5,
    downLeft: 1,
};
function drawNiallAt(cameraX, cameraY, x, y, direction, frame) {
    const sourceWidth = Math.floor(images.niallSprite.width / NIALL_SPRITE_COLUMNS);
    const sourceHeight = Math.floor(images.niallSprite.height / NIALL_SPRITE_ROWS);
    const sourceX = (frame % NIALL_SPRITE_COLUMNS) * sourceWidth;
    const sourceY = niallDirectionRows[direction] * sourceHeight;
    context.save();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(images.niallSprite, sourceX, sourceY, sourceWidth, sourceHeight, Math.round(x - cameraX - NIALL.width / 2), Math.round(y - cameraY - NIALL.height), NIALL.width, NIALL.height);
    context.restore();
}
function drawCollisionShapes(cameraX, cameraY) {
    context.fillStyle = 'rgba(0, 92, 255, 0.62)';
    for (const [shapeX, shapeY, shapeWidth, shapeHeight] of COLLISION_SHAPES) {
        if (shapeX + shapeWidth < cameraX ||
            shapeX > cameraX + canvas.width ||
            shapeY + shapeHeight < cameraY ||
            shapeY > cameraY + canvas.height)
            continue;
        context.fillRect(shapeX - cameraX, shapeY - cameraY, shapeWidth, shapeHeight);
    }
}
function drawTori(cameraX, cameraY) {
    context.drawImage(images.tori, TORI_X - cameraX, TORI_Y - cameraY, TORI_SIZE, TORI_SIZE);
}
function drawSnowman(cameraX, cameraY) {
    if (!isSnowmanFallen())
        return;
    context.save();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    // Replace the upright snowman baked into the mansion artwork with nearby
    // clean snow before drawing the fallen state over the same spot.
    context.drawImage(images.snowMansion, BAKED_SNOWMAN_PATCH.sourceX, BAKED_SNOWMAN_PATCH.sourceY, BAKED_SNOWMAN_PATCH.sourceWidth, BAKED_SNOWMAN_PATCH.sourceHeight, BAKED_SNOWMAN_PATCH.x - cameraX, BAKED_SNOWMAN_PATCH.y - cameraY, BAKED_SNOWMAN_PATCH.width, BAKED_SNOWMAN_PATCH.height);
    context.drawImage(images.snowmanFallen, Math.round(SNOWMAN.x - cameraX - SNOWMAN.fallenWidth / 2), Math.round(SNOWMAN.y - cameraY - SNOWMAN.fallenHeight), SNOWMAN.fallenWidth, SNOWMAN.fallenHeight);
    context.restore();
}
function drawOpenDoorways(cameraX, cameraY) {
    for (const doorway of getOpenDoorways()) {
        context.drawImage(images.doorOpen, Math.round(doorway.x - cameraX), Math.round(doorway.y - cameraY), doorway.width, doorway.height);
    }
}
function drawCaveThief(cameraX, cameraY) {
    const thief = getCaveThief();
    if (!thief)
        return;
    const left = Math.round(thief.x - cameraX - thief.size / 2);
    const top = Math.round(thief.y - cameraY - thief.size);
    context.fillStyle = '#111';
    context.fillRect(left - 2, top - 2, thief.size + 4, thief.size + 4);
    context.fillStyle = '#d71920';
    context.fillRect(left, top, thief.size, thief.size);
    context.fillStyle = '#ff6565';
    context.fillRect(left + 4, top + 4, thief.size - 8, 5);
}
function drawSpeechBubble(text, anchorX, anchorY) {
    context.save();
    context.font = '12px "Press Start 2P", monospace';
    context.textBaseline = 'top';
    const paddingX = 10;
    const paddingY = 8;
    const maxWidth = 270;
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
        const nextLine = line ? `${line} ${word}` : word;
        if (context.measureText(nextLine).width > maxWidth && line) {
            lines.push(line);
            line = word;
        }
        else {
            line = nextLine;
        }
    }
    if (line)
        lines.push(line);
    const textWidth = Math.min(maxWidth, Math.max(...lines.map((value) => context.measureText(value).width)));
    const width = textWidth + paddingX * 2;
    const height = lines.length * 18 + paddingY * 2;
    const x = Math.round(Math.max(8, Math.min(canvas.width - width - 8, anchorX - width / 2)));
    const y = Math.round(Math.max(8, anchorY - height - 18));
    context.fillStyle = '#111';
    context.fillRect(x - 3, y - 3, width + 6, height + 6);
    context.fillStyle = '#f7f3e8';
    context.fillRect(x, y, width, height);
    context.fillStyle = '#111';
    lines.forEach((value, index) => {
        context.fillText(value, x + paddingX, y + paddingY + index * 18);
    });
    context.restore();
}
function logPlayerPosition() {
    const playerX = player.x.toFixed(1);
    const playerY = player.y.toFixed(1);
    if (canvas.dataset.playerX === playerX && canvas.dataset.playerY === playerY)
        return;
    canvas.dataset.playerX = playerX;
    canvas.dataset.playerY = playerY;
    console.log('Player position', { x: Number(playerX), y: Number(playerY) });
}
export function draw(time) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    logPlayerPosition();
    // Rounded so the map is sampled on whole source pixels: a fractional source
    // rect snaps at a browser-defined threshold and makes the player jitter
    // against the tiles by a pixel on every step.
    const cameraCenter = getCaveTheftCameraCenter(player.x, player.y, time);
    const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraCenter.x - canvas.width / 2)));
    const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, cameraCenter.y - canvas.height / 2)));
    context.drawImage(images.map, cameraX, cameraY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    context.drawImage(images.billboard, BILLBOARD_X - cameraX, BILLBOARD_Y - cameraY);
    // Canvas layers use draw order instead of CSS z-index. Drawing buildings
    // after the map keeps them above the houses baked into the overworld image.
    context.drawImage(images.cinema, CINEMA_X - cameraX, CINEMA_Y - cameraY);
    context.drawImage(images.musicShop, MUSIC_SHOP_X - cameraX, MUSIC_SHOP_Y - cameraY);
    context.drawImage(images.gym, GYM_X - cameraX, GYM_Y - cameraY);
    if (Math.floor(time / GYM_ROOF_TOGGLE_INTERVAL) % 2 === 0) {
        context.drawImage(images.gymRoof, GYM_ROOF_X - cameraX - 1, GYM_ROOF_Y - cameraY + 1);
    }
    context.drawImage(images.snowMansion, SNOW_MANSION_X - cameraX, SNOW_MANSION_Y - cameraY - 10);
    drawSnowman(cameraX, cameraY);
    context.drawImage(images.jobCenter, JOB_CENTER_X - cameraX, JOB_CENTER_Y - cameraY);
    context.drawImage(images.artistStudio, ARTIST_STUDIO_X - cameraX, ARTIST_STUDIO_Y - cameraY);
    context.drawImage(images.feedback, FEEDBACK_X - cameraX, FEEDBACK_Y - cameraY);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(images.bookshop, BOOKSHOP_X - cameraX, BOOKSHOP_Y - cameraY, BOOKSHOP_WIDTH, BOOKSHOP_HEIGHT);
    context.drawImage(images.diaryLab, DIARY_LAB_X - cameraX, DIARY_LAB_Y - cameraY, DIARY_LAB_WIDTH, DIARY_LAB_HEIGHT);
    context.imageSmoothingEnabled = false;
    context.drawImage(images.zenGarden, ZEN_GARDEN_X - cameraX, ZEN_GARDEN_Y - cameraY);
    const toriCoversPlayer = player.y < TORI_PLAYER_DEPTH_Y;
    if (!toriCoversPlayer)
        drawTori(cameraX, cameraY);
    if (SHOW_COLLISION_SHAPES)
        drawCollisionShapes(cameraX, cameraY);
    drawOpenDoorways(cameraX, cameraY);
    drawCaveThief(cameraX, cameraY);
    if (isNiallFollowing()) {
        drawNiallAt(cameraX, cameraY, player.x - 34, player.y + 12, player.direction, player.frame);
    }
    else {
        drawNiallAt(cameraX, cameraY, niallState.x, niallState.y, niallState.direction, niallState.frame);
    }
    if (isNiallAlertActive()) {
        context.drawImage(images.niallExplanationMark, Math.round(niallState.x - cameraX - NIALL_EXPLANATION_MARK_WIDTH / 2), Math.round(niallState.y - cameraY - NIALL.height - NIALL_EXPLANATION_MARK_HEIGHT - 4), NIALL_EXPLANATION_MARK_WIDTH, NIALL_EXPLANATION_MARK_HEIGHT);
    }
    if (isMikeAftermathActive()) {
        context.drawImage(images.mikeAftermath, MIKE_AFTERMATH_X - cameraX, MIKE_AFTERMATH_Y - cameraY, MIKE_AFTERMATH_WIDTH, MIKE_AFTERMATH_HEIGHT);
    }
    else {
        context.drawImage(images.mike, Math.round(MIKE.x - cameraX - MIKE.width / 2), Math.round(MIKE.y - cameraY - MIKE.height), MIKE.width, MIKE.height);
    }
    const sourceX = player.frame * FRAME_WIDTH;
    const sourceY = directionRows[player.direction] * FRAME_HEIGHT;
    const width = FRAME_WIDTH * SCALE;
    const height = FRAME_HEIGHT * SCALE;
    const holeTransform = getHolePlayerTransform();
    if (holeTransform) {
        context.save();
        context.globalAlpha = holeTransform.opacity;
        context.translate(Math.round(player.x - cameraX), Math.round(player.y - cameraY - height / 2 + holeTransform.offsetY));
        context.rotate(holeTransform.rotation);
        context.scale(holeTransform.scale, holeTransform.scale);
        context.drawImage(images.spriteSheet, sourceX, sourceY, FRAME_WIDTH, FRAME_HEIGHT, -width / 2, -height / 2, width, height);
        context.restore();
    }
    else {
        context.drawImage(images.spriteSheet, sourceX, sourceY, FRAME_WIDTH, FRAME_HEIGHT, Math.round(player.x - cameraX - width / 2), Math.round(player.y - cameraY - height), width, height);
    }
    if (hasCaveColander()) {
        drawColander(context, Math.round(player.x - cameraX + 12), Math.round(player.y - cameraY - 24));
    }
    if (toriCoversPlayer)
        drawTori(cameraX, cameraY);
    const thief = getCaveThief();
    const thiefDialogue = getCaveThiefDialogue();
    if (thief && thiefDialogue) {
        drawSpeechBubble(thiefDialogue, thief.x - cameraX, thief.y - cameraY - thief.size);
    }
}
export function drawLoadFailure() {
    context.fillStyle = '#0b1c10';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f5fff6';
    context.font = '13px monospace';
    context.textAlign = 'center';
    context.fillText('Could not load the game assets.', canvas.width / 2, canvas.height / 2);
}
//# sourceMappingURL=render.js.map