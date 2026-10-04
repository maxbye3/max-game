import { activateKatiePower, katiePowerSecondsLeft, KATIE_POWER_DURATION, KATIE_POWER_REVEAL } from './katie-power.js';
import { activateJulianPower, julianPowerSecondsLeft, JULIAN_POWER_DURATION, julianPowerReveal } from './julian-power.js';
import { updateJulianPowerUi } from './julian-power-ui.js';
import { activateJuPower, juPowerSecondsLeft, JU_POWER_DURATION, JU_POWER_REVEAL } from './ju-power.js';
import { activateJoePower, joePowerSecondsLeft, updateJoeDamage, JOE_POWER_DURATION, JOE_POWER_REVEAL } from './joe-power.js';
import { activateHelenPower, helenPowerSecondsLeft, HELEN_POWER_DURATION, HELEN_POWER_REVEAL } from './helen-power.js';
import { activateGeorgiaPower, georgiaPowerSecondsLeft, GEORGIA_POWER_DURATION, GEORGIA_POWER_REVEAL } from './georgia-power.js';
import { activateDanPower, danPowerSecondsLeft, DAN_POWER_DURATION, DAN_POWER_REVEAL } from './dan-power.js';
import { activateChrisPower, chrisPowerSecondsLeft, CHRIS_POWER_DURATION, CHRIS_POWER_REVEAL } from './chris-power.js';
import { createGameAudio } from './audio-mute.js';
import { requireElement } from './dom.js';
import { getCollectedGifts, removeAllCollectedGifts, removeGift } from './inventory-gifts.js';
import {
  activateKatyPower,
  katyPowerSecondsLeft,
  KATY_POWER_DURATION,
  updateKatyPower,
} from './katy-power.js';
import { resolveSiteAsset } from './site-assets.js';
import { activateMaddyTeaPower, maddyTeaSecondsLeft, MADDY_TEA_REVEAL } from './maddy-tea-power.js';
import { activateEdPower, edPowerSecondsLeft, ED_POWER_REVEAL, isEdGiftCharged } from './ed-power.js';
import { activateNiallSpeed, niallSpeedSecondsLeft } from './niall-speed-power.js';
import { activateAdamPower, adamPowerSecondsLeft, ADAM_POWER_REVEAL, setupAdamLeapControl, updateAdamLeapControl } from './adam-power.js';
import { activateSamPower, samPowerSecondsLeft, SAM_POWER_DURATION } from './sam-power.js';
import { activateOscarPower, oscarPowerSecondsLeft, OSCAR_POWER_DURATION, OSCAR_POWER_REVEAL } from './oscar-power.js';
import { activateBochraPower, bochraPowerSecondsLeft, BOCHRA_POWER_DURATION, BOCHRA_POWER_REVEAL } from './bochra-power.js';
import { activateAndyPower, andyPowerSecondsLeft, ANDY_POWER_DURATION, ANDY_POWER_REVEAL } from './andy-power.js';

const gameShell = requireElement<HTMLElement>('.game-shell');
const ITEM_THEME_DURATION = 10_000;
const KATY_THEME_SOURCE = 'chat/katy/theme.m4a';
const MIKE_THEME_SOURCE = 'chat/mike/player/theme.mp3';
const LUCY_THEME_SOURCE = 'chat/lucy/theme.mp3';
const JULIAN_THEME_SOURCE = 'chat/julian/player/theme.mp3';
const TIM_THEME_SOURCE = 'chat/tim/theme.mp3';
const MADDY_THEME_SOURCE = 'chat/maddy/theme.mp3';
const ED_THEME_SOURCE = 'chat/ed/theme.mp3';
const JU_THEME_SOURCE = 'chat/ju/theme.mp3';
const KATIE_THEME_SOURCE = 'chat/katie/theme.mp3';
const JOE_THEME_SOURCE = 'chat/joe/theme.mp3';
const HELEN_THEME_SOURCE = 'chat/helen/player/theme.mp3';
const NIALL_THEME_SOURCE = 'chat/niall/player/theme.mp3';
const SAM_THEME_SOURCE = 'chat/sam/theme.mp3';
const OSCAR_THEME_SOURCE = 'chat/oscar/theme.mp3';
const DAN_THEME_SOURCE = 'chat/dan/theme.mp3';
const GEORGIA_THEME_SOURCE = 'chat/georgia/theme.mp3';
const CHRIS_THEME_SOURCE = 'chat/chris/theme.mp3';
const BOCHRA_THEME_SOURCE = 'chat/bochra/theme.mp3';
const ANDY_THEME_SOURCE = 'chat/andy/theme.mp3';

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

