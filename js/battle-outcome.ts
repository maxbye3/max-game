import type { NiallQuestState } from './world-state.js';

export type BattleOutcome = 'victory' | 'defeat' | 'escape';

export interface BattleResult {
  readonly message: string;
  readonly linkLabel: string;
  readonly href: string;
  readonly niallQuestState?: NiallQuestState;
}

const RESULTS: Record<BattleOutcome, BattleResult> = {
  victory: {
    message: "Alright, I'll walk you to the bus",
    linkLabel: 'Walk to the bus',
    href: '../index.html?niall=bus',
    niallQuestState: 'following',
  },
  defeat: {
    message: 'PLAYER fainted. Better luck next time.',
    linkLabel: 'Back to the map',
    href: '../index.html',
  },
  escape: {
    message: 'You tried to run away and you were... Successful!',
    linkLabel: 'Back to the map',
    href: '../index.html',
  },
};

export function getBattleResult(outcome: BattleOutcome): BattleResult {
  return RESULTS[outcome];
}
