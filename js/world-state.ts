import { readStorage, writeStorage } from './storage.js';

export type NiallQuestState = 'hostile' | 'following' | 'busStop';

const NIALL_QUEST_STATE_KEY = 'max-game:niall-quest-state';
const LEGACY_NIALL_FIGHT_COMPLETE_KEY = 'max-game:niall-fight-complete';
const LEGACY_NIALL_AT_BUS_STOP_KEY = 'max-game:niall-at-bus-stop';

function isNiallQuestState(value: string | null): value is NiallQuestState {
  return value === 'hostile' || value === 'following' || value === 'busStop';
}

export function getNiallQuestState(): NiallQuestState {
  const storedState = readStorage(NIALL_QUEST_STATE_KEY);
  if (isNiallQuestState(storedState)) return storedState;

  // Preserve progress made before the quest was represented by one canonical state.
  if (readStorage(LEGACY_NIALL_AT_BUS_STOP_KEY) === 'true') return 'busStop';
  if (readStorage(LEGACY_NIALL_FIGHT_COMPLETE_KEY) === 'true') return 'following';
  return 'hostile';
}

export function setNiallQuestState(state: NiallQuestState): void {
  writeStorage(NIALL_QUEST_STATE_KEY, state);
}
