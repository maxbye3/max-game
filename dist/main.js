import { loadAssets } from './assets.js';
import { COLLISION_SHAPES } from './collision-data.js';
import { canvas } from './dom.js';
import { updateDoors } from './doors.js';
import { setupInput } from './input.js';
import { getSpeedMultiplier, setupInventory, updatePowerups } from './inventory.js';
import { updateHole } from './hole.js';
import { setupMike, updateMikeInteraction } from './mike.js';
import { player, updatePlayer } from './player.js';
import { draw, drawLoadFailure } from './render.js';
import { updateSigns } from './signs.js';
let previousTime = 0;
function gameLoop(time) {
    const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    updatePowerups(time);
    updatePlayer(deltaTime, getSpeedMultiplier());
    updateHole(deltaTime, player);
    updateMikeInteraction(player.x, player.y);
    updateSigns(player.x, player.y);
    updateDoors(player.x, player.y);
    draw(time);
    requestAnimationFrame(gameLoop);
}
setupInput();
setupInventory();
setupMike();
loadAssets()
    .then(() => {
    canvas.dataset.collisionShapes = String(COLLISION_SHAPES.length);
    requestAnimationFrame(gameLoop);
})
    .catch((error) => {
    console.error(error);
    drawLoadFailure();
});
//# sourceMappingURL=main.js.map