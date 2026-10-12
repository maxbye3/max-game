export const ANDY_POWER_DURATION = 10_000;
export const ANDY_POWER_REVEAL = 'For 10 seconds, you became a supercharged medieval editor: you raced through a living manuscript while the world slowed down, swept nearby characters into waves of red-ink corrections, and carried a giant quill through a storm of cashews. Conversations gained grammar corrections, history facts, and your cashew sign-off.';

const HISTORICAL_FACTS = [
  'Simon de Montfort summoned the 1265 parliament that included representatives from towns as well as nobles and clergy.',
  'Simon de Montfort led a rebellion against Henry III and was killed at the Battle of Evesham in 1265.',
  'Louis the Pious was Charlemagne’s son and succeeded him as emperor in 814.',
  'Louis the Pious issued the Ordinance of 817 to plan the division of his empire among his sons while preserving imperial unity.',
] as const;

let powerStartsAt = Infinity;
let powerEndsAt = 0;
let factIndex = 0;
let replyObserver: MutationObserver | null = null;

export function activateAndyPower(now = performance.now()): void {
  powerStartsAt = now;
  powerEndsAt = now + ANDY_POWER_DURATION;
  factIndex = 0;
}

export function andyPowerSecondsLeft(now = performance.now()): number {
  return Math.max(0, (powerEndsAt - now) / 1000);
}

export function isAndyPowerActive(now = performance.now()): boolean {
  return now >= powerStartsAt && now < powerEndsAt;
}

export function andyPowerElapsed(now: number): number {
  return Math.max(0, now - powerStartsAt);
}

export function andyMovementMultiplier(now = performance.now()): number {
  return isAndyPowerActive(now) ? 1.7 : 1;
}

export function andyWorldDeltaTime(deltaTime: number, now: number): number {
  const overlap = Math.max(0, Math.min(now, powerEndsAt) - Math.max(now - deltaTime * 1000, powerStartsAt)) / 1000;
  return deltaTime - overlap * 0.7;
}

function grammarNote(line: string): string {
  const corrections: readonly [RegExp, string][] = [
    [/\b(me and Max)\b/gi, 'Max and I'],
    [/\bwould of\b/gi, 'would have'],
    [/\bcould of\b/gi, 'could have'],
    [/\bshould of\b/gi, 'should have'],
    [/\bI seen\b/gi, 'I saw'],
    [/\bI done\b/gi, 'I did'],
    [/\byou was\b/gi, 'you were'],
    [/\b(we|they) was\b/gi, '$1 were'],
  ];
  const corrected = corrections.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    line,
  );
  if (corrected !== line) return `Tiny grammar correction: “${corrected}” (rather than “${line}”).`;
  return 'Tiny grammar note: the sentence is sound, but give its final punctuation a quick proofread.';
}

export function createAndyReply(line: string): string {
  const fact = HISTORICAL_FACTS[factIndex % HISTORICAL_FACTS.length] ?? HISTORICAL_FACTS[0];
  factIndex += 1;
  return `Max: ${grammarNote(line)} ${fact} Those were some weird cashews!`;
}

function activeDialogue(): { readonly section: HTMLElement; readonly speaker: string; readonly line: string; readonly lineElement: HTMLElement } | null {
  const candidates = [
    { section: document.querySelector<HTMLElement>('#npc-dialogue'), speaker: '#npc-speaker', line: '#npc-dialogue-line' },
    { section: document.querySelector<HTMLElement>('#noel-dialogue'), speaker: '#noel-speaker', line: '#noel-dialogue-line' },
    { section: document.querySelector<HTMLElement>('#niall-dialogue'), speaker: 'h2', line: '#niall-dialogue-line' },
  ];
  for (const candidate of candidates) {
    if (!candidate.section || candidate.section.hidden) continue;
    const speaker = candidate.section.querySelector<HTMLElement>(candidate.speaker)?.textContent?.trim() ?? '';
    const lineElement = candidate.section.querySelector<HTMLElement>(candidate.line);
    const line = lineElement?.textContent?.trim() ?? '';
    if (speaker && line && lineElement) return { section: candidate.section, speaker, line, lineElement };
  }
  return null;
}

/** Add the powered-up reply when a new conversation starts during the activation window. */
export function addAndyDialogueReply(): void {
  replyObserver?.disconnect();
  replyObserver = null;
  document.querySelectorAll('.andy-power-reply').forEach((reply) => reply.remove());
  if (!isAndyPowerActive()) return;
  queueMicrotask(() => {
    if (!isAndyPowerActive()) return;
    const conversation = activeDialogue();
    if (!conversation) return;

    let reply = conversation.section.querySelector<HTMLElement>('.andy-power-reply');
    if (!reply) {
      reply = document.createElement('p');
      reply.className = 'andy-power-reply';
      const row = conversation.lineElement.closest('.dialogue-line-row');
      if (row) row.after(reply);
      else conversation.lineElement.after(reply);
    }

    reply.textContent = createAndyReply(conversation.line);
    reply.hidden = false;
    const displayedReply = reply;
    const observer = new MutationObserver(() => {
      if (!conversation.section.hidden && conversation.lineElement.textContent?.trim() === conversation.line) return;
      displayedReply.remove();
      observer.disconnect();
      if (replyObserver === observer) replyObserver = null;
    });
    observer.observe(conversation.lineElement, { childList: true, characterData: true, subtree: true });
    observer.observe(conversation.section, { attributes: true, attributeFilter: ['hidden'] });
    replyObserver = observer;
  });
}
