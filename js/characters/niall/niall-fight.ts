import { createBattleOpening } from './niall-opening.js';
import { getBattleResult, type BattleOutcome } from './battle-outcome.js';
import { requireElement } from '../../core/elements.js';
import { NIALL_MAX_HP, PLAYER_MAX_HP, NiallBattle } from './niall-battle.js';
import { setNiallQuestState } from '../../core/world-state.js';

const playerHpMeter = requireElement<HTMLMeterElement>('#player-hp');
const niallHpMeter = requireElement<HTMLMeterElement>('#niall-hp');
const playerHpText = requireElement<HTMLElement>('#player-hp-text');
const niallHpText = requireElement<HTMLElement>('#niall-hp-text');
const fomoStatus = requireElement<HTMLElement>('#fomo-status');
const playerBattler = requireElement<HTMLImageElement>('#player-battler');
const niallBattler = requireElement<HTMLImageElement>('#niall-battler');
const battleLog = requireElement<HTMLElement>('#battle-log');
const actionGrid = requireElement<HTMLElement>('#move-grid');
const itemGrid = requireElement<HTMLElement>('#item-grid');
const busLink = requireElement<HTMLAnchorElement>('#bus-link');
const openingGrid = requireElement<HTMLElement>('#opening-grid');
const openingNext = requireElement<HTMLButtonElement>('#opening-next');
const healthItem = requireElement<HTMLButtonElement>('[data-item="capri-sun"]');
const attackButton = requireElement<HTMLButtonElement>('[data-action="attack"]');
const battle = new NiallBattle(1);
const opening = createBattleOpening(appendLog);
let started = false;
type MoveStage = 'player-setup' | 'player-effect' | 'niall-setup' | 'niall-effect' | null;
let moveStage: MoveStage = null;
let pendingPlayerEffectMessage = '';
let pendingPlayerAttack = false;
let victoryFollowUp: ReturnType<typeof getBattleResult> | null = null;
playerHpMeter.max = PLAYER_MAX_HP;
niallHpMeter.max = NIALL_MAX_HP;

function renderBattle(): void {
  playerHpMeter.value = battle.playerHp;
  niallHpMeter.value = battle.niallHp;
  playerHpText.textContent = String(battle.playerHp);
  niallHpText.textContent = String(battle.niallHp);
  fomoStatus.textContent = battle.hasFomo ? 'FOMO' : '';
  fomoStatus.classList.toggle('active', battle.hasFomo);
  playerBattler.classList.toggle('fomo', battle.hasFomo);
  document.querySelectorAll<HTMLButtonElement>('#move-grid button, #item-grid button').forEach((button) => {
    button.disabled = !battle.canAct;
  });
  healthItem.disabled = !battle.canAct || battle.healthItemUsed;
  healthItem.textContent = battle.healthItemUsed ? 'Capri Sun (used)' : 'Capri Sun';
  attackButton.textContent = battle.playerAttackIndex >= 5 ? 'Portuguese hot sauce' : 'Attack';
}

function appendLog(message: string): void {
  battleLog.textContent = message;
}

function finishBattle(outcome: BattleOutcome, moveMessage = ''): void {
  const result = getBattleResult(outcome);
  battle.finish();
  moveStage = null;
  actionGrid.hidden = true;
  itemGrid.hidden = true;
  busLink.textContent = result.linkLabel;
  busLink.href = result.href;
  if (result.niallQuestState) setNiallQuestState(result.niallQuestState);
  if (outcome === 'victory') {
    victoryFollowUp = result;
    busLink.hidden = true;
    openingNext.textContent = 'Next >';
    openingGrid.hidden = false;
    appendLog(moveMessage || 'YOU WIN!');
  } else {
    openingGrid.hidden = true;
    busLink.hidden = false;
    appendLog(`${moveMessage}${moveMessage ? ' ' : ''}${result.message}`);
  }
  renderBattle();
}

function checkOutcome(message = ''): boolean {
  if (battle.playerHp <= 0) {
    finishBattle('defeat', message);
    return true;
  }
  if (battle.niallHp <= 0) {
    finishBattle('victory', message);
    return true;
  }
  return false;
}

function animateDamage(selector: string, amount: number): void {
  if (!amount) return;
  const indicator = requireElement<HTMLElement>(selector);
  indicator.textContent = `-${amount}`;
  indicator.hidden = false;
  indicator.classList.remove('fly-away');
  void indicator.offsetWidth;
  indicator.classList.add('fly-away');
}

function clearDamageAnimations(): void {
  document.querySelectorAll<HTMLElement>('.battle-damage').forEach((indicator) => {
    indicator.hidden = true;
    indicator.classList.remove('fly-away');
  });
}

function showPlayerOptions(): void {
  moveStage = null;
  openingGrid.hidden = true;
  actionGrid.hidden = false;
  appendLog('What will PLAYER do?');
  renderBattle();
}

