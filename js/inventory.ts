import { APOCALYPSE_DURATION, BOOST_DURATION, BOOST_MULTIPLIER, RECHARGE_DURATION } from './config.js';
import { requireElement } from './dom.js';
import { getCollectedGifts } from './inventory-gifts.js';
import { removeGift } from './inventory-gifts.js';
import {
  activateKatyPower,
  katyPowerSecondsLeft,
  KATY_POWER_DURATION,
  updateKatyPower,
} from './katy-power.js';
import { readStorage, writeStorage } from './storage.js';
import { resolveSiteAsset } from './site-assets.js';
import { getSongArtwork, getUnlockedSongs } from './music-library.js';

const gameShell = requireElement<HTMLElement>('.game-shell');
const METEOR_COUNT = 14;
const ITEM_THEME_DURATION = 10_000;
const KATY_THEME_SOURCE = 'chat/katy/theme.m4a';
const MIKE_THEME_SOURCE = 'chat/mike/player/theme.mp3';
const LUCY_THEME_SOURCE = 'chat/lucy/player/theme.mp3';
const JULIAN_THEME_SOURCE = 'chat/julian/theme.mp3';
const TIM_THEME_SOURCE = 'chat/tim/theme.mp3';

const inventoryToggle = requireElement<HTMLButtonElement>('#inventory-toggle');
const inventoryPanel = requireElement<HTMLElement>('#inventory-panel');
const inventoryClose = requireElement<HTMLButtonElement>('#inventory-close');
const inventoryItem = requireElement<HTMLButtonElement>('#inventory-item');
const deleteItemButton = requireElement<HTMLButtonElement>('#delete-item');
const itemActions = requireElement<HTMLElement>('#item-actions');
const useItemButton = requireElement<HTMLButtonElement>('#use-item');
const inventoryMessage = requireElement<HTMLElement>('#inventory-message');
const inventoryCount = requireElement<HTMLElement>('.inventory-count');
const powerupStatus = requireElement<HTMLElement>('#powerup-status');
const itemStatus = requireElement<HTMLElement>('#item-status');
const readyBadge = requireElement<HTMLElement>('#ready-badge');
const rechargeFill = requireElement<HTMLElement>('#recharge-fill');
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

function triggerApocalypse(onExpired?: () => void): void {
  const overlay = document.createElement('div');
  overlay.className = 'apocalypse-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < METEOR_COUNT; index += 1) {
    const meteor = document.createElement('span');
    meteor.className = 'apocalypse-meteor';
    meteor.style.setProperty('--meteor-x', `${Math.round(Math.random() * 100)}%`);
    meteor.style.setProperty('--meteor-delay', `${(Math.random() * 1.6).toFixed(2)}s`);
    overlay.append(meteor);
  }
  gameShell.append(overlay);
  gameShell.classList.add('apocalypse-shake');
  window.setTimeout(() => {
    overlay.remove();
    gameShell.classList.remove('apocalypse-shake');
    onExpired?.();
  }, APOCALYPSE_DURATION);

  playApocalypseRumble();
}

function triggerGiftPower(className: 'world-opening' | 'face-implosion' | 'world-spinning', duration: number): void {
  gameShell.classList.remove(className);
  void gameShell.offsetWidth;
  gameShell.classList.add(className);
  window.setTimeout(() => gameShell.classList.remove(className), duration);
}

function playItemTheme(source: string): void {
  itemTheme?.pause();
  itemTheme = new Audio(resolveSiteAsset(source));
  itemTheme.preload = 'auto';
  void itemTheme.play().catch(() => {
    // Browsers may reject audio outside a user gesture.
  });
  window.setTimeout(() => {
    itemTheme?.pause();
    if (itemTheme) itemTheme.currentTime = 0;
    itemTheme = null;
  }, ITEM_THEME_DURATION);
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
  katyTheme = new Audio(resolveSiteAsset(KATY_THEME_SOURCE));
  katyTheme.preload = 'auto';
  katyTheme.loop = true;
  void katyTheme.play().catch(() => {
    // Browsers may reject audio outside a user gesture.
  });
  katyThemeTimeout = window.setTimeout(stopKatyTheme, KATY_POWER_DURATION);
}

let speedMultiplier = 1;
let speedBoostEndsAt = 0;
let hasPowerSandwich = true;
let sandwichDeleted = readStorage('max-game:power-sandwich-deleted') === 'true';
let itemRechargesAt = 0;
let itemTheme: HTMLAudioElement | null = null;
let katyTheme: HTMLAudioElement | null = null;
let katyThemeTimeout = 0;
let katyItemDescription = '';

export const getSpeedMultiplier = () => speedMultiplier;

function setItemReady(isReady: boolean): void {
  hasPowerSandwich = isReady;
  inventoryCount.textContent = String((isReady ? 1 : 0) + getCollectedGifts().length + getUnlockedSongs().length);
  inventoryItem.disabled = !isReady;
  inventoryItem.classList.toggle('item-ready', isReady);
  readyBadge.hidden = !isReady;
  rechargeFill.style.width = isReady ? '100%' : '0%';
  itemStatus.textContent = sandwichDeleted ? 'Deleted' : isReady ? 'Ready to use' : 'Recharging';
  deleteItemButton.disabled = sandwichDeleted;
}

