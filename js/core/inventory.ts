import { activateTimInputPower, timInputPowerReveal, timInputPowerSecondsLeft, TIM_INPUT_POWER_DURATION } from '../powers/tim/tim-input-power.js';
import { getPlayerBody } from './player-body.js';
import { activateReiPower, reiPowerSecondsLeft, REI_POWER_DURATION, REI_POWER_REVEALS, type ReiPowerKind } from '../powers/rei/rei-power.js';
import { activateNoelPower, isNoelPowerActive, noelAssetClaim, noelPowerReveal, noelPowerSecondsLeft, updateNoelAssessment } from '../powers/noel/noel-power.js';
import { activateAlicePower, alicePowerReveal, alicePowerSecondsLeft, ALICE_POWER_DURATION } from '../powers/alice/alice-power.js';
import { activateMikePower, mikePowerSecondsLeft, MIKE_POWER_REVEAL } from '../powers/mike/mike-power.js';
import { activateLucyPower, isLucyCapEquipped, lucyPowerReveal, lucyPowerSecondsLeft, setLucyCapEquipped } from '../powers/lucy/lucy-power.js';
import { activateKatiePower, katiePowerSecondsLeft, KATIE_POWER_DURATION, KATIE_POWER_REVEAL } from '../powers/katie/katie-power.js';
import { activateJulianPower, julianPowerSecondsLeft, julianPowerReveal } from '../powers/julian/julian-power.js';
import { updateJulianPowerUi } from '../powers/julian/julian-power-ui.js';
import { activateJuPower, juPowerSecondsLeft, JU_POWER_DURATION, JU_POWER_REVEAL } from '../powers/ju/ju-power.js';
import { activateJoePower, joePowerSecondsLeft, JOE_POWER_DURATION, JOE_POWER_REVEAL } from '../powers/joe/joe-power.js';
import { activateHelenPower, helenPowerSecondsLeft, HELEN_POWER_REVEAL } from '../powers/helen/helen-power.js';
import { activateGeorgiaPower, georgiaPowerSecondsLeft, GEORGIA_POWER_DURATION, GEORGIA_POWER_REVEAL } from '../powers/georgia/georgia-power.js';
import { activateDanPower, danPowerSecondsLeft, DAN_POWER_DURATION, DAN_POWER_REVEAL } from '../powers/dan/dan-power.js';
import { activateChrisPower, chrisPowerSecondsLeft, CHRIS_POWER_DURATION, CHRIS_POWER_REVEAL } from '../powers/chris/chris-power.js';
import { createGameAudio, focusPowerAudio, releaseGameAudio } from './audio-mute.js';
import { POWER_THEME_SOURCES } from '../generated/core/power-themes.generated.js';
import { requireElement } from './dom.js';
import { hasGift, LUCY_SOLAR_CAP, getCollectedGifts, removeAllCollectedGifts, removeGift } from './inventory-gifts.js';
import {
  activateKatyPower,
  katyPowerSecondsLeft,
  KATY_POWER_DURATION,
  updateKatyPower,
} from '../powers/katy/katy-power.js';
import { resolveSiteAsset } from './site-assets.js';
import { activateMaddyTeaPower, maddyTeaSecondsLeft, MADDY_TEA_REVEAL } from '../powers/maddy/maddy-tea-power.js';
import { isEdGiftCharged } from '../powers/ed/ed-power.js';
import { openEdTattooGame } from '../powers/ed/tattoo-ui.js';
import { activateNiallSpeed, niallSpeedSecondsLeft } from '../powers/niall/niall-speed-power.js';
import { activateAdamPower, adamPowerSecondsLeft, ADAM_POWER_REVEAL, setupAdamLeapControl, updateAdamLeapControl } from '../powers/adam/adam-power.js';
import { activateSamPower, samPowerSecondsLeft, SAM_POWER_DURATION, samPowerReveal } from '../powers/sam/sam-power.js';
import { activateOscarPower, oscarPowerSecondsLeft, OSCAR_POWER_DURATION, OSCAR_POWER_REVEAL } from '../powers/oscar/oscar-power.js';
import { activateBochraPower, bochraPowerSecondsLeft, BOCHRA_POWER_DURATION, BOCHRA_POWER_REVEAL } from '../powers/bochra/bochra-power.js';
import { activateAndyPower, andyPowerSecondsLeft, ANDY_POWER_DURATION, ANDY_POWER_REVEAL } from '../powers/andy/andy-power.js';
import { endDialogueAudio } from './dialogue-audio.js';
import { activateAlexSPower, alexSPowerSecondsLeft, alexSPowerReveal, alexSThemeSecondsLeft } from '../powers/alex-s/alex-s-power.js';
import { openAlexResurrectionChoice, openAlexToastDialogue, updateAlexResurrectionUi } from '../powers/alex-s/alex-s-power-ui.js';
import { characterAsset, characterAssetOrNull } from './character-assets.js';

