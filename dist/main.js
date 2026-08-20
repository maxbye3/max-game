import { loadAssets } from './assets.js';
import { COLLISION_SHAPES } from './collision-shapes.js';
import { canvas } from './dom.js';
import { setupInput } from './input.js';
import { getSpeedMultiplier, setupInventory, updatePowerups } from './inventory.js';
import { updatePlayer } from './player.js';
import { draw, drawLoadFailure } from './render.js';
let previousTime = 0;
function gameLoop(time) {
    const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    updatePowerups(time);
    updatePlayer(deltaTime, getSpeedMultiplier());
    draw(time);
    requestAnimationFrame(gameLoop);
}
setupInput();
setupInventory();
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