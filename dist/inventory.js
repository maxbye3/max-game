import { BOOST_DURATION, BOOST_MULTIPLIER, RECHARGE_DURATION } from './config.js';
import { requireElement } from './dom.js';
const inventoryToggle = requireElement('#inventory-toggle');
const inventoryPanel = requireElement('#inventory-panel');
const inventoryClose = requireElement('#inventory-close');
const inventoryItem = requireElement('#inventory-item');
const itemActions = requireElement('#item-actions');
const useItemButton = requireElement('#use-item');
const inventoryMessage = requireElement('#inventory-message');
const inventoryCount = requireElement('.inventory-count');
const powerupStatus = requireElement('#powerup-status');
const itemStatus = requireElement('#item-status');
const readyBadge = requireElement('#ready-badge');
const rechargeFill = requireElement('#recharge-fill');
const announcer = requireElement('#announcer');
/**
 * The visible copy sits inside the inventory panel, which is hidden most of the
 * time - a live region in a hidden subtree is never announced - so every message
 * is mirrored into an always-rendered one.
 */
function announce(message) {
    inventoryMessage.textContent = message;
    announcer.textContent = message;
}
let speedMultiplier = 1;
let speedBoostEndsAt = 0;
let hasPowerSandwich = true;
let itemRechargesAt = 0;
export const getSpeedMultiplier = () => speedMultiplier;
function setItemReady(isReady) {
    hasPowerSandwich = isReady;
    inventoryCount.textContent = isReady ? '1' : '0';
    inventoryItem.disabled = !isReady;
    inventoryItem.classList.toggle('item-ready', isReady);
    readyBadge.hidden = !isReady;
    rechargeFill.style.width = isReady ? '100%' : '0%';
    itemStatus.textContent = isReady ? 'Ready to use' : 'Recharging';
}
function setItemActionsOpen(isOpen) {
    itemActions.hidden = !isOpen;
    inventoryItem.classList.toggle('selected', isOpen);
    inventoryItem.setAttribute('aria-expanded', String(isOpen));
}
function setInventoryOpen(isOpen) {
    const hadFocusInside = inventoryPanel.contains(document.activeElement);
    inventoryPanel.hidden = !isOpen;
    inventoryToggle.setAttribute('aria-expanded', String(isOpen));
    if (!isOpen && hadFocusInside)
        inventoryToggle.focus();
}
export function setupInventory() {
    setItemReady(true);
    setItemActionsOpen(false);
    inventoryToggle.addEventListener('click', () => setInventoryOpen(inventoryPanel.hidden));
    inventoryClose.addEventListener('click', () => setInventoryOpen(false));
    inventoryItem.addEventListener('click', () => {
        if (!hasPowerSandwich)
            return;
        setItemActionsOpen(itemActions.hidden);
    });
    useItemButton.addEventListener('click', () => {
        if (!hasPowerSandwich)
            return;
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
        if (event.ctrlKey || event.metaKey || event.altKey || event.repeat)
            return;
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        if (key === 'i')
            setInventoryOpen(inventoryPanel.hidden);
        else if (key === 'Escape')
            setInventoryOpen(false);
    });
}
export function updatePowerups(now) {
    // The boost always ends before the recharge does, so it is resolved first:
    // when a backgrounded tab collapses both into one frame, the newer event wins.
    if (speedBoostEndsAt > 0) {
        const secondsLeft = Math.max(0, (speedBoostEndsAt - now) / 1000);
        const status = `Speed boost ${secondsLeft.toFixed(1)}s`;
        if (powerupStatus.textContent !== status)
            powerupStatus.textContent = status;
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
//# sourceMappingURL=inventory.js.map