const ITEM_THEME_DURATION = 10_000;
const KATY_THEME_SOURCE = characterAsset('katy', 'theme');
const LUCY_THEME_SOURCE = characterAsset('lucy', 'theme');
const TIM_THEME_SOURCE = characterAsset('tim', 'theme');
const MADDY_THEME_SOURCE = characterAsset('maddy', 'theme');
const ED_THEME_SOURCE = characterAsset('ed', 'theme');
const JU_THEME_SOURCE = characterAsset('ju', 'theme');
const KATIE_THEME_SOURCE = characterAsset('katie', 'theme');
const JOE_THEME_SOURCE = characterAsset('joe', 'theme');
const SAM_THEME_SOURCE = characterAsset('sam', 'theme');
const REI_THEME_SOURCE = characterAsset('rei', 'theme');
const OSCAR_THEME_SOURCE = characterAsset('oscar', 'theme');
const DAN_THEME_SOURCE = characterAsset('dan', 'theme');
const GEORGIA_THEME_SOURCE = characterAsset('georgia', 'theme');
const CHRIS_THEME_SOURCE = characterAsset('chris', 'theme');
const BOCHRA_THEME_SOURCE = characterAsset('bochra', 'theme');
const ANDY_THEME_SOURCE = characterAssetOrNull('andy', 'theme');
const ALEX_S_THEME_SOURCE = characterAsset('alex-s', 'theme');
const ALICE_THEME_SOURCE = characterAsset('alice', 'theme');

const inventoryToggle = requireElement<HTMLButtonElement>('#inventory-toggle');
const inventoryPanel = requireElement<HTMLElement>('#inventory-panel');
const inventoryClose = requireElement<HTMLButtonElement>('#inventory-close');
const inventoryDeleteAll = requireElement<HTMLButtonElement>('#inventory-delete-all');
const inventoryMessage = requireElement<HTMLElement>('#inventory-message');
const inventoryCount = requireElement<HTMLElement>('.inventory-count');
const powerupStatus = requireElement<HTMLElement>('#powerup-status');
const announcer = requireElement<HTMLElement>('#announcer');
const giftItems = requireElement<HTMLElement>('#gift-items');

/**
 * The visible copy sits inside the inventory panel, which is hidden most of the
 * time - a live region in a hidden subtree is never announced - so every message
 * is mirrored into an always-rendered one.
 */
function announce(message: string): void {
  inventoryMessage.textContent = message;
  announcer.textContent = message;
}

function stopItemTheme(): void {
  if (itemThemeTimeout) window.clearTimeout(itemThemeTimeout);
  itemThemeTimeout = 0;
  if (itemTheme) releaseGameAudio(itemTheme);
  itemTheme = null;
}

function stopPowerMusic(): void {
  stopItemTheme();
  stopKatyTheme();
  focusPowerAudio(null, ITEM_THEME_DURATION);
  endDialogueAudio();
}

function playItemTheme(source: string, loop = false, duration = ITEM_THEME_DURATION): void {
  stopPowerMusic();
  const theme = createGameAudio(resolveSiteAsset(POWER_THEME_SOURCES[source] ?? source));
  itemTheme = theme;
  focusPowerAudio(theme, duration);
  theme.loop = loop;
  void theme.play().catch(() => {
    // Browsers may reject audio outside a user gesture.
  });
  itemThemeTimeout = window.setTimeout(() => {
    if (itemTheme !== theme) return;
    stopItemTheme();
  }, duration);
}

