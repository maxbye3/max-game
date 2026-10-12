/** Suspend simulation while hidden; discard elapsed time on return. */
export function startGameLoop(frame: FrameRequestCallback, resetClock: () => void): () => void {
  performance.mark('max-game:ready');
  let stopped = false;
  let request = 0;
  const tick: FrameRequestCallback = (time) => {
    request = 0;
    if (stopped || document.hidden) return;
    frame(time);
    request = requestAnimationFrame(tick);
  };
  const visibilityChanged = (): void => {
    cancelAnimationFrame(request);
    request = 0;
    resetClock();
    if (!stopped && !document.hidden) request = requestAnimationFrame(tick);
  };
  document.addEventListener('visibilitychange', visibilityChanged);
  if (!document.hidden) request = requestAnimationFrame(tick);
  return () => {
    stopped = true;
    cancelAnimationFrame(request);
    document.removeEventListener('visibilitychange', visibilityChanged);
  };
}
