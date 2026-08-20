import { images } from './assets.js';
import { COLLISION_SHAPES } from './collision-shapes.js';
import { ARTIST_STUDIO_X, ARTIST_STUDIO_Y, BOOKSHOP_HEIGHT, BOOKSHOP_WIDTH, BOOKSHOP_X, BOOKSHOP_Y, CINEMA_X, CINEMA_Y, DIARY_LAB_HEIGHT, DIARY_LAB_WIDTH, DIARY_LAB_X, DIARY_LAB_Y, FEEDBACK_X, FEEDBACK_Y, FRAME_HEIGHT, FRAME_WIDTH, GYM_ROOF_TOGGLE_INTERVAL, GYM_ROOF_X, GYM_ROOF_Y, GYM_X, GYM_Y, JOB_CENTER_X, JOB_CENTER_Y, MUSIC_SHOP_X, MUSIC_SHOP_Y, SCALE, SHOW_COLLISION_SHAPES, SNOW_MANSION_X, SNOW_MANSION_Y, TORI_PLAYER_DEPTH_Y, TORI_SIZE, TORI_X, TORI_Y, WORLD_HEIGHT, WORLD_WIDTH, ZEN_GARDEN_X, ZEN_GARDEN_Y, } from './config.js';
import { canvas, context } from './dom.js';
import { directionRows, player } from './player.js';
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
    const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH - canvas.width, player.x - canvas.width / 2)));
    const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, player.y - canvas.height / 2)));
    context.drawImage(images.map, cameraX, cameraY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    // Canvas layers use draw order instead of CSS z-index. Drawing buildings
    // after the map keeps them above the houses baked into the overworld image.
    context.drawImage(images.cinema, CINEMA_X - cameraX, CINEMA_Y - cameraY);
    context.drawImage(images.musicShop, MUSIC_SHOP_X - cameraX, MUSIC_SHOP_Y - cameraY);
    context.drawImage(images.gym, GYM_X - cameraX, GYM_Y - cameraY);
    if (Math.floor(time / GYM_ROOF_TOGGLE_INTERVAL) % 2 === 0) {
        context.drawImage(images.gymRoof, GYM_ROOF_X - cameraX - 1, GYM_ROOF_Y - cameraY + 1);
    }
    context.drawImage(images.snowMansion, SNOW_MANSION_X - cameraX, SNOW_MANSION_Y - cameraY - 10);
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
    const sourceX = player.frame * FRAME_WIDTH;
    const sourceY = directionRows[player.direction] * FRAME_HEIGHT;
    const width = FRAME_WIDTH * SCALE;
    const height = FRAME_HEIGHT * SCALE;
    context.drawImage(images.spriteSheet, sourceX, sourceY, FRAME_WIDTH, FRAME_HEIGHT, Math.round(player.x - cameraX - width / 2), Math.round(player.y - cameraY - height), width, height);
    if (toriCoversPlayer)
        drawTori(cameraX, cameraY);
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