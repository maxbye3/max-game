import { requireElement } from '../core/dom.js';

export interface ReviewGalleryItem {
  readonly title: string;
  readonly subtitle: string;
  readonly image: string;
  readonly rating: number;
  readonly review: string;
  readonly url: string;
}

interface ReviewGalleryConfig {
  readonly panelId: string;
  readonly statusId: string;
  readonly listId: string;
  readonly closeButtonId: string;
  readonly lightboxId: string;
  readonly imageId: string;
  readonly titleId: string;
  readonly subtitleId: string;
  readonly ratingId: string;
  readonly reviewId: string;
  readonly linkId: string;
  readonly counterId: string;
  readonly itemNoun: string;
  readonly imageNoun: string;
  readonly emptyReview: string;
  readonly linkLabel: string;
}

export class ReviewGalleryController {
  private readonly panel: HTMLElement;
  private readonly status: HTMLElement;
  private readonly list: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly lightbox: HTMLDialogElement;
  private readonly image: HTMLImageElement;
  private readonly title: HTMLElement;
  private readonly subtitle: HTMLElement;
  private readonly rating: HTMLElement;
  private readonly review: HTMLElement;
  private readonly link: HTMLAnchorElement;
  private readonly counter: HTMLElement;
  private reviews: readonly ReviewGalleryItem[] = [];
  private currentIndex = 0;
  private request: AbortController | null = null;

  constructor(
    private readonly config: ReviewGalleryConfig,
    private readonly onClose: () => void,
    private readonly initialReviews: readonly ReviewGalleryItem[],
    private readonly loadLatest: (signal: AbortSignal) => Promise<readonly ReviewGalleryItem[] | null>,
  ) {
    this.panel = requireElement<HTMLElement>(`#${config.panelId}`);
    this.status = requireElement<HTMLElement>(`#${config.statusId}`);
    this.list = requireElement<HTMLElement>(`#${config.listId}`);
    this.closeButton = requireElement<HTMLButtonElement>(`#${config.closeButtonId}`);
    this.lightbox = requireElement<HTMLDialogElement>(`#${config.lightboxId}`);
    this.image = requireElement<HTMLImageElement>(`#${config.imageId}`);
    this.title = requireElement<HTMLElement>(`#${config.titleId}`);
    this.subtitle = requireElement<HTMLElement>(`#${config.subtitleId}`);
    this.rating = requireElement<HTMLElement>(`#${config.ratingId}`);
    this.review = requireElement<HTMLElement>(`#${config.reviewId}`);
    this.link = requireElement<HTMLAnchorElement>(`#${config.linkId}`);
    this.counter = requireElement<HTMLElement>(`#${config.counterId}`);
    this.closeButton.addEventListener('click', () => this.closePanel());
    requireElement<HTMLButtonElement>(`#${config.lightboxId}-close`).addEventListener('click', () => this.closeLightbox());
    requireElement<HTMLButtonElement>(`#${config.lightboxId}-previous`).addEventListener('click', () => this.showReview(this.currentIndex - 1));
    requireElement<HTMLButtonElement>(`#${config.lightboxId}-next`).addEventListener('click', () => this.showReview(this.currentIndex + 1));
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
        this.showReview(this.currentIndex + (event.code === 'ArrowLeft' ? -1 : 1));
      }
    }, { capture: true });
  }

  isOpen(): boolean {
    return !this.panel.hidden;
  }

  open(reviews = this.initialReviews): void {
    this.panel.hidden = false;
    this.closeButton.focus();
    void this.loadLatestReviews(reviews);
  }

  hide(): void {
    this.request?.abort();
    this.panel.hidden = true;
    if (this.lightbox.open) this.lightbox.close();
  }

  private async loadLatestReviews(reviews: readonly ReviewGalleryItem[]): Promise<void> {
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    this.showReviews(reviews);
    const latest = await this.loadLatest(request.signal);
    if (!latest || request.signal.aborted || !this.isOpen() || this.lightbox.open) return;
    this.showReviews(latest);
  }

  private showReviews(reviews: readonly ReviewGalleryItem[]): void {
    const thumbnails = reviews.map((review, index) => this.createThumbnail(review, index));
    this.reviews = reviews;
    this.list.replaceChildren(...thumbnails);
    this.status.textContent = `No ${this.config.itemNoun} to show yet. Try the full ${this.config.itemNoun} profile below.`;
    this.status.hidden = reviews.length > 0;
    this.list.scrollTop = 0;
  }

  private createThumbnail(review: ReviewGalleryItem, index: number): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `View ${review.title}${review.subtitle ? `, ${review.subtitle}` : ''}, rating and review`);
    const image = document.createElement('img');
    image.src = review.image;
    image.alt = `${review.title} ${this.config.imageNoun}`;
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    const title = document.createElement('span');
    title.textContent = review.title;
    button.append(image, title);
    button.addEventListener('click', () => this.showReview(index));
    return button;
  }

  private showReview(index: number): void {
    if (!this.reviews.length) return;
    this.currentIndex = (index + this.reviews.length) % this.reviews.length;
    const item = this.reviews[this.currentIndex]!;
    this.image.src = item.image;
    this.image.alt = `${item.title} ${this.config.imageNoun}`;
    this.title.textContent = item.title;
    this.subtitle.textContent = item.subtitle;
    const rating = Math.max(0, Math.min(5, Math.round(item.rating * 2) / 2));
    const wholeStars = Math.floor(rating);
    this.rating.textContent = rating ? '★'.repeat(wholeStars) + (rating % 1 ? '½' : '') + '☆'.repeat(5 - Math.ceil(rating)) : 'Not rated yet';
    this.rating.setAttribute('aria-label', rating ? `${rating} out of 5 stars` : 'Not rated yet');
    this.review.textContent = item.review || this.config.emptyReview;
    this.link.href = item.url;
    this.link.textContent = this.config.linkLabel;
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
