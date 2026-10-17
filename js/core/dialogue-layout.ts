/** Keep the speaker and Next button visible while long conversations scroll. */
export function setupDialoguePanel(panel: HTMLElement): void {
  const header = panel.querySelector<HTMLElement>('.npc-dialogue-header');
  if (!header || panel.querySelector('.npc-dialogue-content')) return;
  const next = panel.querySelector<HTMLButtonElement>('.npc-dialogue-next');
  const content = document.createElement('div');
  content.className = 'npc-dialogue-content';
  for (const child of Array.from(panel.children)) {
    if (child !== header && child !== next) content.append(child);
  }
  header.after(content);
  if (next) panel.append(next);

  // New lines, choices and reopened conversations always start at the top.
  new MutationObserver(mutations => {
    const changed = mutations.some(mutation => {
      if (mutation.type === 'attributes') return true;
      const element = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
      return element?.closest('.dialogue-line-row p, .npc-dialogue-question, .npc-dialogue-options');
    });
    if (changed) content.scrollTop = 0;
  }).observe(panel, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden'],
  });
}
