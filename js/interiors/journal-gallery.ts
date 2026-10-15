import { requireElement } from '../core/dom.js';
import { JOURNAL_IMAGE_SOURCES } from './journal-image-sources.js';

const thumbnailSource = (source: string) => `${source}=w480-h360-c`;
const fullSource = (source: string) => `${source}=w1800-h1800`;

export class JournalGalleryController {
  private readonly panel = requireElement<HTMLElement>('#journal-gallery-panel');
  private readonly gallery = requireElement<HTMLElement>('#journal-gallery');
  private readonly lightbox = requireElement<HTMLDialogElement>('#journal-lightbox');
  private readonly lightboxImage = requireElement<HTMLImageElement>('#journal-lightbox-image');
  private readonly counter = requireElement<HTMLElement>('#journal-lightbox-counter');
  private currentIndex = 0;

  constructor(private readonly onClose: () => void) {
    JOURNAL_IMAGE_SOURCES.forEach((source, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `View journal image ${index + 1} full screen`);
      const image = document.createElement('img');
      image.src = thumbnailSource(source);
      image.alt = `Journal page ${index + 1}`;
      image.loading = 'lazy';
      image.referrerPolicy = 'no-referrer';
      button.append(image);
      button.addEventListener('click', () => this.showImage(index));
      this.gallery.append(button);
    });
    this.lightboxImage.referrerPolicy = 'no-referrer';
    requireElement<HTMLButtonElement>('#journal-gallery-close').addEventListener('click', () => this.closePanel());
    requireElement<HTMLButtonElement>('#journal-lightbox-close').addEventListener('click', () => this.closeLightbox());
    requireElement<HTMLButtonElement>('#journal-lightbox-previous').addEventListener('click', () => this.showImage(this.currentIndex - 1));
    requireElement<HTMLButtonElement>('#journal-lightbox-next').addEventListener('click', () => this.showImage(this.currentIndex + 1));
    this.lightbox.addEventListener('click', (event) => {
      if (event.target === this.lightbox) this.closeLightbox();
    });
    window.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  open(): void {
    this.panel.hidden = false;
    this.gallery.querySelector<HTMLButtonElement>('button')?.focus();
  }

  hide(): void {
    this.panel.hidden = true;
    if (this.lightbox.open) this.lightbox.close();
  }

  isOpen(): boolean {
    return !this.panel.hidden;
  }

  private showImage(index: number): void {
    this.currentIndex = (index + JOURNAL_IMAGE_SOURCES.length) % JOURNAL_IMAGE_SOURCES.length;
    this.lightboxImage.src = fullSource(JOURNAL_IMAGE_SOURCES[this.currentIndex]!);
    this.lightboxImage.alt = `Journal page ${this.currentIndex + 1}`;
    this.counter.textContent = `${this.currentIndex + 1} / ${JOURNAL_IMAGE_SOURCES.length}`;
    if (!this.lightbox.open) this.lightbox.showModal();
  }

  private closeLightbox(): void {
    this.lightbox.close();
    this.gallery.querySelectorAll<HTMLButtonElement>('button')[this.currentIndex]?.focus();
  }

  private closePanel(): void {
    this.hide();
    this.onClose();
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (this.lightbox.open && event.code === 'ArrowLeft') {
      event.preventDefault();
      this.showImage(this.currentIndex - 1);
    } else if (this.lightbox.open && event.code === 'ArrowRight') {
      event.preventDefault();
      this.showImage(this.currentIndex + 1);
    } else if (event.code === 'Escape' && this.lightbox.open) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.closeLightbox();
    } else if (event.code === 'Escape' && this.isOpen()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.closePanel();
    }
  }
}
