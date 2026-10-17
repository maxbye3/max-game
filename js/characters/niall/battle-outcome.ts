import type { NiallQuestState } from '../../core/world-state.js';

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
    message: "YOU LOSE! Alright, I'll walk you back to the bus.",
    linkLabel: 'Walk to the bus',
    href: '../index.html?niall=bus',
    niallQuestState: 'following',
  },
  escape: {
    message: "Alright, I'll walk you back to the bus.",
    linkLabel: 'Walk to the bus',
    href: '../index.html?niall=bus',
    niallQuestState: 'following',
  },
};

export function getBattleResult(outcome: BattleOutcome): BattleResult {
  return RESULTS[outcome];
}