function triggerGiftPower(className: 'world-opening' | 'face-implosion' | 'world-spinning', duration: number, charged = false): void {
  gameShell.classList.remove(className);
  void gameShell.offsetWidth;
  if (className === 'face-implosion') {
    gameShell.style.removeProperty('--face-implosion-duration');
    gameShell.style.removeProperty('--face-implosion-scale');
    gameShell.style.removeProperty('--face-implosion-contrast');
  }
  if (charged && className === 'face-implosion') {
    gameShell.style.setProperty('--face-implosion-duration', `${duration}ms`);
    gameShell.style.setProperty('--face-implosion-scale', '0.68');
    gameShell.style.setProperty('--face-implosion-contrast', '2');
  }
  gameShell.classList.add(className);
  window.setTimeout(() => {
    gameShell.classList.remove(className);
    if (className === 'face-implosion') {
      gameShell.style.removeProperty('--face-implosion-duration');
      gameShell.style.removeProperty('--face-implosion-scale');
      gameShell.style.removeProperty('--face-implosion-contrast');
    }
  }, duration);
}

function stopItemTheme(): void {
  if (itemThemeTimeout) window.clearTimeout(itemThemeTimeout);
  itemThemeTimeout = 0;
  itemTheme?.pause();
  if (itemTheme) itemTheme.currentTime = 0;
  itemTheme = null;
}

function playItemTheme(source: string, loop = false, duration = ITEM_THEME_DURATION): void {
  stopItemTheme();
  const theme = createGameAudio(resolveSiteAsset(source));
  itemTheme = theme;
  theme.preload = 'auto';
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
  katyTheme?.pause();
  if (katyTheme) katyTheme.currentTime = 0;
  katyTheme = null;
}

