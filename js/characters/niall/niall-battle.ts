export interface NiallAttack {
  readonly damage: number;
  readonly selfDamage?: number;
  readonly fomo?: boolean;
  readonly passOut?: boolean;
  readonly message: string;
  readonly effectMessage: string;
}

export interface PlayerAttack {
  readonly damage: number;
  readonly message: string;
  readonly effectMessage: string;
  readonly victoryMessage?: string;
}

export const PLAYER_MAX_HP = 80;
export const NIALL_MAX_HP = 180;
export const HEALTH_ITEM_HP = 50;

export const PLAYER_ATTACKS: readonly PlayerAttack[] = [
  {
    damage: 10,
    message: 'You tell Niall your slightly fringe thoughts on North Korea after watching Godzilla.',
    effectMessage: 'Niall is enraged! NIALL loses 10 HP.',
  },
  {
    damage: 10,
    message: 'You tell Niall he cannot borrow your phone charger.',
    effectMessage: 'Niall begins to pace anxiously. NIALL loses 10 HP.',
  },
  {
    damage: 20,
    message: 'You tell Niall his pumpkin pie was too dry.',
    effectMessage: 'Niall begins smoking furiously. NIALL loses 20 HP.',
  },
  {
    damage: 10,
    message: 'You tell Niall to stop smiling.',
    effectMessage: 'He smiles wider, but there is panic in his eyes. NIALL loses 10 HP.',
  },
  {
    damage: 10,
    message: 'You tell Niall off for leaving his socks on your couch.',
    effectMessage: 'Niall puts on the movie Doom. NIALL loses 10 HP.',
  },
  {
    damage: 20,
    message: 'You put Portuguese hot sauce on his food.',
    effectMessage: 'Niall loses 20 HP.',
    victoryMessage: 'Niall passes out. YOU WIN!',
  },
];

export const NIALL_ATTACKS: readonly NiallAttack[] = [
  {
    damage: 8,
    message: 'Niall uses every one of your pans to cook.',
    effectMessage: 'How are you going to clean all of this? PLAYER loses 8 HP.',
  },
  {
    damage: 8,
    fomo: true,
    message: '“We got a game set up for you!”',
    effectMessage: 'You get FOMO. PLAYER loses 8 HP.',
  },
  { damage: 12, message: 'Niall releases Tallulah on you.', effectMessage: 'PLAYER loses 12 HP.' },
  {
    damage: 8,
    message: 'Niall orders everything off the menu.',
    effectMessage: 'You are not even hungry! PLAYER loses 8 HP.',
  },
  {
    damage: 10,
    message: 'You come to Niall’s house even though he is busy.',
    effectMessage: 'He walks you to the park. PLAYER loses 10 HP.',
  },
  { damage: 8, message: 'Niall makes a weird hay fever noise.', effectMessage: 'PLAYER loses 8 HP.' },
  {
    damage: 10,
    message: 'Niall uses HEADBUTT.',
    effectMessage: 'You are trying to have a civil conversation! PLAYER loses 10 HP.',
  },
  {
    damage: 6,
    message: 'Niall uses every one of your pots to cook.',
    effectMessage: 'How are you going to clean all of this?! PLAYER loses 6 HP.',
  },
  {
    damage: 0,
    selfDamage: 10,
    message: 'Niall opens a RED STRIPE.',
    effectMessage: 'Niall poisons himself. NIALL loses 10 HP.',
  },
  {
    damage: 40,
    passOut: true,
    message: 'Niall challenges you to drink Buckfast.',
    effectMessage: 'You pass out.',
  },
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
  private pendingPlayerTurn: { attack: boolean; move: PlayerAttack } | null = null;
  private pendingNiallAttack: NiallAttack | null = null;

  constructor(playerHealthFraction = 1) {
    this.playerHp = clamp(Math.round(PLAYER_MAX_HP * playerHealthFraction), PLAYER_MAX_HP);
  }

  get canAct(): boolean {
    return !this.battleOver && !this.waitingForNiall && !this.pendingPlayerTurn && !this.pendingNiallAttack && this.playerHp > 0 && this.niallHp > 0;
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
    this.pendingPlayerTurn = { attack, move };
    this.playerAttackIndex += 1;
    return move;
  }

  resolvePlayerTurn(): PlayerAttack | null {
    const pending = this.pendingPlayerTurn;
    if (!pending) return null;
    this.pendingPlayerTurn = null;
    if (pending.attack) this.damageNiall(pending.move.damage);
    this.waitingForNiall = this.niallHp > 0;
    return pending.move;
  }

  takeNiallTurn(): NiallAttack | null {
    if (
      this.battleOver || !this.waitingForNiall || this.pendingNiallAttack ||
      this.playerHp <= 0 || this.niallHp <= 0
    ) return null;
    const attack = NIALL_ATTACKS[Math.min(this.niallAttackIndex, NIALL_ATTACKS.length - 1)]!;
    this.pendingNiallAttack = attack;
    this.waitingForNiall = false;
    return attack;
  }

  resolveNiallTurn(): NiallAttack | null {
    const attack = this.pendingNiallAttack;
    if (!attack) return null;
    this.pendingNiallAttack = null;
    this.niallAttackIndex += 1;
    this.playerHp = clamp(this.playerHp - attack.damage, PLAYER_MAX_HP);
    this.damageNiall(attack.selfDamage ?? 0);
    if (attack.fomo) this.hasFomo = true;
    return attack;
  }

  finish(): void {
    this.battleOver = true;
    this.waitingForNiall = false;
    this.pendingPlayerTurn = null;
    this.pendingNiallAttack = null;
  }
}
