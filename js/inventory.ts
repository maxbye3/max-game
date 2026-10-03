import { APOCALYPSE_DURATION } from './config.js';
import { createGameAudio, isAudioMuted } from './audio-mute.js';
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

const gameShell = requireElement<HTMLElement>('.game-shell');
const METEOR_COUNT = 14;
const ITEM_THEME_DURATION = 10_000;
const KATY_THEME_SOURCE = 'chat/katy/theme.m4a';
const MIKE_THEME_SOURCE = 'chat/mike/player/theme.mp3';
const LUCY_THEME_SOURCE = 'chat/lucy/player/theme.mp3';
const JULIAN_THEME_SOURCE = 'chat/julian/theme.mp3';
const TIM_THEME_SOURCE = 'chat/tim/theme.mp3';
const MADDY_THEME_SOURCE = 'chat/maddy/theme.mp3';
const ED_THEME_SOURCE = 'chat/ed/theme.mp3';
const HELEN_THEME_SOURCE = 'chat/helen/player/theme.mp3';
const NIALL_THEME_SOURCE = 'chat/niall/player/theme.mp3';
const SAM_THEME_SOURCE = 'chat/sam/theme.mp3';

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

function playApocalypseRumble(): void {
  if (isAudioMuted()) return;
  const AudioContextClass = window.AudioContext;
  const audioContext = new AudioContextClass();
  const rumble = audioContext.createOscillator();
  const rumbleGain = audioContext.createGain();
  const noise = audioContext.createBufferSource();
  const noiseFilter = audioContext.createBiquadFilter();
  const noiseGain = audioContext.createGain();
  const duration = 2.4;
  const noiseBuffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
  const noiseSamples = noiseBuffer.getChannelData(0);

  for (let index = 0; index < noiseSamples.length; index += 1) {
    const fade = 1 - index / noiseSamples.length;
    noiseSamples[index] = (Math.random() * 2 - 1) * fade;
  }

  rumble.type = 'sawtooth';
  rumble.frequency.setValueAtTime(55, audioContext.currentTime);
  rumble.frequency.exponentialRampToValueAtTime(28, audioContext.currentTime + duration);
  rumbleGain.gain.setValueAtTime(0.18, audioContext.currentTime);
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

  noise.buffer = noiseBuffer;
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 320;
  noiseGain.gain.setValueAtTime(0.16, audioContext.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

  rumble.connect(rumbleGain);
  rumbleGain.connect(audioContext.destination);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioContext.destination);
  rumble.start();
  noise.start();
  rumble.stop(audioContext.currentTime + duration);
  noise.stop(audioContext.currentTime + duration);
  rumble.addEventListener('ended', () => void audioContext.close(), { once: true });
}

function triggerApocalypse(onExpired?: () => void, charged = false): void {
  const overlay = document.createElement('div');
  overlay.className = 'apocalypse-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < METEOR_COUNT * (charged ? 2 : 1); index += 1) {
    const meteor = document.createElement('span');
    meteor.className = 'apocalypse-meteor';
    meteor.style.setProperty('--meteor-x', `${Math.round(Math.random() * 100)}%`);
    meteor.style.setProperty('--meteor-delay', `${(Math.random() * 1.6).toFixed(2)}s`);
    overlay.append(meteor);
  }
  gameShell.append(overlay);
  const duration = APOCALYPSE_DURATION * (charged ? 2 : 1);
  overlay.style.animationDuration = `${duration}ms`;
  gameShell.classList.add('apocalypse-shake');
  window.setTimeout(() => {
    overlay.remove();
    gameShell.classList.remove('apocalypse-shake');
    onExpired?.();
  }, duration);

  playApocalypseRumble();
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
      if (item.id === 'alex-s-item') {
        playItemTheme('chat/alex s/theme.mp3');
        triggerApocalypse(() => announce(`${item.name}: ${item.description}`));
      } else if (item.id === 'julian-item') {
        playItemTheme(JULIAN_THEME_SOURCE);
        triggerGiftPower('world-opening', 2_400);
        announce(`${item.name}: ${item.description}`);
      } else if (item.id === 'tim-item') {
        playItemTheme(TIM_THEME_SOURCE);
        triggerGiftPower('face-implosion', isEdGiftCharged(item) ? 2_200 : 1_100, isEdGiftCharged(item));
        announce(`${item.name}: ${item.description}`);
      } else if (item.id === 'helen-item') {
        playItemTheme(HELEN_THEME_SOURCE, true);
        triggerApocalypse(() => announce(`${item.name}: ${item.description}`), isEdGiftCharged(item));
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

export function updatePowerups(now: number): void {
  const katyEffectExpired = updateKatyPower(now);
  const katySecondsLeft = katyPowerSecondsLeft(now);
  const teaSecondsLeft = maddyTeaSecondsLeft(now);
  const edSecondsLeft = edPowerSecondsLeft();
  const niallSecondsLeft = niallSpeedSecondsLeft();
  const adamSecondsLeft = adamPowerSecondsLeft();
  const samSecondsLeft = samPowerSecondsLeft(now);
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

  if (expiredDescriptions.length > 0) announce(expiredDescriptions.join('\n'));

  if (samSecondsLeft > 0) {
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
