import { reviews as savedReviews } from '../../data/letterboxd-reviews.json';
import { cacheLetterboxdReviews, fetchLatestLetterboxdReviews, readCachedLetterboxdReviews, type LetterboxdReview } from '../core/letterboxd-reviews.js';
import { ReviewGalleryController, type ReviewGalleryItem } from './review-gallery.js';

const toGalleryItem = (review: LetterboxdReview): ReviewGalleryItem => ({
  title: review.title,
  subtitle: review.year,
  image: review.poster,
  rating: review.rating,
  review: review.review,
  url: review.url,
});

const initialReviews = (): readonly ReviewGalleryItem[] => {
  const cached = readCachedLetterboxdReviews();
  return (cached ?? savedReviews).map(toGalleryItem);
};

export class LetterboxdReviewsController {
  private readonly gallery: ReviewGalleryController;

  constructor(onClose: () => void) {
    this.gallery = new ReviewGalleryController(
      {
        panelId: 'letterboxd-reviews-panel',
        statusId: 'letterboxd-reviews-status',
        listId: 'letterboxd-reviews-list',
        closeButtonId: 'letterboxd-reviews-close',
        lightboxId: 'movie-review-lightbox',
        imageId: 'movie-review-lightbox-image',
        titleId: 'movie-review-title',
        subtitleId: 'movie-review-year',
        ratingId: 'movie-review-rating',
        reviewId: 'movie-review-text',
        linkId: 'movie-review-link',
        counterId: 'movie-review-counter',
        itemNoun: 'movies',
        imageNoun: 'poster',
        emptyReview: 'No review yet.',
        linkLabel: 'Read on Letterboxd ↗',
      },
      onClose,
      initialReviews(),
      async (signal) => {
        const reviews = await fetchLatestLetterboxdReviews(`../data/letterboxd-reviews.json`, signal);
        if (reviews && !signal.aborted) cacheLetterboxdReviews(reviews);
        return reviews?.map(toGalleryItem) ?? null;
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
