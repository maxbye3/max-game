import { markNiallFightComplete } from './world-state.js';

type BattleSide = 'player' | 'niall';

interface Move {
  readonly label: string;
  readonly damage: number;
  readonly message: string;
}

interface NiallAttack {
  readonly label: string;
  readonly damage: number;
  readonly fomo?: boolean;
  readonly message: string;
}

const playerMoves: Record<string, Move> = {
  splash: {
    label: 'Splash',
    damage: 0,
    message: 'MAX used SPLASH. Nothing happened.',
  },
  lecture: {
    label: 'Lecture',
    damage: 20,
    message: 'MAX used LECTURE. It was super effective.',
  },
  calm: {
    label: 'Tell him to calm down',
    damage: 20,
    message: 'MAX told NIALL to calm down.',
  },
  chelsea: {
    label: 'Chelsea',
    damage: 20,
    message: 'MAX used CHELSEA.',
  },
  reprimand: {
    label: 'Reprimand',
    damage: 20,
    message: 'MAX used REPRIMAND.',
  },
};

const niallAttacks: readonly NiallAttack[] = [
  {
    label: 'Headbutt',
    damage: 10,
    message: 'NIALL used HEADBUTT.',
  },
  {
    label: 'Opens a red stripe',
    damage: 0,
    message: 'NIALL opened a RED STRIPE. It did nothing.',
  },
  {
    label: 'Sets up a game of Smash',
    damage: 0,
    fomo: true,
    message: 'NIALL set up a game of SMASH. MAX got FOMO.',
  },
  {
    label: 'Posts a food pic on WhatsApp',
    damage: 10,
    message: 'NIALL posted a food pic on WhatsApp.',
  },
  {
    label: 'Tallulah attacks',
    damage: 10,
    message: 'TALLULAH attacked.',
  },
  {
    label: 'Stays at your house for two weeks',
    damage: 20,
    message: 'NIALL stayed at your house for two weeks.',
  },
];

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing Niall fight UI: ${selector}`);
  return element;
}

const playerHpMeter = requireElement<HTMLMeterElement>('#player-hp');
const niallHpMeter = requireElement<HTMLMeterElement>('#niall-hp');
const playerHpText = requireElement<HTMLElement>('#player-hp-text');
const fomoStatus = requireElement<HTMLElement>('#fomo-status');
const battleLog = requireElement<HTMLElement>('#battle-log');
const moveGrid = requireElement<HTMLElement>('#move-grid');
const busLink = requireElement<HTMLAnchorElement>('#bus-link');

let playerHp = 100;
let niallHp = 100;
let fomoStacks = 0;
let battleOver = false;
let waitingForNiall = false;

function clampHp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function renderBattle(): void {
  playerHpMeter.value = playerHp;
  niallHpMeter.value = niallHp;
  playerHpText.textContent = String(playerHp);
  fomoStatus.textContent = `FOMO: ${fomoStacks}`;
  fomoStatus.classList.toggle('active', fomoStacks > 0);
  moveGrid.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    button.disabled = battleOver || waitingForNiall;
  });
}

function appendLog(message: string): void {
  battleLog.textContent = message;
}

function damage(side: BattleSide, amount: number): void {
  if (side === 'player') playerHp = clampHp(playerHp - amount);
  else niallHp = clampHp(niallHp - amount);
}

function finishBattle(winner: BattleSide): void {
  battleOver = true;
  waitingForNiall = false;
  markNiallFightComplete();
  moveGrid.hidden = true;
  busLink.hidden = false;
  appendLog(
    winner === 'player'
      ? 'NIALL fainted. NIALL offered to walk you to the bus.'
      : 'MAX fainted. NIALL offered to walk you to the bus.',
  );
}

function applyFomoDamage(): boolean {
  if (fomoStacks === 0) return false;
  const amount = fomoStacks * 10;
  damage('player', amount);
  appendLog(`FOMO hurt MAX for ${amount} damage.`);
  renderBattle();
  if (playerHp <= 0) {
    finishBattle('niall');
    return true;
  }
  return false;
}

function chooseNiallAttack(): NiallAttack {
  const index = Math.floor(Math.random() * niallAttacks.length);
  return niallAttacks[index] ?? niallAttacks[0]!;
}

function niallTurn(): void {
  if (battleOver) return;
  waitingForNiall = false;
  const attack = chooseNiallAttack();
  if (attack.fomo) fomoStacks = Math.min(2, fomoStacks + 1);
  damage('player', attack.damage);
  appendLog(attack.message);
  renderBattle();
  if (playerHp <= 0) {
    finishBattle('niall');
    return;
  }
  window.setTimeout(() => {
    if (!battleOver) applyFomoDamage();
  }, 850);
}

function useMove(move: Move): void {
  if (battleOver || waitingForNiall) return;
  waitingForNiall = true;
  damage('niall', move.damage);
  appendLog(move.message);
  renderBattle();
  if (niallHp <= 0) {
    finishBattle('player');
    return;
  }
  renderBattle();
  window.setTimeout(niallTurn, 850);
}

moveGrid.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-move]');
  if (!button) return;
  const move = playerMoves[button.dataset.move ?? ''];
  if (move) useMove(move);
});

renderBattle();