function playKatyTheme(): void {
  stopKatyTheme();
  katyTheme = createGameAudio(resolveSiteAsset(KATY_THEME_SOURCE));
  katyTheme.preload = 'auto';
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
let edPowerPendingReveal = false;
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

function renderGiftItems(): void {
  giftItems.replaceChildren();
  inventoryCount.textContent = String(getCollectedGifts().length);
  getCollectedGifts().forEach((item) => {
    const card = document.createElement('div');
    card.className = 'inventory-gift';
    const image = document.createElement('img');
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
    useButton.textContent = 'Use';
    useButton.addEventListener('click', () => {
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
        powerupStatus.hidden = false;
        announce("Ju's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'joe-item') {
        activateJoePower();
        window.dispatchEvent(new Event('max-game:joe-power-activated'));
        playItemTheme(JOE_THEME_SOURCE, true, JOE_POWER_DURATION);
        joePowerPendingReveal = true;
        powerupStatus.textContent = 'Joe power 10.0s';
        powerupStatus.hidden = false;
        announce("Joe's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'georgia-item') {
        activateGeorgiaPower();
        window.dispatchEvent(new Event('max-game:georgia-power-activated'));
        playItemTheme(GEORGIA_THEME_SOURCE, true, GEORGIA_POWER_DURATION);
        georgiaPowerPendingReveal = true;
        powerupStatus.textContent = 'Georgia power 10.0s';
        powerupStatus.hidden = false;
        announce("Georgia's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'dan-item') {
        activateDanPower();
        window.dispatchEvent(new Event('max-game:dan-power-activated'));
        playItemTheme(DAN_THEME_SOURCE, true, DAN_POWER_DURATION);
        danPowerPendingReveal = true;
        powerupStatus.textContent = 'Dan power 10.0s';
        powerupStatus.hidden = false;
        announce("Dan's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'chris-item') {
        activateChrisPower();
        window.dispatchEvent(new Event('max-game:chris-power-activated'));
        playItemTheme(CHRIS_THEME_SOURCE, true, CHRIS_POWER_DURATION);
        chrisPowerPendingReveal = true;
        powerupStatus.textContent = 'Chris power 10.0s';
        powerupStatus.hidden = false;
        announce("Chris's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'bochra-item') {
        activateBochraPower();
        playItemTheme(BOCHRA_THEME_SOURCE, true, BOCHRA_POWER_DURATION);
        bochraPowerPendingReveal = true;
        powerupStatus.textContent = 'Bochra power 10.0s';
        powerupStatus.hidden = false;
        announce("Bochra's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'andy-item') {
        activateAndyPower();
        playItemTheme(ANDY_THEME_SOURCE, true, ANDY_POWER_DURATION);
        andyPowerPendingReveal = true;
        powerupStatus.textContent = 'Andy power 10.0s';
        powerupStatus.hidden = false;
        announce("Andy's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'julian-item') {
        activateJulianPower();
        window.dispatchEvent(new Event('max-game:julian-power-activated'));
        playItemTheme(JULIAN_THEME_SOURCE, true, JULIAN_POWER_DURATION);
        julianPowerPendingReveal = true;
        announce("Julian's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'tim-item') {
        playItemTheme(TIM_THEME_SOURCE);
        triggerGiftPower('face-implosion', isEdGiftCharged(item) ? 2_200 : 1_100, isEdGiftCharged(item));
        announce(`${item.name}: ${item.description}`);
      } else if (item.id === 'helen-item') {
        activateHelenPower();
        window.dispatchEvent(new Event('max-game:helen-power-activated'));
        playItemTheme(HELEN_THEME_SOURCE, true, HELEN_POWER_DURATION);
        helenPowerPendingReveal = true;
        powerupStatus.textContent = 'Helen power 10.0s';
        powerupStatus.hidden = false;
        announce("Helen's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'niall-item') {
        const charged = isEdGiftCharged(item);
        activateNiallSpeed(charged);
        playItemTheme(NIALL_THEME_SOURCE, true, charged ? 20_000 : 10_000);
        announce("Niall's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'katy-item') {
        const now = performance.now();
        activateKatyPower(now);
        playKatyTheme();
        katyItemDescription = `${item.name}: ${item.description}`;
        powerupStatus.textContent = 'Katy effect 10.0s';
        powerupStatus.hidden = false;
        announce("Katy's item activated.");
      } else if (item.id === 'mike-item') {
        playItemTheme(MIKE_THEME_SOURCE);
        announce(`${item.name}: ${item.description}`);
      } else if (item.id === 'maddy-item') {
        activateMaddyTeaPower();
        playItemTheme(MADDY_THEME_SOURCE, true);
        maddyItemDescription = `${item.name}: ${MADDY_TEA_REVEAL}`;
        powerupStatus.textContent = 'Tea time 10.0s';
        powerupStatus.hidden = false;
        announce("Maddy's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'ed-item') {
        activateEdPower();
        playItemTheme(ED_THEME_SOURCE, true);
        edPowerPendingReveal = true;
        powerupStatus.textContent = 'Halstead 10.0s';
        powerupStatus.hidden = false;
        announce("Ed's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'adam-item') {
        activateAdamPower();
        adamPowerPendingReveal = true;
        powerupStatus.textContent = 'Adam power 10.0s';
        powerupStatus.hidden = false;
        announce("Adam's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'sam-item') {
        activateSamPower();
        playItemTheme(SAM_THEME_SOURCE, true, SAM_POWER_DURATION);
        powerupStatus.textContent = 'Sam power 13.0s';
        powerupStatus.hidden = false;
        announce("Sam's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'oscar-item') {
        activateOscarPower();
        playItemTheme(OSCAR_THEME_SOURCE, true, OSCAR_POWER_DURATION);
        oscarPowerPendingReveal = true;
        powerupStatus.textContent = 'Oscar power 10.0s';
        powerupStatus.hidden = false;
        announce("Oscar's item activated.");
        setInventoryOpen(false);
      } else if (item.id === 'lucy-item') {
        playItemTheme(LUCY_THEME_SOURCE);
        triggerGiftPower('world-spinning', 10_000);
        announce(`${item.name}: ${item.description}`);
      } else {
        announce(`${item.name}: ${item.description}`);
      }
      removeGift(item);
    });
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      removeGift(item);
      announce(`${item.name} deleted.`);
    });
    actions.append(useButton, deleteButton);
    card.append(image, text, actions);
    giftItems.append(card);
  });
}

function setInventoryOpen(isOpen: boolean): void {
  const hadFocusInside = inventoryPanel.contains(document.activeElement);
  inventoryPanel.hidden = !isOpen;
  inventoryToggle.setAttribute('aria-expanded', String(isOpen));
  if (!isOpen && hadFocusInside) inventoryToggle.focus();
}

export function setupInventory(): void {
  renderGiftItems();
  setupAdamLeapControl();
  const adamRemaining = adamPowerSecondsLeft();
  if (adamRemaining > 0) {
    adamPowerPendingReveal = true;
  }
  const edRemaining = edPowerSecondsLeft();
  if (edRemaining > 0) {
    edPowerPendingReveal = true;
    playItemTheme(ED_THEME_SOURCE, true, edRemaining * 1000);
  }
  window.addEventListener('max-game:inventory-gift-added', () => {
    renderGiftItems();
    inventoryToggle.classList.remove('inventory-added-wobble');
    void inventoryToggle.offsetWidth;
    inventoryToggle.classList.add('inventory-added-wobble');
    window.setTimeout(() => inventoryToggle.classList.remove('inventory-added-wobble'), 1000);
  });
  window.addEventListener('max-game:inventory-gift-removed', () => {
    renderGiftItems();
  });
  window.addEventListener('max-game:music-unlocked', () => {
    renderGiftItems();
  });

  inventoryToggle.addEventListener('click', () => setInventoryOpen(inventoryPanel.hidden));
  inventoryClose.addEventListener('click', () => setInventoryOpen(false));
  inventoryDeleteAll.addEventListener('click', () => {
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
  updateJoeDamage(now);
  updateJulianPowerUi(now);
  const julianSecondsLeft = julianPowerSecondsLeft(now);
  const katieSecondsLeft = katiePowerSecondsLeft(now);
  const joeSecondsLeft = joePowerSecondsLeft(now);
  const juSecondsLeft = juPowerSecondsLeft(now);
  const katyEffectExpired = updateKatyPower(now);
  const katySecondsLeft = katyPowerSecondsLeft(now);
  const teaSecondsLeft = maddyTeaSecondsLeft(now);
  const edSecondsLeft = edPowerSecondsLeft();
  const niallSecondsLeft = niallSpeedSecondsLeft();
  const adamSecondsLeft = adamPowerSecondsLeft();
  const samSecondsLeft = samPowerSecondsLeft(now);
  const oscarSecondsLeft = oscarPowerSecondsLeft(now);
  const andySecondsLeft = andyPowerSecondsLeft(now);
  const bochraSecondsLeft = bochraPowerSecondsLeft(now);
  const chrisSecondsLeft = chrisPowerSecondsLeft(now);
  const danSecondsLeft = danPowerSecondsLeft(now);
  const georgiaSecondsLeft = georgiaPowerSecondsLeft(now);
  const helenSecondsLeft = helenPowerSecondsLeft(now);
  const expiredDescriptions: string[] = [];
  updateAdamLeapControl();

  if (katyEffectExpired) {
    stopKatyTheme();
    if (katyItemDescription) expiredDescriptions.push(katyItemDescription);
    katyItemDescription = '';
  }
  if (maddyItemDescription && teaSecondsLeft === 0) {
    expiredDescriptions.push(maddyItemDescription);
    maddyItemDescription = '';
  }
  if (edPowerPendingReveal && edSecondsLeft === 0) {
    expiredDescriptions.push(ED_POWER_REVEAL);
    edPowerPendingReveal = false;
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

  if (expiredDescriptions.length > 0) announce(expiredDescriptions.join('\n'));

  if (katieSecondsLeft > 0) {
    const status = `Katie power ${katieSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (julianSecondsLeft > 0) {
    const status = `Julian power ${julianSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (juSecondsLeft > 0) {
    const status = `Ju power ${juSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (joeSecondsLeft > 0) {
    const status = `Joe power ${joeSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (helenSecondsLeft > 0) {
    const status = `Helen power ${helenSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (georgiaSecondsLeft > 0) {
    const status = `Georgia power ${georgiaSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (danSecondsLeft > 0) {
    const status = `Dan power ${danSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (chrisSecondsLeft > 0) {
    const status = `Chris power ${chrisSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (bochraSecondsLeft > 0) {
    const status = `Bochra power ${bochraSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (andySecondsLeft > 0) {
    const status = `Andy power ${andySecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (oscarSecondsLeft > 0) {
    const status = `Oscar power ${oscarSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (samSecondsLeft > 0) {
    const status = `Sam power ${samSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (adamSecondsLeft > 0) {
    const status = `Adam power ${adamSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (edSecondsLeft > 0) {
    const status = `Halstead ${edSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (teaSecondsLeft > 0) {
    const status = `Tea time ${teaSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (katySecondsLeft > 0) {
    const status = `Katy effect ${katySecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (niallSecondsLeft > 0) {
    const status = `Niall speed ${niallSecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else {
    powerupStatus.hidden = true;
  }
}