function stopKatyTheme(): void {
  if (katyThemeTimeout) window.clearTimeout(katyThemeTimeout);
  katyThemeTimeout = 0;
  if (katyTheme) releaseGameAudio(katyTheme);
  katyTheme = null;
}

function playKatyTheme(): void {
  stopPowerMusic();
  katyTheme = createGameAudio(resolveSiteAsset(POWER_THEME_SOURCES[KATY_THEME_SOURCE] ?? KATY_THEME_SOURCE));
  focusPowerAudio(katyTheme, KATY_POWER_DURATION);
  katyTheme.loop = true;
  void katyTheme.play().catch(() => {
    // Browsers may reject audio outside a user gesture.
  });
  katyThemeTimeout = window.setTimeout(stopKatyTheme, KATY_POWER_DURATION);
}

let itemTheme: HTMLAudioElement | null = null;
let itemThemeTimeout = 0;
let katyTheme: HTMLAudioElement | null = null;
let katyThemeTimeout = 0;
let katyItemDescription = '';
let maddyItemDescription = '';
let adamPowerPendingReveal = false;
let oscarPowerPendingReveal = false;
let andyPowerPendingReveal = false;
let bochraPowerPendingReveal = false;
let chrisPowerPendingReveal = false;
let danPowerPendingReveal = false;
let georgiaPowerPendingReveal = false;
let helenPowerPendingReveal = false;
let joePowerPendingReveal = false;
let juPowerPendingReveal = false;
let julianPowerPendingReveal = false;
let katiePowerPendingReveal = false;
let lucyPowerPendingReveal = false;
let mikePowerPendingReveal = false;
let alicePowerPendingReveal = false;
let noelPowerPendingReveal = false;
let samPowerPendingReveal = false;
let timPowerPendingReveal = false;
let alexSPowerPendingReveal = false;
const reiPendingReveals: Record<ReiPowerKind, boolean> = { gravity: false, sparkle: false };

