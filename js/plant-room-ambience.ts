export function setupInteriorAmbience(enabled: boolean, source: string): void {
  if (!enabled) return;

  const ambience = new Audio(source);
  ambience.loop = true;
  ambience.preload = 'auto';

  const start = (): void => {
    if (!ambience.paused) return;
    void ambience.play().catch(() => {
      // A browser may require the first movement or tap before it can begin.
    });
  };

  window.addEventListener('keydown', start);
  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('pagehide', () => ambience.pause(), { once: true });
  start();
}
