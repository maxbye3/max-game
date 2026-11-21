import { inessaRussianLine, isInessaPowerActive } from './inessa-power.js';

interface ChangedLine {
  readonly original: readonly ChildNode[];
  readonly russian: HTMLElement;
}
const changed = new Map<HTMLElement, ChangedLine>();

/** Preserve original nodes, including quest highlights and links, when the tea wears off. */
export function updateInessaDialogue(now: number): void {
  const active = isInessaPowerActive(now);
  for (const [line, record] of changed) {
    if (!active || !line.isConnected || line.firstChild !== record.russian) {
      if (line.firstChild === record.russian) line.replaceChildren(...record.original);
      changed.delete(line);
    }
  }
  if (!active) return;
  for (const line of document.querySelectorAll<HTMLElement>('.dialogue-line-row p, .npc-dialogue-question, .osh-prayer p')) {
    if (changed.has(line) || !line.textContent?.trim()) continue;
    const russian = document.createElement('span');
    russian.lang = 'ru';
    russian.className = 'inessa-russian';
    russian.textContent = inessaRussianLine(line.textContent);
    const original = Array.from(line.childNodes);
    const subtitle = document.createElement('small');
    subtitle.className = 'inessa-subtitle';
    subtitle.append(...original);
    line.append(russian, subtitle);
    changed.set(line, { original, russian });
  }
}
