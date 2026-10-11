import { isTimInputPowerActive, updateTimInputWorld } from './tim-input-power.js';
import { isReiPowerActive, reiWorldDeltaTime, updateReiWorld } from './rei-power.js';
import { isNoelPowerActive, updateNoelWorld } from './noel-power.js';
import { aliceWorldDeltaTime, isAlicePowerActive, updateAliceWorld } from './alice-power.js';
import { isMikePowerActive, mikeWorldDeltaTime, updateMikeWorld } from './mike-power.js';
import { isLucyPowerActive, updateLucyWorld } from './lucy-power.js';
import { isKatiePowerActive, katieWorldDeltaTime, updateKatieWorld } from './katie-power.js';
import { isJulianPowerActive, julianWorldDeltaTime, updateJulianWorld } from './julian-power.js';
import { isJuPowerActive, juWorldDeltaTime, updateJuWorld } from './ju-power.js';
import { isJoePowerActive, updateJoeWorld } from './joe-power.js';
import { helenWorldDeltaTime, isHelenPowerActive, updateHelenWorld } from './helen-power.js';
import { isGeorgiaPowerActive, updateGeorgiaWorld } from './georgia-power.js';
import { danWorldDeltaTime, isDanPowerActive, updateDanWorld } from './dan-power.js';
import { chrisWorldDeltaTime, isChrisPowerActive, updateChrisWorld } from './chris-power.js';
import { updateBochraWorld } from './bochra-power.js';
import { startGameLoop } from './game-loop.js';
import { loadAssets } from './assets.js';
import { setupAudioMute } from './audio-mute.js';
import { setupBusIntro, updateBusIntro } from './bus-intro.js';
import {
  getCaveThief,
  isCaveThiefPursuitActive,
  setupCaveThief,
  updateCaveThief,
} from './cave-thief.js';
import { COLLISION_SHAPES } from './collision-data.js';
import { canvas } from './dom.js';
import { isDoorNavigationStarted, updateDoors } from './doors.js';
import { updateGeorgia } from './georgia.js';
import { setupGymTimCutscene, updateGymTimCutscene } from './gym-tim-cutscene.js';
import { releaseAllInput, setupInput } from './input.js';
import { isThoughtsOpen } from './thoughts.js';
import { setupInventory, updatePowerups } from './inventory.js';
import { updateHole } from './hole.js';
import { isJumpMenuOpen, setupJump } from './jump.js';
import { setupMusicPlayer } from './music-player.js';
import { resetMusicLibrary } from './music-library.js';
import { loadMapCharacters } from './map-characters.js';
import { MAP_CHARACTER_DEFINITIONS } from './map-characters.js';
import { isNiallFollowing, niallState, updateNiallInteraction } from './niall.js';
import { restoreBuildingAmbience, updateBuildingAmbience } from './nightclub-audio.js';
import { hasMikeAftermath, resetMikeAftermath, resetNiallQuestState } from './world-state.js';
import { resetTimRoute } from './tim-location.js';
import { ADAM, ALEX_S, ED, KATY, MIKE, REI, setupNpcInteractions, updateNpcInteractions } from './npcs.js';
import { player, updatePlayer } from './player.js';
import { draw, drawLoadFailure } from './render.js';
import { hideSignDialogue, updateSigns } from './signs.js';
import { isAlexResurrectionUiBlocking } from './alex-s-power-ui.js';
import { maddyWorldDeltaTime } from './maddy-tea-power.js';
import { requireElement } from './elements.js';
import { georgiaState } from './georgia.js';
import { isSamPowerActive, samTargetId, type SamPowerTarget, updateSamPower } from './sam-power.js';
import { isOscarEaten, isOscarPowerActive, updateOscarPower } from './oscar-power.js';
import { andyWorldDeltaTime } from './andy-power.js';
import { updateAndyWorld } from './andy-world-power.js';

let previousTime = 0;
let worldAnimationTime = 0;
restoreBuildingAmbience(new URLSearchParams(window.location.search).get('door'));
const loadingOverlay = requireElement<HTMLElement>('#door-loading');

const STATIC_SAM_TARGETS: readonly SamPowerTarget[] = [
  ...MAP_CHARACTER_DEFINITIONS.map((character) => ({
    id: samTargetId(character.name),
    x: character.x,
    y: character.y,
    height: character.height,
  })),
  { id: 'adam', x: ADAM.x, y: ADAM.y, height: ADAM.height },
  { id: 'alex-s', x: ALEX_S.x, y: ALEX_S.y, height: ALEX_S.height },
  { id: 'ed', x: ED.x, y: ED.y, height: ED.height },
  { id: 'katy', x: KATY.x, y: KATY.y, height: KATY.height },
  { id: 'rei', x: REI.x, y: REI.y, height: REI.height },
];

function currentSamTargets(): readonly SamPowerTarget[] {
  const thief = getCaveThief();
  const niallX = isNiallFollowing() ? player.x - 34 : niallState.x;
  const niallY = isNiallFollowing() ? player.y + 12 : niallState.y;
  const targets: SamPowerTarget[] = [
    ...STATIC_SAM_TARGETS,
    { id: 'niall', x: niallX, y: niallY, height: 40 },
    { id: 'georgia', x: georgiaState.x, y: georgiaState.y, height: 46 },
  ];
  if (!hasMikeAftermath()) targets.push({ id: 'mike', x: MIKE.x, y: MIKE.y, height: MIKE.height });
  if (thief) targets.push({ id: 'cave-thief', x: thief.x, y: thief.y, height: thief.size });
  return targets;
}

