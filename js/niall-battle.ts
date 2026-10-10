export interface NiallAttack {
  readonly damage: number;
  readonly selfDamage?: number;
  readonly fomo?: boolean;
  readonly knockout?: boolean;
  readonly message: string;
}

export interface PlayerAttack {
  readonly damage: number;
  readonly knockout?: boolean;
  readonly enemyTurns: number;
  readonly message: string;
}

export const PLAYER_MAX_HP = 80;
export const NIALL_MAX_HP = 70;
export const HEALTH_ITEM_HP = 50;

// Eight hits defeat an unhealed player just before Red Stripe removes Niall's
// last 10 HP. The extra responses spread all Niall's moves across five attacks.
export const PLAYER_ATTACKS: readonly PlayerAttack[] = [
  { damage: 10, enemyTurns: 1, message: 'You tell Niall your slightly fringe thoughts on North Korea after watching Godzilla. Niall is enraged! NIALL loses 10 HP.' },
  { damage: 10, enemyTurns: 2, message: 'You tell Niall he cannot borrow your phone charger. Niall begins to pace anxiously. NIALL loses 10 HP.' },
  { damage: 20, enemyTurns: 2, message: 'You tell Niall his pumpkin pie was too dry. Niall begins smoking furiously. NIALL loses 20 HP.' },
  { damage: 10, enemyTurns: 1, message: 'You tell Niall to stop smiling. He smiles wider, but there is panic in his eyes. NIALL loses 10 HP.' },
  { damage: 10, enemyTurns: 3, message: 'You tell Niall off for leaving his socks on your couch. Niall puts on the movie Doom. NIALL loses 10 HP.' },
  { damage: 0, knockout: true, enemyTurns: 1, message: 'You put Portuguese hot sauce on his food. Niall passes out. YOU WIN!' },
];

export const NIALL_ATTACKS: readonly NiallAttack[] = [
  { damage: 10, message: 'Niall uses every one of your pans to cook. How are you going to clean all of this? PLAYER loses 10 HP.' },
  { damage: 10, fomo: true, message: '“We got a game set up for you!” You get FOMO. PLAYER loses 10 HP.' },
  { damage: 10, message: 'Niall releases Tallulah on you. PLAYER loses 10 HP.' },
  { damage: 10, message: 'Niall orders everything off the menu. You are not even hungry! PLAYER loses 10 HP.' },
  { damage: 10, message: 'You come to Niall’s house even though he is busy. He walks you to the park. PLAYER loses 10 HP.' },
  { damage: 10, message: 'Niall makes a weird hay fever noise. PLAYER loses 10 HP.' },
  { damage: 10, message: 'Niall uses HEADBUTT. You are trying to have a civil conversation! PLAYER loses 10 HP.' },
  { damage: 10, message: 'Niall uses every one of your pots to cook. How are you going to clean all of this?! PLAYER loses 10 HP.' },
  { damage: 0, selfDamage: 10, message: 'Niall opens a RED STRIPE and poisons himself. NIALL loses 10 HP.' },
  { damage: 0, knockout: true, message: 'Niall challenges you to drink Buckfast. You pass out. YOU LOSE!' },
];

const clamp = (value: number, maximum: number) => Math.max(0, Math.min(maximum, value));

export class NiallBattle {
  playerHp: number;
  niallHp = NIALL_MAX_HP;
  hasFomo = false;
  battleOver = false;
  waitingForNiall = false;
  healthItemUsed = false;
  playerAttackIndex = 0;
  niallAttackIndex = 0;
  remainingEnemyTurns = 0;

  constructor(playerHealthFraction = 1) {
    this.playerHp = clamp(Math.round(PLAYER_MAX_HP * playerHealthFraction), PLAYER_MAX_HP);
  }

  get canAct(): boolean {
    return !this.battleOver && !this.waitingForNiall && this.playerHp > 0 && this.niallHp > 0;
  }

  get nextPlayerAttack(): PlayerAttack {
    return PLAYER_ATTACKS[Math.min(this.playerAttackIndex, PLAYER_ATTACKS.length - 1)]!;
  }

  damageNiall(amount: number): void {
    this.niallHp = clamp(this.niallHp - amount, NIALL_MAX_HP);
  }

  useHealthItem(): number {
    if (!this.canAct || this.healthItemUsed || this.playerHp === PLAYER_MAX_HP) return 0;
    const previousHp = this.playerHp;
    this.playerHp = clamp(this.playerHp + HEALTH_ITEM_HP, PLAYER_MAX_HP);
    this.healthItemUsed = true;
    return this.playerHp - previousHp;
  }

  takePlayerTurn(attack: boolean): PlayerAttack | null {
    if (!this.canAct) return null;
    const move = this.nextPlayerAttack;
    if (attack) this.damageNiall(move.knockout ? this.niallHp : move.damage);
    this.playerAttackIndex += 1;
    this.remainingEnemyTurns = move.enemyTurns;
    this.waitingForNiall = this.niallHp > 0;
    return move;
  }

  takeNiallTurn(): NiallAttack | null {
    if (this.battleOver || !this.waitingForNiall || this.playerHp <= 0 || this.niallHp <= 0) return null;
    const attack = NIALL_ATTACKS[Math.min(this.niallAttackIndex, NIALL_ATTACKS.length - 1)]!;
    this.niallAttackIndex += 1;
    this.remainingEnemyTurns -= 1;
    this.waitingForNiall = this.remainingEnemyTurns > 0;
    this.playerHp = clamp(this.playerHp - (attack.knockout ? this.playerHp : attack.damage), PLAYER_MAX_HP);
    this.damageNiall(attack.selfDamage ?? 0);
    if (attack.fomo) this.hasFomo = true;
    return attack;
  }

  finish(): void {
    this.battleOver = true;
    this.waitingForNiall = false;
    this.remainingEnemyTurns = 0;
  }
}
