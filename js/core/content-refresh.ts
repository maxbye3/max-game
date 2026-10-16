// Poll only while the owning gallery is open, and refresh after returning to the tab.
export class ContentRefresh {
  private timer: number | null = null;
  private request: AbortController | null = null;
  private readonly resume = (): void => {
    if (document.visibilityState !== 'hidden') void this.refresh();
  };

  constructor(private readonly load: (signal: AbortSignal) => Promise<void>) {}

  start(): void {
    this.stop();
    this.timer = window.setInterval(this.resume, 60_000);
    window.addEventListener('focus', this.resume);
    document.addEventListener('visibilitychange', this.resume);
    void this.refresh();
  }

  stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    window.removeEventListener('focus', this.resume);
    document.removeEventListener('visibilitychange', this.resume);
    this.request?.abort();
    this.request = null;
  }

  private async refresh(): Promise<void> {
    if (this.request) return;
    const request = new AbortController();
    this.request = request;
    const timeout = window.setTimeout(() => request.abort(), 15_000);
    try {
      await this.load(request.signal);
    } catch {
      // Keep the last working content during outages and retry on the next tick.
    } finally {
      window.clearTimeout(timeout);
      if (this.request === request) this.request = null;
    }
  }
}