function gameLoop(time: number): void {
  const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
  const worldDeltaTime = aliceWorldDeltaTime(reiWorldDeltaTime(mikeWorldDeltaTime(katieWorldDeltaTime(julianWorldDeltaTime(juWorldDeltaTime(helenWorldDeltaTime(danWorldDeltaTime(chrisWorldDeltaTime(andyWorldDeltaTime(maddyWorldDeltaTime(deltaTime, time), time), time), time), time), time), time), time), time), time), time);
  worldAnimationTime = worldAnimationTime === 0 ? time : worldAnimationTime + worldDeltaTime * 1000;
  previousTime = time;
  updatePowerups(time);
  if (isDoorNavigationStarted() || isThoughtsOpen()) {
    draw(time, worldAnimationTime);
    return;
  }
  if (!isDanPowerActive(time) && !isKatiePowerActive(time)) updateBusIntro(deltaTime, player);
  updatePlayer(deltaTime, 1);
  updateTimInputWorld(time, player.x, player.y);
  if (!isAlicePowerActive(time) && !isDanPowerActive(time) && !isGeorgiaPowerActive(time) && !isKatiePowerActive(time) && !isOscarPowerActive(time) && !isReiPowerActive(time) && !isSamPowerActive(time) && !isTimInputPowerActive(time)) updateHole(deltaTime, player);
  updateBuildingAmbience(player.x, player.y);
  const targets = currentSamTargets();
  let visibleTargets = targets.filter((target) => !isOscarEaten(target.id));
  updateAliceWorld(time, player.x, player.y, visibleTargets);
  updateReiWorld(time, player.x, player.y, visibleTargets);
  updateNoelWorld(time, player.x, player.y, visibleTargets);
  updateMikeWorld(time, player.x, player.y, visibleTargets);
  updateLucyWorld(time, player.x, player.y, visibleTargets);
  updateKatieWorld(time, player.x, player.y, visibleTargets);
  updateJulianWorld(time, player.x, player.y, visibleTargets);
  updateSamPower(time, player.x, player.y, visibleTargets, player.direction);
  updateOscarPower(time, player.x, player.y, targets.filter((target) => target.id !== 'niall' && target.id !== 'georgia'), player.direction);
  if (isOscarPowerActive(time)) visibleTargets = targets.filter((target) => !isOscarEaten(target.id));
  updateAndyWorld(time, player.x, player.y, targets);
  updateBochraWorld(time, player.x, player.y, targets);
  updateChrisWorld(time, player.x, player.y, visibleTargets);
  updateDanWorld(time, player.x, player.y, visibleTargets);
  updateGeorgiaWorld(time, player.x, player.y, visibleTargets);
  updateJoeWorld(time, player.x, player.y, visibleTargets);
  updateJuWorld(time, player.x, player.y, visibleTargets);
  updateHelenWorld(time, player.x, player.y, visibleTargets);
  if (isJumpMenuOpen() || isAlexResurrectionUiBlocking()) {
    draw(time, worldAnimationTime);
    return;
  }
  if (!isChrisPowerActive(time)) {
    if (!isDanPowerActive(time)) updateCaveThief(worldDeltaTime, time, player.x, player.y, 1);
    updateGeorgia(worldDeltaTime);
    if (!isAlicePowerActive(time) && !isDanPowerActive(time) && !isGeorgiaPowerActive(time) && !isHelenPowerActive(time) && !isJoePowerActive(time) && !isJuPowerActive(time) && !isJulianPowerActive(time) && !isKatiePowerActive(time) && !isLucyPowerActive(time) && !isMikePowerActive(time) && !isNoelPowerActive(time) && !isOscarPowerActive(time) && !isReiPowerActive(time) && !isSamPowerActive(time) && !isTimInputPowerActive(time)) {
      updateGymTimCutscene(worldDeltaTime, player);
      updateNpcInteractions(player.x, player.y);
      if (!isCaveThiefPursuitActive()) {
        updateNiallInteraction(worldDeltaTime, player.x, player.y);
      }
    }
  }
  updateSigns(player.x, player.y);
  if (!isAlicePowerActive(time) && !isGeorgiaPowerActive(time) && !isJulianPowerActive(time) && !isKatiePowerActive(time) && !isLucyPowerActive(time) && !isMikePowerActive(time) && !isNoelPowerActive(time) && !isOscarPowerActive(time) && !isReiPowerActive(time) && !isSamPowerActive(time) && !isTimInputPowerActive(time)) updateDoors(player.x, player.y);
  draw(time, worldAnimationTime);
}

setupInput();
setupAudioMute();
setupBusIntro();
setupInventory();
setupJump();
setupMusicPlayer();
setupNpcInteractions();
window.addEventListener('max-game:alex-s-dialogue', hideSignDialogue);
setupCaveThief();
setupGymTimCutscene();
requireElement<HTMLButtonElement>('#reset-all').addEventListener('click', () => {
  releaseAllInput();
  resetNiallQuestState();
  resetTimRoute();
  resetMikeAftermath();
  resetMusicLibrary();
  const sealMode = new URLSearchParams(window.location.search).has('seal');
  window.location.assign(sealMode ? 'index.html?seal=1' : 'index.html');
});

loadAssets(isCaveThiefPursuitActive())
  .then(() => {
    void loadMapCharacters();
    releaseAllInput();
    loadingOverlay.hidden = true;
    canvas.dataset.collisionShapes = String(COLLISION_SHAPES.length);
    startGameLoop(gameLoop, () => { previousTime = 0; });
  })
  .catch((error: unknown) => {
    console.error(error);
    loadingOverlay.hidden = true;
    drawLoadFailure();
  });
