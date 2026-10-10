import { requireElement } from './elements.js';

export function createBattleOpening(appendLog: (message: string) => void) {
  const openingGrid = requireElement<HTMLElement>('#opening-grid');
  const actionGrid = requireElement<HTMLElement>('#move-grid');

  function playOpeningSequence(): void {
    appendLog('Niall wants to fight!');
    openingGrid.hidden = false;
    actionGrid.hidden = true;
  }

  function advanceOpeningSequence(): void {
    openingGrid.hidden = true;
    actionGrid.hidden = false;
    appendLog('What will PLAYER do?');
  }

  return { playOpeningSequence, advanceOpeningSequence };
}