function renderGiftItems(): void {
  giftItems.replaceChildren();
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
        triggerGiftPower('face-implosion', 1_100);
        announce(`${item.name}: ${item.description}`);
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
  getUnlockedSongs().forEach((song) => {
    const card = document.createElement('div');
    card.className = 'inventory-gift';
    const image = document.createElement('img');
    image.src = resolveSiteAsset(getSongArtwork(song));
    image.alt = `${song} song artwork`;
    const text = document.createElement('span');
    text.className = 'item-text';
    const name = document.createElement('strong');
    name.textContent = song;
    text.append(name);
    card.append(image, text);
    giftItems.append(card);
  });
}

function setItemActionsOpen(isOpen: boolean): void {
  itemActions.hidden = !isOpen;
  inventoryItem.classList.toggle('selected', isOpen);
  inventoryItem.setAttribute('aria-expanded', String(isOpen));
}

function setInventoryOpen(isOpen: boolean): void {
  const hadFocusInside = inventoryPanel.contains(document.activeElement);
  inventoryPanel.hidden = !isOpen;
  inventoryToggle.setAttribute('aria-expanded', String(isOpen));
  if (!isOpen && hadFocusInside) inventoryToggle.focus();
}

export function setupInventory(): void {
  renderGiftItems();
  setItemReady(!sandwichDeleted);
  setItemActionsOpen(false);
  window.addEventListener('max-game:inventory-gift-added', () => {
    renderGiftItems();
    setItemReady(hasPowerSandwich);
    inventoryToggle.classList.remove('inventory-added-wobble');
    void inventoryToggle.offsetWidth;
    inventoryToggle.classList.add('inventory-added-wobble');
    window.setTimeout(() => inventoryToggle.classList.remove('inventory-added-wobble'), 1000);
  });
  window.addEventListener('max-game:inventory-gift-removed', () => {
    renderGiftItems();
    setItemReady(hasPowerSandwich);
  });
  window.addEventListener('max-game:music-unlocked', () => {
    renderGiftItems();
    setItemReady(hasPowerSandwich);
  });

  inventoryToggle.addEventListener('click', () => setInventoryOpen(inventoryPanel.hidden));
  inventoryClose.addEventListener('click', () => setInventoryOpen(false));
  inventoryItem.addEventListener('click', () => {
    if (!hasPowerSandwich) return;
    setItemActionsOpen(itemActions.hidden);
  });
  deleteItemButton.addEventListener('click', () => {
    if (sandwichDeleted) return;
    sandwichDeleted = true;
    writeStorage('max-game:power-sandwich-deleted', 'true');
    itemRechargesAt = 0;
    setItemReady(false);
    setItemActionsOpen(false);
    announce('Power Sandwich deleted.');
  });

  useItemButton.addEventListener('click', () => {
    if (!hasPowerSandwich) return;
    const now = performance.now();
    speedMultiplier = BOOST_MULTIPLIER;
    speedBoostEndsAt = now + BOOST_DURATION;
    itemRechargesAt = now + RECHARGE_DURATION;
    setItemReady(false);
    setItemActionsOpen(false);
    inventoryClose.focus();
    announce('Power Sandwich used - speed increased for 10 seconds!');
    powerupStatus.hidden = false;
  });

  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === 'i') setInventoryOpen(inventoryPanel.hidden);
    else if (key === 'Escape') setInventoryOpen(false);
  });
}

export function updatePowerups(now: number): void {
  // The boost always ends before the recharge does, so it is resolved first:
  // when a backgrounded tab collapses both into one frame, the newer event wins.
  if (speedBoostEndsAt > 0) {
    const secondsLeft = Math.max(0, (speedBoostEndsAt - now) / 1000);
    const status = `Speed boost ${secondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;

    if (secondsLeft === 0) {
      speedMultiplier = 1;
      speedBoostEndsAt = 0;
      powerupStatus.hidden = true;
      announce('The speed boost has worn off.');
    }
  }

  if (!hasPowerSandwich && itemRechargesAt > 0) {
    const rechargeRemaining = Math.max(0, itemRechargesAt - now);
    const status = `Recharging ${(rechargeRemaining / 1000).toFixed(1)}s`;
    if (itemStatus.textContent !== status) {
      itemStatus.textContent = status;
      rechargeFill.style.width = `${(1 - rechargeRemaining / RECHARGE_DURATION) * 100}%`;
    }

    if (rechargeRemaining === 0) {
      itemRechargesAt = 0;
      setItemReady(true);
      announce('The Power Sandwich is ready to use again!');
    }
  }

  const katyEffectExpired = updateKatyPower(now);
  const katySecondsLeft = katyPowerSecondsLeft(now);
  if (katySecondsLeft > 0) {
    const status = `Katy effect ${katySecondsLeft.toFixed(1)}s`;
    if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
    powerupStatus.hidden = false;
  } else if (katyEffectExpired) {
    stopKatyTheme();
    if (speedBoostEndsAt === 0) powerupStatus.hidden = true;
    if (katyItemDescription) announce(katyItemDescription);
    katyItemDescription = '';
  }
}
