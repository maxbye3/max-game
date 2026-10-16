import { requireElement } from '../core/elements.js';
import { ContentRefresh } from '../core/content-refresh.js';

interface PhotoGalleryConfig {
  readonly panelId: string;
  readonly galleryId: string;
  readonly closeId: string;
  readonly lightboxId: string;
  readonly label: string;
  readonly dataPath: string;
}

export class PhotoGalleryController {
  private readonly panel: HTMLElement;
  private readonly gallery: HTMLElement;
  private readonly lightbox: HTMLDialogElement;
  private readonly image: HTMLImageElement;
  private readonly counter: HTMLElement;
  private readonly refresh: ContentRefresh;
  private sources: readonly string[];
  private pending: readonly string[] | null = null;
  private currentIndex = 0;

  constructor(
    private readonly config: PhotoGalleryConfig,
    private readonly onClose: () => void,
    initialSources: readonly string[],
  ) {
    this.sources = initialSources;
    this.panel = requireElement(`#${config.panelId}`);
    this.gallery = requireElement(`#${config.galleryId}`);
    this.lightbox = requireElement(`#${config.lightboxId}`);
    this.image = requireElement(`#${config.lightboxId}-image`);
    this.counter = requireElement(`#${config.lightboxId}-counter`);
    this.image.referrerPolicy = 'no-referrer';
    this.refresh = new ContentRefresh(async (signal) => {
      if (window.location.protocol === 'file:') return;
      const response = await fetch(`${config.dataPath}?updated=${Date.now()}`, { cache: 'no-store', signal });
      if (!response.ok) return;
      const data = await response.json() as { images?: unknown };
      if (signal.aborted || !this.isOpen() || !Array.isArray(data.images)
        || !data.images.every((source: unknown) => typeof source === 'string'
          && /^https:\/\/lh3\.googleusercontent\.com\//.test(source))) return;
      if (this.lightbox.open) this.pending = data.images;
      else this.updateSources(data.images);
    });
    this.buildThumbnails();
    requireElement(`#${config.closeId}`).addEventListener('click', () => this.closePanel());
    requireElement(`#${config.lightboxId}-close`).addEventListener('click', () => this.closeLightbox());
    requireElement(`#${config.lightboxId}-previous`).addEventListener('click', () => this.showImage(this.currentIndex - 1));
    requireElement(`#${config.lightboxId}-next`).addEventListener('click', () => this.showImage(this.currentIndex + 1));
    this.lightbox.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.closeLightbox();
    });
    this.lightbox.addEventListener('click', (event) => {
      if (event.target === this.lightbox) this.closeLightbox();
    });
    window.addEventListener('keydown', (event) => this.handleKeydown(event), { capture: true });
  }

  open(): void {
    this.panel.hidden = false;
    this.gallery.querySelector<HTMLButtonElement>('button')?.focus();
    this.refresh.start();
  }

  hide(): void {
    this.refresh.stop();
    this.panel.hidden = true;
    if (this.lightbox.open) this.lightbox.close();
    this.applyPending();
  }

  isOpen(): boolean {
    return !this.panel.hidden;
  }

  private updateSources(sources: readonly string[]): void {
    if (JSON.stringify(sources) === JSON.stringify(this.sources)) return;
    this.sources = sources;
    this.buildThumbnails();
  }

  private buildThumbnails(): void {
    const scrollTop = this.gallery.scrollTop;
    const thumbnails = this.sources.map((source, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `View ${this.config.label} image ${index + 1} full screen`);
      const image = document.createElement('img');
      image.src = `${source}=w480-h360-c`;
      image.alt = `${this.config.label} ${index + 1}`;
      image.loading = 'lazy';
      image.referrerPolicy = 'no-referrer';
      button.append(image);
      button.addEventListener('click', () => this.showImage(index));
      return button;
    });
    this.gallery.replaceChildren(...thumbnails);
    this.gallery.scrollTop = scrollTop;
  }

  private showImage(index: number): void {
    if (!this.sources.length) return;
    this.currentIndex = (index + this.sources.length) % this.sources.length;
    this.image.src = `${this.sources[this.currentIndex]!}=w1800-h1800`;
    this.image.alt = `${this.config.label} ${this.currentIndex + 1}`;
    this.counter.textContent = `${this.currentIndex + 1} / ${this.sources.length}`;
    if (!this.lightbox.open) this.lightbox.showModal();
  }

  private applyPending(): void {
    if (this.pending === null) return;
    this.updateSources(this.pending);
    this.pending = null;
  }

  private closeLightbox(): void {
    this.lightbox.close();
    this.applyPending();
    this.gallery.querySelectorAll<HTMLButtonElement>('button')[this.currentIndex]?.focus();
  }

  private closePanel(): void {
    this.hide();
    this.onClose();
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.isOpen()) return;
    if (this.lightbox.open && (event.code === 'ArrowLeft' || event.code === 'ArrowRight')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.showImage(this.currentIndex + (event.code === 'ArrowLeft' ? -1 : 1));
    } else if (event.code === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (this.lightbox.open) this.closeLightbox();
      else this.closePanel();
    }
  }
}