function renderGiftItems(): void {
  giftItems.replaceChildren();
  inventoryCount.textContent = String(getCollectedGifts().length);
  getCollectedGifts().forEach((item) => {
    const card = document.createElement('div');
    card.className = 'inventory-gift';
    const image = document.createElement('img');
    image.loading = 'lazy';
    image.decoding = 'async';
    image.src = resolveSiteAsset(item.imageSource);
    image.alt = item.name;
    const text = document.createElement('span');
    text.className = 'item-text';
    const name = document.createElement('strong');
    name.textContent = item.name;
    text.append(name);
    const actions = document.createElement('span');
    actions.className = 'inventory-gift-actions';
    const useButton = document.createElement('button');
    useButton.type = 'button';
    useButton.disabled = isNoelPowerActive();
    useButton.textContent = item.id === LUCY_SOLAR_CAP.id ? (isLucyCapEquipped() ? 'Take off' : 'Wear') : 'Use';
    useButton.addEventListener('click', () => {
      if (isNoelPowerActive()) return;
      if (item.id === 'alex-s-item') {
        setInventoryOpen(false);
        openAlexResurrectionChoice((character) => {
          if (!hasGift(item) || !activateAlexSPower(character.id)) return;
          removeGift(item);
          alexSPowerPendingReveal = true;
          playItemTheme(ALEX_S_THEME_SOURCE);
          announce(`${character.name} has been resurrected for twenty seconds.`);
          openAlexToastDialogue();
        });
        return;
      }
      if (item.id === LUCY_SOLAR_CAP.id) {
        setLucyCapEquipped(!isLucyCapEquipped());
        announce(isLucyCapEquipped() ? LUCY_SOLAR_CAP.description : 'Solar-panel cap taken off.');
        renderGiftItems();
        return;
      }
      if (item.id === 'katie-item') {
        activateKatiePower();
        window.dispatchEvent(new Event('max-game:katie-power-activated'));
        playItemTheme(KATIE_THEME_SOURCE, true, KATIE_POWER_DURATION);
        katiePowerPendingReveal = true;
        announce("Katie's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'ju-item') {
        activateJuPower();
        window.dispatchEvent(new Event('max-game:ju-power-activated'));
        playItemTheme(JU_THEME_SOURCE, true, JU_POWER_DURATION);
        juPowerPendingReveal = true;
        powerupStatus.textContent = 'Ju power 10.0s';
        if (powerupStatus.hidden) powerupStatus.hidden = false;
        announce("Ju's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'joe-item') {
        activateJoePower();
        window.dispatchEvent(new Event('max-game:joe-power-activated'));
        playItemTheme(JOE_THEME_SOURCE, true, JOE_POWER_DURATION);
        joePowerPendingReveal = true;
        powerupStatus.textContent = 'Joe power 10.0s';
        if (powerupStatus.hidden) powerupStatus.hidden = false;
        announce("Joe's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'georgia-item') {
        activateGeorgiaPower();
        window.dispatchEvent(new Event('max-game:georgia-power-activated'));
        playItemTheme(GEORGIA_THEME_SOURCE, true, GEORGIA_POWER_DURATION);
        georgiaPowerPendingReveal = true;
        powerupStatus.textContent = 'Georgia power 10.0s';
        if (powerupStatus.hidden) powerupStatus.hidden = false;
        announce("Georgia's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'dan-item') {
        activateDanPower();
        window.dispatchEvent(new Event('max-game:dan-power-activated'));
        playItemTheme(DAN_THEME_SOURCE, true, DAN_POWER_DURATION);
        danPowerPendingReveal = true;
        powerupStatus.textContent = 'Dan power 10.0s';
        if (powerupStatus.hidden) powerupStatus.hidden = false;
        announce("Dan's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'chris-item') {
        activateChrisPower();
        window.dispatchEvent(new Event('max-game:chris-power-activated'));
        playItemTheme(CHRIS_THEME_SOURCE, true, CHRIS_POWER_DURATION);
        chrisPowerPendingReveal = true;
        powerupStatus.textContent = 'Chris power 10.0s';
        if (powerupStatus.hidden) powerupStatus.hidden = false;
        announce("Chris's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'bochra-item') {
        activateBochraPower();
        playItemTheme(BOCHRA_THEME_SOURCE, true, BOCHRA_POWER_DURATION);
        bochraPowerPendingReveal = true;
        powerupStatus.textContent = 'Bochra power 10.0s';
        if (powerupStatus.hidden) powerupStatus.hidden = false;
        announce("Bochra's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'andy-item') {
        activateAndyPower();
        if (ANDY_THEME_SOURCE) playItemTheme(ANDY_THEME_SOURCE, true, ANDY_POWER_DURATION);
        andyPowerPendingReveal = true;
        powerupStatus.textContent = 'Andy power 10.0s';
        if (powerupStatus.hidden) powerupStatus.hidden = false;
        announce("Andy's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'julian-item') {
        activateJulianPower();
        window.dispatchEvent(new Event('max-game:julian-power-activated'));

        julianPowerPendingReveal = true;
        announce("Julian's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'tim-item') {
        activateTimInputPower();
        window.dispatchEvent(new Event('max-game:tim-power-activated'));
        playItemTheme(TIM_THEME_SOURCE, true, TIM_INPUT_POWER_DURATION);
        timPowerPendingReveal = true;
        powerupStatus.textContent = 'Tim power 10.0s';
        if (powerupStatus.hidden) powerupStatus.hidden = false;
        announce("Tim's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'helen-item') {
        activateHelenPower();
        window.dispatchEvent(new Event('max-game:helen-power-activated'));

        helenPowerPendingReveal = true;
        powerupStatus.textContent = 'Helen power 10.0s';
        if (powerupStatus.hidden) powerupStatus.hidden = false;
        announce("Helen's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'niall-item') {
        const charged = isEdGiftCharged(item);
        activateNiallSpeed(charged);

        announce("Niall's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'katy-item') {
        const now = performance.now();
        activateKatyPower(now);
        playKatyTheme();
        katyItemDescription = `${item.name}: ${item.description}`;
        powerupStatus.textContent = 'Katy effect 10.0s';
        if (powerupStatus.hidden) powerupStatus.hidden = false;
        announce("Katy's item activated.");
      } else if (item.id === 'rei-item' || item.id === 'rei-item-2') {
        const kind: ReiPowerKind = item.id === 'rei-item' ? 'gravity' : 'sparkle';
        activateReiPower(kind);
        window.dispatchEvent(new Event('max-game:rei-power-activated'));
        stopKatyTheme();
        playItemTheme(REI_THEME_SOURCE, true, REI_POWER_DURATION);
        reiPendingReveals[kind] = true;
        announce(`${item.name} activated.`);
        setInventoryOpen(false);
      } else if (item.id === 'alice-item') {
        if (!activateAlicePower()) return;
        window.dispatchEvent(new Event('max-game:alice-power-activated'));
        playItemTheme(ALICE_THEME_SOURCE, true, ALICE_POWER_DURATION);
        alicePowerPendingReveal = true;
        announce("Alice's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'noel-item') {
        if (!activateNoelPower()) return;
        window.dispatchEvent(new Event('max-game:noel-power-activated'));

        noelPowerPendingReveal = true;
        announce("Noel's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'mike-item') {
        activateMikePower();
        window.dispatchEvent(new Event('max-game:mike-power-activated'));
        stopPowerMusic();
        mikePowerPendingReveal = true;
        powerupStatus.textContent = 'Happiness +36% 10.0s';
        powerupStatus.hidden = false;
        announce("Mike's cookie made you 36% happier for ten seconds. Enjoy the extra spring in your step!");
        setInventoryOpen(false);
      } else if (item.id === 'maddy-item') {
        activateMaddyTeaPower();
        playItemTheme(MADDY_THEME_SOURCE, true);
        maddyItemDescription = `${item.name}: ${MADDY_TEA_REVEAL}`;
        powerupStatus.textContent = 'Tea time 10.0s';
        if (powerupStatus.hidden) powerupStatus.hidden = false;
        announce("Maddy's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'ed-item') {
        setInventoryOpen(false);
        openEdTattooGame(() => playItemTheme(ED_THEME_SOURCE, true), stopItemTheme);
        announce("Ed's tattoo challenge: ink HALSTEAD in ten seconds.");
      } else if (item.id === 'adam-item') {
        activateAdamPower();
        stopPowerMusic();
        adamPowerPendingReveal = true;
        powerupStatus.textContent = 'Adam power 10.0s';
        if (powerupStatus.hidden) powerupStatus.hidden = false;
        announce("Adam's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'sam-item') {
        activateSamPower();
        window.dispatchEvent(new Event('max-game:sam-power-activated'));
        stopKatyTheme();
        samPowerPendingReveal = true;
        playItemTheme(SAM_THEME_SOURCE, true, SAM_POWER_DURATION);
        powerupStatus.textContent = 'Sam power 13.0s';
        if (powerupStatus.hidden) powerupStatus.hidden = false;
        announce("Sam's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'oscar-item') {
        activateOscarPower();
        window.dispatchEvent(new Event('max-game:oscar-power-activated'));
        playItemTheme(OSCAR_THEME_SOURCE, true, OSCAR_POWER_DURATION);
        oscarPowerPendingReveal = true;
        powerupStatus.textContent = 'Oscar power 10.0s';
        if (powerupStatus.hidden) powerupStatus.hidden = false;
        announce("Oscar's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'lucy-item') {
        activateLucyPower();
        window.dispatchEvent(new Event('max-game:lucy-power-activated'));
        playItemTheme(LUCY_THEME_SOURCE, true);
        lucyPowerPendingReveal = true;
        announce("Mayo god activated! Hold click or touch and drag on the game to squirt mayonnaise.");
        setInventoryOpen(false);
      } else {
        announce(`${item.name}: ${item.description}`);
      }
      removeGift(item);
    });
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.disabled = isNoelPowerActive();
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      if (isNoelPowerActive()) return;
      removeGift(item);
      announce(`${item.name} deleted.`);
    });
    actions.append(useButton, deleteButton);
    card.append(image, text, actions);
    giftItems.append(card);
  });
  inventoryDeleteAll.disabled = isNoelPowerActive();
  if (!isNoelPowerActive() && noelAssetClaim() > 0) {
    const claim = document.createElement('p');
    claim.textContent = `Noel's outstanding asset claim: ${noelAssetClaim().toFixed(3)} of a usable gift. At one whole unit, the contract repossesses a carried gift. Permanent equipment and music are protected.`;
    giftItems.append(claim);
  }
}

function setInventoryOpen(isOpen: boolean): void {
  if (isOpen && (getPlayerBody() === 'ghost' || document.querySelector<HTMLElement>('.game-shell')?.dataset.roadAccident === 'true')) return;
  const hadFocusInside = inventoryPanel.contains(document.activeElement);
  inventoryPanel.hidden = !isOpen;
  inventoryToggle.setAttribute('aria-expanded', String(isOpen));
  if (!isOpen && hadFocusInside) inventoryToggle.focus();
}

export function setupInventory(): void {
  if (!hasGift(LUCY_SOLAR_CAP)) setLucyCapEquipped(false);
  renderGiftItems();
  setupAdamLeapControl();
  if (alexSPowerSecondsLeft() > 0) {
    alexSPowerPendingReveal = true;
    const themeRemaining = alexSThemeSecondsLeft();
    if (themeRemaining > 0) playItemTheme(ALEX_S_THEME_SOURCE, false, themeRemaining * 1000);
  }
  const adamRemaining = adamPowerSecondsLeft();
  if (adamRemaining > 0) {
    adamPowerPendingReveal = true;
  }
  window.addEventListener('max-game:inventory-gift-added', () => {
    renderGiftItems();
    inventoryToggle.classList.remove('inventory-added-wobble');
    void inventoryToggle.offsetWidth;
    inventoryToggle.classList.add('inventory-added-wobble');
    window.setTimeout(() => inventoryToggle.classList.remove('inventory-added-wobble'), 1000);
  });
  window.addEventListener('max-game:inventory-gift-removed', () => {
    if (!hasGift(LUCY_SOLAR_CAP)) setLucyCapEquipped(false);
    renderGiftItems();
  });
  window.addEventListener('max-game:music-unlocked', () => {
    renderGiftItems();
  });

  inventoryToggle.addEventListener('click', () => setInventoryOpen(inventoryPanel.hidden));
  window.addEventListener('max-game:world-interaction-opened', () => setInventoryOpen(false));
  inventoryClose.addEventListener('click', () => setInventoryOpen(false));
  inventoryDeleteAll.addEventListener('click', () => {
    if (isNoelPowerActive()) return;
    const removedCount = removeAllCollectedGifts();
    announce(removedCount > 0 ? `${removedCount} items deleted.` : 'Inventory is already empty.');
  });
  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === 'i') setInventoryOpen(inventoryPanel.hidden);
    else if (key === 'Escape') setInventoryOpen(false);
  });
}

export function updatePowerups(frameTime: number): void {
  // A RAF timestamp can precede an inventory click in the same frame.
  // Read the current clock so a newly activated power never looks expired.
  const now = Math.max(frameTime, performance.now());
  updateAlexResurrectionUi();
  const alexSSecondsLeft = alexSPowerSecondsLeft();
  const reiGravitySeconds = reiPowerSecondsLeft('gravity', now);
  const reiSparkleSeconds = reiPowerSecondsLeft('sparkle', now);
  const aliceSecondsLeft = alicePowerSecondsLeft(now);
  updateNoelAssessment(now);
  const noelSecondsLeft = noelPowerSecondsLeft(now);
  const lucySecondsLeft = lucyPowerSecondsLeft(now);
  const mikeSecondsLeft = mikePowerSecondsLeft(now);
  updateJulianPowerUi(now);
  const julianSecondsLeft = julianPowerSecondsLeft(now);
  const katieSecondsLeft = katiePowerSecondsLeft(now);
  const joeSecondsLeft = joePowerSecondsLeft(now);
  const juSecondsLeft = juPowerSecondsLeft(now);
  const katyEffectExpired = updateKatyPower(now);
  const katySecondsLeft = katyPowerSecondsLeft(now);
  const teaSecondsLeft = maddyTeaSecondsLeft(now);
  const niallSecondsLeft = niallSpeedSecondsLeft();
  const adamSecondsLeft = adamPowerSecondsLeft();
  const samSecondsLeft = samPowerSecondsLeft(now);
  const timSecondsLeft = timInputPowerSecondsLeft(now);
  const oscarSecondsLeft = oscarPowerSecondsLeft(now);
  const andySecondsLeft = andyPowerSecondsLeft(now);
  const bochraSecondsLeft = bochraPowerSecondsLeft(now);
  const chrisSecondsLeft = chrisPowerSecondsLeft(now);
  const danSecondsLeft = danPowerSecondsLeft(now);
  const georgiaSecondsLeft = georgiaPowerSecondsLeft(now);
  const helenSecondsLeft = helenPowerSecondsLeft(now);
  const expiredDescriptions: string[] = [];
  updateAdamLeapControl();

  if (alexSPowerPendingReveal && alexSSecondsLeft === 0) {
    expiredDescriptions.push(alexSPowerReveal());
    alexSPowerPendingReveal = false;
  }

  if (katyEffectExpired) {
    stopKatyTheme();
    if (katyItemDescription) expiredDescriptions.push(katyItemDescription);
    katyItemDescription = '';
  }
  if (maddyItemDescription && teaSecondsLeft === 0) {
    expiredDescriptions.push(maddyItemDescription);
    maddyItemDescription = '';
  }
  if (adamPowerPendingReveal && adamSecondsLeft === 0) {
    expiredDescriptions.push(ADAM_POWER_REVEAL);
    adamPowerPendingReveal = false;
  }
  if (oscarPowerPendingReveal && oscarSecondsLeft === 0) {
    expiredDescriptions.push(OSCAR_POWER_REVEAL);
    oscarPowerPendingReveal = false;
  }
  if (andyPowerPendingReveal && andySecondsLeft === 0) {
    expiredDescriptions.push(ANDY_POWER_REVEAL);
    andyPowerPendingReveal = false;
  }

  if (bochraPowerPendingReveal && bochraSecondsLeft === 0) {
    expiredDescriptions.push(BOCHRA_POWER_REVEAL);
    bochraPowerPendingReveal = false;
  }

  if (chrisPowerPendingReveal && chrisSecondsLeft === 0) {
    expiredDescriptions.push(CHRIS_POWER_REVEAL);
    chrisPowerPendingReveal = false;
  }

  if (danPowerPendingReveal && danSecondsLeft === 0) {
    expiredDescriptions.push(DAN_POWER_REVEAL);
    danPowerPendingReveal = false;
  }
  if (georgiaPowerPendingReveal && georgiaSecondsLeft === 0) {
    expiredDescriptions.push(GEORGIA_POWER_REVEAL);
    georgiaPowerPendingReveal = false;
  }
  if (helenPowerPendingReveal && helenSecondsLeft === 0) {
    expiredDescriptions.push(HELEN_POWER_REVEAL);
    helenPowerPendingReveal = false;
  }

  if (joePowerPendingReveal && joeSecondsLeft === 0) {
    expiredDescriptions.push(JOE_POWER_REVEAL);
    joePowerPendingReveal = false;
  }

  if (juPowerPendingReveal && juSecondsLeft === 0) {
    expiredDescriptions.push(JU_POWER_REVEAL);
    juPowerPendingReveal = false;
  }

  if (julianPowerPendingReveal && julianSecondsLeft === 0) {
    expiredDescriptions.push(julianPowerReveal());
    julianPowerPendingReveal = false;
  }

  if (katiePowerPendingReveal && katieSecondsLeft === 0) {
    expiredDescriptions.push(KATIE_POWER_REVEAL);
    katiePowerPendingReveal = false;
  }

  if (lucyPowerPendingReveal && lucySecondsLeft === 0) {
    expiredDescriptions.push(lucyPowerReveal());
    lucyPowerPendingReveal = false;
  }

  if (mikePowerPendingReveal && mikeSecondsLeft === 0) {
    expiredDescriptions.push(MIKE_POWER_REVEAL);
    mikePowerPendingReveal = false;
  }
  if (alicePowerPendingReveal && aliceSecondsLeft === 0) {
    expiredDescriptions.push(alicePowerReveal());
    alicePowerPendingReveal = false;
  }
  if (noelPowerPendingReveal && noelSecondsLeft === 0) {
    expiredDescriptions.push(noelPowerReveal());
    noelPowerPendingReveal = false;
    renderGiftItems();
  }

  for (const kind of ['gravity', 'sparkle'] as const) {
    if (reiPendingReveals[kind] && reiPowerSecondsLeft(kind, now) === 0) {
      expiredDescriptions.push(REI_POWER_REVEALS[kind]);
      reiPendingReveals[kind] = false;
    }
  }

  if (timPowerPendingReveal && timSecondsLeft === 0) {
    expiredDescriptions.push(timInputPowerReveal());
    timPowerPendingReveal = false;
  }

  if (samPowerPendingReveal && samSecondsLeft === 0) {
    expiredDescriptions.push(samPowerReveal());
    samPowerPendingReveal = false;
  }

  if (expiredDescriptions.length > 0) announce(expiredDescriptions.join('\n'));

  if (alexSSecondsLeft > 0) {
    const status = `Alex S resurrection ${alexSSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (reiGravitySeconds > 0 || reiSparkleSeconds > 0) {
    const status = [reiGravitySeconds > 0 ? `Rei 1 ${reiGravitySeconds.toFixed(1)}s` : '', reiSparkleSeconds > 0 ? `Rei 2 ${reiSparkleSeconds.toFixed(1)}s` : ''].filter(Boolean).join(' · ');
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (aliceSecondsLeft > 0) {
    const status = `Alice flash ${aliceSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (noelSecondsLeft > 0) {
    const status = `Noel power ${noelSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (mikeSecondsLeft > 0) {
    const status = `Happiness +36% ${mikeSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (lucySecondsLeft > 0) {
    const status = `Mayo god ${lucySecondsLeft.toFixed(1)}s · Hold to spray`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (katieSecondsLeft > 0) {
    const status = `Katie power ${katieSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (julianSecondsLeft > 0) {
    const status = `Julian power ${julianSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (juSecondsLeft > 0) {
    const status = `Ju power ${juSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (joeSecondsLeft > 0) {
    const status = `Joe power ${joeSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (helenSecondsLeft > 0) {
    const status = `Helen power ${helenSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (georgiaSecondsLeft > 0) {
    const status = `Georgia power ${georgiaSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (danSecondsLeft > 0) {
    const status = `Dan power ${danSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (chrisSecondsLeft > 0) {
    const status = `Chris power ${chrisSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (bochraSecondsLeft > 0) {
    const status = `Bochra power ${bochraSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (andySecondsLeft > 0) {
    const status = `Andy power ${andySecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (oscarSecondsLeft > 0) {
    const status = `Oscar power ${oscarSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (timSecondsLeft > 0) {
    const status = `Tim power ${timSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (samSecondsLeft > 0) {
    const status = `Sam power ${samSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (adamSecondsLeft > 0) {
    const status = `Adam power ${adamSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (teaSecondsLeft > 0) {
    const status = `Tea time ${teaSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (katySecondsLeft > 0) {
    const status = `Katy effect ${katySecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else if (niallSecondsLeft > 0) {
    const status = `Niall speed ${niallSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    if (powerupStatus.hidden) powerupStatus.hidden = false;
  } else {
    if (!powerupStatus.hidden) powerupStatus.hidden = true;
  }
}
