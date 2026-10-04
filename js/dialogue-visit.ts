const visitIndexes = new Map<string, number>();

/** Return this character's next dialogue line for this page session only. */
export function nextDialogueVisitIndex(characterId: string, lineCount: number): number {
  if (lineCount === 0) return 0;
  const index = (visitIndexes.get(characterId) ?? 0) % lineCount;
  visitIndexes.set(characterId, (index + 1) % lineCount);
  return index;
}
