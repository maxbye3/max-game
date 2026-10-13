import { reviews as savedReviews } from '../../data/goodreads-read.json';
import { ReviewGalleryController, type ReviewGalleryItem } from './review-gallery.js';

interface GoodreadsReview {
  readonly title: string;
  readonly author: string;
  readonly cover: string;
  readonly rating: number;
  readonly review: string;
  readonly url: string;
}

const toGalleryItem = (review: GoodreadsReview): ReviewGalleryItem => ({
  title: review.title,
  subtitle: review.author,
  image: review.cover,
  rating: review.rating,
  review: review.review,
  url: review.url,
});

export class GoodreadsReadingController {
  private readonly gallery: ReviewGalleryController;

  constructor(onClose: () => void) {
    this.gallery = new ReviewGalleryController(
      {
        panelId: 'goodreads-reading-panel',
        statusId: 'goodreads-reading-status',
        listId: 'goodreads-reading-list',
        closeButtonId: 'goodreads-reading-close',
        lightboxId: 'reading-lightbox',
        imageId: 'reading-lightbox-image',
        titleId: 'reading-title',
        subtitleId: 'reading-author',
        ratingId: 'reading-rating',
        reviewId: 'reading-review',
        linkId: 'reading-review-link',
        counterId: 'reading-lightbox-counter',
        itemNoun: 'books',
        imageNoun: 'cover',
        emptyReview: 'No review yet.',
        linkLabel: 'Read on Goodreads ↗',
      },
      onClose,
      savedReviews.map(toGalleryItem),
      async (signal) => {
        if (window.location.protocol === 'file:') return null;
        try {
          const response = await fetch(`../data/goodreads-read.json?updated=${Date.now()}`, { cache: 'no-store', signal });
          if (!response.ok) throw new Error(`Feed returned ${response.status}`);
          const feed = await response.json() as { reviews: readonly GoodreadsReview[] };
          return feed.reviews.map(toGalleryItem);
        } catch {
          return null;
        }
      },
    );
  }

  isOpen(): boolean {
    return this.gallery.isOpen();
  }

  open(): void {
    this.gallery.open();
  }

  hide(): void {
    this.gallery.hide();
  }
}
