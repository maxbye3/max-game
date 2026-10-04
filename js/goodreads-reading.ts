import { requireElement } from './dom.js';
import { reviews as savedReviews } from '../data/goodreads-read.json';

interface GoodreadsReview {
  readonly title: string;
  readonly author: string;
  readonly cover: string;
  readonly rating: number;
  readonly review: string;
  readonly url: string;
}

export class GoodreadsReadingController {
  private readonly panel = requireElement<HTMLElement>('#goodreads-reading-panel');
  private readonly status = requireElement<HTMLElement>('#goodreads-reading-status');
  private readonly list = requireElement<HTMLElement>('#goodreads-reading-list');
  private readonly closeButton = requireElement<HTMLButtonElement>('#goodreads-reading-close');
  private readonly lightbox = requireElement<HTMLDialogElement>('#reading-lightbox');
  private readonly image = requireElement<HTMLImageElement>('#reading-lightbox-image');
  private readonly title = requireElement<HTMLElement>('#reading-title');
  private readonly author = requireElement<HTMLElement>('#reading-author');
  private readonly rating = requireElement<HTMLElement>('#reading-rating');
  private readonly review = requireElement<HTMLElement>('#reading-review');
  private readonly link = requireElement<HTMLAnchorElement>('#reading-review-link');
  private readonly counter = requireElement<HTMLElement>('#reading-lightbox-counter');
  private reviews: readonly GoodreadsReview[] = [];
  private currentIndex = 0;
  private request: AbortController | null = null;

  constructor(private readonly onClose: () => void) {
    this.closeButton.addEventListener('click', () => this.closePanel());
    requireElement<HTMLButtonElement>('#reading-lightbox-close').addEventListener('click', () => this.closeLightbox());
    requireElement<HTMLButtonElement>('#reading-lightbox-previous').addEventListener('click', () => this.showBook(this.currentIndex - 1));
    requireElement<HTMLButtonElement>('#reading-lightbox-next').addEventListener('click', () => this.showBook(this.currentIndex + 1));
    this.lightbox.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.closeLightbox();
    });
    this.lightbox.addEventListener('click', (event) => {
      if (event.target === this.lightbox) this.closeLightbox();
    });
    window.addEventListener('keydown', (event) => {
      if (!this.isOpen()) return;
      if (event.code === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (this.lightbox.open) this.closeLightbox();
        else this.closePanel();
      } else if (this.lightbox.open && (event.code === 'ArrowLeft' || event.code === 'ArrowRight')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.showBook(this.currentIndex + (event.code === 'ArrowLeft' ? -1 : 1));
      }
    }, { capture: true });
  }

  isOpen(): boolean {
    return !this.panel.hidden;
  }

  open(): void {
    this.panel.hidden = false;
    this.closeButton.focus();
    void this.loadLatest();
  }

  hide(): void {
    this.request?.abort();
    this.panel.hidden = true;
    if (this.lightbox.open) this.lightbox.close();
  }

  private async loadLatest(): Promise<void> {
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    this.showReviews(savedReviews);
    if (window.location.protocol === 'file:') return;
    try {
      const response = await fetch(`../data/goodreads-read.json?updated=${Date.now()}`, { cache: 'no-store', signal: request.signal });
      if (!response.ok) throw new Error(`Feed returned ${response.status}`);
      const feed = await response.json() as { reviews: readonly GoodreadsReview[] };
      if (request.signal.aborted || this.lightbox.open) return;
      this.showReviews(feed.reviews);
    } catch {
      // The bundled shelf stays available when the separate feed cannot load.
    }
  }

  private showReviews(reviews: readonly GoodreadsReview[]): void {
    const thumbnails = reviews.map((review, index) => this.createThumbnail(review, index));
    this.reviews = reviews;
    this.list.replaceChildren(...thumbnails);
    this.status.textContent = 'No books to show yet. Try the full Goodreads shelf below.';
    this.status.hidden = reviews.length > 0;
    this.list.scrollTop = 0;
  }

  private createThumbnail(review: GoodreadsReview, index: number): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `View ${review.title} by ${review.author}, rating and review`);
    const cover = document.createElement('img');
    cover.src = review.cover;
    cover.alt = `${review.title} cover`;
    cover.loading = 'lazy';
    cover.referrerPolicy = 'no-referrer';
    const title = document.createElement('span');
    title.textContent = review.title;
    button.append(cover, title);
    button.addEventListener('click', () => this.showBook(index));
    return button;
  }

  private showBook(index: number): void {
    if (!this.reviews.length) return;
    this.currentIndex = (index + this.reviews.length) % this.reviews.length;
    const book = this.reviews[this.currentIndex]!;
    this.image.src = book.cover;
    this.image.alt = `${book.title} cover`;
    this.title.textContent = book.title;
    this.author.textContent = book.author;
    const rating = Math.max(0, Math.min(5, Math.round(book.rating)));
    this.rating.textContent = rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : 'Not rated yet';
    this.rating.setAttribute('aria-label', rating ? `${rating} out of 5 stars` : 'Not rated yet');
    this.review.textContent = book.review || 'No review yet.';
    this.link.href = book.url;
    this.counter.textContent = `${this.currentIndex + 1} / ${this.reviews.length}`;
    if (!this.lightbox.open) this.lightbox.showModal();
    this.lightbox.scrollTop = 0;
  }

  private closeLightbox(): void {
    this.lightbox.close();
    this.list.querySelectorAll<HTMLButtonElement>('button')[this.currentIndex]?.focus();
  }

  private closePanel(): void {
    this.hide();
    this.onClose();
  }
}
