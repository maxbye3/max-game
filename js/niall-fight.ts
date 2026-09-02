import { getBattleResult, type BattleOutcome } from './battle-outcome.js';
import { requireElement } from './elements.js';
import {
  chooseNiallAttack,
  NiallBattle,
} from './niall-battle.js';
import { setNiallQuestState } from './world-state.js';

const playerHpMeter = requireElement<HTMLMeterElement>('#player-hp');
const niallHpMeter = requireElement<HTMLMeterElement>('#niall-hp');
const playerHpText = requireElement<HTMLElement>('#player-hp-text');
const fomoStatus = requireElement<HTMLElement>('#fomo-status');
const battleLog = requireElement<HTMLElement>('#battle-log');
const actionGrid = requireElement<HTMLElement>('#move-grid');
const itemGrid = requireElement<HTMLElement>('#item-grid');
const busLink = requireElement<HTMLAnchorElement>('#bus-link');
const battleDice = requireElement<HTMLElement>('#battle-dice');

const battle = new NiallBattle();
let runInterval: number | null = null;

function setControlsDisabled(disabled: boolean): void {
  document.querySelectorAll<HTMLButtonElement>('.move-grid button').forEach((button) => {
    button.disabled = disabled;
  });
}

function renderBattle(): void {
  playerHpMeter.value = battle.playerHp;
  niallHpMeter.value = battle.niallHp;
  playerHpText.textContent = String(battle.playerHp);
  fomoStatus.textContent = `FOMO: ${battle.fomoStacks}`;
  fomoStatus.classList.toggle('active', battle.fomoStacks > 0);
  setControlsDisabled(!battle.canAct);
}

function appendLog(message: string): void {
  battleLog.textContent = message;
}

function finishBattle(outcome: BattleOutcome): void {
  const result = getBattleResult(outcome);
  battle.finish();
  actionGrid.hidden = true;
  itemGrid.hidden = true;
  busLink.textContent = result.linkLabel;
  busLink.href = result.href;
  busLink.hidden = false;
  if (result.niallQuestState) setNiallQuestState(result.niallQuestState);
  appendLog(result.message);
  renderBattle();
}

function applyFomoDamage(): boolean {
  if (battle.fomoStacks === 0) return false;
  const amount = battle.applyFomoDamage();
  appendLog(`FOMO hurt PLAYER for ${amount} damage.`);
  renderBattle();
  if (battle.playerHp <= 0) {
    finishBattle('defeat');
    return true;
  }
  return false;
}

function niallTurn(): void {
  if (battle.battleOver) return;
  const attack = chooseNiallAttack();
  const result = battle.applyNiallAttack(attack);
  appendLog(result.defended
    ? `${attack.message} PLAYER defended. Damage was halved.`
    : attack.message);
  renderBattle();
  if (battle.playerHp <= 0) {
    finishBattle('defeat');
    return;
  }
  window.setTimeout(() => {
    if (!battle.battleOver) applyFomoDamage();
  }, 850);
}

function queueNiallTurn(): void {
  if (battle.battleOver) return;
  battle.queueNiallTurn();
  renderBattle();
  window.setTimeout(niallTurn, 850);
}

function attack(): void {
  if (!battle.canAct) return;
  battleDice.hidden = false;
  battleDice.classList.remove('shake');
  void battleDice.offsetWidth;
  battleDice.classList.add('shake');
  battleDice.textContent = '?';
  setControlsDisabled(true);

  window.setTimeout(() => {
    const amount = Math.floor(Math.random() * 61);
    battleDice.textContent = String(amount);
    battle.damageNiall(amount);
    appendLog(`PLAYER rolled ${amount}. NIALL took ${amount} damage.`);
    renderBattle();
    if (battle.niallHp <= 0) {
      finishBattle('victory');
      return;
    }
    queueNiallTurn();
  }, 650);
}

function run(): void {
  if (!battle.canAct) return;
  battle.queueNiallTurn();
  let dots = 1;
  appendLog('You tried to runaway and you were.');
  renderBattle();
  runInterval = window.setInterval(() => {
    dots = dots === 3 ? 1 : dots + 1;
    appendLog(`You tried to runaway and you were${'.'.repeat(dots)}`);
  }, 500);

  window.setTimeout(() => {
    if (runInterval !== null) window.clearInterval(runInterval);
    runInterval = null;
    finishBattle('escape');
  }, 3000);
}

function showItems(): void {
  if (!battle.canAct) return;
  actionGrid.hidden = true;
  itemGrid.hidden = false;
  appendLog('Choose an item.');
}

function showActions(): void {
  if (!battle.canAct) return;
  itemGrid.hidden = true;
  actionGrid.hidden = false;
  appendLog('What will PLAYER do?');
}

function defend(): void {
  if (!battle.canAct) return;
  battle.defend();
  appendLog('PLAYER curled into fetal position.');
  renderBattle();
  window.setTimeout(niallTurn, 850);
}

function useItem(item: string): void {
  if (!battle.canAct) return;
  itemGrid.hidden = true;
  actionGrid.hidden = false;

  if (item === 'vape') {
    appendLog('PLAYER used VAPE. NIALL took it and appreciated it.');
    queueNiallTurn();
    return;
  }
  if (item === 'capri-sun') {
    battle.healPlayer(50);
    appendLog('PLAYER used CAPRI SUN. PLAYER recovered 50 HP.');
    queueNiallTurn();
    return;
  }
  if (item === 'pocket-lint') {
    appendLog('PLAYER used POCKET LINT. NIALL looked at it and shrugged.');
    queueNiallTurn();
    return;
  }
  if (item === 'gun') {
    battle.damageNiall(50);
    appendLog('PLAYER used GUN. NIALL took 50 damage. It was super effective.');
    renderBattle();
    if (battle.niallHp <= 0) {
      finishBattle('victory');
      return;
    }
    queueNiallTurn();
  }
}

actionGrid.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'attack') attack();
  else if (action === 'run') run();
  else if (action === 'items') showItems();
  else if (action === 'defend') defend();
});

itemGrid.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-action], [data-item]');
  if (!button) return;
  if (button.dataset.action === 'back') {
    showActions();
    return;
  }
  const item = button.dataset.item;
  if (item) useItem(item);
});

renderBattle();
