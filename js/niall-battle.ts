export interface NiallAttack {
  readonly damage: number;
  readonly fomo?: boolean;
  readonly message: string;
}

export const PLAYER_MAX_HP = 100;
export const NIALL_MAX_HP = 120;

export const NIALL_ATTACKS: readonly NiallAttack[] = [
  { damage: 10, message: 'NIALL used HEADBUTT.' },
  { damage: 0, message: 'NIALL opened a RED STRIPE. It did nothing.' },
  { damage: 0, fomo: true, message: 'NIALL set up a game of SMASH. PLAYER got FOMO.' },
  { damage: 10, message: 'NIALL posted a food pic on WhatsApp.' },
  { damage: 10, message: 'TALLULAH attacked.' },
  { damage: 20, message: 'NIALL stayed at your house for two weeks.' },
];

const clamp = (value: number, maximum: number) => Math.max(0, Math.min(maximum, value));

export class NiallBattle {
  playerHp = PLAYER_MAX_HP;
  niallHp = NIALL_MAX_HP;
  fomoStacks = 0;
  battleOver = false;
  waitingForNiall = false;
  defending = false;

  get canAct(): boolean {
    return !this.battleOver && !this.waitingForNiall;
  }

  damageNiall(amount: number): void {
    this.niallHp = clamp(this.niallHp - amount, NIALL_MAX_HP);
  }

  healPlayer(amount: number): void {
    this.playerHp = clamp(this.playerHp + amount, PLAYER_MAX_HP);
  }

  queueNiallTurn(): void {
    this.waitingForNiall = true;
  }

  defend(): void {
    this.defending = true;
    this.queueNiallTurn();
  }

  applyNiallAttack(attack: NiallAttack): { damage: number; defended: boolean } {
    this.waitingForNiall = false;
    const damage = this.defending ? Math.floor(attack.damage / 2) : attack.damage;
    const defended = damage !== attack.damage;
    this.defending = false;
    if (attack.fomo) this.fomoStacks = Math.min(2, this.fomoStacks + 1);
    this.playerHp = clamp(this.playerHp - damage, PLAYER_MAX_HP);
    return { damage, defended };
  }

  applyFomoDamage(): number {
    const damage = this.fomoStacks * 10;
    this.playerHp = clamp(this.playerHp - damage, PLAYER_MAX_HP);
    return damage;
  }

  finish(): void {
    this.battleOver = true;
    this.waitingForNiall = false;
    this.defending = false;
  }
}

export function chooseNiallAttack(random = Math.random): NiallAttack {
  const index = Math.floor(random() * NIALL_ATTACKS.length);
  return NIALL_ATTACKS[index] ?? NIALL_ATTACKS[0]!;
}