function takePlayerTurn(attack: boolean, setupMessage?: string, effectMessage?: string): void {
  const move = battle.takePlayerTurn(attack);
  if (!move) return;
  clearDamageAnimations();
  appendLog(setupMessage ?? (attack ? move.message : 'PLAYER waits.'));
  pendingPlayerEffectMessage = effectMessage ?? (attack ? move.effectMessage : 'No damage dealt.');
  pendingPlayerAttack = attack;
  renderBattle();
  moveStage = 'player-setup';
  actionGrid.hidden = true;
  itemGrid.hidden = true;
  openingGrid.hidden = false;
}

function advanceTurn(): void {
  if (victoryFollowUp) {
    appendLog(victoryFollowUp.message);
    openingGrid.hidden = true;
    busLink.hidden = false;
    victoryFollowUp = null;
    return;
  }
  if (battle.battleOver) return;
  if (!started) {
    started = true;
    if (!checkOutcome()) opening.advanceOpeningSequence();
    return;
  }
  if (moveStage === 'player-setup') {
    const previousNiallHp = battle.niallHp;
    const move = battle.resolvePlayerTurn();
    if (!move) return;
    animateDamage('#niall-opening-damage', pendingPlayerAttack ? previousNiallHp - battle.niallHp : 0);
    renderBattle();
    moveStage = 'player-effect';
    const effect = battle.niallHp === 0 && move.victoryMessage
      ? move.victoryMessage
      : pendingPlayerEffectMessage;
    appendLog(effect);
    checkOutcome(effect);
    return;
  }
  if (moveStage === 'player-effect') {
    if (battle.waitingForNiall) {
      const move = battle.takeNiallTurn();
      if (!move) return;
      clearDamageAnimations();
      appendLog(move.message);
      moveStage = 'niall-setup';
    } else {
      showPlayerOptions();
    }
    return;
  }
  if (moveStage === 'niall-setup') {
    const move = battle.resolveNiallTurn();
    if (!move) return;
    if (move.selfDamage) niallBattler.classList.add('poisoned');
    animateDamage('#player-opening-damage', move.damage);
    animateDamage('#niall-opening-damage', move.selfDamage ?? 0);
    renderBattle();
    moveStage = 'niall-effect';
    const effect = move.passOut
      ? battle.playerHp <= 0 ? move.effectMessage : 'You stay on your feet.'
      : move.effectMessage;
    appendLog(effect);
    checkOutcome(effect);
    return;
  }
  if (moveStage === 'niall-effect') {
    showPlayerOptions();
    return;
  }
  showPlayerOptions();
}

function useItem(item: string): void {
  if (!battle.canAct) return;
  if (item === 'capri-sun') {
    if (battle.healthItemUsed) return;
    if (battle.playerHp === PLAYER_MAX_HP) {
      appendLog('PLAYER already has full HP. Save CAPRI SUN for later.');
      return;
    }
    const healed = battle.useHealthItem();
    itemGrid.hidden = true;
    actionGrid.hidden = false;
    appendLog(`PLAYER used CAPRI SUN and recovered ${healed} HP.`);
    renderBattle();
  } else if (item === 'vape' || item === 'pocket-lint') {
    takePlayerTurn(false,
      item === 'vape' ? 'PLAYER used VAPE.' : 'PLAYER used POCKET LINT.',
      item === 'vape' ? 'NIALL took it and appreciated it.' : 'NIALL looked at it and shrugged.');
  }
}

function run(): void {
  if (!battle.canAct) return;
  actionGrid.hidden = true;
  appendLog('You tried to run away...');
  // Lock the battle while the escape animation is playing.
  battle.waitingForNiall = true;
  renderBattle();
  window.setTimeout(() => finishBattle('escape'), 3000);
}

function handleAction(action: string | undefined): void {
  if (!battle.canAct || actionGrid.hidden) return;
  if (action === 'attack') takePlayerTurn(true);
  else if (action === 'wait') takePlayerTurn(false);
  else if (action === 'run') run();
  else if (action === 'items') {
    actionGrid.hidden = true;
    itemGrid.hidden = false;
    appendLog('Choose an item.');
  }
}
actionGrid.addEventListener('click', (event) => {
  handleAction((event.target as HTMLElement).closest<HTMLButtonElement>('[data-action]')?.dataset.action);
});
itemGrid.addEventListener('click', (event) => {
  if (!battle.canAct || itemGrid.hidden) return;
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-action], [data-item]');
  if (!button) return;
  if (button.dataset.action === 'back') {
    itemGrid.hidden = true;
    actionGrid.hidden = false;
    appendLog('What will PLAYER do?');
  } else if (button.dataset.item) useItem(button.dataset.item);
});
openingNext.addEventListener('click', advanceTurn);
renderBattle();
opening.playOpeningSequence();
