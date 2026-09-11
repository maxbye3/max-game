import { BOOST_DURATION, BOOST_MULTIPLIER, RECHARGE_DURATION } from './config.js';
import { requireElement } from './dom.js';
import { getCollectedGifts } from './inventory-gifts.js';
import { removeGift } from './inventory-gifts.js';
import { readStorage, writeStorage } from './storage.js';

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

let speedMultiplier = 1;
let speedBoostEndsAt = 0;
let hasPowerSandwich = true;
let sandwichDeleted = readStorage('max-game:power-sandwich-deleted') === 'true';
let itemRechargesAt = 0;

export const getSpeedMultiplier = () => speedMultiplier;

function setItemReady(isReady: boolean): void {
  hasPowerSandwich = isReady;
  inventoryCount.textContent = String((isReady ? 1 : 0) + getCollectedGifts().length);
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
    image.src = item.imageSource;
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
      announce(`${item.name}: ${item.description}`);
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
}
